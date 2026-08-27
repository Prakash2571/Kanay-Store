import { afterEach, describe, expect, it, vi } from "vitest";

import { buildEvent, setAnalyticsSink, track } from "./events";

/**
 * The point of these tests is the allow-list. A deny-list of known-bad keys would pass a
 * test suite and then leak the first field someone invents, so what is asserted here is
 * that UNKNOWN fields are dropped - not merely that a specific bad field is.
 */

afterEach(() => {
  setAnalyticsSink(null);
});

describe("only allow-listed fields are emitted", () => {
  it("keeps permitted commerce fields", () => {
    const event = buildEvent("add_to_cart", {
      handle: "black-tee",
      variantId: "gid://shopify/ProductVariant/1",
      quantity: 2,
      priceAmount: "1499.00",
      priceCurrency: "INR",
    });

    expect(event.payload).toEqual({
      handle: "black-tee",
      variantId: "gid://shopify/ProductVariant/1",
      quantity: 2,
      priceAmount: "1499.00",
      priceCurrency: "INR",
    });
  });

  it("drops ANY field not on the allow-list", () => {
    // The central guarantee. A new call site cannot leak by passing an extra property.
    const event = buildEvent("add_to_cart", {
      handle: "black-tee",
      somethingInventedLater: "value",
      arbitraryField: 42,
    });

    expect(event.payload).toEqual({ handle: "black-tee" });
  });

  it("drops personally identifying fields", () => {
    const event = buildEvent("begin_checkout", {
      email: "customer@example.com",
      phone: "+919999999999",
      fullName: "A Customer",
      addressLine1: "1 Example Road",
      city: "Mumbai",
      pinCode: "400001",
      itemCount: 2,
    });

    expect(event.payload).toEqual({ itemCount: 2 });
    const serialised = JSON.stringify(event);
    expect(serialised).not.toContain("customer@example.com");
    expect(serialised).not.toContain("400001");
    expect(serialised).not.toContain("Example Road");
  });

  it("drops payment fields", () => {
    const event = buildEvent("begin_checkout", {
      cardNumber: "4111111111111111",
      cvv: "123",
      expiry: "12/29",
      upiId: "someone@bank",
      razorpayOrderId: "order_abc",
      itemCount: 1,
    });

    expect(event.payload).toEqual({ itemCount: 1 });
    expect(JSON.stringify(event)).not.toContain("4111");
  });

  it("drops supplier and internal commercial fields", () => {
    const event = buildEvent("product_view", {
      handle: "black-tee",
      supplierId: "sp-001",
      supplierVariantId: "sv-001",
      supplierCost: 42000,
      margin: 0.62,
      landedCost: 51000,
      opportunityScore: 88,
      confidence: "HIGH",
      internalNote: "reorder from alt supplier",
    });

    expect(event.payload).toEqual({ handle: "black-tee" });
    const serialised = JSON.stringify(event).toLowerCase();
    for (const forbidden of ["supplier", "margin", "landed", "opportunity", "confidence", "internal"]) {
      expect(serialised).not.toContain(forbidden);
    }
  });

  it("drops the cart id and tracking token, which are capabilities not identifiers", () => {
    // Whoever holds a cart id can read and modify that basket; a tracking token exposes
    // one customer's order. Neither belongs in an analytics stream.
    const event = buildEvent("begin_checkout", {
      cartId: "gid://shopify/Cart/abc",
      trackingToken: "sometoken",
      sessionId: "sess_1",
      itemCount: 3,
    });

    expect(event.payload).toEqual({ itemCount: 3 });
  });
});

describe("values are normalised, not just filtered", () => {
  it("drops non-primitive values", () => {
    const event = buildEvent("product_view", {
      handle: { nested: "object" },
      variantId: ["array"],
      quantity: 1,
    });

    expect(event.payload).toEqual({ quantity: 1 });
  });

  it("drops null and undefined rather than emitting empty keys", () => {
    const event = buildEvent("product_view", { handle: null, variantId: undefined, quantity: 1 });
    expect(event.payload).toEqual({ quantity: 1 });
  });

  it("drops NaN and Infinity, which JSON turns into null", () => {
    const event = buildEvent("product_view", {
      quantity: Number.NaN,
      resultCount: Number.POSITIVE_INFINITY,
      itemCount: 2,
    });
    expect(event.payload).toEqual({ itemCount: 2 });
  });

  it("trims and drops whitespace-only strings", () => {
    expect(buildEvent("search", { searchTerm: "  tee  " }).payload.searchTerm).toBe("tee");
    expect(buildEvent("search", { searchTerm: "   " }).payload).toEqual({});
  });

  it("truncates free text, since customers paste unexpected things into search", () => {
    const event = buildEvent("search", { searchTerm: "x".repeat(500) });
    expect((event.payload.searchTerm as string).length).toBe(64);
  });

  it("keeps booleans", () => {
    expect(buildEvent("product_view", { availability: true }).payload.availability).toBe(true);
  });
});

describe("the funnel events all build", () => {
  it("supports every declared event name", () => {
    for (const name of [
      "product_view",
      "collection_view",
      "search",
      "add_to_cart",
      "remove_from_cart",
      "begin_checkout",
    ] as const) {
      expect(buildEvent(name, { handle: "x" }).name).toBe(name);
    }
  });
});

describe("dispatch never breaks the page", () => {
  it("sends the built event to the installed sink", () => {
    const sink = vi.fn();
    setAnalyticsSink(sink);

    track("add_to_cart", { handle: "black-tee", quantity: 1 });

    expect(sink).toHaveBeenCalledTimes(1);
    expect(sink.mock.calls[0]?.[0]).toEqual({
      name: "add_to_cart",
      payload: { handle: "black-tee", quantity: 1 },
    });
  });

  it("swallows a throwing sink - a purchase must not fail over measurement", () => {
    setAnalyticsSink(() => {
      throw new Error("provider down");
    });

    expect(() => track("add_to_cart", { handle: "black-tee" })).not.toThrow();
  });

  it("builds and discards when no sink is installed", () => {
    setAnalyticsSink(null);
    const event = track("product_view", { handle: "black-tee" });
    expect(event.payload).toEqual({ handle: "black-tee" });
  });

  it("redacts before the sink ever sees the data", () => {
    // Redaction must not be the sink's responsibility: a third-party sink would
    // otherwise receive the raw object.
    const sink = vi.fn();
    setAnalyticsSink(sink);

    track("begin_checkout", { email: "customer@example.com", itemCount: 1 });

    expect(JSON.stringify(sink.mock.calls[0]?.[0])).not.toContain("customer@example.com");
  });
});
