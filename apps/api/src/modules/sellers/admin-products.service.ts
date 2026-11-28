import { ConflictException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { createHash } from "node:crypto";
import { PrismaService } from "../../database/prisma.service";
import { AdminProductQueryDto, PRODUCT_STATUSES, ReviewProductDto } from "./dto/product.dto";

const REQUIRED_PERMISSION = "PRODUCT_REVIEW";

@Injectable()
export class AdminProductsService {
  constructor(private readonly prisma: PrismaService) {}

  private async adminContext(authorization?: string) {
    const match = authorization?.match(/^Bearer\s+([A-Za-z0-9_-]{40,})$/i);
    if (!match) throw new UnauthorizedException("An administrator session is required.");
    const tokenHash = createHash("sha256").update(match[1]).digest("hex");
    const session = await this.prisma.customerSession.findFirst({
      where: { tokenHash, revokedAt: null, expiresAt: { gt: new Date() }, user: { isActive: true, role: { in: ["ADMIN", "STAFF"] } } },
      select: { id: true, userId: true, user: { select: { role: true } } },
    });
    if (!session) throw new UnauthorizedException("An active administrator session is required.");
    if (session.user.role !== "ADMIN") {
      const permission = await this.prisma.adminPermission.findUnique({
        where: { userId_permission: { userId: session.userId, permission: REQUIRED_PERMISSION } },
        select: { id: true },
      });
      if (!permission) throw new ForbiddenException("You do not have permission to review products.");
    }
    await this.prisma.customerSession.updateMany({ where: { id: session.id, revokedAt: null }, data: { lastUsedAt: new Date() } });
    return { userId: session.userId };
  }

  private imageUrl(storageKey: string): string | null {
    const bucket = process.env.AWS_S3_BUCKET;
    const region = process.env.AWS_REGION;
    const base = (process.env.MEDIA_PUBLIC_BASE_URL || (bucket && region ? `https://${bucket}.s3.${region}.amazonaws.com` : "")).replace(/\/$/, "");
    return base ? `${base}/${storageKey.split("/").map(encodeURIComponent).join("/")}` : null;
  }

  async list(authorization: string | undefined, query: AdminProductQueryDto) {
    await this.adminContext(authorization);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const status = query.status ?? "PENDING_APPROVAL";
    if (!PRODUCT_STATUSES.includes(status)) throw new ConflictException("Invalid product status filter.");
    const search = query.search?.trim();
    const where = {
      status,
      ...(search
        ? {
            OR: [
              { nameEn: { contains: search, mode: "insensitive" as const } },
              { nameBn: { contains: search, mode: "insensitive" as const } },
              { seller: { storeName: { contains: search, mode: "insensitive" as const } } },
            ],
          }
        : {}),
    };
    const [items, total, grouped] = await Promise.all([
      this.prisma.product.findMany({
        where,
        orderBy: { updatedAt: "asc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true, nameEn: true, nameBn: true, slug: true, status: true, pricePaisa: true,
          compareAtPricePaisa: true, stockOnHand: true, reviewNotes: true, reviewedAt: true,
          createdAt: true, updatedAt: true,
          seller: { select: { id: true, storeName: true, storeSlug: true } },
          category: { select: { id: true, nameEn: true, slug: true } },
          images: { orderBy: { sortOrder: "asc" }, select: { id: true, storageKey: true, altText: true, status: true, isPrimary: true } },
        },
      }),
      this.prisma.product.count({ where }),
      this.prisma.product.groupBy({ by: ["status"], _count: { _all: true } }),
    ]);
    const counts: Record<string, number> = Object.fromEntries(PRODUCT_STATUSES.map((value) => [value, 0]));
    for (const row of grouped) counts[row.status] = row._count._all;
    return {
      products: items.map((product) => ({
        ...product,
        pricePaisa: product.pricePaisa.toString(),
        compareAtPricePaisa: product.compareAtPricePaisa?.toString() ?? null,
        reviewedAt: product.reviewedAt?.toISOString() ?? null,
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt.toISOString(),
        images: product.images.map((image) => ({ ...image, url: this.imageUrl(image.storageKey) })),
      })),
      counts,
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
  }

  async review(authorization: string | undefined, productId: string, input: ReviewProductDto) {
    const actor = await this.adminContext(authorization);
    const notes = typeof input.notes === "string" ? input.notes.trim() : "";
    if (!["APPROVE", "REJECT"].includes(input.action)) throw new ConflictException("Choose approve or reject.");
    if (notes.length > 1000) throw new ConflictException("Review notes must be 1,000 characters or fewer.");
    if (input.action === "REJECT" && !notes) throw new ConflictException("A rejection reason is required.");
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: productId },
        select: { id: true, status: true, nameEn: true, _count: { select: { images: true } } },
      });
      if (!product) throw new NotFoundException("Product not found.");
      if (product.status !== "PENDING_APPROVAL") throw new ConflictException("Only products awaiting approval can be reviewed.");
      if (input.action === "APPROVE" && product._count.images < 1) {
        throw new ConflictException("Approve at least one product image and upload it before approving this product.");
      }
      const updated = await tx.product.update({
        where: { id: product.id },
        data: {
          status: input.action === "APPROVE" ? "APPROVED" : "REJECTED",
          reviewNotes: notes || null,
          reviewedAt: new Date(),
        },
        select: { id: true, status: true },
      });
      await tx.adminAuditLog.create({
        data: {
          actorUserId: actor.userId,
          action: input.action === "APPROVE" ? "PRODUCT_APPROVED" : "PRODUCT_REJECTED",
          targetType: "PRODUCT",
          targetId: product.id,
          metadata: { productName: product.nameEn, notes: notes || null },
        },
      });
      return {
        product: updated,
        message: input.action === "APPROVE" ? "Product approved and published to the public catalogue." : "Product rejected. The seller can edit and resubmit it.",
      };
    }, { isolationLevel: "Serializable" });
  }
}
