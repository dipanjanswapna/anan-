"use client";

import { useEffect, useState } from "react";
import { Banknote, Clock3, Wallet } from "lucide-react";

type FinanceData = {
  seller: { storeName: string; commissionBps: number };
  balance: { availablePaisa: string; paidPaisa: string; pendingPayoutPaisa: string };
  payoutRequests: Array<{ id: string; amountPaisa: string; status: string; payoutMethod: string; payoutReference: string | null; requestedAt: string; paidAt: string | null; adminNotes: string | null }>;
  earnings: Array<{ id: string; orderId: string; grossPaisa: string; commissionPaisa: string; netPaisa: string; status: string; deliveredAt: string; releasedAt: string }>;
};
const money=(value:string)=>{const paisa=BigInt(value);return `৳${new Intl.NumberFormat("en-BD").format(paisa/100n)}.${(paisa%100n).toString().padStart(2,"0")}`;};
const label=(value:string)=>value.replaceAll("_"," ").toLowerCase().replace(/\b\w/g,c=>c.toUpperCase());

export function SellerFinance() {
  const [data,setData]=useState<FinanceData|null>(null);
  const [method,setMethod]=useState("BKASH");
  const [destination,setDestination]=useState("");
  const [busy,setBusy]=useState(false);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [message,setMessage]=useState("");
  async function load(){const r=await fetch("/api/seller/finance",{cache:"no-store"});if(r.status===401){window.location.assign("/seller/login");return;}const d=await r.json();if(!r.ok)throw new Error(d.message||"Unable to load seller finance.");setData(d);}
  useEffect(()=>{void load().catch(e=>setError(e instanceof Error?e.message:"Unable to load finance.")).finally(()=>setLoading(false));},[]);
  async function requestPayout(e:React.FormEvent){e.preventDefault();setBusy(true);setError("");setMessage("");try{const r=await fetch("/api/seller/finance/payout-requests",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({payoutMethod:method,payoutDestination:destination})});const d=await r.json();if(!r.ok)throw new Error(d.message||"Payout request failed.");setMessage(d.message||"Payout request submitted.");setDestination("");await load();}catch(e){setError(e instanceof Error?e.message:"Payout request failed.");}finally{setBusy(false);}}
  if(loading)return <section className="container-shell py-12 text-center text-sm text-[#82788f]">Loading seller finance…</section>;
  if(!data)return <section className="container-shell py-8"><p role="alert" className="text-sm text-rose-700">{error||"Finance is unavailable."}</p></section>;
  return <section className="container-shell pb-12"><div className="mt-9 flex items-center gap-2"><Wallet size={19} className="text-brand-700"/><h2 className="text-xl font-extrabold text-[#281743]">Earnings & payouts</h2></div>
    <div className="mt-4 grid gap-3 sm:grid-cols-3">{[{title:"Available to withdraw",value:data.balance.availablePaisa},{title:"Pending payout",value:data.balance.pendingPayoutPaisa},{title:"Total paid",value:data.balance.paidPaisa}].map(x=><div key={x.title} className="rounded-2xl border border-[#eee8f5] bg-white p-5"><p className="text-xs text-[#82788f]">{x.title}</p><p className="mt-2 text-2xl font-extrabold text-[#281743]">{money(x.value)}</p></div>)}</div>
    <p className="mt-3 text-xs text-[#82788f]">Platform commission: {(data.seller.commissionBps/100).toFixed(2)}%. Earnings become available only after courier-confirmed delivery, the return window and Admin release.</p>
    {error&&<p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-xs text-red-700">{error}</p>}{message&&<p role="status" className="mt-4 rounded-xl bg-[#f1edf8] p-3 text-xs text-[#49375f]">{message}</p>}
    <form onSubmit={requestPayout} className="mt-5 grid gap-3 rounded-2xl border border-[#eee8f5] bg-white p-5 sm:grid-cols-[1fr_2fr_auto] sm:items-end"><label className="text-xs font-semibold text-[#655873]">Payout method<select value={method} onChange={e=>setMethod(e.target.value)} className="mt-1 w-full rounded-lg border border-[#e8e2f0] bg-white p-3 text-sm"><option value="BKASH">bKash</option><option value="NAGAD">Nagad</option><option value="ROCKET">Rocket</option><option value="BANK_TRANSFER">Bank transfer</option></select></label><label className="text-xs font-semibold text-[#655873]">Account / mobile number<input value={destination} onChange={e=>setDestination(e.target.value)} required minLength={8} maxLength={120} autoComplete="off" className="mt-1 w-full rounded-lg border border-[#e8e2f0] p-3 text-sm" placeholder="Enter payout destination"/></label><button disabled={busy||BigInt(data.balance.availablePaisa)<=0n||BigInt(data.balance.pendingPayoutPaisa)>0n} className="rounded-lg bg-brand-600 px-4 py-3 text-xs font-bold text-white disabled:opacity-50">{busy?"Submitting…":"Request payout"}</button></form>
    <div className="mt-7 grid gap-5 lg:grid-cols-2"><div className="rounded-2xl border border-[#eee8f5] bg-white p-5"><h3 className="font-extrabold text-[#302344]">Earnings ledger</h3>{!data.earnings.length?<p className="mt-4 text-xs text-[#82788f]">No released earnings yet.</p>:<div className="mt-3 divide-y divide-[#f0ecf4]">{data.earnings.map(e=><div key={e.id} className="py-3"><div className="flex justify-between gap-2 text-xs"><b>Order {e.orderId}</b><b>{money(e.netPaisa)}</b></div><p className="mt-1 text-[11px] text-[#82788f]">Gross {money(e.grossPaisa)} · Commission {money(e.commissionPaisa)} · {label(e.status)}</p><p className="mt-1 text-[11px] text-[#a198ad]">Released {new Date(e.releasedAt).toLocaleDateString("en-BD")}</p></div>)}</div>}</div>
    <div className="rounded-2xl border border-[#eee8f5] bg-white p-5"><h3 className="font-extrabold text-[#302344]">Payout history</h3>{!data.payoutRequests.length?<p className="mt-4 text-xs text-[#82788f]">No payout requests yet.</p>:<div className="mt-3 divide-y divide-[#f0ecf4]">{data.payoutRequests.map(p=><div key={p.id} className="py-3"><div className="flex justify-between gap-2 text-xs"><b>{label(p.payoutMethod)}</b><b>{money(p.amountPaisa)}</b></div><p className="mt-1 inline-flex items-center gap-1 text-[11px] text-[#82788f]"><Clock3 size={12}/>{label(p.status)} · {new Date(p.requestedAt).toLocaleDateString("en-BD")}</p>{p.payoutReference&&<p className="mt-1 text-[11px] text-[#82788f]">Reference: {p.payoutReference}</p>}{p.adminNotes&&<p className="mt-1 text-[11px] text-[#82788f]">Admin note: {p.adminNotes}</p>}</div>)}</div>}</div></div>
    <p className="mt-4 flex items-start gap-2 text-[11px] leading-5 text-[#958ba2]"><Banknote size={14} className="mt-0.5 shrink-0"/> Payouts are processed manually by Admin outside ANAN. This screen records requests and payout references; it does not transfer money.</p>
  </section>;
}
