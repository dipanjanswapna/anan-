"use client";

import Link from "next/link";
import { Eye, Heart, ImageOff, Plus, Store } from "lucide-react";
import { useState } from "react";
import { discountPercent, formatTaka } from "@/lib/format";
import { useProductActions } from "@/lib/product-actions";
import { QuickViewDialog } from "@/components/quick-view-dialog";

export type CatalogProduct = {
  id: string;
  nameEn: string;
  nameBn: string | null;
  slug: string;
  descriptionEn?: string | null;
  pricePaisa: string;
  compareAtPricePaisa: string | null;
  stockOnHand: number;
  category: { nameEn: string; nameBn?: string | null; slug: string };
  seller: { storeName: string; storeSlug: string };
  images?: { url: string | null; altText: string }[];
};

export function CatalogProductCard({ product, priority = false }: { product: CatalogProduct; priority?: boolean }) {
  const [quickView, setQuickView] = useState(false);
  const image = product.images?.find((item) => item.url);
  const discount = discountPercent(product.pricePaisa, product.compareAtPricePaisa);
  const outOfStock = product.stockOnHand < 1;
  const lowStock = !outOfStock && product.stockOnHand <= 5;
  const productHref = `/products/${encodeURIComponent(product.slug)}`;
  const { busy, saved, status, added, addToCart, toggleWishlist } = useProductActions(product.id, productHref);

  return (
    <article className="product-card group relative flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-[#eeeaf3] bg-white transition duration-300 hover:-translate-y-1 hover:border-[#ded0f7] hover:shadow-soft">
      <div className="relative overflow-hidden bg-[#f6f2fa]">
        <Link href={productHref} className="block focus-visible:outline-none" aria-label={`View ${product.nameEn}`}>
          <div className="aspect-[4/4.6] w-full overflow-hidden">
            {image?.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image.url}
                alt={image.altText || product.nameEn}
                loading={priority ? "eager" : "lazy"}
                fetchPriority={priority ? "high" : "auto"}
                className="product-image h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-brand-300">
                <ImageOff size={34} strokeWidth={1.2} aria-hidden />
                <span className="text-[10px] font-semibold text-[#a99cb8]">Image coming soon</span>
              </div>
            )}
          </div>
        </Link>

        <div className="pointer-events-none absolute inset-x-2 top-2 flex items-start justify-between gap-2">
          <div className="pointer-events-auto flex flex-col items-start gap-1.5">
            {discount !== null ? (
              <span className="rounded-full bg-[#fff1e6] px-2.5 py-1 text-[10px] font-extrabold text-[#b35c1e] shadow-sm">
                −{discount}%
              </span>
            ) : null}
            {lowStock ? (
              <span className="rounded-full bg-white/95 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[.06em] text-[#b35c1e] shadow-sm">
                Only {product.stockOnHand} left
              </span>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => void toggleWishlist()}
            disabled={busy === "wishlist"}
            aria-label={saved ? `Remove ${product.nameEn} from wishlist` : `Save ${product.nameEn} to wishlist`}
            aria-pressed={saved}
            className={`pointer-events-auto grid h-9 w-9 place-items-center rounded-full bg-white/95 shadow-sm ring-1 ring-black/[.04] backdrop-blur transition hover:scale-105 disabled:opacity-60 ${
              saved ? "text-[#d6356b]" : "text-[#5b4a70] hover:text-[#d6356b]"
            }`}
          >
            <Heart size={16} fill={saved ? "currentColor" : "none"} aria-hidden />
          </button>
        </div>

        <button
          type="button"
          onClick={() => setQuickView(true)}
          className="absolute inset-x-2 bottom-2 hidden h-9 items-center justify-center gap-1.5 rounded-xl bg-white/95 text-[11px] font-bold text-[#3f2b5c] shadow-sm backdrop-blur transition hover:bg-white sm:flex sm:translate-y-2 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 sm:focus-visible:translate-y-0 sm:focus-visible:opacity-100"
        >
          <Eye size={14} aria-hidden /> Quick view
        </button>

        {outOfStock ? (
          <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 bg-[#24143f]/80 py-2 text-center text-[10px] font-bold uppercase tracking-[.14em] text-white">
            Out of stock
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-3 sm:p-3.5">
        <p className="text-[9px] font-bold uppercase tracking-[.13em] text-[#a096ad]">{product.category.nameEn}</p>
        <Link href={productHref} className="mt-1.5 block">
          <h3 className="line-clamp-2 min-h-[36px] text-[12px] font-semibold leading-[1.5] text-[#302344] transition group-hover:text-brand-700 sm:min-h-[38px] sm:text-[13px]">
            {product.nameEn}
          </h3>
        </Link>
        {product.nameBn ? <p className="mt-0.5 line-clamp-1 text-[10.5px] text-[#9a90a5]">{product.nameBn}</p> : null}

        <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-[15px] font-extrabold tracking-tight text-[#27183e]">{formatTaka(product.pricePaisa)}</span>
          {product.compareAtPricePaisa ? (
            <span className="text-[11px] font-medium text-[#aaa2b3] line-through">{formatTaka(product.compareAtPricePaisa)}</span>
          ) : null}
        </div>

        <p className="mt-1.5 flex items-center gap-1 text-[10px] text-[#9b91a8]">
          <Store size={11} aria-hidden />
          <span className="truncate">{product.seller.storeName}</span>
        </p>

        <div className="mt-auto flex items-center gap-1.5 pt-2.5">
          <Link
            href={productHref}
            className="inline-flex h-9 flex-1 items-center justify-center rounded-lg bg-[#f6f1fc] text-[11px] font-extrabold text-brand-700 transition hover:bg-[#ece1fd]"
          >
            View details
          </Link>
          <button
            type="button"
            onClick={() => void addToCart(1)}
            disabled={outOfStock || busy !== null}
            aria-label={outOfStock ? `${product.nameEn} is out of stock` : `Add ${product.nameEn} to cart`}
            className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg text-white transition disabled:cursor-not-allowed disabled:opacity-40 ${
              added ? "bg-emerald-600" : "bg-brand-600 hover:bg-brand-700"
            }`}
          >
            <Plus size={16} aria-hidden />
          </button>
        </div>
        <p role="status" aria-live="polite" className="min-h-[14px] pt-1 text-[10px] font-semibold leading-[14px] text-brand-700">
          {status}
        </p>
        <button
          type="button"
          onClick={() => setQuickView(true)}
          className="mt-0.5 inline-flex items-center gap-1 self-start text-[10px] font-bold text-[#8a7c9c] hover:text-brand-700 sm:hidden"
        >
          <Eye size={11} aria-hidden /> Quick view
        </button>
      </div>

      <QuickViewDialog product={product} open={quickView} onClose={() => setQuickView(false)} />
    </article>
  );
}
