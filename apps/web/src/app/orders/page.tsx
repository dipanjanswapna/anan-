import { SiteHeader } from "@/components/site-header";
import { CustomerOrders } from "@/components/customer-orders";

export const metadata = { title: "My orders — ANAN", description: "View your ANAN order history." };
export default function OrdersPage() {
  return <main className="min-h-screen bg-[#fcfbfe]"><SiteHeader/><CustomerOrders/></main>;
}
