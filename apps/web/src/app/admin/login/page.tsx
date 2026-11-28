import { AuthLayout } from "@/components/auth-layout";
import { CustomerAuthForm } from "@/components/customer-auth-form";

export const metadata = {
  title: "Admin sign-in — ANAN",
  description: "Sign in to the ANAN admin console with your verified staff mobile number.",
  robots: { index: false, follow: false },
};

const safeNext = (value: string | string[] | undefined) => {
  const candidate = Array.isArray(value) ? value[0] : value;
  return candidate && candidate.startsWith("/admin") && !candidate.startsWith("//") ? candidate : "/admin";
};

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  return (
    <AuthLayout heading="Admin sign-in." subheading="For approved ANAN staff only. We verify your number with a one-time code.">
      <CustomerAuthForm mode="admin" nextPath={safeNext(params.next)} />
    </AuthLayout>
  );
}
