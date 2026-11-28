import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SellerNav } from "@/components/seller-nav";
import { SellerProductCreateForm } from "@/components/seller-product-form";

type Category = { id: string; nameEn: string; nameBn: string | null; slug: string };
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

export const metadata = { title: "Add a product — ANAN Seller Centre", description: "Create a new ANAN product listing as a draft." };

export default async function NewSellerProductPage() {
  const categories = await getCategories();
  return (
    <main className="min-h-screen bg-[#faf9fc]">
      <SellerNav />
      <div className="container-shell max-w-5xl py-8">
        <Link href="/seller/products" className="inline-flex items-center gap-2 text-xs font-bold text-brand-700"><ArrowLeft size={15} aria-hidden /> Your products</Link>
        <header className="mt-4">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-brand-600">New listing</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-[-1px] text-[#281743]">Add a product</h1>
          <p className="mt-1 text-sm text-[#82788f]">Start with the essentials. You can refine the copy and images before submitting it for review.</p>
        </header>
        {!categories.length && (
          <p role="alert" className="mt-6 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-800">
            Categories could not be loaded. Make sure the ANAN API is running, then refresh this page.
          </p>
        )}
        <SellerProductCreateForm categories={categories} />
      </div>
    </main>
  );
}
