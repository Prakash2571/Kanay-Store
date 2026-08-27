"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

import {
  THEME_STORAGE_KEY,
  nextPreference,
  parseThemePreference,
  resolveTheme,
  type ResolvedTheme,
} from "./theme";

/**
 * Light/dark toggle.
 *
 * HOW THE FLASH IS AVOIDED
 * ------------------------
 * The `dark` class is already on <html> before this component exists - THEME_INIT_SCRIPT
 * puts it there in <head>. This component's only job is to READ that state on mount and to
 * write the new one when pressed. It renders a stable, theme-neutral button on the server
 * (both icons, one hidden by CSS is not an option here because the server does not know the
 * theme), so `mounted` gates the icon: before mount it shows a fixed placeholder of the same
 * size, which keeps the header from shifting and keeps server and client markup identical.
 *
 * WHY IT LISTENS TO THE OS
 * ------------------------
 * A visitor who has never pressed the button is following their system. If they change that
 * system setting while the tab is open, the page should follow - so the media query is
 * observed, and the listener bails out as soon as an explicit choice exists.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<ResolvedTheme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Read what the pre-hydration script already decided rather than recomputing it: the
    // class on <html> IS the current truth, and recomputing risks disagreeing with it.
    setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystemChange = (event: MediaQueryListEvent) => {
      let stored: string | null = null;
      try {
        stored = window.localStorage.getItem(THEME_STORAGE_KEY);
      } catch {
        // Blocked storage: treat as "no explicit preference" and follow the system.
      }
      const preference = parseThemePreference(stored);
      if (preference === "light" || preference === "dark") return;
      apply(resolveTheme(preference, event.matches));
    };

    media.addEventListener("change", onSystemChange);
    return () => media.removeEventListener("change", onSystemChange);
  }, []);

  function apply(next: ResolvedTheme) {
    document.documentElement.classList.toggle("dark", next === "dark");
    document.documentElement.style.colorScheme = next;
    setTheme(next);
  }

  function toggle() {
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    } catch {
      /* Blocked storage - the toggle still works for this page view. */
    }
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const next = nextPreference(parseThemePreference(stored), systemPrefersDark);

    apply(next);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Persistence failed, the theme still applied. Not worth telling the customer about.
    }
  }

  return (
    <button
      // Announces the ACTION, not the state: "Switch to dark theme" tells a screen-reader
      // user what pressing it does, which is the useful half.
      aria-label={mounted ? `Switch to ${theme === "dark" ? "light" : "dark"} theme` : "Switch theme"}
      className="grid size-11 place-items-center rounded-[var(--radius-control)] text-ink-muted transition-colors hover:bg-surface-muted hover:text-brand-ink focus-visible:outline focus-visible:outline-2"
      onClick={toggle}
      title={mounted ? `Switch to ${theme === "dark" ? "light" : "dark"} theme` : "Switch theme"}
      type="button"
    >
      {/* Before mount the server and client must agree, so a neutral icon is rendered. */}
      {!mounted || theme === "light" ? (
        <Moon aria-hidden="true" size={20} strokeWidth={1.75} />
      ) : (
        <Sun aria-hidden="true" size={20} strokeWidth={1.75} />
      )}
    </button>
  );
}
