import { describe, expect, it } from "vitest";

import {
  buildBreadcrumbJsonLd,
  buildProductJsonLd,
  serializeJsonLd,
} from "./structured-data";
import type { StorefrontProduct } from "../storefront/types";

/**
 * Structured data is published as plain text in the page source and then never looked at
 * again. That makes it the easiest place to (a) contradict the visible page and (b) leak
 * internal data without noticing. These tests exist for both.
 */

const ORIGIN = "https://kanay.example.com";

function variant(overrides: Record<string, unknown> = {}) {
  return {
    id: "v_1",
    shopifyVariantId: "gid://shopify/ProductVariant/1",
    title: "Black / M",
    selectedOptions: [
      { name: "Colour", value: "Black" },
      { name: "Size", value: "M" },
    ],
    availableForSale: true,
    availability: "SELLABLE",
    price: { amount: "1499.00", currencyCode: "INR" },
    skuPublic: "TEE-BLK-M",
    ...overrides,
  };
}

function product(overrides: Record<string, unknown> = {}): StorefrontProduct {
  return {
    id: "p_1",
    handle: "black-tee",
    title: "Black Tee",
    description: "A comfortable tee.",
    descriptionExcerpt: "A comfortable tee.",
    vendorPublicName: "Kanay",
    images: [{ url: "https://cdn.shopify.com/a.jpg", alt: "Black Tee" }],
    priceRange: {
      min: { amount: "1499.00", currencyCode: "INR" },
      max: { amount: "1499.00", currencyCode: "INR" },
    },
    availableForSale: true,
    availability: "SELLABLE",
    collections: [{ id: "c_1", handle: "tees", title: "Tees" }],
    variants: [variant()],
    options: [{ name: "Colour", values: ["Black"] }],
    ...overrides,
  } as unknown as StorefrontProduct;
}

describe("product JSON-LD takes its currency from the price, not a constant", () => {
  it("uses the variant's own currencyCode", () => {
    const data = buildProductJsonLd(product(), ORIGIN);
    expect(data.offers[0]?.priceCurrency).toBe("INR");
  });

  it("REGRESSION: a non-INR store is not published as INR", () => {
    // priceCurrency was hardcoded "INR". A store priced in any other currency was
    // publishing machine-readable prices that contradicted its own checkout.
    const data = buildProductJsonLd(
      product({
        variants: [variant({ price: { amount: "19.99", currencyCode: "GBP" } })],
      }),
      ORIGIN,
    );

    expect(data.offers[0]?.priceCurrency).toBe("GBP");
    expect(JSON.stringify(data)).not.toContain("INR");
  });

  it("normalises the currency code to upper case", () => {
    const data = buildProductJsonLd(
      product({ variants: [variant({ price: { amount: "10.00", currencyCode: "usd" } })] }),
      ORIGIN,
    );
    expect(data.offers[0]?.priceCurrency).toBe("USD");
  });

  it("emits one offer per variant, with its own price", () => {
    const data = buildProductJsonLd(
      product({
        variants: [
          variant({ id: "v_1", price: { amount: "1499.00", currencyCode: "INR" } }),
          variant({ id: "v_2", price: { amount: "1799.00", currencyCode: "INR" } }),
        ],
      }),
      ORIGIN,
    );

    expect(data.offers).toHaveLength(2);
    expect(data.offers.map((offer) => offer.price)).toEqual(["1499.00", "1799.00"]);
  });
});

describe("availability in JSON-LD matches the variant", () => {
  it("reports InStock for a sellable variant", () => {
    const data = buildProductJsonLd(product(), ORIGIN);
    expect(data.offers[0]?.availability).toBe("https://schema.org/InStock");
  });

  it("reports OutOfStock for an unavailable variant", () => {
    const data = buildProductJsonLd(
      product({ variants: [variant({ availableForSale: false })] }),
      ORIGIN,
    );
    expect(data.offers[0]?.availability).toBe("https://schema.org/OutOfStock");
  });
});

describe("a missing or malformed price is omitted, never published as zero", () => {
  it("drops a variant with no amount", () => {
    const data = buildProductJsonLd(
      product({ variants: [variant({ price: { amount: "", currencyCode: "INR" } })] }),
      ORIGIN,
    );
    expect(data.offers).toEqual([]);
  });

  it("drops a variant with no currency", () => {
    const data = buildProductJsonLd(
      product({ variants: [variant({ price: { amount: "10.00", currencyCode: "" } })] }),
      ORIGIN,
    );
    expect(data.offers).toEqual([]);
  });

  it("drops a non-numeric amount rather than emitting it", () => {
    // A machine-readable price of "free" or "0" is a worse claim than no offer.
    const data = buildProductJsonLd(
      product({ variants: [variant({ price: { amount: "free", currencyCode: "INR" } })] }),
      ORIGIN,
    );
    expect(data.offers).toEqual([]);
  });

  it("keeps the valid variants when only some are malformed", () => {
    const data = buildProductJsonLd(
      product({
        variants: [
          variant({ id: "bad", price: { amount: "n/a", currencyCode: "INR" } }),
          variant({ id: "good", price: { amount: "1499.00", currencyCode: "INR" } }),
        ],
      }),
      ORIGIN,
    );
    expect(data.offers).toHaveLength(1);
    expect(data.offers[0]?.price).toBe("1499.00");
  });
});

