"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, RefreshCw, ShieldAlert, Wallet } from "lucide-react";

type ReturnItem = { id: string; productNameEn: string; productNameBn: string | null; quantity: number; lineTotalPaisa: string };
type ReturnRequest = {
  id: string; reason: string; details: string | null; status: string; sellerNotes: string | null; adminNotes: string | null;
  refundReference: string | null; refundMethod: string | null; refundAmountPaisa: string | null; createdAt: string;
  customer: { name: string | null; phone: string | null; email: string | null };
  sellerOrder: { id: string; status: string; subtotalPaisa: string; seller: { storeName: string; storeSlug: string }; items: ReturnItem[]; order: { id: string; paymentMethod: string; paymentStatus: string; createdAt: string } };
};
const filters = ["ALL", "REQUESTED", "APPROVED", "REJECTED", "ITEM_RECEIVED", "REFUNDED"];
const label = (v: string) => v.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
const money = (paisa: string) => `৳${(Number(paisa) / 100).toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function AdminReturns() {
  const [items, setItems] = useState<ReturnRequest[]>([]);
  const [filter, setFilter] = useState("ALL");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [refund, setRefund] = useState<Record<string, { reference: string; method: string; amount: string; confirmed: boolean }>>({});
  const [busy, setBusy] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  async function load(next = filter) {
    const query = next === "ALL" ? "" : `?status=${next}`;
    const response = await fetch(`/api/admin/returns${query}`, { cache: "no-store" });
    if (response.status === 401) { window.location.assign("/login?next=/admin/returns"); return; }
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.message || "Unable to load return requests.");
    setItems(payload.requests || []);
  }
  useEffect(() => { void load().catch((e) => setError(e instanceof Error ? e.message : "Unable to load returns.")).finally(() => setLoading(false)); }, []);
  async function act(item: ReturnRequest, action: "APPROVE" | "REJECT" | "ITEM_RECEIVED" | "REFUNDED") {
    const payment = refund[item.id] || { reference: "", method: "BKASH", amount: "", confirmed: false };
    if (action === "REFUNDED" && !payment.confirmed) { setError("Confirm the external refund was completed before recording it."); return; }
    setBusy(item.id); setError(""); setMessage("");
    try {
      const body = action === "REFUNDED"
        ? { action, notes: notes[item.id] || "", refundReference: payment.reference, refundMethod: payment.method, refundAmountPaisa: payment.amount, confirmManualRefund: payment.confirmed }
        : { action, notes: notes[item.id] || "" };
      const response = await fetch(`/api/admin/returns/${encodeURIComponent(item.id)}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || "Unable to update return request.");
      setMessage(payload.message || "Return request updated.");
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to update return request."); }
    finally { setBusy(""); }
  }
  function setRefundField(id: string, key: "reference" | "method" | "amount" | "confirmed", value: string | boolean) {
    setRefund((old) => ({ ...old, [id]: { reference: "", method: "BKASH", amount: "", confirmed: false, ...old[id], [key]: value } }));
  }
  return <main className="min-h-screen bg-[#faf9fc]"><div className="container-shell max-w-6xl py-9">
    <header className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-brand-600">ANAN Admin Console</p><h1 className="mt-2 flex items-center gap-2 text-3xl font-extrabold text-[#281743]"><ShieldAlert size={26}/> Return & dispute review</h1><p className="mt-1 text-sm text-[#82788f]">Review seller decisions, confirm returned items and record manually completed refunds.</p></div><div className="flex gap-3"><Link href="/admin/notifications" className="text-xs font-bold text-brand-700">Notifications</Link><button onClick={() => { setLoading(true); void load().catch((e) => setError(e instanceof Error ? e.message : "Refresh failed.")).finally(() => setLoading(false)); }} className="inline-flex items-center gap-2 rounded-xl border border-[#e8e2f0] bg-white px-3 py-2 text-xs font-bold text-[#5e526d]"><RefreshCw size={14}/> Refresh</button></div></header>
    <div className="mt-6 flex flex-wrap gap-2">{filters.map((f) => <button key={f} onClick={() => { setFilter(f); setLoading(true); void load(f).catch((e) => setError(e instanceof Error ? e.message : "Filter failed.")).finally(() => setLoading(false)); }} className={`rounded-full px-3 py-2 text-xs font-bold ${filter === f ? "bg-brand-600 text-white" : "border border-[#e8e2f0] bg-white text-[#655873]"}`}>{label(f)}</button>)}</div>
    {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}{message && <p role="status" className="mt-4 rounded-xl bg-[#f1edf8] p-3 text-sm text-[#49375f]">{message}</p>}
    {loading ? <p className="py-20 text-center text-sm text-[#82788f]">Loading return requests…</p> : !items.length ? <div className="mt-7 rounded-2xl border border-dashed border-[#ded5e9] bg-white p-12 text-center text-sm text-[#82788f]">No return requests in this view.</div> :
      <div className="mt-6 grid gap-4 lg:grid-cols-2">{items.map((item) => {
        const pay = refund[item.id] || { reference: "", method: "BKASH", amount: "", confirmed: false };
        return <article key={item.id} className="rounded-2xl border border-[#eee8f5] bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-2"><div><p className="text-[11px] text-[#968ba3]">Return · {item.id}</p><h2 className="mt-1 font-extrabold text-[#302344]">Order {item.sellerOrder.order.id}</h2></div><span className="rounded-full bg-[#f2edf8] px-3 py-1 text-xs font-bold text-brand-700">{label(item.status)}</span></div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-[#655873]"><p>Seller: <b>{item.sellerOrder.seller.storeName}</b></p><p>Customer: <b>{item.customer.name || "Customer"}</b></p><p>Phone: {item.customer.phone || "—"}</p><p>Payment: {label(item.sellerOrder.order.paymentMethod)} / {label(item.sellerOrder.order.paymentStatus)}</p><p>Item subtotal: <b>{money(item.sellerOrder.subtotalPaisa)}</b></p><p>Reason: <b>{label(item.reason)}</b></p></div>
          {item.details && <p className="mt-3 rounded-lg bg-[#faf8fc] p-3 text-xs text-[#655873]">{item.details}</p>}
          <div className="mt-3 space-y-1 border-t border-[#f0ecf4] pt-3">{item.sellerOrder.items.map((line) => <p key={line.id} className="text-xs text-[#655873]">{line.productNameEn} × {line.quantity} · {money(line.lineTotalPaisa)}</p>)}</div>
          {item.sellerNotes && <p className="mt-3 text-xs text-[#82788f]">Seller decision: {item.sellerNotes}</p>}
          {item.refundReference && <p className="mt-3 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800">Refund recorded: {money(item.refundAmountPaisa || "0")} via {label(item.refundMethod || "")} · Ref {item.refundReference}</p>}
          <label className="mt-4 block text-xs font-semibold text-[#655873]">Admin decision / dispute notes<textarea rows={2} maxLength={1500} value={notes[item.id] ?? item.adminNotes ?? ""} onChange={(e) => setNotes((old) => ({ ...old, [item.id]: e.target.value }))} className="mt-1 w-full rounded-lg border border-[#e8e2f0] p-2 text-sm" placeholder="Record findings and decision rationale"/></label>
          <div className="mt-3 flex flex-wrap gap-2">
            {(item.status === "REQUESTED" || item.status === "REJECTED") && <><button disabled={busy === item.id} onClick={() => void act(item, "APPROVE")} className="rounded-lg bg-brand-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">Approve / override</button><button disabled={busy === item.id} onClick={() => void act(item, "REJECT")} className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700 disabled:opacity-50">Reject</button></>}
            {item.status === "APPROVED" && <button disabled={busy === item.id} onClick={() => void act(item, "ITEM_RECEIVED")} className="rounded-lg bg-brand-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">Confirm item received</button>}
          </div>
          {item.status === "ITEM_RECEIVED" && <div className="mt-4 rounded-xl border border-[#eee8f5] bg-[#faf8fc] p-3"><p className="flex items-center gap-2 text-xs font-bold text-[#49375f]"><Wallet size={15}/> Record manual refund (paisa)</p><div className="mt-3 grid gap-2 sm:grid-cols-2"><input value={pay.amount} onChange={(e) => setRefundField(item.id, "amount", e.target.value)} placeholder="Refund amount in paisa" inputMode="numeric" className="rounded-lg border border-[#e8e2f0] bg-white p-2 text-xs"/><input value={pay.reference} onChange={(e) => setRefundField(item.id, "reference", e.target.value)} placeholder="External transaction reference" className="rounded-lg border border-[#e8e2f0] bg-white p-2 text-xs"/><select value={pay.method} onChange={(e) => setRefundField(item.id, "method", e.target.value)} className="rounded-lg border border-[#e8e2f0] bg-white p-2 text-xs"><option value="BKASH">bKash</option><option value="NAGAD">Nagad</option><option value="ROCKET">Rocket</option><option value="BANK_TRANSFER">Bank transfer</option><option value="CASH">Cash</option></select></div><label className="mt-3 flex items-start gap-2 text-xs text-[#655873]"><input type="checkbox" checked={pay.confirmed} onChange={(e) => setRefundField(item.id, "confirmed", e.target.checked)} className="mt-0.5"/> I confirm the money was already refunded outside ANAN and this reference is genuine.</label><button disabled={busy === item.id || !pay.confirmed} onClick={() => void act(item, "REFUNDED")} className="mt-3 rounded-lg bg-brand-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">Record completed refund</button></div>}
        </article>;
      })}</div>}
    <p className="mt-7 text-xs leading-5 text-[#958ba2]">Refunds are not sent by ANAN. This screen records an administrator-confirmed external payout only. Validate transaction evidence and the amount before recording it. This workflow does not yet automate courier reverse pickup or payment-provider refunds.</p>
  </div></main>;
}
