import Link from "next/link";
import { Compass, PackageSearch } from "lucide-react";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#fcfbfe] px-5 py-16">
      <div className="w-full max-w-lg text-center">
        <p className="text-[10px] font-bold uppercase tracking-[.2em] text-brand-600">Page not found</p>
        <div className="mx-auto mt-6 grid h-20 w-20 place-items-center rounded-3xl bg-brand-50 text-brand-500" aria-hidden>
          <Compass size={36} strokeWidth={1.4} />
        </div>
        <h1 className="mt-6 text-3xl font-extrabold tracking-[-1px] text-[#26183c]">This page wandered off.</h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[#8f849e]">The link may be old, or the product may no longer be listed. There is still plenty to discover.</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link href="/products" className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-xs font-bold text-white hover:bg-brand-700"><PackageSearch size={15} aria-hidden /> Browse products</Link>
          <Link href="/" className="inline-flex items-center rounded-xl border border-[#e8e2f0] bg-white px-5 py-3 text-xs font-bold text-[#5e526d] hover:border-brand-300">Back home</Link>
        </div>
      </div>
    </main>
  );
}
