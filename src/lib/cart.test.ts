import { describe, expect, it } from "vitest";

import {
  MAX_CART_QUANTITY,
  calculateCartCount,
  calculateCartSubtotal,
  cartReducer,
  minimumQuantityFor,
  parsePersistedCart,
  type CartState,
} from "./cart";

const item = {
  shopifyProductId: "gid://shopify/Product/1",
  shopifyVariantId: "gid://shopify/ProductVariant/2",
  handle: "steel-water-bottle",
  title: "Steel Water Bottle",
  variantTitle: "750ml / Silver",
  selectedOptions: [
    { name: "Capacity", value: "750ml" },
    { name: "Finish", value: "Silver" },
  ],
  image: null,
  unitPricePaise: 149900,
  currencyCode: "INR" as const,
  availableForSale: true,
};

/** The same product, sold in bulk only: twelve units minimum. */
const bulkItem = { ...item, minimumOrderQuantity: 12 };

const empty: CartState = { items: [], hydrated: true };

describe("cart", () => {
  it("uses integer paise for totals", () => {
    const state = cartReducer(empty, { type: "add", item, quantity: 2 });
    expect(calculateCartSubtotal(state.items)).toBe(299800);
  });

  it("merges the same Shopify variant", () => {
    const first = cartReducer(empty, { type: "add", item, quantity: 8 });
    const second = cartReducer(first, { type: "add", item, quantity: 8 });
    expect(second.items).toHaveLength(1);
    expect(second.items[0]?.quantity).toBe(16);
  });

  it("refuses unavailable items", () => {
    const state = cartReducer(empty, {
      type: "add",
      item: { ...item, availableForSale: false },
      quantity: 1,
    });
    expect(state.items).toEqual([]);
  });

  it("fails closed when persisted cart data is malformed", () => {
    expect(parsePersistedCart('{"amount": 1}')).toEqual([]);
    expect(parsePersistedCart("not-json")).toEqual([]);
  });
});

/**
 * The quantity ceiling.
 *
 * This was 10, mirroring the backend's old retail cap, which made this store unable to accept
 * a wholesale order at all. Both ends are now 10,000 (MAX_LINE_QUANTITY in the backend's
 * checkout.validation.ts) - large enough for any plausible bulk order, small enough that
 * quantity x unit price stays a safe integer in paise.
 */
describe("cart quantity ceiling", () => {
  it("allows a genuine bulk quantity", () => {
    const state = cartReducer(empty, { type: "add", item, quantity: 500 });
    expect(state.items[0]?.quantity).toBe(500);
  });

  it("caps at MAX_CART_QUANTITY rather than accepting a mistyped figure", () => {
    const state = cartReducer(empty, { type: "add", item, quantity: 250_000 });
    expect(state.items[0]?.quantity).toBe(MAX_CART_QUANTITY);
  });

  it("caps a merge that would cross the ceiling", () => {
    const first = cartReducer(empty, { type: "add", item, quantity: MAX_CART_QUANTITY });
    const second = cartReducer(first, { type: "add", item, quantity: 5 });
    expect(second.items[0]?.quantity).toBe(MAX_CART_QUANTITY);
  });
});

/**
 * The minimum order quantity floor.
 *
 * The backend is the authority: it re-derives the minimum from the product's `moq:<n>` tag at
 * checkout and refuses the order if a line is below it. These tests cover the frontend's copy
 * of that rule, which exists so a customer cannot BUILD a cart the checkout is guaranteed to
 * reject - the failure they would otherwise discover after typing in an address.
 */
describe("minimum order quantity", () => {
  it("reports no minimum as one", () => {
    // Three ways a product can have no minimum, all of which must read as one and none of
    // which may read as zero: absent (a line persisted before the field existed), explicitly
    // null (the backend saying "no `moq:` tag"), and undefined.
    expect(minimumQuantityFor({})).toBe(1);
    expect(minimumQuantityFor({ minimumOrderQuantity: null })).toBe(1);
    expect(minimumQuantityFor({ minimumOrderQuantity: undefined })).toBe(1);
    // A complete item that simply carries no minimum field at all - the shape every cart line
    // had before this feature shipped.
    expect(minimumQuantityFor(item)).toBe(1);
  });

  it("reports a real minimum", () => {
    expect(minimumQuantityFor(bulkItem)).toBe(12);
  });

  it("raises an add below the minimum up to it", () => {
    // Adding one of a twelve-minimum product must not create a line of one.
    const state = cartReducer(empty, { type: "add", item: bulkItem, quantity: 1 });
    expect(state.items[0]?.quantity).toBe(12);
  });

  it("leaves an add above the minimum alone", () => {
    const state = cartReducer(empty, { type: "add", item: bulkItem, quantity: 40 });
    expect(state.items[0]?.quantity).toBe(40);
  });

  it("refuses to set a quantity below the minimum", () => {
    const first = cartReducer(empty, { type: "add", item: bulkItem, quantity: 20 });
    const second = cartReducer(first, {
      type: "setQuantity",
      shopifyVariantId: bulkItem.shopifyVariantId,
      quantity: 11,
    });
    expect(second.items[0]?.quantity).toBe(12);
  });

  it("still allows quantity zero to remove the line entirely", () => {
    // The minimum governs how FEW may be ordered, not whether the item may be taken out of
    // the cart. Clamping zero up to twelve would trap a wholesale item in the cart.
    const first = cartReducer(empty, { type: "add", item: bulkItem, quantity: 20 });
    const second = cartReducer(first, {
      type: "setQuantity",
      shopifyVariantId: bulkItem.shopifyVariantId,
      quantity: 0,
    });
    expect(second.items).toEqual([]);
  });

  it("still allows explicit removal", () => {
    const first = cartReducer(empty, { type: "add", item: bulkItem, quantity: 20 });
    const second = cartReducer(first, {
      type: "remove",
      shopifyVariantId: bulkItem.shopifyVariantId,
    });
    expect(second.items).toEqual([]);
  });

  it("applies the minimum from the incoming item when merging", () => {
    // The catalog is the authority on the minimum, so a line persisted before the merchant
    // set `moq:12` is corrected by the next add rather than keeping its stale floor.
    const stale = cartReducer(empty, { type: "add", item, quantity: 2 });
    const merged = cartReducer(stale, { type: "add", item: bulkItem, quantity: 1 });
    expect(merged.items[0]?.quantity).toBe(12);
    expect(merged.items[0]?.minimumOrderQuantity).toBe(12);
  });

  it("keeps a persisted bulk line's minimum", () => {
    const persisted = parsePersistedCart(JSON.stringify([{ ...bulkItem, quantity: 12 }]));
    expect(persisted).toHaveLength(1);
    expect(persisted[0]?.minimumOrderQuantity).toBe(12);
  });

  it("accepts a persisted line that predates the field", () => {
    // `minimumOrderQuantity` is optional in the schema on purpose: a cart saved before this
    // feature shipped must still parse, or every existing shopper loses their cart.
    const persisted = parsePersistedCart(JSON.stringify([{ ...item, quantity: 3 }]));
    expect(persisted).toHaveLength(1);
    expect(persisted[0]?.quantity).toBe(3);
  });

  it("counts bulk quantities in the header badge", () => {
    const state = cartReducer(empty, { type: "add", item: bulkItem, quantity: 48 });
    expect(calculateCartCount(state.items)).toBe(48);
  });
});
