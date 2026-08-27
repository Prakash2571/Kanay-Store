import type { StorefrontImage } from "./types";

/**
 * Department identity: a photograph and a colour, per category.
 *
 * TWO JOBS, ONE KEYWORD TABLE
 * ---------------------------
 * Categories on this storefront come from live Shopify collections and product types, so their
 * labels are free text ("Home & Kitchen Essentials", "Bluetooth Audio Gear"). Two features need
 * to resolve that text: the imagery fallback and the colour coding. They share one table here so
 * a label can never get an electronics photograph and a green card.
 *
 * WHY THE PHOTOGRAPHS EXIST
 * -------------------------
 * The hero and category rail are illustrated by real merchandise on a configured store — both
 * read `images[0]` off the products the backend returned. When the catalog is unreachable or the
 * store has no products, the fallback used to be outline icons in boxes, which made the homepage
 * look like a half-built template.
 *
 * These are CATEGORY illustrations, not products. No price, no title, no MOQ, no add-to-cart,
 * and they link to a catalog search rather than a product page. That is the distinction that
 * makes them acceptable: "Electronics", over a photograph of headphones, linking to the
 * electronics filter, is a signpost. A card reading "Wireless Earbuds — ₹349/unit — MOQ 10" for
 * a product the store does not carry is a lie a customer can act on.
 *
 * THE IMAGE URLS ARE NOT VERIFIABLE FROM THIS ENVIRONMENT
 * ------------------------------------------------------
 * There is no outbound network access here, so these URLs could not be checked for a 200. Every
 * consumer therefore layers the photograph OVER a tinted, labelled surface: if a URL is wrong the
 * tile shows a soft coloured card with its department name, which is a designed state rather than
 * a broken one. Swapping any URL is a one-line change and needs no component edits.
 *
 * `images.unsplash.com` is already an allowed remote pattern in next.config.ts and already listed
 * in the CSP's `img-src`, so none of this adds a network origin.
 */

const UNSPLASH = "https://images.unsplash.com";

/** Pinned transform: fixed width, cropped, moderate quality. Keeps the URL cacheable. */
function photo(id: string, width = 800): string {
  return `${UNSPLASH}/${id}?auto=format&fit=crop&w=${width}&q=70`;
}

/**
 * The eight tint families, as LITERAL Tailwind class strings.
 *
 * THIS IS WHY THEY ARE NOT COMPOSED
 * ---------------------------------
 * Tailwind v4 finds classes by scanning source text. `bg-tint-${name}` produces no CSS at all —
 * the utility is never generated, the element renders unstyled, and nothing fails loudly. Every
 * class here is written out in full so the scanner can see it.
 *
 *   surface  soft background. The one that gets AREA.
 *   ink      dark text and meaningful icons. Clears 5.5:1 on white and on its own surface.
 *   mark     saturated. Dots, rules, decoration. NEVER behind text — every mark value lands
 *            between 2.0:1 and 3.5:1 on white.
 */
export type TintName =
  | "blue"
  | "teal"
  | "yellow"
  | "lavender"
  | "green"
  | "rose"
  | "slate"
  | "orange";

export interface Tint {
  surface: string;
  ink: string;
  mark: string;
  /** Border for a card whose surface is this tint. */
  border: string;
}

export const TINTS: Record<TintName, Tint> = {
  blue: {
    surface: "bg-tint-blue",
    ink: "text-tint-blue-ink",
    mark: "bg-tint-blue-mark",
    border: "border-tint-blue-mark/25",
  },
  teal: {
    surface: "bg-tint-teal",
    ink: "text-tint-teal-ink",
    mark: "bg-tint-teal-mark",
    border: "border-tint-teal-mark/25",
  },
  yellow: {
    surface: "bg-tint-yellow",
    ink: "text-tint-yellow-ink",
    mark: "bg-tint-yellow-mark",
    border: "border-tint-yellow-mark/30",
  },
  lavender: {
    surface: "bg-tint-lavender",
    ink: "text-tint-lavender-ink",
    mark: "bg-tint-lavender-mark",
    border: "border-tint-lavender-mark/25",
  },
  green: {
    surface: "bg-tint-green",
    ink: "text-tint-green-ink",
    mark: "bg-tint-green-mark",
    border: "border-tint-green-mark/25",
  },
  rose: {
    surface: "bg-tint-rose",
    ink: "text-tint-rose-ink",
    mark: "bg-tint-rose-mark",
    border: "border-tint-rose-mark/25",
  },
  slate: {
    surface: "bg-tint-slate",
    ink: "text-tint-slate-ink",
    mark: "bg-tint-slate-mark",
    border: "border-tint-slate-mark/25",
  },
  orange: {
    surface: "bg-tint-orange",
    ink: "text-tint-orange-ink",
    mark: "bg-tint-orange-mark",
    border: "border-tint-orange-mark/25",
  },
};

/** The tint used for any category that matches no department. Neutral, never a wrong colour. */
export const DEFAULT_TINT: TintName = "slate";

export interface ShowcaseCategory {
  key: string;
  /** Department name, matched case-insensitively against live category labels. */
  label: string;
  /** Keywords that resolve a free-text label to this department. */
  match: string[];
  image: StorefrontImage;
  tint: TintName;
  href: string;
}

/**
 * Eight departments, spanning the catalog rather than clustering in one.
 *
 * Colour assignment follows the brief, and the point of it is DIFFERENTIATION, not decoration:
 * a buyer scanning the rail twice should start to associate green with home goods. Which is also
 * why the mapping lives in one table instead of being set per-component — two components
 * disagreeing about the colour of "Home" would destroy the only benefit colour coding has.
 */
