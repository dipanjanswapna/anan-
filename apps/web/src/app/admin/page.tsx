import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Bell, ImageIcon, PackageCheck, RotateCcw, ShoppingBag, Store } from "lucide-react";

export const metadata: Metadata = {
  title: "Admin console — ANAN",
  description: "ANAN operations console for product review, orders, returns and seller applications.",
  robots: { index: false, follow: false },
};

const areas = [
  {
    href: "/admin/products",
    title: "Product review",
    detail: "Approve or reject seller listings before they reach the public catalogue.",
    icon: PackageCheck,
    cta: "Review products",
  },
  {
    href: "/admin/product-images",
    title: "Product images",
    detail: "Review uploaded product photography for approval.",
    icon: ImageIcon,
    cta: "Review images",
  },
  {
    href: "/admin/orders",
    title: "Orders",
    detail: "See marketplace orders and their seller-level fulfilment status.",
    icon: ShoppingBag,
    cta: "Open orders",
  },
  {
    href: "/admin/returns",
    title: "Returns",
    detail: "Work through customer return requests and refund references.",
    icon: RotateCcw,
    cta: "Open returns",
  },
  {
    href: "/admin/seller-applications",
    title: "Seller applications",
    detail: "Approve or reject new store applications.",
    icon: Store,
    cta: "Review applications",
  },
  {
    href: "/admin/notifications",
    title: "Notifications",
    detail: "Operational alerts for new reviews, applications and returns.",
    icon: Bell,
    cta: "Open notifications",
  },
];

export default function AdminHomePage() {
  return (
    <main className="min-h-screen bg-[#faf9fc]">
      <div className="container-shell py-8 sm:py-12">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.2em] text-brand-600">ANAN Admin Console</p>
            <h1 className="mt-2 text-[28px] font-extrabold tracking-[-1px] text-[#281743] sm:text-[34px]">Operations dashboard</h1>
            <p className="mt-1 max-w-xl text-[12.5px] leading-6 text-[#82788f]">
              Every queue below reads live data from the ANAN API. Counts and records appear inside each area, so nothing
              here is a placeholder.
            </p>
          </div>
          <Link
            href="/admin/products"
            className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-brand-600 px-4 text-[11.5px] font-extrabold text-white hover:bg-brand-700"
          >
            Go to product review <ArrowRight size={14} aria-hidden />
          </Link>
        </header>

        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {areas.map((area) => (
            <Link
              key={area.href}
              href={area.href}
              className="group flex flex-col rounded-2xl border border-[#eee8f5] bg-white p-5 transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-soft"
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f5f0fc] text-brand-700">
                <area.icon size={18} aria-hidden />
              </span>
              <span className="mt-3 text-[14px] font-extrabold text-[#302344]">{area.title}</span>
              <span className="mt-1 text-[11.5px] leading-5 text-[#82788f]">{area.detail}</span>
              <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-brand-700 group-hover:gap-2">
                {area.cta} <ArrowRight size={13} aria-hidden />
              </span>
            </Link>
          ))}
        </div>

        <p className="mt-6 rounded-xl border border-[#eee8f5] bg-white px-4 py-3 text-[11px] leading-5 text-[#8b7f9b]">
          Signed in as an admin? Access is verified per request by the API using your session cookie. If a page shows a
          sign-in error, your session has expired — <Link href="/admin/login" className="font-bold text-brand-700 underline">sign in again</Link>.
        </p>
      </div>
    </main>
  );
}
