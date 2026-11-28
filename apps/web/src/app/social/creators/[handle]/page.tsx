import Link from "next/link";
import BlockCreatorButton from "./block-creator-button";
type Context = { params: Promise<{ handle: string }> };
export default async function CreatorPublicPage({ params }: Context) {
  const { handle } = await params;
  const base = process.env.ANAN_API_URL ?? "http://localhost:4000/api/v1";
  const response = await fetch(`${base}/creators/${encodeURIComponent(handle)}`, { cache: "no-store" }).catch(() => null);
  if (!response?.ok) return <main className="container-shell py-20 text-center"><h1 className="text-2xl font-bold">Creator not found</h1><Link className="mt-4 inline-block text-[#7434df]" href="/social">Back to Social Studio</Link></main>;
  const creator = await response.json();
  return <main className="min-h-screen bg-[#faf8ff]"><header className="border-b bg-white"><div className="container-shell flex h-16 items-center"><Link href="/social" className="font-bold text-[#7434df]">ANAN Social</Link></div></header><section className="container-shell py-12"><div className="rounded-3xl border border-[#eee7f8] bg-white p-7"><p className="text-xs font-bold uppercase tracking-widest text-[#8052c5]">Creator storefront</p><h1 className="mt-2 text-3xl font-black">{creator.displayName}</h1><p className="mt-1 text-sm text-[#8052c5]">@{creator.handle}</p>{creator.bio && <p className="mt-4 max-w-2xl text-sm leading-7 text-[#6f637e]">{creator.bio}</p>}<BlockCreatorButton handle={creator.handle}/></div><h2 className="mb-4 mt-9 text-xl font-extrabold">Published posts</h2><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{creator.posts.map((post: {id:string;mediaType:string;mediaUrl:string;caption?:string})=><article key={post.id} className="overflow-hidden rounded-2xl border border-[#eee7f8] bg-white"><div className="aspect-[4/3] bg-[#eee7ff]">{post.mediaType==="IMAGE"?<img src={post.mediaUrl} alt="" className="h-full w-full object-cover"/>:<video src={post.mediaUrl} controls playsInline className="h-full w-full object-cover"/>}</div><p className="p-4 text-sm">{post.caption}</p></article>)}</div></section></main>;
}
