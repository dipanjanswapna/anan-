"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Clock3, LoaderCircle, LogOut, Package, X } from "lucide-react";

type SellerOrder = {
  id: string; status: string; subtotalPaisa: string; acceptanceDeadlineAt: string | null; createdAt: string;
  order: { id: string; createdAt: string; addressSnapshot: { recipientName?: string; phone?: string; district?: string; upazila?: string; addressLine?: string } };
  items: Array<{ id: string; productNameEn: string; quantity: number; lineTotalPaisa: string }>;
};
type Payload = { seller: { storeName: string; storeSlug: string }; stats: { pending: number; active: number; completed: number }; orders: SellerOrder[] };
const money=(value:string)=>{const paisa=BigInt(value);const whole=new Intl.NumberFormat("en-BD").format(paisa/100n);const fraction=(paisa%100n).toString().padStart(2,"0");return `৳${whole}.${fraction}`;};

export function SellerDashboard() {
  const [data,setData]=useState<Payload|null>(null);
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState("");
  const [error,setError]=useState("");
  const load=async()=>{const r=await fetch("/api/seller/dashboard",{cache:"no-store"});if(r.status===401){window.location.assign("/seller/login");return;}const d=await r.json();if(!r.ok)throw new Error(d.message||"Unable to load seller dashboard.");setData(d);};
  useEffect(()=>{void load().catch(e=>setError(e instanceof Error?e.message:"Unable to load dashboard.")).finally(()=>setLoading(false));},[]);
  async function action(id:string,kind:"accept"|"reject"){
    setBusy(id);setError("");
    try{const r=await fetch(`/api/seller/orders/${id}/${kind}`,{method:"POST"});const d=await r.json();if(!r.ok)throw new Error(d.message||"Order update failed.");await load();}
    catch(e){setError(e instanceof Error?e.message:"Order update failed.");}
    finally{setBusy("");}
  }
  async function logout(){await fetch("/api/auth/otp/logout",{method:"POST"});window.location.assign("/seller/login");}
  if(loading)return <p className="py-24 text-center text-sm text-[#82788f]">Loading seller workspace…</p>;
  if(!data)return <section className="container-shell py-16"><p role="alert" className="text-sm text-rose-700">{error||"Seller workspace unavailable."}</p><Link className="mt-4 inline-block text-sm font-bold text-brand-700" href="/seller/login">Sign in again</Link></section>;
  return <main className="min-h-screen bg-[#faf9fc]"><div className="container-shell py-8">
    <header className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-brand-600">ANAN Seller Centre</p><h1 className="mt-2 text-3xl font-extrabold text-[#281743]">{data.seller.storeName}</h1><p className="mt-1 text-xs text-[#8b8097]">Manage your orders and fulfilment</p></div><button onClick={logout} className="inline-flex items-center gap-2 rounded-xl border border-[#e8e2f0] bg-white px-4 py-2 text-xs font-bold text-[#5e526d]"><LogOut size={15}/> Sign out</button></header>
    <div className="mt-7 grid gap-3 sm:grid-cols-3">{[{label:"Awaiting acceptance",value:data.stats.pending},{label:"In progress",value:data.stats.active},{label:"Delivered",value:data.stats.completed}].map(x=><div key={x.label} className="rounded-2xl border border-[#eee8f5] bg-white p-5"><p className="text-xs text-[#8b8097]">{x.label}</p><p className="mt-2 text-3xl font-extrabold text-[#281743]">{x.value}</p></div>)}</div>
    <div className="mt-9 flex items-center gap-2"><Package size={18} className="text-brand-700"/><h2 className="text-lg font-extrabold text-[#281743]">Recent seller orders</h2></div>
    {error&&<p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-xs text-red-700">{error}</p>}
    {!data.orders.length?<div className="mt-5 rounded-2xl border border-dashed border-[#ded5e9] bg-white p-12 text-center text-sm text-[#82788f]">No seller orders yet.</div>:<div className="mt-5 space-y-4">{data.orders.map(order=><article key={order.id} className="rounded-2xl border border-[#eee8f5] bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[11px] text-[#968ba3]">Seller order · {order.id}</p><p className="mt-1 text-sm font-bold text-[#302344]">Parent order {order.order.id}</p><p className="mt-1 text-xs text-[#8b8097]">{new Date(order.createdAt).toLocaleString("en-BD")}</p></div><div className="text-right"><p className="font-extrabold text-[#302344]">{money(order.subtotalPaisa)}</p><p className="mt-1 text-xs font-bold text-brand-700">{order.status.replaceAll("_"," ")}</p></div></div>
      <div className="mt-4 grid gap-3 border-t border-[#f0ecf4] pt-4 sm:grid-cols-2"><div><p className="text-[11px] font-bold uppercase tracking-wider text-[#8b8097]">Items</p>{order.items.map(i=><p key={i.id} className="mt-1 text-xs text-[#5e526d]">{i.productNameEn} × {i.quantity} · {money(i.lineTotalPaisa)}</p>)}</div><div><p className="text-[11px] font-bold uppercase tracking-wider text-[#8b8097]">Delivery details</p><p className="mt-1 text-xs text-[#5e526d]">{order.order.addressSnapshot.recipientName||"Customer"} · {order.order.addressSnapshot.phone||""}</p><p className="mt-1 text-xs text-[#82788f]">{[order.order.addressSnapshot.addressLine,order.order.addressSnapshot.upazila,order.order.addressSnapshot.district].filter(Boolean).join(", ")}</p></div></div>
      {order.status==="PENDING_ACCEPTANCE"&&<div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#f0ecf4] pt-4"><p className="inline-flex items-center gap-1 text-[11px] text-[#8b8097]"><Clock3 size={13}/> Accept within 24 hours{order.acceptanceDeadlineAt? ` · ${new Date(order.acceptanceDeadlineAt).toLocaleString("en-BD")}`:""}</p><div className="flex gap-2"><button disabled={busy===order.id} onClick={()=>void action(order.id,"reject")} className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700 disabled:opacity-50"><X size={14}/> Reject</button><button disabled={busy===order.id} onClick={()=>void action(order.id,"accept")} className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">{busy===order.id?<LoaderCircle size={14} className="animate-spin"/>:<Check size={14}/>} Accept</button></div></div>}
    </article>)}</div>}
  </div></main>;
}
