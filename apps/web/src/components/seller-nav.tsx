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
    <div className="sticky top-0 z-30 border-b border-[#ece6f3] bg-white/95 shadow-[0_8px_24px_-24px_rgba(35,18,58,.35)] backdrop-blur-xl">
      <div className="container-shell flex min-h-[64px] items-center justify-between gap-3 py-2">
        <div className="flex min-w-0 items-center gap-2 overflow-x-auto soft-scrollbar">
          <Link href="/seller/dashboard" className="mr-2 flex shrink-0 items-center gap-2 text-sm font-extrabold text-[#281743]">
            <span className="grid h-7 w-7 place-items-center rounded-xl bg-gradient-to-br from-[#8754e8] to-[#5d2ca3] text-xs font-black text-white shadow-[0_5px_14px_-7px_rgba(116,52,223,.9)]">a</span>
            Seller Centre
          </Link>
          {links.map((link) => {
            const active = pathname === link.href.split("#")[0];
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2.5 text-xs font-bold transition ${active ? "bg-[#eee6ff] text-[#5d2ca3] shadow-[inset_0_-2px_0_#7434df]" : "text-[#6f6380] hover:bg-[#faf8fd]"}`}
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
          <button onClick={() => void signOut()} className="inline-flex items-center gap-1.5 rounded-lg border border-[#e8e2f0] px-3.5 py-2.5 text-xs font-bold text-[#5e526d] hover:bg-[#faf8fd]">
            <LogOut size={14} aria-hidden /> Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
