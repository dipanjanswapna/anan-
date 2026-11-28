import Link from "next/link";
import { BadgeCheck, ChevronRight, CreditCard, HelpCircle, PackageCheck, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata = {
  title: "Help centre",
  description: "How ordering, delivery, cash on delivery, returns and seller reviews work on ANAN.",
  alternates: { canonical: "/help" },
};

const topics = [
  { id: "shopping", title: "Shopping on ANAN", icon: BadgeCheck },
  { id: "shipping", title: "Delivery & tracking", icon: Truck },
  { id: "payments", title: "Payment", icon: CreditCard },
  { id: "returns", title: "Returns & refunds", icon: RotateCcw },
  { id: "privacy", title: "Privacy & data", icon: ShieldCheck },
  { id: "contact", title: "Contact", icon: HelpCircle },
];

const faqs: { topic: string; question: string; answer: string }[] = [
  {
    topic: "Shopping on ANAN",
    question: "Do I need an account to order?",
    answer: "Yes. ANAN accounts are created with a phone number and a one-time code. An account is required to check out, so your cart, addresses, orders and return requests stay in one place.",
  },
  {
    topic: "Shopping on ANAN",
    question: "Who sells the products?",
    answer: "Independent sellers. Every seller is reviewed and approved by ANAN before selling, and every product is reviewed before it appears in the public catalogue. Your order is split into seller orders so each store can be fulfilled and tracked separately.",
  },
  {
    topic: "Shopping on ANAN",
    question: "Can I buy from several sellers at once?",
    answer: "Yes. You can add products from different sellers to one cart and check out together. Sellers then accept and prepare their own part of the order. Each seller has 24 hours to accept an order; if they do not, that part is cancelled and the stock is released.",
  },
  {
    topic: "Delivery & tracking",
    question: "Where do you deliver?",
    answer: "ANAN is built for delivery across all 64 districts of Bangladesh, with cash on delivery. Delivery options and charges for your area are confirmed during checkout. Some sellers may have a narrower serviceable area.",
  },
  {
    topic: "Delivery & tracking",
    question: "How do I track my order?",
    answer: "Open your account and choose an order to see its seller orders and delivery updates. Sellers add courier details and update shipment status as the parcel moves. Tracking is entered by the seller and reviewed by ANAN operations; it is not yet a live carrier feed.",
  },
  {
    topic: "Payment",
    question: "Which payment methods work today?",
    answer: "Cash on delivery is the payment method available today. Online payments such as bKash, Nagad and card payment through SSLCommerz are planned, but they are not integrated yet — do not send money to anyone claiming to collect an ANAN online payment.",
  },
  {
    topic: "Payment",
    question: "Is my payment information stored?",
    answer: "No card or mobile-wallet credentials are stored because the platform does not collect them yet. Account sessions are kept in secure, HTTP-only cookies and only hashed session tokens are stored on the server.",
  },
  {
    topic: "Returns & refunds",
    question: "Can I return an item?",
    answer: "You can request a return on a delivered order within the return window shown in your account (7 days by default). The seller reviews the request first. If you and the seller disagree, ANAN can review the dispute.",
  },
  {
    topic: "Returns & refunds",
    question: "How are refunds paid?",
    answer: "ANAN currently records refunds arranged outside the platform: an operations member records the refund method, amount and reference after the return is approved. The platform does not move money automatically, so keep the reference you are given.",
  },
  {
    topic: "Privacy & data",
    question: "What information does ANAN collect?",
    answer: "Account details you provide (phone number, optional email and name), delivery addresses, orders and support history. Sellers only see the information needed to fulfil your order. Passwords and one-time codes are never shown back to you in plain text.",
  },
  {
    topic: "Privacy & data",
    question: "Are ANAN’s legal policies final?",
    answer: "Terms, the privacy policy, the seller agreement and the cookie policy are being prepared for public launch. This page describes current platform behaviour only; it is not a substitute for the published legal documents.",
  },
];

export default function HelpPage() {
  return (
    <main className="min-h-screen bg-[#fcfbfe]">
      <SiteHeader />
      <section className="border-b border-[#f0edf4] bg-white">
        <div className="container-shell py-9 sm:py-12">
          <nav aria-label="Breadcrumb" className="text-[11px] font-semibold text-[#a097ad]">
            <Link href="/" className="hover:text-brand-600">Home</Link>
            <span className="mx-1.5" aria-hidden>/</span>
            <span className="text-[#655873]">Help centre</span>
          </nav>
          <p className="mt-4 text-[10px] font-bold uppercase tracking-[.2em] text-brand-600">Here when you need us</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-[-1.2px] text-[#26183c] sm:text-[40px]">Help centre</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#8f849e]">Straight answers about shopping, delivery, cash on delivery, returns and how ANAN reviews sellers and products.</p>
        </div>
      </section>

      <section id="about" className="container-shell grid gap-8 py-9 sm:py-12 lg:grid-cols-[240px_1fr] lg:gap-12">
        <nav aria-label="Help topics" className="lg:sticky lg:top-[150px] lg:self-start">
          <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#a097ad]">Topics</p>
          <ul className="mt-3 space-y-1">
            {topics.map((topic) => (
              <li key={topic.id}>
                <a href={`#${topic.id}`} className="flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold text-[#655873] hover:bg-white hover:text-brand-700">
                  <span className="flex items-center gap-2"><topic.icon size={15} aria-hidden /> {topic.title}</span>
                  <ChevronRight size={13} aria-hidden />
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-5 rounded-2xl bg-[#f4effb] p-4">
            <p className="flex items-center gap-2 text-[11px] font-extrabold text-[#4d2f7d]"><PackageCheck size={14} aria-hidden /> Seller?</p>
            <p className="mt-2 text-[11px] leading-5 text-[#7a6a90]">Manage products, images, orders and returns in the Seller Centre.</p>
            <Link href="/seller/dashboard" className="mt-3 inline-flex text-[11px] font-bold text-brand-700 underline">Open Seller Centre</Link>
          </div>
        </nav>

        <div className="min-w-0 space-y-8">
          {topics.map((topic) => {
            const items = faqs.filter((faq) => faq.topic === topic.title);
            return (
              <section key={topic.id} id={topic.id} className="scroll-mt-32">
                <h2 className="text-xl font-extrabold tracking-tight text-[#26183c]">{topic.title}</h2>
                {items.length ? (
                  <div className="mt-4 divide-y divide-[#f0edf4] overflow-hidden rounded-2xl border border-[#eeeaf3] bg-white">
                    {items.map((faq) => (
                      <details key={faq.question} className="group p-5">
                        <summary className="flex items-start justify-between gap-4 text-sm font-bold text-[#302344]">
                          {faq.question}
                          <ChevronRight size={16} className="mt-0.5 shrink-0 text-[#a097ad] transition group-open:rotate-90" aria-hidden />
                        </summary>
                        <p className="mt-3 max-w-2xl text-[13px] leading-6 text-[#756987]">{faq.answer}</p>
                      </details>
                    ))}
                  </div>
                ) : topic.id === "contact" ? (
                  <div className="mt-4 rounded-2xl border border-[#eeeaf3] bg-white p-5 sm:p-6">
                    <p className="text-[13px] leading-6 text-[#756987]">
                      Customer support channels are being finalised for the public launch. Until then, the fastest route is your account: order pages show the current status, and return requests are tracked there.
                    </p>
                    <ul className="mt-4 space-y-2 text-[13px] text-[#756987]">
                      <li>• Check <Link href="/orders" className="font-bold text-brand-700 underline">your orders</Link> for delivery and return status.</li>
                      <li>• Sellers can reach ANAN operations through the contact details shared during onboarding.</li>
                      <li>• Product and image reviews are handled in the ANAN Admin console, not over chat.</li>
                    </ul>
                    <p className="mt-4 rounded-xl bg-[#fff7ea] p-3 text-[11px] leading-5 text-[#8f6a2a]">
                      A published support email and phone number will be added here before public launch. ANAN will never ask for your one-time code or a payment outside cash on delivery.
                    </p>
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
