import { describe, expect, it } from "vitest";

import {
  SHOWCASE_CATEGORIES,
  showcaseCollage,
  showcaseImageFor,
} from "./showcase";

/**
 * The curated fallback imagery.
 *
 * The risk this module carries is not a rendering bug, it is a CLAIM: put a photograph of
 * earbuds on a category that is not electronics and the page is lying about what it sells. So
 * the tests are mostly about the cases where it must refuse to guess.
 */
describe("showcaseImageFor", () => {
  it("matches a department by exact label", () => {
    expect(showcaseImageFor("Electronics")?.url).toContain("images.unsplash.com");
  });

  it("matches case-insensitively and with surrounding whitespace", () => {
    expect(showcaseImageFor("  eLeCtRoNiCs  ")).not.toBeNull();
  });

  it("matches on a keyword inside a longer label", () => {
    // A real Shopify collection is called "Home & Kitchen Essentials", not "Kitchen".
    expect(showcaseImageFor("Home & Kitchen Essentials")).not.toBeNull();
    expect(showcaseImageFor("Bluetooth Audio Gear")).not.toBeNull();
  });

  it("returns null for a label it cannot place, rather than guessing", () => {
    // This is the important one. "Monsoon Clearance" is not a department, and illustrating it
    // with a photograph of headphones would tell a shopper the sale is about electronics.
    expect(showcaseImageFor("Monsoon Clearance")).toBeNull();
    expect(showcaseImageFor("Festive Picks")).toBeNull();
  });

  it("returns null for an empty or whitespace label", () => {
    expect(showcaseImageFor("")).toBeNull();
    expect(showcaseImageFor("   ")).toBeNull();
  });

  it("gives every department a non-empty alt text", () => {
    // These are decorative in the category rail but load-bearing in the hero collage, where
    // they are the only description of the image a screen-reader user gets.
    for (const category of SHOWCASE_CATEGORIES) {
      expect(category.image.alt.trim().length).toBeGreaterThan(0);
    }
  });

  it("only ever points at the allow-listed image host", () => {
    // next.config.ts lists exactly two remote patterns and the CSP lists the same two. A URL
    // on any other host renders as a broken image in production and nowhere else.
    for (const category of SHOWCASE_CATEGORIES) {
      expect(category.image.url.startsWith("https://images.unsplash.com/")).toBe(true);
    }
  });

  it("links departments to a route that always resolves", () => {
    // The fallback rail is shown when the catalog is unreachable, so a filtered URL could point
    // at a category that does not exist. /shop always renders, empty state included.
    for (const category of SHOWCASE_CATEGORIES) {
      expect(category.href).toBe("/shop");
    }
  });
});

describe("showcaseCollage", () => {
  it("returns the requested number of entries", () => {
    expect(showcaseCollage(4)).toHaveLength(4);
    expect(showcaseCollage(1)).toHaveLength(1);
  });

  it("spreads across departments rather than repeating one", () => {
    // A collage of four electronics photos would say "electronics shop". The point of the hero
    // visual is that this is a multi-category marketplace.
    const titles = showcaseCollage(4).map((entry) => entry.title);
    expect(new Set(titles).size).toBe(4);
  });

  it("never returns the same image twice", () => {
    const urls = showcaseCollage(4).map((entry) => entry.image.url);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it("handles zero and negative counts without throwing", () => {
    expect(showcaseCollage(0)).toEqual([]);
    expect(showcaseCollage(-3)).toEqual([]);
  });

  it("caps at the number of departments available", () => {
    expect(showcaseCollage(99)).toHaveLength(SHOWCASE_CATEGORIES.length);
  });
});
