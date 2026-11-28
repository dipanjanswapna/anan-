"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, Check, CheckCircle2, ImageOff, LoaderCircle, RefreshCw, Search, X } from "lucide-react";
import { formatDateTime, formatTaka, prettyStatus } from "@/lib/format";

type ProductStatus = "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "ARCHIVED";
type AdminProduct = {
  id: string;
  nameEn: string;
  nameBn: string | null;
  slug: string;
  status: ProductStatus;
  pricePaisa: string;
  compareAtPricePaisa: string | null;
  stockOnHand: number;
  reviewNotes: string | null;
  reviewedAt: string | null;
  updatedAt: string;
  seller: { id: string; storeName: string; storeSlug: string };
  category: { id: string; nameEn: string; slug: string };
  images: { id: string; url: string | null; altText: string; status: string; isPrimary: boolean }[];
};
type Payload = { products: AdminProduct[]; counts: Record<string, number>; pagination: { total: number } };

const tabs: Array<{ value: ProductStatus; label: string }> = [
  { value: "PENDING_APPROVAL", label: "Awaiting review" },
  { value: "APPROVED", label: "Live" },
  { value: "REJECTED", label: "Rejected" },
  { value: "DRAFT", label: "Drafts" },
  { value: "ARCHIVED", label: "Archived" },
];

async function api(path: string, init?: RequestInit) {
  const response = await fetch(path, { cache: "no-store", ...init });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || "Something went wrong.");
  return payload;
}

