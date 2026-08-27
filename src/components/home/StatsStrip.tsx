import { IndianRupee, Layers, ShieldCheck, Truck } from "lucide-react";

import { formatMoney } from "@/lib/storefront/money";
import type { Money } from "@/lib/storefront/types";

/**
 * The four-figure credibility strip, directly under the hero.
 *
 * WHAT IS AND IS NOT A NUMBER HERE
 * --------------------------------
 * The brief for this section asked for stats. The obvious set — "12,000+ products",
 * "20–30 buyers daily", "500+ suppliers" — is not available to this page and mostly not
 * available to this system at all, so none of it appears.
 *
 * Two of the four cells carry a figure, and both are read from the live catalog on every
 * request:
 *
 *   • CATEGORIES is `filters.collections` plus `filters.productTypes`, de-duplicated.
 *     Those are facet lists describing the whole catalog, so the count is store-wide
 *     rather than the size of the slice the homepage fetched.
 *   • LOWEST PRICE is `filters.priceRange.min`, which the backend computes across the
 *     catalog and which is the number a buyer comparing suppliers actually looks for.
 *
 * The other two cells describe capabilities, not quantities, and are phrased as such.
 * There is no product total, because the catalog API is cursor-paginated and returns no
 * total: printing `products.length` here would be presenting "the ten products this page
 * asked for" as "the size of the store".
 *
 * A cell whose figure is unavailable falls back to its capability wording instead of a
 * zero. "0 categories" on a store that is still being set up is worse than saying nothing.
 */
export function StatsStrip({
  categoryCount,
  lowestPrice,
}: {
  categoryCount: number;
  lowestPrice: Money | null;
}) {
  const lowest = lowestPrice ? formatMoney(lowestPrice) : null;

  const stats = [
    {
      icon: Layers,
      value: categoryCount > 0 ? String(categoryCount) : "Multi",
      label: categoryCount > 0 ? "Categories in stock" : "Category sourcing",
      note: "Read from the live catalog",
    },
    {
      icon: IndianRupee,
      value: lowest ?? "INR",
      label: lowest ? "Lowest catalog price" : "Priced in rupees",
      note: lowest ? "Updates with the catalog" : "No currency conversion",
    },
    {
      icon: Truck,
      value: "India",
      label: "Delivered nationwide",
      note: "Shipping quoted at checkout",
    },
    {
      icon: ShieldCheck,
      value: "Razorpay",
      label: "Secured payments",
      note: "Card and UPI stay in Razorpay",
    },
  ];

  return (
    <section aria-labelledby="stats-heading" className="shell pt-8 lg:pt-12">
      <h2 className="sr-only" id="stats-heading">
        Kanay Store at a glance
      </h2>
      <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line shadow-[var(--shadow-card)] lg:grid-cols-4">
        {stats.map(({ icon: Icon, value, label, note }) => (
          <li className="bg-surface p-5 sm:p-6" key={label}>
            <span className="grid size-10 place-items-center rounded-[var(--radius-pill)] bg-brand-soft">
              <Icon aria-hidden="true" className="text-brand-ink" size={19} strokeWidth={1.8} />
            </span>
            <p className="mt-4 text-xl font-extrabold leading-none tracking-[-0.02em] sm:text-2xl">
              {value}
            </p>
            <p className="mt-2 text-[0.82rem] font-bold leading-5">{label}</p>
            <p className="mt-1 text-[0.72rem] leading-4 text-ink-subtle">{note}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
