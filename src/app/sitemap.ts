import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/seo/site";
import { getCollections } from "@/lib/storefront/collections";
import { getCatalog } from "@/lib/storefront/catalog";
import type { StorefrontProductSummary } from "@/lib/storefront/types";

/**
 * sitemap.xml
 *
 * The storefront had none, so a crawler could only find products by following links -
 * which on a paginated catalogue means deep pages are effectively invisible.
 *
 * THREE THINGS THIS DELIBERATELY GETS RIGHT
 * -----------------------------------------
 * 1. IT PAGES, WITH A HARD CAP. `getCatalog` is cursor-paginated, so requesting
 *    "everything" in one call is not possible and asking for an enormous page would be
 *    a request the backend should refuse anyway. The cap means a catalogue that grows
 *    to 50k products cannot turn sitemap generation into a self-inflicted outage.
 *
 * 2. IT NEVER THROWS. A sitemap route that fails takes an HTTP 500 to a crawler, and a
 *    repeated 500 on /sitemap.xml is worse for ranking than having no sitemap at all.
 *    Backend unavailable degrades to the static routes only.
 *
 * 3. IT LISTS ONLY PUBLIC ROUTES. Nothing from PRIVATE_PATH_PREFIXES appears. A sitemap
 *    is an invitation to crawl, so listing /cart or a /track link would actively
 *    contradict robots.ts.
 */

/** Products per page. Matches the catalogue's own page size rather than maximising. */
const PAGE_SIZE = 100;

/**
 * Most pages to walk. 25 x 100 = 2,500 products, comfortably above the current
 * catalogue and far below anything that would make this route slow. Raise together
 * with a sitemap index if a client ever exceeds it - a single sitemap file is capped at
 * 50,000 URLs by the protocol, so this cannot silently grow past the limit either.
 */
const MAX_PAGES = 25;

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Static, always present, so an unreachable backend still yields a valid sitemap.
  const entries: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/shop"), lastModified: now, changeFrequency: "daily", priority: 0.9 },
    // /about carries the shipping, returns, payment and wholesale information a shopper
    // looks for before a first order, and the nav and footer both link to it. Low
    // frequency because it changes rarely, not because it matters less.
    { url: absoluteUrl("/about"), lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];

  const [products, collections] = await Promise.all([safeProducts(), safeCollections()]);

  for (const handle of collections) {
    entries.push({
      url: absoluteUrl(`/collections/${encodeURIComponent(handle)}`),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    });
  }

  for (const handle of products) {
    entries.push({
      url: absoluteUrl(`/products/${encodeURIComponent(handle)}`),
      lastModified: now,
      changeFrequency: "daily",
      // Product pages are the ones that should rank, but below the collections that
      // group them so a crawler prioritises structure first.
      priority: 0.7,
    });
  }

  return entries;
}

/**
 * Every product handle, paged, de-duplicated and bounded.
 *
 * De-duplication matters: a product in two collections can surface twice depending on
 * how the backend orders results, and a duplicate URL in a sitemap is a validation
 * warning that suppresses the whole file in some tools.
 */
async function safeProducts(): Promise<string[]> {
  const handles = new Set<string>();
  let cursor: string | undefined;

  for (let page = 0; page < MAX_PAGES; page += 1) {
    let result: Awaited<ReturnType<typeof getCatalog>>;
    try {
      result = await getCatalog({ first: PAGE_SIZE, ...(cursor ? { after: cursor } : {}) });
    } catch {
      // Never propagate. A partial sitemap is strictly better than a 500.
      break;
    }

    if (!result.ok) break;

    for (const product of result.data.products as StorefrontProductSummary[]) {
      if (product.handle) handles.add(product.handle);
    }

    const { hasNextPage, endCursor } = result.data.pageInfo;
    // Guard on the cursor too: `hasNextPage: true` with a null cursor would loop
    // forever requesting the same first page.
    if (!hasNextPage || !endCursor) break;
    cursor = endCursor;
  }

  return [...handles];
}

async function safeCollections(): Promise<string[]> {
  try {
    const result = await getCollections();
    if (!result.ok) return [];
    return [...new Set(result.data.map((collection) => collection.handle).filter(Boolean))];
  } catch {
    return [];
  }
}
