import { SellerNav } from "@/components/seller-nav";
import { SellerProducts } from "@/components/seller-products";

export const metadata = { title: "Products — ANAN Seller Centre", description: "Create and manage your ANAN product listings." };

export default function SellerProductsPage() {
  return (
    <main className="min-h-screen bg-[#faf9fc]">
      <SellerNav />
      <SellerProducts />
    </main>
  );
}
