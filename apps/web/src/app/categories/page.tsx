import Link from "next/link";
import { ArrowRight, LayoutGrid } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

type Category = { id: string; nameEn: string; nameBn: string | null; slug: string; productCount: number };
const apiUrl = (process.env.ANAN_API_URL ?? "http://localhost:4000/api/v1").replace(/\/$/, "");

const art: Record<string, { tone: string; ink: string; glyph: string; blurb: string }> = {
  electronics: { tone: "bg-[#efe8ff]", ink: "text-[#7144c5]", glyph: "⌁", blurb: "Phones, audio, accessories and everyday tech." },
  fashion: { tone: "bg-[#ffece8]", ink: "text-[#d66b56]", glyph: "✳", blurb: "Wardrobe staples and pieces that feel like you." },
  beauty: { tone: "bg-[#ffeaf3]", ink: "text-[#c65b8d]", glyph: "✿", blurb: "Skincare, makeup and small daily rituals." },
  "home-kitchen": { tone: "bg-[#e8f3ed]", ink: "text-[#4f9670]", glyph: "⌂", blurb: "Make your space warmer, calmer and more useful." },
  grocery: { tone: "bg-[#fff2dd]", ink: "text-[#c58a36]", glyph: "◉", blurb: "Pantry basics and daily essentials." },
  books: { tone: "bg-[#e8f0ff]", ink: "text-[#5a7ec3]", glyph: "▤", blurb: "Stories, ideas and stationery for slower days." },
};
const fallback = { tone: "bg-[#f3eff9]", ink: "text-[#7a5fa0]", glyph: "✦", blurb: "A little something for every part of your day." };

async function getCategories(): Promise<Category[] | null> {
  try {
    const response = await fetch(`${apiUrl}/catalog/categories`, { next: { revalidate: 300 } });
    if (!response.ok) return null;
    return (await response.json()) as Category[];
  } catch {
    return null;
  }
}

export const metadata = {
  title: "Shop by category",
  description: "Browse every ANAN category — electronics, fashion, beauty, home, grocery and books — from approved sellers across Bangladesh.",
  alternates: { canonical: "/categories" },
};

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <main className="min-h-screen bg-[#fcfbfe]">
      <SiteHeader />
      <section className="border-b border-[#f0edf4] bg-white">
        <div className="container-shell py-9 sm:py-12">
          <nav aria-label="Breadcrumb" className="text-[11px] font-semibold text-[#a097ad]">
            <Link href="/" className="hover:text-brand-600">Home</Link>
            <span className="mx-1.5" aria-hidden>/</span>
            <span className="text-[#655873]">Categories</span>
          </nav>
          <p className="mt-4 text-[10px] font-bold uppercase tracking-[.2em] text-brand-600">Explore the edit</p>
          <h1 className="mt-2 max-w-2xl text-3xl font-extrabold tracking-[-1.2px] text-[#26183c] sm:text-[40px]">Find your something.</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#8f849e]">A little inspiration for every part of your day — curated from verified ANAN sellers.</p>
        </div>
      </section>

      <section className="container-shell py-9 sm:py-12">
        {!categories ? (
          <div className="rounded-2xl border border-dashed border-[#ddd3e9] bg-white px-6 py-16 text-center">
            <LayoutGrid className="mx-auto text-brand-400" size={36} aria-hidden />
            <h2 className="mt-4 font-bold text-[#302344]">Categories are loading soon</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#92889f]">The catalogue service is not reachable. Start the ANAN API and refresh.</p>
            <Link href="/products" className="mt-5 inline-flex rounded-xl bg-brand-600 px-5 py-2.5 text-xs font-bold text-white">Browse all products</Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => {
              const style = art[category.slug] ?? fallback;
              return (
                <Link key={category.id} href={`/categories/${category.slug}`} className="group flex flex-col justify-between rounded-3xl border border-[#eeeaf3] bg-white p-6 transition hover:-translate-y-1 hover:border-brand-200 hover:shadow-soft">
                  <div className="flex items-start justify-between gap-3">
                    <div className={`grid h-16 w-16 place-items-center rounded-2xl text-3xl ${style.tone} ${style.ink}`} aria-hidden>{style.glyph}</div>
                    <span className="badge bg-[#faf8fd] text-[#8f849e]">{category.productCount} {category.productCount === 1 ? "product" : "products"}</span>
                  </div>
                  <div className="mt-6">
                    <h2 className="text-lg font-extrabold tracking-tight text-[#302344]">{category.nameEn}</h2>
                    {category.nameBn && <p className="mt-1 text-sm text-[#93889f]">{category.nameBn}</p>}
                    <p className="mt-2 text-xs leading-5 text-[#8f849e]">{style.blurb}</p>
                  </div>
                  <span className="mt-5 inline-flex items-center gap-1 text-xs font-bold text-brand-700 transition group-hover:gap-2">Browse category <ArrowRight size={14} aria-hidden /></span>
                </Link>
              );
            })}
          </div>
        )}
      </section>
      <SiteFooter />
    </main>
  );
}
