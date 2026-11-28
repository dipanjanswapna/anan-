"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  ChevronDown,
  Heart,
  HelpCircle,
  MapPin,
  Menu,
  Package,
  Search,
  ShoppingBag,
  Sparkles,
  Store,
  UserRound,
  X,
} from "lucide-react";
import { CART_UPDATED_EVENT } from "@/lib/product-actions";

const navItems = [
  { label: "Electronics", slug: "electronics" },
  { label: "Fashion", slug: "fashion" },
  { label: "Beauty", slug: "beauty" },
  { label: "Home & Kitchen", slug: "home-kitchen" },
  { label: "Grocery", slug: "grocery" },
  { label: "Books", slug: "books" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cartCount, setCartCount] = useState<number | null>(null);

  const refreshCart = useCallback(async () => {
    try {
      const response = await fetch("/api/account/me/cart", { cache: "no-store" });
      if (!response.ok) {
        setCartCount(null);
        return;
      }
      const payload = (await response.json()) as { itemCount?: number; items?: unknown[] };
      setCartCount(typeof payload.itemCount === "number" ? payload.itemCount : (payload.items?.length ?? 0));
    } catch {
      setCartCount(null);
    }
  }, []);

  useEffect(() => {
    void refreshCart();
  }, [refreshCart, pathname]);

  useEffect(() => {
    const handler = () => void refreshCart();
    window.addEventListener(CART_UPDATED_EVENT, handler);
    return () => window.removeEventListener(CART_UPDATED_EVENT, handler);
  }, [refreshCart]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen]);

  return (
    <>
      <div className="bg-[#24143f] text-white">
        <div className="container-shell flex min-h-9 items-center justify-center gap-2 text-center text-[10.5px] font-medium tracking-wide sm:text-xs">
          <Sparkles size={12} className="shrink-0 text-[#d9c5ff]" aria-hidden />
          <span>Thoughtful finds from approved sellers</span>
          <span className="hidden text-white/50 sm:inline">· Cash on delivery across Bangladesh</span>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-[#eeeaf5] bg-white/95 backdrop-blur-xl">
        <div className="container-shell">
          <div className="flex h-[64px] items-center gap-2 sm:h-[72px] sm:gap-4 lg:gap-7">
            <button
              type="button"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              onClick={() => setMenuOpen((value) => !value)}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-[#39265b] transition hover:bg-[#f5f0ff] lg:hidden"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="ANAN home">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-brand-600 text-base font-black text-white shadow-[0_6px_16px_rgba(116,52,223,.25)] sm:h-9 sm:w-9 sm:text-lg">
                a
              </span>
              <span className="text-[22px] font-extrabold tracking-[-1.4px] text-[#24143f] sm:text-[25px]">
                anan<span className="text-brand-600">.</span>
              </span>
            </Link>

            <div className="hidden min-w-0 flex-1 lg:block">
              <form action="/products" role="search" className="flex h-11 items-center gap-3 rounded-xl border border-[#e9e3f2] bg-[#faf9fc] px-4 transition focus-within:border-brand-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-brand-100">
                <Search size={18} className="shrink-0 text-[#8d819f]" aria-hidden />
                <input
                  name="q"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  aria-label="Search products"
                  placeholder="Search products, categories and stores…"
                  className="w-full bg-transparent text-sm text-[#302344] outline-none placeholder:text-[#a69db2]"
                />
                <button type="submit" aria-label="Search products" className="shrink-0">
                  <kbd className="hidden rounded-md border border-[#e7e1ee] bg-white px-2 py-1 text-[10px] text-[#9b91a8] xl:block">ENTER</kbd>
                </button>
              </form>
            </div>

            <div className="ml-auto flex items-center gap-0.5 sm:gap-1.5">
              <Link
                href="/sell"
                className="hidden rounded-xl bg-brand-50 px-3 py-2 text-[11px] font-bold text-brand-700 transition hover:bg-brand-100 lg:inline-flex"
              >
                Sell on ANAN
              </Link>
              <Link href="/help#shipping" className="hidden items-center gap-2 rounded-xl px-2 py-2 hover:bg-[#f8f5fc] xl:flex">
                <MapPin size={18} className="text-brand-600" aria-hidden />
                <span>
                  <span className="block text-[9.5px] text-[#958ba2]">Deliver to</span>
                  <span className="flex items-center gap-1 text-[11.5px] font-semibold text-[#302344]">
                    Bangladesh <ChevronDown size={11} aria-hidden />
                  </span>
                </span>
              </Link>
              <Link href="/wishlist" aria-label="Wishlist" className="grid h-10 w-10 place-items-center rounded-xl text-[#49375f] transition hover:bg-[#f5f0ff]">
                <Heart size={19} />
              </Link>
              <Link href="/account" aria-label="Your account" className="grid h-10 w-10 place-items-center rounded-xl text-[#49375f] transition hover:bg-[#f5f0ff]">
                <UserRound size={19} />
              </Link>
              <Link
                href="/cart"
                aria-label={cartCount ? `Shopping cart, ${cartCount} items` : "Shopping cart"}
                className="relative grid h-10 w-10 place-items-center rounded-xl text-[#49375f] transition hover:bg-[#f5f0ff]"
              >
                <ShoppingBag size={20} />
                {cartCount !== null && cartCount > 0 ? (
                  <span className="absolute right-0.5 top-1 grid h-[17px] min-w-[17px] place-items-center rounded-full bg-brand-600 px-1 text-[9px] font-extrabold text-white ring-2 ring-white">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                ) : null}
              </Link>
            </div>
          </div>

          <div className="soft-scrollbar hidden items-center gap-5 overflow-x-auto border-t border-[#f3eff7] py-2.5 lg:flex lg:gap-7">
            <Link href="/categories" className="flex shrink-0 items-center gap-2 text-xs font-bold text-brand-700">
              <span className="grid h-6 w-6 place-items-center rounded-md bg-brand-50" aria-hidden>☷</span> All categories
            </Link>
            {navItems.map((item) => (
              <Link
                key={item.slug}
                href={`/categories/${item.slug}`}
                aria-current={pathname === `/categories/${item.slug}` ? "page" : undefined}
                className={`shrink-0 text-xs font-semibold transition hover:text-brand-600 ${
                  pathname === `/categories/${item.slug}` ? "text-brand-700" : "text-[#71677e]"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <Link href="/stores" className="shrink-0 text-xs font-semibold text-[#71677e] hover:text-brand-600">Stores</Link>
            <Link href="/deals" className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-full bg-[#fff3e8] px-3 py-1.5 text-[11px] font-bold text-[#bd6424]">
              <Sparkles size={12} aria-hidden /> Today’s deals
            </Link>
          </div>
        </div>

        <div className="container-shell py-2.5 lg:hidden">
          <form action="/products" role="search" className="flex h-10 items-center gap-2.5 rounded-xl border border-[#e9e3f2] bg-[#faf9fc] px-3.5 focus-within:border-brand-400">
            <Search size={16} className="text-[#8d819f]" aria-hidden />
            <input name="q" aria-label="Search products" placeholder="Search products and brands…" className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#a69db2]" />
          </form>
        </div>

        {menuOpen ? (
          <div id="mobile-menu" className="absolute inset-x-0 top-full max-h-[calc(100dvh-104px)] overflow-y-auto border-t border-[#eeeaf5] bg-white shadow-soft lg:hidden">
            <nav aria-label="Mobile" className="container-shell grid gap-1 py-4">
              <p className="px-1 pb-1 text-[9.5px] font-bold uppercase tracking-[.16em] text-[#a096ad]">Shop by category</p>
              <div className="grid grid-cols-2 gap-1.5">
                {navItems.map((item) => (
                  <Link key={item.slug} href={`/categories/${item.slug}`} className="rounded-xl bg-[#faf8fd] px-3.5 py-3 text-[12.5px] font-semibold text-[#49375f]">
                    {item.label}
                  </Link>
                ))}
                <Link href="/deals" className="rounded-xl bg-[#fff3e8] px-3.5 py-3 text-[12.5px] font-bold text-[#bd6424]">Today’s deals</Link>
                <Link href="/stores" className="rounded-xl bg-[#faf8fd] px-3.5 py-3 text-[12.5px] font-semibold text-[#49375f]">Stores</Link>
              </div>
              <p className="px-1 pb-1 pt-3 text-[9.5px] font-bold uppercase tracking-[.16em] text-[#a096ad]">Your account</p>
              <div className="grid gap-0.5">
                {[
                  { label: "Sign in", href: "/login", icon: UserRound },
                  { label: "Create an account", href: "/signup", icon: UserRound },
                  { label: "My orders", href: "/orders", icon: Package },
                  { label: "Wishlist", href: "/wishlist", icon: Heart },
                  { label: "Help centre", href: "/help", icon: HelpCircle },
                  { label: "Sell on ANAN", href: "/sell", icon: Store },
                ].map((item) => (
                  <Link key={item.href} href={item.href} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[12.5px] font-semibold text-[#49375f] hover:bg-[#faf8fd]">
                    <item.icon size={15} className="text-[#9a90a5]" aria-hidden /> {item.label}
                  </Link>
                ))}
              </div>
              <Link href="/cart" className="mt-2 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-600 text-[12.5px] font-extrabold text-white">
                <ShoppingBag size={15} aria-hidden /> View cart{cartCount ? ` (${cartCount})` : ""}
              </Link>
            </nav>
          </div>
        ) : null}
      </header>
    </>
  );
}
