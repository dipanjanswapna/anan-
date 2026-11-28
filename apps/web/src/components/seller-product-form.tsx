"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, Archive, CheckCircle2, ImageIcon, LoaderCircle, RotateCcw, Send } from "lucide-react";
import { formatTaka, paisaToTakaInput, prettyStatus, takaToPaisa } from "@/lib/format";

type Category = { id: string; nameEn: string; nameBn: string | null; slug: string };
type ProductStatus = "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "ARCHIVED";
type SellerProduct = {
  id: string;
  nameEn: string;
  nameBn: string | null;
  slug: string;
  descriptionEn: string | null;
  descriptionBn: string | null;
  pricePaisa: string;
  compareAtPricePaisa: string | null;
  stockOnHand: number;
  status: ProductStatus;
  reviewNotes: string | null;
  category: { id: string; nameEn: string };
  images: { id: string; url: string | null; altText: string; status: string; isPrimary: boolean }[];
  _count: { images: number };
};

const statusStyles: Record<ProductStatus, string> = {
  DRAFT: "bg-[#f3eff9] text-[#6b5a80]",
  PENDING_APPROVAL: "bg-amber-50 text-amber-700",
  APPROVED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-rose-50 text-rose-700",
  ARCHIVED: "bg-[#f4f2f7] text-[#8f849e]",
};

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

