import type { Metadata } from "next";

import { CategoryCircles } from "@/components/home/CategoryCircles";
import { Hero } from "@/components/home/Hero";
import { Newsletter } from "@/components/home/Newsletter";
import { ProductSection } from "@/components/home/ProductSection";
import { PromoCards } from "@/components/home/PromoCards";
import { ServicesStrip } from "@/components/home/ServicesStrip";
import { WholesaleBanner } from "@/components/home/WholesaleBanner";
import { StoreShell } from "@/components/layout/StoreShell";
import { getCatalog } from "@/lib/storefront/catalog";
import { getCollections } from "@/lib/storefront/collections";
import {
  buildCategoryTiles,
  discountedProducts,
  excludeById,
} from "@/lib/storefront/merchandising";

export const metadata: Metadata = {
  title: "Everyday products at better prices",
  description:
    "Shop electronics, home and kitchen, beauty, accessories, toys, fitness, office supplies, fashion and thousands of everyday products at Kanay Store. Retail and wholesale, priced in INR.",
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  /**
   * Three requests, in parallel.
   *
   * Featured and newest are separate calls because they are genuinely different orderings
   * and the backend is the authority on both; asking once and re-sorting in the browser
   * would invent a "trending" order the catalog never expressed. Collections come from
   * their own endpoint so the category rail still works when the catalog request fails.
   */
  const [featuredResult, newestResult, collectionsResult] = await Promise.all([
    getCatalog({ availability: "SELLABLE", first: 10, sort: "FEATURED" }),
    getCatalog({ availability: "SELLABLE", first: 10, sort: "NEWEST" }),
    getCollections(),
  ]);

  const featured = featuredResult.ok ? featuredResult.data.products : [];
  const newest = newestResult.ok ? newestResult.data.products : [];

  const collections = collectionsResult.ok
    ? collectionsResult.data
    : featuredResult.ok
      ? featuredResult.data.filters.collections
      : [];

  const productTypes = featuredResult.ok ? featuredResult.data.filters.productTypes : [];

  // Collections first, product types as the fallback, so a store that has not built
  // collections yet still gets a category rail from real data.
  const categoryTiles = buildCategoryTiles({
    collections,
    productTypes,
    products: [...featured, ...newest],
    limit: 10,
  });

  const bestSellers = featured.slice(0, 10);
  // Trending drops anything already shown above: on a small catalog the two orderings
  // overlap almost completely, and repeating eight products under a second heading makes
  // the store look emptier than it is.
  const trending = excludeById(newest, bestSellers).slice(0, 10);
  // Deals is real or absent. Only products with a genuine compare-at saving qualify.
  const deals = discountedProducts([...featured, ...newest]).slice(0, 10);

  return (
    <StoreShell collections={collections}>
      <main>
        <Hero products={[...featured, ...newest]} />
        <CategoryCircles tiles={categoryTiles} />
        <PromoCards tiles={categoryTiles} />

        <ProductSection
          description="Popular products across the Kanay marketplace, priced in INR."
          id="best-sellers"
          loadFailed={!featuredResult.ok}
          priorityCount={4}
          products={bestSellers}
          title="Best sellers"
          tone="surface"
          viewAllHref="/shop"
        />

        <WholesaleBanner />

        {trending.length > 0 || !newestResult.ok ? (
          <ProductSection
            description="Discover useful products across electronics, home, lifestyle, accessories and more."
            id="trending"
            loadFailed={!newestResult.ok}
            products={trending}
            title="New arrivals"
            viewAllHref="/shop?sort=NEWEST"
            viewAllLabel="View new arrivals"
          />
        ) : null}

        {/* Rendered only when something is genuinely discounted - see discountedProducts. */}
        {deals.length > 0 ? (
          <ProductSection
            description="Products currently below their usual price. Savings are shown on each item."
            id="deals"
            products={deals}
            title="Deals"
            tone="surface"
            viewAllHref="/shop"
          />
        ) : null}

        <ServicesStrip />
        {/*
          NO TESTIMONIALS SECTION, DELIBERATELY.

          The reference design has one, and it was built - then removed. There is no review
          backend: nothing collects ratings and no order is linked to feedback. Any card
          here would carry an invented quote, an invented name and an invented star count,
          and a shopper reading it has no way to know that. Labelling it "sample" does not
          fix the impression it leaves; the first thing a visitor takes from a wall of
          five-star quotes is that other people have bought and been happy.

          When verified reviews exist in the backend, this is where they go.
        */}
        <Newsletter />
      </main>
    </StoreShell>
  );
}
