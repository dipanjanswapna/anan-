"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BellOff,
  Check,
  ChevronRight,
  Heart,
  LoaderCircle,
  LogOut,
  MapPin,
  Package,
  Plus,
  ShieldCheck,
  Trash2,
  Truck,
  UserRound,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { formatDate, formatTaka, prettyStatus } from "@/lib/format";

type Profile = { id: string; name: string | null; email: string | null; phone: string | null; createdAt: string; phoneVerifiedAt?: string | null };
type Address = {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  division: string;
  district: string;
  upazila: string;
  area: string;
  addressLine: string;
  postalCode: string | null;
  isDefault: boolean;
};
type Order = {
  id: string;
  status: string;
  paymentStatus: string;
  totalPaisa: string;
  createdAt: string;
  sellerOrders: Array<{ id: string; status: string; items: Array<{ id: string; productNameEn: string; quantity: number }> }>;
};
type WishlistItem = { id: string; product: { id: string } };

type Tab = "overview" | "profile" | "addresses";

const fieldClass =
  "mt-1 w-full rounded-xl border border-[#e8e1f0] bg-white px-3.5 py-2.5 text-[13px] text-[#302344] outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100";
const labelClass = "block text-[11px] font-bold text-[#5e526d]";
const emptyAddress = {
  label: "Home",
  recipientName: "",
  phone: "",
  division: "",
  district: "",
  upazila: "",
  area: "",
  addressLine: "",
  postalCode: "",
  isDefault: false,
};

const statusTone = (status: string) => {
  if (status === "DELIVERED") return "bg-emerald-50 text-emerald-700";
  if (status === "CANCELLED") return "bg-rose-50 text-rose-700";
  if (status === "SHIPPED") return "bg-sky-50 text-sky-700";
  if (status === "PROCESSING" || status === "PENDING_SELLER_ACCEPTANCE") return "bg-[#fff4e8] text-[#b35c1e]";
  return "bg-[#f3eefb] text-brand-700";
};

