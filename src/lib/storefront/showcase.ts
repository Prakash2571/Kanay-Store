/**
 * Department identity: a colour and a keyword table, per category.
 *
 * ONE KEYWORD TABLE, TWO CONSUMERS
 * --------------------------------
 * Categories on this storefront come from live Shopify collections and product types, so their
 * labels are free text ("Home & Kitchen Essentials", "Bluetooth Audio Gear"). Both the colour
 * coding and the imagery lookup resolve that text, and they share one table here so a label can
 * never get an electronics photograph and a green card.
 *
 * THERE ARE NO IMAGE URLS IN THIS FILE ANY MORE
 * --------------------------------------------
 * There were eight hard-coded `images.unsplash.com` IDs. Nothing in the build environment can
 * reach the network, so none of them could be verified, and both failure modes reached production:
 * one 404'd, and another resolved to a photograph of coffee beans under alt text reading "small
 * kitchen appliance on a worktop". The broken one was obvious; the plausible-but-wrong one silently
 * mislabelled a category and lied to screen readers, which is worse.
 *
 * Imagery now lives in `public/categories/` and is discovered by `categoryMedia.ts`, so the only
 * images referenced are ones that demonstrably exist. This module stays pure and testable: it maps
 * a label to a department, a colour and a key, and nothing else.
 */

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
  /**
   * Stable key. Also the filename a store owner uses to supply this department's photograph:
   * `public/categories/<key>.jpg`. See categoryMedia.ts.
   */
  key: string;
  /** Department name, matched case-insensitively against live category labels. */
  label: string;
  /** Keywords that resolve a free-text label to this department. */
  match: string[];
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
    tint: "blue",
    href: "/shop",
  },
  {
    key: "home-kitchen",
    label: "Home & Kitchen",
    match: ["home", "kitchen", "appliance", "cookware", "utensil", "decor", "furnish", "living", "lighting", "drinkware", "bottle"],
    tint: "green",
    href: "/shop",
  },
  {
    key: "accessories",
    label: "Accessories",
    match: ["accessor", "watch", "wearable", "jewel", "bag", "backpack", "luggage", "wallet", "belt"],
    tint: "lavender",
    href: "/shop",
  },
  {
    key: "beauty",
    label: "Beauty & Personal Care",
    match: ["beauty", "skincare", "personal care", "cosmetic", "grooming", "fragrance"],
    tint: "rose",
    href: "/shop",
  },
  {
    key: "tools",
    label: "Tools & Hardware",
    match: ["tool", "hardware", "automotive", "diy", "industrial", "paint"],
    tint: "yellow",
    href: "/shop",
  },
  {
    key: "office",
    label: "Office & Stationery",
    match: ["office", "stationery", "stationary", "paper", "desk", "school"],
    tint: "slate",
    href: "/shop",
  },
  {
    key: "fitness",
    label: "Sports & Fitness",
    match: ["fitness", "sport", "gym", "outdoor", "cycle", "yoga"],
    tint: "teal",
    href: "/shop",
  },
  {
    key: "fashion",
    label: "Fashion",
    match: ["fashion", "apparel", "clothing", "shirt", "wear", "textile", "footwear", "shoe"],
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

/**
 * The colour a category card should wear.
 *
 * Always returns a tint — unlike the image lookup, there is no harm in a neutral colour for an
 * unrecognised label, and returning null would push a fallback decision into every caller.
 */
export function categoryTintFor(label: string): Tint {
  return TINTS[departmentFor(label)?.tint ?? DEFAULT_TINT];
}

/**
 * `count` departments for the hero collage, spread across the catalog.
 *
 * Returns DEPARTMENTS, not images: the caller resolves each one against `public/categories/` and
 * renders a tinted card where there is no file. The order is the spread — electronics, home,
 * accessories, beauty — four visibly different things, which is what makes the collage read as a
 * general marketplace rather than a single-category shop.
 */
export function showcaseCollage(count: number): ShowcaseCategory[] {
  return SHOWCASE_CATEGORIES.slice(0, Math.max(0, count));
}
