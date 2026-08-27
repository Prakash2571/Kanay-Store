import { describe, expect, it } from "vitest";

import {
  DEFAULT_TINT,
  SHOWCASE_CATEGORIES,
  TINTS,
  categoryTintFor,
  departmentFor,
  showcaseCollage,
} from "./showcase";

/**
 * Department identity: keyword matching and colour coding.
 *
 * The risk this module carries is not a rendering bug, it is a CLAIM — resolve a category to the
 * wrong department and the page colours it wrong and, once imagery exists, illustrates it wrong. So
 * most of these tests are about the cases where it must refuse to guess.
 *
 * The other risk is silent: a Tailwind class assembled at runtime produces no CSS and fails
 * invisibly. The class-shape tests below exist because that failure mode has no error message.
 *
 * There are no image-URL assertions left. This module no longer carries any: hard-coded stock URLs
 * produced a 404 and a miscaptioned photograph in production, so imagery moved to files discovered
 * on disk (categoryMedia.ts) and the only images the app can reference are ones that exist.
 */
describe("departmentFor", () => {
  it("matches a department by exact label", () => {
    expect(departmentFor("Electronics")?.key).toBe("electronics");
  });

  it("matches case-insensitively and with surrounding whitespace", () => {
    expect(departmentFor("  eLeCtRoNiCs  ")?.key).toBe("electronics");
  });

  it("matches on a keyword inside a longer label", () => {
    // Real Shopify collections are called "Home & Kitchen Essentials", not "Kitchen".
    expect(departmentFor("Home & Kitchen Essentials")?.key).toBe("home-kitchen");
    expect(departmentFor("Bluetooth Audio Gear")?.key).toBe("electronics");
    expect(departmentFor("Ladies Handbags")?.key).toBe("accessories");
  });

  it("prefers an exact label over another department's keyword", () => {
    // "Accessories" is an exact department AND appears in the electronics keyword list as
    // "accessor". Exact match has to win or the colour coding contradicts the label.
    expect(departmentFor("Accessories")?.key).toBe("accessories");
  });

  it("returns null for a label it cannot place, rather than guessing", () => {
    expect(departmentFor("Monsoon Clearance")).toBeNull();
    expect(departmentFor("Festive Picks")).toBeNull();
    expect(departmentFor("")).toBeNull();
    expect(departmentFor("   ")).toBeNull();
  });
});

describe("department metadata", () => {
  it("gives every department a key usable as a filename", () => {
    // The key IS the filename an owner supplies: public/categories/<key>.jpg. A key with a space,
    // a slash or an uppercase letter would be a filename nobody can guess from the docs.
    for (const category of SHOWCASE_CATEGORIES) {
      expect(category.key).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it("keeps department keys unique", () => {
    const keys = SHOWCASE_CATEGORIES.map((category) => category.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("links departments to a route that always resolves", () => {
    // The fallback rail renders when the catalog is unreachable, so a filtered URL could point at a
    // category that does not exist. /shop always renders, empty state included.
    for (const category of SHOWCASE_CATEGORIES) {
      expect(category.href).toBe("/shop");
    }
  });

  it("gives every department a tint that exists", () => {
    for (const category of SHOWCASE_CATEGORIES) {
      expect(TINTS[category.tint]).toBeDefined();
    }
  });
});

describe("categoryTintFor", () => {
  it("colour-codes the departments as specified", () => {
    expect(categoryTintFor("Electronics")).toBe(TINTS.blue);
    expect(categoryTintFor("Home & Kitchen")).toBe(TINTS.green);
    expect(categoryTintFor("Accessories")).toBe(TINTS.lavender);
    expect(categoryTintFor("Beauty & Personal Care")).toBe(TINTS.rose);
    expect(categoryTintFor("Tools & Hardware")).toBe(TINTS.yellow);
    expect(categoryTintFor("Office & Stationery")).toBe(TINTS.slate);
    expect(categoryTintFor("Sports & Fitness")).toBe(TINTS.teal);
    expect(categoryTintFor("Fashion")).toBe(TINTS.orange);
  });

  it("falls back to a neutral tint instead of a wrong colour", () => {
    // Unlike the image lookup this never returns null: there is no harm in neutral, and returning
    // null would push a fallback decision into every caller.
    expect(categoryTintFor("Monsoon Clearance")).toBe(TINTS[DEFAULT_TINT]);
    expect(categoryTintFor("")).toBe(TINTS[DEFAULT_TINT]);
  });

  it("gives the same label the same colour every time", () => {
    // The entire value of colour coding is consistency. Two components disagreeing about the
    // colour of "Home" would destroy it, which is why the mapping lives in one table.
    expect(categoryTintFor("home & kitchen essentials")).toBe(
      categoryTintFor("Home & Kitchen Bargains"),
    );
  });
});

describe("tint class names", () => {
  /**
   * These assert the SHAPE of the strings, not their appearance, because the failure they guard
   * against is silent. Tailwind v4 generates utilities by scanning source text: a composed
   * `bg-tint-${name}` produces no CSS, the element renders unstyled, and nothing throws.
   */
  it("writes every class out in full so Tailwind can find it", () => {
    for (const [name, tint] of Object.entries(TINTS)) {
      expect(tint.surface).toBe(`bg-tint-${name}`);
      expect(tint.ink).toBe(`text-tint-${name}-ink`);
      expect(tint.mark).toBe(`bg-tint-${name}-mark`);
      expect(tint.border.startsWith(`border-tint-${name}-mark/`)).toBe(true);
    }
  });

  it("never puts a saturated mark colour behind text", () => {
    // Every `mark` value is between 2.0:1 and 3.5:1 on white, so it must only ever be a
    // background for decoration - a dot or a rule - and never a text colour.
    for (const tint of Object.values(TINTS)) {
      expect(tint.mark.startsWith("bg-")).toBe(true);
      expect(tint.ink.startsWith("text-")).toBe(true);
    }
  });

  it("covers exactly the eight families defined in the token file", () => {
    expect(Object.keys(TINTS).sort()).toEqual([
      "blue",
      "green",
      "lavender",
      "orange",
      "rose",
      "slate",
      "teal",
      "yellow",
    ]);
  });
});

describe("showcaseCollage", () => {
  it("returns the requested number of entries", () => {
    expect(showcaseCollage(4)).toHaveLength(4);
    expect(showcaseCollage(1)).toHaveLength(1);
  });

  it("spreads across departments rather than repeating one", () => {
    // Four tiles from one department would say "electronics shop". The point of the hero visual is
    // that this is a multi-category marketplace.
    expect(new Set(showcaseCollage(4).map((entry) => entry.key)).size).toBe(4);
    expect(new Set(showcaseCollage(4).map((entry) => entry.tint)).size).toBe(4);
  });

  it("handles zero and negative counts without throwing", () => {
    expect(showcaseCollage(0)).toEqual([]);
    expect(showcaseCollage(-3)).toEqual([]);
  });

  it("caps at the number of departments available", () => {
    expect(showcaseCollage(99)).toHaveLength(SHOWCASE_CATEGORIES.length);
  });
});
