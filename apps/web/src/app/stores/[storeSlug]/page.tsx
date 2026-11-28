import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Package, Store as StoreIcon } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CatalogProductCard, type CatalogProduct } from "@/components/catalog-product-card";

type StoreData = { store: { storeName: string; storeSlug: string; joinedAt: string }; products: CatalogProduct[]; pagination: { page: number; limit: number; total: number; totalPages: number } };
const apiUrl = (process.env.ANAN_API_URL ?? "http://localhost:4000/api/v1").replace(/\/$/, "");
async function getStore(slug: string): Promise<StoreData | null> {
  try {
    const response = await fetch(`${apiUrl}/catalog/stores/${encodeURIComponent(slug)}?page=1&limit=48`, { next: { revalidate: 60 } });
    if (response.status === 404 || !response.ok) return null;
    return await response.json() as StoreData;
  } catch { return null; }
}
export default async function StorefrontPage({ params }: { params: Promise<{ storeSlug: string }> }) {
  const { storeSlug } = await params;
  const data = await getStore(storeSlug);
  if (!data) notFound();
  return (
    <main className="min-h-screen bg-[#fcfbfe]">
      <SiteHeader/>
      <section className="container-shell py-8 sm:py-12">
        <Link href="/products" className="inline-flex items-center gap-2 text-sm font-semibold text-[#756987] hover:text-brand-600"><ArrowLeft size={16}/> Browse marketplace</Link>
        <div className="mt-6 rounded-3xl bg-[#281844] p-7 text-white sm:p-10">
          <div className="flex items-center gap-4"><div className="grid h-16 w-16 place-items-center rounded-2xl bg-white/10 text-[#e1ceff]"><StoreIcon size={30}/></div><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#c7a9f5]">ANAN verified marketplace seller</p><h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">{data.store.storeName}</h1><p className="mt-1 text-xs text-white/60">Store on ANAN since {new Date(data.store.joinedAt).toLocaleDateString("en-BD", { month: "long", year: "numeric" })}</p></div></div>
        </div>
        <div className="mb-5 mt-9 flex items-end justify-between"><div><h2 className="text-xl font-extrabold text-[#302344]">Store products</h2><p className="mt-1 text-xs text-[#92889f]">{data.pagination.total} approved products</p></div></div>
        {data.products.length ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">{data.products.map((product, index) => <CatalogProductCard key={product.id} product={product} priority={index < 4} />)}</div> : <div className="rounded-2xl border border-dashed border-[#ddd3e9] bg-white px-6 py-16 text-center"><Package className="mx-auto text-brand-400" size={36}/><h2 className="mt-4 font-bold text-[#302344]">No products published yet</h2><p className="mt-2 text-sm text-[#92889f]">This store is approved, but its products are still being reviewed.</p></div>}
      </section>
      <SiteFooter />
    </main>
  );
}
