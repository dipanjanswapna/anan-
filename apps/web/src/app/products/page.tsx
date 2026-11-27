import Link from "next/link";
import { Search, SlidersHorizontal, PackageSearch } from "lucide-react";
import { SiteHeader } from "@/components/site-header";

type CatalogProduct = {
  id: string; nameEn: string; nameBn: string | null; slug: string;
  pricePaisa: string; stockOnHand: number;
  category: { nameEn: string; slug: string };
  seller: { storeName: string; storeSlug: string };
};
type CatalogResponse = { items: CatalogProduct[]; pagination: { page: number; limit: number; total: number; totalPages: number } };
type Category = { id: string; nameEn: string; slug: string; productCount: number };
const apiUrl = (process.env.ANAN_API_URL ?? "http://localhost:4000/api/v1").replace(/\/$/, "");
const taka = (paisa: string) => { const amount = BigInt(paisa); const whole = new Intl.NumberFormat("en-BD").format(amount / 100n); const fraction = (amount % 100n).toString().padStart(2, "0").replace(/0+$/, ""); return fraction ? `${whole}.${fraction}` : whole; };

async function getCatalog(search: string, category: string) {
  try {
    const params = new URLSearchParams({ page: "1", limit: "24" });
    if (search) params.set("search", search);
    if (category) params.set("category", category);
    const [productsResponse, categoriesResponse] = await Promise.all([
      fetch(`${apiUrl}/catalog/products?${params}`, { next: { revalidate: 30 } }),
      fetch(`${apiUrl}/catalog/categories`, { next: { revalidate: 300 } }),
    ]);
    if (!productsResponse.ok || !categoriesResponse.ok) return { data: null, categories: [] as Category[] };
    const [data, categories] = await Promise.all([productsResponse.json(), categoriesResponse.json()]);
    return { data: data as CatalogResponse, categories: categories as Category[] };
  } catch {
    return { data: null, categories: [] as Category[] };
  }
}

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ q?: string; category?: string }> }) {
  const params = await searchParams;
  const search = params.q?.trim() ?? "";
  const category = params.category ?? "";
  const { data, categories } = await getCatalog(search, category);
  return (
    <main className="min-h-screen bg-[#fcfbfe]">
      <SiteHeader />
      <section className="container-shell py-8 sm:py-12">
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-brand-600">The ANAN marketplace</p><h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#26183c] sm:text-4xl">Explore products</h1><p className="mt-2 text-sm text-[#8f849e]">Discover products from approved sellers across Bangladesh.</p></div>
          <form action="/products" className="flex w-full max-w-xl gap-2">
            <label className="flex h-12 flex-1 items-center gap-2 rounded-xl border border-[#e9e3f0] bg-white px-4"><Search size={17} className="text-[#9b91a8]"/><input name="q" defaultValue={search} placeholder="Search products in English or বাংলা" className="w-full bg-transparent text-sm text-[#302344] outline-none"/></label>
            {category && <input type="hidden" name="category" value={category}/>}<button className="rounded-xl bg-brand-600 px-5 text-sm font-bold text-white hover:bg-brand-700">Search</button>
          </form>
        </div>
        <div className="mb-7 flex flex-wrap items-center gap-2"><SlidersHorizontal size={15} className="mr-1 text-[#9b91a8]"/><Link href="/products" className={`rounded-full px-4 py-2 text-xs font-semibold ${!category ? "bg-brand-600 text-white" : "bg-white text-[#655873] ring-1 ring-[#eeeaf3]"}`}>All categories</Link>{categories.map((item)=><Link key={item.id} href={`/products?category=${encodeURIComponent(item.slug)}`} className={`rounded-full px-4 py-2 text-xs font-semibold ${category===item.slug ? "bg-brand-600 text-white" : "bg-white text-[#655873] ring-1 ring-[#eeeaf3]"}`}>{item.nameEn} <span className="opacity-70">({item.productCount})</span></Link>)}</div>
        {data ? <>
          <div className="mb-4 text-xs text-[#92889f]">{data.pagination.total} products found{search ? ` for “${search}”` : ""}</div>
          {data.items.length ? <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{data.items.map((product)=><article key={product.id} className="rounded-2xl border border-[#eeeaf3] bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-soft">
            <div className="mb-4 flex h-32 items-center justify-center rounded-xl bg-[#f4effb] text-brand-500"><PackageSearch size={42} strokeWidth={1.2}/></div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-brand-600">{product.category.nameEn}</p><h2 className="mt-2 line-clamp-2 min-h-10 text-sm font-bold text-[#302344]">{product.nameEn}</h2>{product.nameBn && <p className="mt-1 text-xs text-[#82778f]">{product.nameBn}</p>}
            <p className="mt-3 text-lg font-extrabold text-[#26183c]">৳{taka(product.pricePaisa)}</p><p className="mt-2 text-xs text-[#92889f]">Sold by {product.seller.storeName}</p><p className={`mt-3 text-[11px] font-semibold ${product.stockOnHand>0 ? "text-emerald-700" : "text-rose-600"}`}>{product.stockOnHand>0 ? "In stock" : "Out of stock"}</p>
          </article>)}</div> : <div className="rounded-2xl border border-dashed border-[#ddd3e9] bg-white px-6 py-16 text-center"><PackageSearch className="mx-auto text-brand-400" size={36}/><h2 className="mt-4 font-bold text-[#302344]">No products found</h2><p className="mt-2 text-sm text-[#92889f]">Try another keyword or choose a different category.</p></div>}
        </> : <div className="rounded-2xl border border-dashed border-[#ddd3e9] bg-white px-6 py-16 text-center"><PackageSearch className="mx-auto text-brand-400" size={36}/><h2 className="mt-4 font-bold text-[#302344]">Catalog is getting ready</h2><p className="mt-2 text-sm text-[#92889f]">The product service is not reachable yet. Start PostgreSQL and the ANAN API, then refresh this page.</p></div>}
      </section>
    </main>
  );
}
