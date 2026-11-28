"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw, ShieldCheck, Truck } from "lucide-react";

type Shipment = { carrier: string; trackingNumber: string | null; status: string; trackingUrl: string | null; events: { id: string; status: string; description: string; occurredAt: string }[] } | null;
type SellerOrder = { id: string; status: string; seller: { storeName: string; storeSlug: string }; shipment: Shipment };
type Order = { id: string; status: string; paymentStatus: string; totalPaisa: string; createdAt: string; customer: { id: string; name: string | null; phone: string | null }; sellerOrders: SellerOrder[] };
type Count = { status: string; count: number };
const filters = ["ALL", "PENDING_SELLER_ACCEPTANCE", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];
const money = (paisa: string) => new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT", maximumFractionDigits: 2 }).format(Number(paisa) / 100);
const pretty = (value: string) => value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

export function AdminOrders() {
  const [filter, setFilter] = useState("ALL");
  const [orders, setOrders] = useState<Order[]>([]);
  const [counts, setCounts] = useState<Count[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async (status: string) => {
    setLoading(true); setError("");
    try {
      const query = status === "ALL" ? "" : `?status=${encodeURIComponent(status)}`;
      const response = await fetch(`/api/admin/orders${query}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to load orders.");
      setOrders(data.orders ?? []); setCounts(data.counts ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load orders.");
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(filter); }, [filter, load]);
  const countFor = (status: string) => counts.find((item) => item.status === status)?.count ?? 0;

  return <main className="min-h-screen bg-[#faf9fc]"><div className="container-shell py-8">
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div><p className="text-xs font-bold uppercase tracking-[.18em] text-brand-600">ANAN Admin Console</p><h1 className="mt-2 text-3xl font-extrabold text-[#281743]">Order management</h1><p className="mt-1 text-sm text-[#82788f]">Monitor customer orders, seller fulfilment and courier updates.</p></div>
      <div className="flex flex-wrap gap-2"><Link href="/admin/products" className="rounded-xl border border-[#e8e2f0] bg-white px-4 py-2 text-xs font-bold text-[#5e526d]">Product review</Link><Link href="/admin/notifications" className="rounded-xl border border-[#e8e2f0] bg-white px-4 py-2 text-xs font-bold text-[#5e526d]">Notifications</Link><button onClick={() => void load(filter)} className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-xs font-bold text-white"><RefreshCw size={14}/> Refresh</button></div>
    </header>
    <section aria-label="Order status totals" className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {filters.slice(1).map((status) => <div key={status} className="rounded-2xl border border-[#eee8f5] bg-white p-4"><p className="text-[11px] font-bold uppercase tracking-wide text-[#82788f]">{pretty(status)}</p><p className="mt-2 text-2xl font-extrabold text-[#302344]">{countFor(status)}</p></div>)}
    </section>
    <nav aria-label="Filter orders" className="mt-7 flex flex-wrap gap-2">{filters.map((status) => <button key={status} onClick={() => setFilter(status)} aria-pressed={filter === status} className={`rounded-full px-4 py-2 text-xs font-bold ${filter === status ? "bg-brand-600 text-white" : "border border-[#e8e2f0] bg-white text-[#655873]"}`}>{status === "ALL" ? "All orders" : pretty(status)}</button>)}</nav>
    {error && <p role="alert" className="mt-5 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700"><AlertCircle size={16}/>{error}</p>}
    {loading ? <p className="py-20 text-center text-sm text-[#82788f]">Loading orders…</p> : !orders.length ? <div className="mt-6 rounded-2xl border border-dashed border-[#ded5e9] bg-white p-12 text-center text-sm text-[#82788f]">No orders in this view.</div> :
      <div className="mt-6 space-y-4">{orders.map((order) => <article key={order.id} className="rounded-2xl border border-[#eee8f5] bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-extrabold text-[#302344]">Order #{order.id.slice(-8).toUpperCase()}</h2><p className="mt-1 text-xs text-[#82788f]">{new Date(order.createdAt).toLocaleString("en-BD")} · {order.customer.name || "Customer"} · {order.customer.phone || "No phone"}</p></div><div className="text-right"><p className="font-extrabold text-[#302344]">{money(order.totalPaisa)}</p><p className="mt-1 text-xs text-[#82788f]">{pretty(order.status)} · Payment {pretty(order.paymentStatus)}</p></div></div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">{order.sellerOrders.map((child) => <section key={child.id} className="rounded-xl bg-[#faf9fc] p-4"><div className="flex flex-wrap justify-between gap-2"><p className="text-sm font-bold text-[#49375f]">{child.seller.storeName}</p><span className="text-[11px] font-bold text-brand-700">{pretty(child.status)}</span></div>{child.shipment ? <div className="mt-3 space-y-1 text-xs text-[#655873]"><p className="flex items-center gap-2"><Truck size={13}/>{child.shipment.carrier} · {child.shipment.status}</p><p>Tracking: {child.shipment.trackingNumber || "Not assigned"}</p>{child.shipment.trackingUrl && <a href={child.shipment.trackingUrl} target="_blank" rel="noreferrer" className="inline-block font-bold text-brand-700 underline">Courier tracking</a>}<p>{child.shipment.events.length} recent tracking event(s)</p></div> : <p className="mt-3 text-xs text-[#82788f]">Shipment not created yet.</p>}</section>)}</div>
      </article>)}</div>}
    <p className="mt-8 flex items-start gap-2 text-xs text-[#8b8097]"><ShieldCheck size={15} className="mt-0.5 shrink-0"/> Read-only monitoring view. Order status changes remain controlled by customer, seller and existing fulfilment workflows.</p>
  </div></main>;
}
