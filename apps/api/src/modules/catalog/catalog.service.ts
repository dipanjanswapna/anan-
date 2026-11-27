import { Injectable } from "@nestjs/common";
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
