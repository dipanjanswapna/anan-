"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type Busy = "cart" | "wishlist" | null;

export const CART_UPDATED_EVENT = "anan:cart-updated";

/**
 * Shared add-to-cart / wishlist behaviour for product cards and quick view.
 * Signs the shopper in instead of failing silently when the session is missing.
 */
export function useProductActions(productId: string, nextPath: string) {
  const router = useRouter();
  const [busy, setBusy] = useState<Busy>(null);
  const [saved, setSaved] = useState(false);
  const [status, setStatus] = useState("");
  const [added, setAdded] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  const announce = useCallback((message: string) => {
    setStatus(message);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setStatus(""), 3200);
  }, []);

  const addToCart = useCallback(
    async (quantity = 1) => {
      if (busy) return false;
      setBusy("cart");
      try {
        const response = await fetch(`/api/account/me/cart/items/${encodeURIComponent(productId)}`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ quantity }),
        });
        const data = await response.json().catch(() => ({}));
        if (response.status === 401) {
          router.push(`/login?next=${encodeURIComponent(nextPath)}`);
          return false;
        }
        if (!response.ok) throw new Error(data.message || "Could not add this product to your cart.");
        setAdded(true);
        announce(data.message || "Added to your cart.");
        window.dispatchEvent(new Event(CART_UPDATED_EVENT));
        return true;
      } catch (error) {
        announce(error instanceof Error ? error.message : "Could not add this product to your cart.");
        return false;
      } finally {
        setBusy(null);
      }
    },
    [announce, busy, nextPath, productId, router],
  );

  const toggleWishlist = useCallback(async () => {
    if (busy) return;
    setBusy("wishlist");
    try {
      const response = await fetch(`/api/account/me/wishlist/${encodeURIComponent(productId)}`, {
        method: saved ? "DELETE" : "POST",
      });
      const data = await response.json().catch(() => ({}));
      if (response.status === 401) {
        router.push(`/login?next=${encodeURIComponent(nextPath)}`);
        return;
      }
      if (!response.ok) throw new Error(data.message || "Could not update your wishlist.");
      setSaved(!saved);
      announce(saved ? "Removed from your wishlist." : "Saved to your wishlist.");
    } catch (error) {
      announce(error instanceof Error ? error.message : "Could not update your wishlist.");
    } finally {
      setBusy(null);
    }
  }, [announce, busy, nextPath, productId, router, saved]);

  return { busy, saved, status, added, addToCart, toggleWishlist, announce };
}
