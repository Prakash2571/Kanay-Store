/**
 * Turning live catalog data into homepage merchandising, without inventing anything.
 *
 * WHY THIS MODULE EXISTS
 * ----------------------
 * The old homepage hard-coded five Unsplash fashion photographs and a hand-written
 * "editorial" narrative. That had two problems beyond looking like a clothing brand:
 *
 *   1. It described a catalog it had never read. A store whose top sellers are power
 *      banks and kitchen organisers showed a model in a trench coat.
 *   2. Every claim was decorative. "UP TO 50% OFF" in the reference design is a real
 *      merchandising promise, and printing it when nothing is discounted is a lie the
 *      customer discovers at checkout.
 *
 * So the homepage now derives its imagery, its category tiles and its discount badge
 * from the products and collections the backend actually returned. Everything here is
 * pure and unit-tested, because "did we just claim a discount that does not exist" is
 * not a question to answer by reading a rendered page.
 */

import { calculateDiscountPercent } from "./money";
import type {
  StorefrontCollectionSummary,
  StorefrontImage,
  StorefrontProductSummary,
} from "./types";

/**
 * The largest genuine discount in a set of products, as a whole percent.
 *
 * Returns null when nothing is discounted — and the caller must then show no badge at
 * all rather than a softer claim. `compareAtPrice` is the only evidence a discount
 * exists; it comes from Shopify through the backend, which has already refused to serve
 * a product whose pricing does not validate.
 *
 * Rounded DOWN on purpose. A 49.6% saving is "up to 49% off": rounding up to 50 would
 * overstate the best price in the store, which is the one number a shopper checks.
 */
export function maxDiscountPercent(products: StorefrontProductSummary[]): number | null {
  let best: number | null = null;

  for (const product of products) {
    const compareAt = product.compareAtPriceRange?.min ?? null;
    // calculateDiscountPercent is the single authority on how a saving is rounded, and it
    // floors - so a 49.6% saving reads as "up to 49% off" here and as "49% off" on the
    // card. Two different roundings would have the hero contradict the grid below it.
    const percent = calculateDiscountPercent(product.priceRange.min, compareAt);
    if (percent === null) continue;
    if (best === null || percent > best) best = percent;
  }

  return best;
}

/** Products that carry a real compare-at saving, best saving first. */
export function discountedProducts(
  products: StorefrontProductSummary[],
): StorefrontProductSummary[] {
  return products
    .map((product) => ({
      product,
      percent: calculateDiscountPercent(
        product.priceRange.min,
        product.compareAtPriceRange?.min ?? null,
      ),
    }))
    .filter((entry): entry is { product: StorefrontProductSummary; percent: number } =>
      entry.percent !== null,
    )
    .sort((left, right) => right.percent - left.percent)
    .map((entry) => entry.product);
}

/**
 * Products that carry a wholesale minimum order quantity, smallest minimum first.
 *
 * Smallest first because the row exists to get a buyer STARTED on bulk ordering, and a
 * lead card reading "MOQ 500" reads as "not for you" to most of the people looking at it.
 *
 * A product qualifies only when the backend sent a minimum greater than one. There is no
 * inferred wholesale flag and no "looks like a bulk product" heuristic: the merchant tags
 * a product `moq:<n>` or it is not a wholesale line, and the checkout enforces exactly the
 * same rule. That means this row can never advertise a bulk minimum the order will not
 * actually be held to, in either direction.
 */
export function wholesaleProducts(
  products: StorefrontProductSummary[],
): StorefrontProductSummary[] {
  return products
    .filter((product) => {
      const minimum = product.minimumOrderQuantity;
      return typeof minimum === "number" && Number.isSafeInteger(minimum) && minimum > 1;
    })
    .sort((left, right) => (left.minimumOrderQuantity ?? 0) - (right.minimumOrderQuantity ?? 0));
}

/**
 * How many distinct categories the store has, counting a collection and a product type of
 * the same name once.
 *
 * This is the only product-side number the stats strip is allowed to print, because it is
 * the only one the catalog response actually establishes store-wide: `filters.collections`
 * and `filters.productTypes` are facet lists covering the whole catalog, not just the page
 * of products that came back. A product COUNT is deliberately not derived here - the API is
 * cursor-paginated and returns no total, so any figure would be the size of the slice the
 * homepage happened to request, dressed up as the size of the store.
 */
