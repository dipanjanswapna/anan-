"use client";

import Link from "next/link";
import { useState } from "react";
import { Search, ShoppingBag, UserRound, Menu, X, MapPin, Heart, ChevronDown } from "lucide-react";

const navItems = ["Electronics", "Fashion", "Beauty", "Home & Kitchen", "Grocery", "Books"];

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");

  return (
    <>
      <div className="bg-[#24143f] text-white">
        <div className="container-shell flex min-h-9 items-center justify-center gap-2 text-center text-[11px] font-medium tracking-wide sm:text-xs">
          <span className="text-[#d9c5ff]">✦</span>
          <span>Good things are closer than you think.</span>
          <span className="hidden text-white/55 sm:inline">— Free delivery on selected orders</span>
        </div>
      </div>
      <header className="sticky top-0 z-40 border-b border-[#eeeaf5] bg-white/95 backdrop-blur-xl">
        <div className="container-shell">
          <div className="flex h-[70px] items-center gap-3 sm:gap-7">
            <button aria-label="Open menu" onClick={() => setMenuOpen(!menuOpen)} className="rounded-xl p-2 text-[#39265b] hover:bg-[#f5f0ff] lg:hidden">
              {menuOpen ? <X size={21}/> : <Menu size={21}/>}
            </button>
            <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="ANAN home">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-lg font-black text-white shadow-[0_6px_16px_rgba(116,52,223,.25)]">a</span>
              <span className="text-[25px] font-extrabold tracking-[-1.5px] text-[#24143f]">anan<span className="text-brand-600">.</span></span>
            </Link>
            <div className="hidden min-w-0 flex-1 lg:block">
              <form action="/products" className="flex h-11 items-center gap-3 rounded-xl border border-[#e9e3f2] bg-[#faf9fc] px-4 transition focus-within:border-brand-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-brand-100">
                <Search size={18} className="shrink-0 text-[#8d819f]"/>
                <input name="q" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search for products, brands and more..." className="w-full bg-transparent text-sm text-[#302344] outline-none placeholder:text-[#a69db2]" />
                <button type="submit" aria-label="Search products"><kbd className="hidden rounded-md border border-[#e7e1ee] bg-white px-2 py-1 text-[10px] text-[#9b91a8] xl:block">ENTER</kbd></button>
              </form>
            </div>
            <div className="ml-auto flex items-center gap-1 sm:gap-3">
              <button className="hidden items-center gap-2 rounded-xl px-2 py-2 text-left hover:bg-[#f8f5fc] sm:flex">
                <MapPin size={19} className="text-brand-600"/>
                <span><span className="block text-[10px] text-[#958ba2]">Deliver to</span><span className="flex items-center gap-1 text-xs font-semibold">Dhaka <ChevronDown size={12}/></span></span>
              </button>
              <button aria-label="Wishlist" className="hidden rounded-xl p-2.5 text-[#49375f] hover:bg-[#f5f0ff] sm:block"><Heart size={20}/></button>
              <button aria-label="Account" className="rounded-xl p-2.5 text-[#49375f] hover:bg-[#f5f0ff]"><UserRound size={20}/></button>
              <button aria-label="Shopping bag" className="relative rounded-xl p-2.5 text-[#49375f] hover:bg-[#f5f0ff]"><ShoppingBag size={21}/><span className="absolute right-1 top-1 grid h-4 w-4 place-items-center rounded-full bg-brand-600 text-[9px] font-bold text-white">0</span></button>
            </div>
          </div>
          <div className="flex items-center gap-5 overflow-x-auto border-t border-[#f3eff7] py-3 soft-scrollbar lg:gap-8">
            <Link href="/categories" className="hidden shrink-0 items-center gap-2 text-xs font-bold text-brand-700 lg:flex"><span className="grid h-6 w-6 place-items-center rounded-md bg-brand-50">☷</span> All categories</Link>
            {navItems.map((item, i) => <Link key={item} href={`/categories/${item.toLowerCase().replaceAll(" ", "-")}`} className={`shrink-0 text-xs font-semibold transition hover:text-brand-600 ${i === 0 ? "text-brand-700" : "text-[#71677e]"}`}>{item}</Link>)}
            <Link href="/deals" className="ml-auto hidden shrink-0 rounded-full bg-[#fff3e8] px-3 py-1.5 text-[11px] font-bold text-[#bd6424] lg:block">✦ Today’s deals</Link>
          </div>
        </div>
        {menuOpen && <div className="absolute inset-x-0 top-full border-b border-[#eeeaf5] bg-white p-4 shadow-soft lg:hidden"><div className="container-shell grid grid-cols-2 gap-2">{navItems.map(item => <Link onClick={() => setMenuOpen(false)} key={item} href="/categories" className="rounded-xl bg-[#faf8fd] px-4 py-3 text-sm font-semibold text-[#49375f]">{item}</Link>)}</div></div>}
      </header>
      <div className="container-shell py-3 lg:hidden">
        <form action="/products" className="flex h-11 items-center gap-3 rounded-xl border border-[#e9e3f2] bg-[#faf9fc] px-4 focus-within:border-brand-400">
          <Search size={18} className="text-[#8d819f]"/>
          <input name="q" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search products and brands..." className="w-full bg-transparent text-sm outline-none placeholder:text-[#a69db2]"/>
        </form>
      </div>
    </>
  );
}