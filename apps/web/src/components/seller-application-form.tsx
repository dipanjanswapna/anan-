"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, LoaderCircle } from "lucide-react";

type FormState = {
  contactName: string;
  email: string;
  phone: string;
  storeName: string;
  businessType: string;
  message: string;
};

const initialForm: FormState = {
  contactName: "",
  email: "",
  phone: "",
  storeName: "",
  businessType: "",
  message: "",
};

const fieldClass = "mt-2 h-12 w-full rounded-xl border border-[#e8e2f0] bg-white px-4 text-sm text-[#302344] outline-none transition placeholder:text-[#aaa1b5] focus:border-brand-400 focus:ring-4 focus:ring-brand-100";

export function SellerApplicationForm() {
  const [form, setForm] = useState(initialForm);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(current => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch("/api/seller-applications", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await response.json();
      if (!response.ok) {
        const message = Array.isArray(result.message) ? result.message.join(" ") : result.message;
        throw new Error(message || "We couldn't submit your application.");
      }
      setSuccess("Application received! ANAN's seller team will review your details. Your store is not active until verification and approval are complete.");
      setForm(initialForm);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (success) {
    return (
      <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-900">
        <CheckCircle2 size={28} className="mb-3"/>
        <h2 className="text-lg font-bold">Thank you for applying!</h2>
        <p className="mt-2 text-sm leading-6">{success}</p>
        <button type="button" onClick={() => setSuccess("")} className="mt-5 text-sm font-bold underline">Submit another application</button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block text-sm font-semibold text-[#443456]">Contact person
          <input required minLength={2} maxLength={100} autoComplete="name" value={form.contactName} onChange={e => update("contactName", e.target.value)} className={fieldClass} placeholder="Your full name"/>
        </label>
        <label className="block text-sm font-semibold text-[#443456]">Store name
          <input required minLength={2} maxLength={120} value={form.storeName} onChange={e => update("storeName", e.target.value)} className={fieldClass} placeholder="Your shop or brand name"/>
        </label>
        <label className="block text-sm font-semibold text-[#443456]">Email address
          <input required type="email" maxLength={254} autoComplete="email" value={form.email} onChange={e => update("email", e.target.value)} className={fieldClass} placeholder="you@example.com"/>
        </label>
        <label className="block text-sm font-semibold text-[#443456]">Bangladesh mobile number
          <input required type="tel" autoComplete="tel" value={form.phone} onChange={e => update("phone", e.target.value)} className={fieldClass} placeholder="+8801XXXXXXXXX"/>
        </label>
        <label className="block text-sm font-semibold text-[#443456] sm:col-span-2">What do you plan to sell?
          <select required value={form.businessType} onChange={e => update("businessType", e.target.value)} className={fieldClass}>
            <option value="">Choose a business category</option>
            <option>Electronics & Gadgets</option>
            <option>Fashion & Clothing</option>
            <option>Beauty & Cosmetics</option>
            <option>Home & Kitchen</option>
            <option>Grocery & Food</option>
            <option>Books & Stationery</option>
            <option>Other</option>
          </select>
        </label>
        <label className="block text-sm font-semibold text-[#443456] sm:col-span-2">Tell us about your business <span className="font-normal text-[#9b91a8]">(optional)</span>
          <textarea rows={4} maxLength={1000} value={form.message} onChange={e => update("message", e.target.value)} className="mt-2 w-full rounded-xl border border-[#e8e2f0] bg-white px-4 py-3 text-sm outline-none transition placeholder:text-[#aaa1b5] focus:border-brand-400 focus:ring-4 focus:ring-brand-100" placeholder="Products, experience, service areas..."/>
        </label>
      </div>
      {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      <p className="text-xs leading-5 text-[#8d829c]">Submitting this form is an application only. ANAN will contact you for identity and business verification. You cannot list products or receive orders until your seller account is verified and approved.</p>
      <button type="submit" disabled={busy} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 text-sm font-bold text-white shadow-[0_9px_22px_rgba(116,52,223,.2)] transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto">
        {busy && <LoaderCircle size={17} className="animate-spin"/>}
        {busy ? "Submitting..." : "Submit seller application"}
      </button>
    </form>
  );
}
