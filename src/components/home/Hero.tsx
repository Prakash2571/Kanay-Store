import Image from "next/image";
import Link from "next/link";

import type { StorefrontCollectionSummary } from "@/lib/storefront/types";

// Unsplash editorial photography. Replace through brand-managed content when available.
const HERO_IMAGE = "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1800&q=82";

export function Hero({ collections }: { collections: StorefrontCollectionSummary[] }) {
  const primary = collections[0];
  const secondary = collections[1];

  return (
    <section className="mx-auto grid min-h-[calc(100dvh-6rem)] max-w-[1400px] grid-cols-1 bg-surface md:min-h-0 md:grid-cols-[0.82fr_1.18fr] lg:min-h-[620px] lg:max-h-[760px]">
      <div className="flex items-center px-5 py-12 sm:px-8 md:px-10 lg:px-16 lg:py-16">
        <div className="max-w-xl">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent-ink">The everyday edit</p>
          <h1 className="mt-4 max-w-[10ch] font-serif text-5xl font-semibold leading-[0.95] tracking-[-0.035em] sm:text-6xl lg:text-7xl">Style that earns its place.</h1>
          <p className="mt-5 max-w-[42ch] text-sm leading-6 text-ink-muted sm:text-base">New layers, reliable staples and finishing pieces selected for everyday wardrobes.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link className="inline-flex min-h-11 items-center justify-center bg-ink px-6 text-sm font-bold text-canvas transition-opacity hover:opacity-85 focus-visible:outline focus-visible:outline-2 active:translate-y-px" href={primary ? `/collections/${primary.handle}` : "/shop"}>
              {primary ? `Shop ${primary.title}` : "Shop now"}
            </Link>
            {secondary ? (
              <Link className="inline-flex min-h-11 items-center justify-center border border-ink px-6 text-sm font-bold text-ink transition-colors hover:bg-ink hover:text-canvas focus-visible:outline focus-visible:outline-2 active:translate-y-px" href={`/collections/${secondary.handle}`}>
                Shop {secondary.title}
              </Link>
            ) : null}
          </div>
        </div>
      </div>
      <div className="relative min-h-[54dvh] overflow-hidden md:min-h-[34rem]">
        <Image alt="Fashion editorials in soft natural light" className="object-cover object-center" fill priority sizes="(max-width: 767px) 100vw, 60vw" src={HERO_IMAGE} />
      </div>
    </section>
  );
}
