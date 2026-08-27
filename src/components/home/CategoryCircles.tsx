import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import type { CategoryTile } from "@/lib/storefront/merchandising";
import { SHOWCASE_CATEGORIES, categoryTintFor, showcaseImageFor } from "@/lib/storefront/showcase";

/**
 * The category rail, directly below the hero.
 *
 * On a store this broad the category row is the main navigation — more so than the header nav,
 * which cannot hold twenty departments. Tiles come from live collections first and Shopify product
 * types second (see buildCategoryTiles).
 *
 * COLOUR CODING
 * -------------
 * Each card wears its department's soft tint (see TINTS in lib/storefront/showcase.ts): blue for
 * electronics, green for home and kitchen, lavender for accessories, rose for beauty, yellow for
 * tools, blue-grey for office, teal for fitness, orange for fashion. An unrecognised label gets
 * neutral slate rather than a wrong colour.
 *
 * The point is DIFFERENTIATION, not decoration — a buyer scanning the rail twice should start to
 * associate green with home goods. The colour lands on the card body and a thin bar, never on the
 * typography, which stays dark throughout. That is the line between "colour-coded" and "childish".
 *
 * THE TINT SITS BEHIND THE PHOTOGRAPH
 * ----------------------------------
 * The image area is painted with the tint first and the photograph is layered on top. So a missing
 * or failed image reveals a soft coloured panel with the department's initial — a designed state
 * rather than a grey box with a broken-image icon. This matters: the curated URLs could not be
 * verified from the environment this was built in.
 */
export function CategoryCircles({ tiles }: { tiles: CategoryTile[] }) {
  const cards: CategoryTile[] =
    tiles.length > 0
      ? tiles
      : SHOWCASE_CATEGORIES.map((category) => ({
          key: `showcase:${category.key}`,
          label: category.label,
          href: category.href,
          image: category.image,
        }));

  return (
    <section aria-labelledby="categories-heading" className="shell section-y" id="categories">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <div>
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-accent-ink">
            Shop by department
          </p>
          <h2
            className="display-3 mt-2 font-extrabold"
            id="categories-heading"
          >
            Source across every category
          </h2>
        </div>
        <Link
          className="inline-flex shrink-0 items-center gap-1.5 rounded text-sm font-bold text-brand-ink transition-colors hover:text-brand focus-visible:outline focus-visible:outline-2"
          href="/shop"
        >
          All categories
          <ArrowRight aria-hidden="true" size={16} strokeWidth={2} />
        </Link>
      </div>

      {/*
        Two / four / six across, capped at twelve tiles. Twelve divides by all three counts, so the
        rail never ends in a half-empty row. Not eight across even at 1680px: that puts each tile
        under 200px, and "lots of tiny tiles" reads as filler rather than as navigation.
      */}
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 lg:grid-cols-6 lg:gap-5">
        {cards.slice(0, 12).map((tile) => (
          <li key={tile.key}>
            <CategoryCard tile={tile} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function CategoryCard({ tile }: { tile: CategoryTile }) {
  const image = tile.image ?? showcaseImageFor(tile.label);
  const tint = categoryTintFor(tile.label);

  return (
    <Link
      className={`group block overflow-hidden rounded-[var(--radius-card)] border transition-[box-shadow,transform] hover:shadow-[var(--shadow-card)] focus-visible:outline focus-visible:outline-2 motion-safe:hover:-translate-y-0.5 ${tint.border} ${tint.surface}`}
      href={tile.href}
    >
      {/* Tint first, photograph over it. A failed image leaves the tinted panel and its initial. */}
      <span className={`relative block aspect-[5/4] overflow-hidden ${tint.surface}`}>
        <span
          aria-hidden="true"
          className={`absolute inset-0 grid place-items-center text-2xl font-extrabold ${tint.ink}`}
        >
          {tile.label.charAt(0).toUpperCase()}
        </span>
        {image ? (
          <Image
            alt=""
            className="relative object-cover transition-transform duration-500 motion-safe:group-hover:scale-105"
            fill
            sizes="(max-width: 639px) 45vw, (max-width: 1023px) 23vw, 16vw"
            src={image.url}
          />
        ) : null}
      </span>

      {/* A 2px bar of the saturated mark: the only place the strong colour appears. */}
      <span aria-hidden="true" className={`block h-0.5 w-full ${tint.mark}`} />

      <span className="block px-3 py-2.5">
        <span className="line-clamp-2 text-[0.78rem] font-bold leading-4 text-ink sm:text-[0.82rem]">
          {tile.label}
        </span>
      </span>
    </Link>
  );
}
