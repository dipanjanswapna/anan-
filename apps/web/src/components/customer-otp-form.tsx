"use client";

import { FormEvent, useState } from "react";
import { ArrowLeft, LoaderCircle, ShieldCheck } from "lucide-react";
import Link from "next/link";

type Step = "phone" | "code";

export function CustomerOtpForm() {
  const [phone, setPhone] = useState("+880");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<Step>("phone");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const action = step === "phone" ? "request" : "verify";
      const response = await fetch(`/api/auth/otp/${action}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(step === "phone"
          ? { phone, purpose: "CUSTOMER_LOGIN" }
          : { phone, code, purpose: "CUSTOMER_LOGIN" }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Something went wrong.");
      if (step === "phone") {
        setStep("code");
        setNotice(result.message || "If this number can receive messages, a code has been sent.");
      } else {
        setNotice("Phone number verified. Account sign-in is not enabled yet.");
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to continue. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-3xl border border-[#eee8f5] bg-white p-6 shadow-[0_18px_60px_rgba(47,25,75,.07)] sm:p-8">
      <Link href="/" className="inline-flex items-center gap-2 text-xs font-semibold text-brand-700"><ArrowLeft size={15}/> Back to ANAN</Link>
      <div className="mt-7 grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-700"><ShieldCheck size={23}/></div>
      <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-[#281743]">Welcome to ANAN</h1>
      <p className="mt-2 text-sm leading-6 text-[#81758e]">Verify your Bangladesh mobile number to continue.</p>
      <form onSubmit={submit} className="mt-7 space-y-4">
        {step === "phone" ? (
          <label className="block text-sm font-semibold text-[#443456]">Mobile number
            <input required type="tel" autoComplete="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+8801XXXXXXXXX" className="mt-2 h-12 w-full rounded-xl border border-[#e8e2f0] px-4 text-sm outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"/>
          </label>
        ) : (
          <>
            <p className="text-xs text-[#81758e]">Enter the 6-digit code sent to <strong className="text-[#443456]">{phone}</strong>.</p>
            <label className="block text-sm font-semibold text-[#443456]">Verification code
              <input required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" className="mt-2 h-12 w-full rounded-xl border border-[#e8e2f0] px-4 text-center text-lg tracking-[.4em] outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"/>
            </label>
          </>
        )}
        {error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
        {notice && <p role="status" className="rounded-xl bg-brand-50 px-3 py-2 text-xs leading-5 text-brand-800">{notice}</p>}
        <button disabled={busy} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 text-sm font-bold text-white transition hover:bg-brand-700 disabled:opacity-60">
          {busy && <LoaderCircle size={17} className="animate-spin"/>}
          {busy ? "Please wait..." : step === "phone" ? "Send verification code" : "Verify code"}
        </button>
        {step === "code" && <button type="button" onClick={() => { setStep("phone"); setCode(""); setNotice(""); setError(""); }} className="w-full text-xs font-semibold text-brand-700">Change mobile number</button>}
      </form>
      <p className="mt-6 text-[11px] leading-5 text-[#9a90a5]">A verification code expires after 5 minutes. Up to 3 codes can be requested per 15 minutes, with a 60-second resend wait.</p>
    </div>
  );
}
