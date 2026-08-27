import { describe, expect, it, vi } from "vitest";

import { buildEvent } from "@/lib/analytics/events";
import { createCheckoutSession, guestCheckoutSchema, verifyRazorpayPayment } from "./checkout";
import { publicOrderSchema } from "./orders";

/**
 * Cross-repository contract fixtures, and the token-privacy guarantees around them.
 *
 * This storefront and Trademart_B are separate repositories with separate CI. The zod
 * schemas here already reject a response that does not match - which is the right
 * behaviour, and also means a backend field rename turns into "checkout is temporarily
 * unavailable" for every customer, with no test anywhere going red first.
 *
 * So the shapes the backend actually emits are written out literally below, annotated
 * with the module that produces them, and fed through the real client. If Trademart_B
 * changes one, the fixture is what has to change too - which is the review conversation
 * that should happen.
 */

const CUSTOMER = guestCheckoutSchema.parse({
  fullName: "Aarav Mehta",
  email: "aarav@example.com",
  phone: "98765 43210",
  line1: "24 Residency Road",
  line2: "",
  city: "Bengaluru",
  state: "Karnataka",
  postalCode: "560001",
  countryCode: "IN" as const,
});

const CART = [
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
    quantity: 1,
  },
];

/** Trademart_B storefront/checkout/checkout.controller.ts -> POST /api/storefront/checkout (201). */
const CHECKOUT_CREATED = {
  success: true,
  data: {
    checkoutSessionId: "9f1c2f52-1c5e-4a9b-8f7d-2b1e3c4d5a6b",
    statusToken: "s".repeat(43),
    razorpayOrderId: "order_TestOrder123",
    amountPaise: 149900,
    currency: "INR",
    keyId: "rzp_test_ExampleKeyId",
    summary: {
      items: [
        {
          title: "Test Product",
          variantTitle: "Default",
          quantity: 1,
          unitPricePaise: 149900,
          lineTotalPaise: 149900,
          image: null,
        },
      ],
      subtotalPaise: 149900,
      shippingPaise: 0,
      discountPaise: 0,
      taxPaise: 0,
      totalPaise: 149900,
    },
  },
};

/** Trademart_B storefront/payments/payment.service.ts -> POST /api/storefront/payments/verify. */
const PAYMENT_VERIFIED = {
  success: true,
  data: {
    checkoutSessionId: "9f1c2f52-1c5e-4a9b-8f7d-2b1e3c4d5a6b",
    status: "COMPLETE",
    orderNumber: "#1042",
    amountPaidPaise: 149900,
    trackingToken: "t".repeat(43),
  },
};

/** Trademart_B storefront/orders/tracking.service.ts -> GET /api/storefront/orders/track/:token. */
const PUBLIC_ORDER = {
  status: "COMPLETE",
  orderNumber: "#1042",
  createdAt: "2026-08-27T10:15:00.000Z",
  amountPaidPaise: 149900,
  currency: "INR",
  paymentStatus: "PAID",
  fulfillmentStatus: "FULFILLED",
  shipmentStatus: "DELIVERED",
  emailMasked: "a***v@example.com",
  shippingAddressSummary: "Bengaluru, Karnataka 560001",
  trackingToken: null,
  tracking: { carrier: "Delhivery", number: "SHIP123", url: "https://track.example/SHIP123" },
  estimatedDelivery: "2026-08-30",
  items: [{ title: "Test Product", variantTitle: "Default", quantity: 1, image: null }],
  timeline: [
    { key: "placed", label: "Order placed", completed: true, occurredAt: "2026-08-27T10:15:00.000Z" },
    { key: "shipped", label: "Shipped", completed: true, occurredAt: "2026-08-28T09:00:00.000Z" },
  ],
};

/** Trademart_B common/errorBody.ts -> every failure, flat AND nested. */
const FAILURE = {
  success: false,
  code: "PRICE_CHANGED",
  message: "Price mismatch detected",
  details: { newPricePaise: 159900 },
  requestId: "req-abc123",
  error: {
    code: "PRICE_CHANGED",
    message: "Price mismatch detected",
    requestId: "req-abc123",
    details: { newPricePaise: 159900 },
  },
};

function stubFetch(body: unknown, status = 200): void {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" },
      }),
    ),
  );
  process.env.NEXT_PUBLIC_TRADEMART_API_URL = "http://localhost:4000";
}

