import Link from "next/link";
import { ChevronLeft, ChevronRight, PackageSearch, Search, SlidersHorizontal, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CatalogProductCard, type CatalogProduct } from "@/components/catalog-product-card";
import { takaToPaisa } from "@/lib/format";

type Category = { id: string; nameEn: string; nameBn: string | null; slug: string; productCount: number };
type CatalogResponse = { items: CatalogProduct[]; pagination: { page: number; limit: number; total: number; totalPages: number } };
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const apiUrl = (process.env.ANAN_API_URL ?? "http://localhost:4000/api/v1").replace(/\/$/, "");
const sorts = [
  { value: "newest", label: "Newest first" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "name_asc", label: "Name: A to Z" },
];
const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

async function getCategories(): Promise<Category[]> {
  try {
    const response = await fetch(`${apiUrl}/catalog/categories`, { next: { revalidate: 300 } });
    if (!response.ok) return [];
    return (await response.json()) as Category[];
  } catch {
    return [];
  }
}

async function getCatalog(query: URLSearchParams) {
  try {
    const response = await fetch(`${apiUrl}/catalog/products?${query.toString()}`, { next: { revalidate: 30 } });
    if (!response.ok) return null;
    return (await response.json()) as CatalogResponse;
  } catch {
    return null;
  }
}

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const q = first(params.q)?.trim() ?? "";
  const category = first(params.category) ?? "";
  const sort = sorts.some((option) => option.value === first(params.sort)) ? first(params.sort)! : "newest";
  const min = first(params.min) ?? "";
  const max = first(params.max) ?? "";
  const inStock = first(params.stock) === "true";
  const onSale = first(params.sale) === "true";
  const page = Math.max(1, Number.parseInt(first(params.page) ?? "1", 10) || 1);

  const query = new URLSearchParams({ page: String(page), limit: "24", sort });
  if (q) query.set("search", q);
  if (category) query.set("category", category);
  const minPaisa = min ? takaToPaisa(min) : null;
  const maxPaisa = max ? takaToPaisa(max) : null;
  if (minPaisa !== null) query.set("minPrice", String(minPaisa));
  if (maxPaisa !== null) query.set("maxPrice", String(maxPaisa));
  if (inStock) query.set("inStock", "true");
  if (onSale) query.set("onSale", "true");

  const [data, categories] = await Promise.all([getCatalog(query), getCategories()]);
  const activeCategory = categories.find((item) => item.slug === category);
  const resultCount = data?.pagination.total ?? 0;
  const totalPages = data?.pagination.totalPages ?? 1;

  const hrefFor = (overrides: Record<string, string | undefined>) => {
    const next = new URLSearchParams();
    const current: Record<string, string | undefined> = {
      q,
      category: category || undefined,
      sort: sort === "newest" ? undefined : sort,
      min: min || undefined,
      max: max || undefined,
      stock: inStock ? "true" : undefined,
      sale: onSale ? "true" : undefined,
      page: page > 1 ? String(page) : undefined,
    };
    for (const [key, value] of Object.entries({ ...current, ...overrides })) {
      if (value) next.set(key, value);
    }
    const queryString = next.toString();
    return queryString ? `/products?${queryString}` : "/products";
  };

  const hasFilters = Boolean(q || category || min || max || inStock || onSale);
  const summaryTitle = q ? `Results for “${q}”` : activeCategory ? activeCategory.nameEn : onSale ? "Deals and markdowns" : "Explore products";

  return (
    <main className="min-h-screen bg-[#fcfbfe]">
      <SiteHeader />
      <section className="border-b border-[#f0edf4] bg-white">
        <div className="container-shell py-7 sm:py-10">
          <nav aria-label="Breadcrumb" className="text-[11px] font-semibold text-[#a097ad]">
            <Link href="/" className="hover:text-brand-600">Home</Link>
            <span className="mx-1.5" aria-hidden>/</span>
            <span className="text-[#655873]">Products</span>
          </nav>
          <div className="mt-3 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.2em] text-brand-600">The ANAN marketplace</p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-[-1.2px] text-[#26183c] sm:text-[38px]">{summaryTitle}</h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-[#8f849e]">
                {data ? `${resultCount} approved ${resultCount === 1 ? "product" : "products"} from verified sellers across Bangladesh.` : "Discover products from approved sellers across Bangladesh."}
              </p>
            </div>
            <form action="/products" role="search" className="flex w-full max-w-xl gap-2">
              <label className="flex h-12 flex-1 items-center gap-2 rounded-xl border border-[#e9e3f0] bg-white px-4 focus-within:border-brand-400">
                <Search size={17} className="text-[#9b91a8]" aria-hidden />
                <input name="q" defaultValue={q} aria-label="Search products" placeholder="Search products in English or বাংলা" className="w-full bg-transparent text-sm text-[#302344] outline-none" />
              </label>
              {category && <input type="hidden" name="category" value={category} />}
              {sort !== "newest" && <input type="hidden" name="sort" value={sort} />}
              <button className="rounded-xl bg-brand-600 px-5 text-sm font-bold text-white hover:bg-brand-700">Search</button>
            </form>
          </div>
        </div>
      </section>

      <section className="container-shell py-7 sm:py-9">
        <div className="grid gap-6 lg:grid-cols-[240px_1fr] lg:gap-8">
          <aside className="hidden lg:block">
            <div className="sticky top-[150px] space-y-4">
              <form action="/products" className="rounded-2xl border border-[#eeeaf3] bg-white p-5">
                <h2 className="flex items-center gap-2 text-sm font-extrabold text-[#302344]"><SlidersHorizontal size={15} className="text-brand-600" aria-hidden /> Filters</h2>
                <input type="hidden" name="q" value={q} />
                <fieldset className="mt-4">
                  <legend className="text-[10px] font-bold uppercase tracking-[.14em] text-[#a097ad]">Category</legend>
                  <div className="mt-2 space-y-1">
                    <Link href={hrefFor({ category: undefined, page: undefined })} className={`block rounded-lg px-2.5 py-2 text-xs font-semibold ${!category ? "bg-brand-50 text-brand-700" : "text-[#655873] hover:bg-[#faf8fd]"}`}>All categories</Link>
                    {categories.map((item) => (
                      <Link key={item.id} href={hrefFor({ category: item.slug, page: undefined })} className={`flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold ${category === item.slug ? "bg-brand-50 text-brand-700" : "text-[#655873] hover:bg-[#faf8fd]"}`}>
                        <span className="truncate">{item.nameEn}</span>
                        <span className="text-[10px] text-[#a097ad]">{item.productCount}</span>
                      </Link>
                    ))}
                  </div>
                </fieldset>
                <fieldset className="mt-5 border-t border-[#f2eef7] pt-4">
                  <legend className="text-[10px] font-bold uppercase tracking-[.14em] text-[#a097ad]">Price (৳)</legend>
                  <div className="mt-2 flex items-center gap-2">
                    <label className="flex-1"><span className="sr-only">Minimum price</span><input name="min" defaultValue={min} inputMode="numeric" placeholder="Min" className="field-input !mt-0 !py-2 text-xs" /></label>
                    <span className="text-[#c3bccd]" aria-hidden>–</span>
                    <label className="flex-1"><span className="sr-only">Maximum price</span><input name="max" defaultValue={max} inputMode="numeric" placeholder="Max" className="field-input !mt-0 !py-2 text-xs" /></label>
                  </div>
                </fieldset>
                <div className="mt-4 space-y-2 border-t border-[#f2eef7] pt-4">
                  <label className="flex items-center gap-2 text-xs font-semibold text-[#655873]"><input type="checkbox" name="stock" value="true" defaultChecked={inStock} className="h-4 w-4 rounded border-[#d9d1e5] text-brand-600" /> In stock only</label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-[#655873]"><input type="checkbox" name="sale" value="true" defaultChecked={onSale} className="h-4 w-4 rounded border-[#d9d1e5] text-brand-600" /> On sale</label>
                </div>
                <label className="field-label mt-4">Sort by
                  <select name="sort" defaultValue={sort} className="field-input">
                    {sorts.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
                {category && <input type="hidden" name="category" value={category} />}
                <button className="mt-4 w-full rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-brand-700">Apply filters</button>
                {hasFilters && <Link href="/products" className="mt-2 block text-center text-[11px] font-bold text-[#8f849e] hover:text-brand-600">Clear all filters</Link>}
              </form>
              <div className="rounded-2xl bg-[#f4effb] p-5">
                <p className="flex items-center gap-1.5 text-[11px] font-extrabold text-[#4d2f7d]"><Sparkles size={13} aria-hidden /> Shopping with confidence</p>
                <p className="mt-2 text-[11px] leading-5 text-[#7a6a90]">Every listed product and seller is reviewed by ANAN before it appears here.</p>
              </div>
            </div>
          </aside>

          <div className="min-w-0">
            <details className="mb-4 rounded-2xl border border-[#eeeaf3] bg-white p-4 lg:hidden">
              <summary className="flex items-center justify-between text-sm font-extrabold text-[#302344]">
                <span className="flex items-center gap-2"><SlidersHorizontal size={15} className="text-brand-600" aria-hidden /> Filters & sorting{hasFilters ? " · active" : ""}</span>
                <span className="text-[11px] font-semibold text-brand-600">Edit</span>
              </summary>
              <form action="/products" className="mt-4 space-y-3">
                <input type="hidden" name="q" value={q} />
                <label className="field-label">Category
                  <select name="category" defaultValue={category} className="field-input">
                    <option value="">All categories</option>
                    {categories.map((item) => <option key={item.id} value={item.slug}>{item.nameEn}</option>)}
                  </select>
                </label>
                <div className="flex gap-2">
                  <label className="field-label flex-1">Min ৳<input name="min" defaultValue={min} inputMode="numeric" className="field-input" /></label>
                  <label className="field-label flex-1">Max ৳<input name="max" defaultValue={max} inputMode="numeric" className="field-input" /></label>
                </div>
                <label className="field-label">Sort by
                  <select name="sort" defaultValue={sort} className="field-input">
                    {sorts.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 text-xs font-semibold text-[#655873]"><input type="checkbox" name="stock" value="true" defaultChecked={inStock} className="h-4 w-4 rounded border-[#d9d1e5] text-brand-600" /> In stock</label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-[#655873]"><input type="checkbox" name="sale" value="true" defaultChecked={onSale} className="h-4 w-4 rounded border-[#d9d1e5] text-brand-600" /> On sale</label>
                </div>
                <button className="w-full rounded-xl bg-brand-600 px-4 py-3 text-xs font-bold text-white">Apply filters</button>
              </form>
            </details>

            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Link href={hrefFor({ category: undefined, page: undefined })} className={`rounded-full px-3.5 py-2 text-xs font-semibold ${!category ? "bg-brand-600 text-white" : "bg-white text-[#655873] ring-1 ring-[#eeeaf3] hover:ring-brand-200"}`}>All</Link>
              {categories.slice(0, 6).map((item) => (
                <Link key={item.id} href={hrefFor({ category: item.slug, page: undefined })} className={`rounded-full px-3.5 py-2 text-xs font-semibold ${category === item.slug ? "bg-brand-600 text-white" : "bg-white text-[#655873] ring-1 ring-[#eeeaf3] hover:ring-brand-200"}`}>
                  {item.nameEn.replace(/ &.*$/, "")}
                </Link>
              ))}
            </div>

            {!data ? (
              <div className="rounded-2xl border border-dashed border-[#ddd3e9] bg-white px-6 py-16 text-center">
                <PackageSearch className="mx-auto text-brand-400" size={36} aria-hidden />
                <h2 className="mt-4 font-bold text-[#302344]">Catalogue is getting ready</h2>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#92889f]">The product service is not reachable yet. Start PostgreSQL and the ANAN API, then refresh this page.</p>
              </div>
            ) : !data.items.length ? (
              <div className="rounded-2xl border border-dashed border-[#ddd3e9] bg-white px-6 py-16 text-center">
                <PackageSearch className="mx-auto text-brand-400" size={36} aria-hidden />
                <h2 className="mt-4 font-bold text-[#302344]">No products match these filters</h2>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#92889f]">Try a different keyword, widen the price range or clear a filter.</p>
                <Link href="/products" className="mt-5 inline-flex rounded-xl bg-brand-600 px-5 py-2.5 text-xs font-bold text-white">Clear filters</Link>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
                  {data.items.map((product, index) => <CatalogProductCard key={product.id} product={product} priority={index < 4} />)}
                </div>
                {totalPages > 1 && (
                  <nav aria-label="Product pages" className="mt-9 flex flex-wrap items-center justify-center gap-2">
                    {page > 1 ? (
                      <Link href={hrefFor({ page: String(page - 1) })} rel="prev" className="inline-flex items-center gap-1 rounded-xl border border-[#e8e2f0] bg-white px-3.5 py-2 text-xs font-bold text-[#5e526d] hover:border-brand-300"><ChevronLeft size={14} aria-hidden /> Previous</Link>
                    ) : (
                      <span aria-hidden className="inline-flex items-center gap-1 rounded-xl border border-[#f0edf4] px-3.5 py-2 text-xs font-bold text-[#c9c1d3]"><ChevronLeft size={14} /> Previous</span>
                    )}
                    <span className="px-2 text-xs font-semibold text-[#8f849e]">Page {page} of {totalPages}</span>
                    {page < totalPages ? (
                      <Link href={hrefFor({ page: String(page + 1) })} rel="next" className="inline-flex items-center gap-1 rounded-xl border border-[#e8e2f0] bg-white px-3.5 py-2 text-xs font-bold text-[#5e526d] hover:border-brand-300">Next <ChevronRight size={14} aria-hidden /></Link>
                    ) : (
                      <span aria-hidden className="inline-flex items-center gap-1 rounded-xl border border-[#f0edf4] px-3.5 py-2 text-xs font-bold text-[#c9c1d3]">Next <ChevronRight size={14} /></span>
                    )}
                  </nav>
                )}
              </>
            )}
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
