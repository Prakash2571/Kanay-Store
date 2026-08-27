import type { StorefrontImage } from "./types";

/**
 * Category photography, used ONLY when the live catalog has no image to offer.
 *
 * WHY THIS EXISTS
 * ---------------
 * The hero and the category rail are supposed to be illustrated by real merchandise, and on a
 * configured store they are: both read `images[0]` off the products the backend returned. But
 * when the catalog request fails or the store has no products yet, the fallback used to be a
 * grid of line icons — and a homepage whose main visual is six outline glyphs in boxes looks
 * like a half-built template, which is exactly the impression it was making.
 *
 * WHAT THESE IMAGES ARE, AND ARE NOT
 * ----------------------------------
 * They are CATEGORY illustrations. Each one is a photograph of the kind of goods a department
 * contains, it carries no price, no title, no MOQ and no add-to-cart, and it links to a
 * catalog search rather than to a product page. Nothing here claims a specific item is in
 * stock, because nothing here refers to a specific item.
 *
 * That distinction is the whole reason this is acceptable where a fake product card would not
 * be. A card reading "Wireless Earbuds — ₹349/unit — MOQ 10" for a product the store does not
 * carry is a lie a customer can act on. "Electronics", over a photograph of earbuds, linking to
 * the electronics filter, is a signpost.
 *
 * `images.unsplash.com` is already an allowed remote pattern in next.config.ts and already
 * listed in the CSP's `img-src`, so this adds no new network origin. URLs are pinned to a fixed
 * width and quality so they are stable and cacheable.
 *
 * WHEN THE STORE HAS A CATALOG, NONE OF THIS RENDERS.
 * Every consumer prefers a real catalog image and falls back only when there is none. If you
 * want it gone entirely, delete this file and the two `??` fallbacks that reference it.
 */

const UNSPLASH = "https://images.unsplash.com";

/** Pinned transform: fixed width, cropped, moderate quality. Keeps the URL cacheable. */
function photo(id: string): string {
  return `${UNSPLASH}/${id}?auto=format&fit=crop&w=800&q=70`;
}

export interface ShowcaseCategory {
  key: string;
  /** Department name, matched case-insensitively against live category labels. */
  label: string;
  /** Keywords that should resolve to this photograph. */
  match: string[];
  image: StorefrontImage;
  href: string;
}

/**
 * Eight departments, spanning the catalog rather than clustering in one.
 *
 * Deliberately mixed: electronics, wearables, bags, kitchen, homeware, personal care, tools
 * and mobile accessories. A hero collage of four phone cases says "phone case shop"; this is a
 * general wholesale marketplace and the imagery has to say so at a glance.
 */
export const SHOWCASE_CATEGORIES: ShowcaseCategory[] = [
  {
    key: "electronics",
    label: "Electronics",
    match: ["electronic", "audio", "headphone", "earbud", "gadget", "tech", "computer"],
    image: {
      url: photo("photo-1505740420928-5e560c06d30e"),
      alt: "Over-ear headphones on a plain background",
      width: 800,
      height: 800,
    },
    href: "/shop",
  },
  {
    key: "wearables",
    label: "Watches & Wearables",
    match: ["watch", "wearable", "smartwatch", "jewel"],
    image: {
      url: photo("photo-1523275335684-37898b6baf30"),
      alt: "Wristwatch photographed on a light surface",
      width: 800,
      height: 800,
    },
    href: "/shop",
  },
  {
    key: "bags",
    label: "Bags & Travel",
    match: ["bag", "backpack", "luggage", "travel"],
    image: {
      url: photo("photo-1553062407-98eeb64c6a62"),
      alt: "Canvas backpack standing upright",
      width: 800,
      height: 800,
    },
    href: "/shop",
  },
  {
    key: "kitchen",
    label: "Kitchen",
    match: ["kitchen", "appliance", "cookware", "utensil"],
    image: {
      url: photo("photo-1517668808822-9ebb02f2a0e6"),
      alt: "Small kitchen appliance on a worktop",
      width: 800,
      height: 800,
    },
    href: "/shop",
  },
  {
    key: "home",
    label: "Home & Living",
    match: ["home", "decor", "furnish", "living", "lighting", "bottle", "drinkware"],
    image: {
      url: photo("photo-1556228720-195a672e8a03"),
      alt: "Insulated water bottle beside home items",
      width: 800,
      height: 800,
    },
    href: "/shop",
  },
  {
    key: "beauty",
    label: "Beauty & Personal Care",
    match: ["beauty", "skincare", "personal care", "cosmetic", "grooming"],
    image: {
      url: photo("photo-1556228578-8c89e6adf883"),
      alt: "Skincare bottles arranged together",
      width: 800,
      height: 800,
    },
    href: "/shop",
  },
  {
    key: "tools",
    label: "Tools & Hardware",
    match: ["tool", "hardware", "automotive", "diy", "industrial"],
    image: {
      url: photo("photo-1581147036324-c1c9bf6df9c0"),
      alt: "Hand tools laid out on a workbench",
      width: 800,
      height: 800,
    },
    href: "/shop",
  },
  {
    key: "mobile",
    label: "Mobile Accessories",
    match: ["mobile", "phone", "charger", "cable", "accessor", "office", "stationery"],
    image: {
      url: photo("photo-1585060544812-6b45742d762f"),
      alt: "Phone charging cable and adapter",
      width: 800,
      height: 800,
    },
    href: "/shop",
  },
];

/**
 * A photograph for a live category label that has no image of its own.
 *
 * Shopify collections often have no image set, and a product type never does. Rather than
 * leaving those tiles as a coloured square with an initial in it, the label is keyword-matched
 * against the departments above. Returns null when nothing matches, and the caller must then
 * fall back to the initial — inventing a photograph for "Monsoon Clearance" would put a picture
 * of earbuds on a category that is not electronics.
 */
export function showcaseImageFor(label: string): StorefrontImage | null {
  const normalised = label.trim().toLowerCase();
  if (normalised === "") return null;

  for (const category of SHOWCASE_CATEGORIES) {
    if (category.label.toLowerCase() === normalised) return category.image;
    if (category.match.some((keyword) => normalised.includes(keyword))) return category.image;
  }

  return null;
}

/**
 * `count` photographs for the hero collage, spread across departments.
 *
 * Used only when the catalog produced fewer images than the collage needs. The order of
 * SHOWCASE_CATEGORIES is the spread: electronics, a wearable, a bag, a kitchen item — four
 * visibly different things, which is what makes the collage read as "general marketplace".
 */
export function showcaseCollage(count: number): { image: StorefrontImage; title: string }[] {
  return SHOWCASE_CATEGORIES.slice(0, Math.max(0, count)).map((category) => ({
    image: category.image,
    title: category.label,
  }));
}
