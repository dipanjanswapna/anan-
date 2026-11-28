"use client";

import Link from "next/link";
import { ImageOff, Minus, Plus, ShoppingBag, Store, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { discountPercent, formatTaka } from "@/lib/format";
import { useProductActions } from "@/lib/product-actions";
import type { CatalogProduct } from "@/components/catalog-product-card";

export function QuickViewDialog({
  product,
  open,
  onClose,
}: {
  product: CatalogProduct;
  open: boolean;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const dialogRef = useRef<HTMLDivElement>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const image = product.images?.find((item) => item.url);
  const discount = discountPercent(product.pricePaisa, product.compareAtPricePaisa);
  const outOfStock = product.stockOnHand < 1;
  const max = Math.max(1, Math.min(product.stockOnHand, 99));
  const { busy, status, addToCart } = useProductActions(
    product.id,
    `/products/${encodeURIComponent(product.slug)}`,
  );

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    restoreFocus.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.setTimeout(() => dialogRef.current?.focus(), 0);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      restoreFocus.current?.focus();
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) setQuantity(1);
  }, [open]);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Close quick view"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-[#150a26]/65 backdrop-blur-sm"
        tabIndex={-1}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative z-10 max-h-[92dvh] w-full max-w-3xl overflow-y-auto rounded-t-[24px] bg-white p-4 shadow-2xl outline-none sm:rounded-[24px] sm:p-5"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close quick view"
          className="absolute right-3 top-3 z-20 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-[#4d3c62] shadow-sm ring-1 ring-[#eee8f5] transition hover:bg-[#f6f0ff]"
        >
          <X size={17} aria-hidden />
        </button>
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] sm:gap-6">
          <div className="relative overflow-hidden rounded-2xl bg-[#f6f2fa]">
            <div className="aspect-[4/4.4] w-full sm:aspect-[4/4.6]">
              {image?.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={image.url} alt={image.altText || product.nameEn} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-brand-300">
                  <ImageOff size={42} strokeWidth={1.2} aria-hidden />
                  <span className="text-[11px] font-semibold">Image coming soon</span>
                </div>
              )}
            </div>
            {discount !== null ? (
              <span className="absolute left-3 top-3 rounded-full bg-[#fff1e6] px-2.5 py-1 text-[10px] font-extrabold text-[#b35c1e]">
                −{discount}%
              </span>
            ) : null}
          </div>
          <div className="flex min-w-0 flex-col py-1 sm:py-2 sm:pr-6">
            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-brand-600">{product.category.nameEn}</p>
            <h2 id={titleId} className="mt-2 text-xl font-extrabold leading-tight tracking-[-.4px] text-[#24143f] sm:text-2xl">
              {product.nameEn}
            </h2>
            {product.nameBn ? <p className="mt-1 text-sm text-[#82778f]">{product.nameBn}</p> : null}
            <div className="mt-3 flex flex-wrap items-baseline gap-2">
              <span className="text-2xl font-black tracking-tight text-[#24143f]">{formatTaka(product.pricePaisa)}</span>
              {product.compareAtPricePaisa ? (
                <span className="text-sm text-[#a79eaf] line-through">{formatTaka(product.compareAtPricePaisa)}</span>
              ) : null}
            </div>
            <p className={`mt-2 text-xs font-bold ${outOfStock ? "text-rose-600" : product.stockOnHand <= 5 ? "text-[#b35c1e]" : "text-emerald-700"}`}>
              {outOfStock
                ? "Currently out of stock"
                : product.stockOnHand <= 5
                  ? `Only ${product.stockOnHand} left in stock`
                  : "In stock"}
            </p>
            {product.descriptionEn ? (
              <p className="mt-3 line-clamp-3 text-[12.5px] leading-6 text-[#756987]">{product.descriptionEn}</p>
            ) : null}
            <Link
              href={`/stores/${encodeURIComponent(product.seller.storeSlug)}`}
              className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#7b6d8c] hover:text-brand-700"
            >
              <Store size={13} aria-hidden /> {product.seller.storeName}
            </Link>

            <div className="mt-4 flex items-center gap-2">
              <div className="flex h-11 items-center gap-1 rounded-xl border border-[#e9e3f2] px-1">
                <button
                  type="button"
                  onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                  disabled={quantity <= 1}
                  aria-label="Decrease quantity"
                  className="grid h-8 w-8 place-items-center rounded-lg text-[#5c4d70] hover:bg-[#f6f0ff] disabled:opacity-30"
                >
                  <Minus size={13} aria-hidden />
                </button>
                <span aria-live="polite" className="min-w-6 text-center text-sm font-bold text-[#302344]">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((value) => Math.min(max, value + 1))}
                  disabled={quantity >= max}
                  aria-label="Increase quantity"
                  className="grid h-8 w-8 place-items-center rounded-lg text-[#5c4d70] hover:bg-[#f6f0ff] disabled:opacity-30"
                >
                  <Plus size={13} aria-hidden />
                </button>
              </div>
              <button
                type="button"
                disabled={outOfStock || busy !== null}
                onClick={() => void addToCart(quantity)}
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 text-xs font-extrabold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-45"
              >
                <ShoppingBag size={15} aria-hidden />
                {busy === "cart" ? "Adding…" : "Add to cart"}
              </button>
            </div>
            <p role="status" aria-live="polite" className="mt-2 min-h-[18px] text-[11px] font-semibold text-brand-700">
              {status}
            </p>
            <Link
              href={`/products/${encodeURIComponent(product.slug)}`}
              className="mt-auto pt-2 text-xs font-bold text-[#5c4d70] underline decoration-[#d9cde9] underline-offset-4 hover:text-brand-700"
            >
              View full details
            </Link>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
