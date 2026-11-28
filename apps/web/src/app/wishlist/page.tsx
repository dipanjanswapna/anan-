import { SiteHeader } from "@/components/site-header";
import { CustomerWishlist } from "@/components/customer-wishlist";

export const metadata = { title: "My wishlist — ANAN", description: "Your saved ANAN products." };
export default function WishlistPage() { return <main className="min-h-screen bg-[#fcfbfe]"><SiteHeader/><CustomerWishlist/></main>; }
