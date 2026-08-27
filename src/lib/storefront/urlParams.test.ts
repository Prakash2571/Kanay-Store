import { describe, expect, it } from "vitest";

import { stripSensitiveParams } from "./urlParams";

/**
 * The confirmation URL carries a bearer credential. These tests pin the rewrite that
 * takes it out of the address bar - including the cases where it must NOT rewrite,
 * because an unnecessary history write on every render is its own bug.
 */

describe("stripSensitiveParams", () => {
  const NAMES = ["token", "tracking", "session"];

  it("removes the tokens and keeps the path", () => {
    const result = stripSensitiveParams(
      "https://kanay.example/order/success?session=cs_1&token=abc123&tracking=xyz789",
      NAMES,
    );

    expect(result.changed).toBe(true);
    expect(result.url).toBe("/order/success");
    expect(result.url).not.toContain("abc123");
    expect(result.url).not.toContain("xyz789");
    expect(result.url).not.toContain("cs_1");
  });

  it("preserves parameters that are not credentials", () => {
    // A page may legitimately depend on the rest of the query string; stripping it
    // would change what the customer is looking at.
    const result = stripSensitiveParams(
      "https://kanay.example/order/success?token=abc&utm_source=email&ref=newsletter",
      NAMES,
    );

    expect(result.url).toBe("/order/success?utm_source=email&ref=newsletter");
  });

  it("reports no change when there is nothing to strip", () => {
    // The caller skips the history write on `changed: false`. Without this the effect
    // would call replaceState on every render forever.
    const result = stripSensitiveParams("https://kanay.example/order/success", NAMES);

    expect(result.changed).toBe(false);
    expect(result.url).toBe("/order/success");
  });

  it("is idempotent", () => {
    const once = stripSensitiveParams(
      "https://kanay.example/order/success?token=abc",
      NAMES,
    );
    const twice = stripSensitiveParams(`https://kanay.example${once.url}`, NAMES);

    expect(twice.changed).toBe(false);
    expect(twice.url).toBe(once.url);
  });

  it("removes an empty-valued parameter too", () => {
    // `?token=` is still a token parameter, and leaving it behind looks like a bug.
    const result = stripSensitiveParams("https://kanay.example/order/success?token=", NAMES);

    expect(result.changed).toBe(true);
    expect(result.url).toBe("/order/success");
  });

  it("removes every occurrence of a repeated parameter", () => {
    const result = stripSensitiveParams(
      "https://kanay.example/order/success?token=a&token=b&keep=1",
      NAMES,
    );

    expect(result.url).toBe("/order/success?keep=1");
  });

  it("keeps the path exactly, including a trailing segment", () => {
    const result = stripSensitiveParams(
      "https://kanay.example/track/abc123?tracking=abc123",
      NAMES,
    );

    // The /track/:token route carries the token in the PATH; this helper only rewrites
    // the query string, so the path must survive untouched.
    expect(result.url).toBe("/track/abc123");
  });
});
