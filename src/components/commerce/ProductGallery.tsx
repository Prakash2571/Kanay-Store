"use client";

import Image from "next/image";
import { useState } from "react";

import type { StorefrontImage } from "@/lib/storefront/types";

export function ProductGallery({ images, title }: { images: StorefrontImage[]; title: string }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selected = images[selectedIndex] ?? null;

  if (!selected) {
    return <div className="grid aspect-[4/5] place-items-center bg-surface-muted px-8 text-center font-serif text-3xl text-ink-muted">{title}</div>;
  }

  return (
    <div className="grid gap-3 lg:grid-cols-[5rem_minmax(0,1fr)]">
      <div className="order-2 flex gap-2 overflow-x-auto lg:order-1 lg:flex-col">
        {images.map((image, index) => (
          <button
            aria-label={`View image ${index + 1} of ${images.length}`}
            aria-pressed={selectedIndex === index}
            className={`relative aspect-[4/5] w-16 shrink-0 overflow-hidden border-2 bg-surface-muted transition-colors focus-visible:outline focus-visible:outline-2 lg:w-full ${selectedIndex === index ? "border-ink" : "border-transparent hover:border-line"}`}
            key={`${image.url}-${index}`}
            onClick={() => setSelectedIndex(index)}
            type="button"
          >
            <Image alt="" className="object-cover" fill sizes="80px" src={image.url} />
          </button>
        ))}
      </div>
      <div className="relative order-1 aspect-[4/5] overflow-hidden bg-surface-muted lg:order-2">
        <Image alt={selected.alt || title} className="object-cover" fill priority sizes="(max-width: 1023px) 100vw, 55vw" src={selected.url} />
      </div>
    </div>
  );
}
