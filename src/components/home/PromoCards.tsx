import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import type { CategoryTile } from "@/lib/storefront/merchandising";
import { showcaseImageFor } from "@/lib/storefront/showcase";
import type { StorefrontImage } from "@/lib/storefront/types";

/**
 * Three promotional cards: one large on the left, two stacked on the right.
 *
 * WHY NOT THREE EQUAL CARDS
 * -------------------------
 * That is what this was, and three identical boxes in a row read as one wide band — the eye
 * takes them in as a single element and skips the set. An uneven split gives the section a
 * primary and two secondaries, which is how a real merchandising block is composed and which
 * also tells the visitor which one matters most.
 *
 * EVERY CARD IS PHOTOGRAPHED
 * --------------------------
 * They previously fell back to an icon in a bordered square whenever the matched collection had
 * no image, which was most of the time. Imagery now comes from the matched collection, then from
 * a product in it, then from the curated department photograph — and the icon fallback is gone
 * entirely, because a card whose whole job is to be visual should not degrade to a glyph.
 *
 * STILL NO PRICES HERE
 * --------------------
 * Each card is a NAVIGATION destination, not an offer. Nothing quotes a price or a saving,
 * because promo cards render before any pricing has been read and a card reading "50% off home"
 * would be inventing it. The Deals card links to the deals row, which only exists when products
 * genuinely carry a compare-at saving.
 */
export function PromoCards({ tiles }: { tiles: CategoryTile[] }) {
  const home = matchTile(tiles, ["home", "kitchen", "furnish", "decor", "appliance"]);
  const tech = matchTile(tiles, ["electronic", "tech", "mobile", "computer", "gadget", "audio"]);

  const feature = {
    eyebrow: "Home & living",
    title: "Home Essentials",
    text: "Wholesale home and kitchen picks — cookware, storage, decor and small appliances, in the quantities a shop or an office actually orders.",
    cta: "Browse home",
    href: home?.href ?? "/shop",
    image: home?.image ?? showcaseImageFor("home"),
    tone: "bg-tint-green",
    border: "border-tint-green-mark/25",
  };

  const secondary = [
    {
      key: "tech",
      eyebrow: "Tech & gadgets",
      title: "Tech & Accessories",
      text: "Audio, charging and mobile — the fastest-moving lines in the catalog.",
      cta: "Browse tech",
      href: tech?.href ?? "/shop",
      image: tech?.image ?? showcaseImageFor("electronics"),
      tone: "bg-tint-blue",
      border: "border-tint-blue-mark/25",
    },
    {
      key: "deals",
      eyebrow: "Buy in quantity",
      title: "Bulk Deals",
      text: "Products below their usual price, with minimums shown up front.",
      cta: "View deals",
      href: "/#deals",
      image: showcaseImageFor("tools"),
      tone: "bg-tint-orange",
      border: "border-tint-orange-mark/25",
    },
  ];

  return (
    <section aria-labelledby="promo-heading" className="shell pb-2">
      <h2 className="sr-only" id="promo-heading">
        Featured departments
      </h2>

      <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr] lg:gap-5">
        {/* The large card. Photograph on top, copy beneath, so the image gets real area. */}
        <Link
          className={`group flex flex-col overflow-hidden rounded-[var(--radius-card)] border transition-[box-shadow,transform] hover:shadow-[var(--shadow-card)] focus-visible:outline focus-visible:outline-2 motion-safe:hover:-translate-y-0.5 ${feature.border} ${feature.tone}`}
          href={feature.href}
        >
          <span className="relative block aspect-[16/9] overflow-hidden bg-surface-muted lg:aspect-[2/1]">
            {feature.image ? (
              <Image
                alt={feature.image.alt || feature.title}
                className="object-cover transition-transform duration-500 motion-safe:group-hover:scale-[1.03]"
                fill
                sizes="(max-width: 1023px) 92vw, 46vw"
                src={feature.image.url}
              />
            ) : null}
          </span>
          <span className="flex flex-1 flex-col p-6 sm:p-7">
            <span className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-accent-ink">
              {feature.eyebrow}
            </span>
            <span className="mt-2 text-xl font-extrabold leading-tight tracking-[-0.015em] sm:text-2xl">
              {feature.title}
            </span>
            <span className="mt-2.5 max-w-[46ch] text-sm leading-6 text-ink-muted">
              {feature.text}
            </span>
            <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-brand-ink">
              {feature.cta}
              <ArrowRight
                aria-hidden="true"
                className="transition-transform motion-safe:group-hover:translate-x-0.5"
                size={16}
                strokeWidth={2}
              />
            </span>
          </span>
        </Link>

        {/* Two stacked cards, image beside copy so they stay short next to the feature. */}
        <div className="grid gap-4 lg:gap-5">
          {secondary.map((card) => (
            <Link
              className={`group flex items-stretch gap-0 overflow-hidden rounded-[var(--radius-card)] border transition-[box-shadow,transform] hover:shadow-[var(--shadow-card)] focus-visible:outline focus-visible:outline-2 motion-safe:hover:-translate-y-0.5 ${card.border} ${card.tone}`}
              href={card.href}
              key={card.key}
            >
              <span className="min-w-0 flex-1 p-5 sm:p-6">
                <span className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-accent-ink">
                  {card.eyebrow}
                </span>
                <span className="mt-1.5 block text-lg font-extrabold leading-tight tracking-[-0.01em]">
                  {card.title}
                </span>
                <span className="mt-1.5 block text-[0.82rem] leading-5 text-ink-muted">
                  {card.text}
                </span>
                <span className="mt-3.5 inline-flex items-center gap-1.5 text-sm font-bold text-brand-ink">
                  {card.cta}
                  <ArrowRight
                    aria-hidden="true"
                    className="transition-transform motion-safe:group-hover:translate-x-0.5"
                    size={16}
                    strokeWidth={2}
                  />
                </span>
              </span>
              <CardVisual image={card.image} title={card.title} />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/** A photograph filling the full height of the card's right edge. No icon fallback. */
function CardVisual({ image, title }: { image: StorefrontImage | null; title: string }) {
  if (!image) return null;

  return (
    <span className="relative block w-28 shrink-0 overflow-hidden bg-surface-muted sm:w-36">
      <Image
        alt={image.alt || title}
        className="object-cover transition-transform duration-500 motion-safe:group-hover:scale-105"
        fill
        sizes="144px"
        src={image.url}
      />
    </span>
  );
}

/** First tile whose label contains one of the given keywords. */
function matchTile(tiles: CategoryTile[], keywords: string[]): CategoryTile | undefined {
  return tiles.find((tile) => {
    const label = tile.label.toLowerCase();
    return keywords.some((keyword) => label.includes(keyword));
  });
}
