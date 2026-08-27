import { describe, expect, it } from "vitest";

import {
  THEME_INIT_SCRIPT,
  THEME_STORAGE_KEY,
  nextPreference,
  parseThemePreference,
  resolveTheme,
} from "./theme";

/**
 * Theme precedence and the no-flash script.
 *
 * The bugs a theme toggle actually ships with are all in these rules: the OS overriding an
 * explicit choice on the next page load (so the button looks broken), one press not visibly
 * flipping anything when the stored value is "system", and the init script throwing in a
 * privacy mode where localStorage access is blocked - which would leave a blank page.
 */

describe("parseThemePreference", () => {
  it("accepts the three known values", () => {
    expect(parseThemePreference("light")).toBe("light");
    expect(parseThemePreference("dark")).toBe("dark");
    expect(parseThemePreference("system")).toBe("system");
  });

  it("treats anything else as no preference", () => {
    // Storage is shared with the whole origin and survives deploys, so a stale or hand-edited
    // value has to degrade rather than propagate.
    for (const value of [null, undefined, "", "DARK", "auto", 1, {}]) {
      expect(parseThemePreference(value)).toBeNull();
    }
  });
});

describe("resolveTheme", () => {
  it("follows the system when there is no explicit choice", () => {
    expect(resolveTheme(null, true)).toBe("dark");
    expect(resolveTheme(null, false)).toBe("light");
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
  });

  it("lets an explicit choice beat the system", () => {
    // Someone who pressed the toggle stated a preference for THIS site. Having the OS
    // override it on the next page load is the single most common theme-toggle bug.
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
  });
});

describe("nextPreference", () => {
  it("flips an explicit choice", () => {
    expect(nextPreference("light", false)).toBe("dark");
    expect(nextPreference("dark", false)).toBe("light");
  });

  it("flips away from whatever is currently PAINTED when following the system", () => {
    // With nothing stored on a dark-mode device, one press must produce light. Returning
    // "dark" (the raw opposite of the stored null) would leave the page unchanged and make
    // the button feel dead.
    expect(nextPreference(null, true)).toBe("light");
    expect(nextPreference(null, false)).toBe("dark");
    expect(nextPreference("system", true)).toBe("light");
  });
});

describe("THEME_INIT_SCRIPT", () => {
  it("references the same storage key the toggle writes", () => {
    // Two copies of this string drifting apart is a toggle that appears not to persist.
    expect(THEME_INIT_SCRIPT).toContain(THEME_STORAGE_KEY);
  });

  it("falls back to the OS preference", () => {
    expect(THEME_INIT_SCRIPT).toContain("prefers-color-scheme: dark");
  });

  it("cannot throw where localStorage is blocked", () => {
    // Access itself throws in some privacy modes. A theme preference is never worth a blank
    // page, so the whole body is wrapped.
    expect(THEME_INIT_SCRIPT).toContain("try{");
    expect(THEME_INIT_SCRIPT).toContain("catch(e){}");
  });

  it("sets the class AND color-scheme before paint", () => {
    // The class swaps the tokens; color-scheme fixes native form controls and scrollbars,
    // which otherwise stay light inside a dark page.
    expect(THEME_INIT_SCRIPT).toContain('classList.toggle("dark"');
    expect(THEME_INIT_SCRIPT).toContain("colorScheme");
  });

  it("interpolates nothing, so there is nothing to inject", () => {
    // It is inlined into the document with dangerouslySetInnerHTML, so this is the property
    // that makes that safe: the script is a fixed literal.
    expect(THEME_INIT_SCRIPT).not.toContain("${");
  });

  it("is small enough to inline on every page", () => {
    expect(THEME_INIT_SCRIPT.length).toBeLessThan(600);
  });
});
