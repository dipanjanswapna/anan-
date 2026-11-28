import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://anan.com";
const apiUrl = (process.env.ANAN_API_URL ?? "http://localhost:4000/api/v1").replace(/\/$/, "");

type Product = { slug: string; updatedAt?: string | null };
type ProductPage = { items?: Product[]; pagination?: { page: number; totalPages: number } };
type Category = { slug: string };

async function getPublicCatalogEntries(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];
  try {
    const categoriesResponse = await fetch(apiUrl + "/catalog/categories", { next: { revalidate: 3600 } });
    if (categoriesResponse.ok) {
      const categories = await categoriesResponse.json() as Category[];
      for (const category of categories) {
        entries.push({
          url: new URL("/products?category=" + encodeURIComponent(category.slug), siteUrl).toString(),
          changeFrequency: "daily",
          priority: 0.65,
        });
      }
    }

    // The public catalog endpoint applies storefront visibility rules. Bound the crawl.
    for (let page = 1; page <= 20; page += 1) {
      const response = await fetch(apiUrl + "/catalog/products?page=" + page + "&limit=48", { next: { revalidate: 1800 } });
      if (!response.ok) break;
      const result = await response.json() as ProductPage;
      for (const product of result.items ?? []) {
        entries.push({
          url: new URL("/products/" + encodeURIComponent(product.slug), siteUrl).toString(),
          ...(product.updatedAt ? { lastModified: new Date(product.updatedAt) } : {}),
          changeFrequency: "weekly",
          priority: 0.7,
        });
      }
      if (!result.items?.length || (result.pagination && page >= result.pagination.totalPages)) break;
    }
  } catch {
    // Keep static routes available while the API is temporarily unavailable.
  }
  return entries;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: new URL("/", siteUrl).toString(), changeFrequency: "daily", priority: 1 },
    { url: new URL("/products", siteUrl).toString(), changeFrequency: "daily", priority: 0.9 },
    { url: new URL("/categories", siteUrl).toString(), changeFrequency: "weekly", priority: 0.8 },
    { url: new URL("/sell", siteUrl).toString(), changeFrequency: "monthly", priority: 0.6 },
  ];
  return [...staticRoutes, ...(await getPublicCatalogEntries())];
}
