import { SiteHeader } from "@/components/site-header";
import { CustomerCart } from "@/components/customer-cart";

export const metadata = { title: "Shopping cart — ANAN", description: "Review your ANAN shopping cart." };
export default function CartPage() { return <main className="min-h-screen bg-[#fcfbfe]"><SiteHeader/><CustomerCart/></main>; }
