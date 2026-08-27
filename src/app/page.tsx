import type { Metadata } from "next";

import { BrandQuote } from "@/components/home/BrandQuote";
import { BrandStory } from "@/components/home/BrandStory";
import { CategoryCircles } from "@/components/home/CategoryCircles";
import { Hero } from "@/components/home/Hero";
import { Newsletter } from "@/components/home/Newsletter";
import { ProductSection } from "@/components/home/ProductSection";
import { PromoCards } from "@/components/home/PromoCards";
import { ServicesStrip } from "@/components/home/ServicesStrip";
import { StatsStrip } from "@/components/home/StatsStrip";
import { WhyKanay } from "@/components/home/WhyKanay";
import { WholesaleBanner } from "@/components/home/WholesaleBanner";
import { StoreShell } from "@/components/layout/StoreShell";
import { getCatalog } from "@/lib/storefront/catalog";
import { getCollections } from "@/lib/storefront/collections";
import {
  buildCategoryTiles,
  discountedProducts,
  distinctCategoryCount,
  excludeById,
  wholesaleProducts,
} from "@/lib/storefront/merchandising";

export const metadata: Metadata = {
  title: "Wholesale and retail, priced per unit",
  description:
    "Buy in bulk or one at a time across electronics, home and kitchen, tools, office supplies, beauty, accessories and thousands of everyday products. Minimum order quantities shown up front, priced in INR.",
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
    getCatalog({ availability: "SELLABLE", first: 12, sort: "FEATURED" }),
    getCatalog({ availability: "SELLABLE", first: 12, sort: "NEWEST" }),
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
    limit: 12,
  });

  /**
   * The two figures the stats strip is allowed to print.
   *
   * Both come from the catalog's FILTER facets, which describe the whole catalog, not from
   * `products.length`, which is only the ten items this page asked for. `priceRange` is null
   * when the catalog request failed or the store is empty, and the strip falls back to
   * wording rather than printing a zero.
   */
  const categoryCount = distinctCategoryCount({ collections, productTypes });
  const lowestPrice = featuredResult.ok
    ? (featuredResult.data.filters.priceRange?.min ?? null)
    : null;

  /**
   * Twelve per row, not ten.
   *
   * The grids are 2 / 3 / 4 / 6 columns and twelve divides by every one of them, so no breakpoint
   * ends in a half-empty row. Ten only ever divided by the old 5-column step.
   */
  const bestSellers = featured.slice(0, 12);
  // Trending drops anything already shown above: on a small catalog the two orderings
  // overlap almost completely, and repeating eight products under a second heading makes
  // the store look emptier than it is.
  const trending = excludeById(newest, bestSellers).slice(0, 12);
  // Deals is real or absent. Only products with a genuine compare-at saving qualify.
  const deals = discountedProducts([...featured, ...newest]).slice(0, 12);
  // Bulk lines are the ones the merchant tagged `moq:<n>`. Never inferred, so this row
  // cannot advertise a minimum the checkout will not hold the order to.
  const bulk = wholesaleProducts([...featured, ...newest]).slice(0, 12);

  return (
    <StoreShell collections={collections}>
      <main>
        <Hero products={[...featured, ...newest]} />
        <StatsStrip categoryCount={categoryCount} lowestPrice={lowestPrice} />
        <CategoryCircles tiles={categoryTiles} />
        <PromoCards tiles={categoryTiles} />

        <ProductSection
          // "Featured", not "Best seller": FEATURED is the merchant's manual merchandising order,
          // and nothing in this system records units sold.
          badge="featured"
          description="Popular products across the Kanay marketplace, priced per unit in INR."
          id="best-sellers"
          loadFailed={!featuredResult.ok}
          // Six, not four: the first row of the best-sellers grid is six cards wide at 2xl, and a
          // lazy-loaded image in the first visible row is a Largest-Contentful-Paint regression.
          priorityCount={6}
          products={bestSellers}
          title="Best sellers"
          tone="surface"
          viewAllHref="/shop"
        />

        {/*
          Rendered only when the catalog actually contains bulk lines. An empty "Wholesale
          deals" heading on a store with no MOQ products would be advertising a capability
          with nothing behind it, which is the specific failure mode this whole redesign is
          trying to avoid.
        */}
        {bulk.length > 0 ? (
          <ProductSection
            description="Products sold in bulk. The minimum order quantity is shown on each item and enforced at checkout."
            id="wholesale-deals"
            products={bulk}
            title="Wholesale deals"
            viewAllHref="/shop"
            viewAllLabel="View all products"
          />
        ) : null}

        <WholesaleBanner />

        {trending.length > 0 || !newestResult.ok ? (
          <ProductSection
            badge="new"
            description="Recently added across electronics, home, tools, office, lifestyle and more."
            id="trending"
            loadFailed={!newestResult.ok}
            products={trending}
            title="New arrivals"
            tone="surface"
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
            viewAllHref="/shop"
          />
        ) : null}

        <WhyKanay />
        {/*
          The brand-story banner goes here: lower-middle, after the benefits and before the quote.
          It is the one dark, photographic block on the page, so it breaks up a long run of light
          sections at the point where they start to blur together.
        */}
        <BrandStory />
        <BrandQuote />
        {/*
          The services strip sits between the quote and the newsletter rather than above the
          quote: it is the lightest block on the page, and putting it directly after a heading
          block made both look like filler.
        */}
        <ServicesStrip />
        {/*
          NO TESTIMONIALS SECTION, DELIBERATELY.

          The reference design has one, and it was built - then removed. There is no review
          backend: nothing collects ratings and no order is linked to feedback. Any card
          here would carry an invented quote, an invented name and an invented star count,
          and a shopper reading it has no way to know that. Labelling it "sample" does not
          fix the impression it leaves; the first thing a visitor takes from a wall of
          five-star quotes is that other people have bought and been happy.

          The BrandQuote band above is the honest version of this section: it is the store's
          own positioning statement, in the store's own voice, attributed to nobody.

          When verified reviews exist in the backend, this is where they go.
        */}
        <Newsletter />
      </main>
    </StoreShell>
  );
}
