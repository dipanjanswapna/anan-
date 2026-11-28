"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, UserRound, UserRoundX } from "lucide-react";

type Creator = { handle: string; displayName: string; avatarUrl?: string | null; blockedAt: string };

export default function BlockedCreatorsPage() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState("");
  async function load() {
    const response = await fetch("/api/social/me/blocks", { cache: "no-store" });
    const data = await response.json().catch(() => []);
    if (!response.ok) { setMessage(data.message ?? "Sign in to manage blocked creators."); return; }
    setCreators(data);
  }
  useEffect(() => { void load(); }, []);
  async function unblock(handle: string) {
    setBusy(handle); setMessage("");
    const response = await fetch(`/api/social/creators/${encodeURIComponent(handle)}`, { method: "PATCH" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) setMessage(data.message ?? "Could not unblock creator.");
    else { setCreators(current => current.filter(item => item.handle !== handle)); setMessage(`@${handle} has been unblocked.`); }
    setBusy("");
  }
  return <main className="min-h-screen bg-[#faf8ff] text-[#25183a]">
    <header className="border-b border-[#eee7f8] bg-white"><div className="container-shell flex h-16 items-center"><Link href="/social" className="inline-flex items-center gap-2 text-sm font-bold text-[#6b35c2]"><ArrowLeft size={16}/> Social Studio</Link></div></header>
    <section className="container-shell max-w-3xl py-10"><p className="text-xs font-bold uppercase tracking-widest text-[#8052c5]">Your safety settings</p><h1 className="mt-2 text-3xl font-black">Blocked creators</h1><p className="mt-2 text-sm text-[#81758f]">Creators you block are hidden from your feed and storefront view while you are signed in.</p>
      {message && <p role="status" className="mt-5 rounded-xl bg-white p-3 text-sm text-[#6841a5]">{message}</p>}
      <div className="mt-6 space-y-3">{creators.map(creator => <article key={creator.handle} className="flex items-center justify-between gap-4 rounded-2xl border border-[#eee7f8] bg-white p-4"><div className="flex min-w-0 items-center gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#eee7ff] text-[#7434df]">{creator.avatarUrl ? <img src={creator.avatarUrl} alt="" className="h-full w-full object-cover"/> : <UserRound/>}</div><div className="min-w-0"><p className="truncate text-sm font-bold">{creator.displayName}</p><p className="text-xs text-[#8052c5]">@{creator.handle}</p></div></div><button type="button" disabled={busy===creator.handle} onClick={()=>void unblock(creator.handle)} className="shrink-0 rounded-xl border border-[#e7dff0] px-4 py-2 text-xs font-bold text-[#7434df] disabled:opacity-50">{busy===creator.handle ? "Please wait…" : "Unblock"}</button></article>)}
      {creators.length===0 && <div className="rounded-2xl border border-dashed border-[#d9cdea] bg-white py-16 text-center"><UserRoundX className="mx-auto text-[#8b7a9e]" size={28}/><p className="mt-3 text-sm font-semibold">No blocked creators</p><p className="mt-1 text-xs text-[#897d98]">Creators you block will appear here.</p></div>}</div>
    </section>
  </main>;
}
