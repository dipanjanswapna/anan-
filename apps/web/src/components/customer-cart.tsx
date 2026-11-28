"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";

type CartItem = { id: string; quantity: number; available: boolean; maxQuantity: number; product: { id: string; nameEn: string; nameBn: string | null; slug: string; pricePaisa: string; stockOnHand: number; seller: { storeName: string } } };
type CartData = { items: CartItem[]; subtotalPaisa: string; itemCount: number };
const money = (paisa: string) => { const value = BigInt(paisa); const whole = new Intl.NumberFormat("en-BD").format(value / 100n); const fraction = (value % 100n).toString().padStart(2, "0").replace(/0+$/, ""); return `৳${whole}${fraction ? `.${fraction}` : ""}`; };

export function CustomerCart() {
  const [cart, setCart] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/account/me/cart", { cache: "no-store" });
      if (response.status === 401) { window.location.assign("/login?next=/cart"); return; }
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to load cart.");
      setCart(data);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to load cart."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function change(productId: string, quantity: number | null) {
    setBusy(productId); setError("");
    try {
      const response = await fetch(`/api/account/me/cart/items/${productId}`, { method: quantity === null ? "DELETE" : "PATCH", ...(quantity === null ? {} : { headers: { "content-type": "application/json" }, body: JSON.stringify({ quantity }) }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Unable to update cart.");
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to update cart."); }
    finally { setBusy(null); }
  }

  if (loading) return <p className="py-20 text-center text-sm text-[#82788f]">Loading your cart…</p>;
  return <div className="container-shell max-w-5xl py-9 sm:py-12">
    <div className="mb-7"><p className="text-xs font-bold uppercase tracking-[.18em] text-brand-600">Your shopping bag</p><h1 className="mt-2 text-3xl font-extrabold text-[#24143f]">Shopping cart</h1><p className="mt-1 text-sm text-[#82788f]">{cart?.itemCount ?? 0} item(s) in your cart</p></div>
    {error && <p role="alert" className="mb-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
    {!cart?.items.length ? <div className="rounded-2xl border border-dashed border-[#ded5e9] bg-white px-6 py-16 text-center"><ShoppingBag className="mx-auto text-brand-400" size={38}/><h2 className="mt-4 font-bold text-[#302344]">Your cart is empty</h2><p className="mt-2 text-sm text-[#82788f]">Explore the marketplace and add something you love.</p><Link href="/products" className="mt-5 inline-flex rounded-xl bg-brand-600 px-5 py-3 text-sm font-bold text-white">Explore products</Link></div> : <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div className="space-y-3">{cart.items.map(item => <article key={item.id} className="rounded-2xl border border-[#eeeaf3] bg-white p-4 sm:p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div className="min-w-0"><Link href={`/products/${encodeURIComponent(item.product.slug)}`} className="font-bold text-[#302344] hover:text-brand-700">{item.product.nameEn}</Link>{item.product.nameBn && <p className="mt-1 text-xs text-[#82788f]">{item.product.nameBn}</p>}<p className="mt-1 text-xs text-[#958ba2]">Sold by {item.product.seller.storeName}</p><p className="mt-2 text-sm font-extrabold text-[#26183c]">{money(item.product.pricePaisa)}</p></div><button disabled={busy === item.product.id} onClick={() => void change(item.product.id, null)} aria-label="Remove item" className="rounded-lg p-2 text-[#9b8fa8] hover:bg-rose-50 hover:text-rose-600"><Trash2 size={17}/></button></div><div className="mt-4 flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2 rounded-xl border border-[#eeeaf3] p-1"><button disabled={item.quantity <= 1 || busy === item.product.id} onClick={() => void change(item.product.id, item.quantity - 1)} className="rounded-lg p-1.5 hover:bg-[#f7f3fb] disabled:opacity-30" aria-label="Decrease quantity"><Minus size={14}/></button><span className="min-w-6 text-center text-sm font-bold">{item.quantity}</span><button disabled={item.quantity >= Math.min(item.maxQuantity, 99) || busy === item.product.id} onClick={() => void change(item.product.id, item.quantity + 1)} className="rounded-lg p-1.5 hover:bg-[#f7f3fb] disabled:opacity-30" aria-label="Increase quantity"><Plus size={14}/></button></div><span className="text-sm font-bold text-[#302344]">{money((BigInt(item.product.pricePaisa) * BigInt(item.quantity)).toString())}</span></div>{!item.available && <p className="mt-3 text-xs font-semibold text-rose-600">Only {item.maxQuantity} currently available. Update quantity before checkout.</p>}</article>)}</div>
      <aside className="h-fit rounded-2xl border border-[#eeeaf3] bg-white p-5"><h2 className="font-bold text-[#302344]">Order summary</h2><div className="mt-5 flex justify-between text-sm text-[#82788f]"><span>Subtotal</span><span className="font-bold text-[#302344]">{money(cart.subtotalPaisa)}</span></div><p className="mt-3 text-xs leading-5 text-[#9b91a8]">Delivery fee, discounts and final stock validation will be calculated at checkout.</p><button disabled className="mt-6 w-full cursor-not-allowed rounded-xl bg-brand-600 px-4 py-3 text-sm font-bold text-white opacity-50">Checkout coming next</button><Link href="/products" className="mt-3 block text-center text-xs font-bold text-brand-700">Continue shopping</Link></aside>
    </div>}
  </div>;
}
