import type { MetadataRoute } from "next";

import { PRIVATE_PATH_PREFIXES, absoluteUrl, siteOrigin } from "@/lib/seo/site";

/**
 * robots.txt
 *
 * The storefront had none, which means crawlers were free to spend budget on /cart and
 * /checkout and to follow a secure /track/<token> link into their index. The per-route
 * `robots` metadata already marked most of those noindex, but that only helps AFTER a
 * crawler has fetched the page - and a tracking token in a request log or a public
 * index is a leak regardless of the meta tag on the response.
 *
 * Disallow and noindex are complementary, not redundant: Disallow stops the fetch,
 * the meta tag stops indexing of anything already fetched. Both are kept.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Wildcarded so /track/<token> and /collections/x are treated correctly: the
        // prefix alone would not match sub-paths for every crawler implementation.
        disallow: PRIVATE_PATH_PREFIXES.map((prefix) => `${prefix}/`).concat(
          PRIVATE_PATH_PREFIXES,
        ),
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    // Declared so a storefront reachable on more than one hostname has a single
    // preferred one rather than competing duplicates.
    host: siteOrigin(),
  };
}
