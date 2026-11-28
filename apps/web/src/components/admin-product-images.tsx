"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Image as ImageIcon, RefreshCw, X } from "lucide-react";

type ProductImage = {
  id: string; publicUrl: string; altText: string; contentType: string; sizeBytes: number;
  status: "PENDING" | "APPROVED" | "REJECTED"; createdAt: string; product: {
    id: string; nameEn: string; slug: string; seller: { storeName: string; storeSlug: string };
  };
};

export function AdminProductImages() {
  const [items, setItems] = useState<ProductImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  async function load() {
    const response = await fetch("/api/admin/product-images?status=PENDING", { cache: "no-store" });
    if (response.status === 401) { window.location.assign("/login?next=/admin/product-images"); return; }
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.message || "Unable to load product images.");
    setItems(payload.images || []);
  }

  useEffect(() => {
    void load().catch((reason) => setError(reason instanceof Error ? reason.message : "Unable to load images."))
      .finally(() => setLoading(false));
  }, []);

  async function decide(id: string, action: "APPROVE" | "REJECT") {
    setBusy(id); setError("");
    try {
      const response = await fetch(`/api/admin/product-images/${id}`, {
        method: "PATCH", headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, notes: notes[id] || "" }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || "Unable to review image.");
      setItems((current) => current.filter((item) => item.id !== id));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to review image.");
    } finally { setBusy(""); }
  }

  return (
    <main className="min-h-screen bg-[#faf9fc]">
      <div className="container-shell max-w-6xl py-9">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div><p className="text-xs font-bold uppercase tracking-[.18em] text-brand-600">ANAN Admin Console</p>
            <h1 className="mt-2 flex items-center gap-2 text-3xl font-extrabold text-[#281743]"><ImageIcon size={27}/> Product image review</h1>
            <p className="mt-1 text-sm text-[#82788f]">Approve seller-uploaded product images before they appear in the public catalogue.</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => { setLoading(true); void load().catch((reason) => setError(reason instanceof Error ? reason.message : "Refresh failed.")).finally(() => setLoading(false)); }}
              className="inline-flex items-center gap-2 rounded-xl border border-[#e8e2f0] bg-white px-3 py-2 text-xs font-bold text-[#5e526d]"><RefreshCw size={14}/> Refresh</button>
            <Link href="/admin/orders" className="text-xs font-bold text-brand-700">Orders</Link>
          </div>
        </header>
        {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {loading ? <p className="py-20 text-center text-sm text-[#82788f]">Loading image queue…</p> :
          !items.length ? <div className="mt-7 rounded-2xl border border-dashed border-[#ded5e9] bg-white p-12 text-center"><ImageIcon className="mx-auto text-[#9a91a5]" size={30}/><p className="mt-3 font-bold text-[#4b3c5e]">No pending images</p><p className="mt-1 text-sm text-[#82788f]">New seller uploads will appear here for review.</p></div> :
          <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => <article key={item.id} className="overflow-hidden rounded-2xl border border-[#eee8f5] bg-white">
              <div className="flex aspect-[4/3] items-center justify-center bg-[#f6f2fa]">
                <img src={item.publicUrl} alt={item.altText} className="h-full w-full object-contain" />
              </div>
              <div className="p-5">
                <h2 className="font-extrabold text-[#302344]">{item.product.nameEn}</h2>
                <p className="mt-1 text-xs text-[#82788f]">Seller: {item.product.seller.storeName}</p>
                <p className="mt-1 break-all text-[11px] text-[#a097ad]">{item.contentType} · {(item.sizeBytes / 1024 / 1024).toFixed(2)} MB</p>
                <p className="mt-3 text-sm text-[#5e526d]">Alt text: {item.altText}</p>
                <textarea value={notes[item.id] || ""} onChange={(event) => setNotes((old) => ({ ...old, [item.id]: event.target.value }))}
                  placeholder="Rejection reason (required to reject)" rows={2} maxLength={1000}
                  className="mt-4 w-full rounded-xl border border-[#e8e2f0] p-3 text-xs outline-none focus:border-brand-400" />
                <div className="mt-3 flex gap-2">
                  <button disabled={busy === item.id} onClick={() => void decide(item.id, "APPROVE")}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-600 px-3 py-2.5 text-xs font-bold text-white disabled:opacity-50"><Check size={14}/> Approve</button>
                  <button disabled={busy === item.id || !(notes[item.id] || "").trim()} onClick={() => void decide(item.id, "REJECT")}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-rose-200 px-3 py-2.5 text-xs font-bold text-rose-700 disabled:opacity-50"><X size={14}/> Reject</button>
                </div>
              </div>
            </article>)}
          </div>}
      </div>
    </main>
  );
}
