import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Headphones,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Store,
  Truck,
  type LucideIcon,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { HeroCarousel, type HeroSlide } from "@/components/hero-carousel";
import { CatalogProductCard, type CatalogProduct } from "@/components/catalog-product-card";
import { ProductRail } from "@/components/product-rail";

type Category = { id: string; nameEn: string; nameBn: string | null; slug: string; productCount: number };
type Store = { storeName: string; storeSlug: string; joinedAt: string; productCount: number };
type CatalogPage = { items: CatalogProduct[]; pagination: { total: number } };

const apiUrl = (process.env.ANAN_API_URL ?? "http://localhost:4000/api/v1").replace(/\/$/, "");

const heroSlides: HeroSlide[] = [
  {
    id: "edit",
    eyebrow: "The ANAN edit",
    title: "Everyday things,",
    highlight: "beautifully found.",
    subtitle:
      "Thoughtful products from verified sellers across Bangladesh — discovered in one calm, curated place and delivered to your door.",
    cta: { label: "Shop the collection", href: "/products" },
    secondary: { label: "Browse categories", href: "/categories" },
    image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1600&q=80",
    imageAlt: "Curated clothing in soft natural light",
    footnote: "Cash on delivery · Delivered across all 64 districts",
  },
  {
    id: "deals",
    eyebrow: "Deals worth catching",
    title: "Better prices,",
    highlight: "same good taste.",
    subtitle:
      "Fresh markdowns across electronics, home and everyday essentials from sellers we have reviewed ourselves. While stock lasts.",
    cta: { label: "Shop today’s deals", href: "/deals" },
    secondary: { label: "See what’s new", href: "/products?sort=newest" },
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1600&q=80",
    imageAlt: "Wireless headphones on a warm background",
    footnote: "Every listed seller is approved by ANAN",
  },
  {
    id: "sellers",
    eyebrow: "Sell on ANAN",
    title: "Your shop,",
    highlight: "their next favourite.",
    subtitle:
      "Open a storefront built for growing Bangladeshi businesses. Add products, get approved, and reach shoppers nationwide.",
    cta: { label: "Start selling", href: "/sell" },
    secondary: { label: "How ANAN works", href: "/help#about" },
    image: "https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=1600&q=80",
    imageAlt: "Warm, thoughtfully styled home interior",
    footnote: "Seller applications reviewed by the ANAN team",
  },
];

const categoryArt: Record<string, { image: string; alt: string }> = {
  electronics: {
    image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=700&q=80",
    alt: "Desk with electronics and accessories",
  },
  fashion: {
    image: "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=700&q=80",
    alt: "Clothing rail in a bright studio",
  },
  beauty: {
    image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=700&q=80",
    alt: "Skincare and beauty products",
  },
  "home-kitchen": {
    image: "https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=700&q=80",
    alt: "Modern kitchen with warm wood details",
  },
  grocery: {
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=700&q=80",
    alt: "Fresh groceries in a market",
  },
  books: {
    image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=700&q=80",
    alt: "Stack of books on a table",
  },
};

const trust: { icon: LucideIcon; title: string; detail: string }[] = [
  { icon: Truck, title: "Nationwide delivery", detail: "Cash on delivery, all 64 districts" },
  { icon: ShieldCheck, title: "Reviewed sellers", detail: "Every store approved by ANAN" },
  { icon: RotateCcw, title: "Fair returns", detail: "Request within the return window" },
  { icon: Headphones, title: "Real support", detail: "Clear answers in the help centre" },
];

