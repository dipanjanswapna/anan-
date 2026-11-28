"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ImageOff,
  LoaderCircle,
  Lock,
  MapPin,
  Plus,
  ShieldCheck,
  Truck,
  Wallet,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { CART_UPDATED_EVENT } from "@/lib/product-actions";
import { formatTaka } from "@/lib/format";

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
type CartItem = {
  id: string;
  quantity: number;
  available: boolean;
  product: {
    id: string;
    nameEn: string;
    slug: string;
    pricePaisa: string;
    image: { url: string | null; altText: string } | null;
    seller: { storeName: string };
  };
};
type Cart = { items: CartItem[]; subtotalPaisa: string; itemCount: number };

const steps = ["Delivery", "Payment", "Review"] as const;
const fieldClass =
  "mt-1 h-11 w-full rounded-lg border border-[#e8e1f0] bg-white px-3 text-[13px] text-[#302344] outline-none transition placeholder:text-[#b2a8bf] focus:border-brand-400 focus:ring-4 focus:ring-brand-100";
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

export function CustomerCheckout() {
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [cart, setCart] = useState<Cart | null>(null);
  const [addressId, setAddressId] = useState("");
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState({ ...emptyAddress });
  const [error, setError] = useState("");
  const [summaryOpen, setSummaryOpen] = useState(false);
  // Stable for the lifetime of this checkout, so a double click or retry cannot create a second order.
  const [idempotencyKey] = useState(() => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `anan-${Date.now()}-${Math.random().toString(36).slice(2)}`));

  useEffect(() => {
    void (async () => {
      try {
        const [addressResponse, cartResponse] = await Promise.all([
          fetch("/api/account/me/addresses", { cache: "no-store" }),
          fetch("/api/account/me/cart", { cache: "no-store" }),
        ]);
        if (addressResponse.status === 401 || cartResponse.status === 401) {
          window.location.assign("/login?next=/checkout");
          return;
        }
        const [addressData, cartData] = await Promise.all([addressResponse.json(), cartResponse.json()]);
        if (!addressResponse.ok || !cartResponse.ok) {
          throw new Error(addressData.message || cartData.message || "Unable to load checkout.");
        }
        const list = (addressData.addresses ?? []) as Address[];
        setAddresses(list);
        setAddressId(list.find((address) => address.isDefault)?.id ?? list[0]?.id ?? "");
        setCart(cartData);
        if (!list.length) setShowAddressForm(true);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Unable to load checkout.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function saveAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingAddress(true);
    setError("");
    try {
      const response = await fetch("/api/account/me/addresses", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...addressForm, postalCode: addressForm.postalCode || undefined }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Unable to save this address.");
      setAddresses((current) => {
        const rest = data.address.isDefault ? current.map((item) => ({ ...item, isDefault: false })) : current;
        return [data.address, ...rest];
      });
      setAddressId(data.address.id);
      setAddressForm({ ...emptyAddress });
      setShowAddressForm(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save this address.");
    } finally {
      setSavingAddress(false);
    }
  }

  async function placeOrder() {
    if (placing) return;
    if (!addressId) {
      setError("Choose a delivery address before placing your order.");
      setStep(0);
      return;
    }
    if (!cart?.items.length) {
      setError("Your cart is empty.");
      return;
    }
    setPlacing(true);
    setError("");
    try {
      const response = await fetch("/api/account/me/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ addressId, idempotencyKey }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.status === 401) {
        window.location.assign("/login?next=/checkout");
        return;
      }
      if (!response.ok) throw new Error(data.message || "Unable to place your order.");
      window.dispatchEvent(new Event(CART_UPDATED_EVENT));
      router.push(`/orders/${data.order.id}?placed=1`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to place your order.");
      setPlacing(false);
    }
  }

  if (loading) {
    return (
      <div className="container-shell max-w-6xl py-10">
        <div className="h-8 w-40 animate-pulse rounded-lg bg-[#efe9f7]" />
        <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_360px]">
          <div className="h-80 animate-pulse rounded-2xl bg-[#f6f2fa]" />
          <div className="h-64 animate-pulse rounded-2xl bg-[#f6f2fa]" />
        </div>
        <p role="status" className="sr-only">Preparing checkout</p>
      </div>
    );
  }

  const selectedAddress = addresses.find((address) => address.id === addressId) ?? null;
  const subtotal = cart?.subtotalPaisa ?? "0";
  const unavailable = cart?.items.some((item) => !item.available) ?? false;

  return (
    <div className="container-shell max-w-6xl py-6 sm:py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/cart" className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#7b6d8c] hover:text-brand-700">
            <ArrowLeft size={13} aria-hidden /> Back to cart
          </Link>
          <h1 className="mt-2 text-[28px] font-extrabold tracking-[-1px] text-[#24143f] sm:text-[34px]">Checkout</h1>
          <p className="mt-1 text-[12.5px] text-[#8b7f9b]">Complete your order in three short steps.</p>
        </div>
        <p className="inline-flex items-center gap-1.5 rounded-full bg-[#f4f0fa] px-3 py-1.5 text-[10px] font-bold text-[#6f6380]">
          <Lock size={12} aria-hidden /> Secure checkout
        </p>
      </div>

      <ol className="mt-6 flex items-center gap-1.5 sm:gap-3" aria-label="Checkout progress">
        {steps.map((label, index) => {
          const active = index === step;
          const done = index < step;
          return (
            <li key={label} className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2.5">
              <span
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-extrabold transition ${
                  active ? "bg-brand-600 text-white" : done ? "bg-[#e8dcff] text-brand-700" : "bg-[#f1edf7] text-[#b2a8bf]"
                }`}
                aria-current={active ? "step" : undefined}
              >
                {done ? <Check size={13} aria-hidden /> : index + 1}
              </span>
              <span className={`hidden truncate text-[11px] font-bold sm:block ${active ? "text-[#302344]" : "text-[#9a90a5]"}`}>{label}</span>
              {index < steps.length - 1 ? <span className={`h-px flex-1 ${done ? "bg-brand-300" : "bg-[#eee7f6]"}`} aria-hidden /> : null}
            </li>
          );
        })}
      </ol>

      {error ? <p role="alert" className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[12px] text-rose-700">{error}</p> : null}

      {!cart?.items.length ? (
        <div className="mt-6 rounded-2xl border border-[#eeeaf3] bg-white px-6 py-14 text-center">
          <p className="text-lg font-extrabold text-[#2c1c44]">Your cart is empty</p>
          <p className="mt-2 text-[12.5px] text-[#8b7f9b]">Add something you love before checking out.</p>
          <Link href="/products" className="mt-5 inline-flex h-11 items-center rounded-full bg-brand-600 px-5 text-xs font-extrabold text-white">
            Browse products
          </Link>
        </div>
      ) : (
        <div className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_350px] lg:gap-7">
          <div className="min-w-0 space-y-4">
            {/* Step 1 — delivery */}
            {step === 0 ? (
              <section className="rounded-2xl border border-[#eeeaf3] bg-white p-4 sm:p-5" aria-labelledby="delivery-heading">
                <div className="flex items-center justify-between gap-2">
                  <h2 id="delivery-heading" className="flex items-center gap-2 text-[14px] font-extrabold text-[#24143f]">
                    <MapPin size={15} className="text-brand-600" aria-hidden /> Delivery address
                  </h2>
                  <button
                    type="button"
                    onClick={() => setShowAddressForm((value) => !value)}
                    className="inline-flex items-center gap-1 text-[10.5px] font-bold text-brand-700"
                  >
                    <Plus size={12} aria-hidden /> {showAddressForm ? "Hide form" : "New address"}
                  </button>
                </div>

                {!addresses.length && !showAddressForm ? (
                  <p className="mt-4 rounded-xl border border-dashed border-[#e3dbea] bg-[#fcfbfe] px-4 py-6 text-center text-[12px] text-[#8b7f9b]">
                    You have no saved address yet. Add one to continue.
                  </p>
                ) : null}

                <div className="mt-3 space-y-2.5">
                  {addresses.map((address) => {
                    const selected = addressId === address.id;
                    return (
                      <label
                        key={address.id}
                        className={`flex cursor-pointer gap-3 rounded-xl border p-3.5 transition ${
                          selected ? "border-brand-400 bg-[#faf7ff] ring-1 ring-brand-200" : "border-[#eeeaf3] hover:border-brand-200"
                        }`}
                      >
                        <input
                          type="radio"
                          name="delivery-address"
                          checked={selected}
                          onChange={() => setAddressId(address.id)}
                          className="mt-1 h-4 w-4 accent-[#7434df]"
                        />
                        <span className="min-w-0 text-[12px]">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="font-extrabold text-[#302344]">{address.label} · {address.recipientName}</span>
                            {address.isDefault ? <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[9px] font-extrabold text-brand-700">DEFAULT</span> : null}
                          </span>
                          <span className="mt-1 block leading-5 text-[#7b6d8c]">
                            {address.addressLine}, {address.area}, {address.upazila}, {address.district}, {address.division}
                            {address.postalCode ? ` - ${address.postalCode}` : ""}
                          </span>
                          <span className="mt-0.5 block text-[11px] font-semibold text-[#9a90a5]">{address.phone}</span>
                        </span>
                      </label>
                    );
                  })}
                </div>

                {showAddressForm ? (
                  <form onSubmit={saveAddress} className="mt-3 rounded-xl border border-[#e9e1f3] bg-[#fcfbfe] p-3.5">
                    <div className="grid grid-cols-2 gap-2.5">
                      {([
                        ["label", "Label", "Home"],
                        ["recipientName", "Recipient", "Full name"],
                        ["phone", "Mobile", "01712345678"],
                        ["division", "Division", "Dhaka"],
                        ["district", "District", "Dhaka"],
                        ["upazila", "Upazila", "Gulshan"],
                        ["area", "Area", "Gulshan 2"],
                        ["postalCode", "Postcode (optional)", "1212"],
                      ] as const).map(([key, title, placeholder]) => (
                        <label key={key} className={labelClass}>
                          {title}
                          <input
                            className={fieldClass}
                            required={key !== "postalCode"}
                            value={addressForm[key]}
                            placeholder={placeholder}
                            autoComplete={key === "phone" ? "tel" : key === "recipientName" ? "name" : "address-line1"}
                            onChange={(event) => setAddressForm((value) => ({ ...value, [key]: event.target.value }))}
                            maxLength={120}
                          />
                        </label>
                      ))}
                      <label className={`${labelClass} col-span-2`}>
                        House, road and full address
                        <textarea
                          className="mt-1 w-full rounded-lg border border-[#e8e1f0] bg-white px-3 py-2 text-[13px] outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
                          rows={2}
                          required
                          minLength={5}
                          maxLength={500}
                          value={addressForm.addressLine}
                          placeholder="House 12, Road 5, Block C"
                          onChange={(event) => setAddressForm((value) => ({ ...value, addressLine: event.target.value }))}
                        />
                      </label>
                    </div>
                    <label className="mt-2.5 flex items-center gap-2 text-[11px] font-medium text-[#6f6380]">
                      <input
                        type="checkbox"
                        checked={addressForm.isDefault}
                        onChange={(event) => setAddressForm((value) => ({ ...value, isDefault: event.target.checked }))}
                        className="h-4 w-4 accent-[#7434df]"
                      />
                      Make this my default address
                    </label>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="submit"
                        disabled={savingAddress}
                        className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-brand-600 px-4 text-[11.5px] font-extrabold text-white disabled:opacity-60"
                      >
                        {savingAddress ? <LoaderCircle size={13} className="animate-spin" aria-hidden /> : <Check size={13} aria-hidden />}
                        {savingAddress ? "Saving…" : "Save address"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddressForm(false);
                          setAddressForm({ ...emptyAddress });
                        }}
                        className="h-10 rounded-lg border border-[#e9e3f2] px-4 text-[11.5px] font-semibold text-[#6f6380]"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : null}

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                  <Link href="/account" className="text-[10.5px] font-bold text-[#8b7f9b] hover:text-brand-700">
                    Manage addresses in your account
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      if (!addressId) {
                        setError("Choose or add a delivery address to continue.");
                        return;
                      }
                      setError("");
                      setStep(1);
                    }}
                    className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand-600 px-5 text-[12px] font-extrabold text-white hover:bg-brand-700"
                  >
                    Continue to payment <ArrowRight size={14} aria-hidden />
                  </button>
                </div>
              </section>
            ) : null}

            {/* Step 2 — payment */}
            {step === 1 ? (
              <section className="rounded-2xl border border-[#eeeaf3] bg-white p-4 sm:p-5" aria-labelledby="payment-heading">
                <h2 id="payment-heading" className="flex items-center gap-2 text-[14px] font-extrabold text-[#24143f]">
                  <Wallet size={15} className="text-brand-600" aria-hidden /> Payment method
                </h2>
                <div className="mt-3 rounded-xl border border-brand-400 bg-[#faf7ff] p-4 ring-1 ring-brand-200">
                  <div className="flex items-start gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-brand-700">
                      <Truck size={16} aria-hidden />
                    </span>
                    <div>
                      <p className="text-[13px] font-extrabold text-[#302344]">Cash on Delivery (COD)</p>
                      <p className="mt-1 text-[11.5px] leading-5 text-[#7b6d8c]">
                        Pay the courier in cash when your order arrives. This is the only payment method enabled on ANAN today.
                      </p>
                    </div>
                  </div>
                </div>
                <p className="mt-3 text-[10.5px] leading-5 text-[#9a90a5]">
                  Card and mobile wallet payments are not available yet, so they are not offered here.
                </p>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                  <button type="button" onClick={() => setStep(0)} className="inline-flex items-center gap-1.5 text-[11.5px] font-bold text-[#7b6d8c] hover:text-brand-700">
                    <ArrowLeft size={13} aria-hidden /> Back to delivery
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand-600 px-5 text-[12px] font-extrabold text-white hover:bg-brand-700"
                  >
                    Review order <ArrowRight size={14} aria-hidden />
                  </button>
                </div>
              </section>
            ) : null}

            {/* Step 3 — review */}
            {step === 2 ? (
              <section className="space-y-4" aria-labelledby="review-heading">
                <div className="rounded-2xl border border-[#eeeaf3] bg-white p-4 sm:p-5">
                  <h2 id="review-heading" className="text-[14px] font-extrabold text-[#24143f]">Review your order</h2>
                  <div className="mt-3 space-y-2.5">
                    {cart.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3">
                        <span className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[#f6f2fa]">
                          {item.product.image?.url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.product.image.url} alt={item.product.image.altText || item.product.nameEn} className="h-full w-full object-cover" />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center text-brand-300"><ImageOff size={14} aria-hidden /></span>
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[12px] font-bold text-[#302344]">{item.product.nameEn}</p>
                          <p className="text-[10.5px] text-[#9a90a5]">Qty {item.quantity} · {item.product.seller.storeName}</p>
                        </div>
                        <p className="shrink-0 text-[12px] font-extrabold text-[#302344]">{formatTaka(BigInt(item.product.pricePaisa) * BigInt(item.quantity))}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 grid gap-2.5 border-t border-[#f2eef7] pt-3 sm:grid-cols-2">
                    <div className="rounded-xl bg-[#faf8fd] p-3">
                      <p className="text-[9.5px] font-bold uppercase tracking-[.1em] text-[#a096ad]">Delivering to</p>
                      <p className="mt-1 text-[11.5px] font-bold text-[#3f2b5c]">{selectedAddress?.recipientName}</p>
                      <p className="mt-0.5 text-[10.5px] leading-4 text-[#7b6d8c]">
                        {selectedAddress?.addressLine}, {selectedAddress?.area}, {selectedAddress?.district}
                      </p>
                      <button type="button" onClick={() => setStep(0)} className="mt-1.5 text-[10px] font-bold text-brand-700 underline">Edit</button>
                    </div>
                    <div className="rounded-xl bg-[#faf8fd] p-3">
                      <p className="text-[9.5px] font-bold uppercase tracking-[.1em] text-[#a096ad]">Payment</p>
                      <p className="mt-1 text-[11.5px] font-bold text-[#3f2b5c]">Cash on Delivery</p>
                      <p className="mt-0.5 text-[10.5px] text-[#7b6d8c]">Pay when the courier arrives.</p>
                      <button type="button" onClick={() => setStep(1)} className="mt-1.5 text-[10px] font-bold text-brand-700 underline">Edit</button>
                    </div>
                  </div>
                  {unavailable ? (
                    <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-[10.5px] font-semibold text-rose-700">
                      One or more items exceed current stock. Return to your cart and adjust quantities.
                    </p>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => void placeOrder()}
                    disabled={placing || unavailable}
                    className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#24143f] text-[13px] font-extrabold text-white transition hover:bg-[#35215a] disabled:opacity-50"
                  >
                    {placing ? <LoaderCircle size={16} className="animate-spin" aria-hidden /> : <Check size={16} aria-hidden />}
                    {placing ? "Placing your order…" : `Place COD order · ${formatTaka(subtotal)}`}
                  </button>
                  <p className="mt-2 text-center text-[10px] leading-4 text-[#a096ad]">
                    One order only — the button is disabled while we confirm it. Stock is reserved atomically.
                  </p>
                </div>
              </section>
            ) : null}
          </div>

          {/* Summary */}
          <aside className="lg:sticky lg:top-[150px]">
            <div className="rounded-2xl border border-[#eeeaf3] bg-white">
              <button
                type="button"
                onClick={() => setSummaryOpen((value) => !value)}
                aria-expanded={summaryOpen}
                className="flex w-full items-center justify-between gap-2 p-4 lg:pointer-events-none"
              >
                <span className="text-[14px] font-extrabold text-[#24143f]">Order summary</span>
                <span className="flex items-center gap-2 text-[11px] font-bold text-[#8b7f9b]">
                  {formatTaka(subtotal)}
                  <ChevronDown size={15} className={`transition lg:hidden ${summaryOpen ? "rotate-180" : ""}`} aria-hidden />
                </span>
              </button>
              <div className={`${summaryOpen ? "block" : "hidden"} border-t border-[#f2eef7] p-4 lg:block lg:border-t-0 lg:pt-0`}>
                <div className="space-y-3">
                  {cart.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-2.5">
                      <span className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-[#f6f2fa]">
                        {item.product.image?.url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.product.image.url} alt={item.product.image.altText || item.product.nameEn} className="h-full w-full object-cover" />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-brand-300"><ImageOff size={13} aria-hidden /></span>
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[11px] font-semibold text-[#302344]">{item.product.nameEn}</p>
                        <p className="text-[9.5px] text-[#9a90a5]">Qty {item.quantity}</p>
                      </div>
                      <p className="shrink-0 text-[11px] font-bold text-[#302344]">{formatTaka(BigInt(item.product.pricePaisa) * BigInt(item.quantity))}</p>
                    </div>
                  ))}
                </div>
                <dl className="mt-4 space-y-2 border-t border-[#f2eef7] pt-3 text-[11.5px]">
                  <div className="flex justify-between gap-2"><dt className="text-[#8b7f9b]">Subtotal</dt><dd className="font-bold text-[#302344]">{formatTaka(subtotal)}</dd></div>
                  <div className="flex justify-between gap-2"><dt className="text-[#8b7f9b]">Delivery fee</dt><dd className="font-semibold text-[#8b7f9b]">৳0</dd></div>
                  <div className="flex justify-between gap-2"><dt className="text-[#8b7f9b]">Discount</dt><dd className="font-semibold text-[#8b7f9b]">None applied</dd></div>
                </dl>
                <div className="mt-3 flex items-baseline justify-between border-t border-[#f2eef7] pt-3">
                  <span className="text-[12px] font-extrabold text-[#24143f]">Total</span>
                  <span className="text-lg font-black text-[#24143f]">{formatTaka(subtotal)}</span>
                </div>
                <p className="mt-2 text-[9.5px] leading-4 text-[#a096ad]">
                  Delivery pricing is not configured yet in this release, so ৳0 is charged. Coupons are not enabled yet.
                </p>
                <div className="mt-3 space-y-1.5 border-t border-[#f2eef7] pt-3 text-[10px] text-[#8b7f9b]">
                  <p className="flex items-center gap-1.5"><ShieldCheck size={12} className="text-brand-600" aria-hidden /> Approved sellers · stock revalidated</p>
                  <p className="flex items-center gap-1.5"><Truck size={12} className="text-brand-600" aria-hidden /> Cash on delivery nationwide</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
