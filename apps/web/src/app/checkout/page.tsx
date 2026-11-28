import { SiteHeader } from "@/components/site-header";
import { CustomerCheckout } from "@/components/customer-checkout";

export const metadata = { title: "Checkout — ANAN", description: "Choose a delivery address and place your COD order." };
export default function CheckoutPage() {
  return <main className="min-h-screen bg-[#fcfbfe]"><SiteHeader/><CustomerCheckout/></main>;
}