describe("JSON-LD exposes no internal or supplier data", () => {
  it("contains no supplier, cost, margin or research field", () => {
    // JSON-LD is emitted as readable text in the page source, so this is one of the
    // easiest places to leak internal data by accident.
    const serialised = serializeJsonLd(buildProductJsonLd(product(), ORIGIN)).toLowerCase();

    for (const forbidden of [
      "supplier",
      "cost",
      "margin",
      "profit",
      "opportunity",
      "confidence",
      "tradelle",
      "trademart",
      "landed",
      "sourceab",
      "internalnote",
    ]) {
      expect(serialised).not.toContain(forbidden);
    }
  });

  it("emits only the expected top-level keys", () => {
    const data = buildProductJsonLd(product(), ORIGIN);
    expect(Object.keys(data).sort()).toEqual([
      "@context",
      "@type",
      "brand",
      "description",
      "image",
      "name",
      "offers",
      "url",
    ]);
  });

  it("omits brand entirely rather than emitting an empty one", () => {
    const data = buildProductJsonLd(product({ vendorPublicName: null }), ORIGIN);
    expect(data.brand).toBeUndefined();
    expect(Object.keys(data)).not.toContain("brand");
  });
});

describe("serialisation cannot break out of the script tag", () => {
  it("escapes < so a product title cannot close the script element", () => {
    // The title comes from Shopify, so anyone who can edit a product could otherwise
    // inject markup into every product page.
    const serialised = serializeJsonLd(
      buildProductJsonLd(product({ title: "Tee </script><script>alert(1)</script>" }), ORIGIN),
    );

    expect(serialised).not.toContain("</script>");
    expect(serialised).toContain("\\u003c");
  });

  it("escapes U+2028 and U+2029, which are JS line terminators inside a script", () => {
    const serialised = serializeJsonLd(
      buildProductJsonLd(product({ title: "Tee\u2028break\u2029end" }), ORIGIN),
    );

    expect(serialised).not.toMatch(/[\u2028\u2029]/);
    expect(serialised).toContain("\\u2028");
    expect(serialised).toContain("\\u2029");
  });

  it("still produces parseable JSON after escaping", () => {
    const serialised = serializeJsonLd(buildProductJsonLd(product({ title: "A < B" }), ORIGIN));
    expect(() => JSON.parse(serialised)).not.toThrow();
  });
});

describe("URLs are absolute and correctly joined", () => {
  it("builds an absolute product URL with no double slash", () => {
    const data = buildProductJsonLd(product(), ORIGIN);
    expect(data.url).toBe("https://kanay.example.com/products/black-tee");
    expect(data.url).not.toContain("//products");
  });

  it("encodes a handle containing characters that need it", () => {
    const data = buildProductJsonLd(product({ handle: "tee shirt" }), ORIGIN);
    expect(data.url).toBe("https://kanay.example.com/products/tee%20shirt");
  });

  it("uses the same URL on the offer as on the product", () => {
    const data = buildProductJsonLd(product(), ORIGIN);
    expect(data.offers[0]?.url).toBe(data.url);
  });
});

describe("breadcrumb JSON-LD", () => {
  const trail = [
    { name: "Home", path: "/" },
    { name: "Shop", path: "/shop" },
    { name: "Tees", path: "/collections/tees" },
    { name: "Black Tee", path: "/products/black-tee" },
  ];

  it("numbers positions from 1", () => {
    const data = buildBreadcrumbJsonLd(trail, ORIGIN);
    expect(data.itemListElement.map((entry) => entry.position)).toEqual([1, 2, 3, 4]);
  });

  it("makes every item an absolute URL", () => {
    const data = buildBreadcrumbJsonLd(trail, ORIGIN);
    for (const entry of data.itemListElement) {
      expect(entry.item.startsWith("https://kanay.example.com/")).toBe(true);
    }
  });

  it("keeps the trail order the page renders", () => {
    const data = buildBreadcrumbJsonLd(trail, ORIGIN);
    expect(data.itemListElement.map((entry) => entry.name)).toEqual([
      "Home",
      "Shop",
      "Tees",
      "Black Tee",
    ]);
  });

  it("handles a path with no leading slash without producing a broken URL", () => {
    const data = buildBreadcrumbJsonLd([{ name: "Shop", path: "shop" }], ORIGIN);
    expect(data.itemListElement[0]?.item).toBe("https://kanay.example.com/shop");
  });
});
