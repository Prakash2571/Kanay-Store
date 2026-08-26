import Image from "next/image";
import Link from "next/link";

import type { StorefrontCollectionSummary } from "@/lib/storefront/types";

// Licensed-source placeholders from Unsplash, used only for editorial merchandising.
const EDITORIAL_IMAGES = [
  "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=1000&q=80",
  "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1000&q=80",
];

export function EditorialPromotions({ collections }: { collections: StorefrontCollectionSummary[] }) {
  const featured = collections.slice(0, 3);
  if (!featured.length) return null;

  return (
    <section aria-labelledby="edit-heading" className="mx-auto max-w-[1400px] px-5 pb-14 sm:px-8 lg:px-12 lg:pb-20" id="our-edit">
      <h2 className="mb-6 font-serif text-4xl font-semibold tracking-[-0.025em] sm:text-5xl" id="edit-heading">Curated for right now</h2>
      <div className="grid gap-4 md:grid-cols-[1.35fr_0.85fr] md:grid-rows-2">
        {featured.map((collection, index) => (
          <Link
            className={`group relative min-h-[22rem] overflow-hidden bg-surface-muted focus-visible:outline focus-visible:outline-2 ${index === 0 ? "md:row-span-2 md:min-h-[38rem]" : "md:min-h-0"}`}
            href={`/collections/${collection.handle}`}
            key={collection.id}
          >
            <Image alt={`Explore the ${collection.title} collection`} className="object-cover transition-transform duration-700 ease-out motion-safe:group-hover:scale-[1.025]" fill sizes={index === 0 ? "(max-width: 767px) 100vw, 60vw" : "(max-width: 767px) 100vw, 40vw"} src={collection.image?.url ?? EDITORIAL_IMAGES[index]} />
            <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-zinc-950/75 via-zinc-950/5 to-transparent" />
            <span className="absolute inset-x-0 bottom-0 p-6 text-zinc-100 sm:p-8">
              <span className="block font-serif text-4xl font-semibold leading-none sm:text-5xl">{collection.title}</span>
              <span className="mt-3 inline-block border-b border-zinc-100 pb-1 text-xs font-bold">View collection</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
