"use client";

import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

export type HeroSlide = {
  id: string;
  eyebrow: string;
  title: string;
  highlight: string;
  subtitle: string;
  cta: { label: string; href: string };
  secondary: { label: string; href: string };
  image: string;
  imageAlt: string;
  /** Small factual line such as "Cash on delivery · 64 districts" */
  footnote: string;
};

const AUTOPLAY_MS = 6500;

export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const count = slides.length;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [pageHidden, setPageHidden] = useState(false);
  const swipeStart = useRef<number | null>(null);
  const regionRef = useRef<HTMLDivElement>(null);

  const go = useCallback(
    (next: number) => {
      if (count === 0) return;
      setIndex(((next % count) + count) % count);
    },
    [count],
  );

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const update = () => setPageHidden(document.visibilityState === "hidden");
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  useEffect(() => {
    if (paused || reducedMotion || pageHidden || count < 2) return;
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % count), AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [paused, reducedMotion, pageHidden, count]);

  if (count === 0) return null;

  return (
    <section
      className="relative"
      aria-roledescription="carousel"
      aria-label="Featured ANAN promotions"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPaused(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") {
          event.preventDefault();
          go(index + 1);
        } else if (event.key === "ArrowLeft") {
          event.preventDefault();
          go(index - 1);
        } else if (event.key === "Home") {
          event.preventDefault();
          go(0);
        } else if (event.key === "End") {
          event.preventDefault();
          go(count - 1);
        }
      }}
    >
      <div
        ref={regionRef}
        className="group relative isolate overflow-hidden rounded-[26px] bg-[#1d1030] shadow-[0_26px_70px_-30px_rgba(38,16,66,.55)] sm:rounded-[32px]"
        onPointerDown={(event) => {
          if (event.pointerType === "mouse") return;
          swipeStart.current = event.clientX;
        }}
        onPointerUp={(event) => {
          if (swipeStart.current === null) return;
          const distance = event.clientX - swipeStart.current;
          swipeStart.current = null;
          if (Math.abs(distance) > 44) go(index + (distance < 0 ? 1 : -1));
        }}
        onPointerCancel={() => {
          swipeStart.current = null;
        }}
        style={{ touchAction: "pan-y" }}
      >
        <div
          className="flex transition-transform duration-700 ease-[cubic-bezier(.22,.61,.36,1)] motion-reduce:transition-none"
          style={{ transform: `translate3d(-${index * 100}%, 0, 0)` }}
          aria-live={paused || reducedMotion ? "polite" : "off"}
        >
          {slides.map((slide, slideIndex) => {
            const active = slideIndex === index;
            return (
              <div
                key={slide.id}
                className="w-full shrink-0"
                role="group"
                aria-roledescription="slide"
                aria-label={`${slideIndex + 1} of ${count}`}
                aria-hidden={!active}
                inert={!active ? true : undefined}
              >
                <div className="relative flex min-h-[440px] w-full items-end sm:min-h-[470px] sm:items-center lg:min-h-[530px] xl:min-h-[560px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={slide.image}
                    alt={slide.imageAlt}
                    loading={slideIndex === 0 ? "eager" : "lazy"}
                    fetchPriority={slideIndex === 0 ? "high" : "auto"}
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-cover object-[62%_center] sm:object-[68%_center] lg:object-right"
                  />
                  <div
                    className="absolute inset-0 bg-[linear-gradient(0deg,rgba(20,10,35,.97)_0%,rgba(24,12,42,.9)_52%,rgba(24,12,42,.55)_100%)] sm:bg-[linear-gradient(90deg,rgba(20,10,35,.96)_0%,rgba(24,12,42,.82)_42%,rgba(24,12,42,.28)_72%,rgba(24,12,42,.08)_100%)]"
                    aria-hidden
                  />
                  <div
                    className="absolute -right-24 -top-24 h-72 w-72 rounded-full border border-white/10 sm:h-96 sm:w-96"
                    aria-hidden
                  />
                  <div className="relative z-10 w-full px-6 pb-24 pt-20 sm:px-10 sm:pb-20 sm:pt-20 lg:px-14 lg:pb-24 lg:pt-16 xl:px-[68px]">
                    <div className="max-w-[560px]">
                      <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[.18em] text-white/90 backdrop-blur sm:text-[10px]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#c9a6ff]" aria-hidden />
                        {slide.eyebrow}
                      </span>
                      <h1 className="mt-4 text-[clamp(1.8rem,5.2vw,3.5rem)] font-extrabold leading-[1.06] tracking-[-0.03em] text-white sm:mt-5">
                        {slide.title}{" "}
                        <span className="font-serif font-medium italic text-[#d8bcff]">{slide.highlight}</span>
                      </h1>
                      <p className="mt-3 max-w-[430px] text-[12.5px] leading-6 text-white/72 sm:mt-4 sm:text-sm sm:leading-7">
                        {slide.subtitle}
                      </p>
                      <div className="mt-6 flex flex-wrap items-center gap-2.5 sm:mt-7 sm:gap-3">
                        <Link
                          href={slide.cta.href}
                          className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-[12px] font-extrabold text-[#2a1548] shadow-[0_10px_30px_rgba(0,0,0,.22)] transition hover:-translate-y-0.5 hover:bg-[#f3ebff] sm:h-12 sm:px-6 sm:text-[13px]"
                        >
                          {slide.cta.label}
                          <ArrowRight size={16} aria-hidden />
                        </Link>
                        <Link
                          href={slide.secondary.href}
                          className="inline-flex h-11 items-center rounded-full border border-white/30 px-5 text-[12px] font-bold text-white transition hover:border-white/60 hover:bg-white/10 sm:h-12 sm:px-6 sm:text-[13px]"
                        >
                          {slide.secondary.label}
                        </Link>
                      </div>
                      <p className="mt-4 text-[9.5px] font-semibold uppercase tracking-[.13em] text-white/50 sm:mt-6 sm:text-[10px]">
                        {slide.footnote}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Controls */}
        <div className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-between gap-3 px-5 pb-5 sm:px-8 sm:pb-6 lg:px-12">
          <div className="flex items-center gap-2" role="tablist" aria-label="Choose a promotion">
            {slides.map((slide, slideIndex) => (
              <button
                key={slide.id}
                type="button"
                role="tab"
                aria-selected={slideIndex === index}
                aria-label={`Go to slide ${slideIndex + 1}: ${slide.eyebrow}`}
                onClick={() => go(slideIndex)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  slideIndex === index ? "w-8 bg-white" : "w-2 bg-white/40 hover:bg-white/70"
                }`}
              >
                <span className="sr-only">Slide {slideIndex + 1}</span>
              </button>
            ))}
            <span className="ml-1 text-[10px] font-bold tabular-nums text-white/60 sm:ml-2">
              {String(index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setPaused((value) => !value)}
              aria-label={paused ? "Resume automatic slide rotation" : "Pause automatic slide rotation"}
              aria-pressed={paused}
              className="grid h-9 w-9 place-items-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur transition hover:bg-white/20 sm:h-10 sm:w-10"
            >
              {paused ? <Play size={14} aria-hidden /> : <Pause size={14} aria-hidden />}
            </button>
            <button
              type="button"
              onClick={() => go(index - 1)}
              aria-label="Previous slide"
              className="grid h-9 w-9 place-items-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur transition hover:bg-white/20 sm:h-10 sm:w-10"
            >
              <ChevronLeft size={17} aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => go(index + 1)}
              aria-label="Next slide"
              className="grid h-9 w-9 place-items-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur transition hover:bg-white/20 sm:h-10 sm:w-10"
            >
              <ChevronRight size={17} aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
