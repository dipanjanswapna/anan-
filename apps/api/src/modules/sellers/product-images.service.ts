import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHash, createHmac, randomUUID } from "node:crypto";
import { PrismaService } from "../../database/prisma.service";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}
function hmac(key: Buffer | string, value: string) {
  return createHmac("sha256", key).update(value).digest();
}
function encodeKey(key: string) {
  return key.split("/").map(encodeURIComponent).join("/");
}
function canonicalQuery(values: Record<string, string>) {
  return Object.entries(values)
    .map(([key, value]) => [encodeURIComponent(key), encodeURIComponent(value)] as const)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => key + "=" + value)
    .join("&");
}

@Injectable()
export class ProductImagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private storageConfig() {
    const region = this.config.get<string>("AWS_REGION");
    const bucket = this.config.get<string>("AWS_S3_BUCKET");
    const accessKeyId = this.config.get<string>("AWS_ACCESS_KEY_ID");
    const secretAccessKey = this.config.get<string>("AWS_SECRET_ACCESS_KEY");
    const sessionToken = this.config.get<string>("AWS_SESSION_TOKEN");
    if (!region || !bucket || !accessKeyId || !secretAccessKey) {
      throw new ServiceUnavailableException("Product image storage is not configured. Set the AWS S3 media environment variables.");
    }
    const host = `${bucket}.s3.${region}.amazonaws.com`;
    const publicBaseUrl = (this.config.get<string>("MEDIA_PUBLIC_BASE_URL") || `https://${host}`).replace(/\/$/, "");
    return { region, bucket, accessKeyId, secretAccessKey, sessionToken, host, publicBaseUrl };
  }

  private async sellerContext(authorization?: string) {
    const match = authorization?.match(/^Bearer\s+([A-Za-z0-9_-]{40,})$/i);
    if (!match) throw new UnauthorizedException("An approved seller session is required.");
    const tokenHash = sha256(match[1]);
    const session = await this.prisma.customerSession.findFirst({
      where: {
        tokenHash, revokedAt: null, expiresAt: { gt: new Date() },
        user: { role: "SELLER", isActive: true, sellerProfile: { is: { status: "APPROVED" } } },
      },
      select: { id: true, user: { select: { sellerProfile: { select: { id: true } } } } },
    });
    const seller = session?.user.sellerProfile;
    if (!seller) throw new UnauthorizedException("An approved seller session is required.");
    await this.prisma.customerSession.updateMany({ where: { id: session.id, revokedAt: null }, data: { lastUsedAt: new Date() } });
    return seller;
  }

  private async adminContext(authorization?: string) {
    const match = authorization?.match(/^Bearer\s+([A-Za-z0-9_-]{40,})$/i);
    if (!match) throw new UnauthorizedException("An administrator session is required.");
    const tokenHash = sha256(match[1]);
    const session = await this.prisma.customerSession.findFirst({
      where: { tokenHash, revokedAt: null, expiresAt: { gt: new Date() }, user: { isActive: true, role: { in: ["ADMIN", "STAFF"] } } },
      select: { id: true, userId: true, user: { select: { role: true } } },
    });
    if (!session) throw new UnauthorizedException("An active administrator session is required.");
    if (session.user.role !== "ADMIN") {
      const permission = await this.prisma.adminPermission.findUnique({
        where: { userId_permission: { userId: session.userId, permission: "PRODUCT_MEDIA_REVIEW" } },
        select: { id: true },
      });
      if (!permission) throw new ForbiddenException("You do not have permission to review product images.");
    }
    await this.prisma.customerSession.updateMany({ where: { id: session.id, revokedAt: null }, data: { lastUsedAt: new Date() } });
    return { userId: session.userId };
  }

  private signKey(secret: string, date: string, region: string) {
    const dateKey = hmac("AWS4" + secret, date);
    const regionKey = hmac(dateKey, region);
    const serviceKey = hmac(regionKey, "s3");
    return hmac(serviceKey, "aws4_request");
  }

  private createUploadUrl(storageKey: string, contentType: string) {
    const cfg = this.storageConfig();
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
    const dateStamp = amzDate.slice(0, 8);
    const scope = `${dateStamp}/${cfg.region}/s3/aws4_request`;
    const query = canonicalQuery({
      "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
      "X-Amz-Credential": `${cfg.accessKeyId}/${scope}`,
      "X-Amz-Date": amzDate,
      "X-Amz-Expires": "300",
      "X-Amz-SignedHeaders": "host",
      ...(cfg.sessionToken ? { "X-Amz-Security-Token": cfg.sessionToken } : {}),
    });
    const canonicalRequest = ["PUT", `/${encodeKey(storageKey)}`, query, `host:${cfg.host}\n`, "host", "UNSIGNED-PAYLOAD"].join("\n");
    const stringToSign = ["AWS4-HMAC-SHA256", amzDate, scope, sha256(canonicalRequest)].join("\n");
    const signature = createHmac("sha256", this.signKey(cfg.secretAccessKey, dateStamp, cfg.region)).update(stringToSign).digest("hex");
    return {
      uploadUrl: `https://${cfg.host}/${encodeKey(storageKey)}?${query}&X-Amz-Signature=${signature}`,
      expiresInSeconds: 300,
      publicUrl: `${cfg.publicBaseUrl}/${encodeKey(storageKey)}`,
    };
  }

  private async verifyUploadedObject(storageKey: string, expectedType: string, expectedSize: number) {
    const cfg = this.storageConfig();
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
    const dateStamp = amzDate.slice(0, 8);
    const payloadHash = sha256("");
    const canonicalHeaders = `host:${cfg.host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n${cfg.sessionToken ? `x-amz-security-token:${cfg.sessionToken}\n` : ""}`;
    const signedHeaders = `host;x-amz-content-sha256;x-amz-date${cfg.sessionToken ? ";x-amz-security-token" : ""}`;
    const canonicalRequest = ["HEAD", `/${encodeKey(storageKey)}`, "", canonicalHeaders, signedHeaders, payloadHash].join("\n");
    const scope = `${dateStamp}/${cfg.region}/s3/aws4_request`;
    const stringToSign = ["AWS4-HMAC-SHA256", amzDate, scope, sha256(canonicalRequest)].join("\n");
    const signature = createHmac("sha256", this.signKey(cfg.secretAccessKey, dateStamp, cfg.region)).update(stringToSign).digest("hex");
    const authorization = `AWS4-HMAC-SHA256 Credential=${cfg.accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
    let response: Response;
    try {
      response = await fetch(`https://${cfg.host}/${encodeKey(storageKey)}`, {
        method: "HEAD",
        headers: { Authorization: authorization, "x-amz-date": amzDate, "x-amz-content-sha256": payloadHash, ...(cfg.sessionToken ? { "x-amz-security-token": cfg.sessionToken } : {}) },
        signal: AbortSignal.timeout(8000),
      });
    } catch {
      throw new ServiceUnavailableException("Could not verify the uploaded image with object storage.");
    }
    if (!response.ok) throw new ConflictException("The image upload was not found or could not be verified.");
    const actualType = response.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
    const actualSize = Number(response.headers.get("content-length"));
    if (actualType !== expectedType || actualSize !== expectedSize || actualSize > MAX_IMAGE_BYTES) {
      throw new ConflictException("Uploaded image type or size does not match the upload request.");
    }
  }

  async createUpload(authorization: string | undefined, productId: string, input: { contentType: string; sizeBytes: number; altText: string }) {
    const seller = await this.sellerContext(authorization);
    if (!input || !ALLOWED_TYPES.has(input.contentType) || !Number.isInteger(input.sizeBytes) || input.sizeBytes < 1 || input.sizeBytes > MAX_IMAGE_BYTES) {
      throw new ConflictException("Use a JPEG, PNG, WebP or AVIF image up to 10 MB.");
    }
    const altText = typeof input.altText === "string" ? input.altText.trim() : "";
    if (!altText || altText.length > 180) throw new ConflictException("Image alt text is required and must be 180 characters or fewer.");
    const product = await this.prisma.product.findFirst({
      where: { id: productId, sellerId: seller.id },
      select: { id: true },
    });
    if (!product) throw new NotFoundException("Product not found in your store.");
    const storageKey = `products/${seller.id}/${product.id}/${randomUUID()}.${EXTENSIONS[input.contentType]}`;
    const signed = this.createUploadUrl(storageKey, input.contentType);
    return { storageKey, ...signed, contentType: input.contentType, sizeBytes: input.sizeBytes, altText };
  }

  async completeUpload(authorization: string | undefined, productId: string, input: { storageKey: string; contentType: string; sizeBytes: number; altText: string }) {
    const seller = await this.sellerContext(authorization);
    const keyPrefix = `products/${seller.id}/${productId}/`;
    if (!input || typeof input.storageKey !== "string" || !input.storageKey.startsWith(keyPrefix) || !/^[0-9a-f-]{36}[.](jpg|png|webp|avif)$/.test(input.storageKey.slice(keyPrefix.length))) {
      throw new ConflictException("Invalid image upload key.");
    }
    if (!ALLOWED_TYPES.has(input.contentType) || !Number.isInteger(input.sizeBytes) || input.sizeBytes < 1 || input.sizeBytes > MAX_IMAGE_BYTES) {
      throw new ConflictException("Invalid image metadata.");
    }
    const altText = typeof input.altText === "string" ? input.altText.trim() : "";
    if (!altText || altText.length > 180) throw new ConflictException("Image alt text is required and must be 180 characters or fewer.");
    const product = await this.prisma.product.findFirst({ where: { id: productId, sellerId: seller.id }, select: { id: true } });
    if (!product) throw new NotFoundException("Product not found in your store.");
    const existing = await this.prisma.productImage.findUnique({ where: { storageKey: input.storageKey } });
    if (existing) {
      if (existing.productId !== productId) throw new ConflictException("This image key is already associated with another product.");
      return { image: { ...existing, publicUrl: this.publicUrl(existing.storageKey) }, message: "Image upload already registered." };
    }
    await this.verifyUploadedObject(input.storageKey, input.contentType, input.sizeBytes);
    const image = await this.prisma.$transaction(async (tx) => {
      const count = await tx.productImage.count({ where: { productId } });
      if (count >= 8) throw new ConflictException("A product can have at most 8 images.");
      return tx.productImage.create({
        data: { productId, storageKey: input.storageKey, contentType: input.contentType, sizeBytes: input.sizeBytes, altText, sortOrder: count },
      });
    }, { isolationLevel: "Serializable" });
    return { image: { ...image, publicUrl: this.publicUrl(image.storageKey) }, message: "Image uploaded and submitted for admin review." };
  }

  private publicUrl(storageKey: string) {
    const cfg = this.storageConfig();
    return `${cfg.publicBaseUrl}/${encodeKey(storageKey)}`;
  }

  async listSellerImages(authorization: string | undefined, productId: string) {
    const seller = await this.sellerContext(authorization);
    const product = await this.prisma.product.findFirst({ where: { id: productId, sellerId: seller.id }, select: { id: true } });
    if (!product) throw new NotFoundException("Product not found in your store.");
    const images = await this.prisma.productImage.findMany({ where: { productId }, orderBy: { sortOrder: "asc" } });
    return { images: images.map((image) => ({ ...image, publicUrl: this.publicUrl(image.storageKey) })) };
  }

  async listForReview(authorization: string | undefined, status?: string) {
    await this.adminContext(authorization);
    const allowed = ["PENDING", "APPROVED", "REJECTED"];
    if (status && !allowed.includes(status)) throw new ConflictException("Invalid image status filter.");
    const images = await this.prisma.productImage.findMany({
      where: status ? { status: status as "PENDING" | "APPROVED" | "REJECTED" } : { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      take: 100,
      include: { product: { select: { id: true, nameEn: true, slug: true, seller: { select: { storeName: true, storeSlug: true } } } } },
    });
    return { images: images.map((image) => ({ ...image, publicUrl: this.publicUrl(image.storageKey) })) };
  }

  async review(authorization: string | undefined, imageId: string, input: { action: "APPROVE" | "REJECT"; notes?: string }) {
    const actor = await this.adminContext(authorization);
    if (!input || !["APPROVE", "REJECT"].includes(input.action)) throw new ConflictException("Choose approve or reject.");
    const notes = typeof input.notes === "string" ? input.notes.trim() : "";
    if (notes.length > 1000 || (input.action === "REJECT" && !notes)) throw new ConflictException("A rejection reason is required and must be 1,000 characters or fewer.");
    return this.prisma.$transaction(async (tx) => {
      const image = await tx.productImage.findUnique({ where: { id: imageId }, select: { id: true, productId: true, status: true } });
      if (!image) throw new NotFoundException("Product image not found.");
      if (image.status !== "PENDING") throw new ConflictException("This image has already been reviewed.");
      if (input.action === "APPROVE") {
        const primary = await tx.productImage.count({ where: { productId: image.productId, status: "APPROVED", isPrimary: true } });
        await tx.productImage.update({
          where: { id: image.id },
          data: { status: "APPROVED", isPrimary: primary === 0, reviewedAt: new Date(), reviewedByUserId: actor.userId, rejectionReason: null },
        });
      } else {
        await tx.productImage.update({
          where: { id: image.id },
          data: { status: "REJECTED", isPrimary: false, rejectionReason: notes, reviewedAt: new Date(), reviewedByUserId: actor.userId },
        });
      }
      await tx.adminAuditLog.create({
        data: { actorUserId: actor.userId, action: input.action === "APPROVE" ? "PRODUCT_IMAGE_APPROVED" : "PRODUCT_IMAGE_REJECTED", targetType: "PRODUCT_IMAGE", targetId: image.id, metadata: { productId: image.productId, notes: notes || null } },
      });
      return { id: image.id, status: input.action === "APPROVE" ? "APPROVED" : "REJECTED" };
    }, { isolationLevel: "Serializable" });
  }
}
