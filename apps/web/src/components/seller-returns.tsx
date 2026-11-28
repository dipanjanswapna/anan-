"use client";

import { useEffect, useState } from "react";
import { Check, RefreshCw, X } from "lucide-react";

type ReturnItem = { id: string; productNameEn: string; productNameBn: string | null; quantity: number };
type ReturnRequest = {
  id: string; reason: string; details: string | null; status: string; sellerNotes: string | null;
  createdAt: string; customer: { name: string | null; phone: string | null };
  sellerOrder: { id: string; status: string; orderId: string; items: ReturnItem[]; order: { createdAt: string } };
};
const label = (value: string) => value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

export function SellerReturns() {
  const [requests, setRequests] = useState<ReturnRequest[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const load = async () => {
    const response = await fetch("/api/seller/returns", { cache: "no-store" });
    if (response.status === 401) { window.location.assign("/seller/login"); return; }
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.message || "Unable to load return requests.");
    setRequests(payload.requests);
  };
  useEffect(() => { void load().catch((e) => setError(e instanceof Error ? e.message : "Unable to load returns.")); }, []);
  async function review(id: string, decision: "APPROVED" | "REJECTED") {
    setBusy(id); setError(""); setMessage("");
    try {
      const response = await fetch(`/api/seller/returns/${encodeURIComponent(id)}`, {
        method: "PATCH", headers: { "content-type": "application/json" },
        body: JSON.stringify({ decision, notes: notes[id] || "" }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || "Unable to review this request.");
      setMessage(payload.message || "Return request updated.");
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to review this request."); }
    finally { setBusy(""); }
  }
  return <section className="container-shell max-w-6xl pb-12">
    <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
      <div><p className="text-xs font-bold uppercase tracking-[.18em] text-brand-600">After-sales</p><h2 className="mt-1 text-xl font-extrabold text-[#281743]">Return requests</h2></div>
      <button onClick={() => void load().catch((e) => setError(e instanceof Error ? e.message : "Refresh failed."))} className="inline-flex items-center gap-2 rounded-lg border border-[#e8e2f0] bg-white px-3 py-2 text-xs font-bold text-[#5e526d]"><RefreshCw size={14}/> Refresh</button>
    </div>
    {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-xs text-red-700">{error}</p>}
    {message && <p role="status" className="mt-4 rounded-xl bg-[#f1edf8] p-3 text-xs text-[#49375f]">{message}</p>}
    {!requests.length ? <div className="mt-5 rounded-2xl border border-dashed border-[#ded5e9] bg-white p-8 text-center text-sm text-[#82788f]">No return requests yet.</div> :
      <div className="mt-5 grid gap-4 lg:grid-cols-2">{requests.map((item) => <article key={item.id} className="rounded-2xl border border-[#eee8f5] bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-2"><div><p className="text-[11px] text-[#968ba3]">Return · {item.id}</p><p className="mt-1 text-sm font-bold text-[#302344]">Order {item.sellerOrder.orderId}</p></div><span className="rounded-full bg-[#f2edf8] px-3 py-1 text-xs font-bold text-brand-700">{label(item.status)}</span></div>
        <p className="mt-3 text-xs text-[#5e526d]">Customer: {item.customer.name || "Customer"} · {item.customer.phone || "No phone"}</p>
        <p className="mt-2 text-xs font-semibold text-[#5e526d]">Reason: {label(item.reason)}</p>
        {item.details && <p className="mt-2 rounded-lg bg-[#faf8fc] p-3 text-xs text-[#655873]">{item.details}</p>}
        <div className="mt-3 space-y-1">{item.sellerOrder.items.map((line) => <p key={line.id} className="text-xs text-[#655873]">{line.productNameEn}{line.productNameBn ? ` · ${line.productNameBn}` : ""} × {line.quantity}</p>)}</div>
        {item.sellerNotes && <p className="mt-3 text-xs text-[#82788f]">Seller note: {item.sellerNotes}</p>}
        {item.status === "REQUESTED" ? <div className="mt-4 border-t border-[#f0ecf4] pt-4">
          <label className="block text-xs font-semibold text-[#655873]">Decision note (optional)<textarea value={notes[item.id] || ""} onChange={(e) => setNotes((old) => ({ ...old, [item.id]: e.target.value }))} maxLength={1000} rows={2} className="mt-1 w-full rounded-lg border border-[#e8e2f0] p-2 text-sm" placeholder="Explain your decision to the customer"/></label>
          <div className="mt-3 flex flex-wrap gap-2"><button disabled={busy === item.id} onClick={() => void review(item.id, "REJECTED")} className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700 disabled:opacity-50"><X size={14}/> Reject</button><button disabled={busy === item.id} onClick={() => void review(item.id, "APPROVED")} className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"><Check size={14}/> Approve return</button></div>
          <p className="mt-2 text-[11px] text-[#9a91a5]">Approval records the seller decision only; it does not arrange pickup, issue a refund, or change payment status.</p>
        </div> : null}
      </article>)}</div>}
  </section>;
}
