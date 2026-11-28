"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Clock3, LoaderCircle, ShieldCheck } from "lucide-react";

type Application = {
  id: string; storeSlug: string; contactName: string; email: string; phone: string; storeName: string;
  businessType: string; message: string | null; status: string; createdAt: string;
  reviewNotes: string | null;
};
const statuses = ["PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED"];

export function AdminSellerApplications() {
  const [status,setStatus]=useState("PENDING");
  const [items,setItems]=useState<Application[]>([]);
  const [notes,setNotes]=useState<Record<string,string>>({});
  const [busy,setBusy]=useState("");
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(true);
  async function load(nextStatus=status) {
    const r=await fetch(`/api/admin/seller-applications?status=${nextStatus}`,{cache:"no-store"});
    const d=await r.json();
    if(!r.ok)throw new Error(d.message||"Unable to load applications.");
    setItems(d.applications||[]);
  }
  useEffect(()=>{void load().catch(e=>setError(e instanceof Error?e.message:"Unable to load applications.")).finally(()=>setLoading(false));},[status]);
  async function review(id:string,action:"UNDER_REVIEW"|"APPROVED"|"REJECTED") {
    setBusy(id);setError("");
    try {
      const r=await fetch(`/api/admin/seller-applications/${id}`,{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({action,notes:notes[id]||undefined})});
      const d=await r.json();if(!r.ok)throw new Error(d.message||"Review action failed.");
      await load();
    } catch(e) {setError(e instanceof Error?e.message:"Review action failed.");}
    finally {setBusy("");}
  }
  return <main className="min-h-screen bg-[#faf9fc]"><div className="container-shell py-8">
    <header className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-brand-600">ANAN Admin Console</p><h1 className="mt-2 text-3xl font-extrabold text-[#281743]">Seller applications</h1><p className="mt-1 text-sm text-[#82788f]">Review applicants and provision approved seller accounts.</p></div><Link href="/" className="rounded-xl border border-[#e8e2f0] bg-white px-4 py-2 text-xs font-bold text-[#5e526d]">Back to store</Link></header>
    <div className="mt-7 flex flex-wrap gap-2">{statuses.map(s=><button key={s} onClick={()=>setStatus(s)} className={`rounded-full px-4 py-2 text-xs font-bold ${status===s?"bg-brand-600 text-white":"border border-[#e8e2f0] bg-white text-[#655873]"}`}>{s.replaceAll("_"," ")}</button>)}</div>
    {error&&<p role="alert" className="mt-5 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700"><AlertCircle size={16}/>{error}</p>}
    {loading?<p className="py-20 text-center text-sm text-[#82788f]">Loading applications…</p>:!items.length?<div className="mt-6 rounded-2xl border border-dashed border-[#ded5e9] bg-white p-12 text-center text-sm text-[#82788f]">No applications in this queue.</div>:<div className="mt-6 space-y-4">{items.map(app=><article key={app.id} className="rounded-2xl border border-[#eee8f5] bg-white p-5">
      <div className="flex flex-wrap justify-between gap-3"><div><h2 className="text-lg font-extrabold text-[#302344]">{app.storeName}</h2><p className="mt-1 text-xs text-[#82788f]">{app.contactName} · {app.businessType}</p></div><span className="rounded-full bg-[#f2edf8] px-3 py-1 text-[11px] font-bold text-brand-700">{app.status.replaceAll("_"," ")}</span></div>
      <div className="mt-4 grid gap-2 text-sm text-[#5e526d] sm:grid-cols-2"><p>Email: {app.email}</p><p>Phone: {app.phone}</p><p>Applied: {new Date(app.createdAt).toLocaleString("en-BD")}</p><p>Store slug: {app.storeSlug}</p></div>
      {app.message&&<p className="mt-3 rounded-xl bg-[#faf9fc] p-3 text-sm text-[#655873]">{app.message}</p>}
      <label className="mt-4 block text-xs font-bold text-[#5e526d]">Internal review notes<textarea value={notes[app.id]??app.reviewNotes??""} onChange={e=>setNotes(v=>({...v,[app.id]:e.target.value}))} maxLength={2000} rows={2} className="mt-2 w-full rounded-xl border border-[#e8e2f0] p-3 text-sm outline-none focus:border-brand-500"/></label>
      <div className="mt-4 flex flex-wrap gap-2">{app.status==="PENDING"&&<button disabled={busy===app.id} onClick={()=>void review(app.id,"UNDER_REVIEW")} className="rounded-lg border border-[#e8e2f0] px-3 py-2 text-xs font-bold text-[#5e526d]"><Clock3 size={13} className="mr-1 inline"/> Mark reviewing</button>}{app.status!=="APPROVED"&&app.status!=="REJECTED"&&<><button disabled={busy===app.id} onClick={()=>void review(app.id,"REJECTED")} className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700">Reject</button><button disabled={busy===app.id} onClick={()=>void review(app.id,"APPROVED")} className="rounded-lg bg-brand-600 px-3 py-2 text-xs font-bold text-white">{busy===app.id?<LoaderCircle size={14} className="inline animate-spin"/>:<CheckCircle2 size={14} className="mr-1 inline"/>} Approve & create seller</button></>}</div>
    </article>)}</div>}
    <p className="mt-8 flex items-start gap-2 text-xs text-[#8b8097]"><ShieldCheck size={15} className="mt-0.5 shrink-0"/> Approval creates a seller account but phone OTP is still required for sign-in. Existing customer/account identity conflicts require manual review.</p>
  </div></main>;
}
