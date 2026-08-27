import Image from "next/image";
import Link from "next/link";

import type { CategoryTile } from "@/lib/storefront/merchandising";

/**
 * The circular category rail, directly below the hero.
 *
 * On a store this broad, the category row is the main navigation — more so than the header
 * nav, which cannot hold twenty departments. Tiles come from live collections first and
 * from Shopify product types second (see buildCategoryTiles), so this row is never a
 * hard-coded list of departments the store may not stock.
 *
 * Horizontally scrollable on mobile, a single spaced row from `sm` up, matching the
 * reference. Renders nothing when there are no categories rather than an empty strip.
 */
export function CategoryCircles({ tiles }: { tiles: CategoryTile[] }) {
  if (tiles.length === 0) return null;

  return (
    <section aria-labelledby="categories-heading" className="shell section-y" id="categories">
      <div className="mb-5 flex items-end justify-between gap-4">
        <h2 className="text-xl font-extrabold tracking-[-0.01em] sm:text-2xl" id="categories-heading">
          Shop by category
        </h2>
        <Link
          className="shrink-0 rounded text-sm font-bold text-accent-ink transition-colors hover:text-accent-hover focus-visible:outline focus-visible:outline-2"
          href="/shop"
        >
          All categories
        </Link>
      </div>

      <ul className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-1 no-scrollbar sm:mx-0 sm:grid sm:grid-cols-5 sm:gap-5 sm:overflow-visible sm:px-0 lg:grid-cols-10">
        {tiles.map((tile) => (
          <li className="w-[4.75rem] shrink-0 snap-start sm:w-auto" key={tile.key}>
            <Link
              className="group grid justify-items-center gap-2 rounded-[var(--radius-card)] py-1 text-center focus-visible:outline focus-visible:outline-2"
              href={tile.href}
            >
              <span className="relative block aspect-square w-full overflow-hidden rounded-[var(--radius-pill)] border border-line bg-surface-peach-soft transition-colors group-hover:border-accent">
                {tile.image ? (
                  <Image
                    alt=""
                    className="object-cover transition-transform duration-500 motion-safe:group-hover:scale-105"
                    fill
                    sizes="112px"
                    src={tile.image.url}
                  />
                ) : (
                  <span aria-hidden="true" className="grid h-full place-items-center text-lg font-extrabold text-accent-ink">
                    {tile.label.charAt(0).toUpperCase()}
                  </span>
                )}
              </span>
              <span className="line-clamp-2 text-[0.72rem] font-semibold leading-4 text-ink group-hover:text-accent-ink sm:text-xs">
                {tile.label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
