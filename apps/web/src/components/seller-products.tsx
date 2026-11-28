"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Archive, CheckCircle2, ImageIcon, LoaderCircle, Pencil, Plus, RefreshCw, RotateCcw, Search, Send } from "lucide-react";
import { formatTaka, prettyStatus } from "@/lib/format";

type ProductStatus = "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "ARCHIVED";
type SellerProduct = {
  id: string;
  nameEn: string;
  nameBn: string | null;
  slug: string;
  pricePaisa: string;
  compareAtPricePaisa: string | null;
  stockOnHand: number;
  status: ProductStatus;
  reviewNotes: string | null;
  updatedAt: string;
  category: { nameEn: string };
  images: { id: string; url: string | null; altText: string; status: string; isPrimary: boolean }[];
  _count: { images: number };
};
type Payload = {
  products: SellerProduct[];
  counts: Record<string, number>;
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

const statusStyles: Record<ProductStatus, string> = {
  DRAFT: "bg-[#f3eff9] text-[#6b5a80]",
  PENDING_APPROVAL: "bg-amber-50 text-amber-700",
  APPROVED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-rose-50 text-rose-700",
  ARCHIVED: "bg-[#f4f2f7] text-[#8f849e]",
};
const filters: Array<{ value: string; label: string }> = [
  { value: "ALL", label: "All products" },
  { value: "DRAFT", label: "Drafts" },
  { value: "PENDING_APPROVAL", label: "In review" },
  { value: "APPROVED", label: "Live" },
  { value: "REJECTED", label: "Needs work" },
  { value: "ARCHIVED", label: "Archived" },
];

async function api(path: string, init?: RequestInit) {
  const response = await fetch(path, { cache: "no-store", ...init });
  if (response.status === 401) {
    window.location.assign("/seller/login");
    throw new Error("Please sign in as a seller.");
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || "Something went wrong.");
  return payload;
}

export function SellerProducts() {
  const router = useRouter();
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [payload, setPayload] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async (status: string, term: string) => {
    setLoading(true);
    setError("");
    try {
      const query = new URLSearchParams();
      if (status !== "ALL") query.set("status", status);
      if (term.trim()) query.set("search", term.trim());
      const data = (await api(`/api/seller/products${query.toString() ? `?${query}` : ""}`)) as Payload;
      setPayload(data);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load products.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(filter, search);
    // Search is submitted explicitly, so only the filter triggers a reload here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, load]);

  async function act(product: SellerProduct, action: "submit" | "archive" | "restore") {
    setBusy(product.id);
    setError("");
    setMessage("");
    try {
      const data = await api(`/api/seller/products/${product.id}/${action}`, { method: "POST" });
      setMessage(data.message || "Product updated.");
      await load(filter, search);
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Action failed.");
    } finally {
      setBusy("");
    }
  }

  const products = payload?.products ?? [];
  const counts = payload?.counts ?? {};

  return (
    <div className="container-shell py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.18em] text-brand-600">Seller Centre</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-[-1px] text-[#281743]">Your products</h1>
          <p className="mt-1 text-sm text-[#82788f]">Create drafts, manage images and submit products for Admin review.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => void load(filter, search)} className="inline-flex items-center gap-2 rounded-xl border border-[#e8e2f0] bg-white px-4 py-2.5 text-xs font-bold text-[#5e526d] hover:border-brand-300"><RefreshCw size={14} aria-hidden /> Refresh</button>
          <Link href="/seller/products/new" className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-brand-700"><Plus size={15} aria-hidden /> Add product</Link>
        </div>
      </header>

      <section aria-label="Product totals" className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Live", value: counts.APPROVED ?? 0 },
          { label: "In review", value: counts.PENDING_APPROVAL ?? 0 },
          { label: "Drafts", value: counts.DRAFT ?? 0 },
          { label: "Needs work", value: counts.REJECTED ?? 0 },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-[#eee8f5] bg-white p-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#8b8097]">{item.label}</p>
            <p className="mt-1.5 text-2xl font-extrabold text-[#281743]">{item.value}</p>
          </div>
        ))}
      </section>

      <div className="mt-7 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <nav aria-label="Filter products" className="flex gap-2 overflow-x-auto soft-scrollbar">
          {filters.map((option) => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value)}
              aria-pressed={filter === option.value}
              className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-bold ${filter === option.value ? "bg-brand-600 text-white" : "border border-[#e8e2f0] bg-white text-[#655873] hover:border-brand-300"}`}
            >
              {option.label}
            </button>
          ))}
        </nav>
        <form
          onSubmit={(event) => { event.preventDefault(); void load(filter, search); }}
          className="flex h-11 items-center gap-2 rounded-xl border border-[#e8e2f0] bg-white px-3 lg:w-72"
        >
          <Search size={15} className="text-[#9b91a8]" aria-hidden />
          <input value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Search your products" placeholder="Search products" className="w-full bg-transparent text-sm outline-none" />
        </form>
      </div>

      {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-xs text-red-700">{error}</p>}
      {message && <p role="status" className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-700"><CheckCircle2 size={14} aria-hidden />{message}</p>}

      {loading ? (
        <p className="py-20 text-center text-sm text-[#82788f]">Loading your products…</p>
      ) : !products.length ? (
        <div className="mt-6 rounded-2xl border border-dashed border-[#ded5e9] bg-white p-12 text-center">
          <p className="font-bold text-[#302344]">{filter === "ALL" ? "No products yet" : "Nothing in this view"}</p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#82788f]">A product needs a name, category, price, stock and at least one image before it can be reviewed.</p>
          <Link href="/seller/products/new" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-xs font-bold text-white"><Plus size={14} aria-hidden /> Add your first product</Link>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {products.map((product) => {
            const image = product.images.find((item) => item.url);
            const primary = product.images.find((item) => item.isPrimary && item.url) ?? image;
            return (
              <article key={product.id} className="rounded-2xl border border-[#eee8f5] bg-white p-4 sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#f6f2fa] text-brand-300">
                    {primary?.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={primary.url} alt={primary.altText} className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon size={26} strokeWidth={1.4} aria-hidden />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`badge ${statusStyles[product.status]}`}>{prettyStatus(product.status)}</span>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#a097ad]">{product.category.nameEn}</span>
                      <span className="text-[10px] text-[#a097ad]">· {product._count.images} {product._count.images === 1 ? "image" : "images"}</span>
                    </div>
                    <h2 className="mt-1.5 truncate text-sm font-extrabold text-[#302344] sm:text-base">{product.nameEn}</h2>
                    {product.nameBn && <p className="mt-0.5 text-xs text-[#91869e]">{product.nameBn}</p>}
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#82788f]">
                      <span className="font-extrabold text-[#302344]">{formatTaka(product.pricePaisa)}</span>
                      {product.compareAtPricePaisa && <span className="line-through">{formatTaka(product.compareAtPricePaisa)}</span>}
                      <span>{product.stockOnHand > 0 ? `${product.stockOnHand} in stock` : "Out of stock"}</span>
                    </div>
                    {product.status === "REJECTED" && product.reviewNotes && (
                      <p className="mt-2 rounded-lg bg-rose-50 p-2 text-[11px] leading-5 text-rose-700">Admin notes: {product.reviewNotes}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <Link href={`/seller/products/${product.id}`} className="inline-flex items-center gap-1.5 rounded-lg border border-[#e8e2f0] px-3 py-2 text-xs font-bold text-[#5e526d] hover:border-brand-300"><Pencil size={13} aria-hidden /> Edit</Link>
                    <Link href={`/seller/products/${product.id}/images`} className="inline-flex items-center gap-1.5 rounded-lg border border-[#e8e2f0] px-3 py-2 text-xs font-bold text-[#5e526d] hover:border-brand-300"><ImageIcon size={13} aria-hidden /> Images</Link>
                    {(product.status === "DRAFT" || product.status === "REJECTED") && (
                      <button disabled={busy === product.id || product._count.images < 1} onClick={() => void act(product, "submit")} title={product._count.images < 1 ? "Add at least one image first" : undefined} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">
                        {busy === product.id ? <LoaderCircle size={13} className="animate-spin" aria-hidden /> : <Send size={13} aria-hidden />} Submit
                      </button>
                    )}
                    {product.status !== "ARCHIVED" && product.status !== "PENDING_APPROVAL" && (
                      <button disabled={busy === product.id} onClick={() => void act(product, "archive")} className="inline-flex items-center gap-1.5 rounded-lg border border-[#e8e2f0] px-3 py-2 text-xs font-bold text-[#8f849e] hover:border-rose-200 hover:text-rose-700 disabled:opacity-50"><Archive size={13} aria-hidden /> Archive</button>
                    )}
                    {product.status === "ARCHIVED" && (
                      <button disabled={busy === product.id} onClick={() => void act(product, "restore")} className="inline-flex items-center gap-1.5 rounded-lg border border-[#e8e2f0] px-3 py-2 text-xs font-bold text-[#5e526d] hover:border-brand-300 disabled:opacity-50"><RotateCcw size={13} aria-hidden /> Restore</button>
                    )}
                  </div>
                </div>
                {product.status === "PENDING_APPROVAL" && <p className="mt-3 border-t border-[#f4f0f8] pt-3 text-[11px] text-[#91869e]">Waiting for Admin review. You can keep editing images, but the listing is not public until it is approved.</p>}
                {product.status === "APPROVED" && <p className="mt-3 border-t border-[#f4f0f8] pt-3 text-[11px] text-[#91869e]">Live in the public catalogue. <Link href={`/products/${encodeURIComponent(product.slug)}`} className="font-bold text-brand-700 underline">View public page</Link></p>}
              </article>
            );
          })}
        </div>
      )}

      <p className="mt-8 flex items-start gap-2 text-[11px] leading-5 text-[#91869e]">
        <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-brand-500" aria-hidden />
        Product publishing requires Admin approval. Images are reviewed separately, so a live product may still be waiting for its first approved photo.
      </p>
    </div>
  );
}
