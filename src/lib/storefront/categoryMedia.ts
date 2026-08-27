import fs from "node:fs";
import path from "node:path";

import { departmentFor } from "./showcase";
import type { StorefrontImage } from "./types";

/**
 * Department imagery, read from `public/` — never from a hard-coded third-party URL.
 *
 * WHY THIS REPLACED THE UNSPLASH IDS
 * ----------------------------------
 * The previous version shipped eight hard-coded `images.unsplash.com` photo IDs. There is no
 * outbound network access in the environment this project is built in, so not one of them could be
 * checked, and both failure modes duly happened in production:
 *
 *   - one ID 404'd outright, which Next's image optimiser logs as an upstream error on every
 *     request for it;
 *   - another resolved to a photograph of COFFEE BEANS while its alt text said "small kitchen
 *     appliance on a worktop" — a broken image is obvious, but a plausible photograph of the wrong
 *     thing is worse, because it silently mislabels a category and lies to screen readers.
 *
 * An unverifiable URL is not a fallback, it is a liability. So imagery now comes from files the
 * store owner controls, and the absence of a file is a designed state rather than an error.
 *
 * HOW TO ADD IMAGES
 * -----------------
 * Drop files into `public/categories/` named after the department key, e.g. `electronics.jpg`,
 * `home-kitchen.webp`, `tools.png`. Keys are listed in SHOWCASE_CATEGORIES. Anything absent falls
 * back to a tinted department card, which is a deliberate part of the design and looks intentional.
 *
 * `public/brand-story.jpg` backs the trust banner the same way; without it the banner is a deep
 * navy panel, which is exactly what it already renders underneath the photograph.
 *
 * WHY THE FILESYSTEM AND NOT A CONFIG LIST
 * ----------------------------------------
 * Because a config entry can be wrong. `next/image` on a missing local file produces the same
 * upstream error as a bad remote URL, so listing filenames in code would reintroduce the exact
 * problem this module exists to remove. Reading the directory means the only images referenced are
 * the ones that demonstrably exist.
 *
 * These are CATEGORY illustrations, not products: no price, no title, no MOQ, no add-to-cart, and
 * they link to a catalog search. Real product photography from Shopify always takes priority — on a
 * configured store none of this renders at all.
 */

const MEDIA_DIRECTORY = path.join(process.cwd(), "public", "categories");
const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);

function readDirectory(directory: string): { name: string; base: string }[] {
  try {
    return fs
      .readdirSync(directory, { withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => ({
        name: entry.name,
        base: path.basename(entry.name, path.extname(entry.name)).toLowerCase(),
      }))
      .filter((entry) => IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase()))
      // Stable order, so which file wins for a duplicated key does not depend on the filesystem.
      .sort((left, right) => left.name.localeCompare(right.name));
  } catch {
    // Missing directory is the normal case on a fresh checkout, not an error worth logging.
    return [];
  }
}

function buildIndex(): Record<string, string> {
  const index: Record<string, string> = {};
  for (const entry of readDirectory(MEDIA_DIRECTORY)) {
    index[entry.base] ??= `/categories/${encodeURIComponent(entry.name)}`;
  }
  return index;
}

/**
 * Cached in production, re-read in development.
 *
 * A synchronous directory read per render is wasteful in production and irrelevant in development —
 * where re-reading is what lets someone drop a file in and refresh, instead of restarting the
 * server and concluding the feature is broken.
 */
const productionIndex = process.env.NODE_ENV === "production" ? buildIndex() : null;

function index(): Record<string, string> {
  return productionIndex ?? buildIndex();
}

/** Public path for a department key's image, or null when no such file exists. */
export function departmentMedia(key: string): string | null {
  return index()[key.trim().toLowerCase()] ?? null;
}

/**
 * An image for a free-text category label, or null.
 *
 * Resolves the label to a department first (see `departmentFor`, which deliberately refuses to
 * guess), then looks for that department's file. So a label like "Monsoon Clearance" gets no
 * image even if every file is present — it is not a department, and dressing it in one
 * department's photograph would misdescribe it.
 */
export function departmentImageFor(label: string): StorefrontImage | null {
  const department = departmentFor(label);
  if (!department) return null;

  const url = departmentMedia(department.key);
  if (!url) return null;

  return { url, alt: `${department.label}`, width: null, height: null };
}

/** The trust banner's background, or null when `public/brand-story.*` is absent. */
export function brandStoryMedia(): StorefrontImage | null {
  const match = readDirectory(path.join(process.cwd(), "public")).find(
    (entry) => entry.base === "brand-story",
  );
  if (!match) return null;

  return {
    url: `/${encodeURIComponent(match.name)}`,
    alt: "Stacked cartons ready for dispatch",
    width: null,
    height: null,
  };
}
