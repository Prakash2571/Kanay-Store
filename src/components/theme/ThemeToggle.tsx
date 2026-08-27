"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";

import {
  THEME_STORAGE_KEY,
  nextPreference,
  parseThemePreference,
  resolveTheme,
  type ResolvedTheme,
} from "./theme";

/**
 * The stored preference, or null when there is none.
 *
 * Wrapped because localStorage access THROWS outright in some privacy modes rather than
 * returning null, and a theme preference is never worth a blank page. A throw is treated as
 * "no explicit preference", which is the correct reading: nothing was stored.
 */
function readStoredPreference() {
  try {
    return parseThemePreference(window.localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return null;
  }
}

/**
 * Writes the theme to the document. Module-level, and touches no React state.
 *
 * The class on `<html>` is the single source of truth for the applied theme — it is what
 * THEME_INIT_SCRIPT sets before first paint, and what the CSS reads. This function is the only
 * writer, so there is no second copy of the current theme in component state that could drift
 * out of step with the document.
 */
function applyTheme(next: ResolvedTheme): void {
  document.documentElement.classList.toggle("dark", next === "dark");
  document.documentElement.style.colorScheme = next;
}

/** Notifies React whenever the `dark` class on `<html>` changes, whoever changed it. */
function subscribeToAppliedTheme(onStoreChange: () => void): () => void {
  const observer = new MutationObserver(onStoreChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
}

function readAppliedTheme(): ResolvedTheme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

/**
 * Null, because the server genuinely does not know.
 *
 * The theme comes from localStorage or an OS media query, neither of which exists during
 * server rendering. Returning null - rather than guessing "light" - is what lets the button
 * render a deliberately neutral icon for the first paint and swap to the real one after
 * hydration, instead of rendering a sun that the client then has to correct.
 */
function readServerTheme(): null {
  return null;
}

/**
 * Light/dark toggle.
 *
 * HOW THE FLASH IS AVOIDED
 * ------------------------
 * The `dark` class is already on `<html>` before this component exists — THEME_INIT_SCRIPT
 * puts it there in `<head>`. This component never decides the initial theme; it only READS
 * what was decided and writes a new one when pressed.
 *
 * WHY useSyncExternalStore AND NOT useState + useEffect
 * ----------------------------------------------------
 * The applied theme lives outside React, as a class on the document element, and it is mutated
 * by three different things: the pre-paint script, this button, and the OS-preference listener
 * below. Mirroring that into `useState` and syncing it with `setState` inside an effect is the
 * pattern `react-hooks/set-state-in-effect` exists to flag, and it deserves flagging: it makes
 * a second copy of state that can disagree with the document, and it costs an extra render on
 * every mount. `useSyncExternalStore` subscribes to the real thing — a MutationObserver on the
 * class attribute — so the icon is correct no matter which of the three writers moved it, and
 * `getServerSnapshot` handles the "server cannot know" case without a `mounted` flag.
 *
 * WHY IT LISTENS TO THE OS
 * ------------------------
 * A visitor who has never pressed the button is following their system. If they change that
 * system setting while the tab is open the page should follow, so the media query is observed —
 * and the listener bails out as soon as an explicit choice exists, because an explicit choice
 * for THIS site outranks the OS. That effect writes to the document and sets no state; the
 * re-render comes from the observer above noticing the class changed.
 */
export function ThemeToggle() {
  const theme = useSyncExternalStore<ResolvedTheme | null>(
    subscribeToAppliedTheme,
    readAppliedTheme,
    readServerTheme,
  );

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const onSystemChange = (event: MediaQueryListEvent) => {
      const preference = readStoredPreference();
      if (preference === "light" || preference === "dark") return;
      applyTheme(resolveTheme(preference, event.matches));
    };

    media.addEventListener("change", onSystemChange);
    return () => media.removeEventListener("change", onSystemChange);
  }, []);

  function toggle() {
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const next = nextPreference(readStoredPreference(), systemPrefersDark);

    applyTheme(next);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Persistence failed; the theme still applied for this page view. Not worth telling
      // the customer about, and not a reason to leave the button looking broken.
    }
  }

  // Announces the ACTION, not the state: "Switch to dark theme" tells a screen-reader user
  // what pressing it does, which is the useful half.
  const label =
    theme === null ? "Switch theme" : `Switch to ${theme === "dark" ? "light" : "dark"} theme`;

  return (
    <button
      aria-label={label}
      className="grid size-11 place-items-center rounded-[var(--radius-control)] text-ink-muted transition-colors hover:bg-surface-muted hover:text-brand-ink focus-visible:outline focus-visible:outline-2"
      onClick={toggle}
      title={label}
      type="button"
    >
      {/* Before hydration `theme` is null, so both server and client render the moon. */}
      {theme === "dark" ? (
        <Sun aria-hidden="true" size={20} strokeWidth={1.75} />
      ) : (
        <Moon aria-hidden="true" size={20} strokeWidth={1.75} />
      )}
    </button>
  );
}