async function getJson<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${apiUrl}${path}`, { next: { revalidate: 60 } });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function SectionHeading({
  eyebrow,
  title,
  detail,
  href,
  linkLabel = "View all",
}: {
  eyebrow: string;
  title: string;
  detail: string;
  href: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4 sm:mb-7">
      <div className="min-w-0">
        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[.2em] text-brand-600">{eyebrow}</p>
        <h2 className="text-[22px] font-extrabold tracking-[-.8px] text-[#26183c] sm:text-[29px]">{title}</h2>
        <p className="mt-1 text-xs text-[#958ba2] sm:text-sm">{detail}</p>
      </div>
      <Link
        href={href}
        className="flex shrink-0 items-center gap-1 pb-1 text-xs font-bold text-brand-700 transition hover:gap-2"
      >
        {linkLabel} <ArrowRight size={15} aria-hidden />
      </Link>
    </div>
  );
}

export default async function HomePage() {
  const [categories, newest, deals, stores] = await Promise.all([
    getJson<Category[]>("/catalog/categories"),
    getJson<CatalogPage>("/catalog/products?limit=16&sort=newest"),
    getJson<CatalogPage>("/catalog/products?limit=10&onSale=true"),
    getJson<{ stores: Store[] }>("/catalog/stores"),
  ]);

  const activeCategories = categories ?? [];
  const newestItems = newest?.items ?? [];
  const featured = newestItems.slice(0, 4);
  const moreToExplore = newestItems.slice(4, 14);
  const dealItems = deals?.items ?? [];
  const storeItems = (stores?.stores ?? []).slice(0, 4);
  const catalogueReady = newestItems.length > 0;

  return (
    <main className="min-h-screen overflow-x-clip bg-white">
      <SiteHeader />

      <section className="container-shell pt-3 sm:pt-5">
        <HeroCarousel slides={heroSlides} />
      </section>

      <section className="container-shell pt-6 sm:pt-8">
        <div className="grid grid-cols-2 gap-x-4 gap-y-5 rounded-2xl border border-[#f0edf4] bg-[#fdfcff] px-4 py-5 sm:grid-cols-4 sm:gap-3 sm:px-6">
          {trust.map((item) => (
            <div key={item.title} className="flex items-start gap-2.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                <item.icon size={17} aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-extrabold leading-tight text-[#38294e] sm:text-xs">{item.title}</p>
                <p className="mt-1 text-[10px] leading-4 text-[#a097ad]">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="container-shell py-10 sm:py-14">
        <SectionHeading
          eyebrow="Shop by category"
          title="Find your something"
          detail="A little inspiration for every part of your day."
          href="/categories"
          linkLabel="All categories"
        />
        {activeCategories.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
            {activeCategories.slice(0, 6).map((category) => {
              const art = categoryArt[category.slug];
              return (
                <Link
                  key={category.id}
                  href={`/categories/${encodeURIComponent(category.slug)}`}
                  className="group relative isolate flex aspect-[4/4.2] flex-col justify-end overflow-hidden rounded-2xl border border-[#f0edf4] bg-[#f5f0ff] p-3.5 shadow-[0_1px_0_rgba(38,24,60,.03)] transition hover:-translate-y-1 hover:border-brand-200 hover:shadow-soft sm:aspect-[4/4.4] sm:p-4"
                >
                  {art ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={art.image}
                      alt={art.alt}
                      loading="lazy"
                      className="absolute inset-0 -z-10 h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                    />
                  ) : (
                    <span className="absolute inset-0 -z-10 bg-[linear-gradient(145deg,#efe6ff,#f9f6ff)]" aria-hidden />
                  )}
                  <span
                    className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,rgba(24,12,40,.82)_0%,rgba(24,12,40,.28)_55%,rgba(24,12,40,.04)_100%)]"
                    aria-hidden
                  />
                  <p className="text-[12px] font-extrabold leading-tight text-white sm:text-[13px]">{category.nameEn}</p>
                  <p className="mt-1 text-[10px] font-medium text-white/70">
                    {category.productCount} {category.productCount === 1 ? "product" : "products"}
                  </p>
                  <span className="mt-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/15 text-white opacity-0 backdrop-blur transition group-hover:opacity-100">
                    <ArrowUpRight size={12} aria-hidden />
                  </span>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { name: "Electronics", slug: "electronics" },
              { name: "Fashion", slug: "fashion" },
              { name: "Beauty", slug: "beauty" },
              { name: "Home & Kitchen", slug: "home-kitchen" },
            ].map((category) => (
              <Link
                key={category.slug}
                href={`/categories/${category.slug}`}
                className="rounded-2xl border border-[#eeeaf3] bg-[#faf8fd] p-4 text-sm font-bold text-[#3f2b5c] hover:border-brand-200"
              >
                {category.name}
              </Link>
            ))}
          </div>
        )}
      </section>

      {catalogueReady ? (
        <>
          <section className="border-y border-[#f2eef7] bg-[#fbf9fe] py-10 sm:py-14">
            <div className="container-shell">
              <SectionHeading
                eyebrow="Handpicked for you"
                title="The good stuff"
                detail="Fresh arrivals from approved ANAN sellers."
                href="/products?sort=newest"
              />
              <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                {featured.map((product, index) => (
                  <CatalogProductCard key={product.id} product={product} priority={index < 2} />
                ))}
              </div>
            </div>
          </section>

          {dealItems.length ? (
            <section className="container-shell py-10 sm:py-14">
              <ProductRail
                eyebrow="Deals of the week"
                title="Marked down, not marked up"
                detail="Real price drops from sellers — no invented urgency."
                href="/deals"
                linkLabel="All deals"
              >
                {dealItems.map((product) => (
                  <CatalogProductCard key={product.id} product={product} />
                ))}
              </ProductRail>
            </section>
          ) : null}

          <section className="container-shell pb-2">
            <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
              <div className="relative isolate overflow-hidden rounded-[22px] bg-[#261641] px-6 py-7 text-white sm:rounded-[26px] sm:px-8 sm:py-9">
                <div className="absolute -right-10 -top-16 h-52 w-52 rounded-full border border-white/10" aria-hidden />
                <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#c7a9ff]">Grow with ANAN</p>
                <h2 className="mt-2 max-w-[280px] text-[22px] font-extrabold leading-tight tracking-[-.6px] sm:text-2xl">
                  Turn your products into a nationwide shop.
                </h2>
                <Link
                  href="/sell"
                  className="mt-5 inline-flex h-10 items-center gap-2 rounded-full bg-white px-5 text-xs font-extrabold text-[#382054] transition hover:bg-[#eee5ff]"
                >
                  Apply to sell <ArrowRight size={14} aria-hidden />
                </Link>
              </div>
              <div className="relative isolate overflow-hidden rounded-[22px] bg-[#fdf3e8] px-6 py-7 sm:rounded-[26px] sm:px-8 sm:py-9">
                <div className="absolute -bottom-14 -right-10 h-44 w-44 rounded-full bg-[#f6dfc4]/70" aria-hidden />
                <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#b3742f]">Need a hand?</p>
                <h2 className="mt-2 max-w-[300px] text-[22px] font-extrabold leading-tight tracking-[-.6px] text-[#402a17] sm:text-2xl">
                  Delivery, returns and COD — answered plainly.
                </h2>
                <Link
                  href="/help"
                  className="mt-5 inline-flex h-10 items-center gap-2 rounded-full bg-[#402a17] px-5 text-xs font-extrabold text-white transition hover:bg-[#563a22]"
                >
                  Open help centre <ArrowRight size={14} aria-hidden />
                </Link>
              </div>
            </div>
          </section>

          {moreToExplore.length ? (
            <section className="container-shell py-10 sm:py-14">
              <ProductRail
                eyebrow="Keep exploring"
                title="More to discover"
                detail="More approved products from the ANAN catalogue."
                href="/products"
              >
                {moreToExplore.map((product) => (
                  <CatalogProductCard key={product.id} product={product} />
                ))}
              </ProductRail>
            </section>
          ) : null}
        </>
      ) : (
        <section className="container-shell py-10 sm:py-14">
          <div className="rounded-3xl border border-dashed border-[#ded3ec] bg-[#fbf9fe] px-6 py-12 text-center sm:py-16">
            <Sparkles className="mx-auto text-brand-400" size={30} aria-hidden />
            <h2 className="mt-4 text-xl font-extrabold text-[#2c1c44] sm:text-2xl">The catalogue is being prepared</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#8b7f9b]">
              Products appear here as soon as approved sellers publish them. Browse categories or apply to become one of
              our first stores.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
              <Link
                href="/products"
                className="inline-flex h-11 items-center gap-2 rounded-full bg-brand-600 px-5 text-xs font-extrabold text-white hover:bg-brand-700"
              >
                Browse products <ArrowRight size={15} aria-hidden />
              </Link>
              <Link
                href="/sell"
                className="inline-flex h-11 items-center rounded-full border border-[#e5dcef] bg-white px-5 text-xs font-bold text-[#4b3a60] hover:border-brand-300"
              >
                Sell on ANAN
              </Link>
            </div>
          </div>
        </section>
      )}

      {storeItems.length ? (
        <section className="border-t border-[#f2eef7] bg-[#fcfbfe] py-10 sm:py-14">
          <div className="container-shell">
            <SectionHeading
              eyebrow="Stores to explore"
              title="Meet the sellers"
              detail="Independent Bangladeshi businesses, approved by ANAN."
              href="/stores"
              linkLabel="All stores"
            />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
              {storeItems.map((store) => (
                <Link
                  key={store.storeSlug}
                  href={`/stores/${encodeURIComponent(store.storeSlug)}`}
                  className="group flex flex-col items-start gap-2.5 rounded-2xl border border-[#eeeaf3] bg-white p-3.5 transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-soft sm:flex-row sm:items-center sm:gap-3 sm:p-4"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#f4edff] text-base font-black text-brand-700 sm:h-11 sm:w-11">
                    {store.storeName.trim().charAt(0).toUpperCase()}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[12px] font-bold leading-4 text-[#302344] group-hover:text-brand-700 sm:text-[12.5px] sm:leading-5">
                      {store.storeName}
                    </span>
                    <span className="mt-0.5 block text-[10px] text-[#9a90a5] sm:text-[10.5px]">
                      {store.productCount} {store.productCount === 1 ? "product" : "products"}
                    </span>
                  </span>
                  <Store size={15} className="ml-auto hidden shrink-0 text-[#b9aec7] sm:block" aria-hidden />
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="container-shell py-10 sm:py-14">
        <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-[#f0edf4] bg-[#faf8fd] px-5 py-6 sm:flex-row sm:items-center sm:px-8">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-brand-600 shadow-sm">
              <BookOpen size={18} aria-hidden />
            </span>
            <div>
              <p className="text-sm font-extrabold text-[#302344]">Shopping with confidence</p>
              <p className="mt-1 max-w-lg text-[11.5px] leading-5 text-[#8b7f9b]">
                ANAN reviews every seller application and product listing. Checkout is cash on delivery today, and
                returns are handled directly with the seller.
              </p>
            </div>
          </div>
          <Link href="/help" className="shrink-0 text-xs font-bold text-brand-700 hover:underline">
            Read the buyer guide →
          </Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
