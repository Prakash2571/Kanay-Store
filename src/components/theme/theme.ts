/**
 * Theme resolution, as pure functions.
 *
 * The interesting part of a theme toggle is not the button, it is the ORDER of precedence
 * and the moment the class is applied. Both are easy to get subtly wrong in ways that only
 * show up as a flash of the wrong colour, so the rules live here and are unit-tested.
 */

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "kanay-theme";

/** Narrows an unknown stored value. Anything unrecognised means "no preference". */
export function parseThemePreference(value: unknown): ThemePreference | null {
  return value === "light" || value === "dark" || value === "system" ? value : null;
}

/**
 * The theme to paint.
 *
 * An explicit choice always wins over the operating system: a visitor who pressed the
 * toggle has stated a preference for THIS site, and having the OS override it on the next
 * page load would make the button look broken.
 */
export function resolveTheme(
  preference: ThemePreference | null,
  systemPrefersDark: boolean,
): ResolvedTheme {
  if (preference === "light" || preference === "dark") return preference;
  return systemPrefersDark ? "dark" : "light";
}

/** What the toggle switches to. `system` resolves first, so one press always visibly flips. */
export function nextPreference(
  current: ThemePreference | null,
  systemPrefersDark: boolean,
): ResolvedTheme {
  return resolveTheme(current, systemPrefersDark) === "dark" ? "light" : "dark";
}

/**
 * The pre-hydration script, as a string.
 *
 * Runs BEFORE first paint, in <head>, so the correct tokens are in place before anything
 * renders. Without it the page paints light, React hydrates, and the theme snaps to dark -
 * the flash every hand-rolled toggle ships with at least once.
 *
 * Deliberately tiny and dependency-free: it is inlined into the document, it runs on every
 * navigation, and it must not be able to throw. `try/catch` because localStorage access
 * throws outright in some privacy modes, and a theme preference is never worth a blank page.
 *
 * Not a security concern: the string is a fixed literal with no interpolation, so there is
 * nothing for a caller to inject into it.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var s=localStorage.getItem("${THEME_STORAGE_KEY}");var d=s==="dark"||((s===null||s==="system")&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);document.documentElement.style.colorScheme=d?"dark":"light";}catch(e){}})();`;
