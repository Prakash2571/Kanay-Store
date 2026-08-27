import type { StorefrontProductSummary } from "@/lib/storefront/types";

import { ProductCard } from "./ProductCard";

/**
 * The catalog grid, used by /shop, /search and collection pages.
 *
 * Density matches the homepage rows and the reference: 2 columns on mobile so prices can be
 * compared side by side, 3 on tablet, 4 from lg, 5 from xl. The old grid was 2/3/4 with a
 * 36px row gap, which was tuned for tall portrait fashion imagery; cards are now
 * self-contained bordered tiles, so the gap is even and much tighter.
 */
export function ProductGrid({
  products,
  priorityCount = 0,
}: {
  products: StorefrontProductSummary[];
  priorityCount?: number;
}) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-5 2xl:grid-cols-6 2xl:gap-6">
      {products.map((product, index) => (
        <li className="min-w-0" key={product.id}>
          <ProductCard priority={index < priorityCount} product={product} />
        </li>
      ))}
    </ul>
  );
}
