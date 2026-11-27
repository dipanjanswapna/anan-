import Link from "next/link";
import { ArrowLeft, BadgeCheck, ChartNoAxesCombined, PackageCheck, ShieldCheck } from "lucide-react";
import { SellerApplicationForm } from "@/components/seller-application-form";

export const metadata = {
  title: "Sell on ANAN — Grow your business",
  description: "Apply to become an ANAN seller and reach customers across Bangladesh.",
};

const benefits = [
  { icon: ChartNoAxesCombined, title: "Reach more customers", detail: "Introduce your products to shoppers across Bangladesh." },
  { icon: PackageCheck, title: "Manage your store", detail: "A dedicated seller workspace is part of the upcoming platform." },
  { icon: ShieldCheck, title: "A trusted marketplace", detail: "Seller and product approval help build customer confidence." },
];

export default function SellOnAnanPage() {
  return (
    <main className="min-h-screen bg-[#faf9fc]">
      <div className="container-shell py-6">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700"><ArrowLeft size={16}/> Back to ANAN</Link>
        <section className="mx-auto mt-8 grid max-w-6xl gap-8 lg:grid-cols-[.85fr_1.15fr] lg:gap-12">
          <div className="pt-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-brand-700"><BadgeCheck size={14}/> Seller partner programme</span>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-[-1.8px] text-[#281743] sm:text-5xl">Your business deserves a bigger stage.</h1>
            <p className="mt-5 text-sm leading-7 text-[#796d88]">Apply to join ANAN's multi-vendor marketplace. Share a few details about your business and our team will guide you through verification.</p>
            <div className="mt-8 space-y-5">
              {benefits.map(item => <div key={item.title} className="flex gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-brand-600 shadow-sm"><item.icon size={19}/></span><div><h2 className="text-sm font-bold text-[#38294e]">{item.title}</h2><p className="mt-1 text-xs leading-5 text-[#91869e]">{item.detail}</p></div></div>)}
            </div>
          </div>
          <div className="rounded-[26px] border border-[#eee8f5] bg-white p-5 shadow-[0_18px_60px_rgba(47,25,75,.06)] sm:p-8">
            <div className="mb-7"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-brand-600">Get started</p><h2 className="mt-2 text-2xl font-extrabold text-[#2b1b43]">Apply to sell on ANAN</h2><p className="mt-2 text-xs leading-5 text-[#958ba2]">No subscription fee. Seller approval is required before selling.</p></div>
            <SellerApplicationForm/>
          </div>
        </section>
      </div>
    </main>
  );
}
