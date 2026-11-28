import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight, Bell, Boxes, ImageIcon, LayoutDashboard, PackageCheck,
  RotateCcw, ShoppingBag, Store, ShieldCheck, ChevronRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Admin console — ANAN",
  description: "ANAN operations console for product review, orders, returns and seller applications.",
  robots: { index: false, follow: false },
};

const areas = [
  { href: "/admin/products", title: "Product review", detail: "Approve or reject seller listings before they reach the public catalogue.", icon: PackageCheck, cta: "Review products", tone: "violet" },
  { href: "/admin/product-images", title: "Product images", detail: "Review uploaded product photography for approval.", icon: ImageIcon, cta: "Review images", tone: "rose" },
  { href: "/admin/orders", title: "Orders", detail: "See marketplace orders and seller-level fulfilment status.", icon: ShoppingBag, cta: "Open orders", tone: "blue" },
  { href: "/admin/returns", title: "Returns", detail: "Work through customer return requests and refund references.", icon: RotateCcw, cta: "Open returns", tone: "amber" },
  { href: "/admin/seller-applications", title: "Seller applications", detail: "Approve or reject new store applications.", icon: Store, cta: "Review applications", tone: "emerald" },
  { href: "/admin/notifications", title: "Notifications", detail: "Operational alerts for reviews, applications and returns.", icon: Bell, cta: "Open notifications", tone: "slate" },
];

const navigation = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/products", label: "Product review", icon: PackageCheck },
  { href: "/admin/product-images", label: "Image moderation", icon: ImageIcon },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/returns", label: "Returns", icon: RotateCcw },
  { href: "/admin/seller-applications", label: "Seller applications", icon: Store },
  { href: "/admin/notifications", label: "Notifications", icon: Bell },
];

const toneClasses: Record<string, string> = {
  violet: "bg-[#f1eaff] text-[#7040c5]",
  rose: "bg-[#fff0f1] text-[#c45d73]",
  blue: "bg-[#eaf3ff] text-[#4277bd]",
  amber: "bg-[#fff5e8] text-[#b9792c]",
  emerald: "bg-[#eaf8f0] text-[#39835c]",
  slate: "bg-[#f0eff4] text-[#71677e]",
};

