import { AuthLayout } from "@/components/auth-layout";
import { CustomerAuthForm } from "@/components/customer-auth-form";

export const metadata = {
  title: "Sign in — ANAN",
  description: "Sign in to ANAN with your mobile number to manage your cart, wishlist and orders.",
};

const safeNext = (value: string | string[] | undefined) => {
  const candidate = Array.isArray(value) ? value[0] : value;
  return candidate && candidate.startsWith("/") && !candidate.startsWith("//") ? candidate : "/account";
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  return (
    <AuthLayout heading="Welcome back." subheading="Sign in with your ANAN mobile number. We will text you a one-time code.">
      <CustomerAuthForm mode="signin" nextPath={safeNext(params.next)} />
    </AuthLayout>
  );
}