function FieldSet({ categories, product }: { categories: Category[]; product?: SellerProduct }) {
  const [nameEn, setNameEn] = useState(product?.nameEn ?? "");
  const [nameBn, setNameBn] = useState(product?.nameBn ?? "");
  const [categoryId, setCategoryId] = useState(product?.category.id ?? categories[0]?.id ?? "");
  const [descriptionEn, setDescriptionEn] = useState(product?.descriptionEn ?? "");
  const [descriptionBn, setDescriptionBn] = useState(product?.descriptionBn ?? "");
  const [price, setPrice] = useState(product ? paisaToTakaInput(product.pricePaisa) : "");
  const [compareAt, setCompareAt] = useState(product ? paisaToTakaInput(product.compareAtPricePaisa) : "");
  const [stock, setStock] = useState(product ? String(product.stockOnHand) : "0");

  return (
    <div className="grid gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="field-label">Product name (English) *
          <input name="nameEn" value={nameEn} onChange={(event) => setNameEn(event.target.value)} maxLength={160} required minLength={3} placeholder="e.g. Handwoven cotton throw" className="field-input" />
          <span className="field-hint">Shown to customers. Keep it specific and easy to search.</span>
        </label>
        <label className="field-label">Product name (বাংলা)
          <input name="nameBn" value={nameBn} onChange={(event) => setNameBn(event.target.value)} maxLength={160} placeholder="ঐচ্ছিক বাংলা নাম" className="field-input" />
          <span className="field-hint">Optional. Helps Bangla-speaking customers find it.</span>
        </label>
      </div>
      <label className="field-label">Category *
        <select name="categoryId" value={categoryId} onChange={(event) => setCategoryId(event.target.value)} required className="field-input">
          {categories.length === 0 && <option value="">No category available</option>}
          {categories.map((category) => <option key={category.id} value={category.id}>{category.nameEn}{category.nameBn ? ` — ${category.nameBn}` : ""}</option>)}
        </select>
      </label>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="field-label">Price (৳) *
          <input name="price" value={price} onChange={(event) => setPrice(event.target.value)} inputMode="decimal" required placeholder="1250" className="field-input" />
        </label>
        <label className="field-label">Compare-at price (৳)
          <input name="compareAt" value={compareAt} onChange={(event) => setCompareAt(event.target.value)} inputMode="decimal" placeholder="1490" className="field-input" />
          <span className="field-hint">Must be higher than the price. Leave empty for no markdown.</span>
        </label>
        <label className="field-label">Stock on hand *
          <input name="stock" value={stock} onChange={(event) => setStock(event.target.value)} inputMode="numeric" required className="field-input" />
        </label>
      </div>
      <label className="field-label">Description (English)
        <textarea name="descriptionEn" value={descriptionEn} onChange={(event) => setDescriptionEn(event.target.value)} maxLength={5000} rows={5} placeholder="Materials, size, what's included, care instructions…" className="field-input resize-y" />
      </label>
      <label className="field-label">Description (বাংলা)
        <textarea name="descriptionBn" value={descriptionBn} onChange={(event) => setDescriptionBn(event.target.value)} maxLength={5000} rows={4} placeholder="ঐচ্ছিক বাংলা বিবরণ" className="field-input resize-y" />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-[#eee8f5] bg-[#fcfbfe] p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#a097ad]">Live preview</p>
          <p className="mt-2 line-clamp-2 text-sm font-bold text-[#302344]">{nameEn.trim() || "Your product name"}</p>
          <p className="mt-1 text-lg font-extrabold text-[#281743]">{price && takaToPaisa(price) !== null ? formatTaka(takaToPaisa(price)!) : "৳—"}{compareAt && takaToPaisa(compareAt) !== null && <span className="ml-2 text-xs font-medium text-[#aaa2b3] line-through">{formatTaka(takaToPaisa(compareAt)!)}</span>}</p>
          <p className="mt-1 text-[11px] text-[#91869e]">{Number.parseInt(stock, 10) > 0 ? `${stock} in stock` : "Out of stock"}</p>
        </div>
        <div className="rounded-2xl bg-[#f4effb] p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#7a5fa0]">Review checklist</p>
          <ul className="mt-2 space-y-1 text-[11px] leading-5 text-[#7a6a90]">
            <li>• Clear English name and correct category</li>
            <li>• Honest price in taka; compare-at only if genuinely higher</li>
            <li>• At least one product image with alt text</li>
            <li>• Accurate stock; orders revalidate stock at checkout</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export function SellerProductCreateForm({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const pricePaisa = takaToPaisa(String(form.get("price") ?? ""));
    const compareRaw = String(form.get("compareAt") ?? "").trim();
    const comparePaisa = compareRaw ? takaToPaisa(compareRaw) : null;
    const stockOnHand = Number.parseInt(String(form.get("stock") ?? ""), 10);
    if (pricePaisa === null || pricePaisa < 100) { setError("Enter a price of at least ৳1."); return; }
    if (compareRaw && comparePaisa === null) { setError("Compare-at price is not a valid amount."); return; }
    if (comparePaisa !== null && comparePaisa <= pricePaisa) { setError("Compare-at price must be higher than the price."); return; }
    if (!Number.isInteger(stockOnHand) || stockOnHand < 0) { setError("Stock must be a whole number of 0 or more."); return; }
    setBusy(true);
    setError("");
    try {
      const data = await api("/api/seller/products", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          nameEn: String(form.get("nameEn") ?? "").trim(),
          nameBn: String(form.get("nameBn") ?? "").trim() || undefined,
          categoryId: String(form.get("categoryId") ?? ""),
          descriptionEn: String(form.get("descriptionEn") ?? "").trim() || undefined,
          descriptionBn: String(form.get("descriptionBn") ?? "").trim() || undefined,
          pricePaisa,
          ...(comparePaisa !== null ? { compareAtPricePaisa: comparePaisa } : {}),
          stockOnHand,
        }),
      });
      router.push(`/seller/products/${data.product.id}?created=1`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not create the product.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-6 rounded-2xl border border-[#eee8f5] bg-white p-5 sm:p-7">
      <FieldSet categories={categories} />
      {error && <p role="alert" className="mt-5 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-700"><AlertCircle size={14} aria-hidden />{error}</p>}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button disabled={busy || !categories.length} className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-xs font-bold text-white hover:bg-brand-700 disabled:opacity-50">
          {busy ? <LoaderCircle size={14} className="animate-spin" aria-hidden /> : <CheckCircle2 size={14} aria-hidden />} Save draft
        </button>
        <Link href="/seller/products" className="rounded-xl border border-[#e8e2f0] px-4 py-3 text-xs font-bold text-[#5e526d] hover:border-brand-300">Cancel</Link>
        <p className="text-[11px] text-[#91869e]">Saved as a draft. Nothing is public until you add an image and submit it for review.</p>
      </div>
    </form>
  );
}

export function SellerProductEditor({ productId, categories, created = false }: { productId: string; categories: Category[]; created?: boolean }) {
  const router = useRouter();
  const [product, setProduct] = useState<SellerProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<"save" | "submit" | "archive" | "restore" | "">("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState(created ? "Draft created. Add at least one image, then submit it for review." : "");

  useEffect(() => {
    void api(`/api/seller/products/${productId}`)
      .then((data) => setProduct(data.product as SellerProduct))
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Unable to load this product."))
      .finally(() => setLoading(false));
  }, [productId]);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!product) return;
    const form = new FormData(event.currentTarget);
    const pricePaisa = takaToPaisa(String(form.get("price") ?? ""));
    const compareRaw = String(form.get("compareAt") ?? "").trim();
    const comparePaisa = compareRaw ? takaToPaisa(compareRaw) : null;
    const stockOnHand = Number.parseInt(String(form.get("stock") ?? ""), 10);
    if (pricePaisa === null || pricePaisa < 100) { setError("Enter a price of at least ৳1."); return; }
    if (compareRaw && comparePaisa === null) { setError("Compare-at price is not a valid amount."); return; }
    if (comparePaisa !== null && comparePaisa <= pricePaisa) { setError("Compare-at price must be higher than the price."); return; }
    if (!Number.isInteger(stockOnHand) || stockOnHand < 0) { setError("Stock must be a whole number of 0 or more."); return; }
    setBusy("save");
    setError("");
    setMessage("");
    try {
      const data = await api(`/api/seller/products/${product.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          nameEn: String(form.get("nameEn") ?? "").trim(),
          nameBn: String(form.get("nameBn") ?? "").trim(),
          categoryId: String(form.get("categoryId") ?? ""),
          descriptionEn: String(form.get("descriptionEn") ?? "").trim(),
          descriptionBn: String(form.get("descriptionBn") ?? "").trim(),
          pricePaisa,
          compareAtPricePaisa: comparePaisa,
          stockOnHand,
        }),
      });
      setProduct(data.product as SellerProduct);
      setMessage(data.message || "Product saved.");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save changes.");
    } finally {
      setBusy("");
    }
  }

  async function lifecycle(action: "submit" | "archive" | "restore") {
    if (!product) return;
    setBusy(action);
    setError("");
    setMessage("");
    try {
      const data = await api(`/api/seller/products/${product.id}/${action}`, { method: "POST" });
      setProduct(data.product as SellerProduct);
      setMessage(data.message || "Product updated.");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Action failed.");
    } finally {
      setBusy("");
    }
  }

  if (loading) return <p className="py-20 text-center text-sm text-[#82788f]">Loading product…</p>;
  if (!product) return <div className="mt-6 rounded-2xl border border-dashed border-[#ded5e9] bg-white p-10 text-center"><p className="font-bold text-[#302344]">Product unavailable</p><p className="mt-2 text-sm text-rose-700">{error}</p><Link href="/seller/products" className="mt-4 inline-block text-xs font-bold text-brand-700 underline">Back to products</Link></div>;

  const imageCount = product.images.length;
  const canSubmit = product.status === "DRAFT" || product.status === "REJECTED";

  return (
    <div className="mt-6 grid gap-5 lg:grid-cols-[1.6fr_.9fr]">
      <form onSubmit={save} className="rounded-2xl border border-[#eee8f5] bg-white p-5 sm:p-7">
        <FieldSet key={product.id + product.status} categories={categories} product={product} />
        {error && <p role="alert" className="mt-5 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-700"><AlertCircle size={14} aria-hidden />{error}</p>}
        {message && <p role="status" className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-700"><CheckCircle2 size={14} aria-hidden />{message}</p>}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button disabled={busy !== ""} className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-xs font-bold text-white hover:bg-brand-700 disabled:opacity-50">
            {busy === "save" ? <LoaderCircle size={14} className="animate-spin" aria-hidden /> : <CheckCircle2 size={14} aria-hidden />} Save changes
          </button>
          <Link href="/seller/products" className="rounded-xl border border-[#e8e2f0] px-4 py-3 text-xs font-bold text-[#5e526d] hover:border-brand-300">Back to products</Link>
        </div>
      </form>

      <aside className="space-y-4">
        <section className="rounded-2xl border border-[#eee8f5] bg-white p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-extrabold text-[#302344]">Listing status</h2>
            <span className={`badge ${statusStyles[product.status]}`}>{prettyStatus(product.status)}</span>
          </div>
          <p className="mt-2 text-[11px] leading-5 text-[#82788f]">
            {product.status === "DRAFT" && "Only you can see this draft. Add an image, then submit it for Admin review."}
            {product.status === "PENDING_APPROVAL" && "Submitted and waiting for Admin review. It is not in the public catalogue yet."}
            {product.status === "APPROVED" && "Live in the public catalogue. Your approved images appear on the product page."}
            {product.status === "REJECTED" && "Admin asked for changes. Edit the listing, then submit it again."}
            {product.status === "ARCHIVED" && "Archived and hidden from customers. Restore it to continue editing."}
          </p>
          {product.status === "REJECTED" && product.reviewNotes && <p className="mt-3 rounded-xl bg-rose-50 p-3 text-[11px] leading-5 text-rose-700">Admin notes: {product.reviewNotes}</p>}
          <div className="mt-4 space-y-2">
            {canSubmit && (
              <button onClick={() => void lifecycle("submit")} disabled={busy !== "" || imageCount < 1} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">
                {busy === "submit" ? <LoaderCircle size={14} className="animate-spin" aria-hidden /> : <Send size={14} aria-hidden />} Submit for review
              </button>
            )}
            {product.status !== "ARCHIVED" && product.status !== "PENDING_APPROVAL" && (
              <button onClick={() => void lifecycle("archive")} disabled={busy !== ""} className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#e8e2f0] px-4 py-2.5 text-xs font-bold text-[#8f849e] hover:border-rose-200 hover:text-rose-700 disabled:opacity-50"><Archive size={14} aria-hidden /> Archive listing</button>
            )}
            {product.status === "ARCHIVED" && (
              <button onClick={() => void lifecycle("restore")} disabled={busy !== ""} className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#e8e2f0] px-4 py-2.5 text-xs font-bold text-[#5e526d] hover:border-brand-300 disabled:opacity-50"><RotateCcw size={14} aria-hidden /> Restore as draft</button>
            )}
            {canSubmit && imageCount < 1 && <p className="text-[11px] text-[#a097ad]">Add at least one image before submitting.</p>}
          </div>
        </section>

        <section className="rounded-2xl border border-[#eee8f5] bg-white p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-extrabold text-[#302344]">Images</h2>
            <span className="text-[10px] font-bold text-[#a097ad]">{imageCount}/8</span>
          </div>
          <div className="mt-3 flex gap-2">
            {product.images.length ? product.images.slice(0, 4).map((image) => (
              <div key={image.id} className="h-14 w-14 overflow-hidden rounded-lg bg-[#f6f2fa]">
                {image.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={image.url} alt={image.altText} className="h-full w-full object-cover" />
                ) : <ImageIcon size={18} className="m-auto mt-4 text-brand-300" aria-hidden />}
              </div>
            )) : <p className="text-[11px] text-[#91869e]">No images yet. Images need Admin approval before they appear publicly.</p>}
          </div>
          <Link href={`/seller/products/${product.id}/images`} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#e8e2f0] px-4 py-2.5 text-xs font-bold text-[#5e526d] hover:border-brand-300"><ImageIcon size={14} aria-hidden /> Manage images</Link>
        </section>

        <section className="rounded-2xl bg-[#f4effb] p-5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#7a5fa0]">Public link</p>
          {product.status === "APPROVED" ? (
            <Link href={`/products/${encodeURIComponent(product.slug)}`} className="mt-1.5 block break-all text-[11px] font-bold text-brand-700 underline">/products/{product.slug}</Link>
          ) : (
            <p className="mt-1.5 break-all text-[11px] text-[#7a6a90]">/products/{product.slug}<br /><span className="text-[#a097ad]">Available after approval.</span></p>
          )}
        </section>
      </aside>
    </div>
  );
}
