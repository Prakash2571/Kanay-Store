import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { ProductCard } from "@/components/commerce/ProductCard";
import type { StorefrontProductSummary } from "@/lib/storefront/types";

export function BestSellers({ products, loadFailed = false }: { products: StorefrontProductSummary[]; loadFailed?: boolean }) {
  return (
    <section aria-labelledby="best-sellers-heading" className="border-y border-line bg-surface py-14 lg:py-20">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
        <div className="mb-7">
          <h2 className="font-serif text-4xl font-semibold tracking-[-0.025em] sm:text-5xl" id="best-sellers-heading">Best sellers</h2>
          <p className="mt-2 max-w-lg text-sm leading-6 text-ink-muted">Current featured products from the live Kanay catalog.</p>
        </div>
        {products.length ? (
          <div className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-3 sm:-mx-8 sm:px-8 lg:mx-0 lg:grid lg:grid-cols-4 lg:gap-6 lg:overflow-visible lg:px-0 lg:pb-0">
            {products.slice(0, 8).map((product, index) => (
              <div className="w-[72vw] max-w-[19rem] shrink-0 snap-start sm:w-[40vw] lg:w-auto" key={product.id}>
                <ProductCard priority={index < 2} product={product} />
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-line bg-canvas px-6 py-12 text-center">
            <p className="font-serif text-2xl font-semibold">{loadFailed ? "The latest products could not be loaded." : "No featured products are available yet."}</p>
            <p className="mt-2 text-sm text-ink-muted">{loadFailed ? "Refresh the page or try again shortly." : "Only approved, sellable products appear here."}</p>
          </div>
        )}
        <Link className="mt-8 inline-flex min-h-11 items-center gap-2 border-b border-ink text-sm font-bold transition-colors hover:text-accent-ink focus-visible:outline focus-visible:outline-2" href="/shop">
          View all products <ArrowRight aria-hidden="true" size={17} strokeWidth={1.75} />
        </Link>
      </div>
    </section>
  );
}
