/**
 * Canonical origin resolution, in one place.
 *
 * WHY THIS IS NOT INLINED
 * -----------------------
 * `process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"` was repeated in
 * layout.tsx and in the product page's JSON-LD. Two copies of a fallback is how a
 * canonical URL and a structured-data URL end up disagreeing, which is exactly the
 * inconsistency Google reports as a mismatch.
 *
 * It also normalises the value. A trailing slash from an environment variable turns
 * `${siteUrl}/products/x` into `//products/x`, and a missing scheme makes `new URL()`
 * throw at module load - which in a Next metadata file takes the whole route down.
 */

const DEFAULT_ORIGIN = "http://localhost:3000";

/**
 * The public origin of this storefront, with no trailing slash.
 *
 * Falls back rather than throwing: the storefront must build and boot without a
 * configured domain, and a bad value should degrade to localhost rather than crash
 * every page that renders a canonical link.
 */
export function siteOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return DEFAULT_ORIGIN;

  // Accept a bare host ("shop.example.com") as well as a full origin. Without this a
  // deployment that omits the scheme silently gets localhost URLs in its sitemap.
  const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

  try {
    const url = new URL(candidate);
    if (url.protocol !== "http:" && url.protocol !== "https:") return DEFAULT_ORIGIN;
    return url.origin;
  } catch {
    return DEFAULT_ORIGIN;
  }
}

/** Absolute URL for a site-relative path. Always exactly one slash at the join. */
export function absoluteUrl(path: string): string {
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${siteOrigin()}${suffix}`;
}

export function storeName(): string {
  return process.env.NEXT_PUBLIC_STORE_NAME?.trim() || "Kanay Store";
}

/**
 * Routes that must never be indexed.
 *
 * Each is private, per-visitor or single-use, so an indexed copy is at best useless and
 * at worst a leaked link:
 *
 *   /cart, /checkout   per-visitor state; a crawler indexing them wastes budget on
 *                      pages that are empty for everyone else
 *   /order             a completed-order confirmation
 *   /track, /track-order  carry or accept a secure order token
 *
 * Declared here so robots.ts and the per-route `robots` metadata cannot drift apart,
 * and so a test can assert every private route is covered.
 */
export const PRIVATE_PATH_PREFIXES: readonly string[] = [
  "/cart",
  "/checkout",
  "/order",
  "/track",
  "/track-order",
  "/api",
];

/** True when a path is one of the private prefixes above. */
export function isPrivatePath(path: string): boolean {
  return PRIVATE_PATH_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}
