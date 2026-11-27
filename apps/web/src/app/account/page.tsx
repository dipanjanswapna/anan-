"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, LogOut, ShieldCheck, UserRound } from "lucide-react";
import { SiteHeader } from "@/components/site-header";

type Profile = { id: string; displayName: string | null; email: string | null; phone: string | null; role: string; emailVerifiedAt: string | null; phoneVerifiedAt: string | null; createdAt: string };
const apiUrl = (process.env.NEXT_PUBLIC_ANAN_API_URL ?? "http://localhost:4000/api/v1").replace(/\/$/, "");

export default function AccountPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      let token = sessionStorage.getItem("anan_access_token");
      if (!token) {
        try {
          const refreshed = await fetch(`${apiUrl}/auth/refresh`, { method: "POST", credentials: "include" });
          if (refreshed.ok) {
            const data = await refreshed.json() as { accessToken: string };
            token = data.accessToken;
            sessionStorage.setItem("anan_access_token", token);
          }
        } catch { /* handled below */ }
      }
      if (!token) { router.replace("/login"); return; }
      let response = await fetch(`${apiUrl}/auth/me`, { headers: { Authorization: `Bearer ${token}` }, credentials: "include" });
      if (response.status === 401) {
        const refreshed = await fetch(`${apiUrl}/auth/refresh`, { method: "POST", credentials: "include" });
        if (refreshed.ok) {
          const data = await refreshed.json() as { accessToken: string };
          token = data.accessToken;
          sessionStorage.setItem("anan_access_token", token);
          response = await fetch(`${apiUrl}/auth/me`, { headers: { Authorization: `Bearer ${token}` }, credentials: "include" });
        }
      }
      if (!response.ok) {
        sessionStorage.removeItem("anan_access_token");
        if (active) { setError("Your session has expired. Please sign in again."); setLoading(false); }
        return;
      }
      const data = await response.json() as Profile;
      if (active) { setProfile(data); setLoading(false); }
    }
    void load().catch(() => { if (active) { setError("Could not load your account."); setLoading(false); } });
    return () => { active = false; };
  }, [router]);

  async function logout() {
    await fetch(`${apiUrl}/auth/logout`, { method: "POST", credentials: "include" }).catch(() => undefined);
    sessionStorage.removeItem("anan_access_token");
    router.replace("/login");
  }

  return <><SiteHeader/><main className="min-h-[70vh] bg-[#faf8fd] px-4 py-10"><div className="mx-auto max-w-3xl">
    <p className="text-[10px] font-bold uppercase tracking-[.2em] text-brand-600">Your ANAN space</p><h1 className="mt-2 text-3xl font-extrabold text-[#281844]">My account</h1>
    {loading ? <div className="mt-10 flex items-center gap-3 text-sm text-[#82778f]"><LoaderCircle className="animate-spin" size={18}/> Loading your account...</div> : profile ? <div className="mt-7 rounded-3xl border border-[#eee8f5] bg-white p-6 shadow-soft sm:p-8">
      <div className="flex items-center justify-between gap-4"><div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-600"><UserRound size={23}/></span><div><h2 className="font-extrabold text-[#302344]">{profile.displayName || "ANAN customer"}</h2><p className="mt-1 text-xs text-[#958ba2]">Customer account</p></div></div><button onClick={logout} className="inline-flex items-center gap-2 rounded-xl border border-[#eee8f5] px-3 py-2 text-xs font-bold text-[#71677e] hover:bg-[#faf8fd]"><LogOut size={15}/> Sign out</button></div>
      <div className="my-6 h-px bg-[#f0edf4]"/><dl className="grid gap-5 sm:grid-cols-2"><div><dt className="text-[10px] font-bold uppercase tracking-wider text-[#a097ad]">Email</dt><dd className="mt-1 text-sm font-semibold text-[#49375f]">{profile.email || "Not added"}</dd><p className="mt-1 text-[10px] text-[#9b91a8]">{profile.emailVerifiedAt ? "Verified" : "Not verified"}</p></div><div><dt className="text-[10px] font-bold uppercase tracking-wider text-[#a097ad]">Mobile</dt><dd className="mt-1 text-sm font-semibold text-[#49375f]">{profile.phone || "Not added"}</dd><p className="mt-1 text-[10px] text-[#9b91a8]">{profile.phoneVerifiedAt ? "Verified" : "Not verified"}</p></div><div><dt className="text-[10px] font-bold uppercase tracking-wider text-[#a097ad]">Account role</dt><dd className="mt-1 text-sm font-semibold text-[#49375f]">{profile.role}</dd></div><div><dt className="text-[10px] font-bold uppercase tracking-wider text-[#a097ad]">Member since</dt><dd className="mt-1 text-sm font-semibold text-[#49375f]">{new Date(profile.createdAt).toLocaleDateString("en-BD", { year: "numeric", month: "long", day: "numeric" })}</dd></div></dl>
      <div className="mt-7 flex items-center gap-2 rounded-xl bg-[#f8f5fc] p-4 text-xs leading-5 text-[#7b6d8e]"><ShieldCheck size={17} className="shrink-0 text-brand-600"/> Your refresh session is stored in a secure HTTP-only cookie. Email/mobile verification and profile editing will be added in the next authentication increment.</div>
    </div> : <div className="mt-7 rounded-2xl border border-rose-100 bg-white p-6"><p className="text-sm text-rose-700">{error}</p><Link href="/login" className="mt-4 inline-block text-sm font-bold text-brand-700">Return to sign in →</Link></div>}
  </div></main></>;
}
