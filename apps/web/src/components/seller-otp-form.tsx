"use client";

import { FormEvent, useState } from "react";
import { LoaderCircle, ShieldCheck } from "lucide-react";
import Link from "next/link";

type Step = "phone" | "code";

export function SellerOtpForm() {
  const [phone, setPhone] = useState("+880");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<Step>("phone");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(""); setNotice("");
    try {
      const action = step === "phone" ? "request" : "verify";
      const response = await fetch(`/api/auth/otp/${action}`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify(step === "phone"
          ? { phone, purpose: "SELLER_PHONE_VERIFICATION" }
          : { phone, code, purpose: "SELLER_PHONE_VERIFICATION" }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Unable to continue.");
      if (step === "phone") {
        setStep("code");
        setNotice("If this number belongs to an approved seller account, a code has been sent.");
      } else {
        window.location.assign("/seller/dashboard");
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to continue. Please try again.");
    } finally { setBusy(false); }
  }

  return <div className="w-full max-w-md rounded-3xl border border-[#eee8f5] bg-white p-6 shadow-[0_18px_60px_rgba(47,25,75,.07)] sm:p-8">
    <Link href="/sell" className="text-xs font-semibold text-brand-700">← Back to seller programme</Link>
    <div className="mt-7 grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-700"><ShieldCheck size={23}/></div>
    <h1 className="mt-5 text-2xl font-extrabold text-[#281743]">Seller sign in</h1>
    <p className="mt-2 text-sm leading-6 text-[#81758e]">Use the verified mobile number on your approved seller account.</p>
    <form onSubmit={submit} className="mt-7 space-y-4">
      {step === "phone" ? <label className="block text-sm font-semibold text-[#443456]">Seller mobile number
        <input required type="tel" autoComplete="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+8801XXXXXXXXX" className="mt-2 h-12 w-full rounded-xl border border-[#e8e2f0] px-4 text-sm outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"/>
      </label> : <>
        <p className="text-xs text-[#81758e]">Enter the 6-digit code sent to <strong>{phone}</strong>.</p>
        <label className="block text-sm font-semibold text-[#443456]">Verification code
          <input required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,"").slice(0,6))} placeholder="000000" className="mt-2 h-12 w-full rounded-xl border border-[#e8e2f0] px-4 text-center text-lg tracking-[.4em] outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"/>
        </label>
      </>}
      {error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
      {notice && <p role="status" className="rounded-xl bg-brand-50 px-3 py-2 text-xs text-brand-800">{notice}</p>}
      <button disabled={busy} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 text-sm font-bold text-white disabled:opacity-60">
        {busy && <LoaderCircle size={17} className="animate-spin"/>}{busy ? "Please wait..." : step === "phone" ? "Send seller login code" : "Verify and sign in"}
      </button>
      {step === "code" && <button type="button" onClick={()=>{setStep("phone");setCode("");setNotice("");setError("");}} className="w-full text-xs font-semibold text-brand-700">Change mobile number</button>}
    </form>
    <p className="mt-6 text-[11px] leading-5 text-[#9a90a5]">Only active, Admin-approved seller accounts can sign in. Seller OTP delivery must be configured by ANAN.</p>
  </div>;
}
