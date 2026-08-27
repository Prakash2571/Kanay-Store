import { describe, expect, it } from "vitest";

import {
  buildCategoryTiles,
  discountedProducts,
  distinctCategoryCount,
  excludeById,
  heroCollageImages,
  maxDiscountPercent,
  wholesaleProducts,
} from "./merchandising";
import type {
  StorefrontCollectionSummary,
  StorefrontProductSummary,
} from "./types";

/**
 * The homepage claims things. These tests are about making sure it only claims true ones.
 *
 * The reference design puts a large "UP TO 50% OFF" badge in the hero. Hard-coding that
 * would be a promise the checkout cannot keep, so the badge is computed from real
 * compare-at prices - and the interesting cases are all the ones where it must say
 * NOTHING.
 */

function product(overrides: Partial<StorefrontProductSummary> = {}): StorefrontProductSummary {
  return {
    id: overrides.id ?? "p1",
    shopifyProductId: "gid://shopify/Product/1",
    handle: overrides.handle ?? "product-1",
    title: overrides.title ?? "Wireless earbuds",
    descriptionExcerpt: "",
    productType: overrides.productType ?? "Electronics",
    vendorPublicName: null,
    images: overrides.images ?? [
      { url: "https://cdn.shopify.com/earbuds.jpg", alt: "Earbuds", width: null, height: null },
    ],
    priceRange: overrides.priceRange ?? {
      min: { amount: "1999.00", currencyCode: "INR" },
      max: { amount: "1999.00", currencyCode: "INR" },
    },
    compareAtPriceRange: overrides.compareAtPriceRange ?? null,
    availableForSale: true,
    availability: "SELLABLE",
    collections: [],
    quickAddVariant: null,
    ...overrides,
  } as StorefrontProductSummary;
}

function collection(
  overrides: Partial<StorefrontCollectionSummary> = {},
): StorefrontCollectionSummary {
  return {
    id: overrides.id ?? "c1",
    handle: overrides.handle ?? "home-kitchen",
    title: overrides.title ?? "Home & Kitchen",
    description: "",
    image: overrides.image ?? null,
    seo: null,
    ...overrides,
  } as StorefrontCollectionSummary;
}

const priced = (amount: string, compareAt?: string): Partial<StorefrontProductSummary> => ({
  priceRange: {
    min: { amount, currencyCode: "INR" },
    max: { amount, currencyCode: "INR" },
  },
  compareAtPriceRange: compareAt
    ? {
        min: { amount: compareAt, currencyCode: "INR" },
        max: { amount: compareAt, currencyCode: "INR" },
      }
    : null,
});

describe("maxDiscountPercent", () => {
  it("is null when nothing is discounted", () => {
    // The hero must then show NO badge. A softer claim would still be a claim.
    expect(maxDiscountPercent([product(priced("1999.00"))])).toBeNull();
  });

  it("is null for an empty catalog", () => {
    expect(maxDiscountPercent([])).toBeNull();
  });

  it("reports the best genuine saving", () => {
    const products = [
      product({ id: "a", ...priced("900.00", "1000.00") }), // 10%
      product({ id: "b", ...priced("500.00", "1000.00") }), // 50%
      product({ id: "c", ...priced("990.00", "1000.00") }), // 1%
    ];
    expect(maxDiscountPercent(products)).toBe(50);
  });

  it("rounds DOWN, so the best price in the store is never overstated", () => {
    // 49.6% must read as "up to 49% off". Rounding up to 50 would advertise a price
    // nothing in the catalog actually has.
    expect(maxDiscountPercent([product(priced("504.00", "1000.00"))])).toBe(49);
  });

  it("ignores a compare-at price that is not a discount", () => {
    // Equal or lower compare-at prices happen through data-entry mistakes in Shopify.
    // Treating them as discounts would invent a saving of 0% or a negative one.
    expect(maxDiscountPercent([product(priced("1000.00", "1000.00"))])).toBeNull();
    expect(maxDiscountPercent([product(priced("1200.00", "1000.00"))])).toBeNull();
  });
});

describe("discountedProducts", () => {
  it("keeps only real savings, best first", () => {
    const products = [
      product({ id: "a", ...priced("900.00", "1000.00") }),
      product({ id: "b", ...priced("1999.00") }),
      product({ id: "c", ...priced("400.00", "1000.00") }),
    ];

    expect(discountedProducts(products).map((entry) => entry.id)).toEqual(["c", "a"]);
  });

  it("returns nothing rather than falling back to full-price items", () => {
    // A "Deals" row filled with undiscounted products is the same lie as a fake badge.
    expect(discountedProducts([product(priced("1999.00"))])).toEqual([]);
  });
});

