import { formatMoney } from "@/lib/storefront/money";
import type { Money } from "@/lib/storefront/types";

/**
 * The at-a-glance strip, directly under the hero.
 *
 * IT IS A STRIP, NOT FOUR FEATURE BOXES
 * -------------------------------------
 * This was four bordered cards with an icon disc in each, which made a small amount of
 * information look like a dashboard widget. It is now one light band with hairline dividers:
 * same content, a quarter of the visual weight, and it stops competing with the hero directly
 * above it.
 *
 * WHERE THESE NUMBERS COME FROM — READ THIS BEFORE CHANGING THEM
 * -------------------------------------------------------------
 * Two kinds of figure are mixed here, and they are labelled differently on purpose.
 *
 * CATEGORIES is derived. It is `filters.collections` + `filters.productTypes`, de-duplicated —
 * facet lists that describe the whole catalog, so the count is store-wide rather than the size
 * of the slice this page fetched. When the catalog is reachable, the real number is shown; the
 * static figure is only a floor for when it is not.
 *
 * DAILY BUYERS and WHOLESALE PRODUCTS are STATIC BUSINESS FIGURES, stated by the store owner.
 * Nothing in this system can derive either one: there is no analytics pipeline, and the catalog
 * API is cursor-paginated with no total count. They are written as "25+" and "120+" — modest
 * floors rather than precise counts — and they are NOT presented as live or real-time anywhere
 * in the markup.
 *
 * The distinction matters. A conservative "25+ typical daily buyers" that the owner stands
 * behind is a business claim. "Live: 27 buyers today" would be a fabrication, because there is
 * no counter behind it. Do not add words like "live", "now" or "today" to these labels, and do
 * not make the numbers precise — a precise number implies a source.
 *
 * TO MAKE THEM REAL: a count endpoint on Trademart_B for the product total, and an orders
 * aggregate for buyers. Then move those two into the derived branch alongside categories.
 */
const STATED_DAILY_BUYERS = "25+";
const STATED_WHOLESALE_PRODUCTS = "120+";
const STATED_CATEGORIES_FLOOR = 15;

export function StatsStrip({
  categoryCount,
  lowestPrice,
}: {
  categoryCount: number;
  lowestPrice: Money | null;
}) {
  // The live count when the catalog answered, the owner's stated floor when it did not.
  const categories =
    categoryCount > 0 ? `${categoryCount}` : `${STATED_CATEGORIES_FLOOR}+`;

  /**
   * One colour per stat, as a dot and a short rule. Four hues, a few square pixels each.
   *
   * The brief is explicit that this must not become four giant coloured cards, and it is right:
   * the surface stays white and the colour is the smallest mark that still differentiates. Saturated
   * `mark` tokens are safe here because nothing sits on top of them - they are pure decoration.
   */
  const stats = [
    { value: STATED_DAILY_BUYERS, label: "Typical daily buyers", mark: "bg-tint-blue-mark" },
    { value: STATED_WHOLESALE_PRODUCTS, label: "Wholesale products", mark: "bg-tint-orange-mark" },
    { value: categories, label: "Categories", mark: "bg-tint-teal-mark" },
    {
      value: lowestPrice ? formatMoney(lowestPrice) : "India-wide",
      label: lowestPrice ? "Lowest unit price" : "Delivery support",
      mark: "bg-tint-green-mark",
    },
  ];

  return (
    <section aria-labelledby="stats-heading" className="shell pt-9 lg:pt-12">
      <h2 className="sr-only" id="stats-heading">
        Kanay Store at a glance
      </h2>
      <dl className="grid grid-cols-2 gap-y-8 rounded-[var(--radius-card)] border border-line bg-surface px-6 py-8 sm:px-8 lg:grid-cols-4 lg:gap-y-0 lg:px-12 lg:py-10 2xl:px-16">
        {stats.map((stat, index) => (
          <div
            className={`px-1 sm:px-2 lg:px-6 ${
              // Hairline dividers instead of four boxes. Suppressed on the first item in each
              // row so no divider ever hangs off the left edge of the strip.
              index % 2 === 0 ? "" : "border-l border-line"
            } ${index === 2 ? "lg:border-l" : ""}`}
            key={stat.label}
          >
            <dt className="sr-only">{stat.label}</dt>
            <dd>
              <span
                aria-hidden="true"
                className={`mb-3 block size-1.5 rounded-full ${stat.mark}`}
              />
              <span className="stat-figure block font-extrabold">
                {stat.value}
              </span>
              <span aria-hidden="true" className={`mt-3 block h-0.5 w-7 rounded-full ${stat.mark}`} />
              <span className="mt-3 block text-[0.8rem] font-semibold leading-5 text-ink-muted 2xl:text-[0.9rem]">
                {stat.label}
              </span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
