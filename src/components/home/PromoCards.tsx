import { ArrowRight, Boxes, Home, Smartphone } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import type { CategoryTile } from "@/lib/storefront/merchandising";
import type { StorefrontImage } from "@/lib/storefront/types";

/**
 * Three promotional cards, in the reference's peach treatment.
 *
 * These replace the old "Curated for right now" editorial mosaic, which was three
 * full-bleed fashion photographs with dark gradient overlays and 48px serif titles.
 *
 * Each card is a NAVIGATION destination, not an offer. The copy describes a department and
 * links to it; nothing here quotes a price or a saving, because promo cards are rendered
 * before any pricing has been read and a card that says "50% off home" would be inventing
 * that. The third card points at the wholesale section, which is discovery-only for the
 * same reason (quantity pricing is not in the backend contract yet).
 *
 * Imagery, where a card has any, comes from the matched collection or from a product in it.
 * Cards fall back to an icon on peach rather than to stock photography.
 */
export function PromoCards({ tiles }: { tiles: CategoryTile[] }) {
  // Match by intent so a store WITH a "Home" collection links to it, and a store without
  // one still gets a usable card pointing at the filtered catalog.
  const home = matchTile(tiles, ["home", "kitchen", "furnish", "decor", "appliance"]);
  const tech = matchTile(tiles, ["electronic", "tech", "mobile", "computer", "gadget", "audio"]);

  const cards = [
    {
      key: "home",
      eyebrow: "Home & living",
      title: "Home Essentials",
      text: "Everything for your everyday space — kitchen, storage, decor and appliances.",
      cta: "Shop home",
      href: home?.href ?? "/shop",
      image: home?.image ?? null,
      icon: Home,
      tone: "bg-surface-peach",
    },
    {
      key: "tech",
      eyebrow: "Tech & gadgets",
      title: "Tech & Accessories",
      text: "Smart essentials for work and life — audio, charging, computing and mobile.",
      cta: "Shop tech",
      href: tech?.href ?? "/shop",
      image: tech?.image ?? null,
      icon: Smartphone,
      tone: "bg-surface-peach-soft",
    },
    {
      key: "wholesale",
      eyebrow: "Buy in quantity",
      title: "Wholesale Enquiries",
      text: "Planning a bulk order? Browse the catalog and talk to us about quantities.",
      cta: "About wholesale",
      href: "/#wholesale",
      image: null,
      icon: Boxes,
      tone: "bg-surface-muted",
    },
  ] as const;

  return (
    <section aria-labelledby="promo-heading" className="shell pb-2">
      <h2 className="sr-only" id="promo-heading">
        Featured departments
      </h2>
      <ul className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <li key={card.key}>
            <Link
              className={`group flex h-full items-center gap-4 rounded-[var(--radius-card)] border border-line p-5 transition-colors hover:border-accent focus-visible:outline focus-visible:outline-2 ${card.tone}`}
              href={card.href}
            >
              <span className="min-w-0 flex-1">
                <span className="block text-[0.68rem] font-bold uppercase tracking-[0.12em] text-accent-ink">
                  {card.eyebrow}
                </span>
                <span className="mt-1.5 block text-lg font-extrabold leading-tight tracking-[-0.01em]">
                  {card.title}
                </span>
                <span className="mt-1.5 block text-[0.8rem] leading-5 text-ink-muted">{card.text}</span>
                <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-accent-ink">
                  {card.cta}
                  <ArrowRight
                    aria-hidden="true"
                    className="transition-transform motion-safe:group-hover:translate-x-0.5"
                    size={16}
                    strokeWidth={2}
                  />
                </span>
              </span>
              <CardVisual icon={card.icon} image={card.image} title={card.title} />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function CardVisual({
  image,
  icon: Icon,
  title,
}: {
  image: StorefrontImage | null;
  icon: typeof Home;
  title: string;
}) {
  if (image) {
    return (
      <span className="relative block size-[5.5rem] shrink-0 overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface sm:size-24">
        <Image alt={image.alt || title} className="object-cover" fill sizes="96px" src={image.url} />
      </span>
    );
  }

  return (
    <span className="grid size-[5.5rem] shrink-0 place-items-center rounded-[var(--radius-card)] border border-line bg-surface sm:size-24">
      <Icon aria-hidden="true" className="text-accent" size={30} strokeWidth={1.6} />
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
