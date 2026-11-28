"use client";

import { ChevronLeft, ChevronRight, Expand, ImageOff, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type GalleryImage = { url: string | null; altText: string; isPrimary?: boolean };

export function ProductGallery({
  images,
  name,
  fallbackClass,
}: {
  images: GalleryImage[];
  name: string;
  fallbackClass: string;
}) {
  const usable = images.filter((image): image is { url: string; altText: string; isPrimary?: boolean } => Boolean(image.url));
  const [active, setActive] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");
  const [lightbox, setLightbox] = useState(false);
  const [mounted, setMounted] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);
  const current = usable[active];

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    setActive(0);
  }, [images]);

  useEffect(() => {
    if (!lightbox) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightbox(false);
      if (event.key === "ArrowRight") setActive((index) => (index + 1) % usable.length);
      if (event.key === "ArrowLeft") setActive((index) => (index - 1 + usable.length) % usable.length);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [lightbox, usable.length]);

  if (!usable.length) {
    return (
      <div className={`flex aspect-[4/4.4] w-full items-center justify-center overflow-hidden rounded-3xl border border-[#eeeaf3] sm:aspect-[4/4.6] ${fallbackClass}`}>
        <div className="flex flex-col items-center gap-3">
          <ImageOff size={72} strokeWidth={0.9} aria-hidden />
          <span className="text-[11px] font-semibold">The seller has not published a photo yet</span>
        </div>
      </div>
    );
  }

  const step = (direction: 1 | -1) => setActive((index) => (index + direction + usable.length) % usable.length);

  return (
    <div className="min-w-0">
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:gap-4">
        {usable.length > 1 ? (
          <div
            className="soft-scrollbar flex gap-2 overflow-x-auto pb-1 sm:w-[74px] sm:shrink-0 sm:flex-col sm:overflow-y-auto sm:overflow-x-hidden sm:pb-0"
            role="group"
            aria-label={`${name} image thumbnails`}
          >
            {usable.map((image, index) => (
              <button
                key={`${image.url}-${index}`}
                type="button"
                onClick={() => setActive(index)}
                aria-label={`Show image ${index + 1} of ${usable.length}`}
                aria-current={index === active}
                className={`relative aspect-square w-[58px] shrink-0 overflow-hidden rounded-xl border-2 bg-white transition sm:w-full ${
                  index === active ? "border-brand-500" : "border-[#eeeaf3] hover:border-brand-200"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.url} alt="" className="h-full w-full object-cover" loading="lazy" />
              </button>
            ))}
          </div>
        ) : null}

        <div className="relative min-w-0 flex-1">
          <div
            ref={frameRef}
            className="relative aspect-[4/4.3] w-full overflow-hidden rounded-[24px] border border-[#eeeaf3] bg-white sm:aspect-[4/4.6] sm:rounded-[28px]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={current.url}
              alt={current.altText || name}
              onMouseMove={(event) => {
                if (!zoomed) return;
                const rect = event.currentTarget.getBoundingClientRect();
                const x = ((event.clientX - rect.left) / rect.width) * 100;
                const y = ((event.clientY - rect.top) / rect.height) * 100;
                setOrigin(`${x}% ${y}%`);
              }}
              onClick={() => setZoomed((value) => !value)}
              className={`h-full w-full object-cover transition-transform duration-300 ${
                zoomed ? "scale-[1.9] cursor-zoom-out" : "cursor-zoom-in"
              }`}
              style={{ transformOrigin: origin }}
            />
            <div className="absolute right-3 top-3 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setLightbox(true)}
                aria-label="Open image full screen"
                className="grid h-9 w-9 place-items-center rounded-full bg-white/95 text-[#4d3c62] shadow-sm ring-1 ring-black/[.04] transition hover:bg-white"
              >
                <Expand size={15} aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => setZoomed((value) => !value)}
                aria-label={zoomed ? "Zoom out" : "Zoom in"}
                aria-pressed={zoomed}
                className="hidden h-9 w-9 place-items-center rounded-full bg-white/95 text-[11px] font-black text-[#4d3c62] shadow-sm ring-1 ring-black/[.04] transition hover:bg-white sm:grid"
              >
                {zoomed ? "−" : "+"}
              </button>
            </div>
            {usable.length > 1 ? (
              <>
                <button
                  type="button"
                  onClick={() => step(-1)}
                  aria-label="Previous image"
                  className="absolute left-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-[#3f2b5c] shadow-sm ring-1 ring-black/[.04] transition hover:bg-white"
                >
                  <ChevronLeft size={16} aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => step(1)}
                  aria-label="Next image"
                  className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-[#3f2b5c] shadow-sm ring-1 ring-black/[.04] transition hover:bg-white"
                >
                  <ChevronRight size={16} aria-hidden />
                </button>
                <span className="absolute bottom-3 right-3 rounded-full bg-[#24143f]/75 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur">
                  {active + 1} / {usable.length}
                </span>
              </>
            ) : null}
          </div>
          <p className="mt-2 hidden text-[10px] text-[#a39aaa] sm:block">Hover the photo to zoom, or open it full screen.</p>
        </div>
      </div>

      {mounted && lightbox
        ? createPortal(
            <div
              role="dialog"
              aria-modal="true"
              aria-label={`${name} image ${active + 1} of ${usable.length}`}
              className="fixed inset-0 z-[90] flex items-center justify-center bg-[#0f0719]/95 p-4"
            >
              <button
                type="button"
                onClick={() => setLightbox(false)}
                aria-label="Close full screen image"
                className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              >
                <X size={20} aria-hidden />
              </button>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={current.url}
                alt={current.altText || name}
                className="max-h-[86dvh] max-w-full rounded-xl object-contain"
              />
              {usable.length > 1 ? (
                <>
                  <button
                    type="button"
                    onClick={() => step(-1)}
                    aria-label="Previous image"
                    className="absolute left-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20 sm:left-6"
                  >
                    <ChevronLeft size={20} aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => step(1)}
                    aria-label="Next image"
                    className="absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20 sm:right-6"
                  >
                    <ChevronRight size={20} aria-hidden />
                  </button>
                  <p className="absolute bottom-5 left-1/2 -translate-x-1/2 text-xs font-bold text-white/70">
                    {active + 1} / {usable.length}
                  </p>
                </>
              ) : null}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
