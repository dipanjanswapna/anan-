import { AuthLayout } from "@/components/auth-layout";
import { CustomerAuthForm } from "@/components/customer-auth-form";

export const metadata = {
  title: "Create an account — ANAN",
  description: "Create your ANAN account with a verified mobile number to shop, save products and track orders.",
};

const safeNext = (value: string | string[] | undefined) => {
  const candidate = Array.isArray(value) ? value[0] : value;
  return candidate && candidate.startsWith("/") && !candidate.startsWith("//") ? candidate : "/account";
};

export default async function SignupPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  return (
    <AuthLayout heading="Create your account." subheading="One verified mobile number, and your cart, wishlist and orders stay together.">
      <CustomerAuthForm mode="signup" nextPath={safeNext(params.next)} />
    </AuthLayout>
  );
}
