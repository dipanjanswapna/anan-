import { SellerOtpForm } from "@/components/seller-otp-form";
export const metadata = { title: "Seller sign in — ANAN", description: "Secure OTP sign in for approved ANAN sellers." };
export default function SellerLoginPage() {
  return <main className="grid min-h-[calc(100vh-140px)] place-items-center bg-[#faf9fc] px-4 py-12"><SellerOtpForm/></main>;
}
