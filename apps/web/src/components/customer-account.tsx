"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Plus, Trash2, UserRound, LogOut, LoaderCircle } from "lucide-react";

type Profile = { id: string; name: string | null; email: string | null; phone: string | null; createdAt: string };
type Address = {
  id: string; label: string; recipientName: string; phone: string; division: string;
  district: string; upazila: string; area: string; addressLine: string; postalCode: string | null; isDefault: boolean;
};

const fieldClass = "w-full rounded-xl border border-[#e8e1f0] bg-white px-3.5 py-3 text-sm text-[#302344] outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100";
const labelClass = "mb-1.5 block text-xs font-semibold text-[#6f647e]";

export function CustomerAccount() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: "", email: "" });
  const [addressForm, setAddressForm] = useState({
    label: "Home", recipientName: "", phone: "", division: "", district: "",
    upazila: "", area: "", addressLine: "", postalCode: "", isDefault: false,
  });

  async function loadAccount() {
    setLoading(true);
    setError("");
    try {
      const [profileResponse, addressResponse] = await Promise.all([
        fetch("/api/account/me", { cache: "no-store" }),
        fetch("/api/account/me/addresses", { cache: "no-store" }),
      ]);
      if (profileResponse.status === 401 || addressResponse.status === 401) {
        router.replace("/login?next=/account");
        return;
      }
      const profileData = await profileResponse.json();
      const addressData = await addressResponse.json();
      if (!profileResponse.ok || !addressResponse.ok) throw new Error(profileData.message || addressData.message || "Unable to load your account.");
      setProfile(profileData.user);
      setProfileForm({ name: profileData.user.name ?? "", email: profileData.user.email ?? "" });
      setAddresses(addressData.addresses ?? []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load your account.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadAccount(); }, []);

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingProfile(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/account/me", {
        method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(profileForm),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to update profile.");
      setProfile(data.user);
      setNotice(data.message || "Profile updated.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to update profile.");
    } finally { setSavingProfile(false); }
  }

  async function saveAddress(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingAddress(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/account/me/addresses", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...addressForm, postalCode: addressForm.postalCode || undefined }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to save address.");
      setAddresses(current => [data.address, ...current.filter(item => item.id !== data.address.id).map(item => data.address.isDefault ? { ...item, isDefault: false } : item)]);
      setAddressForm({ label: "Home", recipientName: "", phone: "", division: "", district: "", upazila: "", area: "", addressLine: "", postalCode: "", isDefault: false });
      setShowAddressForm(false);
      setNotice(data.message || "Address saved.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save address.");
    } finally { setSavingAddress(false); }
  }

  async function deleteAddress(id: string) {
    setError(""); setNotice("");
    try {
      const response = await fetch(`/api/account/me/addresses/${id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to delete address.");
      setAddresses(current => {
        const remaining = current.filter(item => item.id !== id);
        if (remaining.length && !remaining.some(item => item.isDefault)) remaining[0] = { ...remaining[0], isDefault: true };
        return remaining;
      });
      setNotice(data.message || "Address deleted.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to delete address.");
    }
  }

  async function logout() {
    await fetch("/api/auth/otp/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  if (loading) return <main className="grid min-h-[60vh] place-items-center"><LoaderCircle className="animate-spin text-brand-600" /></main>;
  if (!profile) return <main className="container-shell py-16"><p className="text-sm text-[#6f647e]">{error || "Sign in to view your account."}</p><Link href="/login" className="mt-4 inline-flex rounded-xl bg-brand-600 px-5 py-3 text-sm font-bold text-white">Sign in</Link></main>;

  return (
    <main className="min-h-screen bg-[#faf9fc] py-8 sm:py-12">
      <div className="container-shell max-w-5xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div><p className="text-xs font-bold uppercase tracking-[.18em] text-brand-600">ANAN account</p><h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#24143f]">My account</h1><p className="mt-1 text-sm text-[#82788f]">Your profile and delivery details, all in one place.</p></div>
          <button onClick={logout} className="inline-flex items-center gap-2 rounded-xl border border-[#e9e3f2] bg-white px-4 py-2.5 text-sm font-semibold text-[#5c4d70] hover:bg-[#f8f5fc]"><LogOut size={16}/> Sign out</button>
        </div>
        {notice && <p role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</p>}
        {error && <p role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p>}
        <div className="grid gap-6 lg:grid-cols-[.85fr_1.15fr]">
          <section className="h-fit rounded-2xl border border-[#eee8f4] bg-white p-5 shadow-[0_8px_30px_rgba(42,24,68,.04)] sm:p-6">
            <div className="mb-5 flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-700"><UserRound size={19}/></span><div><h2 className="font-bold text-[#302344]">Personal information</h2><p className="text-xs text-[#958ba2]">Your customer profile</p></div></div>
            <form onSubmit={saveProfile} className="space-y-4">
              <div><label className={labelClass}>Full name</label><input className={fieldClass} value={profileForm.name} onChange={e => setProfileForm(v => ({ ...v, name: e.target.value }))} placeholder="Your name" minLength={2} maxLength={100}/></div>
              <div><label className={labelClass}>Email address</label><input type="email" className={fieldClass} value={profileForm.email} onChange={e => setProfileForm(v => ({ ...v, email: e.target.value }))} placeholder="you@example.com"/></div>
              <div><label className={labelClass}>Verified mobile number</label><input className={fieldClass + " bg-[#faf9fc] text-[#8c8298]"} value={profile.phone ?? ""} readOnly/><p className="mt-1 text-[11px] text-[#958ba2]">Change of mobile number requires a separate verification flow.</p></div>
              <button disabled={savingProfile} className="w-full rounded-xl bg-brand-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-brand-700 disabled:opacity-60">{savingProfile ? "Saving…" : "Save profile"}</button>
            </form>
          </section>
          <section className="rounded-2xl border border-[#eee8f4] bg-white p-5 shadow-[0_8px_30px_rgba(42,24,68,.04)] sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-700"><MapPin size={19}/></span><div><h2 className="font-bold text-[#302344]">Delivery addresses</h2><p className="text-xs text-[#958ba2]">Bangladesh address book</p></div></div><button onClick={() => setShowAddressForm(v => !v)} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-brand-50 px-3 py-2 text-xs font-bold text-brand-700 hover:bg-brand-100"><Plus size={15}/> Add address</button></div>
            {showAddressForm && <form onSubmit={saveAddress} className="mb-5 rounded-xl border border-[#eee8f4] bg-[#fcfbfe] p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                {([["label","Address label"],["recipientName","Recipient name"],["phone","Mobile number"],["division","Division"],["district","District"],["upazila","Upazila"],["area","Area / locality"],["postalCode","Postcode"]] as const).map(([key,title]) => <div key={key}><label className={labelClass}>{title}</label><input className={fieldClass} required={key !== "postalCode"} type={key === "phone" ? "tel" : "text"} value={addressForm[key]} onChange={e => setAddressForm(v => ({ ...v, [key]: e.target.value }))} maxLength={key === "addressLine" ? 500 : 120}/></div>)}
                <div className="sm:col-span-2"><label className={labelClass}>House, road and full address</label><textarea className={fieldClass} rows={2} required minLength={5} maxLength={500} value={addressForm.addressLine} onChange={e => setAddressForm(v => ({ ...v, addressLine: e.target.value }))}/></div>
              </div>
              <label className="mt-3 flex items-center gap-2 text-xs font-medium text-[#6f647e]"><input type="checkbox" checked={addressForm.isDefault} onChange={e => setAddressForm(v => ({ ...v, isDefault: e.target.checked }))}/> Make this my default address</label>
              <div className="mt-4 flex gap-2"><button disabled={savingAddress} className="rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-60">{savingAddress ? "Saving…" : "Save address"}</button><button type="button" onClick={() => setShowAddressForm(false)} className="rounded-xl border border-[#e9e3f2] px-4 py-2.5 text-xs font-semibold text-[#6f647e]">Cancel</button></div>
            </form>}
            <div className="space-y-3">
              {addresses.length === 0 && !showAddressForm && <div className="rounded-xl border border-dashed border-[#e3dbea] px-4 py-8 text-center"><MapPin className="mx-auto text-[#b2a8bf]" size={22}/><p className="mt-2 text-sm font-semibold text-[#625573]">No saved addresses yet</p><p className="mt-1 text-xs text-[#958ba2]">Add an address to make checkout faster.</p></div>}
              {addresses.map(address => <article key={address.id} className="rounded-xl border border-[#eee8f4] p-4">
                <div className="flex items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><span className="text-sm font-bold text-[#302344]">{address.label}</span>{address.isDefault && <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700">Default</span>}</div><p className="mt-1 text-xs font-semibold text-[#665a76]">{address.recipientName} · {address.phone}</p><p className="mt-1 text-xs leading-5 text-[#82788f]">{address.addressLine}, {address.area}, {address.upazila}, {address.district}, {address.division}{address.postalCode ? ` - ${address.postalCode}` : ""}</p></div><button onClick={() => void deleteAddress(address.id)} aria-label="Delete address" className="rounded-lg p-2 text-[#9b8fa8] hover:bg-rose-50 hover:text-rose-600"><Trash2 size={16}/></button></div>
              </article>)}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