export const SHOWCASE_CATEGORIES: ShowcaseCategory[] = [
  {
    key: "electronics",
    label: "Electronics",
    match: ["electronic", "audio", "headphone", "earbud", "gadget", "tech", "computer", "mobile", "phone", "charger", "cable"],
    image: {
      url: photo("photo-1505740420928-5e560c06d30e"),
      alt: "Over-ear headphones on a plain background",
      width: 800,
      height: 800,
    },
    tint: "blue",
    href: "/shop",
  },
  {
    key: "home-kitchen",
    label: "Home & Kitchen",
    match: ["home", "kitchen", "appliance", "cookware", "utensil", "decor", "furnish", "living", "lighting", "drinkware", "bottle"],
    image: {
      url: photo("photo-1517668808822-9ebb02f2a0e6"),
      alt: "Small kitchen appliance on a worktop",
      width: 800,
      height: 800,
    },
    tint: "green",
    href: "/shop",
  },
  {
    key: "accessories",
    label: "Accessories",
    match: ["accessor", "watch", "wearable", "jewel", "bag", "backpack", "luggage", "wallet", "belt"],
    image: {
      url: photo("photo-1523275335684-37898b6baf30"),
      alt: "Wristwatch photographed on a light surface",
      width: 800,
      height: 800,
    },
    tint: "lavender",
    href: "/shop",
  },
  {
    key: "beauty",
    label: "Beauty & Personal Care",
    match: ["beauty", "skincare", "personal care", "cosmetic", "grooming", "fragrance"],
    image: {
      url: photo("photo-1556228578-8c89e6adf883"),
      alt: "Skincare bottles arranged together",
      width: 800,
      height: 800,
    },
    tint: "rose",
    href: "/shop",
  },
  {
    key: "tools",
    label: "Tools & Hardware",
    match: ["tool", "hardware", "automotive", "diy", "industrial", "paint"],
    image: {
      url: photo("photo-1581147036324-c1c9bf6df9c0"),
      alt: "Hand tools laid out on a workbench",
      width: 800,
      height: 800,
    },
    tint: "yellow",
    href: "/shop",
  },
  {
    key: "office",
    label: "Office & Stationery",
    match: ["office", "stationery", "stationary", "paper", "desk", "school"],
    image: {
      url: photo("photo-1497366216548-37526070297c"),
      alt: "Tidy office desk with stationery",
      width: 800,
      height: 800,
    },
    tint: "slate",
    href: "/shop",
  },
  {
    key: "fitness",
    label: "Sports & Fitness",
    match: ["fitness", "sport", "gym", "outdoor", "cycle", "yoga"],
    image: {
      url: photo("photo-1517836357463-d25dfeac3438"),
      alt: "Fitness equipment in a training space",
      width: 800,
      height: 800,
    },
    tint: "teal",
    href: "/shop",
  },
  {
    key: "fashion",
    label: "Fashion",
    match: ["fashion", "apparel", "clothing", "shirt", "wear", "textile", "footwear", "shoe"],
    image: {
      url: photo("photo-1483985988355-763728e1935b"),
      alt: "Folded clothing on a retail display",
      width: 800,
      height: 800,
    },
    tint: "orange",
    href: "/shop",
  },
];

/**
 * The department a free-text category label belongs to, or null.
 *
 * Exact label first, then keyword. Returns null rather than guessing — see the tests: a label
 * like "Monsoon Clearance" or "Festive Picks" is not a department, and illustrating it with a
 * photograph of headphones would tell a shopper the sale is about electronics.
 */
export function departmentFor(label: string): ShowcaseCategory | null {
  const normalised = label.trim().toLowerCase();
  if (normalised === "") return null;

  for (const category of SHOWCASE_CATEGORIES) {
    if (category.label.toLowerCase() === normalised) return category;
  }
  for (const category of SHOWCASE_CATEGORIES) {
    if (category.match.some((keyword) => normalised.includes(keyword))) return category;
  }

  return null;
}

/** A photograph for a category label with no image of its own, or null when unrecognised. */
export function showcaseImageFor(label: string): StorefrontImage | null {
  return departmentFor(label)?.image ?? null;
}

/**
 * The colour a category card should wear.
 *
 * Always returns a tint — unlike the image lookup, there is no harm in a neutral colour for an
 * unrecognised label, and returning null would push a fallback decision into every caller.
 */
export function categoryTintFor(label: string): Tint {
  return TINTS[departmentFor(label)?.tint ?? DEFAULT_TINT];
}

/** `count` photographs for the hero collage, spread across departments. */
export function showcaseCollage(count: number): { image: StorefrontImage; title: string }[] {
  return SHOWCASE_CATEGORIES.slice(0, Math.max(0, count)).map((category) => ({
    image: category.image,
    title: category.label,
  }));
}

/**
 * The brand-story banner background.
 *
 * Chosen for SUBJECT, not mood: stacked shipping cartons is the single most legible shorthand for
 * "this is a wholesale operation that dispatches orders". Deliberately not a model, not a
 * boutique, not a styled flat-lay — the brief is explicit that the section must not read as a
 * fashion campaign, and a person as the focus is what tips it there.
 *
 * Wider than the category photos because it spans the full content column; the section renders a
 * navy gradient underneath it, so if this URL is wrong the banner is a deep navy panel with
 * readable white text rather than a broken image.
 */
export const BRAND_STORY_IMAGE: StorefrontImage = {
  url: photo("photo-1553413077-190dd305871c", 1920),
  alt: "Stacked shipping cartons ready for dispatch in a warehouse",
  width: 1920,
  height: 1080,
};