export function distinctCategoryCount(input: {
  collections: StorefrontCollectionSummary[];
  productTypes?: string[];
}): number {
  const labels = new Set<string>();

  for (const collection of input.collections) {
    const normalised = collection.title.trim().toLowerCase();
    if (normalised !== "") labels.add(normalised);
  }
  for (const productType of input.productTypes ?? []) {
    const normalised = productType.trim().toLowerCase();
    if (normalised !== "") labels.add(normalised);
  }

  return labels.size;
}

export interface CategoryTile {
  /** Stable key for React, and the thing that makes two tiles the "same" tile. */
  key: string;
  label: string;
  href: string;
  image: StorefrontImage | null;
}

/** Slug-safe form of a free-text product type, so it round-trips through a query string. */
function encodeType(productType: string): string {
  return encodeURIComponent(productType);
}

/**
 * Category tiles for the circular rail.
 *
 * Collections come first because a merchant curated them and gave them imagery. Product
 * types fill any remainder: Shopify's `productType` is the closest thing to a category on
 * a store that has not built collections yet, and a new store with 40 products and no
 * collections should still get a usable category row rather than an empty one.
 *
 * Product-type tiles borrow a photograph from a product of that type, so the rail is
 * illustrated by real merchandise instead of stock imagery.
 */
export function buildCategoryTiles(input: {
  collections: StorefrontCollectionSummary[];
  productTypes?: string[];
  products?: StorefrontProductSummary[];
  limit?: number;
}): CategoryTile[] {
  const limit = input.limit ?? 10;
  const tiles: CategoryTile[] = [];
  const seenLabels = new Set<string>();

  const claim = (label: string): boolean => {
    const normalised = label.trim().toLowerCase();
    if (normalised === "" || seenLabels.has(normalised)) return false;
    seenLabels.add(normalised);
    return true;
  };

  for (const collection of input.collections) {
    if (tiles.length >= limit) break;
    if (!claim(collection.title)) continue;
    tiles.push({
      key: `collection:${collection.id}`,
      label: collection.title,
      href: `/collections/${collection.handle}`,
      image: collection.image ?? null,
    });
  }

  for (const productType of input.productTypes ?? []) {
    if (tiles.length >= limit) break;
    if (!claim(productType)) continue;
    const illustration =
      (input.products ?? []).find(
        (product) => product.productType === productType && product.images[0],
      )?.images[0] ?? null;
    tiles.push({
      key: `type:${productType}`,
      label: productType,
      href: `/shop?productType=${encodeType(productType)}`,
      image: illustration,
    });
  }

  return tiles;
}

/**
 * Images for the hero collage.
 *
 * One image per product, and at most one per product type, so the collage shows a
 * SPREAD of the catalog rather than four angles of the same pair of earbuds — which is
 * the whole point of the hero on a multi-category store.
 *
 * Returns fewer than `count` (including none) when the catalog cannot fill it. The hero
 * renders an illustrated fallback in that case; it must never pad with stock photography,
 * because that is how a general store starts looking like a fashion label again.
 */
export function heroCollageImages(
  products: StorefrontProductSummary[],
  count = 4,
): { image: StorefrontImage; title: string }[] {
  const picked: { image: StorefrontImage; title: string }[] = [];
  const usedTypes = new Set<string>();
  // Tracked separately from `usedTypes` because the second pass drops the type rule but
  // must still never show the same product twice - which is exactly what happened before
  // this set existed: a two-product, one-category catalog rendered the first product, then
  // rendered it again in the relaxed pass.
  const pickedIds = new Set<string>();

  const take = (product: StorefrontProductSummary, enforceTypeSpread: boolean): void => {
    if (picked.length >= count) return;
    if (pickedIds.has(product.id)) return;
    const image = product.images[0];
    if (!image) return;
    const type = (product.productType ?? "").trim().toLowerCase();
    if (enforceTypeSpread && type !== "" && usedTypes.has(type)) return;
    if (type !== "") usedTypes.add(type);
    pickedIds.add(product.id);
    picked.push({ image, title: product.title });
  };

  for (const product of products) take(product, true);
  // Second pass without the spread rule: a catalog of one category should still show a
  // full collage rather than a single tile.
  for (const product of products) take(product, false);

  return picked;
}

/**
 * Deduplicates two product lists by id, keeping the order of the first.
 *
 * The homepage asks the backend for "featured" and "newest" separately, and on a small
 * catalog those are largely the same products. Showing the same eight items twice under
 * two headings makes the store look empty, so Trending drops anything already shown.
 */
export function excludeById(
  products: StorefrontProductSummary[],
  alreadyShown: StorefrontProductSummary[],
): StorefrontProductSummary[] {
  const shown = new Set(alreadyShown.map((product) => product.id));
  return products.filter((product) => !shown.has(product.id));
}
