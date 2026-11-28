import { BadRequestException, ConflictException, Injectable, ServiceUnavailableException, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHash, createHmac, randomUUID } from "node:crypto";
import { PrismaService } from "../../database/prisma.service";

const IMAGE_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const VIDEO_TYPES: Record<string, string> = { "video/mp4": "mp4", "video/webm": "webm" };
const IMAGE_LIMIT = 10 * 1024 * 1024;
const VIDEO_LIMIT = 100 * 1024 * 1024;
const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");
const hmac = (key: Buffer | string, value: string) => createHmac("sha256", key).update(value).digest();
const encodeKey = (key: string) => key.split("/").map(encodeURIComponent).join("/");
const canonicalQuery = (values: Record<string, string>) => Object.entries(values)
  .map(([key, value]) => [encodeURIComponent(key), encodeURIComponent(value)] as const)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([key, value]) => key + "=" + value).join("&");

@Injectable()
export class SocialMediaStorageService {
  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService) {}

  private storage() {
    const region = this.config.get<string>("AWS_REGION");
    const bucket = this.config.get<string>("AWS_S3_BUCKET");
    const accessKeyId = this.config.get<string>("AWS_ACCESS_KEY_ID");
    const secretAccessKey = this.config.get<string>("AWS_SECRET_ACCESS_KEY");
    const sessionToken = this.config.get<string>("AWS_SESSION_TOKEN");
    if (!region || !bucket || !accessKeyId || !secretAccessKey) throw new ServiceUnavailableException("Social media storage is not configured.");
    const host = `${bucket}.s3.${region}.amazonaws.com`;
    const publicBaseUrl = (this.config.get<string>("MEDIA_PUBLIC_BASE_URL") || `https://${host}`).replace(/\/$/, "");
    return { region, bucket, accessKeyId, secretAccessKey, sessionToken, host, publicBaseUrl };
  }

  private async creator(authorization?: string) {
    const match = authorization?.match(/^Bearer\s+([A-Za-z0-9_-]{40,})$/i);
    if (!match) throw new UnauthorizedException("Sign in to Creator Studio.");
    const session = await this.prisma.customerSession.findFirst({
      where: { tokenHash: sha256(match[1]), revokedAt: null, expiresAt: { gt: new Date() }, user: { isActive: true, role: { in: ["CUSTOMER", "SELLER"] } } },
      select: { id: true, userId: true },
    });
    if (!session) throw new UnauthorizedException("Your session has expired.");
    await this.prisma.customerSession.updateMany({ where: { id: session.id, revokedAt: null }, data: { lastUsedAt: new Date() } });
    const profile = await this.prisma.creatorProfile.findUnique({ where: { userId: session.userId }, select: { id: true } });
    if (!profile) throw new BadRequestException("Create your Creator Profile before uploading media.");
    return profile;
  }

  private signingKey(secret: string, date: string, region: string) {
    return hmac(hmac(hmac(hmac("AWS4" + secret, date), region), "s3"), "aws4_request");
  }

  async prepare(authorization: string | undefined, input: { mediaType: "IMAGE" | "VIDEO"; contentType: string; sizeBytes: number }) {
    const creator = await this.creator(authorization);
    const allowed = input.mediaType === "IMAGE" ? IMAGE_TYPES : VIDEO_TYPES;
    const limit = input.mediaType === "IMAGE" ? IMAGE_LIMIT : VIDEO_LIMIT;
    if (!allowed[input.contentType] || !Number.isInteger(input.sizeBytes) || input.sizeBytes < 1 || input.sizeBytes > limit) {
      throw new BadRequestException(input.mediaType === "IMAGE" ? "Use JPEG, PNG or WebP up to 10 MB." : "Use MP4 or WebM up to 100 MB.");
    }
    const cfg = this.storage();
    const storageKey = `social/quarantine/${creator.id}/${randomUUID()}.${allowed[input.contentType]}`;
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
    const signature = createHmac("sha256", this.signingKey(cfg.secretAccessKey, dateStamp, cfg.region)).update(stringToSign).digest("hex");
    return {
      storageKey,
      uploadUrl: `https://${cfg.host}/${encodeKey(storageKey)}?${query}&X-Amz-Signature=${signature}`,
      publicUrl: `${cfg.publicBaseUrl}/${encodeKey(storageKey)}`,
      contentType: input.contentType,
      sizeBytes: input.sizeBytes,
      expiresInSeconds: 300,
      maxBytes: limit,
    };
  }

  async complete(authorization: string | undefined, input: { storageKey: string; mediaType: "IMAGE" | "VIDEO"; contentType: string; sizeBytes: number; caption?: string }) {
    const creator = await this.creator(authorization);
    const allowed = input.mediaType === "IMAGE" ? IMAGE_TYPES : VIDEO_TYPES;
    const limit = input.mediaType === "IMAGE" ? IMAGE_LIMIT : VIDEO_LIMIT;
    const prefix = `social/quarantine/${creator.id}/`;
    if (!input.storageKey?.startsWith(prefix) || !/^[0-9a-f-]{36}\.(jpg|png|webp|mp4|webm)$/.test(input.storageKey.slice(prefix.length)) ||
      !allowed[input.contentType] || !Number.isInteger(input.sizeBytes) || input.sizeBytes < 1 || input.sizeBytes > limit ||
      (input.caption?.length ?? 0) > 2000) throw new BadRequestException("Invalid uploaded media metadata.");
    const cfg = this.storage();
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
    const dateStamp = amzDate.slice(0, 8);
    const payloadHash = sha256("");
    const canonicalHeaders = `host:${cfg.host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n${cfg.sessionToken ? `x-amz-security-token:${cfg.sessionToken}\n` : ""}`;
    const signedHeaders = `host;x-amz-content-sha256;x-amz-date${cfg.sessionToken ? ";x-amz-security-token" : ""}`;
    const canonicalRequest = ["HEAD", `/${encodeKey(input.storageKey)}`, "", canonicalHeaders, signedHeaders, payloadHash].join("\n");
    const scope = `${dateStamp}/${cfg.region}/s3/aws4_request`;
    const stringToSign = ["AWS4-HMAC-SHA256", amzDate, scope, sha256(canonicalRequest)].join("\n");
    const signature = createHmac("sha256", this.signingKey(cfg.secretAccessKey, dateStamp, cfg.region)).update(stringToSign).digest("hex");
    const auth = `AWS4-HMAC-SHA256 Credential=${cfg.accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
    let response: Response;
    try {
      response = await fetch(`https://${cfg.host}/${encodeKey(input.storageKey)}`, {
        method: "HEAD",
        headers: { Authorization: auth, "x-amz-date": amzDate, "x-amz-content-sha256": payloadHash, ...(cfg.sessionToken ? { "x-amz-security-token": cfg.sessionToken } : {}) },
        signal: AbortSignal.timeout(8000),
      });
    } catch { throw new ServiceUnavailableException("Could not verify uploaded media in S3."); }
    if (!response.ok) throw new ConflictException("Uploaded media was not found in storage.");
    const actualType = response.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
    const actualSize = Number(response.headers.get("content-length"));
    if (actualType !== input.contentType || actualSize !== input.sizeBytes || actualSize > limit) throw new ConflictException("Uploaded media type or size does not match.");
    const mediaUrl = `${cfg.publicBaseUrl}/${encodeKey(input.storageKey)}`;
    return this.prisma.socialPost.create({
      data: { creatorProfileId: creator.id, mediaType: input.mediaType, mediaUrl, caption: input.caption?.trim() || null, status: "DRAFT" },
      select: { id: true, mediaType: true, mediaUrl: true, caption: true, status: true, createdAt: true },
    });
  }
}
