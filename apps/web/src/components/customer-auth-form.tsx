"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, LoaderCircle, LockKeyhole, MessageSquareText, RefreshCw, ShieldCheck } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

type Mode = "signin" | "signup" | "admin";
type Step = "details" | "code";

const normalizePhone = (value: string) => {
  const digits = value.replace(/[^\d+]/g, "");
  if (digits.startsWith("+880")) return digits;
  if (digits.startsWith("880")) return `+${digits}`;
  if (digits.startsWith("01")) return `+88${digits}`;
  if (digits.startsWith("1")) return `+880${digits}`;
  return digits;
};
const isValidPhone = (value: string) => /^\+8801[3-9]\d{8}$/.test(value);
const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);

const fieldClass =
  "h-12 w-full rounded-xl border border-[#e6dff0] bg-white px-4 text-sm text-[#302344] outline-none transition placeholder:text-[#b2a8bf] focus:border-brand-400 focus:ring-4 focus:ring-brand-100";
const labelClass = "mb-1.5 block text-[11.5px] font-bold text-[#5e526d]";

export function CustomerAuthForm({ mode, nextPath = "/account" }: { mode: Mode; nextPath?: string }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("details");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [resendIn, setResendIn] = useState(0);
  const [fieldErrors, setFieldErrors] = useState<{ phone?: string; name?: string; email?: string; terms?: string; code?: string }>({});

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = window.setInterval(() => setResendIn((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [resendIn]);

  const purpose = mode === "signup" ? "CUSTOMER_SIGNUP" : mode === "admin" ? "ADMIN_LOGIN" : "CUSTOMER_LOGIN";

  function validateDetails() {
    const errors: typeof fieldErrors = {};
    const normalized = normalizePhone(phone);
    if (!isValidPhone(normalized)) errors.phone = "Enter a valid Bangladeshi mobile number, for example 01712345678.";
    if (mode === "signup") {
      if (name.trim().length < 2) errors.name = "Tell us your name (at least 2 characters).";
      if (!isValidEmail(email.trim())) errors.email = "Enter a valid email address so we can reach you.";
      if (!accepted) errors.terms = "Please accept the terms and privacy notice to create an account.";
    }
    setFieldErrors(errors);
    return { errors, normalized };
  }

  async function requestCode(targetPhone = normalizePhone(phone)) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/auth/otp/request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone: targetPhone, purpose }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "We could not send a verification code.");
      setPhone(targetPhone);
      setStep("code");
      setResendIn(60);
      setNotice(data.message || "If this number can receive messages, a code is on its way.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We could not send a verification code.");
    } finally {
      setBusy(false);
    }
  }

  async function submitDetails(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const { errors, normalized } = validateDetails();
    if (Object.keys(errors).length) return;
    await requestCode(normalized);
  }

  async function submitCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      setFieldErrors({ code: "Enter the 6-digit code from your SMS." });
      return;
    }
    setFieldErrors({});
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone: normalizePhone(phone), purpose, code }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "That code could not be verified.");

      if (mode === "signup") {
        const profile = await fetch("/api/account/me", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ name: name.trim(), email: email.trim() }),
        });
        if (!profile.ok) {
          const payload = await profile.json().catch(() => ({}));
          setError(payload.message || "Your number is verified but we could not save your profile. Update it from your account.");
          setNotice("Your mobile number is verified. You can finish your profile in your account.");
          setBusy(false);
          return;
        }
      }

      setNotice(mode === "admin" ? "Verified. Opening the admin console…" : "You are signed in. Taking you to your account…");
      router.push(nextPath);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "That code could not be verified.");
      setBusy(false);
    }
  }

  return (
    <div className="rounded-[24px] border border-[#eee7f6] bg-white p-5 shadow-[0_20px_60px_-30px_rgba(47,25,75,.35)] sm:p-7">
      <div className="flex items-center gap-2" aria-hidden>
        <span className={`grid h-7 w-7 place-items-center rounded-full text-[11px] font-extrabold ${step === "details" ? "bg-brand-600 text-white" : "bg-[#f0e9fb] text-brand-700"}`}>
          {step === "code" ? <Check size={13} /> : "1"}
        </span>
        <span className={`h-px flex-1 ${step === "code" ? "bg-brand-300" : "bg-[#eee7f6]"}`} />
        <span className={`grid h-7 w-7 place-items-center rounded-full text-[11px] font-extrabold ${step === "code" ? "bg-brand-600 text-white" : "bg-[#f5f1fa] text-[#b2a8bf]"}`}>2</span>
      </div>
      <p className="mt-2 text-[10px] font-bold uppercase tracking-[.14em] text-[#a096ad]">
        {step === "details" ? "Mobile verification" : "Enter your code"}
      </p>

      {step === "details" ? (
        <form onSubmit={submitDetails} className="mt-4 space-y-3.5" noValidate>
          {mode === "signup" ? (
            <>
              <div>
                <label className={labelClass} htmlFor="auth-name">Full name</label>
                <input
                  id="auth-name"
                  className={fieldClass}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  autoComplete="name"
                  placeholder="e.g. Ayesha Rahman"
                  aria-invalid={Boolean(fieldErrors.name)}
                  aria-describedby={fieldErrors.name ? "auth-name-error" : undefined}
                  maxLength={100}
                />
                {fieldErrors.name ? <p id="auth-name-error" className="mt-1.5 text-[11px] font-semibold text-rose-600">{fieldErrors.name}</p> : null}
              </div>
              <div>
                <label className={labelClass} htmlFor="auth-email">Email address</label>
                <input
                  id="auth-email"
                  type="email"
                  className={fieldClass}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  placeholder="you@example.com"
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby={fieldErrors.email ? "auth-email-error" : undefined}
                  maxLength={160}
                />
                {fieldErrors.email ? <p id="auth-email-error" className="mt-1.5 text-[11px] font-semibold text-rose-600">{fieldErrors.email}</p> : null}
              </div>
            </>
          ) : null}

          <div>
            <label className={labelClass} htmlFor="auth-phone">Mobile number</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[12px] font-bold text-[#8f849e]">BD</span>
              <input
                id="auth-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                className={`${fieldClass} pl-12`}
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="01712345678"
                aria-invalid={Boolean(fieldErrors.phone)}
                aria-describedby={fieldErrors.phone ? "auth-phone-error" : "auth-phone-hint"}
                maxLength={20}
              />
            </div>
            {fieldErrors.phone ? (
              <p id="auth-phone-error" className="mt-1.5 text-[11px] font-semibold text-rose-600">{fieldErrors.phone}</p>
            ) : (
              <p id="auth-phone-hint" className="mt-1.5 text-[10.5px] text-[#a096ad]">
                Bangladeshi numbers only. We will text a 6-digit code — no password needed.
              </p>
            )}
          </div>

          {mode === "signup" ? (
            <div>
              <label className="flex items-start gap-2.5 text-[11px] leading-5 text-[#6f6380]">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={(event) => setAccepted(event.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-[#d9d1e5] text-brand-600"
                  aria-invalid={Boolean(fieldErrors.terms)}
                />
                <span>
                  I agree to ANAN’s{" "}
                  <Link href="/help#privacy" className="font-bold text-brand-700 underline decoration-[#ddd0f0] underline-offset-2">terms and privacy notice</Link>{" "}
                  and to receive my verification code by SMS.
                </span>
              </label>
              {fieldErrors.terms ? <p className="mt-1.5 text-[11px] font-semibold text-rose-600">{fieldErrors.terms}</p> : null}
            </div>
          ) : null}

          {error ? (
            <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-[11.5px] leading-5 text-rose-700">{error}</p>
          ) : null}
          {notice ? (
            <p role="status" className="rounded-xl border border-brand-200 bg-brand-50 px-3.5 py-2.5 text-[11.5px] leading-5 text-brand-800">{notice}</p>
          ) : null}

          <button
            type="submit"
            disabled={busy}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 text-[13px] font-extrabold text-white shadow-[0_12px_26px_-14px_rgba(116,52,223,.85)] transition hover:bg-brand-700 disabled:opacity-60"
          >
            {busy ? <LoaderCircle size={16} className="animate-spin" aria-hidden /> : <MessageSquareText size={16} aria-hidden />}
            {busy ? "Sending code…" : "Send verification code"}
          </button>

          <p className="pt-1 text-center text-[11.5px] text-[#8b7f9b]">
            {mode === "signin" ? (
              <>New to ANAN? <Link href="/signup" className="font-bold text-brand-700 hover:underline">Create an account</Link></>
            ) : mode === "signup" ? (
              <>Already have an account? <Link href="/login" className="font-bold text-brand-700 hover:underline">Sign in</Link></>
            ) : (
              <>Approved seller? <Link href="/seller/login" className="font-bold text-brand-700 hover:underline">Seller sign in</Link></>
            )}
          </p>
        </form>
      ) : (
        <form onSubmit={submitCode} className="mt-4 space-y-3.5" noValidate>
          <div className="rounded-xl bg-[#faf7ff] px-3.5 py-3 text-[11.5px] leading-5 text-[#6f6380]">
            Code sent to <strong className="font-extrabold text-[#302344]">{phone}</strong>.
          </div>
          <div>
            <label className={labelClass} htmlFor="auth-code">6-digit verification code</label>
            <input
              id="auth-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
              maxLength={6}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              aria-invalid={Boolean(fieldErrors.code)}
              aria-describedby={fieldErrors.code ? "auth-code-error" : undefined}
              className="h-13 w-full rounded-xl border border-[#e6dff0] bg-white px-4 py-3.5 text-center text-xl font-extrabold tracking-[.5em] text-[#302344] outline-none transition placeholder:text-[#d5cddf] focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
            />
            {fieldErrors.code ? <p id="auth-code-error" className="mt-1.5 text-[11px] font-semibold text-rose-600">{fieldErrors.code}</p> : null}
          </div>

          {error ? (
            <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-[11.5px] leading-5 text-rose-700">{error}</p>
          ) : null}
          {notice ? (
            <p role="status" className="rounded-xl border border-brand-200 bg-brand-50 px-3.5 py-2.5 text-[11.5px] leading-5 text-brand-800">{notice}</p>
          ) : null}

          <button
            type="submit"
            disabled={busy}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 text-[13px] font-extrabold text-white shadow-[0_12px_26px_-14px_rgba(116,52,223,.85)] transition hover:bg-brand-700 disabled:opacity-60"
          >
            {busy ? <LoaderCircle size={16} className="animate-spin" aria-hidden /> : <LockKeyhole size={16} aria-hidden />}
            {busy ? "Verifying…" : mode === "signup" ? "Verify & create account" : mode === "admin" ? "Verify & open admin console" : "Verify & sign in"}
          </button>

          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setStep("details");
                setCode("");
                setError("");
                setNotice("");
              }}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#6f6380] hover:text-brand-700"
            >
              <ArrowLeft size={13} aria-hidden /> Change number
            </button>
            <button
              type="button"
              disabled={resendIn > 0 || busy}
              onClick={() => void requestCode()}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-700 disabled:text-[#b2a8bf]"
            >
              <RefreshCw size={12} aria-hidden />
              {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend code"}
            </button>
          </div>
        </form>
      )}

      <p className="mt-5 flex items-start gap-2 border-t border-[#f3eff8] pt-4 text-[10px] leading-4 text-[#a096ad]">
        <ShieldCheck size={13} className="mt-px shrink-0 text-brand-500" aria-hidden />
        Codes expire after 5 minutes. Requests are rate-limited to protect your number.
      </p>
    </div>
  );
}
