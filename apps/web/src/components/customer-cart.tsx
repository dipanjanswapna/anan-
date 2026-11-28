"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  Heart,
  ImageOff,
  LoaderCircle,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Truck,
} from "lucide-react";
import { CART_UPDATED_EVENT } from "@/lib/product-actions";
import { formatTaka } from "@/lib/format";

type CartItem = {
  id: string;
  quantity: number;
  available: boolean;
  maxQuantity: number;
  product: {
    id: string;
    nameEn: string;
    nameBn: string | null;
    slug: string;
    pricePaisa: string;
    compareAtPricePaisa: string | null;
    stockOnHand: number;
    image: { url: string | null; altText: string } | null;
    seller: { storeName: string };
  };
};
type CartData = { items: CartItem[]; subtotalPaisa: string; itemCount: number };

export function CustomerCart() {
  const [cart, setCart] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const response = await fetch("/api/account/me/cart", { cache: "no-store" });
      if (response.status === 401) {
        window.location.assign("/login?next=/cart");
        return;
      }
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to load your cart.");
      setCart(data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load your cart.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function updateQuantity(productId: string, quantity: number) {
    setBusy(productId);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/account/me/cart/items/${encodeURIComponent(productId)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ quantity }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Unable to update this quantity.");
      await load();
      window.dispatchEvent(new Event(CART_UPDATED_EVENT));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to update this quantity.");
    } finally {
      setBusy(null);
    }
  }

  async function removeItem(productId: string, name: string) {
    setBusy(productId);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/account/me/cart/items/${encodeURIComponent(productId)}`, { method: "DELETE" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Unable to remove this item.");
      await load();
      setNotice(`${name} removed from your cart.`);
      window.dispatchEvent(new Event(CART_UPDATED_EVENT));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to remove this item.");
    } finally {
      setBusy(null);
    }
  }

  async function moveToWishlist(productId: string, name: string) {
    setBusy(productId);
    setError("");
    setNotice("");
    try {
      const saved = await fetch(`/api/account/me/wishlist/${encodeURIComponent(productId)}`, { method: "POST" });
      const savedData = await saved.json().catch(() => ({}));
      if (!saved.ok) throw new Error(savedData.message || "Unable to save this product.");
      const removed = await fetch(`/api/account/me/cart/items/${encodeURIComponent(productId)}`, { method: "DELETE" });
      if (!removed.ok) throw new Error("Saved to your wishlist, but we could not remove it from the cart.");
      await load();
      setNotice(`${name} moved to your wishlist.`);
      window.dispatchEvent(new Event(CART_UPDATED_EVENT));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to move this product.");
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return (
      <div className="container-shell max-w-6xl py-10">
        <div className="h-8 w-52 animate-pulse rounded-lg bg-[#efe9f7]" />
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-3">
            {[0, 1, 2].map((index) => (
              <div key={index} className="h-32 animate-pulse rounded-2xl bg-[#f6f2fa]" />
            ))}
          </div>
          <div className="h-72 animate-pulse rounded-2xl bg-[#f6f2fa]" />
        </div>
        <p className="sr-only" role="status">Loading your cart</p>
      </div>
    );
  }

  const items = cart?.items ?? [];
  const subtotal = cart?.subtotalPaisa ?? "0";
  const hasIssue = items.some((item) => !item.available);

  return (
    <div className="container-shell max-w-6xl py-7 sm:py-11">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.2em] text-brand-600">Your shopping bag</p>
          <h1 className="mt-1.5 text-[28px] font-extrabold tracking-[-1px] text-[#24143f] sm:text-[34px]">
            Cart {cart?.itemCount ? <span className="text-[#b6a9c7]">({cart.itemCount})</span> : null}
          </h1>
          <p className="mt-1 text-[12.5px] text-[#8b7f9b]">
            {items.length ? "Review quantities before checking out — stock is revalidated when you order." : "Your saved picks will appear here."}
          </p>
        </div>
        <Link href="/products" className="text-[11.5px] font-bold text-brand-700 hover:underline">
          Continue shopping →
        </Link>
      </header>

      {error ? <p role="alert" className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[12px] text-rose-700">{error}</p> : null}
      {notice ? <p role="status" className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[12px] text-emerald-800">{notice}</p> : null}

      {!items.length ? (
        <div className="mt-7 rounded-[24px] border border-[#eeeaf3] bg-white px-6 py-14 text-center sm:py-20">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#f6f0ff] text-brand-600">
            <ShoppingBag size={28} aria-hidden />
          </span>
          <h2 className="mt-5 text-xl font-extrabold text-[#2c1c44]">Your cart is empty</h2>
          <p className="mx-auto mt-2 max-w-sm text-[12.5px] leading-6 text-[#8b7f9b]">
            Explore the catalogue, save what you love and come back when you are ready.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
            <Link href="/products" className="inline-flex h-11 items-center gap-2 rounded-full bg-brand-600 px-5 text-xs font-extrabold text-white hover:bg-brand-700">
              Explore products <ArrowRight size={15} aria-hidden />
            </Link>
            <Link href="/wishlist" className="inline-flex h-11 items-center gap-2 rounded-full border border-[#e5dcef] bg-white px-5 text-xs font-bold text-[#4b3a60] hover:border-brand-300">
              <Heart size={14} aria-hidden /> View wishlist
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-6 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-7">
          <div className="min-w-0 space-y-3">
            {items.map((item) => (
              <article key={item.id} className="rounded-2xl border border-[#eeeaf3] bg-white p-3 sm:p-4">
                <div className="flex gap-3 sm:gap-4">
                  <Link
                    href={`/products/${encodeURIComponent(item.product.slug)}`}
                    className="relative h-[92px] w-[78px] shrink-0 overflow-hidden rounded-xl bg-[#f6f2fa] sm:h-[112px] sm:w-[94px]"
                  >
                    {item.product.image?.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.product.image.url}
                        alt={item.product.image.altText || item.product.nameEn}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-brand-300">
                        <ImageOff size={20} aria-hidden />
                      </span>
                    )}
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link
                          href={`/products/${encodeURIComponent(item.product.slug)}`}
                          className="line-clamp-2 text-[12.5px] font-bold leading-5 text-[#302344] hover:text-brand-700 sm:text-[13.5px]"
                        >
                          {item.product.nameEn}
                        </Link>
                        {item.product.nameBn ? <p className="mt-0.5 line-clamp-1 text-[10.5px] text-[#9a90a5]">{item.product.nameBn}</p> : null}
                        <p className="mt-1 text-[10.5px] text-[#9a90a5]">Sold by {item.product.seller.storeName}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void removeItem(item.product.id, item.product.nameEn)}
                        disabled={busy === item.product.id}
                        aria-label={`Remove ${item.product.nameEn} from cart`}
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[#a99cb8] transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"
                      >
                        <Trash2 size={15} aria-hidden />
                      </button>
                    </div>

                    <div className="mt-auto flex flex-wrap items-end justify-between gap-2 pt-2">
                      <div>
                        <div className="flex flex-wrap items-baseline gap-2">
                          <span className="text-[14px] font-extrabold text-[#27183e]">{formatTaka(item.product.pricePaisa)}</span>
                          {item.product.compareAtPricePaisa ? (
                            <span className="text-[11px] text-[#aaa2b3] line-through">{formatTaka(item.product.compareAtPricePaisa)}</span>
                          ) : null}
                        </div>
                        <p className={`mt-0.5 text-[10px] font-semibold ${item.available ? "text-emerald-700" : "text-rose-600"}`}>
                          {item.available
                            ? `${item.maxQuantity} in stock`
                            : `Only ${item.maxQuantity} available — reduce quantity to checkout`}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex h-9 items-center gap-0.5 rounded-lg border border-[#e9e3f2] px-0.5">
                          <button
                            type="button"
                            onClick={() => void updateQuantity(item.product.id, item.quantity - 1)}
                            disabled={item.quantity <= 1 || busy === item.product.id}
                            aria-label={`Decrease quantity of ${item.product.nameEn}`}
                            className="grid h-8 w-7 place-items-center rounded-md text-[#5c4d70] hover:bg-[#f7f2fd] disabled:opacity-30"
                          >
                            <Minus size={12} aria-hidden />
                          </button>
                          <span aria-live="polite" className="min-w-6 text-center text-[12px] font-extrabold text-[#302344]">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => void updateQuantity(item.product.id, item.quantity + 1)}
                            disabled={item.quantity >= Math.min(item.maxQuantity, 99) || busy === item.product.id}
                            aria-label={`Increase quantity of ${item.product.nameEn}`}
                            className="grid h-8 w-7 place-items-center rounded-md text-[#5c4d70] hover:bg-[#f7f2fd] disabled:opacity-30"
                          >
                            <Plus size={12} aria-hidden />
                          </button>
                        </div>
                        <span className="min-w-[70px] text-right text-[13px] font-extrabold text-[#302344]">
                          {busy === item.product.id ? (
                            <LoaderCircle size={14} className="ml-auto animate-spin text-brand-600" aria-label="Updating" />
                          ) : (
                            formatTaka(BigInt(item.product.pricePaisa) * BigInt(item.quantity))
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-[#f5f1f9] pt-2.5">
                  <button
                    type="button"
                    onClick={() => void moveToWishlist(item.product.id, item.product.nameEn)}
                    disabled={busy === item.product.id}
                    className="inline-flex items-center gap-1.5 text-[10.5px] font-bold text-[#7b6d8c] transition hover:text-brand-700 disabled:opacity-40"
                  >
                    <Heart size={12} aria-hidden /> Move to wishlist
                  </button>
                  <Link href={`/products/${encodeURIComponent(item.product.slug)}`} className="text-[10.5px] font-bold text-[#9a90a5] hover:text-brand-700">
                    View product
                  </Link>
                </div>
              </article>
            ))}

            <div className="grid gap-2.5 rounded-2xl border border-[#f0edf4] bg-[#fdfcff] p-4 sm:grid-cols-2">
              <p className="flex items-center gap-2 text-[11px] font-semibold text-[#6f6380]">
                <Truck size={14} className="text-brand-600" aria-hidden /> Cash on delivery nationwide
              </p>
              <p className="flex items-center gap-2 text-[11px] font-semibold text-[#6f6380]">
                <ShieldCheck size={14} className="text-brand-600" aria-hidden /> Stock revalidated at checkout
              </p>
            </div>
          </div>

          <aside className="lg:sticky lg:top-[150px]">
            <div className="rounded-2xl border border-[#eeeaf3] bg-white p-5">
              <h2 className="text-[15px] font-extrabold text-[#24143f]">Order summary</h2>
              <dl className="mt-4 space-y-2.5 text-[12px]">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-[#8b7f9b]">Subtotal · {cart?.itemCount} item{(cart?.itemCount ?? 0) === 1 ? "" : "s"}</dt>
                  <dd className="font-bold text-[#302344]">{formatTaka(subtotal)}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-[#8b7f9b]">Delivery fee</dt>
                  <dd className="font-semibold text-[#8b7f9b]">At checkout</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-[#8b7f9b]">Discounts</dt>
                  <dd className="font-semibold text-[#8b7f9b]">Applied at checkout</dd>
                </div>
              </dl>
              <div className="mt-4 flex items-baseline justify-between border-t border-[#f0ecf4] pt-4">
                <span className="text-[13px] font-extrabold text-[#24143f]">Total so far</span>
                <span className="text-xl font-black tracking-tight text-[#24143f]">{formatTaka(subtotal)}</span>
              </div>
              {hasIssue ? (
                <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-[10.5px] font-semibold leading-4 text-rose-700">
                  Some quantities exceed current stock. Update them before checkout.
                </p>
              ) : null}
              <Link
                href="/checkout"
                aria-disabled={hasIssue}
                onClick={(event) => {
                  if (hasIssue) event.preventDefault();
                }}
                className={`mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl text-[13px] font-extrabold text-white transition ${
                  hasIssue ? "cursor-not-allowed bg-[#c9bdd8]" : "bg-brand-600 hover:bg-brand-700"
                }`}
              >
                Proceed to checkout <ArrowRight size={15} aria-hidden />
              </Link>
              <p className="mt-3 text-center text-[10px] leading-4 text-[#a096ad]">
                Payment is cash on delivery. Delivery charges are confirmed before you place the order.
              </p>
            </div>
            <div className="mt-3 rounded-2xl bg-[#f7f2ff] p-4">
              <p className="text-[11px] font-extrabold text-[#4d2f7d]">Need help with an order?</p>
              <p className="mt-1 text-[10.5px] leading-5 text-[#7a6a90]">
                Visit the <Link href="/help" className="font-bold underline decoration-[#cdbce8] underline-offset-2">help centre</Link> for delivery, COD and return answers.
              </p>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
