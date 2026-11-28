"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Camera, Clapperboard, Sparkles } from "lucide-react";

type Post = { id: string; mediaType: "IMAGE" | "VIDEO"; mediaUrl: string; caption?: string | null; createdAt: string; creator: { handle: string; displayName: string; avatarUrl?: string | null } };

export default function SocialStudioPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportReason, setReportReason] = useState("SPAM");
  const [reportingId, setReportingId] = useState("");
  const [notice, setNotice] = useState("");
  async function reportPost(id: string) {
    setReportingId(id); setNotice("");
    const response = await fetch(`/api/social/posts/${id}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ reason: reportReason }) });
    const data = await response.json().catch(() => ({}));
    setNotice(response.ok ? "Thank you. Your report was sent to the moderation team." : data.message ?? "Could not submit report.");
    setReportingId("");
  }
  useEffect(() => { fetch("/api/social/posts").then(r => r.ok ? r.json() : []).then(setPosts).catch(() => setPosts([])).finally(() => setLoading(false)); }, []);
  return <main className="min-h-screen bg-[#faf8ff] text-[#25183a]">
    <header className="border-b border-[#eee7f8] bg-white"><div className="container-shell flex h-16 items-center justify-between"><Link href="/" className="text-xl font-black tracking-tight text-[#7434df]">ANAN <span className="text-sm font-semibold text-[#8c7ba5]">Social</span></Link><div className="flex items-center gap-2"><Link href="/social/blocked-creators" className="text-xs font-semibold text-[#765a91]">Blocked creators</Link><Link href="/social/creator" className="inline-flex items-center gap-2 rounded-xl bg-[#7434df] px-4 py-2.5 text-sm font-bold text-white">Creator Studio <ArrowRight size={15}/></Link></div></div></header>
    <section className="container-shell py-12"><div className="mx-auto max-w-3xl text-center"><span className="inline-flex items-center gap-2 rounded-full bg-[#eee7ff] px-3 py-1.5 text-xs font-bold text-[#6c35c4]"><Sparkles size={14}/> Community & creativity</span><h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">Discover creators on ANAN</h1><p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[#766987]">A place for original ideas, useful discoveries and creator storefronts. Posts appear after moderation review.</p><div className="mt-7 flex justify-center gap-3"><Link href="/social/creator" className="rounded-xl bg-[#7434df] px-5 py-3 text-sm font-bold text-white">Start creating</Link><Link href="/products" className="rounded-xl border border-[#e8e0f2] bg-white px-5 py-3 text-sm font-bold">Explore marketplace</Link></div></div>
    <div className="mt-14 flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-extrabold">Community feed</h2><div className="flex items-center gap-2"><label htmlFor="report-reason" className="text-xs text-[#897d98]">Report reason</label><select id="report-reason" value={reportReason} onChange={event=>setReportReason(event.target.value)} className="rounded-lg border border-[#e7dff0] bg-white px-2 py-1.5 text-xs"><option value="SPAM">Spam</option><option value="HARASSMENT">Harassment</option><option value="HATE">Hate</option><option value="VIOLENCE">Violence</option><option value="SEXUAL_CONTENT">Sexual content</option><option value="MISINFORMATION">Misinformation</option><option value="COPYRIGHT">Copyright</option><option value="OTHER">Other</option></select><span className="text-xs text-[#897d98]">{posts.length} posts</span></div></div>{notice && <p role="status" className="mt-3 rounded-xl bg-white p-3 text-sm text-[#6841a5]">{notice}</p>}
    {loading ? <p className="py-16 text-center text-sm text-[#897d98]">Loading community…</p> : posts.length === 0 ? <div className="mt-5 rounded-3xl border border-dashed border-[#d9cdea] bg-white px-6 py-16 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f0eaff] text-[#7434df]"><Camera/></div><h3 className="mt-4 font-bold">The feed is getting ready</h3><p className="mt-2 text-sm text-[#897d98]">Approved creator posts will appear here.</p></div> : <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{posts.map(post => <article key={post.id} className="overflow-hidden rounded-2xl border border-[#eee7f8] bg-white"><div className="aspect-[4/3] bg-[#f0eaff]">{post.mediaType === "IMAGE" ? <img src={post.mediaUrl} alt="" className="h-full w-full object-cover"/> : <video src={post.mediaUrl} controls playsInline className="h-full w-full object-cover"/>}</div><div className="p-4"><div className="flex items-center justify-between gap-2"><Link href={`/social/creators/${post.creator.handle}`} className="text-sm font-bold text-[#6630b8]">@{post.creator.handle}</Link><button disabled={reportingId===post.id} onClick={()=>void reportPost(post.id)} className="text-xs font-semibold text-[#8a536a] underline disabled:opacity-50">{reportingId===post.id ? "Sending…" : "Report"}</button></div>{post.caption && <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#5e536b]">{post.caption}</p>}</div></article>)}</div>}
    </section><footer className="border-t border-[#eee7f8] bg-white py-6 text-center text-xs text-[#968aa5]"><Clapperboard className="mr-1 inline" size={14}/> ANAN Social Studio · Organic creator content</footer>
  </main>;
}
