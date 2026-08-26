import type { StorefrontProductSummary } from "@/lib/storefront/types";

import { ProductCard } from "./ProductCard";

export function ProductGrid({ products, priorityCount = 0 }: { products: StorefrontProductSummary[]; priorityCount?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-9 sm:gap-x-5 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-6">
      {products.map((product, index) => <ProductCard key={product.id} priority={index < priorityCount} product={product} />)}
    </div>
  );
}
