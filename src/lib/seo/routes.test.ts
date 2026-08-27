import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * robots.txt and sitemap.xml.
 *
 * Both were missing entirely, so crawlers had no guidance and no product discovery path.
 * The properties worth pinning are not "does it render" but:
 *
 *   - robots must DISALLOW every private route, especially /track, which carries a
 *     secure order token in the URL
 *   - the sitemap must never list a private route, since a sitemap is an invitation
 *   - the sitemap must never throw, because a repeated 500 on /sitemap.xml is worse for
 *     ranking than having no sitemap
 *   - the sitemap must terminate, even if the backend reports hasNextPage forever
 */

const getCatalog = vi.fn();
const getCollections = vi.fn();

vi.mock("@/lib/storefront/catalog", () => ({ getCatalog: (...args: unknown[]) => getCatalog(...args) }));
vi.mock("@/lib/storefront/collections", () => ({
  getCollections: (...args: unknown[]) => getCollections(...args),
}));

const ORIGINAL_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;

beforeEach(() => {
  getCatalog.mockReset();
  getCollections.mockReset();
  process.env.NEXT_PUBLIC_SITE_URL = "https://kanay.example.com";
});

afterEach(() => {
  if (ORIGINAL_SITE_URL === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
  else process.env.NEXT_PUBLIC_SITE_URL = ORIGINAL_SITE_URL;
});

function page(handles: string[], hasNextPage = false, endCursor: string | null = null) {
  return {
    ok: true as const,
    data: {
      products: handles.map((handle) => ({ id: handle, handle, title: handle })),
      pageInfo: { hasNextPage, endCursor },
      filters: { collections: [] },
    },
  };
}

/**
 * `MetadataRoute.Robots['rules']` is a single object OR an array of them, so it has to be
 * narrowed through a stable reference - `Array.isArray(robots().rules)` does not narrow
 * `robots().rules`, because each call is a fresh expression.
 */
async function firstRobotsRule(): Promise<{ allow?: unknown; disallow?: unknown }> {
  const { default: robots } = await import("@/app/robots");
  const rules = robots().rules;
  const rule = Array.isArray(rules) ? rules[0] : rules;
  return (rule ?? {}) as { allow?: unknown; disallow?: unknown };
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((entry): entry is string => typeof entry === "string");
  return typeof value === "string" ? [value] : [];
}

describe("robots.txt", () => {
  it("allows the site root", async () => {
    const rule = await firstRobotsRule();
    expect(asStringArray(rule.allow)).toContain("/");
  });

  it("disallows every private route, including the tokenised tracking path", async () => {
    const rule = await firstRobotsRule();
    const disallow = asStringArray(rule.disallow);

    for (const path of ["/cart", "/checkout", "/order", "/track", "/track-order", "/api"]) {
      expect(disallow).toContain(path);
    }
  });

  it("points at the sitemap with an absolute URL", async () => {
    const { default: robots } = await import("@/app/robots");
    expect(robots().sitemap).toBe("https://kanay.example.com/sitemap.xml");
  });

  it("declares the canonical host", async () => {
    const { default: robots } = await import("@/app/robots");
    expect(robots().host).toBe("https://kanay.example.com");
  });
});

describe("sitemap.xml", () => {
  it("always includes the static public routes", async () => {
    getCatalog.mockResolvedValue(page([]));
    getCollections.mockResolvedValue({ ok: true, data: [] });

    const { default: sitemap } = await import("@/app/sitemap");
    const urls = (await sitemap()).map((entry) => entry.url);

    expect(urls).toContain("https://kanay.example.com/");
    expect(urls).toContain("https://kanay.example.com/shop");
  });

  it("lists products and collections", async () => {
    getCatalog.mockResolvedValue(page(["black-tee", "white-tee"]));
    getCollections.mockResolvedValue({
      ok: true,
      data: [{ id: "c1", handle: "tees", title: "Tees" }],
    });

    const { default: sitemap } = await import("@/app/sitemap");
    const urls = (await sitemap()).map((entry) => entry.url);

    expect(urls).toContain("https://kanay.example.com/products/black-tee");
    expect(urls).toContain("https://kanay.example.com/products/white-tee");
    expect(urls).toContain("https://kanay.example.com/collections/tees");
  });

  it("NEVER lists a private route", async () => {
    // A sitemap is an invitation to crawl, so listing one of these would directly
    // contradict robots.txt.
    getCatalog.mockResolvedValue(page(["black-tee"]));
    getCollections.mockResolvedValue({ ok: true, data: [] });

    const { default: sitemap } = await import("@/app/sitemap");
    const urls = (await sitemap()).map((entry) => entry.url);

    for (const forbidden of ["/cart", "/checkout", "/order", "/track", "/api"]) {
      expect(urls.some((url) => url.includes(forbidden))).toBe(false);
    }
  });

  it("degrades to static routes when the backend is unavailable", async () => {
    getCatalog.mockResolvedValue({ ok: false, error: { code: "X", message: "down" } });
    getCollections.mockResolvedValue({ ok: false, error: { code: "X", message: "down" } });

    const { default: sitemap } = await import("@/app/sitemap");
    const entries = await sitemap();

    expect(entries).toHaveLength(2);
    expect(entries.map((entry) => entry.url)).toEqual([
      "https://kanay.example.com/",
      "https://kanay.example.com/shop",
    ]);
  });

  it("does not throw when the backend rejects outright", async () => {
    // A repeated 500 on /sitemap.xml is worse than no sitemap at all.
    getCatalog.mockRejectedValue(new Error("connection refused"));
    getCollections.mockRejectedValue(new Error("connection refused"));

    const { default: sitemap } = await import("@/app/sitemap");
    await expect(sitemap()).resolves.toBeInstanceOf(Array);
  });

  it("pages through the catalogue", async () => {
    getCatalog
      .mockResolvedValueOnce(page(["a"], true, "cursor-1"))
      .mockResolvedValueOnce(page(["b"], false, null));
    getCollections.mockResolvedValue({ ok: true, data: [] });

    const { default: sitemap } = await import("@/app/sitemap");
    const urls = (await sitemap()).map((entry) => entry.url);

    expect(getCatalog).toHaveBeenCalledTimes(2);
    expect(urls).toContain("https://kanay.example.com/products/a");
    expect(urls).toContain("https://kanay.example.com/products/b");
  });

  it("stops when hasNextPage is true but no cursor is returned", async () => {
    // Otherwise this loops forever re-requesting the first page.
    getCatalog.mockResolvedValue(page(["a"], true, null));
    getCollections.mockResolvedValue({ ok: true, data: [] });

    const { default: sitemap } = await import("@/app/sitemap");
    await sitemap();

    expect(getCatalog).toHaveBeenCalledTimes(1);
  });

  it("terminates at the page cap even if the backend always reports another page", async () => {
    // Bounds the work so a large or misbehaving catalogue cannot turn sitemap
    // generation into a self-inflicted outage.
    getCatalog.mockResolvedValue(page(["a"], true, "cursor"));
    getCollections.mockResolvedValue({ ok: true, data: [] });

    const { default: sitemap } = await import("@/app/sitemap");
    await sitemap();

    expect(getCatalog.mock.calls.length).toBeLessThanOrEqual(25);
    expect(getCatalog.mock.calls.length).toBeGreaterThan(1);
  });

  it("de-duplicates a handle that appears on more than one page", async () => {
    getCatalog
      .mockResolvedValueOnce(page(["dupe"], true, "cursor-1"))
      .mockResolvedValueOnce(page(["dupe"], false, null));
    getCollections.mockResolvedValue({ ok: true, data: [] });

    const { default: sitemap } = await import("@/app/sitemap");
    const urls = (await sitemap()).map((entry) => entry.url);

    expect(urls.filter((url) => url.endsWith("/products/dupe"))).toHaveLength(1);
  });
});
