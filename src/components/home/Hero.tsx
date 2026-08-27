import { ArrowRight, PackageCheck, Sparkles } from "lucide-react";
import Link from "next/link";

import { DepartmentVisual } from "@/components/commerce/DepartmentVisual";
import { departmentImageFor } from "@/lib/storefront/categoryMedia";
import { heroCollageImages, maxDiscountPercent } from "@/lib/storefront/merchandising";
import { TINTS, categoryTintFor, showcaseCollage, type Tint } from "@/lib/storefront/showcase";
import type { StorefrontImage, StorefrontProductSummary } from "@/lib/storefront/types";

/** One collage tile: a real product photo, an owner-supplied department photo, or a tinted card. */
type HeroTile = {
  key: string;
  label: string;
  tint: Tint;
  departmentKey?: string;
  image: StorefrontImage | null;
};

/**
 * The homepage hero.
 *
 * THE VISUAL IS PHOTOGRAPHY, NOT ICONS
 * ------------------------------------
 * It used to fall back to a 3x2 grid of outline icons in equal boxes whenever the catalog had
 * no images, which is most of the time on a store that is still being set up — and that grid
 * was the single biggest reason the page read as a wireframe. Four equal squares with a glyph
 * in each is what a placeholder looks like.
 *
 * Now the collage is always photographs: real catalog images first, topped up from the curated
 * category set in lib/storefront/showcase.ts when the catalog cannot fill it. On a configured
 * store with four or more product images, nothing curated renders at all.
 *
 * THE COMPOSITION IS DELIBERATELY UNEVEN
 * -------------------------------------
 * One tall featured tile spanning two rows, three supporting tiles beside and below it. Four
 * identically-sized squares in a 2x2 is the arrangement that reads as generated; an asymmetric
 * one reads as art-directed, and it costs the same amount of markup.
 *
 * THE DISCOUNT BADGE IS EARNED
 * ----------------------------
 * Computed from real compare-at prices and rounded DOWN. If nothing is discounted the badge is
 * not rendered at all, because a hard-coded percentage is a promise the checkout cannot keep.
 */
