import { requestStorefront } from "./catalog";
import { productDetailSchema, type StorefrontProduct, type StorefrontResult } from "./types";

export function getProduct(handle: string): Promise<StorefrontResult<StorefrontProduct>> {
  return requestStorefront(
    `/api/storefront/products/${encodeURIComponent(handle)}`,
    productDetailSchema,
  );
}
