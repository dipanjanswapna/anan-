"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, Heart, ImageOff, LoaderCircle, ShoppingBag, Trash2 } from "lucide-react";
import { CART_UPDATED_EVENT } from "@/lib/product-actions";
import { formatTaka } from "@/lib/format";

type Item = {
  id: string;
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

export function CustomerWishlist() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/account/me/wishlist", { cache: "no-store" });
      if (response.status === 401) {
        window.location.assign("/login?next=/wishlist");
        return;
      }
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to load your wishlist.");
      setItems(data.items ?? []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load your wishlist.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function remove(productId: string, name: string) {
    setBusy(productId);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/account/me/wishlist/${encodeURIComponent(productId)}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Could not remove this product.");
      await load();
      setMessage(`${name} removed from your wishlist.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not remove this product.");
    } finally {
      setBusy(null);
    }
  }

  async function addCart(productId: string, name: string) {
    setBusy(productId);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/account/me/cart/items/${encodeURIComponent(productId)}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ quantity: 1 }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Could not add this product to your cart.");
      setMessage(`${name} added to your cart.`);
      window.dispatchEvent(new Event(CART_UPDATED_EVENT));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not add this product to your cart.");
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return (
      <div className="container-shell max-w-5xl py-10">
        <div className="h-8 w-44 animate-pulse rounded-lg bg-[#efe9f7]" />
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((index) => <div key={index} className="h-64 animate-pulse rounded-2xl bg-[#f6f2fa]" />)}
        </div>
        <p role="status" className="sr-only">Loading your wishlist</p>
      </div>
    );
  }

  return (
    <div className="container-shell max-w-5xl py-7 sm:py-11">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.2em] text-brand-600">Saved for later</p>
          <h1 className="mt-1.5 text-[28px] font-extrabold tracking-[-1px] text-[#24143f] sm:text-[34px]">My wishlist</h1>
          <p className="mt-1 text-[12.5px] text-[#8b7f9b]">{items.length} saved product{items.length === 1 ? "" : "s"}</p>
        </div>
        <Link href="/products" className="inline-flex items-center gap-1 text-[11.5px] font-bold text-brand-700 hover:underline">
          Continue shopping <ArrowRight size={13} aria-hidden />
        </Link>
      </div>

      {error ? <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-[11.5px] text-rose-700">{error}</p> : null}
      {message ? <p role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-[11.5px] text-emerald-800">{message}</p> : null}

      {!items.length ? (
        <div className="mt-6 rounded-[24px] border border-[#eeeaf3] bg-white px-6 py-14 text-center sm:py-20">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#fff0f5] text-[#d6356b]">
            <Heart size={28} aria-hidden />
          </span>
          <h2 className="mt-5 text-xl font-extrabold text-[#2c1c44]">Nothing saved yet</h2>
          <p className="mx-auto mt-2 max-w-sm text-[12.5px] leading-6 text-[#8b7f9b]">
            Tap the heart on any product to keep it here for later.
          </p>
          <Link href="/products" className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-brand-600 px-5 text-xs font-extrabold text-white">
            Explore products <ArrowRight size={15} aria-hidden />
          </Link>
        </div>
      ) : (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {items.map((item) => {
            const outOfStock = item.product.stockOnHand < 1;
            return (
              <article key={item.id} className="flex flex-col overflow-hidden rounded-2xl border border-[#eeeaf3] bg-white">
                <Link href={`/products/${encodeURIComponent(item.product.slug)}`} className="block bg-[#f6f2fa]">
                  <div className="aspect-[4/3.4] w-full overflow-hidden">
                    {item.product.image?.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.product.image.url} alt={item.product.image.altText || item.product.nameEn} className="h-full w-full object-cover" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-brand-300"><ImageOff size={26} aria-hidden /></span>
                    )}
                  </div>
                </Link>
                <div className="flex flex-1 flex-col p-3.5">
                  <Link href={`/products/${encodeURIComponent(item.product.slug)}`} className="line-clamp-2 text-[12.5px] font-bold leading-5 text-[#302344] hover:text-brand-700">
                    {item.product.nameEn}
                  </Link>
                  {item.product.nameBn ? <p className="mt-0.5 line-clamp-1 text-[10.5px] text-[#9a90a5]">{item.product.nameBn}</p> : null}
                  <div className="mt-1.5 flex flex-wrap items-baseline gap-2">
                    <span className="text-[14px] font-extrabold text-[#27183e]">{formatTaka(item.product.pricePaisa)}</span>
                    {item.product.compareAtPricePaisa ? (
                      <span className="text-[10.5px] text-[#aaa2b3] line-through">{formatTaka(item.product.compareAtPricePaisa)}</span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-[10px] text-[#9a90a5]">{item.product.seller.storeName}</p>
                  <p className={`mt-1 text-[10px] font-bold ${outOfStock ? "text-rose-600" : "text-emerald-700"}`}>
                    {outOfStock ? "Out of stock" : `${item.product.stockOnHand} in stock`}
                  </p>
                  <div className="mt-auto flex gap-1.5 pt-3">
                    <button
                      type="button"
                      disabled={outOfStock || busy === item.product.id}
                      onClick={() => void addCart(item.product.id, item.product.nameEn)}
                      className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand-600 text-[11px] font-extrabold text-white transition hover:bg-brand-700 disabled:opacity-40"
                    >
                      {busy === item.product.id ? <LoaderCircle size={13} className="animate-spin" aria-hidden /> : <ShoppingBag size={13} aria-hidden />}
                      Add to cart
                    </button>
                    <button
                      type="button"
                      onClick={() => void remove(item.product.id, item.product.nameEn)}
                      disabled={busy === item.product.id}
                      aria-label={`Remove ${item.product.nameEn} from wishlist`}
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[#eeeaf3] text-[#a99cb8] transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"
                    >
                      <Trash2 size={14} aria-hidden />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
