import { SellerDashboard } from "@/components/seller-dashboard";
import { SellerReturns } from "@/components/seller-returns";
import { SellerFinance } from "@/components/seller-finance";
export const metadata = { title: "Seller Centre — ANAN", description: "Manage your ANAN seller orders." };
export default function SellerDashboardPage() { return <><SellerDashboard/><SellerFinance/><SellerReturns/></>; }
