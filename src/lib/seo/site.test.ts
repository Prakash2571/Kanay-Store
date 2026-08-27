import { afterEach, describe, expect, it } from "vitest";

import { PRIVATE_PATH_PREFIXES, absoluteUrl, isPrivatePath, siteOrigin, storeName } from "./site";

/**
 * The origin feeds canonical links, OpenGraph URLs, the sitemap and JSON-LD. If any of
 * them disagree, search engines report a canonical mismatch - and the previous code
 * duplicated the fallback in two files, which is how they drift.
 */

const ORIGINAL_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;
const ORIGINAL_STORE_NAME = process.env.NEXT_PUBLIC_STORE_NAME;

function setSiteUrl(value: string | undefined): void {
  if (value === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
  else process.env.NEXT_PUBLIC_SITE_URL = value;
}

afterEach(() => {
  setSiteUrl(ORIGINAL_SITE_URL);
  if (ORIGINAL_STORE_NAME === undefined) delete process.env.NEXT_PUBLIC_STORE_NAME;
  else process.env.NEXT_PUBLIC_STORE_NAME = ORIGINAL_STORE_NAME;
});

describe("siteOrigin normalises whatever the environment supplies", () => {
  it("returns a configured https origin unchanged", () => {
    setSiteUrl("https://kanay.example.com");
    expect(siteOrigin()).toBe("https://kanay.example.com");
  });

  it("strips a trailing slash", () => {
    // Without this, `${origin}/products/x` becomes `//products/x`.
    setSiteUrl("https://kanay.example.com/");
    expect(siteOrigin()).toBe("https://kanay.example.com");
  });

  it("strips a path, keeping only the origin", () => {
    setSiteUrl("https://kanay.example.com/store/");
    expect(siteOrigin()).toBe("https://kanay.example.com");
  });

  it("assumes https for a bare hostname", () => {
    // A deployment that omits the scheme would otherwise silently publish localhost
    // URLs in its sitemap and canonical tags.
    setSiteUrl("kanay.example.com");
    expect(siteOrigin()).toBe("https://kanay.example.com");
  });

  it("falls back to localhost when unset", () => {
    setSiteUrl(undefined);
    expect(siteOrigin()).toBe("http://localhost:3000");
  });

  it("falls back for an empty or whitespace value", () => {
    setSiteUrl("   ");
    expect(siteOrigin()).toBe("http://localhost:3000");
  });

  it("falls back rather than throwing on an unparseable value", () => {
    // A metadata file that throws at module load takes the whole route down.
    setSiteUrl("http://");
    expect(siteOrigin()).toBe("http://localhost:3000");
  });

  it("refuses a non-http scheme", () => {
    setSiteUrl("javascript:alert(1)");
    expect(siteOrigin()).toBe("http://localhost:3000");
  });

  it("preserves an explicit port", () => {
    setSiteUrl("http://localhost:4321");
    expect(siteOrigin()).toBe("http://localhost:4321");
  });
});

describe("absoluteUrl joins with exactly one slash", () => {
  it("joins a rooted path", () => {
    setSiteUrl("https://kanay.example.com");
    expect(absoluteUrl("/products/tee")).toBe("https://kanay.example.com/products/tee");
  });

  it("joins a path with no leading slash", () => {
    setSiteUrl("https://kanay.example.com");
    expect(absoluteUrl("sitemap.xml")).toBe("https://kanay.example.com/sitemap.xml");
  });

  it("never produces a double slash even when the env value had a trailing one", () => {
    setSiteUrl("https://kanay.example.com/");
    expect(absoluteUrl("/shop")).toBe("https://kanay.example.com/shop");
  });
});

describe("private paths are declared in one place", () => {
  it("covers every non-indexable route the storefront has", () => {
    // Kept in step with the routes under src/app. A route added here without a robots
    // rule is a page a crawler can index.
    for (const path of ["/cart", "/checkout", "/order", "/track", "/track-order", "/api"]) {
      expect(PRIVATE_PATH_PREFIXES).toContain(path);
    }
  });

  it("matches the prefix itself and anything beneath it", () => {
    expect(isPrivatePath("/cart")).toBe(true);
    expect(isPrivatePath("/order/success")).toBe(true);
    // The specific leak this guards: a secure tracking token in a crawlable URL.
    expect(isPrivatePath("/track/abc123")).toBe(true);
    expect(isPrivatePath("/api/health")).toBe(true);
  });

  it("does not match public routes", () => {
    expect(isPrivatePath("/")).toBe(false);
    expect(isPrivatePath("/shop")).toBe(false);
    expect(isPrivatePath("/products/black-tee")).toBe(false);
    expect(isPrivatePath("/collections/tees")).toBe(false);
  });

  it("does not match a public path that merely starts with the same letters", () => {
    // "/cartography" is not "/cart".
    expect(isPrivatePath("/cartography")).toBe(false);
    expect(isPrivatePath("/tracksuits")).toBe(false);
  });
});

describe("storeName", () => {
  it("uses the configured name", () => {
    process.env.NEXT_PUBLIC_STORE_NAME = "Kanay Fashion";
    expect(storeName()).toBe("Kanay Fashion");
  });

  it("falls back when unset or blank", () => {
    process.env.NEXT_PUBLIC_STORE_NAME = "  ";
    expect(storeName()).toBe("Kanay Store");
  });
});
