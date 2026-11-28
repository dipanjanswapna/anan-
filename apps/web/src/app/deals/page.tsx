import Link from "next/link";
import { BadgePercent, PackageSearch, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CatalogProductCard, type CatalogProduct } from "@/components/catalog-product-card";

type CatalogResponse = { items: CatalogProduct[]; pagination: { page: number; limit: number; total: number; totalPages: number } };
const apiUrl = (process.env.ANAN_API_URL ?? "http://localhost:4000/api/v1").replace(/\/$/, "");

async function getDeals(): Promise<CatalogResponse | null> {
  try {
    const response = await fetch(`${apiUrl}/catalog/products?onSale=true&limit=24&sort=price_asc`, { next: { revalidate: 30 } });
    if (!response.ok) return null;
    return (await response.json()) as CatalogResponse;
  } catch {
    return null;
  }
}

export const metadata = {
  title: "Today’s deals",
  description: "Marked-down products from approved ANAN sellers — honest prices, cash on delivery across Bangladesh.",
  alternates: { canonical: "/deals" },
};

export default async function DealsPage() {
  const data = await getDeals();

  return (
    <main className="min-h-screen bg-[#fcfbfe]">
      <SiteHeader />
      <section className="container-shell pt-6 sm:pt-8">
        <div className="relative overflow-hidden rounded-[26px] bg-[#281844] px-6 py-9 text-white sm:rounded-[34px] sm:px-12 sm:py-12">
          <div className="absolute -right-10 -top-24 h-72 w-72 rounded-full border border-white/10" aria-hidden />
          <div className="absolute -right-2 -top-16 h-52 w-52 rounded-full border border-white/10" aria-hidden />
          <div className="relative max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.16em] text-[#e3d3ff]"><Sparkles size={12} aria-hidden /> This week’s edit</span>
            <h1 className="mt-4 text-[34px] font-extrabold leading-tight tracking-[-1.5px] sm:text-[46px]">Today’s deals,<br className="hidden sm:block" /> without the gimmicks.</h1>
            <p className="mt-3 max-w-md text-xs leading-6 text-white/60 sm:text-sm">Marked-down prices set by sellers, shown clearly with the original price. Cash on delivery available across Bangladesh.</p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link href="/products?sale=true" className="inline-flex h-11 items-center gap-2 rounded-xl bg-white px-5 text-xs font-bold text-[#382054] hover:bg-[#eee5ff]">See all products on sale</Link>
              <Link href="/categories" className="inline-flex h-11 items-center rounded-xl px-4 text-xs font-bold text-white/80 hover:bg-white/10 hover:text-white">Browse categories</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="container-shell py-9 sm:py-12">
        <div className="mb-5 flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.2em] text-brand-600">Fair prices</p>
            <h2 className="mt-1.5 text-[24px] font-extrabold tracking-[-.8px] text-[#26183c] sm:text-[30px]">On sale right now</h2>
            <p className="mt-1 text-xs text-[#958ba2] sm:text-sm">{data ? `${data.pagination.total} products with a lower-than-list price.` : "Deals from approved sellers."}</p>
          </div>
          <span className="badge hidden bg-[#fff3e8] text-[#bd6424] sm:inline-flex"><BadgePercent size={13} aria-hidden /> Seller-set prices</span>
        </div>
        {!data ? (
          <div className="rounded-2xl border border-dashed border-[#ddd3e9] bg-white px-6 py-16 text-center">
            <PackageSearch className="mx-auto text-brand-400" size={36} aria-hidden />
            <h2 className="mt-4 font-bold text-[#302344]">Deals are getting ready</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-[#92889f]">The catalogue service is not reachable yet.</p>
          </div>
        ) : data.items.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
            {data.items.map((product, index) => <CatalogProductCard key={product.id} product={product} priority={index < 4} />)}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#ddd3e9] bg-white px-6 py-16 text-center">
            <PackageSearch className="mx-auto text-brand-400" size={36} aria-hidden />
            <h2 className="mt-4 font-bold text-[#302344]">No markdowns today</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-[#92889f]">Sellers haven’t set any sale prices yet. New arrivals are waiting, though.</p>
            <Link href="/products?sort=newest" className="mt-5 inline-flex rounded-xl bg-brand-600 px-5 py-2.5 text-xs font-bold text-white">See new arrivals</Link>
          </div>
        )}
      </section>
      <SiteFooter />
    </main>
  );
}