describe("checkout creation contract", () => {
  it("accepts the response Trademart_B sends", async () => {
    stubFetch(CHECKOUT_CREATED, 201);

    const result = await createCheckoutSession(CART, CUSTOMER, "idem-key-contract-1");

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // The four fields the Razorpay handoff cannot work without.
    expect(result.data.razorpayOrderId).toBe("order_TestOrder123");
    expect(result.data.keyId).toBe("rzp_test_ExampleKeyId");
    expect(result.data.amountPaise).toBe(149900);
    expect(result.data.statusToken).toHaveLength(43);
  });

  it("rejects a response missing the status token rather than proceeding", async () => {
    // Failing closed matters here: without a status token the customer could pay and
    // then have no way to see the order.
    const { statusToken: _dropped, ...rest } = CHECKOUT_CREATED.data;
    stubFetch({ success: true, data: rest }, 201);

    const result = await createCheckoutSession(CART, CUSTOMER, "idem-key-contract-2");

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("INVALID_CHECKOUT_RESPONSE");
  });

  it("reads the backend error code from the flat shape", async () => {
    stubFetch(FAILURE, 409);

    const result = await createCheckoutSession(CART, CUSTOMER, "idem-key-contract-3");

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("PRICE_CHANGED");
    // And turns it into copy a shopper can act on, not the backend's wording.
    expect(result.error.message).toContain("price changed");
  });
});

describe("payment verification contract", () => {
  it("accepts the verified response", async () => {
    stubFetch(PAYMENT_VERIFIED);

    const result = await verifyRazorpayPayment({
      checkoutSessionId: "9f1c2f52-1c5e-4a9b-8f7d-2b1e3c4d5a6b",
      razorpayOrderId: "order_TestOrder123",
      razorpayPaymentId: "pay_TestPayment123",
      razorpaySignature: "a".repeat(64),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.status).toBe("COMPLETE");
    expect(result.data.trackingToken).toHaveLength(43);
  });

  it("accepts the 202 in-progress statuses without treating them as failures", async () => {
    // PAYMENT_PENDING and ORDER_PENDING both mean "money is fine, keep waiting". A
    // client that read them as failures would tell a customer who HAS paid that they
    // have not.
    for (const status of ["PAYMENT_PENDING", "PAID", "ORDER_PENDING"]) {
      stubFetch({ success: true, data: { ...PAYMENT_VERIFIED.data, status, orderNumber: null } }, 202);

      const result = await verifyRazorpayPayment({
        checkoutSessionId: "9f1c2f52-1c5e-4a9b-8f7d-2b1e3c4d5a6b",
        razorpayOrderId: "order_TestOrder123",
        razorpayPaymentId: "pay_TestPayment123",
        razorpaySignature: "a".repeat(64),
      });

      expect(result.ok, status).toBe(true);
    }
  });
});

describe("order status contract", () => {
  it("accepts the public order projection", () => {
    const parsed = publicOrderSchema.safeParse(PUBLIC_ORDER);
    expect(parsed.success).toBe(true);
  });

  it("expects the email to arrive MASKED, and the address as a summary", () => {
    // The backend deliberately does not send a full email or a full address to a
    // token-bearing page. If it started to, this fixture would be the place that says
    // so - and this assertion documents which side owns the masking.
    expect(PUBLIC_ORDER.emailMasked).toMatch(/\*/);
    expect(PUBLIC_ORDER.shippingAddressSummary).not.toContain("24 Residency Road");
  });

  it("accepts an order with no tracking yet", () => {
    const parsed = publicOrderSchema.safeParse({
      ...PUBLIC_ORDER,
      status: "ORDER_PENDING",
      orderNumber: null,
      fulfillmentStatus: null,
      shipmentStatus: null,
      tracking: null,
      estimatedDelivery: null,
    });
    expect(parsed.success).toBe(true);
  });
});

describe("tokens never leave through analytics", () => {
  it("drops a token even when a call site passes one", () => {
    // The allow-list in lib/analytics/events.ts is what makes this true by
    // construction. This asserts the property rather than the implementation, because
    // the property is what matters: an analytics sink is a third party.
    const event = buildEvent("begin_checkout", {
      itemCount: 2,
      valueAmount: 1499,
      // All of these must be silently dropped.
      statusToken: "s".repeat(43),
      trackingToken: "t".repeat(43),
      token: "abc",
      email: "aarav@example.com",
      phone: "+919876543210",
      checkoutSessionId: "9f1c2f52-1c5e-4a9b-8f7d-2b1e3c4d5a6b",
      razorpayOrderId: "order_TestOrder123",
    });

    const serialised = JSON.stringify(event);
    for (const secret of [
      "s".repeat(43),
      "t".repeat(43),
      "aarav@example.com",
      "+919876543210",
      "9f1c2f52-1c5e-4a9b-8f7d-2b1e3c4d5a6b",
      "order_TestOrder123",
    ]) {
      expect(serialised).not.toContain(secret);
    }

    // The permitted fields still get through, or the event would be useless.
    expect(event.payload.itemCount).toBe(2);
    expect(event.payload.valueAmount).toBe(1499);
  });
});
