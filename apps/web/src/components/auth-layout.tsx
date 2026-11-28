import Link from "next/link";
import type { ReactNode } from "react";
import { ShieldCheck, Sparkles, Truck } from "lucide-react";

const benefits = [
  { icon: Truck, title: "Delivered nationwide", detail: "Cash on delivery to all 64 districts" },
  { icon: ShieldCheck, title: "Reviewed sellers", detail: "Every store approved before listing" },
  { icon: Sparkles, title: "One calm place", detail: "Cart, wishlist and orders together" },
];

export function AuthLayout({
  children,
  heading,
  subheading,
}: {
  children: ReactNode;
  heading: string;
  subheading: string;
}) {
  return (
    <main className="min-h-screen bg-[#faf8fd]">
      <div className="grid min-h-screen lg:grid-cols-[1.02fr_1fr]">
        <aside className="relative isolate hidden overflow-hidden bg-[#1c0f2e] lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80"
            alt="Curated clothing in soft natural light"
            className="absolute inset-0 -z-20 h-full w-full object-cover"
          />
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(160deg,rgba(23,12,38,.94)_0%,rgba(35,17,60,.82)_48%,rgba(35,17,60,.55)_100%)]" aria-hidden />
          <Link href="/" className="flex w-fit items-center gap-2 text-white" aria-label="ANAN home">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-lg font-black text-brand-700">a</span>
            <span className="text-[26px] font-extrabold tracking-[-1.5px]">
              anan<span className="text-[#c9a6ff]">.</span>
            </span>
          </Link>

          <div className="max-w-[430px]">
            <p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#c9a6ff]">The ANAN marketplace</p>
            <h1 className="mt-4 text-[38px] font-extrabold leading-[1.1] tracking-[-1.6px] text-white xl:text-[44px]">
              Everyday things,<br />
              <span className="font-serif font-medium italic text-[#dcc6ff]">beautifully found.</span>
            </h1>
            <p className="mt-4 text-[13.5px] leading-7 text-white/65">
              Sign in with your mobile number to keep your cart, wishlist and delivery details together — no passwords to
              remember.
            </p>
            <ul className="mt-8 space-y-3.5">
              {benefits.map((benefit) => (
                <li key={benefit.title} className="flex items-start gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/15 bg-white/10 text-[#dcc6ff]">
                    <benefit.icon size={16} aria-hidden />
                  </span>
                  <span>
                    <span className="block text-[12.5px] font-bold text-white">{benefit.title}</span>
                    <span className="mt-0.5 block text-[11px] text-white/50">{benefit.detail}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-[10.5px] font-medium text-white/40">Bangladesh · BDT ৳ · English / বাংলা</p>
        </aside>

        <section className="flex min-h-screen flex-col">
          <header className="container-shell flex items-center justify-between gap-3 py-5">
            <Link href="/" className="flex items-center gap-2 lg:invisible" aria-label="ANAN home">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-lg font-black text-white">a</span>
              <span className="text-[23px] font-extrabold tracking-[-1.4px] text-[#24143f]">
                anan<span className="text-brand-600">.</span>
              </span>
            </Link>
            <Link href="/products" className="text-[11px] font-bold text-[#6f6380] transition hover:text-brand-700">
              Continue shopping →
            </Link>
          </header>

          <div className="flex flex-1 items-center justify-center px-4 pb-10 pt-2 sm:px-6">
            <div className="w-full max-w-[440px]">
              <div className="mb-6 text-center lg:text-left">
                <h2 className="text-[26px] font-extrabold tracking-[-.9px] text-[#24143f] sm:text-[30px]">{heading}</h2>
                <p className="mt-1.5 text-[12.5px] leading-6 text-[#8b7f9b]">{subheading}</p>
              </div>
              {children}
            </div>
          </div>

          <footer className="container-shell flex flex-wrap items-center justify-between gap-2 border-t border-[#f0ecf4] py-4 text-[10px] text-[#a097ad]">
            <span>© 2026 ANAN</span>
            <span className="flex items-center gap-3">
              <Link href="/help#privacy" className="hover:text-brand-700">Privacy</Link>
              <Link href="/help#returns" className="hover:text-brand-700">Returns</Link>
              <Link href="/help" className="hover:text-brand-700">Help</Link>
            </span>
          </footer>
        </section>
      </div>
    </main>
  );
}
