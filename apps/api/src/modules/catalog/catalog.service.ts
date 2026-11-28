import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { CatalogQueryDto } from "./dto/catalog-query.dto";

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  private imageUrl(storageKey: string) {
    const bucket = process.env.AWS_S3_BUCKET;
    const region = process.env.AWS_REGION;
    const base = (process.env.MEDIA_PUBLIC_BASE_URL || (bucket && region ? `https://${bucket}.s3.${region}.amazonaws.com` : "")).replace(/\/$/, "");
    return base ? `${base}/${storageKey.split("/").map(encodeURIComponent).join("/")}` : null;
  }

  async getCategories() {
    const categories = await this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: { nameEn: "asc" },
      select: { id: true, nameEn: true, nameBn: true, slug: true },
    });

    const counts = await this.prisma.product.groupBy({
      by: ["categoryId"],
      where: {
        status: "APPROVED",
        seller: { status: "APPROVED" },
        category: { isActive: true },
      },
      _count: { _all: true },
    });
    const countByCategory = new Map(counts.map((item) => [item.categoryId, item._count._all]));

    return categories.map((category) => ({
      ...category,
      productCount: countByCategory.get(category.id) ?? 0,
    }));
  }

  async getStores() {
    const sellers = await this.prisma.sellerProfile.findMany({
      where: { status: "APPROVED", products: { some: { status: "APPROVED" } } },
      orderBy: { createdAt: "asc" },
      take: 48,
      select: {
        storeName: true,
        storeSlug: true,
        createdAt: true,
        _count: { select: { products: { where: { status: "APPROVED" } } } },
      },
    });
    return {
      stores: sellers.map((seller) => ({
        storeName: seller.storeName,
        storeSlug: seller.storeSlug,
        joinedAt: seller.createdAt.toISOString(),
        productCount: seller._count.products,
      })),
    };
  }

  async getProductBySlug(slug: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        slug,
        status: "APPROVED",
        seller: { status: "APPROVED" },
        category: { isActive: true },
      },
      select: {
        id: true,
        nameEn: true,
        nameBn: true,
        slug: true,
        descriptionEn: true,
        descriptionBn: true,
        pricePaisa: true,
        compareAtPricePaisa: true,
        stockOnHand: true,
        createdAt: true,
        category: { select: { nameEn: true, nameBn: true, slug: true } },
        seller: { select: { storeName: true, storeSlug: true } },
        images: { where: { status: "APPROVED" }, orderBy: { sortOrder: "asc" }, select: { storageKey: true, altText: true, isPrimary: true } },
      },
    });
    if (!product) throw new NotFoundException("Product not found");
    return {
      ...product,
      pricePaisa: product.pricePaisa.toString(),
      compareAtPricePaisa: product.compareAtPricePaisa?.toString() ?? null,
      images: product.images.map((image) => ({ ...image, url: this.imageUrl(image.storageKey) })),
    };
  }

  async getStorefront(storeSlug: string, query: CatalogQueryDto) {
    const seller = await this.prisma.sellerProfile.findFirst({
      where: { storeSlug, status: "APPROVED" },
      select: {
        storeName: true,
        storeSlug: true,
        createdAt: true,
        products: {
          where: { status: "APPROVED", category: { isActive: true } },
          orderBy: { createdAt: "desc" },
          skip: ((query.page ?? 1) - 1) * (query.limit ?? 12),
          take: query.limit ?? 12,
          select: {
            id: true, nameEn: true, nameBn: true, slug: true,
            pricePaisa: true, compareAtPricePaisa: true, stockOnHand: true,
            category: { select: { nameEn: true, slug: true } },
            images: { where: { status: "APPROVED" }, orderBy: { sortOrder: "asc" }, take: 1, select: { storageKey: true, altText: true } },
          },
        },
        _count: { select: { products: { where: { status: "APPROVED", category: { isActive: true } } } } },
      },
    });
    if (!seller) throw new NotFoundException("Store not found");
    return {
      store: { storeName: seller.storeName, storeSlug: seller.storeSlug, joinedAt: seller.createdAt },
      products: seller.products.map((product) => ({
        ...product,
        pricePaisa: product.pricePaisa.toString(),
        compareAtPricePaisa: product.compareAtPricePaisa?.toString() ?? null,
        images: product.images.map((image) => ({ ...image, url: this.imageUrl(image.storageKey) })),
      })),
      pagination: {
        page: query.page ?? 1,
        limit: query.limit ?? 12,
        total: seller._count.products,
        totalPages: Math.ceil(seller._count.products / (query.limit ?? 12)),
      },
    };
  }

  async getProducts(query: CatalogQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 12;
    const minPrice = typeof query.minPrice === "number" ? BigInt(query.minPrice) : undefined;
    const maxPrice = typeof query.maxPrice === "number" ? BigInt(query.maxPrice) : undefined;
    const where = {
      status: "APPROVED" as const,
      seller: { status: "APPROVED" as const },
      category: {
        isActive: true,
        ...(query.category ? { slug: query.category } : {}),
      },
      ...(minPrice !== undefined || maxPrice !== undefined
        ? { pricePaisa: { ...(minPrice !== undefined ? { gte: minPrice } : {}), ...(maxPrice !== undefined ? { lte: maxPrice } : {}) } }
        : {}),
      ...(query.inStock === "true" ? { stockOnHand: { gt: 0 } } : {}),
      ...(query.onSale === "true" ? { compareAtPricePaisa: { not: null } } : {}),
      ...(query.search
        ? {
            OR: [
              { nameEn: { contains: query.search, mode: "insensitive" as const } },
              { nameBn: { contains: query.search, mode: "insensitive" as const } },
              { descriptionEn: { contains: query.search, mode: "insensitive" as const } },
              { descriptionBn: { contains: query.search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        orderBy:
          query.sort === "price_asc"
            ? { pricePaisa: "asc" as const }
            : query.sort === "price_desc"
              ? { pricePaisa: "desc" as const }
              : query.sort === "name_asc"
                ? { nameEn: "asc" as const }
                : { createdAt: "desc" as const },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          nameEn: true,
          nameBn: true,
          slug: true,
          descriptionEn: true,
          descriptionBn: true,
          pricePaisa: true,
          compareAtPricePaisa: true,
          stockOnHand: true,
          createdAt: true,
          category: { select: { nameEn: true, nameBn: true, slug: true } },
          seller: { select: { storeName: true, storeSlug: true } },
          images: { where: { status: "APPROVED" }, orderBy: { sortOrder: "asc" }, take: 1, select: { storageKey: true, altText: true } },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      items: items.map((item) => ({
        ...item,
        pricePaisa: item.pricePaisa.toString(),
        compareAtPricePaisa: item.compareAtPricePaisa?.toString() ?? null,
        images: item.images.map((image) => ({ ...image, url: this.imageUrl(image.storageKey) })),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
