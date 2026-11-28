"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ShieldCheck } from "lucide-react";

type Item = { id: string; mediaType: "IMAGE" | "VIDEO"; mediaUrl: string; caption?: string | null; status: string; creator: { handle: string; displayName: string } };
type Report = { id: string; reason: string; details?: string | null; status: string; post: { id: string; mediaType: "IMAGE" | "VIDEO"; mediaUrl: string; caption?: string | null; status: string; creator: { handle: string; displayName: string } } };

export default function SocialModerationPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState("");
  async function load() {
    const [response, reportResponse] = await Promise.all([fetch("/api/social/admin/posts"), fetch("/api/social/admin/reports")]);
    if (response.ok) setItems(await response.json());
    else setMessage(response.status === 401 || response.status === 403 ? "Admin moderation access is required." : "Could not load moderation queue.");
    if (reportResponse.ok) setReports(await reportResponse.json());
  }
  useEffect(() => { void load(); }, []);
  async function review(id: string, action: "APPROVE" | "REJECT") {
    setBusyId(id); setMessage("");
    const response = await fetch(`/api/social/admin/posts/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ action }) });
    const data = await response.json();
    setMessage(response.ok ? `Post ${action.toLowerCase()}d.` : data.message ?? "Review failed.");
    await load(); setBusyId("");
  }
  async function reviewReport(id: string, action: "DISMISS" | "HIDE_POST") {
    setBusyId(id); setMessage("");
    const response = await fetch(`/api/social/admin/reports/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ action }) });
    const data = await response.json();
    setMessage(response.ok ? (action === "HIDE_POST" ? "Post hidden and report action recorded." : "Report dismissed.") : data.message ?? "Report review failed.");
    await load(); setBusyId("");
  }
  return <main className="min-h-screen bg-[#faf8ff] text-[#25183a]"><header className="border-b bg-white"><div className="container-shell flex h-16 items-center"><Link href="/admin/orders" className="inline-flex items-center gap-2 text-sm font-bold text-[#6b35c2]"><ArrowLeft size={16}/> Admin</Link></div></header><section className="container-shell max-w-5xl py-10"><div className="flex items-center gap-3"><div className="rounded-xl bg-[#eee7ff] p-3 text-[#7434df]"><ShieldCheck/></div><div><p className="text-xs font-bold uppercase tracking-widest text-[#8052c5]">Trust & safety</p><h1 className="text-3xl font-black">Social moderation</h1></div></div><p className="mt-3 text-sm text-[#81758f]">Review every submitted post before it appears in the public feed.</p>{message && <p role="status" className="mt-5 rounded-xl bg-white p-3 text-sm">{message}</p>}<div className="mt-7 space-y-4">{items.map(item=><article key={item.id} className="grid gap-4 rounded-2xl border border-[#eee7f8] bg-white p-4 sm:grid-cols-[220px_1fr]"><div className="aspect-video overflow-hidden rounded-xl bg-[#eee7ff]">{item.mediaType==="IMAGE"?<img src={item.mediaUrl} alt="" className="h-full w-full object-cover"/>:<video src={item.mediaUrl} controls playsInline className="h-full w-full object-cover"/>}</div><div><p className="text-xs font-bold text-[#8052c5]">@{item.creator.handle} · {item.creator.displayName}</p><p className="mt-2 text-sm leading-6">{item.caption || "No caption"}</p><p className="mt-2 text-xs text-[#968aa5]">{item.status}</p><div className="mt-4 flex gap-2"><button disabled={busyId===item.id} onClick={()=>void review(item.id,"APPROVE")} className="rounded-lg bg-[#7434df] px-4 py-2 text-xs font-bold text-white disabled:opacity-50">Approve</button><button disabled={busyId===item.id} onClick={()=>void review(item.id,"REJECT")} className="rounded-lg border border-[#eadfea] px-4 py-2 text-xs font-bold text-[#8c365a] disabled:opacity-50">Reject</button></div></div></article>)}{items.length===0 && <div className="rounded-2xl border border-dashed border-[#d9cdea] bg-white py-16 text-center text-sm text-[#897d98]">No posts are waiting for review.</div>}</div>
    <section className="mt-12">
      <div><p className="text-xs font-bold uppercase tracking-widest text-[#8052c5]">Community reports</p><h2 className="mt-1 text-2xl font-black">Reported posts</h2><p className="mt-2 text-sm text-[#81758f]">Review user-submitted reports. Hiding a post removes it from public feed and creator storefront.</p></div>
      <div className="mt-5 space-y-4">{reports.map(report=><article key={report.id} className="rounded-2xl border border-[#eee7f8] bg-white p-4"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-bold text-[#8a365b]">{report.reason.replaceAll("_"," ")}</p><span className="text-xs text-[#968aa5]">{report.status}</span></div><p className="mt-2 text-xs text-[#8052c5]">@{report.post.creator.handle} · {report.post.creator.displayName}</p><p className="mt-2 text-sm">{report.post.caption || "No caption"}</p>{report.details && <p className="mt-2 rounded-lg bg-[#faf8ff] p-3 text-sm text-[#6f637e]">Reporter note: {report.details}</p>}<div className="mt-4 flex flex-wrap gap-2"><button disabled={busyId===report.id} onClick={()=>void reviewReport(report.id,"HIDE_POST")} className="rounded-lg bg-[#8a365b] px-4 py-2 text-xs font-bold text-white disabled:opacity-50">Hide post</button><button disabled={busyId===report.id} onClick={()=>void reviewReport(report.id,"DISMISS")} className="rounded-lg border border-[#eadfea] px-4 py-2 text-xs font-bold text-[#6b35c2] disabled:opacity-50">Dismiss report</button></div></article>)}{reports.length===0 && <div className="rounded-2xl border border-dashed border-[#d9cdea] bg-white py-12 text-center text-sm text-[#897d98]">No open reports.</div>}</div>
    </section></section></main>;
}
