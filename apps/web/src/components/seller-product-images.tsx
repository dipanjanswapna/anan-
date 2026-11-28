"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ImagePlus, RefreshCw, Upload } from "lucide-react";

type ImageRecord = { id: string; publicUrl: string; altText: string; status: "PENDING" | "APPROVED" | "REJECTED"; rejectionReason: string | null; isPrimary: boolean };

export function SellerProductImages({ productId }: { productId: string }) {
  const [images, setImages] = useState<ImageRecord[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [altText, setAltText] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    const response = await fetch(`/api/seller/products/${productId}/images/list`, { cache: "no-store" });
    if (response.status === 401) { window.location.assign("/seller/login"); return; }
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.message || "Unable to load images.");
    setImages(payload.images || []);
  }

  useEffect(() => {
    void load().catch((reason) => setError(reason instanceof Error ? reason.message : "Unable to load images."))
      .finally(() => setLoading(false));
  }, [productId]);

  async function upload() {
    if (!file) { setError("Choose an image first."); return; }
    if (!altText.trim()) { setError("Add descriptive alt text."); return; }
    setUploading(true); setError(""); setMessage("");
    try {
      const start = await fetch(`/api/seller/products/${productId}/images/upload`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ contentType: file.type, sizeBytes: file.size, altText: altText.trim() }),
      });
      const signed = await start.json();
      if (!start.ok) throw new Error(signed.message || "Unable to start image upload.");
      const uploaded = await fetch(signed.uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
      if (!uploaded.ok) throw new Error("Object storage rejected the upload. Check the S3 CORS configuration.");
      const complete = await fetch(`/api/seller/products/${productId}/images/complete`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ storageKey: signed.storageKey, contentType: file.type, sizeBytes: file.size, altText: altText.trim() }),
      });
      const result = await complete.json();
      if (!complete.ok) throw new Error(result.message || "Unable to submit image for review.");
      setMessage("Image uploaded and submitted for Admin review. It will appear publicly after approval.");
      setFile(null); setAltText("");
      const input = document.getElementById("product-image-file") as HTMLInputElement | null;
      if (input) input.value = "";
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Image upload failed.");
    } finally { setUploading(false); }
  }

  return (
    <main className="min-h-screen bg-[#faf9fc]">
      <div className="container-shell max-w-5xl py-9">
        <Link href="/seller/dashboard" className="inline-flex items-center gap-2 text-xs font-bold text-brand-700"><ArrowLeft size={15}/> Seller dashboard</Link>
        <header className="mt-5"><p className="text-xs font-bold uppercase tracking-[.18em] text-brand-600">Seller Centre</p><h1 className="mt-2 flex items-center gap-2 text-3xl font-extrabold text-[#281743]"><ImagePlus size={27}/> Product images</h1><p className="mt-2 text-sm text-[#82788f]">Upload up to 8 product images. Images are private from the public catalogue until Admin approval.</p><p className="mt-1 break-all text-xs text-[#a097ad]">Product ID: {productId}</p></header>
        <section className="mt-7 rounded-2xl border border-[#eee8f5] bg-white p-5 sm:p-7">
          <h2 className="font-extrabold text-[#302344]">Add a product image</h2>
          <p className="mt-1 text-xs text-[#82788f]">JPEG, PNG, WebP or AVIF · maximum 10 MB · descriptive alt text required.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <label className="block text-xs font-bold text-[#5e526d]">Image file<input id="product-image-file" type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(event) => setFile(event.target.files?.[0] || null)} className="mt-2 block w-full text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-[#f2edf8] file:px-3 file:py-2 file:text-xs file:font-bold file:text-brand-700"/></label>
            <label className="block text-xs font-bold text-[#5e526d]">Alt text<input value={altText} onChange={(event) => setAltText(event.target.value)} maxLength={180} placeholder="Describe the product and view" className="mt-2 w-full rounded-xl border border-[#e8e2f0] px-3 py-2.5 text-sm outline-none focus:border-brand-400"/></label>
            <button disabled={uploading || !file} onClick={() => void upload()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-xs font-bold text-white disabled:opacity-50"><Upload size={15}/>{uploading ? "Uploading…" : "Upload image"}</button>
          </div>
          {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-xs text-red-700">{error}</p>}
          {message && <p role="status" className="mt-4 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-700">{message}</p>}
        </section>
        <div className="mt-8 flex items-center justify-between"><h2 className="text-lg font-extrabold text-[#281743]">Image library</h2><button onClick={() => { setLoading(true); void load().catch((reason) => setError(reason instanceof Error ? reason.message : "Refresh failed.")).finally(() => setLoading(false)); }} className="inline-flex items-center gap-2 rounded-xl border border-[#e8e2f0] bg-white px-3 py-2 text-xs font-bold text-[#5e526d]"><RefreshCw size={14}/> Refresh</button></div>
        {loading ? <p className="py-12 text-center text-sm text-[#82788f]">Loading images…</p> : !images.length ? <p className="mt-4 rounded-2xl border border-dashed border-[#ded5e9] bg-white p-10 text-center text-sm text-[#82788f]">No images added yet.</p> :
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{images.map((image) => <article key={image.id} className="overflow-hidden rounded-2xl border border-[#eee8f5] bg-white">
            <div className="flex aspect-[4/3] items-center justify-center bg-[#f6f2fa]"><img src={image.publicUrl} alt={image.altText} className="h-full w-full object-contain"/></div>
            <div className="p-4"><div className="flex items-center justify-between gap-2"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${image.status === "APPROVED" ? "bg-emerald-50 text-emerald-700" : image.status === "REJECTED" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"}`}>{image.status}</span>{image.isPrimary && <span className="text-[10px] font-bold text-brand-700">Primary</span>}</div><p className="mt-2 text-xs text-[#5e526d]">{image.altText}</p>{image.rejectionReason && <p className="mt-2 text-xs text-rose-700">Reason: {image.rejectionReason}</p>}</div>
          </article>)}</div>}
      </div>
    </main>
  );
}
