/**
 * Commerce analytics events, and the redaction that makes them safe to send.
 *
 * WHAT THIS IS FOR
 * ----------------
 * Answering "which products get viewed but not bought", "where do carts get abandoned",
 * "what do people search for and find nothing". None of that needs to identify a person.
 *
 * PRIVACY IS ENFORCED BY CONSTRUCTION, NOT BY REVIEW
 * --------------------------------------------------
 * Every event goes through `buildEvent`, which runs an ALLOW-LIST over the payload. A
 * field nobody explicitly permitted is dropped, so adding a new call site cannot leak a
 * customer's email or a supplier cost by passing an extra property. The alternative -
 * a deny-list of known-bad keys - fails silently the first time someone invents a new
 * field name.
 *
 * Specifically never sent: email, phone, name, any address component, any payment
 * detail, supplier id, supplier cost, margin, opportunity score, confidence, internal
 * notes, tracking tokens, cart ids.
 *
 * WHY THERE IS NO PROVIDER SDK HERE
 * ---------------------------------
 * This module only builds and dispatches events to a sink. No Google/Meta/Segment
 * script is loaded, because doing so is a consent decision a merchant makes, not one a
 * storefront should make on their behalf - and a third-party tag would also be able to
 * read the page regardless of what this allow-list permits. Wire a sink in when a
 * provider and a consent mechanism are actually chosen.
 */

/** The commerce funnel, named per the widely used GA4-style vocabulary. */
export type AnalyticsEventName =
  | "product_view"
  | "collection_view"
  | "search"
  | "add_to_cart"
  | "remove_from_cart"
  | "begin_checkout";

/**
 * Fields any event may carry. Nothing outside this set is ever emitted.
 *
 * Note what is present and what is not: a product handle and a Shopify variant id are
 * fine - they are already in the URL and the page source. A cart id is NOT, because it
 * is a capability that identifies a specific basket.
 */
const ALLOWED_KEYS = [
  "handle",
  "productId",
  "variantId",
  "collectionHandle",
  "quantity",
  "priceAmount",
  "priceCurrency",
  "valueAmount",
  "valueCurrency",
  "itemCount",
  "searchTerm",
  "resultCount",
  "availability",
  "position",
  "listName",
] as const;

export type AllowedKey = (typeof ALLOWED_KEYS)[number];

export type AnalyticsPayload = Partial<Record<AllowedKey, string | number | boolean>>;

export interface AnalyticsEvent {
  name: AnalyticsEventName;
  payload: AnalyticsPayload;
}

const ALLOWED = new Set<string>(ALLOWED_KEYS);

/**
 * Longest a free-text field may be.
 *
 * Search terms are the one place a customer types arbitrary text, and people paste
 * surprising things into search boxes - including, occasionally, an email address or an
 * order number. Truncating bounds the damage; it does not license carelessness.
 */
const MAX_TEXT_LENGTH = 64;

/**
 * Builds an event with only permitted fields.
 *
 * Values are normalised as well as filtered: an object or array would serialise into
 * something unpredictable at the sink, so only primitives survive.
 */
export function buildEvent(name: AnalyticsEventName, input: Record<string, unknown>): AnalyticsEvent {
  const payload: AnalyticsPayload = {};

  for (const [key, value] of Object.entries(input)) {
    if (!ALLOWED.has(key)) continue;
    if (value === null || value === undefined) continue;

    if (typeof value === "string") {
      const trimmed = value.trim().slice(0, MAX_TEXT_LENGTH);
      if (trimmed !== "") payload[key as AllowedKey] = trimmed;
      continue;
    }
    if (typeof value === "number") {
      // NaN and Infinity serialise to null in JSON, which reads as a missing field.
      if (Number.isFinite(value)) payload[key as AllowedKey] = value;
      continue;
    }
    if (typeof value === "boolean") {
      payload[key as AllowedKey] = value;
    }
    // Anything else - object, array, function, symbol - is dropped.
  }

  return { name, payload };
}

/** Where events go. Swappable so tests can assert without a network or a global. */
export type AnalyticsSink = (event: AnalyticsEvent) => void;

let sink: AnalyticsSink | null = null;

/**
 * Installs the sink. Called once from a client component when a provider and consent
 * exist. Until then events are built and discarded, which keeps every call site honest
 * without shipping data anywhere.
 */
export function setAnalyticsSink(next: AnalyticsSink | null): void {
  sink = next;
}

/**
 * Emits an event.
 *
 * NEVER THROWS. Analytics is not worth breaking an add-to-cart over, so a failing sink
 * is swallowed - the customer's purchase matters and the measurement does not.
 */
export function track(name: AnalyticsEventName, input: Record<string, unknown> = {}): AnalyticsEvent {
  const event = buildEvent(name, input);
  if (sink !== null) {
    try {
      sink(event);
    } catch {
      // Deliberately ignored. See above.
    }
  }
  return event;
}
