import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, CircleSlash2, PackageCheck, RotateCcw, ShieldCheck, Store, Truck } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProductGallery } from "@/components/product-gallery";
import { ProductPurchaseActions } from "@/components/product-purchase-actions";
import { RecentlyViewed } from "@/components/recently-viewed";
import { CatalogProductCard, type CatalogProduct } from "@/components/catalog-product-card";
import { ProductRail } from "@/components/product-rail";
import { discountPercent, formatTaka } from "@/lib/format";

type Product = {
  id: string;
  nameEn: string;
  nameBn: string | null;
  slug: string;
  descriptionEn: string | null;
  descriptionBn: string | null;
  pricePaisa: string;
  compareAtPricePaisa: string | null;
  stockOnHand: number;
  createdAt: string;
  category: { nameEn: string; nameBn: string | null; slug: string };
  seller: { storeName: string; storeSlug: string };
  images: { url: string | null; altText: string; isPrimary?: boolean }[];
};

type CatalogPage = { items: CatalogProduct[] };

const apiUrl = (process.env.ANAN_API_URL ?? "http://localhost:4000/api/v1").replace(/\/$/, "");

async function getProduct(slug: string): Promise<Product | null> {
  try {
    const response = await fetch(`${apiUrl}/catalog/products/${encodeURIComponent(slug)}`, { next: { revalidate: 30 } });
    if (!response.ok) return null;
    return (await response.json()) as Product;
  } catch {
    return null;
  }
}

async function getRelated(categorySlug: string, currentId: string): Promise<CatalogProduct[]> {
  try {
    const [categoryResponse, newestResponse] = await Promise.all([
      fetch(`${apiUrl}/catalog/products?category=${encodeURIComponent(categorySlug)}&limit=7&sort=newest`, {
        next: { revalidate: 60 },
      }),
      fetch(`${apiUrl}/catalog/products?limit=8&sort=newest`, { next: { revalidate: 60 } }),
    ]);
    const categoryItems = categoryResponse.ok ? ((await categoryResponse.json()) as CatalogPage).items : [];
    const newestItems = newestResponse.ok ? ((await newestResponse.json()) as CatalogPage).items : [];
    // Same-category products first, then real catalogue picks so the rail is never a lonely card.
    const merged = [...categoryItems, ...newestItems];
    const seen = new Set<string>([currentId]);
    return merged.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    }).slice(0, 6);
  } catch {
    return [];
  }
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
      ...(product.images?.[0]?.url ? { images: [product.images[0].url] } : {}),
    },
    twitter: { card: "summary_large_image", title: product.nameEn, description },
  };
}

