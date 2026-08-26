import Image from "next/image";
import Link from "next/link";

import type { StorefrontCollectionSummary } from "@/lib/storefront/types";

export function CategoryRail({ collections }: { collections: StorefrontCollectionSummary[] }) {
  if (!collections.length) return null;

  return (
    <section aria-labelledby="category-heading" className="mx-auto max-w-[1400px] px-5 py-10 sm:px-8 lg:px-12 lg:py-12">
      <h2 className="sr-only" id="category-heading">Shop by collection</h2>
      <div className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 sm:justify-between sm:gap-6">
        {collections.slice(0, 8).map((collection) => (
          <Link className="group w-[5.75rem] shrink-0 snap-start text-center focus-visible:outline focus-visible:outline-2 sm:w-24 lg:w-28" href={`/collections/${collection.handle}`} key={collection.id}>
            <span className="relative block aspect-square overflow-hidden rounded-full border border-line bg-surface-muted">
              {collection.image ? (
                <Image alt={collection.image.alt || collection.title} className="object-cover transition-transform duration-500 motion-safe:group-hover:scale-105" fill sizes="112px" src={collection.image.url} />
              ) : (
                <span className="grid h-full place-items-center font-serif text-2xl font-semibold text-ink-muted">{collection.title.charAt(0)}</span>
              )}
            </span>
            <span className="mt-2.5 block text-xs font-bold group-hover:text-accent-ink">{collection.title}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
