import Link from "next/link";
import { ArrowRight, Store } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { formatDate } from "@/lib/format";

type StoreSummary = { storeName: string; storeSlug: string; joinedAt: string; productCount: number };
const apiUrl = (process.env.ANAN_API_URL ?? "http://localhost:4000/api/v1").replace(/\/$/, "");

async function getStores(): Promise<StoreSummary[] | null> {
  try {
    const response = await fetch(`${apiUrl}/catalog/stores`, { next: { revalidate: 120 } });
    if (!response.ok) return null;
    const payload = (await response.json()) as { stores: StoreSummary[] };
    return payload.stores;
  } catch {
    return null;
  }
}

export const metadata = {
  title: "Explore stores",
  description: "Meet the approved ANAN sellers, their storefronts and their reviewed products.",
  alternates: { canonical: "/stores" },
};

export default async function StoresPage() {
  const stores = await getStores();

  return (
    <main className="min-h-screen bg-[#fcfbfe]">
      <SiteHeader />
      <section className="border-b border-[#f0edf4] bg-white">
        <div className="container-shell py-9 sm:py-12">
          <nav aria-label="Breadcrumb" className="text-[11px] font-semibold text-[#a097ad]">
            <Link href="/" className="hover:text-brand-600">Home</Link>
            <span className="mx-1.5" aria-hidden>/</span>
            <span className="text-[#655873]">Stores</span>
          </nav>
          <p className="mt-4 text-[10px] font-bold uppercase tracking-[.2em] text-brand-600">Meet the sellers</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-[-1.2px] text-[#26183c] sm:text-[40px]">Explore stores</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#8f849e]">Every storefront here belongs to an ANAN-approved seller with reviewed products.</p>
        </div>
      </section>

      <section className="container-shell py-9 sm:py-12">
        {!stores ? (
          <div className="rounded-2xl border border-dashed border-[#ddd3e9] bg-white px-6 py-16 text-center">
            <Store className="mx-auto text-brand-400" size={36} aria-hidden />
            <h2 className="mt-4 font-bold text-[#302344]">Stores are loading soon</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-[#92889f]">The catalogue service is not reachable yet.</p>
            <Link href="/products" className="mt-5 inline-flex rounded-xl bg-brand-600 px-5 py-2.5 text-xs font-bold text-white">Browse products</Link>
          </div>
        ) : stores.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stores.map((store) => (
              <Link key={store.storeSlug} href={`/stores/${encodeURIComponent(store.storeSlug)}`} className="group flex flex-col rounded-3xl border border-[#eeeaf3] bg-white p-6 transition hover:-translate-y-1 hover:border-brand-200 hover:shadow-soft">
                <div className="flex items-center gap-3">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#f4effb] text-lg font-black text-brand-700" aria-hidden>{store.storeName.slice(0, 1).toUpperCase()}</span>
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-extrabold text-[#302344]">{store.storeName}</h2>
                    <p className="mt-0.5 text-[11px] text-[#958ba2]">On ANAN since {formatDate(store.joinedAt, { month: "long", year: "numeric" })}</p>
                  </div>
                </div>
                <p className="mt-5 text-xs text-[#8f849e]">{store.productCount} approved {store.productCount === 1 ? "product" : "products"}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-brand-700 transition group-hover:gap-2">Visit store <ArrowRight size={14} aria-hidden /></span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#ddd3e9] bg-white px-6 py-16 text-center">
            <Store className="mx-auto text-brand-400" size={36} aria-hidden />
            <h2 className="mt-4 font-bold text-[#302344]">No public stores yet</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-[#92889f]">Approved sellers appear here once their products are live.</p>
            <Link href="/sell" className="mt-5 inline-flex rounded-xl bg-brand-600 px-5 py-2.5 text-xs font-bold text-white">Sell on ANAN</Link>
          </div>
        )}
      </section>
      <SiteFooter />
    </main>
  );
}
