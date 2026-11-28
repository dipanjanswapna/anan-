"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Camera, Clapperboard, Sparkles } from "lucide-react";

type Post = { id: string; mediaType: "IMAGE" | "VIDEO"; mediaUrl: string; caption?: string | null; createdAt: string; creator: { handle: string; displayName: string; avatarUrl?: string | null } };

export default function SocialStudioPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { fetch("/api/social/posts").then(r => r.ok ? r.json() : []).then(setPosts).catch(() => setPosts([])).finally(() => setLoading(false)); }, []);
  return <main className="min-h-screen bg-[#faf8ff] text-[#25183a]">
    <header className="border-b border-[#eee7f8] bg-white"><div className="container-shell flex h-16 items-center justify-between"><Link href="/" className="text-xl font-black tracking-tight text-[#7434df]">ANAN <span className="text-sm font-semibold text-[#8c7ba5]">Social</span></Link><Link href="/social/creator" className="inline-flex items-center gap-2 rounded-xl bg-[#7434df] px-4 py-2.5 text-sm font-bold text-white">Creator Studio <ArrowRight size={15}/></Link></div></header>
    <section className="container-shell py-12"><div className="mx-auto max-w-3xl text-center"><span className="inline-flex items-center gap-2 rounded-full bg-[#eee7ff] px-3 py-1.5 text-xs font-bold text-[#6c35c4]"><Sparkles size={14}/> Community & creativity</span><h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">Discover creators on ANAN</h1><p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[#766987]">A place for original ideas, useful discoveries and creator storefronts. Posts appear after moderation review.</p><div className="mt-7 flex justify-center gap-3"><Link href="/social/creator" className="rounded-xl bg-[#7434df] px-5 py-3 text-sm font-bold text-white">Start creating</Link><Link href="/products" className="rounded-xl border border-[#e8e0f2] bg-white px-5 py-3 text-sm font-bold">Explore marketplace</Link></div></div>
    <div className="mt-14 flex items-center justify-between"><h2 className="text-xl font-extrabold">Community feed</h2><span className="text-xs text-[#897d98]">{posts.length} posts</span></div>
    {loading ? <p className="py-16 text-center text-sm text-[#897d98]">Loading community…</p> : posts.length === 0 ? <div className="mt-5 rounded-3xl border border-dashed border-[#d9cdea] bg-white px-6 py-16 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f0eaff] text-[#7434df]"><Camera/></div><h3 className="mt-4 font-bold">The feed is getting ready</h3><p className="mt-2 text-sm text-[#897d98]">Approved creator posts will appear here.</p></div> : <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{posts.map(post => <article key={post.id} className="overflow-hidden rounded-2xl border border-[#eee7f8] bg-white"><div className="aspect-[4/3] bg-[#f0eaff]">{post.mediaType === "IMAGE" ? <img src={post.mediaUrl} alt="" className="h-full w-full object-cover"/> : <video src={post.mediaUrl} controls playsInline className="h-full w-full object-cover"/>}</div><div className="p-4"><Link href={`/social/creators/${post.creator.handle}`} className="text-sm font-bold text-[#6630b8]">@{post.creator.handle}</Link>{post.caption && <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#5e536b]">{post.caption}</p>}</div></article>)}</div>}
    </section><footer className="border-t border-[#eee7f8] bg-white py-6 text-center text-xs text-[#968aa5]"><Clapperboard className="mr-1 inline" size={14}/> ANAN Social Studio · Organic creator content</footer>
  </main>;
}
