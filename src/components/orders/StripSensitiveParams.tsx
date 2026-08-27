"use client";

import { useEffect } from "react";

import { stripSensitiveParams } from "@/lib/storefront/urlParams";

/**
 * Removes order tokens from the address bar once the page has rendered.
 *
 * WHY
 * ---
 * The confirmation page has to receive the status/tracking token in the URL: it is
 * server-rendered, so the token must arrive with the request. But once the page exists,
 * leaving it there is pure exposure - see the header of lib/storefront/urlParams.ts for
 * the full list of places a URL ends up.
 *
 * `history.replaceState` rewrites the CURRENT entry, so nothing navigates, no data is
 * re-fetched and the rendered page is untouched - the token simply stops being visible.
 * It runs in an effect, which means it runs after hydration; combined with
 * `router.replace` at the navigation site, the token is never a back-button entry and
 * never survives a reload.
 *
 * Progressive: with JavaScript disabled the page still works, it just keeps the URL it
 * arrived with. The token is a short-lived credential the customer already holds, so
 * that is a degradation and not a hole.
 */
export function StripSensitiveParams({ params }: { params: string[] }) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const { url, changed } = stripSensitiveParams(window.location.href, params);
    if (!changed) return;

    window.history.replaceState(window.history.state, "", url);
    // `params` is a literal array at the only call site, so this effect re-runs on
    // every render - which is harmless and, after the first pass, a no-op: `changed`
    // is false once the parameters are gone.
  }, [params]);

  return null;
}
