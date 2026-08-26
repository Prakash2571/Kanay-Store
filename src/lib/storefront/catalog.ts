import type { ZodType } from "zod";

import {
  catalogDataSchema,
  type CatalogQuery,
  type StorefrontCatalogData,
  type StorefrontResult,
} from "./types";

type ApiSuccess<T> = { success: true; data: T };
type ApiFailure = { success: false; code?: string; message?: string };

const FALLBACK_ERROR = "The shop is temporarily unavailable. Please try again shortly.";

function apiBaseUrl(): URL | null {
  const configured = process.env.NEXT_PUBLIC_TRADEMART_API_URL?.trim();
  if (!configured) return null;

  try {
    const url = new URL(configured);
    return url.protocol === "http:" || url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

export async function requestStorefront<T>(
  path: string,
  schema: ZodType<T>,
  init?: RequestInit,
): Promise<StorefrontResult<T>> {
  const base = apiBaseUrl();
  if (!base) {
    return {
      ok: false,
      error: { code: "STOREFRONT_NOT_CONFIGURED", message: FALLBACK_ERROR },
    };
  }

  let url: URL;
  try {
    url = new URL(path, base);
  } catch {
    return { ok: false, error: { code: "INVALID_STOREFRONT_URL", message: FALLBACK_ERROR } };
  }

  try {
    const response = await fetch(url, {
      ...init,
      headers: { Accept: "application/json", ...init?.headers },
      next: init?.cache ? undefined : { revalidate: 60 },
    });
    const body = (await response.json()) as ApiSuccess<unknown> | ApiFailure;

    if (!response.ok || body.success !== true) {
      const failure = body as ApiFailure;
      return {
        ok: false,
        error: {
          code: failure.code ?? "STOREFRONT_UNAVAILABLE",
          message: failure.message ?? FALLBACK_ERROR,
          status: response.status,
        },
      };
    }

    const parsed = schema.safeParse(body.data);
    if (!parsed.success) {
      return {
        ok: false,
        error: { code: "INVALID_STOREFRONT_RESPONSE", message: FALLBACK_ERROR, status: 502 },
      };
    }

    return { ok: true, data: parsed.data };
  } catch {
    return {
      ok: false,
      error: { code: "STOREFRONT_UNAVAILABLE", message: FALLBACK_ERROR },
    };
  }
}

function addQuery(url: URLSearchParams, key: string, value: string | number | undefined) {
  if (value !== undefined && value !== "") url.set(key, String(value));
}

export async function getCatalog(query: CatalogQuery = {}): Promise<StorefrontResult<StorefrontCatalogData>> {
  const params = new URLSearchParams();
  addQuery(params, "q", query.q?.trim());
  addQuery(params, "collection", query.collection);
  addQuery(params, "productType", query.productType);
  addQuery(params, "availability", query.availability);
  addQuery(params, "minPricePaise", query.minPricePaise);
  addQuery(params, "maxPricePaise", query.maxPricePaise);
  addQuery(params, "sort", query.sort);
  addQuery(params, "first", query.first);
  addQuery(params, "after", query.after);
  const suffix = params.size ? `?${params.toString()}` : "";
  return requestStorefront(`/api/storefront/catalog${suffix}`, catalogDataSchema);
}
