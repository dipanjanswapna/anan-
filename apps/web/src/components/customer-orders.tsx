"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Order = { id: string; status: string; paymentMethod: string; paymentStatus: string; totalPaisa: string; createdAt: string; sellerOrders: Array<{ id: string; status: string; subtotalPaisa: string; items: Array<{ id: string; productNameEn: string; quantity: number }> }> };
const money = (paisa: string) => { const value = BigInt(paisa); const whole = new Intl.NumberFormat("en-BD").format(value / 100n); const fraction = (value % 100n).toString().padStart(2, "0").replace(/0+$/, ""); return `৳${whole}${fraction ? `.${fraction}` : ""}`; };
export function CustomerOrders() {
  const [busyOrder, setBusyOrder] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => { void (async () => { try { const r = await fetch("/api/account/me/orders", { cache: "no-store" }); if (r.status === 401) { window.location.assign("/login?next=/orders"); return; } const d = await r.json(); if (!r.ok) throw new Error(d.message || "Unable to load orders."); setOrders(d.orders ?? []); } catch (e) { setError(e instanceof Error ? e.message : "Unable to load orders."); } finally { setLoading(false); } })(); }, []);
  async function cancelOrder(orderId: string) {
    if (!window.confirm("Cancel this order? Reserved stock will be released.")) return;
    setBusyOrder(orderId); setError("");
    try {
      const response = await fetch(`/api/account/me/orders/${orderId}`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to cancel order.");
      setOrders(current => current.map(order => order.id === orderId ? { ...order, status: "CANCELLED", sellerOrders: order.sellerOrders.map(s => ({ ...s, status: "CANCELLED" })) } : order));
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to cancel order."); }
    finally { setBusyOrder(""); }
  }
  if (loading) return <p className="py-20 text-center text-sm text-[#82788f]">Loading your orders…</p>;
  return <section className="container-shell max-w-4xl py-10"><p className="text-xs font-bold uppercase tracking-[.18em] text-brand-600">Your purchases</p><h1 className="mt-2 text-3xl font-extrabold text-[#24143f]">My orders</h1>{error && <p role="alert" className="mt-4 text-sm text-rose-700">{error}</p>}{!orders.length ? <div className="mt-7 rounded-2xl border border-dashed border-[#ded5e9] bg-white p-12 text-center"><p className="font-bold">No orders yet</p><Link href="/products" className="mt-3 inline-block text-sm font-bold text-brand-700">Explore products</Link></div> : <div className="mt-7 space-y-4">{orders.map(o => <article key={o.id} className="rounded-2xl border border-[#eeeaf3] bg-white p-5"><div className="flex flex-wrap justify-between gap-3"><div><p className="text-xs text-[#958ba2]">Order reference</p><p className="mt-1 font-mono text-sm font-bold text-[#302344]">{o.id}</p><p className="mt-1 text-xs text-[#958ba2]">{new Date(o.createdAt).toLocaleString("en-BD")}</p></div><div className="text-right"><p className="font-extrabold text-[#302344]">{money(o.totalPaisa)}</p><p className="mt-1 text-xs font-semibold text-brand-700">{o.status.replaceAll("_", " ")}</p><p className="text-[11px] text-[#958ba2]">COD · {o.paymentStatus}</p>{o.status === "PENDING_SELLER_ACCEPTANCE" && <button type="button" onClick={() => void cancelOrder(o.id)} disabled={busyOrder === o.id} className="mt-2 text-xs font-bold text-rose-700 underline disabled:opacity-50">{busyOrder === o.id ? "Cancelling…" : "Cancel order"}</button>}</div></div><div className="mt-4 space-y-3 border-t border-[#f0ecf4] pt-4">{o.sellerOrders.map(s => <div key={s.id}><p className="text-xs font-bold text-[#5c4d70]">Seller order · {s.status.replaceAll("_", " ")}</p>{s.items.map(i => <p key={i.id} className="mt-1 text-xs text-[#82788f]">{i.productNameEn} × {i.quantity}</p>)}</div>)}</div></article>)}</div>}</section>;
}
