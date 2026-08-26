import { describe, expect, it } from "vitest";

import {
  calculateCartSubtotal,
  cartReducer,
  parsePersistedCart,
  type CartState,
} from "./cart";

const item = {
  shopifyProductId: "gid://shopify/Product/1",
  shopifyVariantId: "gid://shopify/ProductVariant/2",
  handle: "linen-shirt",
  title: "Linen Shirt",
  variantTitle: "Sand / M",
  selectedOptions: [
    { name: "Colour", value: "Sand" },
    { name: "Size", value: "M" },
  ],
  image: null,
  unitPricePaise: 149900,
  currencyCode: "INR" as const,
  availableForSale: true,
};

const empty: CartState = { items: [], hydrated: true };

describe("cart", () => {
  it("uses integer paise for totals", () => {
    const state = cartReducer(empty, { type: "add", item, quantity: 2 });
    expect(calculateCartSubtotal(state.items)).toBe(299800);
  });

  it("merges the same Shopify variant and caps quantity", () => {
    const first = cartReducer(empty, { type: "add", item, quantity: 8 });
    const second = cartReducer(first, { type: "add", item, quantity: 8 });
    expect(second.items).toHaveLength(1);
    expect(second.items[0]?.quantity).toBe(10);
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
