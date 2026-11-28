"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, LogOut, Package, RotateCcw, Store } from "lucide-react";

const links = [
  { href: "/seller/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/seller/products", label: "Products", icon: Package },
  { href: "/seller/dashboard#returns", label: "Returns", icon: RotateCcw },
];

export function SellerNav() {
  const pathname = usePathname();

  async function signOut() {
    await fetch("/api/auth/otp/logout", { method: "POST" }).catch(() => undefined);
    window.location.assign("/seller/login");
  }

  return (
    <div className="border-b border-[#eee8f5] bg-white">
      <div className="container-shell flex h-14 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 overflow-x-auto soft-scrollbar">
          <Link href="/seller/dashboard" className="mr-2 flex shrink-0 items-center gap-2 text-sm font-extrabold text-[#281743]">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-600 text-xs font-black text-white">a</span>
            Seller Centre
          </Link>
          {links.map((link) => {
            const active = pathname === link.href.split("#")[0];
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition ${active ? "bg-brand-50 text-brand-700" : "text-[#6f6380] hover:bg-[#faf8fd]"}`}
              >
                <link.icon size={14} aria-hidden /> {link.label}
              </Link>
            );
          })}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link href="/" className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold text-[#6f6380] hover:bg-[#faf8fd] sm:inline-flex">
            <Store size={14} aria-hidden /> Storefront
          </Link>
          <button onClick={() => void signOut()} className="inline-flex items-center gap-1.5 rounded-lg border border-[#e8e2f0] px-3 py-2 text-xs font-bold text-[#5e526d] hover:bg-[#faf8fd]">
            <LogOut size={14} aria-hidden /> Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
