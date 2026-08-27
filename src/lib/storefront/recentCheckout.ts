/**
 * The "resume checkout in this tab" pointer.
 *
 * WHAT IS STORED, AND WHY IT MOVED
 * --------------------------------
 * A checkout status token is a BEARER CREDENTIAL: whoever holds it can read that
 * order's status, name and address without any other proof of identity. It used to be
 * written to localStorage, which means it persisted on the device indefinitely, was
 * readable by any script on the origin, and survived long after the purchase it
 * belonged to. For a token whose only purpose is to let a customer pick up an
 * interrupted checkout minutes later, that is a permanent liability for a
 * few-minutes-of-convenience feature.
 *
 * It is now sessionStorage: scoped to the tab, gone when the tab closes. The trade is
 * deliberate and visible in the UI copy - "resume in this tab" rather than "on this
 * device" - and the alternative (a long-lived token in localStorage) is not one worth
 * the convenience.
 *
 * The token is never logged, never put in an analytics event (the analytics allow-list
 * in lib/analytics/events.ts cannot carry it), and never sent anywhere except the
 * Trademart API that issued it.
 */

export const RECENT_CHECKOUT_STORAGE_KEY = "kanay-recent-checkout";

export interface RecentCheckout {
  id: string;
  token: string;
}

/** Just enough of Storage to be substitutable in a test. */
export interface CheckoutStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function defaultStorage(): CheckoutStorage | null {
  try {
    if (typeof sessionStorage === "undefined") return null;
    return sessionStorage;
  } catch {
    // Private mode or blocked storage. Resuming is then unavailable, which is a
    // missing convenience and not an error worth surfacing.
    return null;
  }
}

export function rememberCheckout(
  checkout: RecentCheckout,
  storage: CheckoutStorage | null = defaultStorage(),
): void {
  if (storage === null) return;
  if (checkout.id === "" || checkout.token === "") return;
  try {
    storage.setItem(RECENT_CHECKOUT_STORAGE_KEY, JSON.stringify(checkout));
  } catch {
    /* Storage full or blocked - the checkout itself is unaffected. */
  }
}

/** Returns the pointer only when both parts are present and plausible. */
export function readRecentCheckout(
  storage: CheckoutStorage | null = defaultStorage(),
): RecentCheckout | null {
  if (storage === null) return null;
  try {
    const raw = storage.getItem(RECENT_CHECKOUT_STORAGE_KEY);
    if (raw === null) return null;
    const parsed = JSON.parse(raw) as Partial<RecentCheckout> | null;
    if (
      parsed === null ||
      typeof parsed.id !== "string" ||
      typeof parsed.token !== "string" ||
      parsed.id.trim() === "" ||
      // The backend issues 43-character base64url tokens; anything short is not one,
      // and sending it would only produce a pointless request.
      parsed.token.length < 32
    ) {
      return null;
    }
    return { id: parsed.id, token: parsed.token };
  } catch {
    return null;
  }
}

export function forgetRecentCheckout(
  storage: CheckoutStorage | null = defaultStorage(),
): void {
  if (storage === null) return;
  try {
    storage.removeItem(RECENT_CHECKOUT_STORAGE_KEY);
  } catch {
    /* Nothing to do. */
  }
}
