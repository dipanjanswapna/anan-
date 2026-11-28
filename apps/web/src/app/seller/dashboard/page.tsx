import { SellerDashboard } from "@/components/seller-dashboard";\nimport { SellerReturns } from "@/components/seller-returns";
export const metadata = { title: "Seller Centre — ANAN", description: "Manage your ANAN seller orders." };
export default function SellerDashboardPage() { return <><SellerDashboard/><SellerReturns/></>; }
