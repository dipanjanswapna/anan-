import { SellerProductImages } from "@/components/seller-product-images";
type Context = { params: Promise<{ productId: string }> };
export const metadata = { title: "Product Images — ANAN Seller Centre" };
export default async function SellerProductImagesPage({ params }: Context) {
  const { productId } = await params;
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(productId)) return <main className="container-shell py-16">Invalid product ID.</main>;
  return <SellerProductImages productId={productId} />;
}
