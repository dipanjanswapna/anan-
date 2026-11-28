import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Package, ShieldCheck, Store, Truck } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { ProductPurchaseActions } from "@/components/product-purchase-actions";

type Product = {
  id: string; nameEn: string; nameBn: string | null; slug: string;
  descriptionEn: string | null; descriptionBn: string | null;
  pricePaisa: string; compareAtPricePaisa: string | null; stockOnHand: number;
  category: { nameEn: string; nameBn: string | null; slug: string };
  seller: { storeName: string; storeSlug: string };
};
const apiUrl = (process.env.ANAN_API_URL ?? "http://localhost:4000/api/v1").replace(/\/$/, "");
const taka = (paisa: string) => {
  const amount = BigInt(paisa);
  const whole = new Intl.NumberFormat("en-BD").format(amount / 100n);
  const fraction = (amount % 100n).toString().padStart(2, "0").replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole;
};

async function getProduct(slug: string): Promise<Product | null> {
  try {
    const response = await fetch(`${apiUrl}/catalog/products/${encodeURIComponent(slug)}`, { next: { revalidate: 30 } });
    if (response.status === 404) return null;
    if (!response.ok) return null;
    return await response.json() as Product;
  } catch { return null; }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: "Product not found", robots: { index: false, follow: false } };
  const description = (product.descriptionEn || product.nameEn).slice(0, 160);
  const canonical = "/products/" + encodeURIComponent(product.slug);
  return {
    title: product.nameEn,
    description,
    alternates: { canonical },
    openGraph: {
      title: product.nameEn + " | ANAN",
      description,
      url: canonical,
      type: "website",
    },
    twitter: { card: "summary_large_image", title: product.nameEn, description },
  };
}

export default async function ProductDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  return (
    <main className="min-h-screen bg-[#fcfbfe]">
      <SiteHeader />
      <section className="container-shell py-7 sm:py-10">
        <Link href="/products" className="inline-flex items-center gap-2 text-sm font-semibold text-[#756987] hover:text-brand-600"><ArrowLeft size={16}/> Back to products</Link>
        <div className="mt-6 grid gap-7 lg:grid-cols-[1.05fr_.95fr]">
          <div className="flex min-h-[320px] items-center justify-center rounded-3xl border border-[#eeeaf3] bg-gradient-to-br from-[#f5efff] to-[#fcfaff] text-brand-400 sm:min-h-[480px]"><Package size={104} strokeWidth={1}/></div>
          <div className="rounded-3xl border border-[#eeeaf3] bg-white p-6 sm:p-9">
            <Link href={`/products?category=${encodeURIComponent(product.category.slug)}`} className="text-[11px] font-bold uppercase tracking-[.16em] text-brand-600">{product.category.nameEn}</Link>
            <h1 className="mt-4 text-2xl font-extrabold leading-tight text-[#26183c] sm:text-3xl">{product.nameEn}</h1>
            {product.nameBn && <p className="mt-2 text-base text-[#82778f]">{product.nameBn}</p>}
            <div className="mt-7 flex flex-wrap items-baseline gap-3"><span className="text-3xl font-black text-[#26183c]">৳{taka(product.pricePaisa)}</span>{product.compareAtPricePaisa && <span className="text-base text-[#a79eaf] line-through">৳{taka(product.compareAtPricePaisa)}</span>}</div>
            <p className={`mt-4 inline-flex rounded-full px-3 py-1.5 text-xs font-bold ${product.stockOnHand > 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>{product.stockOnHand > 0 ? `In stock · ${product.stockOnHand} available` : "Currently out of stock"}</p>
            <ProductPurchaseActions productId={product.id} stockOnHand={product.stockOnHand}/>
            <div className="my-7 h-px bg-[#f0ecf4]"/>
            <h2 className="text-sm font-bold text-[#302344]">Product description</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[#756987]">{product.descriptionEn || "The seller has not added an English description yet."}</p>
            {product.descriptionBn && <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[#756987]">{product.descriptionBn}</p>}
            <div className="my-7 h-px bg-[#f0ecf4]"/>
            <Link href={`/stores/${encodeURIComponent(product.seller.storeSlug)}`} className="flex items-center justify-between rounded-2xl bg-[#faf8fd] p-4 transition hover:bg-[#f4effb]">
              <span className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-white text-brand-600"><Store size={20}/></span><span><span className="block text-[10px] text-[#9a90a5]">Sold and fulfilled by</span><span className="mt-0.5 block text-sm font-bold text-[#302344]">{product.seller.storeName}</span></span></span>
              <span className="text-xs font-bold text-brand-600">Visit store →</span>
            </Link>
            <div className="mt-5 grid grid-cols-2 gap-3 text-xs text-[#82778f]"><div className="flex items-center gap-2 rounded-xl border border-[#eeeaf3] p-3"><ShieldCheck size={17} className="text-brand-500"/> Approved seller</div><div className="flex items-center gap-2 rounded-xl border border-[#eeeaf3] p-3"><Truck size={17} className="text-brand-500"/> Delivery options at checkout</div></div>
            <p className="mt-5 text-[11px] leading-5 text-[#a39aaa]">Cart and wishlist are available for signed-in customers. Checkout, delivery calculation and payment will be introduced in the next release.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
