"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, LoaderCircle, Package, PackageCheck, Truck } from "lucide-react";
import { formatDate, formatTaka, prettyStatus } from "@/lib/format";

type Order = {
  id: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  totalPaisa: string;
  createdAt: string;
  sellerOrders: Array<{
    id: string;
    status: string;
    subtotalPaisa: string;
    items: Array<{ id: string; productNameEn: string; quantity: number }>;
  }>;
};

const tone = (status: string) => {
  if (status === "DELIVERED") return "bg-emerald-50 text-emerald-700";
  if (status === "CANCELLED") return "bg-rose-50 text-rose-700";
  if (status === "SHIPPED") return "bg-sky-50 text-sky-700";
  if (status === "PROCESSING" || status === "PENDING_SELLER_ACCEPTANCE") return "bg-[#fff4e8] text-[#b35c1e]";
  return "bg-[#f3eefb] text-brand-700";
};

export function CustomerOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyOrder, setBusyOrder] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch("/api/account/me/orders", { cache: "no-store" });
        if (response.status === 401) {
          window.location.assign("/login?next=/orders");
          return;
        }
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Unable to load your orders.");
        setOrders(data.orders ?? []);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Unable to load your orders.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function cancelOrder(orderId: string) {
    if (!window.confirm("Cancel this order? Reserved stock will be released.")) return;
    setBusyOrder(orderId);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/account/me/orders/${encodeURIComponent(orderId)}`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to cancel this order.");
      setOrders((current) =>
        current.map((order) =>
          order.id === orderId
            ? { ...order, status: "CANCELLED", sellerOrders: order.sellerOrders.map((seller) => ({ ...seller, status: "CANCELLED" })) }
            : order,
        ),
      );
      setNotice("Order cancelled and reserved stock released.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to cancel this order.");
    } finally {
      setBusyOrder("");
    }
  }

  if (loading) {
    return (
      <div className="container-shell max-w-4xl py-10">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-[#efe9f7]" />
        <div className="mt-6 space-y-3">
          {[0, 1].map((index) => <div key={index} className="h-32 animate-pulse rounded-2xl bg-[#f6f2fa]" />)}
        </div>
        <p role="status" className="sr-only">Loading your orders</p>
      </div>
    );
  }

  return (
    <div className="container-shell max-w-4xl py-7 sm:py-11">
      <p className="text-[10px] font-bold uppercase tracking-[.2em] text-brand-600">Your purchases</p>
      <h1 className="mt-1.5 text-[28px] font-extrabold tracking-[-1px] text-[#24143f] sm:text-[34px]">My orders</h1>
      <p className="mt-1 text-[12.5px] text-[#8b7f9b]">Track deliveries, cancel before acceptance and request returns after delivery.</p>

      {error ? <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-[11.5px] text-rose-700">{error}</p> : null}
      {notice ? <p role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-[11.5px] text-emerald-800">{notice}</p> : null}

      {!orders.length ? (
        <div className="mt-6 rounded-2xl border border-[#eeeaf3] bg-white px-6 py-14 text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#f6f0ff] text-brand-600"><Package size={28} aria-hidden /></span>
          <h2 className="mt-4 text-xl font-extrabold text-[#2c1c44]">No orders yet</h2>
          <p className="mx-auto mt-2 max-w-sm text-[12.5px] text-[#8b7f9b]">When you place an order, its progress will appear here.</p>
          <Link href="/products" className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-brand-600 px-5 text-xs font-extrabold text-white">
            Explore products <ArrowRight size={14} aria-hidden />
          </Link>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {orders.map((order) => {
            const itemCount = order.sellerOrders.reduce((sum, seller) => sum + seller.items.length, 0);
            const canCancel = order.status === "PENDING_SELLER_ACCEPTANCE" && order.sellerOrders.every((seller) => seller.status === "PENDING_ACCEPTANCE");
            return (
              <article key={order.id} className="rounded-2xl border border-[#eeeaf3] bg-white p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[9.5px] font-bold uppercase tracking-[.12em] text-[#a096ad]">Order reference</p>
                    <p className="mt-0.5 truncate font-mono text-[12px] font-bold text-[#302344]">{order.id}</p>
                    <p className="mt-1 text-[10.5px] text-[#9a90a5]">Placed {formatDate(order.createdAt)} · {itemCount} item{itemCount === 1 ? "" : "s"}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className={`rounded-full px-2.5 py-1 text-[9.5px] font-extrabold ${tone(order.status)}`}>{prettyStatus(order.status)}</span>
                    <span className="text-[15px] font-extrabold text-[#302344]">{formatTaka(order.totalPaisa)}</span>
                    <span className="text-[9.5px] text-[#9a90a5]">COD · {prettyStatus(order.paymentStatus)}</span>
                  </div>
                </div>

                <div className="mt-3 space-y-2 border-t border-[#f4f0f9] pt-3">
                  {order.sellerOrders.map((seller) => (
                    <div key={seller.id}>
                      <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[.06em] text-[#8b7f9b]">
                        {seller.status === "DELIVERED" ? <PackageCheck size={12} aria-hidden /> : <Truck size={12} aria-hidden />}
                        {prettyStatus(seller.status)}
                      </p>
                      <p className="mt-1 line-clamp-2 text-[11.5px] text-[#655873]">
                        {seller.items.map((item) => `${item.productNameEn} × ${item.quantity}`).join(" · ")}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Link
                    href={`/orders/${order.id}`}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand-600 px-4 text-[11px] font-extrabold text-white hover:bg-brand-700"
                  >
                    Track order <ArrowRight size={12} aria-hidden />
                  </Link>
                  {canCancel ? (
                    <button
                      type="button"
                      onClick={() => void cancelOrder(order.id)}
                      disabled={busyOrder === order.id}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#f0d6de] px-3.5 text-[11px] font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                    >
                      {busyOrder === order.id ? <LoaderCircle size={12} className="animate-spin" aria-hidden /> : null}
                      {busyOrder === order.id ? "Cancelling…" : "Cancel order"}
                    </button>
                  ) : null}
                  <Link href="/help#returns" className="ml-auto text-[10.5px] font-bold text-[#8b7f9b] hover:text-brand-700">
                    Return policy
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
