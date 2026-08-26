import { z } from "zod";

import { requestStorefront } from "./catalog";
import {
  collectionDetailDataSchema,
  collectionSummarySchema,
  type StorefrontCollectionData,
  type StorefrontCollectionSummary,
  type StorefrontResult,
} from "./types";

export function getCollections(): Promise<StorefrontResult<StorefrontCollectionSummary[]>> {
  return requestStorefront("/api/storefront/collections", z.array(collectionSummarySchema));
}

export function getCollection(
  handle: string,
  options: { first?: number; after?: string; sort?: string } = {},
): Promise<StorefrontResult<StorefrontCollectionData>> {
  const params = new URLSearchParams();
  if (options.first) params.set("first", String(options.first));
  if (options.after) params.set("after", options.after);
  if (options.sort) params.set("sort", options.sort);
  const suffix = params.size ? `?${params.toString()}` : "";
  return requestStorefront(
    `/api/storefront/collections/${encodeURIComponent(handle)}${suffix}`,
    collectionDetailDataSchema,
  );
}
