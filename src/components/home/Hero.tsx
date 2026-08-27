import { ArrowRight, Headphones, Home, ShoppingBasket, Sparkles, Watch, Wrench } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { heroCollageImages, maxDiscountPercent } from "@/lib/storefront/merchandising";
import type { StorefrontProductSummary } from "@/lib/storefront/types";

/**
 * The homepage hero.
 *
 * WHAT THIS REPLACES, AND WHY
 * ---------------------------
 * A full-bleed photograph of a model in a trench coat under "Style that earns its place."
 * in 72px serif. For a catalog whose best sellers are earbuds, kitchen organisers and
 * wholesale lots, that hero was actively misleading: a visitor who wants a power bank
 * bounces from a page that looks like an apparel label.
 *
 * THE IMAGE IS THE CATALOG
 * ------------------------
 * There is no stock photography here. The visual is a collage of real product images from
 * the live catalog, one per category where possible (see heroCollageImages), so the hero
 * shows what the store actually sells and updates itself as the catalog changes. When the
 * catalog is empty or unreachable it falls back to an illustrated panel of department icons
 * — never to a padded-out stock photo, because that is how a general store drifts back into
 * looking like a fashion brand.
 *
 * THE DISCOUNT BADGE IS EARNED
 * ----------------------------
 * The reference design has a prominent "UP TO 50% OFF" disc. That number is computed from
 * real compare-at prices and rounded DOWN; if nothing is discounted, the badge is not
 * rendered at all. A hard-coded percentage is a promise the checkout cannot keep.
 */
export function Hero({ products }: { products: StorefrontProductSummary[] }) {
  const collage = heroCollageImages(products, 4);
  const discount = maxDiscountPercent(products);

  return (
    <section aria-labelledby="hero-heading" className="shell pt-4 lg:pt-6">
      <div className="grid items-center gap-8 overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface-blue p-6 sm:p-9 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 lg:p-14">
        <div>
          <p className="flex items-center gap-2 text-[0.72rem] font-bold uppercase tracking-[0.14em] text-brand-ink">
            <Sparkles aria-hidden="true" size={15} strokeWidth={2} />
            Wholesale • Bulk orders • Better pricing
          </p>
          <h1
            className="mt-4 max-w-[20ch] text-[2rem] font-extrabold leading-[1.1] tracking-[-0.02em] sm:text-[2.6rem] lg:text-[3.1rem]"
            id="hero-heading"
          >
            Everything you need. Better prices. In bulk.
          </h1>
          <p className="mt-5 max-w-[52ch] text-sm leading-6 text-ink-muted sm:text-base sm:leading-7">
            Electronics, home and kitchen, appliances, tools, office supplies, beauty,
            accessories and thousands of everyday products — sourced in quantity, priced per
            unit, delivered across India.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-brand px-6 text-sm font-bold text-white transition-colors hover:bg-brand-hover focus-visible:outline focus-visible:outline-2 active:translate-y-px"
              href="/shop"
            >
              Browse wholesale
              <ArrowRight aria-hidden="true" size={17} strokeWidth={2} />
            </Link>
            <Link
              className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-control)] border border-line-strong bg-surface px-6 text-sm font-bold text-ink transition-colors hover:border-brand hover:text-brand-ink focus-visible:outline focus-visible:outline-2 active:translate-y-px"
              href="/#categories"
            >
              Explore categories
            </Link>
          </div>
        </div>

        <div className="relative">
          {collage.length > 0 ? (
            <ProductCollage collage={collage} />
          ) : (
            <IllustratedPanel />
          )}

          {/* Amber, and this is one of the two places amber is allowed: a discount claim. */}
          {discount !== null ? (
            <p className="absolute -top-1 right-1 grid size-[5.5rem] place-items-center rounded-[var(--radius-pill)] bg-highlight text-center text-[0.7rem] font-extrabold uppercase leading-tight text-highlight-ink shadow-[var(--shadow-soft)] sm:size-24 sm:text-xs">
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

/** Four real product photographs, arranged as a tile grid. */
function ProductCollage({ collage }: { collage: { image: { url: string; alt: string }; title: string }[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3">
      {collage.map((entry, index) => (
        <li
          className={`relative overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface ${
            // The first tile is taller on desktop, which gives the collage the same
            // asymmetric weight the reference photograph has.
            index === 0 ? "aspect-square lg:aspect-[4/5]" : "aspect-square"
          }`}
          key={entry.image.url}
        >
          <Image
            alt={entry.image.alt || entry.title}
            className="object-cover"
            fill
            priority={index === 0}
            sizes="(max-width: 1023px) 45vw, 22vw"
            src={entry.image.url}
          />
        </li>
      ))}
    </ul>
  );
}

/**
 * Fallback when the catalog is empty or the API is unreachable.
 *
 * Icons across six departments rather than a photograph, so the fallback still says
 * "general store" and cannot be mistaken for merchandise that does not exist.
 */
function IllustratedPanel() {
  const departments = [
    { icon: Headphones, label: "Electronics" },
    { icon: Home, label: "Home" },
    { icon: ShoppingBasket, label: "Kitchen" },
    { icon: Sparkles, label: "Beauty" },
    { icon: Watch, label: "Accessories" },
    { icon: Wrench, label: "Tools" },
  ];

  return (
    <ul className="grid grid-cols-3 gap-3" aria-label="Departments in this store">
      {departments.map(({ icon: Icon, label }) => (
        <li
          className="grid aspect-square place-items-center gap-2 rounded-[var(--radius-card)] border border-line bg-surface p-2 text-center"
          key={label}
        >
          <Icon aria-hidden="true" className="text-brand-ink" size={26} strokeWidth={1.6} />
          <span className="text-[0.7rem] font-semibold text-ink-muted">{label}</span>
        </li>
      ))}
    </ul>
  );
}
