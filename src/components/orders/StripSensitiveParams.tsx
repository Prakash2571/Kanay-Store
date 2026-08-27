"use client";

import { useEffect } from "react";

/**
 * Removes order tokens from the address bar once the page has rendered.
 *
 * WHY
 * ---
 * The confirmation page has to receive the status/tracking token in the URL: it is
 * server-rendered, so the token must arrive with the request. But once the page exists,
 * leaving it there is pure exposure - a URL is the least private part of a request:
 *
 *   * it stays in the address bar, so it is what a customer copies, bookmarks or
 *     shares when they want to show someone their order
 *   * it stays in browser history, and in the history of any device that syncs it
 *   * it is the Referer on any outbound click (mitigated by Referrer-Policy:
 *     no-referrer in next.config.ts, but not every context honours it)
 *   * it lands in access logs on every proxy in front of this app
 *
 * `history.replaceState` rewrites the CURRENT entry, so nothing navigates, no data is
 * re-fetched and the rendered page is untouched - the token simply stops being visible.
 * It is a progressive improvement: with JavaScript disabled the page still works, it
 * just keeps the URL it arrived with.
 */
export function StripSensitiveParams({ params }: { params: string[] }) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const url = new URL(window.location.href);
    let changed = false;
    for (const name of params) {
      if (url.searchParams.has(name)) {
        url.searchParams.delete(name);
        changed = true;
      }
    }
    if (!changed) return;

    const search = url.searchParams.toString();
    window.history.replaceState(
      window.history.state,
      "",
      `${url.pathname}${search === "" ? "" : `?${search}`}`,
    );
  }, [params]);

  return null;
}
