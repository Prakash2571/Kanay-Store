import { z } from "zod";

import type { CartLine } from "@/lib/cart";
import type { StorefrontResult } from "./types";

export const guestCheckoutSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(120),
  email: z.email("Enter a valid email address").transform((value) => value.toLowerCase()),
  phone: z
    .string()
    .trim()
    .transform((value) => value.replace(/[\s()-]/g, ""))
    .pipe(z.string().regex(/^(?:\+91|91)?[6-9]\d{9}$/, "Enter a valid Indian mobile number"))
    .transform((value) => {
      const national = value.replace(/^\+?91/, "");
      return `+91${national}`;
    }),
  line1: z.string().trim().min(5, "Enter a complete street address").max(160),
  line2: z.string().trim().max(160).optional().transform((value) => value || undefined),
  city: z.string().trim().min(2, "Enter your city").max(80),
  state: z.string().trim().min(2, "Enter your state").max(80),
  postalCode: z
    .string()
    .trim()
    .regex(/^[1-9]\d{5}$/, "Enter a valid 6-digit PIN code"),
  countryCode: z.literal("IN"),
});

const summaryItemSchema = z.object({
  title: z.string(),
  variantTitle: z.string(),
  quantity: z.number().int().positive(),
  unitPricePaise: z.number().int().nonnegative(),
  lineTotalPaise: z.number().int().nonnegative(),
  image: z
    .object({
      url: z.string().url(),
      alt: z.string().default(""),
    })
    .nullable()
    .optional(),
});

const checkoutSummarySchema = z.object({
  items: z.array(summaryItemSchema),
  subtotalPaise: z.number().int().nonnegative(),
  shippingPaise: z.number().int().nonnegative(),
  discountPaise: z.number().int().nonnegative(),
  taxPaise: z.number().int().nonnegative(),
  totalPaise: z.number().int().positive(),
});

const checkoutSessionSchema = z.object({
  checkoutSessionId: z.string().min(1),
  statusToken: z.string().min(32),
  razorpayOrderId: z.string().min(1),
  amountPaise: z.number().int().positive(),
  currency: z.literal("INR"),
  keyId: z.string().min(1),
  summary: checkoutSummarySchema,
});

const paymentResultSchema = z.object({
  checkoutSessionId: z.string().min(1),
  status: z.enum(["PAYMENT_PENDING", "PAID", "ORDER_PENDING", "COMPLETE"]),
  orderNumber: z.string().nullable().optional(),
  amountPaidPaise: z.number().int().nonnegative(),
  trackingToken: z.string().min(32).nullable().optional(),
});

export type GuestCheckoutValues = z.infer<typeof guestCheckoutSchema>;
export type CheckoutSessionResponse = z.infer<typeof checkoutSessionSchema>;
export type PaymentResult = z.infer<typeof paymentResultSchema>;

type ApiSuccess = { success: true; data: unknown };
type ApiFailure = {
  success: false;
  code?: string;
  message?: string;
  details?: unknown;
};

function apiUrl(path: string): URL | null {
  const configured = process.env.NEXT_PUBLIC_TRADEMART_API_URL?.trim();
  if (!configured) return null;
  try {
    const base = new URL(configured);
    if (base.protocol !== "https:" && base.protocol !== "http:") return null;
    return new URL(path, base);
  } catch {
    return null;
  }
}

async function postJson<T>(
  path: string,
  payload: unknown,
  schema: z.ZodType<T>,
  idempotencyKey?: string,
): Promise<StorefrontResult<T>> {
  const url = apiUrl(path);
  if (!url) {
    return {
      ok: false,
      error: {
        code: "STOREFRONT_NOT_CONFIGURED",
        message: "Checkout is temporarily unavailable. Please try again later.",
      },
    };
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      mode: "cors",
      credentials: "omit",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
      },
      body: JSON.stringify(payload),
    });
    const body = (await response.json()) as ApiSuccess | ApiFailure;
    if (!response.ok || body.success !== true) {
      const failure = body as ApiFailure;
      return {
        ok: false,
        error: {
          code: failure.code ?? "CHECKOUT_FAILED",
          message: customerCheckoutMessage(failure.code, failure.message),
          status: response.status,
        },
      };
    }

    const parsed = schema.safeParse(body.data);
    if (!parsed.success) {
      return {
        ok: false,
        error: {
          code: "INVALID_CHECKOUT_RESPONSE",
          message: "Checkout could not be prepared. Please try again.",
          status: 502,
        },
      };
    }
    return { ok: true, data: parsed.data };
  } catch {
    return {
      ok: false,
      error: {
        code: "CHECKOUT_UNAVAILABLE",
        message: "Checkout is temporarily unavailable. Please try again.",
      },
    };
  }
}

export function customerCheckoutMessage(code?: string, fallback?: string): string {
  switch (code) {
    case "PRODUCT_UNAVAILABLE":
      return "This item is no longer available.";
    case "VARIANT_UNAVAILABLE":
      return "That option just sold out. Please choose another.";
    case "PRICE_CHANGED":
      return "The price changed since you added this item. Your cart needs to be reviewed.";
    /**
     * A wholesale line is below its minimum order quantity.
     *
     * The backend's message is preferred here, unlike most codes, because it is the only one
     * that names the product, its minimum and what to do about it — and this is a refusal the
     * customer can fix themselves in one step. A generic "checkout could not be completed"
     * would send them back to a cart with no idea which line is wrong.
     *
     * The fallback still has to exist: a long enough product title can push the backend's
     * sentence past the length this function is willing to show a customer.
     */
    case "MOQ_NOT_MET":
      return fallback && fallback.length < 180
        ? fallback
        : "One item is below its minimum order quantity. Open your cart and raise it to the minimum shown on the product.";
    case "PAYMENT_FAILED":
      return "Payment was not completed. You were not charged if Razorpay shows the payment as failed.";
    case "PAYMENT_PENDING":
      return "We are confirming your payment. Do not pay again.";
    case "ORDER_CREATION_PENDING":
      return "Payment received. We are preparing your order.";
    default:
      return fallback && fallback.length < 180
        ? fallback
        : "Checkout could not be completed. Please try again.";
  }
}

export async function createCheckoutSession(
  items: CartLine[],
  values: GuestCheckoutValues,
  idempotencyKey: string,
): Promise<StorefrontResult<CheckoutSessionResponse>> {
  return postJson(
    "/api/storefront/checkout",
    {
      cartLines: items.map((item) => ({
        shopifyProductId: item.shopifyProductId,
        shopifyVariantId: item.shopifyVariantId,
        quantity: item.quantity,
        // expectedUnitPricePaise is the price the customer saw in their cart at
        // the time of checkout. It is NOT trusted as the charge amount — the
        // backend always recomputes the authoritative price from Shopify. This
        // field exists solely so the backend can detect a stale-price situation
        // and return PRICE_CHANGED, letting the customer review updated pricing
        // before paying.
        expectedUnitPricePaise: item.unitPricePaise,
      })),
      customer: {
        fullName: values.fullName,
        email: values.email,
        phone: values.phone,
      },
      shippingAddress: {
        line1: values.line1,
        line2: values.line2,
        city: values.city,
        state: values.state,
        postalCode: values.postalCode,
        countryCode: values.countryCode,
      },
      idempotencyKey,
    },
    checkoutSessionSchema,
    idempotencyKey,
  );
}

export async function verifyRazorpayPayment(payload: {
  checkoutSessionId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): Promise<StorefrontResult<PaymentResult>> {
  return postJson("/api/storefront/payments/verify", payload, paymentResultSchema);
}
