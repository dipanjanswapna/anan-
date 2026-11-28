import { SiteHeader } from "@/components/site-header";
import { CustomerOrderTracking } from "@/components/customer-order-tracking";
export const metadata = { title: "Order tracking — ANAN", description: "Track your ANAN order and shipment updates." };
export default async function OrderTrackingPage({params}:{params:Promise<{id:string}>}) {
 const {id}=await params;
 return <main className="min-h-screen bg-[#fcfbfe]"><SiteHeader/><CustomerOrderTracking orderId={id}/></main>;
}
