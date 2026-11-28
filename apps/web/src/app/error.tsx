"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#fcfbfe] px-5 py-16">
      <div className="w-full max-w-lg text-center">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-[#fff3e8] text-[#bd6424]" aria-hidden>
          <AlertTriangle size={34} strokeWidth={1.5} />
        </div>
        <h1 className="mt-6 text-3xl font-extrabold tracking-[-1px] text-[#26183c]">Something went sideways.</h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[#8f849e]">This part of ANAN could not load. Try again — if it keeps happening, come back to the home page and continue shopping.</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <button onClick={reset} className="inline-flex items-center rounded-xl bg-brand-600 px-5 py-3 text-xs font-bold text-white hover:bg-brand-700">Try again</button>
          <Link href="/" className="inline-flex items-center rounded-xl border border-[#e8e2f0] bg-white px-5 py-3 text-xs font-bold text-[#5e526d] hover:border-brand-300">Back home</Link>
        </div>
      </div>
    </main>
  );
}
