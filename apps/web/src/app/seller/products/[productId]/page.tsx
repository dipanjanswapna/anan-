import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SellerNav } from "@/components/seller-nav";
import { SellerProductEditor } from "@/components/seller-product-form";

type Category = { id: string; nameEn: string; nameBn: string | null; slug: string };
type Context = { params: Promise<{ productId: string }>; searchParams: Promise<{ created?: string }> };
const apiUrl = (process.env.ANAN_API_URL ?? "http://localhost:4000/api/v1").replace(/\/$/, "");

async function getCategories(): Promise<Category[]> {
  try {
    const response = await fetch(`${apiUrl}/catalog/categories`, { next: { revalidate: 300 } });
    if (!response.ok) return [];
    return (await response.json()) as Category[];
  } catch {
    return [];
  }
}

export const metadata = { title: "Edit product — ANAN Seller Centre", description: "Edit your ANAN product listing." };

export default async function EditSellerProductPage({ params, searchParams }: Context) {
  const { productId } = await params;
  const { created } = await searchParams;
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(productId)) {
    return <main className="container-shell py-16"><p className="text-sm text-rose-700">Invalid product ID.</p></main>;
  }
  const categories = await getCategories();
  return (
    <main className="min-h-screen bg-[#faf9fc]">
      <SellerNav />
      <div className="container-shell max-w-5xl py-8">
        <Link href="/seller/products" className="inline-flex items-center gap-2 text-xs font-bold text-brand-700"><ArrowLeft size={15} aria-hidden /> Your products</Link>
        <header className="mt-4">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-brand-600">Edit listing</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-[-1px] text-[#281743]">Product details</h1>
          <p className="mt-1 text-sm text-[#82788f]">Edits to a live product are saved in place. Draft and rejected products are reviewed before they go public.</p>
        </header>
        <SellerProductEditor productId={productId} categories={categories} created={created === "1"} />
      </div>
    </main>
  );
}
