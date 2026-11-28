"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { ArrowLeft, ImagePlus, Send, UserRound } from "lucide-react";

type Profile = { handle: string; displayName: string; bio?: string | null; avatarUrl?: string | null } | null;
type Post = { id: string; caption?: string | null; mediaType: "IMAGE" | "VIDEO"; status: string; mediaUrl: string };

export default function CreatorDashboardPage() {
  const [profile, setProfile] = useState<Profile>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [message, setMessage] = useState("");
  const [handle, setHandle] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [mediaType, setMediaType] = useState<"IMAGE" | "VIDEO">("IMAGE");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const [p, list] = await Promise.all([fetch("/api/social/me/profile"), fetch("/api/social/me/posts")]);
    if (p.ok) { const value = await p.json(); setProfile(value); if (value) { setHandle(value.handle); setDisplayName(value.displayName); setBio(value.bio ?? ""); } }
    if (list.ok) setPosts(await list.json());
  }
  useEffect(() => { void load(); }, []);

  async function saveProfile(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    const response = await fetch("/api/social/me/profile", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ handle, displayName, bio }) });
    const data = await response.json(); setMessage(response.ok ? "Creator profile saved." : data.message ?? "Could not save profile.");
    if (response.ok) await load(); setBusy(false);
  }
  async function createPost(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    const response = await fetch("/api/social/me/posts", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ mediaType, mediaUrl, caption }) });
    const data = await response.json(); setMessage(response.ok ? "Draft saved. Submit it for moderation when ready." : data.message ?? "Could not create draft.");
    if (response.ok) { setMediaUrl(""); setCaption(""); await load(); } setBusy(false);
  }
  async function submit(id: string) {
    setBusy(true); const response = await fetch(`/api/social/me/posts/${id}`, { method: "POST" });
    const data = await response.json(); setMessage(response.ok ? "Submitted for moderation." : data.message ?? "Could not submit post."); await load(); setBusy(false);
  }

  return <main className="min-h-screen bg-[#faf8ff] text-[#25183a]"><header className="border-b border-[#eee7f8] bg-white"><div className="container-shell flex h-16 items-center"><Link href="/social" className="inline-flex items-center gap-2 text-sm font-bold text-[#6b35c2]"><ArrowLeft size={16}/> Social Studio</Link></div></header>
    <div className="container-shell max-w-5xl py-10"><div className="mb-8"><p className="text-xs font-bold uppercase tracking-[.18em] text-[#8155c7]">Creator workspace</p><h1 className="mt-2 text-3xl font-black">Your Creator Studio</h1><p className="mt-2 text-sm text-[#81758f]">Create a profile and submit one image or one video per post. Every post is reviewed before it becomes public.</p></div>
    {message && <p role="status" className="mb-5 rounded-xl bg-white p-3 text-sm text-[#6841a5]">{message}</p>}
    <div className="grid gap-6 lg:grid-cols-2"><section className="rounded-2xl border border-[#eee7f8] bg-white p-5"><div className="mb-4 flex items-center gap-2 font-extrabold"><UserRound size={18} className="text-[#7434df]"/> Creator profile</div><form onSubmit={saveProfile} className="space-y-3"><label className="block text-xs font-bold">Public handle<input required minLength={3} maxLength={30} pattern="[a-z0-9][a-z0-9_]+" value={handle} onChange={e=>setHandle(e.target.value)} placeholder="your_creator_name" className="mt-1 w-full rounded-xl border border-[#e7dff0] px-3 py-2.5 text-sm"/></label><label className="block text-xs font-bold">Display name<input required maxLength={80} value={displayName} onChange={e=>setDisplayName(e.target.value)} className="mt-1 w-full rounded-xl border border-[#e7dff0] px-3 py-2.5 text-sm"/></label><label className="block text-xs font-bold">Bio<textarea maxLength={500} value={bio} onChange={e=>setBio(e.target.value)} rows={3} className="mt-1 w-full rounded-xl border border-[#e7dff0] px-3 py-2.5 text-sm"/></label><button disabled={busy} className="rounded-xl bg-[#7434df] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{busy ? "Saving…" : "Save profile"}</button></form>{profile && <p className="mt-3 text-xs text-[#81758f]">Your storefront: /social/creators/{profile.handle}</p>}</section>
    <section className="rounded-2xl border border-[#eee7f8] bg-white p-5"><div className="mb-4 flex items-center gap-2 font-extrabold"><ImagePlus size={18} className="text-[#7434df]"/> Create a post</div><form onSubmit={createPost} className="space-y-3"><label className="block text-xs font-bold">Media type<select value={mediaType} onChange={e=>setMediaType(e.target.value as "IMAGE"|"VIDEO")} className="mt-1 w-full rounded-xl border border-[#e7dff0] px-3 py-2.5 text-sm"><option value="IMAGE">Single image</option><option value="VIDEO">Single video</option></select></label><label className="block text-xs font-bold">Choose one media file<input required type="file" accept={mediaType === "IMAGE" ? "image/jpeg,image/png,image/webp" : "video/mp4,video/webm"} onChange={selectMedia} className="mt-1 block w-full rounded-xl border border-[#e7dff0] px-3 py-2.5 text-sm"/><span className="mt-1 block text-[11px] font-normal text-[#8b8097]">{mediaType === "IMAGE" ? "JPEG, PNG or WebP · up to 10 MB" : "MP4 or WebM · up to 100 MB"}</span></label><label className="block text-xs font-bold">Caption<textarea maxLength={2000} value={caption} onChange={e=>setCaption(e.target.value)} rows={3} className="mt-1 w-full rounded-xl border border-[#e7dff0] px-3 py-2.5 text-sm"/></label><button disabled={busy || !profile || !mediaFile} className="inline-flex items-center gap-2 rounded-xl bg-[#7434df] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"><Send size={14}/> Save draft</button>{!profile && <p className="text-xs text-[#9b6b2c]">Save your creator profile first.</p>}</form></section></div>
    <section className="mt-7 rounded-2xl border border-[#eee7f8] bg-white p-5"><h2 className="font-extrabold">Your posts</h2>{posts.length === 0 ? <p className="py-8 text-center text-sm text-[#8b8097]">No posts yet.</p> : <div className="mt-4 divide-y divide-[#f0eaf6]">{posts.map(post=><div key={post.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="text-sm font-semibold">{post.caption || post.mediaType + " post"}</p><p className="mt-1 text-xs text-[#8b8097]">{post.mediaType} · {post.status.replace("_"," ")}</p></div>{post.status === "DRAFT" && <button disabled={busy} onClick={()=>void submit(post.id)} className="rounded-lg border border-[#e4d8f3] px-3 py-2 text-xs font-bold text-[#6b35c2]">Submit for review</button>}</div>)}</div>}</section>
    </div></main>;
}
