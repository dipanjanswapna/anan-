import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowRight, PackageSearch } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CatalogProductCard, type CatalogProduct } from "@/components/catalog-product-card";

type Category = { id: string; nameEn: string; nameBn: string | null; slug: string; productCount: number };
type CatalogResponse = { items: CatalogProduct[]; pagination: { page: number; limit: number; total: number; totalPages: number } };
type Context = { params: Promise<{ slug: string }> };
const apiUrl = (process.env.ANAN_API_URL ?? "http://localhost:4000/api/v1").replace(/\/$/, "");

async function getCategory(slug: string) {
  try {
    const [categoriesResponse, productsResponse] = await Promise.all([
      fetch(`${apiUrl}/catalog/categories`, { next: { revalidate: 300 } }),
      fetch(`${apiUrl}/catalog/products?category=${encodeURIComponent(slug)}&limit=48&sort=newest`, { next: { revalidate: 30 } }),
    ]);
    const categories = categoriesResponse.ok ? ((await categoriesResponse.json()) as Category[]) : [];
    const category = categories.find((item) => item.slug === slug) ?? null;
    const products = productsResponse.ok ? ((await productsResponse.json()) as CatalogResponse) : null;
    return { categories, category, products };
  } catch {
    return { categories: [] as Category[], category: null, products: null };
  }
}

export async function generateMetadata({ params }: Context): Promise<Metadata> {
  const { slug } = await params;
  const { category } = await getCategory(slug);
  if (!category) return { title: "Category not found", robots: { index: false, follow: false } };
  const description = `Shop ${category.nameEn} from approved ANAN sellers. ${category.productCount} products with cash on delivery across Bangladesh.`;
  return {
    title: category.nameEn,
    description,
    alternates: { canonical: `/categories/${category.slug}` },
    openGraph: { title: `${category.nameEn} | ANAN`, description, url: `/categories/${category.slug}` },
  };
}

export default async function CategoryPage({ params }: Context) {
  const { slug } = await params;
  const { categories, category, products } = await getCategory(slug);
  if (!category) {
    if (categories.length === 0 && products === null) {
      return (
        <main className="min-h-screen bg-[#fcfbfe]">
          <SiteHeader />
          <section className="container-shell py-16">
            <div className="rounded-2xl border border-dashed border-[#ddd3e9] bg-white px-6 py-16 text-center">
              <PackageSearch className="mx-auto text-brand-400" size={36} aria-hidden />
              <h1 className="mt-4 text-xl font-bold text-[#302344]">Catalogue is getting ready</h1>
              <p className="mx-auto mt-2 max-w-sm text-sm text-[#92889f]">The product service is not reachable yet.</p>
              <Link href="/categories" className="mt-5 inline-flex rounded-xl bg-brand-600 px-5 py-2.5 text-xs font-bold text-white">Back to categories</Link>
            </div>
          </section>
          <SiteFooter />
        </main>
      );
    }
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#fcfbfe]">
      <SiteHeader />
      <section className="border-b border-[#f0edf4] bg-white">
        <div className="container-shell py-8 sm:py-11">
          <nav aria-label="Breadcrumb" className="text-[11px] font-semibold text-[#a097ad]">
            <Link href="/" className="hover:text-brand-600">Home</Link>
            <span className="mx-1.5" aria-hidden>/</span>
            <Link href="/categories" className="hover:text-brand-600">Categories</Link>
            <span className="mx-1.5" aria-hidden>/</span>
            <span className="text-[#655873]">{category.nameEn}</span>
          </nav>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.2em] text-brand-600">Shop by category</p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-[-1.2px] text-[#26183c] sm:text-[38px]">{category.nameEn}</h1>
              {category.nameBn && <p className="mt-1 text-base text-[#82778f]">{category.nameBn}</p>}
              <p className="mt-2 text-sm text-[#8f849e]">{category.productCount} approved {category.productCount === 1 ? "product" : "products"} from ANAN sellers.</p>
            </div>
            <Link href={`/products?category=${encodeURIComponent(category.slug)}`} className="inline-flex items-center gap-1.5 rounded-xl border border-[#e8e2f0] bg-white px-4 py-2.5 text-xs font-bold text-brand-700 hover:border-brand-300">Filter & sort <ArrowRight size={14} aria-hidden /></Link>
          </div>
          <div className="mt-6 flex gap-2 overflow-x-auto soft-scrollbar">
            {categories.map((item) => (
              <Link key={item.id} href={`/categories/${item.slug}`} aria-current={item.slug === category.slug ? "page" : undefined} className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold ${item.slug === category.slug ? "bg-brand-600 text-white" : "bg-[#faf8fd] text-[#655873] ring-1 ring-[#eeeaf3] hover:ring-brand-200"}`}>{item.nameEn}</Link>
            ))}
          </div>
        </div>
      </section>

      <section className="container-shell py-8 sm:py-11">
        {!products ? (
          <div className="rounded-2xl border border-dashed border-[#ddd3e9] bg-white px-6 py-16 text-center">
            <PackageSearch className="mx-auto text-brand-400" size={36} aria-hidden />
            <h2 className="mt-4 font-bold text-[#302344]">This category is getting ready</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-[#92889f]">The catalogue service is not reachable right now.</p>
          </div>
        ) : products.items.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
            {products.items.map((product, index) => <CatalogProductCard key={product.id} product={product} priority={index < 4} />)}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#ddd3e9] bg-white px-6 py-16 text-center">
            <PackageSearch className="mx-auto text-brand-400" size={36} aria-hidden />
            <h2 className="mt-4 font-bold text-[#302344]">Nothing here just yet</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-[#92889f]">No approved products in this category. Explore the full marketplace in the meantime.</p>
            <Link href="/products" className="mt-5 inline-flex rounded-xl bg-brand-600 px-5 py-2.5 text-xs font-bold text-white">Browse all products</Link>
          </div>
        )}
      </section>
      <SiteFooter />
    </main>
  );
}
