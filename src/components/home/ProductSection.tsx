import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { ProductCard, type ProductCardBadge } from "@/components/commerce/ProductCard";
import type { StorefrontProductSummary } from "@/lib/storefront/types";

/**
 * A titled product row: Best Sellers, Trending, Deals.
 *
 * One component for all three because the only differences are the heading, the link and
 * the data — and three near-identical sections is how "Best sellers" ends up with a grid
 * that behaves differently from "Trending".
 *
 * Grid density follows the reference: 2 columns on mobile (a shopper comparing prices wants
 * two side by side, not one enormous card), 3 on tablet, 4 from lg and 5 from xl.
 */
export function ProductSection({
  id,
  title,
  description,
  products,
  viewAllHref,
  viewAllLabel = "View all products",
  emptyMessage,
  loadFailed = false,
  priorityCount = 0,
  tone = "canvas",
  badge,
}: {
  id: string;
  title: string;
  description?: string;
  products: StorefrontProductSummary[];
  viewAllHref: string;
  viewAllLabel?: string;
  emptyMessage?: string;
  loadFailed?: boolean;
  priorityCount?: number;
  tone?: "canvas" | "surface";
  /**
   * Badge applied to every card in this row. Set by the caller because only the caller knows what
   * the row IS - the card cannot tell "featured order" from "newest order" by looking at a product.
   */
  badge?: ProductCardBadge;
}) {
  const headingId = `${id}-heading`;

  return (
    <section
      aria-labelledby={headingId}
      className={tone === "surface" ? "border-y border-line bg-surface" : ""}
      id={id}
    >
      <div className="shell section-y">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
          <div>
            <h2 className="text-xl font-extrabold tracking-[-0.01em] sm:text-2xl" id={headingId}>
              {title}
            </h2>
            {description ? (
              <p className="mt-1.5 max-w-[60ch] text-sm leading-6 text-ink-muted">{description}</p>
            ) : null}
          </div>
          <Link
            className="inline-flex shrink-0 items-center gap-1.5 rounded text-sm font-bold text-brand-ink transition-colors hover:text-brand-ink focus-visible:outline focus-visible:outline-2"
            href={viewAllHref}
          >
            {viewAllLabel}
            <ArrowRight aria-hidden="true" size={16} strokeWidth={2} />
          </Link>
        </div>

        {products.length > 0 ? (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
            {products.map((product, index) => (
              <li className="min-w-0" key={product.id}>
                <ProductCard badge={badge} priority={index < priorityCount} product={product} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-[var(--radius-card)] border border-line bg-surface px-5 py-10 text-center text-sm text-ink-muted">
            {loadFailed
              ? "These products could not be loaded right now. Refresh the page or try again shortly."
              : (emptyMessage ?? "No products are available here yet.")}
          </p>
        )}
      </div>
    </section>
  );
}