export default function AdminHomePage() {
  return (
    <main className="min-h-screen bg-[#f8f7fb] text-[#211a2d]">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="anan-sidebar sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col px-4 py-6 lg:flex">
          <Link href="/admin" className="flex items-center gap-3 px-3" aria-label="ANAN Admin home">
            <span className="grid h-10 w-10 place-items-center rounded-[14px] bg-gradient-to-br from-[#8754e8] to-[#5d2ca3] text-lg font-black text-white shadow-md">a</span>
            <span><span className="block text-[19px] font-extrabold tracking-[-1px] text-[#24143f]">anan<span className="text-[#7434df]">.</span></span><span className="block text-[9px] font-bold uppercase tracking-[.18em] text-[#9a90a5]">Admin workspace</span></span>
          </Link>
          <p className="mb-2 mt-10 px-3 text-[9px] font-extrabold uppercase tracking-[.18em] text-[#a39aaa]">Workspace</p>
          <nav className="grid gap-1" aria-label="Admin workspace">
            {navigation.map((item) => {
              const active = item.href === "/admin";
              return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className="anan-nav-link">
                <item.icon size={17} aria-hidden />{item.label}
                {active ? <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#7434df]" /> : null}
              </Link>;
            })}
          </nav>
          <div className="mt-auto rounded-2xl border border-[#eee7f8] bg-white p-4">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#f3edff] text-[#7040c5]"><ShieldCheck size={17} /></span>
            <p className="mt-3 text-xs font-extrabold text-[#302344]">Trust & safety</p>
            <p className="mt-1 text-[10px] leading-5 text-[#8b8198]">Only approved sellers and products are shown to shoppers.</p>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 flex min-h-[68px] items-center justify-between border-b border-[#ece7f2] bg-white/90 px-4 backdrop-blur-xl sm:px-7 lg:px-9">
            <div className="min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-[.18em] text-[#8e7ca8]">ANAN / Admin</p>
              <h1 className="mt-0.5 text-[16px] font-extrabold tracking-tight text-[#24143f] sm:text-lg">Operations overview</h1>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/admin/notifications" aria-label="Notifications" className="grid h-10 w-10 place-items-center rounded-xl border border-[#eee8f5] bg-white text-[#655a74] hover:bg-[#f8f5fc]"><Bell size={17}/></Link>
              <Link href="/" className="hidden rounded-xl border border-[#eee8f5] px-3 py-2 text-[11px] font-bold text-[#655a74] hover:bg-[#f8f5fc] sm:inline-flex">View storefront <ArrowRight size={13} className="ml-1"/></Link>
            </div>
          </header>

          <div className="border-b border-[#ece7f2] bg-white px-4 py-2.5 lg:hidden">
            <nav aria-label="Admin sections" className="soft-scrollbar flex gap-1 overflow-x-auto">
              {navigation.map((item) => <Link key={item.href} href={item.href} className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-[10.5px] font-bold ${item.href === "/admin" ? "bg-[#eee6ff] text-[#5d2ca3]" : "text-[#746b81] hover:bg-[#f7f3ff]"}`}><item.icon size={13}/>{item.label}</Link>)}
            </nav>
          </div>

          <div className="px-4 py-7 sm:px-7 sm:py-9 lg:px-9 lg:py-10">
            <div className="relative overflow-hidden rounded-[24px] bg-[linear-gradient(115deg,#25143e_0%,#45216f_62%,#7542bb_100%)] p-6 text-white shadow-[0_22px_55px_-32px_rgba(42,21,71,.65)] sm:p-8">
              <div className="absolute -right-12 -top-24 h-64 w-64 rounded-full border border-white/10" aria-hidden/>
              <div className="absolute -right-2 -top-14 h-44 w-44 rounded-full border border-white/10" aria-hidden/>
              <div className="relative max-w-2xl">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[9px] font-bold uppercase tracking-[.15em] text-white/80"><ShieldCheck size={12}/> Marketplace operations</span>
                <h2 className="mt-4 text-[25px] font-extrabold leading-tight tracking-[-.8px] sm:text-[32px]">Good morning, Admin.</h2>
                <p className="mt-2 max-w-xl text-[12px] leading-6 text-white/70 sm:text-sm">Keep the marketplace healthy. Review incoming work, follow order activity and help every customer shop with confidence.</p>
                <Link href="/admin/products" className="mt-5 inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-[11px] font-extrabold text-[#39205d] transition hover:-translate-y-0.5 hover:bg-[#f4edff]">Start product review <ArrowRight size={14}/></Link>
              </div>
            </div>

            <div className="mb-4 mt-8 flex items-end justify-between gap-3">
              <div><p className="text-[9px] font-extrabold uppercase tracking-[.18em] text-[#8c7ca1]">Control centre</p><h2 className="mt-1 text-[20px] font-extrabold tracking-[-.5px] text-[#26183c] sm:text-2xl">Manage your marketplace</h2><p className="mt-1 text-[11px] text-[#92899e] sm:text-xs">Choose an area to view its live records and take action.</p></div>
              <span className="hidden items-center gap-1 text-[10px] font-semibold text-[#8d8399] sm:inline-flex"><span className="h-1.5 w-1.5 rounded-full bg-[#46a879]"/> Live API data</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {areas.map((area) => <Link key={area.href} href={area.href} className="group anan-panel flex min-h-[174px] flex-col p-5 transition duration-200 hover:-translate-y-1 hover:border-[#d9c9f2] hover:shadow-[0_18px_40px_-26px_rgba(42,21,71,.35)] sm:p-5">
                <div className="flex items-start justify-between"><span className={`grid h-11 w-11 place-items-center rounded-[14px] ${toneClasses[area.tone]}`}><area.icon size={19}/></span><ChevronRight size={17} className="text-[#b2a9bd] transition group-hover:translate-x-1 group-hover:text-[#7434df]"/></div>
                <span className="mt-4 text-[13px] font-extrabold text-[#302344]">{area.title}</span>
                <span className="mt-1 text-[10.5px] leading-5 text-[#8b8198]">{area.detail}</span>
                <span className="mt-auto pt-3 text-[10px] font-extrabold text-[#7040c5]">{area.cta} <ArrowRight size={12} className="ml-1 inline transition group-hover:translate-x-1"/></span>
              </Link>)}
            </div>

            <p className="mt-6 rounded-2xl border border-[#ece7f2] bg-white px-4 py-3 text-[10.5px] leading-5 text-[#8b7f9b]"><Boxes size={14} className="mr-1 inline text-[#8b70bd]"/> Access is verified per request by the API using your session cookie. If a page shows a sign-in error, your session may have expired — <Link href="/admin/login" className="font-bold text-[#7040c5] underline underline-offset-2">sign in again</Link>.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