describe("buildCategoryTiles", () => {
  it("prefers merchant-curated collections", () => {
    const tiles = buildCategoryTiles({
      collections: [collection({ id: "c1", title: "Electronics", handle: "electronics" })],
      productTypes: ["Kitchen"],
      limit: 5,
    });

    expect(tiles[0]).toMatchObject({
      label: "Electronics",
      href: "/collections/electronics",
    });
  });

  it("falls back to product types so a store with no collections still gets a rail", () => {
    const tiles = buildCategoryTiles({
      collections: [],
      productTypes: ["Home & Kitchen", "Beauty"],
    });

    expect(tiles.map((tile) => tile.label)).toEqual(["Home & Kitchen", "Beauty"]);
    expect(tiles[0]?.href).toBe("/shop?productType=Home%20%26%20Kitchen");
  });

  it("illustrates a product-type tile with a real product photo", () => {
    // So the rail shows actual merchandise rather than stock photography.
    const tiles = buildCategoryTiles({
      collections: [],
      productTypes: ["Beauty"],
      products: [
        product({
          id: "b1",
          productType: "Beauty",
          images: [{ url: "https://cdn.shopify.com/serum.jpg", alt: "Serum", width: null, height: null }],
        }),
      ],
    });

    expect(tiles[0]?.image?.url).toBe("https://cdn.shopify.com/serum.jpg");
  });

  it("never repeats a category, whichever source it came from", () => {
    // A collection called "Electronics" and a product type called "electronics" are the
    // same aisle to a shopper.
    const tiles = buildCategoryTiles({
      collections: [collection({ title: "Electronics", handle: "electronics" })],
      productTypes: ["electronics", "Toys"],
    });

    expect(tiles.map((tile) => tile.label)).toEqual(["Electronics", "Toys"]);
  });

  it("skips blank labels", () => {
    // Shopify's productType is free text and is frequently an empty string.
    const tiles = buildCategoryTiles({ collections: [], productTypes: ["", "  ", "Toys"] });
    expect(tiles.map((tile) => tile.label)).toEqual(["Toys"]);
  });

  it("respects the limit, because the rail has a fixed row on desktop", () => {
    const tiles = buildCategoryTiles({
      collections: [],
      productTypes: ["A", "B", "C", "D", "E"],
      limit: 3,
    });
    expect(tiles).toHaveLength(3);
  });
});

describe("heroCollageImages", () => {
  const withType = (id: string, type: string, url: string) =>
    product({
      id,
      productType: type,
      images: [{ url, alt: type, width: null, height: null }],
    });

  it("spreads across categories, which is the entire point of the hero", () => {
    const products = [
      withType("1", "Electronics", "a.jpg"),
      withType("2", "Electronics", "b.jpg"),
      withType("3", "Home", "c.jpg"),
      withType("4", "Beauty", "d.jpg"),
      withType("5", "Fitness", "e.jpg"),
    ];

    expect(heroCollageImages(products, 4).map((entry) => entry.image.url)).toEqual([
      "a.jpg",
      "c.jpg",
      "d.jpg",
      "e.jpg",
    ]);
  });

  it("fills the collage anyway when the catalog is single-category", () => {
    // A new store selling only phone cases should still get a complete hero.
    const products = [
      withType("1", "Accessories", "a.jpg"),
      withType("2", "Accessories", "b.jpg"),
      withType("3", "Accessories", "c.jpg"),
    ];

    expect(heroCollageImages(products, 3)).toHaveLength(3);
  });

  it("returns fewer images rather than padding with anything invented", () => {
    expect(heroCollageImages([], 4)).toEqual([]);
    expect(heroCollageImages([product({ images: [] })], 4)).toEqual([]);
  });

  it("never repeats the same product", () => {
    const products = [withType("1", "Toys", "a.jpg"), withType("2", "Toys", "b.jpg")];
    const urls = heroCollageImages(products, 4).map((entry) => entry.image.url);

    expect(new Set(urls).size).toBe(urls.length);
  });

  it("carries the product title, so the image can have a real alt text", () => {
    const entries = heroCollageImages([withType("1", "Home", "a.jpg")], 1);
    expect(entries[0]?.title).toBe("Wireless earbuds");
  });
});