export function AdminProducts() {
  const [status, setStatus] = useState<ProductStatus>("PENDING_APPROVAL");
  const [search, setSearch] = useState("");
  const [payload, setPayload] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [openReject, setOpenReject] = useState("");

  const load = useCallback(async (nextStatus: ProductStatus, term: string) => {
    setLoading(true);
    setError("");
    try {
      const query = new URLSearchParams({ status: nextStatus });
      if (term.trim()) query.set("search", term.trim());
      setPayload((await api(`/api/admin/products?${query}`)) as Payload);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load products.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(status, search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, load]);

  async function review(product: AdminProduct, action: "APPROVE" | "REJECT") {
    const note = (notes[product.id] ?? "").trim();
    if (action === "REJECT" && !note) {
      setError("Add a short note so the seller knows what to fix.");
      setOpenReject(product.id);
      return;
    }
    setBusy(product.id);
    setError("");
    setMessage("");
    try {
      const data = await api(`/api/admin/products/${product.id}/review`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, notes: note || undefined }),
      });
      setMessage(data.message || "Product reviewed.");
      setOpenReject("");
      setNotes((current) => ({ ...current, [product.id]: "" }));
      await load(status, search);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Review failed.");
    } finally {
      setBusy("");
    }
  }

  const products = payload?.products ?? [];
  const counts = payload?.counts ?? {};

  return (
    <main className="min-h-screen bg-[#faf9fc]">
      <div className="container-shell py-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-brand-600">ANAN Admin Console</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-[-1px] text-[#281743]">Product review</h1>
            <p className="mt-1 text-sm text-[#82788f]">Approve the listings that appear in the public catalogue. Images are reviewed separately.</p>
          </div>
          <nav className="flex flex-wrap gap-2 text-xs font-bold">
            <Link href="/admin/orders" className="rounded-xl border border-[#e8e2f0] bg-white px-4 py-2.5 text-[#5e526d] hover:border-brand-300">Orders</Link>
            <Link href="/admin/product-images" className="rounded-xl border border-[#e8e2f0] bg-white px-4 py-2.5 text-[#5e526d] hover:border-brand-300">Images</Link>
            <Link href="/admin/returns" className="rounded-xl border border-[#e8e2f0] bg-white px-4 py-2.5 text-[#5e526d] hover:border-brand-300">Returns</Link>
            <Link href="/admin/notifications" className="rounded-xl border border-[#e8e2f0] bg-white px-4 py-2.5 text-[#5e526d] hover:border-brand-300">Notifications</Link>
            <button onClick={() => void load(status, search)} className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-white"><RefreshCw size={14} aria-hidden /> Refresh</button>
          </nav>
        </header>

        <section aria-label="Product totals" className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {tabs.map((tab) => (
            <div key={tab.value} className="rounded-2xl border border-[#eee8f5] bg-white p-4">
              <p className="text-[11px] font-bold uppercase tracking-wide text-[#82788f]">{tab.label}</p>
              <p className="mt-1.5 text-2xl font-extrabold text-[#302344]">{counts[tab.value] ?? 0}</p>
            </div>
          ))}
        </section>

        <div className="mt-7 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <nav aria-label="Filter products" className="flex gap-2 overflow-x-auto soft-scrollbar">
            {tabs.map((tab) => (
              <button key={tab.value} onClick={() => setStatus(tab.value)} aria-pressed={status === tab.value} className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-bold ${status === tab.value ? "bg-brand-600 text-white" : "border border-[#e8e2f0] bg-white text-[#655873] hover:border-brand-300"}`}>{tab.label}</button>
            ))}
          </nav>
          <form onSubmit={(event) => { event.preventDefault(); void load(status, search); }} className="flex h-11 items-center gap-2 rounded-xl border border-[#e8e2f0] bg-white px-3 lg:w-72">
            <Search size={15} className="text-[#9b91a8]" aria-hidden />
            <input value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Search products or stores" placeholder="Product or store" className="w-full bg-transparent text-sm outline-none" />
          </form>
        </div>

        {error && <p role="alert" className="mt-5 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-700"><AlertCircle size={14} aria-hidden />{error}</p>}
        {message && <p role="status" className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-700"><CheckCircle2 size={14} aria-hidden />{message}</p>}

        {loading ? (
          <p className="py-20 text-center text-sm text-[#82788f]">Loading products…</p>
        ) : !products.length ? (
          <div className="mt-6 rounded-2xl border border-dashed border-[#ded5e9] bg-white p-12 text-center text-sm text-[#82788f]">Nothing in this view.</div>
        ) : (
          <div className="mt-5 space-y-4">
            {products.map((product) => {
              const pendingImage = product.images[0];
              return (
                <article key={product.id} className="rounded-2xl border border-[#eee8f5] bg-white p-5">
                  <div className="flex flex-col gap-4 lg:flex-row">
                    <div className="flex h-32 w-full shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#f6f2fa] text-brand-300 lg:h-28 lg:w-28">
                      {pendingImage?.url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={pendingImage.url} alt={pendingImage.altText} className="h-full w-full object-cover" />
                      ) : (
                        <div className="p-2 text-center"><ImageOff size={22} className="mx-auto" aria-hidden /><span className="mt-1 block text-[9px] leading-4 text-[#a097ad]">{pendingImage ? "Storage URL not configured" : "No image uploaded"}</span></div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="badge bg-[#f3eff9] text-[#6b5a80]">{prettyStatus(product.status)}</span>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-600">{product.category.nameEn}</span>
                        {product.images.length > 0 && <span className="text-[10px] text-[#a097ad]">· {product.images.length} image(s), {product.images.filter((image) => image.status === "APPROVED").length} approved</span>}
                      </div>
                      <h2 className="mt-1.5 text-base font-extrabold text-[#302344]">{product.nameEn}</h2>
                      {product.nameBn && <p className="text-xs text-[#91869e]">{product.nameBn}</p>}
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#82788f]">
                        <span className="font-extrabold text-[#302344]">{formatTaka(product.pricePaisa)}</span>
                        {product.compareAtPricePaisa && <span className="line-through">{formatTaka(product.compareAtPricePaisa)}</span>}
                        <span>{product.stockOnHand} in stock</span>
                        <span>Seller: <Link href={`/stores/${encodeURIComponent(product.seller.storeSlug)}`} className="font-bold text-brand-700 underline">{product.seller.storeName}</Link></span>
                      </div>
                      <p className="mt-1 text-[11px] text-[#a097ad]">Submitted {formatDateTime(product.updatedAt)}{product.reviewNotes ? ` · Last note: ${product.reviewNotes}` : ""}</p>
                    </div>
                    <div className="flex shrink-0 flex-col gap-2 lg:w-40">
                      {product.status === "PENDING_APPROVAL" ? (
                        <>
                          <button disabled={busy === product.id} onClick={() => void review(product, "APPROVE")} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2.5 text-xs font-bold text-white disabled:opacity-50">{busy === product.id ? <LoaderCircle size={13} className="animate-spin" aria-hidden /> : <Check size={13} aria-hidden />} Approve</button>
                          <button disabled={busy === product.id} onClick={() => setOpenReject(openReject === product.id ? "" : product.id)} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-rose-200 px-3 py-2.5 text-xs font-bold text-rose-700 disabled:opacity-50"><X size={13} aria-hidden /> Reject</button>
                        </>
                      ) : null}
                      {product.status === "APPROVED" && <Link href={`/products/${encodeURIComponent(product.slug)}`} className="inline-flex items-center justify-center rounded-lg border border-[#e8e2f0] px-3 py-2 text-xs font-bold text-[#5e526d] hover:border-brand-300">View public page</Link>}
                    </div>
                  </div>
                  {openReject === product.id && product.status === "PENDING_APPROVAL" && (
                    <div className="mt-4 border-t border-[#f2eef7] pt-4">
                      <label className="field-label">Reason for rejection (sent to the seller)
                        <textarea value={notes[product.id] ?? ""} onChange={(event) => setNotes((current) => ({ ...current, [product.id]: event.target.value }))} rows={2} maxLength={1000} placeholder="e.g. Price is inconsistent with the description. Please correct and resubmit." className="field-input resize-y" />
                      </label>
                      <div className="mt-3 flex gap-2">
                        <button disabled={busy === product.id} onClick={() => void review(product, "REJECT")} className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50">Confirm rejection</button>
                        <button onClick={() => setOpenReject("")} className="rounded-lg px-3 py-2 text-xs font-bold text-[#5e526d]">Cancel</button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
        <p className="mt-8 text-[11px] leading-5 text-[#91869e]">Approving a product publishes it to the catalogue; its images are only shown after image review. Every review action is written to the Admin audit log.</p>
      </div>
    </main>
  );
}
