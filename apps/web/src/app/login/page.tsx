import { CustomerOtpForm } from "@/components/customer-otp-form";

export const metadata = {
  title: "Sign in — ANAN",
  description: "Verify your mobile number to continue to ANAN.",
};

export default function LoginPage() {
  return (
    <main className="grid min-h-[calc(100vh-140px)] place-items-center bg-[#faf9fc] px-4 py-12">
      <CustomerOtpForm/>
    </main>
  );
}