describe("excludeById", () => {
  it("stops the same products appearing under two headings", () => {
    // On a small catalog "featured" and "newest" overlap almost completely, and showing
    // the same eight items twice makes the store look empty.
    const shown = [product({ id: "a" }), product({ id: "b" })];
    const newest = [product({ id: "b" }), product({ id: "c" })];

    expect(excludeById(newest, shown).map((entry) => entry.id)).toEqual(["c"]);
  });

  it("preserves order", () => {
    const newest = [product({ id: "c" }), product({ id: "d" })];
    expect(excludeById(newest, []).map((entry) => entry.id)).toEqual(["c", "d"]);
  });
});


/**
 * The "Wholesale deals" row.
 *
 * The row's whole claim is "these products are sold in bulk, and this is the minimum". It is
 * only allowed to include a product the BACKEND said has a minimum, because the checkout
 * enforces that same tag-derived number and a row that guessed would be advertising terms
 * the order will not be held to.
 */
describe("wholesaleProducts", () => {
  it("keeps only products the backend gave a minimum above one", () => {
    const result = wholesaleProducts([
      product({ id: "no-field" }),
      product({ id: "explicit-null", minimumOrderQuantity: null }),
      product({ id: "one", minimumOrderQuantity: 1 }),
      product({ id: "bulk", minimumOrderQuantity: 12 }),
    ]);

    expect(result.map((entry) => entry.id)).toEqual(["bulk"]);
  });

  it("treats a minimum of exactly one as no minimum", () => {
    // A product that can be bought singly is not a wholesale line, even though the merchant
    // wrote the tag out. Including it would put a "MOQ 1" badge in a bulk row.
    expect(wholesaleProducts([product({ id: "one", minimumOrderQuantity: 1 })])).toEqual([]);
  });

  it("orders by smallest minimum first", () => {
    // Lowest barrier to entry leads. A row whose first card reads "MOQ 500" tells most
    // visitors the section is not for them.
    const result = wholesaleProducts([
      product({ id: "big", minimumOrderQuantity: 500 }),
      product({ id: "small", minimumOrderQuantity: 6 }),
      product({ id: "mid", minimumOrderQuantity: 50 }),
    ]);

    expect(result.map((entry) => entry.id)).toEqual(["small", "mid", "big"]);
  });

  it("rejects a non-integer minimum instead of rounding it", () => {
    // 2.5 units is not orderable, and rounding would invent a rule nobody set.
    expect(wholesaleProducts([product({ id: "odd", minimumOrderQuantity: 2.5 })])).toEqual([]);
  });

  it("does not mutate the array it was given", () => {
    const input = [
      product({ id: "big", minimumOrderQuantity: 500 }),
      product({ id: "small", minimumOrderQuantity: 6 }),
    ];
    wholesaleProducts(input);
    expect(input.map((entry) => entry.id)).toEqual(["big", "small"]);
  });
});

/**
 * The one product-side FIGURE the stats strip prints.
 *
 * It has to be store-wide, which is why it is derived from the catalog's filter facets and
 * not from the ten products the homepage fetched. These tests pin the de-duplication, because
 * a store with a "Home & Kitchen" collection AND a "Home & Kitchen" product type has one
 * category, not two, and "18 categories" on a store with nine is the kind of inflated number
 * this section exists to avoid.
 */
describe("distinctCategoryCount", () => {
  it("counts collections and product types together", () => {
    const count = distinctCategoryCount({
      collections: [collection({ id: "c1", title: "Home & Kitchen" })],
      productTypes: ["Electronics", "Tools"],
    });

    expect(count).toBe(3);
  });

  it("counts a collection and a product type of the same name once", () => {
    const count = distinctCategoryCount({
      collections: [collection({ id: "c1", title: "Home & Kitchen" })],
      productTypes: ["home & kitchen", "Tools"],
    });

    expect(count).toBe(2);
  });

  it("ignores blank labels rather than counting them", () => {
    const count = distinctCategoryCount({
      collections: [],
      productTypes: ["", "   ", "Tools"],
    });

    expect(count).toBe(1);
  });

  it("is zero on an empty store, so the strip can fall back to wording", () => {
    // "0 categories" is worse than saying nothing, and the caller relies on this being 0
    // rather than throwing or guessing.
    expect(distinctCategoryCount({ collections: [] })).toBe(0);
  });
});
