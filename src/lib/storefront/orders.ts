import { z } from "zod";

import type { StorefrontResult } from "./types";

const orderItemSchema = z.object({
  title: z.string(),
  variantTitle: z.string().nullable().optional(),
  quantity: z.number().int().positive(),
  image: z
    .object({
      url: z.string().url(),
      alt: z.string().default(""),
    })
    .nullable()
    .optional(),
});

const timelineEntrySchema = z.object({
  key: z.string(),
  label: z.string(),
  completed: z.boolean(),
  occurredAt: z.string().datetime().nullable().optional(),
});

export const publicOrderSchema = z.object({
  checkoutSessionId: z.string().min(1).optional(),
  status: z.enum(["PAYMENT_PENDING", "PAID", "ORDER_PENDING", "COMPLETE"]),
  orderNumber: z.string().nullable().optional(),
  createdAt: z.string().datetime(),
  amountPaidPaise: z.number().int().nonnegative(),
  currency: z.literal("INR"),
  paymentStatus: z.enum(["PENDING", "PAID", "FAILED", "REFUNDED"]),
  fulfillmentStatus: z.string().nullable(),
  shipmentStatus: z.string().nullable(),
  emailMasked: z.string().nullable().optional(),
  shippingAddressSummary: z.string().nullable().optional(),
  trackingToken: z.string().min(32).nullable().optional(),
  tracking: z
    .object({
      carrier: z.string().nullable(),
      number: z.string().nullable(),
      url: z.string().url().nullable(),
    })
    .nullable(),
  estimatedDelivery: z.string().nullable().optional(),
  items: z.array(orderItemSchema),
  timeline: z.array(timelineEntrySchema),
});

export type PublicOrder = z.infer<typeof publicOrderSchema>;

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

async function getPublicOrder(path: string): Promise<StorefrontResult<PublicOrder>> {
  const url = apiUrl(path);
  if (!url) {
    return {
      ok: false,
      error: {
        code: "STOREFRONT_NOT_CONFIGURED",
        message: "Order tracking is temporarily unavailable.",
      },
    };
  }

  try {
    const response = await fetch(url, {
      cache: "no-store",
      credentials: "omit",
      headers: { Accept: "application/json" },
    });
    const body = (await response.json()) as {
      success?: boolean;
      data?: unknown;
      code?: string;
      message?: string;
    };
    if (!response.ok || body.success !== true) {
      return {
        ok: false,
        error: {
          code: body.code ?? "TRACKING_UNAVAILABLE",
          message: "Tracking information is not available yet.",
          status: response.status,
        },
      };
    }
    const parsed = publicOrderSchema.safeParse(body.data);
    if (!parsed.success) {
      return {
        ok: false,
        error: {
          code: "INVALID_TRACKING_RESPONSE",
          message: "Tracking information is not available yet.",
          status: 502,
        },
      };
    }
    return { ok: true, data: parsed.data };
  } catch {
    return {
      ok: false,
      error: {
        code: "TRACKING_UNAVAILABLE",
        message: "Tracking information is not available yet.",
      },
    };
  }
}

export function getCheckoutStatus(
  checkoutSessionId: string,
  statusToken: string,
): Promise<StorefrontResult<PublicOrder>> {
  const params = new URLSearchParams({ token: statusToken });
  return getPublicOrder(
    `/api/storefront/checkout/${encodeURIComponent(checkoutSessionId)}/status?${params.toString()}`,
  );
}

export function getTrackedOrder(token: string): Promise<StorefrontResult<PublicOrder>> {
  return getPublicOrder(`/api/storefront/orders/track/${encodeURIComponent(token)}`);
}

export function parseTrackingToken(value: string): string | null {
  const normalized = value.trim();
  let token = normalized;
  try {
    const url = new URL(normalized);
    const parts = url.pathname.split("/").filter(Boolean);
    token = parts.at(-1) ?? "";
  } catch {
    token = normalized;
  }
  return /^[A-Za-z0-9_-]{32,256}$/.test(token) ? token : null;
}
