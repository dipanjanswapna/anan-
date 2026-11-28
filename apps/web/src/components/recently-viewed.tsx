"use client";

import Link from "next/link";
import { Clock, ImageOff } from "lucide-react";
import { useEffect, useState } from "react";
import { formatTaka } from "@/lib/format";

type Snapshot = {
  slug: string;
  nameEn: string;
  pricePaisa: string;
  image: string | null;
  category: string;
};

const STORAGE_KEY = "anan:recently-viewed";
const LIMIT = 8;

/**
 * Shows products this browser actually viewed before — stored locally, never invented.
 * Pass `record` on a product page to add the current product to the list.
 */
export function RecentlyViewed({ record, excludeSlug }: { record?: Snapshot; excludeSlug?: string }) {
  const [items, setItems] = useState<Snapshot[]>([]);

  useEffect(() => {
    let stored: Snapshot[] = [];
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as unknown) : [];
      if (Array.isArray(parsed)) {
        stored = parsed.filter(
          (item): item is Snapshot =>
            Boolean(item) &&
            typeof item === "object" &&
            typeof (item as Snapshot).slug === "string" &&
            typeof (item as Snapshot).nameEn === "string" &&
            typeof (item as Snapshot).pricePaisa === "string",
        );
      }
    } catch {
      stored = [];
    }

    if (record) {
      const next = [record, ...stored.filter((item) => item.slug !== record.slug)].slice(0, LIMIT);
      setItems(next.filter((item) => item.slug !== excludeSlug));
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Browsers with storage disabled simply skip history.
      }
      return;
    }
    setItems(stored.filter((item) => item.slug !== excludeSlug));
  }, [record, excludeSlug]);

  if (!items.length) return null;

  return (
    <section className="mt-10 sm:mt-14">
      <div className="mb-4 flex items-center gap-2">
        <Clock size={16} className="text-brand-600" aria-hidden />
        <h2 className="text-[19px] font-extrabold tracking-[-.4px] text-[#26183c] sm:text-[23px]">Recently viewed</h2>
      </div>
      <div className="soft-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:gap-4 sm:px-0">
        {items.map((item) => (
          <Link
            key={item.slug}
            href={`/products/${encodeURIComponent(item.slug)}`}
            className="group w-[42%] shrink-0 rounded-2xl border border-[#eeeaf3] bg-white p-2.5 transition hover:border-brand-200 hover:shadow-soft sm:w-[23%] lg:w-[18%]"
          >
            <div className="aspect-square overflow-hidden rounded-xl bg-[#f6f2fa]">
              {item.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.image}
                  alt={item.nameEn}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-brand-300">
                  <ImageOff size={22} aria-hidden />
                </div>
              )}
            </div>
            <p className="mt-2 line-clamp-1 text-[11px] font-bold text-[#302344]">{item.nameEn}</p>
            <p className="mt-0.5 text-[11px] font-extrabold text-[#27183e]">{formatTaka(item.pricePaisa)}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