export function Hero({ products }: { products: StorefrontProductSummary[] }) {
  const fromCatalog: HeroTile[] = heroCollageImages(products, 4).map((entry, index) => ({
    key: `product:${index}:${entry.image.url}`,
    label: entry.title,
    tint: TINTS.blue,
    image: entry.image,
  }));

  /**
   * Top up rather than replace: a store with two product photos shows both, plus two department
   * tiles, instead of discarding its own imagery.
   *
   * A department tile uses an owner file from `public/categories/`, then a reviewed remote photo,
   * then the colour-coded studio fallback. See categoryMedia.ts for the shared precedence rule.
   */
  const departments: HeroTile[] = showcaseCollage(4 - fromCatalog.length).map((department) => ({
    key: `department:${department.key}`,
    label: department.label,
    tint: categoryTintFor(department.label),
    departmentKey: department.key,
    image: departmentImageFor(department.label),
  }));

  const collage = [...fromCatalog, ...departments].slice(0, 4);
  const discount = maxDiscountPercent(products);

  return (
    <section aria-labelledby="hero-heading" className="shell pt-5 lg:pt-7">
      <div className="grid items-center gap-8 overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface-blue px-6 py-9 sm:px-9 sm:py-11 lg:grid-cols-[1.02fr_0.98fr] lg:gap-12 lg:px-12 lg:py-14 2xl:gap-14 2xl:px-14 2xl:py-16">
        <div>
          {/* Orange eyebrow: the one "notice this" mark above the fold. */}
          <p className="flex items-center gap-2 text-[0.72rem] font-bold uppercase tracking-[0.14em] text-accent-ink">
            <Sparkles aria-hidden="true" size={15} strokeWidth={2} />
            Wholesale • Bulk orders • Better pricing
          </p>
          <h1
            className="display-1 mt-4 font-extrabold text-balance"
            id="hero-heading"
          >
            Everything you need. Better prices in bulk.
          </h1>
          <p className="lead mt-4 max-w-[48ch] text-ink-muted">
            Source electronics, home essentials, accessories, tools, beauty, lifestyle products
            and more with practical wholesale minimums.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            {/*
              The primary CTA is orange and it is the only orange button above the fold. Blue
              carries structure; this one action is the thing the page is for.
            */}
            <Link
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-accent px-8 text-sm font-bold text-ink transition-colors hover:bg-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 active:translate-y-px"
              href="/shop"
            >
              Browse wholesale
              <ArrowRight aria-hidden="true" size={17} strokeWidth={2} />
            </Link>
            <Link
              className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-control)] border border-line-strong bg-surface px-8 text-sm font-bold text-ink transition-colors hover:border-brand hover:text-brand-ink focus-visible:outline focus-visible:outline-2 active:translate-y-px"
              href="/#categories"
            >
              Explore categories
            </Link>
          </div>

          <p className="mt-6 flex items-center gap-2 text-xs font-semibold text-ink-muted">
            <PackageCheck aria-hidden="true" className="text-brand" size={16} strokeWidth={1.9} />
            Minimum order quantities shown on every bulk item
          </p>
        </div>

        <div className="relative">
          <ProductCollage collage={collage} />

          {/*
            Soft yellow, the brief's decorative-badge slot. Dark yellow ink on it rather than white:
            white on the saturated yellow is 2.07:1, the worst pairing in the whole palette.
          */}
          {discount !== null ? (
            <p className="absolute -left-2 -top-3 grid size-[4.75rem] place-items-center rounded-[var(--radius-pill)] border border-tint-yellow-mark/30 bg-tint-yellow text-center text-[0.65rem] font-extrabold uppercase leading-tight text-tint-yellow-ink shadow-[var(--shadow-soft)] sm:size-[5.25rem] sm:text-[0.7rem]">
              <span>
                Up to
                <br />
                <span className="text-lg sm:text-xl">{discount}%</span>
                <br />
                off
              </span>
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

/**
 * Four photographs in an uneven grid that tiles EXACTLY, at both breakpoints.
 *
 * This is the fiddly part and it is worth spelling out, because an asymmetric grid that does
 * not add up leaves a hole — which looks far worse than the symmetric grid it replaced.
 *
 *   desktop, 4 columns x 2 rows = 8 cells:
 *     featured  cols 1-2, rows 1-2   (4 cells)
 *     support 0 cols 3-4, row 1      (2 cells)
 *     support 1 col 3,    row 2      (1 cell)
 *     support 2 col 4,    row 2      (1 cell)
 *
 *   mobile, 2 columns, flowing:
 *     featured  full width, 4:3
 *     support 0 + support 1 side by side, square
 *     support 2 full width, 16:9
 *
 * Both fill completely, and the desktop arrangement has one obvious focal point rather than
 * four equal squares.
 */
const SUPPORTING_SPAN = [
  "aspect-square sm:col-span-2 sm:aspect-auto",
  "aspect-square sm:col-span-1 sm:aspect-auto",
  "col-span-2 aspect-[16/9] sm:col-span-1 sm:aspect-auto",
];

function ProductCollage({ collage }: { collage: HeroTile[] }) {
  const [featured, ...supporting] = collage;
  if (!featured) return null;

  return (
    <ul className="grid grid-cols-2 gap-3 sm:min-h-[21rem] sm:grid-cols-4 sm:grid-rows-2 sm:gap-4 lg:min-h-[25rem] 2xl:min-h-[27rem]">
      <li className="group relative col-span-2 aspect-[4/3] overflow-hidden rounded-[var(--radius-card)] border border-line shadow-[var(--shadow-card)] sm:row-span-2 sm:aspect-auto">
        <DepartmentVisual
          className="h-full w-full"
          departmentKey={featured.departmentKey}
          image={featured.image}
          label={featured.label}
          priority
          sizes="(max-width: 639px) 92vw, (max-width: 1023px) 46vw, 32vw"
          tint={featured.tint}
        />
        {/*
          The featured tile is labelled because it is large enough that a viewer asks what they
          are looking at. The supporting tiles are not: four captions turns a collage into a
          list, and their alt text already carries the same information for screen readers.
        */}
        <span className="absolute bottom-3 left-3 rounded-[var(--radius-pill)] bg-surface/90 px-3 py-1 text-[0.7rem] font-bold text-ink shadow-[var(--shadow-card)] backdrop-blur">
          {featured.label}
        </span>
      </li>

      {supporting.slice(0, 3).map((entry, index) => (
        <li
          className={`group relative overflow-hidden rounded-[var(--radius-card)] border border-line shadow-[var(--shadow-card)] ${SUPPORTING_SPAN[index]}`}
          key={entry.key}
        >
          <DepartmentVisual
            className="h-full w-full"
            departmentKey={entry.departmentKey}
            image={entry.image}
            label={entry.label}
            sizes="(max-width: 639px) 45vw, (max-width: 1023px) 30vw, 16vw"
            tint={entry.tint}
          />
        </li>
      ))}
    </ul>
  );
}
