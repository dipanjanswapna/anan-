"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, LoaderCircle, ShieldCheck } from "lucide-react";

type AuthMode = "login" | "register";
const apiUrl = (process.env.NEXT_PUBLIC_ANAN_API_URL ?? "http://localhost:4000/api/v1").replace(/\/$/, "");

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const isRegister = mode === "register";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (isRegister && !email.trim() && !phone.trim()) {
      setError("Enter an email address or mobile number.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(isRegister
          ? { displayName, email: email || undefined, phone: phone || undefined, password }
          : { identifier, password }),
      });
      const data = await response.json() as { accessToken?: string; message?: string | string[] };
      if (!response.ok || !data.accessToken) {
        setError(Array.isArray(data.message) ? data.message[0] : data.message || "Something went wrong. Please try again.");
        return;
      }
      sessionStorage.setItem("anan_access_token", data.accessToken);
      router.push("/account");
      router.refresh();
    } catch {
      setError("Could not connect to ANAN. Check that the local API server is running.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-80px)] bg-[#faf8fd] px-4 py-10 sm:py-16">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-[28px] border border-[#eee8f5] bg-white shadow-[0_24px_70px_rgba(47,26,77,.08)] lg:grid-cols-[.9fr_1.1fr]">
        <aside className="relative hidden overflow-hidden bg-[#281844] p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute -right-24 -top-20 h-80 w-80 rounded-full border border-white/10"/>
          <div className="absolute -bottom-28 -left-20 h-80 w-80 rounded-full bg-[#7946bd]/25 blur-2xl"/>
          <Link href="/" className="relative inline-flex items-center gap-2"><span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-xl font-black text-brand-700">a</span><span className="text-2xl font-extrabold tracking-tight">anan.</span></Link>
          <div className="relative py-12"><p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#c7a9ff]">A happier way to shop</p><h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight">{isRegister ? "Make room for lovely discoveries." : "Welcome back to your happy place."}</h1><p className="mt-4 max-w-sm text-sm leading-7 text-white/65">Find thoughtful picks, trusted sellers and the little things that make every day better.</p></div>
          <div className="relative flex items-center gap-2 text-xs text-white/60"><ShieldCheck size={16}/> Your account is protected with secure sign-in.</div>
        </aside>
        <section className="p-6 sm:p-10 lg:p-12">
          <Link href="/" className="inline-flex items-center gap-2 text-xl font-extrabold tracking-tight text-[#281844] lg:hidden"><span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white">a</span> anan.</Link>
          <div className="mt-8 lg:mt-2"><p className="text-[10px] font-bold uppercase tracking-[.2em] text-brand-600">{isRegister ? "Join the ANAN community" : "Your ANAN account"}</p><h2 className="mt-2 text-3xl font-extrabold tracking-tight text-[#281844]">{isRegister ? "Create your account" : "Sign in"}</h2><p className="mt-2 text-sm text-[#91869f]">{isRegister ? "A few details and you're ready to discover." : "Enter your details to continue shopping."}</p></div>
          <form onSubmit={submit} className="mt-8 space-y-4">
            {isRegister ? <>
              <label className="block"><span className="mb-2 block text-xs font-bold text-[#554767]">Full name</span><input required minLength={2} maxLength={80} autoComplete="name" value={displayName} onChange={e=>setDisplayName(e.target.value)} className="h-12 w-full rounded-xl border border-[#e9e3f0] bg-[#fdfcff] px-4 text-sm outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-50" placeholder="Your name"/></label>
              <label className="block"><span className="mb-2 block text-xs font-bold text-[#554767]">Email address <span className="font-normal text-[#a49aad]">(optional if mobile provided)</span></span><input type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} className="h-12 w-full rounded-xl border border-[#e9e3f0] bg-[#fdfcff] px-4 text-sm outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-50" placeholder="you@example.com"/></label>
              <label className="block"><span className="mb-2 block text-xs font-bold text-[#554767]">Mobile number <span className="font-normal text-[#a49aad]">(optional if email provided)</span></span><input type="tel" autoComplete="tel" value={phone} onChange={e=>setPhone(e.target.value)} className="h-12 w-full rounded-xl border border-[#e9e3f0] bg-[#fdfcff] px-4 text-sm outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-50" placeholder="+8801XXXXXXXXX"/></label>
            </> : <label className="block"><span className="mb-2 block text-xs font-bold text-[#554767]">Email or mobile number</span><input required autoComplete="username" value={identifier} onChange={e=>setIdentifier(e.target.value)} className="h-12 w-full rounded-xl border border-[#e9e3f0] bg-[#fdfcff] px-4 text-sm outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-50" placeholder="Email or +8801XXXXXXXXX"/></label>}
            <label className="block"><span className="mb-2 block text-xs font-bold text-[#554767]">Password</span><span className="relative block"><input required minLength={isRegister ? 10 : 1} maxLength={72} type={showPassword ? "text" : "password"} autoComplete={isRegister ? "new-password" : "current-password"} value={password} onChange={e=>setPassword(e.target.value)} className="h-12 w-full rounded-xl border border-[#e9e3f0] bg-[#fdfcff] px-4 pr-12 text-sm outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-50" placeholder={isRegister ? "At least 10 characters" : "Your password"}/><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={()=>setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-[#9b90a8] hover:bg-[#f3eff8]">{showPassword ? <EyeOff size={17}/> : <Eye size={17}/>}</button></span></label>
            {error && <p role="alert" className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs leading-5 text-rose-700">{error}</p>}
            <button disabled={loading} type="submit" className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 text-sm font-bold text-white shadow-[0_9px_22px_rgba(116,52,223,.2)] transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60">{loading ? <><LoaderCircle size={17} className="animate-spin"/> Please wait...</> : <>{isRegister ? "Create account" : "Sign in"} <ArrowRight size={16}/></>}</button>
          </form>
          <p className="mt-6 text-center text-xs text-[#8f849e]">{isRegister ? "Already have an account?" : "New to ANAN?"} <Link href={isRegister ? "/login" : "/register"} className="font-bold text-brand-700 hover:underline">{isRegister ? "Sign in" : "Create an account"}</Link></p>
          <p className="mt-7 text-center text-[10px] leading-5 text-[#aaa1b4]">By continuing, you agree to ANAN's Terms of Service and Privacy Policy.</p>
        </section>
      </div>
    </main>
  );
}
