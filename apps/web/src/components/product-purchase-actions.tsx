"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, Minus, Plus, ShoppingBag, Zap } from "lucide-react";
import { useState } from "react";
import { formatTaka } from "@/lib/format";
import { useProductActions } from "@/lib/product-actions";

export function ProductPurchaseActions({
  productId,
  slug,
  stockOnHand,
  pricePaisa,
}: {
  productId: string;
  slug: string;
  stockOnHand: number;
  pricePaisa: string;
}) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [buying, setBuying] = useState(false);
  const max = Math.max(1, Math.min(stockOnHand, 99));
  const outOfStock = stockOnHand < 1;
  const href = `/products/${encodeURIComponent(slug)}`;
  const { busy, saved, status, addToCart, toggleWishlist } = useProductActions(productId, href);

  async function buyNow() {
    if (buying || outOfStock) return;
    setBuying(true);
    const added = await addToCart(quantity);
    if (added) router.push("/checkout");
    setBuying(false);
  }

  return (
    <>
      <div className="mt-6">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex h-12 items-center gap-1 rounded-xl border border-[#e9e3f2] bg-white px-1">
            <button
              type="button"
              onClick={() => setQuantity((value) => Math.max(1, value - 1))}
              disabled={quantity <= 1}
              aria-label="Decrease quantity"
              className="grid h-9 w-9 place-items-center rounded-lg text-[#5c4d70] transition hover:bg-[#f6f0ff] disabled:opacity-30"
            >
              <Minus size={14} aria-hidden />
            </button>
            <span aria-live="polite" className="min-w-7 text-center text-sm font-extrabold text-[#302344]">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((value) => Math.min(max, value + 1))}
              disabled={quantity >= max}
              aria-label="Increase quantity"
              className="grid h-9 w-9 place-items-center rounded-lg text-[#5c4d70] transition hover:bg-[#f6f0ff] disabled:opacity-30"
            >
              <Plus size={14} aria-hidden />
            </button>
          </div>
          <button
            type="button"
            onClick={() => void addToCart(quantity)}
            disabled={outOfStock || busy !== null}
            className="inline-flex h-12 min-w-[150px] flex-1 items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 text-[13px] font-extrabold text-white shadow-[0_10px_24px_-10px_rgba(116,52,223,.75)] transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-45 sm:flex-none"
          >
            <ShoppingBag size={17} aria-hidden />
            {busy === "cart" ? "Adding…" : "Add to cart"}
          </button>
          <button
            type="button"
            onClick={() => void buyNow()}
            disabled={outOfStock || busy !== null || buying}
            className="inline-flex h-12 min-w-[130px] flex-1 items-center justify-center gap-2 rounded-xl border border-[#24143f] bg-[#24143f] px-5 text-[13px] font-extrabold text-white transition hover:bg-[#35215a] disabled:cursor-not-allowed disabled:opacity-45 sm:flex-none"
          >
            <Zap size={16} aria-hidden />
            {buying ? "Opening…" : "Buy now"}
          </button>
          <button
            type="button"
            onClick={() => void toggleWishlist()}
            disabled={busy !== null}
            aria-pressed={saved}
            aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
            className={`inline-flex h-12 w-12 items-center justify-center rounded-xl border transition disabled:opacity-50 ${
              saved
                ? "border-[#f5c9d9] bg-[#fff0f5] text-[#d6356b]"
                : "border-[#e9e3f2] bg-white text-[#5c4d70] hover:border-brand-300 hover:text-brand-700"
            }`}
          >
            <Heart size={18} fill={saved ? "currentColor" : "none"} aria-hidden />
          </button>
        </div>
        <p role="status" aria-live="polite" className="mt-2 min-h-[18px] text-[11px] font-semibold text-brand-700">
          {status}
        </p>
        {buying ? (
          <p className="sr-only" aria-live="assertive">
            Adding this product and opening checkout.
          </p>
        ) : null}
      </div>

      {/* Mobile sticky purchase bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#eee8f5] bg-white/95 px-3 pb-[calc(10px+env(safe-area-inset-bottom))] pt-2.5 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-3xl items-center gap-2.5">
          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-[.12em] text-[#a096ad]">Total</p>
            <p className="truncate text-[15px] font-extrabold text-[#24143f]">
              {formatTaka(BigInt(pricePaisa) * BigInt(quantity))}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void addToCart(quantity)}
            disabled={outOfStock || busy !== null}
            className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand-600 text-xs font-extrabold text-white disabled:opacity-45"
          >
            <ShoppingBag size={15} aria-hidden />
            {busy === "cart" ? "Adding…" : outOfStock ? "Out of stock" : "Add to cart"}
          </button>
          <Link
            href="/cart"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#e9e3f2] text-[#5c4d70]"
            aria-label="Open your cart"
          >
            <ShoppingBag size={17} aria-hidden />
          </Link>
        </div>
      </div>
    </>
  );
}
