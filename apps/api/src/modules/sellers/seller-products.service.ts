import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { createHash } from "node:crypto";
import { PrismaService } from "../../database/prisma.service";
import { CreateProductDto, SellerProductQueryDto, UpdateProductDto } from "./dto/product.dto";

function slugify(value: string): string {
  const base = value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 70)
    .replace(/^-|-$/g, "");
  return base || "product";
}

function clean(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

const productSelect = {
  id: true,
  nameEn: true,
  nameBn: true,
  slug: true,
  descriptionEn: true,
  descriptionBn: true,
  pricePaisa: true,
  compareAtPricePaisa: true,
  stockOnHand: true,
  status: true,
  reviewNotes: true,
  reviewedAt: true,
  createdAt: true,
  updatedAt: true,
  category: { select: { id: true, nameEn: true, nameBn: true, slug: true } },
  images: { orderBy: { sortOrder: "asc" as const }, select: { id: true, storageKey: true, altText: true, status: true, isPrimary: true } },
  _count: { select: { images: true } },
} as const;

@Injectable()
export class SellerProductsService {
  constructor(private readonly prisma: PrismaService) {}

  private async sellerContext(authorization?: string) {
    const match = authorization?.match(/^Bearer\s+([A-Za-z0-9_-]{40,})$/i);
    if (!match) throw new UnauthorizedException("An approved seller session is required.");
    const tokenHash = createHash("sha256").update(match[1]).digest("hex");
    const session = await this.prisma.customerSession.findFirst({
      where: {
        tokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
        user: { role: "SELLER", isActive: true, sellerProfile: { is: { status: "APPROVED" } } },
      },
      select: { id: true, user: { select: { sellerProfile: { select: { id: true, storeName: true, storeSlug: true } } } } },
    });
    const seller = session?.user.sellerProfile;
    if (!seller) throw new UnauthorizedException("An approved seller session is required.");
    await this.prisma.customerSession.updateMany({ where: { id: session.id, revokedAt: null }, data: { lastUsedAt: new Date() } });
    return { seller };
  }

  private imageUrl(storageKey: string): string | null {
    const bucket = process.env.AWS_S3_BUCKET;
    const region = process.env.AWS_REGION;
    const base = (process.env.MEDIA_PUBLIC_BASE_URL || (bucket && region ? `https://${bucket}.s3.${region}.amazonaws.com` : "")).replace(/\/$/, "");
    return base ? `${base}/${storageKey.split("/").map(encodeURIComponent).join("/")}` : null;
  }

  private serialize<
    T extends {
      pricePaisa: bigint;
      compareAtPricePaisa: bigint | null;
      reviewedAt: Date | null;
      createdAt: Date;
      updatedAt: Date;
      images: { storageKey: string }[];
    },
  >(product: T) {
    return {
      ...product,
      pricePaisa: product.pricePaisa.toString(),
      compareAtPricePaisa: product.compareAtPricePaisa?.toString() ?? null,
      reviewedAt: product.reviewedAt?.toISOString() ?? null,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
      images: product.images.map((image) => ({ ...image, url: this.imageUrl(image.storageKey) })),
    };
  }

  private async uniqueSlug(nameEn: string) {
    const base = slugify(nameEn);
    let candidate = base;
    for (let attempt = 1; attempt < 25; attempt += 1) {
      const existing = await this.prisma.product.findUnique({ where: { slug: candidate }, select: { id: true } });
      if (!existing) return candidate;
      candidate = `${base}-${attempt + 1}`;
    }
    return `${base}-${Date.now().toString(36)}`;
  }

  private validatePricing(pricePaisa: number, compareAtPricePaisa: number | null) {
    if (!Number.isInteger(pricePaisa) || pricePaisa < 100) {
      throw new ConflictException("Enter a price of at least ৳1.");
    }
    if (compareAtPricePaisa !== null && (!Number.isInteger(compareAtPricePaisa) || compareAtPricePaisa <= pricePaisa)) {
      throw new ConflictException("The compare-at price must be higher than the selling price, or left empty.");
    }
  }

  private async requireActiveCategory(categoryId: string) {
    const category = await this.prisma.category.findFirst({ where: { id: categoryId, isActive: true }, select: { id: true } });
    if (!category) throw new ConflictException("Choose an active category for this product.");
  }

  async list(authorization: string | undefined, query: SellerProductQueryDto) {
    const { seller } = await this.sellerContext(authorization);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const search = query.search?.trim();
    const where = {
      sellerId: seller.id,
      ...(query.status ? { status: query.status } : {}),
      ...(search
        ? {
            OR: [
              { nameEn: { contains: search, mode: "insensitive" as const } },
              { nameBn: { contains: search, mode: "insensitive" as const } },
              { slug: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };
    const [items, total, grouped] = await Promise.all([
      this.prisma.product.findMany({ where, orderBy: { updatedAt: "desc" }, skip: (page - 1) * limit, take: limit, select: productSelect }),
      this.prisma.product.count({ where }),
      this.prisma.product.groupBy({ by: ["status"], where: { sellerId: seller.id }, _count: { _all: true } }),
    ]);
    const counts = Object.fromEntries(PRODUCT_STATUS_KEYS.map((status) => [status, 0])) as Record<string, number>;
    for (const row of grouped) counts[row.status] = row._count._all;
    return {
      seller,
      products: items.map((item) => this.serialize(item)),
      counts,
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
  }

  async get(authorization: string | undefined, productId: string) {
    const { seller } = await this.sellerContext(authorization);
    const product = await this.prisma.product.findFirst({ where: { id: productId, sellerId: seller.id }, select: productSelect });
    if (!product) throw new NotFoundException("Product not found in your store.");
    return { product: this.serialize(product) };
  }

  async create(authorization: string | undefined, input: CreateProductDto) {
    const { seller } = await this.sellerContext(authorization);
    await this.requireActiveCategory(input.categoryId);
    const compareAtPricePaisa = input.compareAtPricePaisa ?? null;
    this.validatePricing(input.pricePaisa, compareAtPricePaisa);
    const slug = await this.uniqueSlug(input.nameEn);
    const product = await this.prisma.product.create({
      data: {
        sellerId: seller.id,
        categoryId: input.categoryId,
        slug,
        nameEn: input.nameEn.trim(),
        nameBn: clean(input.nameBn),
        descriptionEn: clean(input.descriptionEn),
        descriptionBn: clean(input.descriptionBn),
        pricePaisa: BigInt(input.pricePaisa),
        compareAtPricePaisa: compareAtPricePaisa === null ? null : BigInt(compareAtPricePaisa),
        stockOnHand: input.stockOnHand,
        status: "DRAFT",
      },
      select: productSelect,
    });
    return { product: this.serialize(product), message: "Draft created. Add at least one image, then submit it for review." };
  }

  async update(authorization: string | undefined, productId: string, input: UpdateProductDto) {
    const { seller } = await this.sellerContext(authorization);
    const existing = await this.prisma.product.findFirst({
      where: { id: productId, sellerId: seller.id },
      select: { id: true, status: true, pricePaisa: true, compareAtPricePaisa: true },
    });
    if (!existing) throw new NotFoundException("Product not found in your store.");
    if (existing.status === "ARCHIVED") throw new ConflictException("Restore this archived product before editing it.");
    if (input.categoryId) await this.requireActiveCategory(input.categoryId);
    const pricePaisa = input.pricePaisa ?? Number(existing.pricePaisa);
    const compareAtPricePaisa =
      input.compareAtPricePaisa !== undefined
        ? input.compareAtPricePaisa
        : existing.compareAtPricePaisa === null
          ? null
          : Number(existing.compareAtPricePaisa);
    this.validatePricing(pricePaisa, compareAtPricePaisa);
    const wasRejected = existing.status === "REJECTED";
    const product = await this.prisma.product.update({
      where: { id: productId },
      data: {
        ...(input.nameEn !== undefined ? { nameEn: input.nameEn.trim() } : {}),
        ...(input.nameBn !== undefined ? { nameBn: clean(input.nameBn) } : {}),
        ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
        ...(input.descriptionEn !== undefined ? { descriptionEn: clean(input.descriptionEn) } : {}),
        ...(input.descriptionBn !== undefined ? { descriptionBn: clean(input.descriptionBn) } : {}),
        ...(input.pricePaisa !== undefined ? { pricePaisa: BigInt(input.pricePaisa) } : {}),
        ...(input.compareAtPricePaisa !== undefined
          ? { compareAtPricePaisa: input.compareAtPricePaisa === null ? null : BigInt(input.compareAtPricePaisa) }
          : {}),
        ...(input.stockOnHand !== undefined ? { stockOnHand: input.stockOnHand } : {}),
        ...(wasRejected ? { status: "DRAFT" as const, reviewNotes: null, reviewedAt: null } : {}),
      },
      select: productSelect,
    });
    return {
      product: this.serialize(product),
      message:
        existing.status === "APPROVED"
          ? "Changes saved. Approved listings are edited in place; review the public page to confirm the update."
          : wasRejected
            ? "Draft updated. Submit it again when it is ready for review."
            : "Product saved.",
    };
  }

  async submit(authorization: string | undefined, productId: string) {
    const { seller } = await this.sellerContext(authorization);
    const product = await this.prisma.product.findFirst({
      where: { id: productId, sellerId: seller.id },
      select: { id: true, status: true, _count: { select: { images: true } } },
    });
    if (!product) throw new NotFoundException("Product not found in your store.");
    if (product.status !== "DRAFT" && product.status !== "REJECTED") {
      throw new ConflictException("Only draft or rejected products can be submitted for review.");
    }
    if (product._count.images < 1) {
      throw new ConflictException("Add at least one product image before submitting for review.");
    }
    const updated = await this.prisma.product.update({
      where: { id: productId },
      data: { status: "PENDING_APPROVAL", reviewNotes: null, reviewedAt: null },
      select: productSelect,
    });
    return { product: this.serialize(updated), message: "Submitted for Admin review. It becomes public after approval." };
  }

  async archive(authorization: string | undefined, productId: string) {
    const { seller } = await this.sellerContext(authorization);
    const product = await this.prisma.product.findFirst({ where: { id: productId, sellerId: seller.id }, select: { id: true, status: true } });
    if (!product) throw new NotFoundException("Product not found in your store.");
    if (product.status === "ARCHIVED") throw new ConflictException("This product is already archived.");
    const updated = await this.prisma.product.update({ where: { id: productId }, data: { status: "ARCHIVED" }, select: productSelect });
    return { product: this.serialize(updated), message: "Product archived and removed from the public catalogue." };
  }

  async restore(authorization: string | undefined, productId: string) {
    const { seller } = await this.sellerContext(authorization);
    const product = await this.prisma.product.findFirst({ where: { id: productId, sellerId: seller.id }, select: { id: true, status: true } });
    if (!product) throw new NotFoundException("Product not found in your store.");
    if (product.status !== "ARCHIVED") throw new ConflictException("Only archived products can be restored.");
    const updated = await this.prisma.product.update({
      where: { id: productId },
      data: { status: "DRAFT", reviewNotes: null, reviewedAt: null },
      select: productSelect,
    });
    return { product: this.serialize(updated), message: "Product restored as a draft. Submit it for review when ready." };
  }
}

export const PRODUCT_STATUS_KEYS = ["DRAFT", "PENDING_APPROVAL", "APPROVED", "REJECTED", "ARCHIVED"] as const;
