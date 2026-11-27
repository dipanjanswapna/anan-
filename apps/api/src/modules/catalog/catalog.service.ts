import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { CatalogQueryDto } from "./dto/catalog-query.dto";

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

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
      },
    });
    if (!product) throw new NotFoundException("Product not found");
    return {
      ...product,
      pricePaisa: product.pricePaisa.toString(),
      compareAtPricePaisa: product.compareAtPricePaisa?.toString() ?? null,
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
    const where = {
      status: "APPROVED" as const,
      seller: { status: "APPROVED" as const },
      category: {
        isActive: true,
        ...(query.category ? { slug: query.category } : {}),
      },
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
        orderBy: { createdAt: "desc" },
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
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      items: items.map((item) => ({
        ...item,
        pricePaisa: item.pricePaisa.toString(),
        compareAtPricePaisa: item.compareAtPricePaisa?.toString() ?? null,
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
