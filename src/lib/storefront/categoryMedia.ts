import fs from "node:fs";
import path from "node:path";

import { departmentFor } from "./showcase";
import type { StorefrontImage } from "./types";

/**
 * Homepage category photography.
 *
 * Source precedence is deliberate: live Shopify imagery first (at the component call sites), then
 * an owner-supplied file in `public/categories/`, then the reviewed Pexels photograph below, and
 * finally the tinted studio sweep rendered by `DepartmentVisual`.
 *
 * The remote records use permanent numeric Pexels photo paths rather than search/random endpoints.
 * Every subject was checked against its Pexels photo-page title and description before inclusion.
 * The source-page links are recorded in `public/categories/README.md` for future review.
 */

const MEDIA_DIRECTORY = path.join(process.cwd(), "public", "categories");

const REMOTE_DEPARTMENT_IMAGES = {
  electronics: {
    url: "https://images.pexels.com/photos/16303233/pexels-photo-16303233.jpeg?auto=compress&cs=tinysrgb&w=1200",
    alt: "Black over-ear wireless headphones on a white background",
    width: null,
    height: null,
  },
  "home-kitchen": {
    url: "https://images.pexels.com/photos/11770362/pexels-photo-11770362.jpeg?auto=compress&cs=tinysrgb&w=1200",
    alt: "Rice cooker and stove on a kitchen counter",
    width: null,
    height: null,
  },
  accessories: {
    url: "https://images.pexels.com/photos/11158742/pexels-photo-11158742.jpeg?auto=compress&cs=tinysrgb&w=1200",
    alt: "Smartwatch, pen and notebook on a white desk",
    width: null,
    height: null,
  },
  beauty: {
    url: "https://images.pexels.com/photos/30229015/pexels-photo-30229015.jpeg?auto=compress&cs=tinysrgb&w=1200",
    alt: "Amber skincare serum bottle with a dropper on a peach background",
    width: null,
    height: null,
  },
  tools: {
    url: "https://images.pexels.com/photos/30497344/pexels-photo-30497344.jpeg?auto=compress&cs=tinysrgb&w=1200",
    alt: "Screwdrivers and wrenches arranged in a workshop",
    width: null,
    height: null,
  },
  office: {
    url: "https://images.pexels.com/photos/5712484/pexels-photo-5712484.jpeg?auto=compress&cs=tinysrgb&w=1200",
    alt: "Notebook, pencil and envelope on a white background",
    width: null,
    height: null,
  },
  fitness: {
    url: "https://images.pexels.com/photos/4793211/pexels-photo-4793211.jpeg?auto=compress&cs=tinysrgb&w=1200",
    alt: "Pair of dumbbells ready for an outdoor workout",
    width: null,
    height: null,
  },
  fashion: {
    url: "https://images.pexels.com/photos/11739182/pexels-photo-11739182.jpeg?auto=compress&cs=tinysrgb&w=1200",
    alt: "Shirts displayed on wooden hangers in a shop",
    width: null,
    height: null,
  },
} as const satisfies Record<string, StorefrontImage>;

const REMOTE_BRAND_STORY_IMAGE: StorefrontImage = {
  url: "https://images.pexels.com/photos/4483772/pexels-photo-4483772.jpeg?auto=compress&cs=tinysrgb&w=1800",
  alt: "Warehouse workers arranging inventory on shelves",
  width: null,
  height: null,
};
/** Local raster files beat local SVG files. Order matters: it is the local precedence rule. */
const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".avif", ".svg"];

/** Lower is higher priority. Unknown extensions are filtered out before this is used. */
function extensionRank(filename: string): number {
  const rank = IMAGE_EXTENSIONS.indexOf(path.extname(filename).toLowerCase());
  return rank === -1 ? Number.MAX_SAFE_INTEGER : rank;
}

/** True for assets `next/image` must not run through its optimiser. */
export function isVectorAsset(url: string): boolean {
  return url.toLowerCase().endsWith(".svg");
}

function readDirectory(directory: string): { name: string; base: string }[] {
  try {
    return (
      fs
        .readdirSync(directory, { withFileTypes: true })
        .filter((entry) => entry.isFile())
        .map((entry) => ({
          name: entry.name,
          base: path
            .basename(entry.name, path.extname(entry.name))
            .toLowerCase(),
        }))
        .filter((entry) =>
          IMAGE_EXTENSIONS.includes(path.extname(entry.name).toLowerCase()),
        )
        // A photograph beats a same-key local SVG; ties break on name so the winner never
        // depends on filesystem ordering.
        .sort(
          (left, right) =>
            extensionRank(left.name) - extensionRank(right.name) ||
            left.name.localeCompare(right.name),
        )
    );
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
const productionIndex =
  process.env.NODE_ENV === "production" ? buildIndex() : null;

function index(): Record<string, string> {
  return productionIndex ?? buildIndex();
}

/** Owner-supplied local path first, then the reviewed remote photograph. */
export function departmentMedia(key: string): string | null {
  const normalizedKey = key.trim().toLowerCase();
  return (
    index()[normalizedKey] ??
    REMOTE_DEPARTMENT_IMAGES[
      normalizedKey as keyof typeof REMOTE_DEPARTMENT_IMAGES
    ]?.url ??
    null
  );
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

  const remote =
    REMOTE_DEPARTMENT_IMAGES[
      department.key as keyof typeof REMOTE_DEPARTMENT_IMAGES
    ];
  const alt = remote?.url === url ? remote.alt : department.label;
  return { url, alt, width: null, height: null };
}

/** Owner-supplied banner first, then the reviewed warehouse photograph. */
export function brandStoryMedia(): StorefrontImage {
  const match = readDirectory(path.join(process.cwd(), "public")).find(
    (entry) => entry.base === "brand-story",
  );
  if (!match) return REMOTE_BRAND_STORY_IMAGE;

  return {
    url: `/${encodeURIComponent(match.name)}`,
    alt: "Stacked cartons ready for dispatch",
    width: null,
    height: null,
  };
}
