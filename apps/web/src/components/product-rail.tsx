"use client";

import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Children, useRef, type ReactNode } from "react";

export function ProductRail({
  eyebrow,
  title,
  detail,
  href,
  linkLabel = "View all",
  children,
}: {
  eyebrow?: string;
  title: string;
  detail?: string;
  href?: string;
  linkLabel?: string;
  children: ReactNode;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const items = Children.toArray(children);

  const scroll = (direction: 1 | -1) => {
    const element = trackRef.current;
    if (!element) return;
    element.scrollBy({
      left: direction * Math.max(240, Math.min(640, element.clientWidth * 0.85)),
      behavior: "smooth",
    });
  };

  return (
    <section>
      <div className="mb-4 flex items-end justify-between gap-3 sm:mb-6">
        <div className="min-w-0">
          {eyebrow ? <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[.2em] text-brand-600">{eyebrow}</p> : null}
          <h2 className="text-[21px] font-extrabold tracking-[-.7px] text-[#26183c] sm:text-[27px]">{title}</h2>
          {detail ? <p className="mt-1 text-xs text-[#958ba2] sm:text-sm">{detail}</p> : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {href ? (
            <Link href={href} className="hidden items-center gap-1 text-xs font-bold text-brand-700 transition hover:gap-2 sm:flex">
              {linkLabel} <ArrowRight size={15} aria-hidden />
            </Link>
          ) : null}
          <div className="hidden items-center gap-1.5 sm:flex">
            <button
              type="button"
              onClick={() => scroll(-1)}
              aria-label={`Scroll ${title} backwards`}
              className="grid h-9 w-9 place-items-center rounded-full border border-[#e9e3f2] bg-white text-[#5c4d70] transition hover:border-brand-300 hover:text-brand-700"
            >
              <ChevronLeft size={16} aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => scroll(1)}
              aria-label={`Scroll ${title} forwards`}
              className="grid h-9 w-9 place-items-center rounded-full border border-[#e9e3f2] bg-white text-[#5c4d70] transition hover:border-brand-300 hover:text-brand-700"
            >
              <ChevronRight size={16} aria-hidden />
            </button>
          </div>
        </div>
      </div>
      <div
        ref={trackRef}
        className="soft-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:gap-4 sm:px-0"
      >
        {items.map((child, index) => (
          <div
            key={index}
            className="w-[calc(50%-6px)] min-w-0 shrink-0 snap-start sm:w-[calc(33.333%-11px)] lg:w-[calc(25%-12px)] xl:w-[calc(20%-13px)]"
          >
            {child}
          </div>
        ))}
      </div>
      {href ? (
        <Link href={href} className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-brand-700 sm:hidden">
          {linkLabel} <ArrowRight size={14} aria-hidden />
        </Link>
      ) : null}
    </section>
  );
}