export default async function ProductDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const related = await getRelated(product.category.slug, product.id);
  const discount = discountPercent(product.pricePaisa, product.compareAtPricePaisa);
  const saving = product.compareAtPricePaisa
    ? BigInt(product.compareAtPricePaisa) - BigInt(product.pricePaisa)
    : null;
  const outOfStock = product.stockOnHand < 1;
  const lowStock = !outOfStock && product.stockOnHand <= 5;
  const primaryImage = product.images?.find((image) => image.isPrimary && image.url)?.url ?? product.images?.find((image) => image.url)?.url ?? null;

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://anan.com").replace(/\/$/, "");
  const productUrl = siteUrl + "/products/" + encodeURIComponent(product.slug);
  const schemaPrice = (() => {
    const amount = BigInt(product.pricePaisa);
    return `${amount / 100n}.${(amount % 100n).toString().padStart(2, "0")}`;
  })();
  const productStructuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.nameEn,
    ...(product.nameBn ? { alternateName: product.nameBn } : {}),
    description: product.descriptionEn || product.nameEn,
    category: product.category.nameEn,
    url: productUrl,
    ...(product.images?.length
      ? { image: product.images.map((image) => image.url).filter((url): url is string => Boolean(url)) }
      : {}),
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "BDT",
      price: schemaPrice,
      availability: outOfStock ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: product.seller.storeName },
    },
  };
  const breadcrumbStructuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Products", item: siteUrl + "/products" },
      {
        "@type": "ListItem",
        position: 3,
        name: product.category.nameEn,
        item: siteUrl + "/products?category=" + encodeURIComponent(product.category.slug),
      },
      { "@type": "ListItem", position: 4, name: product.nameEn, item: productUrl },
    ],
  };
  const safeJsonLd = (value: unknown) => JSON.stringify(value).replace(/</g, "\\u003c");

  const facts = [
    { label: "Category", value: product.category.nameEn },
    { label: "Sold by", value: product.seller.storeName },
    { label: "Product reference", value: product.id },
    { label: "Availability", value: outOfStock ? "Out of stock" : `${product.stockOnHand} in stock` },
    { label: "Payment", value: "Cash on delivery" },
    { label: "Returns", value: "Request within the return window after delivery" },
  ];

  return (
    <main className="min-h-screen bg-[#fcfbfe] pb-24 lg:pb-0">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(productStructuredData) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbStructuredData) }} />
      <SiteHeader />

      <div className="container-shell py-5 sm:py-8">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-[11px] font-semibold text-[#a097ad]">
          <Link href="/" className="transition hover:text-brand-600">Home</Link>
          <ChevronRight size={12} aria-hidden />
          <Link href={`/categories/${encodeURIComponent(product.category.slug)}`} className="transition hover:text-brand-600">
            {product.category.nameEn}
          </Link>
          <ChevronRight size={12} aria-hidden />
          <span className="max-w-[55vw] truncate text-[#655873]" aria-current="page">{product.nameEn}</span>
        </nav>

        <div className="mt-4 grid gap-7 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,.98fr)] lg:gap-10">
          <div className="min-w-0">
            <ProductGallery
              images={product.images ?? []}
              name={product.nameEn}
              fallbackClass="bg-gradient-to-br from-[#f5efff] to-[#fcfaff] text-brand-400"
            />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/products?category=${encodeURIComponent(product.category.slug)}`}
                className="rounded-full bg-[#f4edff] px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[.12em] text-brand-700"
              >
                {product.category.nameEn}
              </Link>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1.5 text-[10px] font-extrabold text-emerald-700">
                <ShieldCheck size={12} aria-hidden /> Approved seller
              </span>
              {discount !== null ? (
                <span className="rounded-full bg-[#fff1e6] px-2.5 py-1.5 text-[10px] font-extrabold text-[#b35c1e]">
                  Save {discount}%
                </span>
              ) : null}
            </div>

            <h1 className="mt-3 text-[26px] font-extrabold leading-[1.15] tracking-[-.9px] text-[#24143f] sm:text-[34px]">
              {product.nameEn}
            </h1>
            {product.nameBn ? <p className="mt-1.5 text-base text-[#82778f]">{product.nameBn}</p> : null}
            <p className="mt-2 text-[11px] font-semibold text-[#8f849e]">
              Sold by{" "}
              <Link href={`/stores/${encodeURIComponent(product.seller.storeSlug)}`} className="text-[#5c4d70] underline decoration-[#ddd2e9] underline-offset-4 hover:text-brand-700">
                {product.seller.storeName}
              </Link>
            </p>

            <div className="mt-5 flex flex-wrap items-baseline gap-2.5">
              <span className="text-[30px] font-black tracking-[-1px] text-[#24143f] sm:text-[34px]">{formatTaka(product.pricePaisa)}</span>
              {product.compareAtPricePaisa ? (
                <span className="text-base font-medium text-[#a79eaf] line-through">{formatTaka(product.compareAtPricePaisa)}</span>
              ) : null}
              {saving !== null && saving > 0n ? (
                <span className="rounded-full bg-[#f4edff] px-2.5 py-1 text-[11px] font-extrabold text-brand-700">
                  You save {formatTaka(saving)}
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-[11px] text-[#9a90a5]">Price in Bangladeshi Taka · cash on delivery</p>

            <p className={`mt-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-extrabold ${
              outOfStock ? "bg-rose-50 text-rose-700" : lowStock ? "bg-[#fff4e8] text-[#b35c1e]" : "bg-emerald-50 text-emerald-700"
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${outOfStock ? "bg-rose-500" : lowStock ? "bg-[#e08a3c]" : "bg-emerald-500"}`} aria-hidden />
              {outOfStock ? "Currently out of stock" : lowStock ? `Only ${product.stockOnHand} left — order soon` : `In stock · ${product.stockOnHand} available`}
            </p>

            {product.descriptionEn ? (
              <p className="mt-4 line-clamp-3 text-[13px] leading-6 text-[#756987]">{product.descriptionEn}</p>
            ) : (
              <p className="mt-4 text-[13px] leading-6 text-[#9a90a5]">The seller has not added a description yet.</p>
            )}

            <ProductPurchaseActions
              productId={product.id}
              slug={product.slug}
              stockOnHand={product.stockOnHand}
              pricePaisa={product.pricePaisa}
            />

            <div className="mt-6 grid grid-cols-2 gap-2.5">
              <div className="rounded-xl border border-[#eeeaf3] bg-white p-3">
                <p className="flex items-center gap-1.5 text-[11px] font-extrabold text-[#3f2b5c]">
                  <Truck size={14} className="text-brand-600" aria-hidden /> Delivery
                </p>
                <p className="mt-1.5 text-[10.5px] leading-5 text-[#8f849e]">
                  Cash on delivery across Bangladesh. Fee confirmed at checkout.
                </p>
              </div>
              <div className="rounded-xl border border-[#eeeaf3] bg-white p-3">
                <p className="flex items-center gap-1.5 text-[11px] font-extrabold text-[#3f2b5c]">
                  <RotateCcw size={14} className="text-brand-600" aria-hidden /> Returns
                </p>
                <p className="mt-1.5 text-[10.5px] leading-5 text-[#8f849e]">
                  Request a return from your order after delivery, within the return window.
                </p>
              </div>
            </div>

            <Link
              href={`/stores/${encodeURIComponent(product.seller.storeSlug)}`}
              className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-[#eeeaf3] bg-white p-3.5 transition hover:border-brand-200 hover:bg-[#fdfbff]"
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#f4edff] text-sm font-black text-brand-700">
                  {product.seller.storeName.trim().charAt(0).toUpperCase()}
                </span>
                <span className="min-w-0">
                  <span className="block text-[9.5px] font-bold uppercase tracking-[.12em] text-[#a096ad]">Sold and fulfilled by</span>
                  <span className="mt-0.5 block truncate text-[13px] font-extrabold text-[#302344]">{product.seller.storeName}</span>
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-1 text-[11px] font-bold text-brand-700">
                <Store size={13} aria-hidden /> Visit
              </span>
            </Link>
          </div>
        </div>

        <section id="description" className="mt-9 grid gap-4 sm:mt-12 lg:grid-cols-[1.15fr_.85fr]">
          <div className="rounded-2xl border border-[#eeeaf3] bg-white p-5 sm:p-7">
            <h2 className="text-[17px] font-extrabold tracking-[-.3px] text-[#24143f]">Product description</h2>
            <div className="mt-3 space-y-3 text-[13px] leading-7 text-[#6f6280]">
              <p className="whitespace-pre-line">
                {product.descriptionEn || "The seller has not added an English description for this product yet."}
              </p>
              {product.descriptionBn ? <p className="whitespace-pre-line">{product.descriptionBn}</p> : null}
            </div>
            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              <p className="flex items-center gap-2 rounded-xl bg-[#faf8fd] px-3 py-2.5 text-[11px] font-semibold text-[#6f6280]">
                <PackageCheck size={14} className="text-brand-600" aria-hidden /> Checked against the ANAN catalogue
              </p>
              <p className="flex items-center gap-2 rounded-xl bg-[#faf8fd] px-3 py-2.5 text-[11px] font-semibold text-[#6f6280]">
                <ShieldCheck size={14} className="text-brand-600" aria-hidden /> Seller approved by ANAN
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-[#eeeaf3] bg-white p-5 sm:p-7">
            <h2 className="text-[17px] font-extrabold tracking-[-.3px] text-[#24143f]">Product details</h2>
            <dl className="mt-3 divide-y divide-[#f2eef7]">
              {facts.map((fact) => (
                <div key={fact.label} className="flex items-start justify-between gap-4 py-2.5">
                  <dt className="shrink-0 text-[11px] font-semibold text-[#9a90a5]">{fact.label}</dt>
                  <dd className="min-w-0 break-words text-right text-[11.5px] font-semibold text-[#4b3c5e]">{fact.value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-[10px] leading-4 text-[#a39aaa]">
              Colour, size and other variants are not offered by this seller in the current catalogue.
            </p>
          </div>
        </section>

        <section aria-labelledby="reviews-heading" className="mt-4 rounded-2xl border border-[#eeeaf3] bg-white p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="reviews-heading" className="text-[17px] font-extrabold tracking-[-.3px] text-[#24143f]">Ratings & reviews</h2>
            <span className="rounded-full bg-[#f6f3fa] px-3 py-1 text-[10px] font-bold uppercase tracking-[.1em] text-[#8f849e]">Not yet available</span>
          </div>
          <div className="mt-4 rounded-xl border border-dashed border-[#e4dbee] bg-[#fcfbfe] px-5 py-8 text-center">
            <CircleSlash2 className="mx-auto text-[#b9aec7]" size={24} aria-hidden />
            <p className="mt-3 text-[13px] font-bold text-[#4b3c5e]">Verified reviews are not live yet</p>
            <p className="mx-auto mt-1.5 max-w-md text-[11.5px] leading-5 text-[#93889f]">
              ANAN does not publish invented ratings or review counts. This space will show genuine buyer reviews once
              verified purchase reviews are enabled.
            </p>
          </div>
        </section>

        {related.length ? (
          <div className="mt-10 sm:mt-14">
            <ProductRail
              eyebrow="Handpicked for you"
              title="You might also like"
              detail="Handpicked from the ANAN catalogue"
              href={`/products?category=${encodeURIComponent(product.category.slug)}`}
            >
              {related.map((item) => (
                <CatalogProductCard key={item.id} product={item} />
              ))}
            </ProductRail>
          </div>
        ) : null}

        <RecentlyViewed
          excludeSlug={product.slug}
          record={{
            slug: product.slug,
            nameEn: product.nameEn,
            pricePaisa: product.pricePaisa,
            image: primaryImage,
            category: product.category.nameEn,
          }}
        />
      </div>

      <SiteFooter />
      <div className="h-24 lg:hidden" aria-hidden />
    </main>
  );
}