export function CustomerAccount() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: "", email: "" });
  const [addressForm, setAddressForm] = useState({ ...emptyAddress });

  useEffect(() => {
    void (async () => {
      try {
        const responses = await Promise.all([
          fetch("/api/account/me", { cache: "no-store" }),
          fetch("/api/account/me/addresses", { cache: "no-store" }),
          fetch("/api/account/me/orders", { cache: "no-store" }),
          fetch("/api/account/me/wishlist", { cache: "no-store" }),
        ]);
        if (responses.some((response) => response.status === 401)) {
          router.replace("/login?next=/account");
          return;
        }
        const [profileData, addressData, orderData, wishlistData] = await Promise.all(responses.map((response) => response.json()));
        if (!responses[0].ok) throw new Error(profileData.message || "Unable to load your account.");
        setProfile(profileData.user);
        setProfileForm({ name: profileData.user.name ?? "", email: profileData.user.email ?? "" });
        setAddresses(addressData.addresses ?? []);
        setOrders(orderData.orders ?? []);
        setWishlistCount((wishlistData.items ?? []).length);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Unable to load your account.");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingProfile(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/account/me", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: profileForm.name, ...(profileForm.email.trim() ? { email: profileForm.email.trim() } : {}) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to update your profile.");
      setProfile(data.user);
      setNotice(data.message || "Profile updated.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to update your profile.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function saveAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingAddress(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/account/me/addresses", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...addressForm, postalCode: addressForm.postalCode || undefined }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to save this address.");
      setAddresses((current) => [data.address, ...current.filter((item) => item.id !== data.address.id)]);
      setAddressForm({ ...emptyAddress });
      setShowAddressForm(false);
      setNotice(data.message || "Address saved.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save this address.");
    } finally {
      setSavingAddress(false);
    }
  }

  async function deleteAddress(id: string) {
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/account/me/addresses/${id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to delete this address.");
      setAddresses((current) => current.filter((item) => item.id !== id));
      setNotice(data.message || "Address deleted.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to delete this address.");
    }
  }

  async function logout() {
    await fetch("/api/auth/otp/logout", { method: "POST" }).catch(() => undefined);
    router.replace("/login");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="container-shell max-w-5xl py-10">
        <div className="h-24 animate-pulse rounded-2xl bg-[#f4effa]" />
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          {[0, 1, 2, 3].map((index) => <div key={index} className="h-24 animate-pulse rounded-2xl bg-[#f7f3fb]" />)}
        </div>
        <p role="status" className="sr-only">Loading your account</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container-shell max-w-md py-16 text-center">
        <p role="alert" className="text-sm text-[#6f647e]">{error || "Sign in to view your account."}</p>
        <Link href="/login?next=/account" className="mt-4 inline-flex h-11 items-center rounded-full bg-brand-600 px-5 text-xs font-extrabold text-white">
          Sign in
        </Link>
      </div>
    );
  }

  const initials = (profile.name?.trim() || "A").split(/\s+/).slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join("");
  const delivered = orders.filter((order) => order.status === "DELIVERED").length;
  const active = orders.filter((order) => order.status === "PENDING_SELLER_ACCEPTANCE" || order.status === "PROCESSING" || order.status === "SHIPPED").length;
  const recentOrders = orders.slice(0, 3);

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: "overview", label: "Overview" },
    { id: "profile", label: "Profile" },
    { id: "addresses", label: "Addresses" },
  ];

  return (
    <div className="min-h-screen bg-[#fcfbfe]">
      <div className="container-shell max-w-5xl py-6 sm:py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.2em] text-brand-600">Your ANAN</p>
            <h1 className="mt-1.5 text-[27px] font-extrabold tracking-[-1px] text-[#24143f] sm:text-[32px]">My account</h1>
          </div>
          <button
            type="button"
            onClick={() => void logout()}
            className="inline-flex h-10 items-center gap-1.5 rounded-full border border-[#e9e3f2] bg-white px-4 text-[11.5px] font-bold text-[#5c4d70] transition hover:bg-[#faf7ff]"
          >
            <LogOut size={14} aria-hidden /> Sign out
          </button>
        </div>

        <section className="mt-5 flex flex-wrap items-center gap-4 rounded-2xl border border-[#eeeaf3] bg-white p-4 sm:p-5">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#f1e8ff] text-lg font-black text-brand-700 sm:h-16 sm:w-16">
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[17px] font-extrabold text-[#24143f]">{profile.name || "ANAN shopper"}</p>
            <p className="mt-0.5 truncate text-[11.5px] text-[#8b7f9b]">{profile.email || "No email added yet"}</p>
            <p className="mt-0.5 text-[11px] font-semibold text-[#9a90a5]">{profile.phone}</p>
          </div>
          <button
            type="button"
            onClick={() => setTab("profile")}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#f5f0fc] px-4 text-[11px] font-extrabold text-brand-700 transition hover:bg-[#ece1fd]"
          >
            Edit profile <ChevronRight size={13} aria-hidden />
          </button>
        </section>

        {notice ? <p role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-[11.5px] text-emerald-800">{notice}</p> : null}
        {error ? <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-[11.5px] text-rose-700">{error}</p> : null}

        <div className="soft-scrollbar mt-5 flex gap-1.5 overflow-x-auto rounded-xl bg-[#f5f1fa] p-1" role="tablist" aria-label="Account sections">
          {tabs.map((item) => (
            <button
              key={item.id}
              role="tab"
              type="button"
              aria-selected={tab === item.id}
              onClick={() => setTab(item.id)}
              className={`shrink-0 rounded-lg px-4 py-2 text-[11.5px] font-bold transition ${
                tab === item.id ? "bg-white text-[#24143f] shadow-sm" : "text-[#7b6d8c] hover:text-brand-700"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {tab === "overview" ? (
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {[
                { label: "Orders", value: orders.length, icon: Package, href: "/orders" },
                { label: "Wishlist", value: wishlistCount, icon: Heart, href: "/wishlist" },
                { label: "Addresses", value: addresses.length, icon: MapPin, href: null },
                { label: "Delivered", value: delivered, icon: Check, href: "/orders" },
              ].map((stat) => {
                const content = (
                  <>
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#f5f0fc] text-brand-700">
                      <stat.icon size={16} aria-hidden />
                    </span>
                    <span className="mt-2 block text-xl font-black text-[#24143f]">{stat.value}</span>
                    <span className="block text-[10px] font-bold uppercase tracking-[.08em] text-[#9a90a5]">{stat.label}</span>
                  </>
                );
                return stat.href ? (
                  <Link key={stat.label} href={stat.href} className="rounded-2xl border border-[#eeeaf3] bg-white p-3.5 transition hover:border-brand-200 hover:shadow-soft">
                    {content}
                  </Link>
                ) : (
                  <button
                    key={stat.label}
                    type="button"
                    onClick={() => setTab("addresses")}
                    className="rounded-2xl border border-[#eeeaf3] bg-white p-3.5 text-left transition hover:border-brand-200"
                  >
                    {content}
                  </button>
                );
              })}
            </div>

            <section className="rounded-2xl border border-[#eeeaf3] bg-white p-4 sm:p-5">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-[14px] font-extrabold text-[#24143f]">Recent orders</h2>
                <Link href="/orders" className="inline-flex items-center gap-1 text-[10.5px] font-bold text-brand-700">
                  View all <ArrowRight size={12} aria-hidden />
                </Link>
              </div>
              {active ? (
                <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#fff4e8] px-2.5 py-1 text-[10px] font-bold text-[#b35c1e]">
                  <Truck size={11} aria-hidden /> {active} order{active === 1 ? "" : "s"} in progress
                </p>
              ) : null}
              {!recentOrders.length ? (
                <div className="mt-3 rounded-xl border border-dashed border-[#e4dbee] bg-[#fcfbfe] px-4 py-8 text-center">
                  <p className="text-[12.5px] font-bold text-[#4b3c5e]">No orders yet</p>
                  <p className="mt-1 text-[11px] text-[#9a90a5]">When you place your first order it will appear here.</p>
                  <Link href="/products" className="mt-3 inline-flex h-9 items-center rounded-full bg-brand-600 px-4 text-[11px] font-extrabold text-white">
                    Start shopping
                  </Link>
                </div>
              ) : (
                <div className="mt-3 space-y-2.5">
                  {recentOrders.map((order) => (
                    <Link
                      key={order.id}
                      href={`/orders/${order.id}`}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#f1ecf7] p-3 transition hover:border-brand-200 hover:bg-[#fdfbff]"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-mono text-[10.5px] font-bold text-[#4b3c5e]">{order.id}</p>
                        <p className="mt-0.5 text-[10px] text-[#9a90a5]">
                          {formatDate(order.createdAt)} · {order.sellerOrders.reduce((sum, seller) => sum + seller.items.length, 0)} item(s)
                        </p>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className={`rounded-full px-2.5 py-1 text-[9.5px] font-extrabold ${statusTone(order.status)}`}>
                          {prettyStatus(order.status)}
                        </span>
                        <span className="text-[12px] font-extrabold text-[#302344]">{formatTaka(order.totalPaisa)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <section className="overflow-hidden rounded-2xl border border-[#eeeaf3] bg-white">
              <h2 className="px-4 pt-4 text-[14px] font-extrabold text-[#24143f]">Account & support</h2>
              <ul className="mt-2 divide-y divide-[#f4f0f9]">
                {[
                  { label: "My orders & tracking", desc: "Track, cancel or request a return", href: "/orders", icon: Package },
                  { label: "Wishlist", desc: `${wishlistCount} saved product${wishlistCount === 1 ? "" : "s"}`, href: "/wishlist", icon: Heart },
                  { label: "Delivery addresses", desc: `${addresses.length} saved`, href: null, icon: MapPin, action: () => setTab("addresses") },
                  { label: "Help & support", desc: "Delivery, COD and returns explained", href: "/help", icon: ShieldCheck },
                ].map((row) => {
                  const inner = (
                    <>
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#f7f3fc] text-brand-700">
                        <row.icon size={15} aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[12px] font-bold text-[#302344]">{row.label}</span>
                        <span className="mt-0.5 block truncate text-[10.5px] text-[#9a90a5]">{row.desc}</span>
                      </span>
                      <ChevronRight size={15} className="shrink-0 text-[#c3b9d0]" aria-hidden />
                    </>
                  );
                  return (
                    <li key={row.label}>
                      {row.href ? (
                        <Link href={row.href} className="flex items-center gap-3 px-4 py-3 transition hover:bg-[#fdfbff]">{inner}</Link>
                      ) : (
                        <button type="button" onClick={row.action} className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-[#fdfbff]">{inner}</button>
                      )}
                    </li>
                  );
                })}
                <li>
                  <div className="flex items-center gap-3 px-4 py-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#f7f3fc] text-[#a99cb8]">
                      <BellOff size={15} aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[12px] font-bold text-[#7b6d8c]">Notifications</span>
                      <span className="mt-0.5 block text-[10.5px] text-[#a99cb8]">Customer notifications are not enabled yet</span>
                    </span>
                  </div>
                </li>
              </ul>
            </section>
          </div>
        ) : null}

        {tab === "profile" ? (
          <section className="mt-4 rounded-2xl border border-[#eeeaf3] bg-white p-4 sm:p-6">
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#f5f0fc] text-brand-700"><UserRound size={16} aria-hidden /></span>
              <div>
                <h2 className="text-[14px] font-extrabold text-[#24143f]">Personal information</h2>
                <p className="text-[10.5px] text-[#9a90a5]">Used on receipts and delivery updates</p>
              </div>
            </div>
            <form onSubmit={saveProfile} className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className={labelClass}>
                Full name
                <input className={fieldClass} required minLength={2} maxLength={100} value={profileForm.name} onChange={(event) => setProfileForm((value) => ({ ...value, name: event.target.value }))} placeholder="Your name" />
              </label>
              <label className={labelClass}>
                Email address
                <input type="email" className={fieldClass} value={profileForm.email} onChange={(event) => setProfileForm((value) => ({ ...value, email: event.target.value }))} placeholder="you@example.com" />
              </label>
              <label className={`${labelClass} sm:col-span-2`}>
                Verified mobile number
                <input className={`${fieldClass} bg-[#faf9fc] text-[#8c8298]`} value={profile.phone ?? ""} readOnly />
                <span className="mt-1 block text-[10px] font-normal text-[#a096ad]">
                  Changing your number needs a fresh OTP verification, so it is locked for now.
                </span>
              </label>
              <div className="sm:col-span-2">
                <button disabled={savingProfile} className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand-600 px-5 text-[12px] font-extrabold text-white disabled:opacity-60">
                  {savingProfile ? <LoaderCircle size={14} className="animate-spin" aria-hidden /> : <Check size={14} aria-hidden />}
                  {savingProfile ? "Saving…" : "Save profile"}
                </button>
              </div>
            </form>
          </section>
        ) : null}

        {tab === "addresses" ? (
          <section className="mt-4 rounded-2xl border border-[#eeeaf3] bg-white p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-[14px] font-extrabold text-[#24143f]">Delivery addresses</h2>
                <p className="text-[10.5px] text-[#9a90a5]">Bangladesh address book</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddressForm((value) => !value)}
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#f5f0fc] px-4 text-[11px] font-extrabold text-brand-700 hover:bg-[#ece1fd]"
              >
                <Plus size={13} aria-hidden /> Add address
              </button>
            </div>

            {showAddressForm ? (
              <form onSubmit={saveAddress} className="mt-4 rounded-xl border border-[#e9e1f3] bg-[#fcfbfe] p-3.5">
                <div className="grid grid-cols-2 gap-2.5">
                  {([
                    ["label", "Label"],
                    ["recipientName", "Recipient"],
                    ["phone", "Mobile number"],
                    ["division", "Division"],
                    ["district", "District"],
                    ["upazila", "Upazila"],
                    ["area", "Area / locality"],
                    ["postalCode", "Postcode (optional)"],
                  ] as const).map(([key, title]) => (
                    <label key={key} className={labelClass}>
                      {title}
                      <input
                        className={fieldClass}
                        required={key !== "postalCode"}
                        type={key === "phone" ? "tel" : "text"}
                        value={addressForm[key]}
                        onChange={(event) => setAddressForm((value) => ({ ...value, [key]: event.target.value }))}
                        maxLength={120}
                      />
                    </label>
                  ))}
                  <label className={`${labelClass} col-span-2`}>
                    House, road and full address
                    <textarea
                      className="mt-1 w-full rounded-xl border border-[#e8e1f0] bg-white px-3.5 py-2.5 text-[13px] outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
                      rows={2}
                      required
                      minLength={5}
                      maxLength={500}
                      value={addressForm.addressLine}
                      onChange={(event) => setAddressForm((value) => ({ ...value, addressLine: event.target.value }))}
                    />
                  </label>
                </div>
                <label className="mt-2.5 flex items-center gap-2 text-[11px] font-medium text-[#6f6380]">
                  <input type="checkbox" checked={addressForm.isDefault} onChange={(event) => setAddressForm((value) => ({ ...value, isDefault: event.target.checked }))} className="h-4 w-4 accent-[#7434df]" />
                  Make this my default address
                </label>
                <div className="mt-3 flex gap-2">
                  <button disabled={savingAddress} className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-brand-600 px-4 text-[11.5px] font-extrabold text-white disabled:opacity-60">
                    {savingAddress ? <LoaderCircle size={13} className="animate-spin" aria-hidden /> : <Check size={13} aria-hidden />}
                    {savingAddress ? "Saving…" : "Save address"}
                  </button>
                  <button type="button" onClick={() => setShowAddressForm(false)} className="h-10 rounded-lg border border-[#e9e3f2] px-4 text-[11.5px] font-semibold text-[#6f6380]">Cancel</button>
                </div>
              </form>
            ) : null}

            <div className="mt-4 space-y-2.5">
              {!addresses.length && !showAddressForm ? (
                <div className="rounded-xl border border-dashed border-[#e3dbea] px-4 py-8 text-center">
                  <MapPin className="mx-auto text-[#b2a8bf]" size={22} aria-hidden />
                  <p className="mt-2 text-[12px] font-bold text-[#4b3c5e]">No saved addresses yet</p>
                  <p className="mt-1 text-[10.5px] text-[#9a90a5]">Add one to make checkout faster.</p>
                </div>
              ) : null}
              {addresses.map((address) => (
                <article key={address.id} className="rounded-xl border border-[#f0ecf6] p-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[12px] font-extrabold text-[#302344]">{address.label}</span>
                        {address.isDefault ? <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[9px] font-extrabold text-brand-700">DEFAULT</span> : null}
                      </div>
                      <p className="mt-1 text-[11px] font-semibold text-[#665a76]">{address.recipientName} · {address.phone}</p>
                      <p className="mt-0.5 text-[10.5px] leading-4 text-[#8b7f9b]">
                        {address.addressLine}, {address.area}, {address.upazila}, {address.district}, {address.division}
                        {address.postalCode ? ` - ${address.postalCode}` : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void deleteAddress(address.id)}
                      aria-label={`Delete ${address.label} address`}
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[#a99cb8] transition hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 size={14} aria-hidden />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
