import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createCheckoutSession,
  customerCheckoutMessage,
  guestCheckoutSchema,
} from "./checkout";

const valid = {
  fullName: "Aarav Mehta",
  email: "AARAV@example.com",
  phone: "98765 43210",
  line1: "24 Residency Road",
  line2: "",
  city: "Bengaluru",
  state: "Karnataka",
  postalCode: "560001",
  countryCode: "IN" as const,
};

describe("guest checkout validation", () => {
  it("normalizes Indian phone and email", () => {
    const parsed = guestCheckoutSchema.parse(valid);
    expect(parsed.phone).toBe("+919876543210");
    expect(parsed.email).toBe("aarav@example.com");
    expect(parsed.line2).toBeUndefined();
  });

  it("rejects invalid PIN codes and mobile numbers", () => {
    expect(
      guestCheckoutSchema.safeParse({ ...valid, phone: "12345", postalCode: "000000" }).success,
    ).toBe(false);
  });

  it("maps price changes to safe customer copy", () => {
    expect(customerCheckoutMessage("PRICE_CHANGED")).toContain("price changed");
    expect(customerCheckoutMessage("UNKNOWN", "internal stack trace".repeat(20))).not.toContain(
      "stack trace",
    );
  });

  it("maps all error codes to customer-safe messages", () => {
    expect(customerCheckoutMessage("PRODUCT_UNAVAILABLE")).toContain("no longer available");
    expect(customerCheckoutMessage("VARIANT_UNAVAILABLE")).toContain("sold out");
    expect(customerCheckoutMessage("PAYMENT_FAILED")).toContain("not completed");
    expect(customerCheckoutMessage("PAYMENT_PENDING")).toContain("confirming");
    expect(customerCheckoutMessage("ORDER_CREATION_PENDING")).toContain("preparing your order");
  });

  /**
   * MOQ_NOT_MET is the one refusal the customer can fix in a single step, so it is the one
   * code where the backend's own wording is passed through: it names the product and its
   * minimum, which a generic message cannot.
   */
  it("passes through the backend's specific minimum-order message", () => {
    const message = customerCheckoutMessage(
      "MOQ_NOT_MET",
      "Steel Water Bottle is sold in minimum quantities of 12. Increase the quantity to at least 12 to continue.",
    );
    expect(message).toContain("Steel Water Bottle");
    expect(message).toContain("12");
  });

  it("falls back to actionable wording when the backend message is too long to show", () => {
    const message = customerCheckoutMessage("MOQ_NOT_MET", "x".repeat(400));
    expect(message).not.toContain("xxxx");
    expect(message).toContain("minimum order quantity");
  });

  it("still says something actionable when the backend sends no message", () => {
    expect(customerCheckoutMessage("MOQ_NOT_MET")).toContain("minimum order quantity");
  });
});

describe("createCheckoutSession", () => {
  const originalEnv = process.env.NEXT_PUBLIC_TRADEMART_API_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_TRADEMART_API_URL = "http://localhost:4000";
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_TRADEMART_API_URL = originalEnv;
    vi.restoreAllMocks();
  });

  it("includes expectedUnitPricePaise in cartLines from the local cart price", async () => {
    const cartLines = [
      {
        shopifyProductId: "gid://shopify/Product/1",
        shopifyVariantId: "gid://shopify/ProductVariant/1",
        handle: "test-product",
        title: "Test Product",
        variantTitle: "Default",
        selectedOptions: [{ name: "Size", value: "M" }],
        image: null,
        unitPricePaise: 149900,
        currencyCode: "INR" as const,
        availableForSale: true,
        quantity: 2,
      },
    ];

    let capturedBody: unknown;
    const mockFetch = vi.fn().mockImplementation(async (_url: unknown, init: RequestInit) => {
      capturedBody = JSON.parse(init.body as string);
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            checkoutSessionId: "cs_test123",
            statusToken: "a".repeat(32),
            razorpayOrderId: "order_test123",
            amountPaise: 299800,
            currency: "INR",
            keyId: "rzp_test_key",
            summary: {
              items: [
                {
                  title: "Test Product",
                  variantTitle: "Default",
                  quantity: 2,
                  unitPricePaise: 149900,
                  lineTotalPaise: 299800,
                  image: null,
                },
              ],
              subtotalPaise: 299800,
              shippingPaise: 0,
              discountPaise: 0,
              taxPaise: 0,
              totalPaise: 299800,
            },
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    });
    vi.stubGlobal("fetch", mockFetch);

    const parsedValues = guestCheckoutSchema.parse(valid);
    const result = await createCheckoutSession(cartLines, parsedValues, "idem-key-1");

    expect(result.ok).toBe(true);
    expect(mockFetch).toHaveBeenCalledOnce();

    const body = capturedBody as {
      cartLines: Array<{ expectedUnitPricePaise: number }>;
    };
    expect(body.cartLines[0].expectedUnitPricePaise).toBe(149900);
  });

  it("returns PRICE_CHANGED error with customer-safe message when backend detects stale price", async () => {
    const cartLines = [
      {
        shopifyProductId: "gid://shopify/Product/1",
        shopifyVariantId: "gid://shopify/ProductVariant/1",
        handle: "test-product",
        title: "Test Product",
        variantTitle: "Default",
        selectedOptions: [],
        image: null,
        unitPricePaise: 99900,
        currencyCode: "INR" as const,
        availableForSale: true,
        quantity: 1,
      },
    ];

    const mockFetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          success: false,
          code: "PRICE_CHANGED",
          message: "Price mismatch detected",
          details: { newPricePaise: 119900 },
        }),
        { status: 409, headers: { "Content-Type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", mockFetch);

    const parsedValues = guestCheckoutSchema.parse(valid);
    const result = await createCheckoutSession(cartLines, parsedValues, "idem-key-2");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("PRICE_CHANGED");
      expect(result.error.message).toContain("price changed");
      expect(result.error.message).toContain("cart");
    }
  });
});
