import { CustomerAccount } from "@/components/customer-account";

export const metadata = {
  title: "My account — ANAN",
  description: "Manage your ANAN customer profile and delivery addresses.",
};

export default function AccountPage() {
  return <CustomerAccount />;
}
