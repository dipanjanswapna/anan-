import { SiteHeader } from "@/components/site-header";
import { CustomerOrderTracking } from "@/components/customer-order-tracking";
export const metadata = { title: "Order tracking — ANAN", description: "Track your ANAN order and shipment updates." };
export default async function OrderTrackingPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
 const { id } = await params;
 const query = await searchParams;
 const placed = (Array.isArray(query.placed) ? query.placed[0] : query.placed) === "1";
 return <main className="min-h-screen bg-[#fcfbfe]"><SiteHeader/><CustomerOrderTracking orderId={id} justPlaced={placed}/></main>;
}
