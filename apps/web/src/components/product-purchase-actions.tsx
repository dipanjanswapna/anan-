"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, ShoppingBag } from "lucide-react";

export function ProductPurchaseActions({ productId, stockOnHand }: { productId: string; stockOnHand: number }) {
  const [busy, setBusy] = useState<"cart" | "wishlist" | null>(null);
  const [message, setMessage] = useState("");
  const [loginRequired, setLoginRequired] = useState(false);

  async function run(action: "cart" | "wishlist") {
    setBusy(action); setMessage(""); setLoginRequired(false);
    try {
      const response = await fetch(action === "cart" ? `/api/account/me/cart/items/${productId}` : `/api/account/me/wishlist/${productId}`, {
        method: "POST",
        ...(action === "cart" ? { headers: { "content-type": "application/json" }, body: JSON.stringify({ quantity: 1 }) } : {}),
      });
      const data = await response.json().catch(() => ({}));
      if (response.status === 401) { setLoginRequired(true); throw new Error("Sign in to save products and use your cart."); }
      if (!response.ok) throw new Error(data.message || "Could not complete this action.");
      setMessage(data.message || "Saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Something went wrong.");
    } finally { setBusy(null); }
  }

  return <div className="mt-6">
    <div className="flex flex-wrap gap-3">
      <button disabled={stockOnHand < 1 || busy !== null} onClick={() => void run("cart")} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"><ShoppingBag size={17}/>{busy === "cart" ? "Adding…" : "Add to cart"}</button>
      <button disabled={busy !== null} onClick={() => void run("wishlist")} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#e8e1f0] px-5 py-3.5 text-sm font-bold text-[#5c4d70] hover:bg-[#faf8fd] disabled:opacity-50"><Heart size={17}/>{busy === "wishlist" ? "Saving…" : "Wishlist"}</button>
    </div>
    {message && <p role="status" className="mt-3 text-xs text-[#71677e]">{message} {loginRequired && <Link href="/login?next=/account" className="font-bold text-brand-700 underline">Sign in</Link>}</p>}
  </div>;
}
