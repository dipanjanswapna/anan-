"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Address = { id: string; label: string; recipientName: string; phone: string; division: string; district: string; upazila: string; area: string; addressLine: string; isDefault: boolean };
type Cart = { items: Array<{ id: string; quantity: number; available: boolean; product: { nameEn: string; pricePaisa: string } }>; subtotalPaisa: string; itemCount: number };
const money = (paisa: string) => { const value = BigInt(paisa); const whole = new Intl.NumberFormat("en-BD").format(value / 100n); const fraction = (value % 100n).toString().padStart(2, "0").replace(/0+$/, ""); return `৳${whole}${fraction ? `.${fraction}` : ""}`; };

export function CustomerCheckout() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [cart, setCart] = useState<Cart | null>(null);
  const [addressId, setAddressId] = useState("");
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    void (async () => {
      try {
        const [a, c] = await Promise.all([
          fetch("/api/account/me/addresses", { cache: "no-store" }),
          fetch("/api/account/me/cart", { cache: "no-store" }),
        ]);
        if (a.status === 401 || c.status === 401) { window.location.assign("/login?next=/checkout"); return; }
        const [ad, cd] = await Promise.all([a.json(), c.json()]);
        if (!a.ok || !c.ok) throw new Error(ad.message || cd.message || "Unable to load checkout.");
        setAddresses(ad.addresses ?? []);
        setAddressId((ad.addresses ?? []).find((x: Address) => x.isDefault)?.id ?? ad.addresses?.[0]?.id ?? "");
        setCart(cd);
      } catch (e) { setError(e instanceof Error ? e.message : "Unable to load checkout."); }
      finally { setLoading(false); }
    })();
  }, []);
  async function placeOrder() {
    if (!addressId) { setError("Add a delivery address before placing your order."); return; }
    setPlacing(true); setError("");
    try {
      const response = await fetch("/api/account/me/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ addressId, idempotencyKey: crypto.randomUUID() }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.status === 401) { window.location.assign("/login?next=/checkout"); return; }
      if (!response.ok) throw new Error(data.message || "Unable to place order.");
      window.location.assign(`/orders?placed=${encodeURIComponent(data.order.id)}`);
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to place order."); }
    finally { setPlacing(false); }
  }
  if (loading) return <p className="py-20 text-center text-sm text-[#82788f]">Preparing checkout…</p>;
  return <section className="container-shell max-w-4xl py-10">
    <p className="text-xs font-bold uppercase tracking-[.18em] text-brand-600">Almost yours</p>
    <h1 className="mt-2 text-3xl font-extrabold text-[#24143f]">Checkout</h1>
    {error && <p role="alert" className="mt-5 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
    {!cart?.items.length ? <div className="mt-7 rounded-2xl border border-[#eeeaf3] bg-white p-8 text-center"><p className="font-bold">Your cart is empty</p><Link href="/products" className="mt-3 inline-block text-sm font-bold text-brand-700">Browse products</Link></div> : <div className="mt-7 grid gap-6 md:grid-cols-[1fr_300px]">
      <div className="space-y-4">
        <div className="rounded-2xl border border-[#eeeaf3] bg-white p-5">
          <div className="flex items-center justify-between"><h2 className="font-bold text-[#302344]">Delivery address</h2><Link href="/account" className="text-xs font-bold text-brand-700">Manage addresses</Link></div>
          {!addresses.length ? <p className="mt-4 text-sm text-[#82788f]">You have no saved address. <Link href="/account" className="font-bold text-brand-700">Add one in your account</Link>.</p> : <div className="mt-4 space-y-3">{addresses.map(a => <label key={a.id} className={`flex cursor-pointer gap-3 rounded-xl border p-4 ${addressId === a.id ? "border-brand-500 bg-[#faf7ff]" : "border-[#eeeaf3]"}`}><input type="radio" name="address" checked={addressId === a.id} onChange={() => setAddressId(a.id)} className="mt-1 accent-purple-700"/><span className="text-sm"><span className="font-bold text-[#302344]">{a.label} · {a.recipientName}</span>{a.isDefault && <span className="ml-2 text-[10px] font-bold text-brand-700">DEFAULT</span>}<span className="mt-1 block text-xs leading-5 text-[#82788f]">{a.addressLine}, {a.area}, {a.upazila}, {a.district}, {a.division}<br/>{a.phone}</span></span></label>)}</div>}
        </div>
        <div className="rounded-2xl border border-[#eeeaf3] bg-white p-5"><h2 className="font-bold text-[#302344]">Payment method</h2><div className="mt-3 rounded-xl border border-brand-400 bg-[#faf7ff] p-4"><p className="text-sm font-bold text-[#302344]">Cash on Delivery (COD)</p><p className="mt-1 text-xs text-[#82788f]">Pay the courier when your order arrives.</p></div></div>
      </div>
      <aside className="h-fit rounded-2xl border border-[#eeeaf3] bg-white p-5"><h2 className="font-bold text-[#302344]">Order summary</h2><div className="mt-4 space-y-3">{cart.items.map(i => <div key={i.id} className="flex justify-between gap-3 text-xs"><span className="text-[#82788f]">{i.product.nameEn} × {i.quantity}</span><span className="font-semibold text-[#302344]">{money((BigInt(i.product.pricePaisa) * BigInt(i.quantity)).toString())}</span></div>)}</div><div className="my-4 h-px bg-[#eeeaf3]"/><div className="flex justify-between text-sm"><span className="text-[#82788f]">Subtotal</span><strong>{money(cart.subtotalPaisa)}</strong></div><div className="mt-2 flex justify-between text-sm"><span className="text-[#82788f]">Delivery fee</span><strong>৳0</strong></div><p className="mt-3 text-[11px] leading-5 text-amber-700">Delivery pricing is not configured yet. This development release applies ৳0; do not use for production orders until delivery rates are configured.</p><div className="mt-4 flex justify-between border-t border-[#eeeaf3] pt-4 text-base"><strong>Total</strong><strong>{money(cart.subtotalPaisa)}</strong></div><button onClick={() => void placeOrder()} disabled={placing || !addressId || cart.items.some(i => !i.available)} className="mt-5 w-full rounded-xl bg-brand-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-40">{placing ? "Placing order…" : "Place COD order"}</button><p className="mt-3 text-[10px] leading-4 text-[#9b91a8]">Stock is revalidated and reserved atomically when you place the order.</p></aside>
    </div>}
  </section>;
}
