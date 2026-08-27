/**
 * The idempotency-key lifecycle for guest checkout.
 *
 * THE PROBLEM THIS SOLVES
 * -----------------------
 * The key was generated once per mounted form and never changed:
 *
 *     idempotencyKey.current ??= newIdempotencyKey();
 *
 * That is right for the case it was written for - a retry of the SAME request must
 * carry the SAME key, so a checkout session that already exists is replayed rather
 * than duplicated. It is wrong the moment the customer changes something. A
 * shopper who mistypes their PIN code, submits, sees the error, corrects it and
 * submits again sends a DIFFERENT request under the ORIGINAL key. The backend
 * compares a hash of the request against the stored one, sees they disagree and
 * answers 409 IDEMPOTENCY_CONFLICT - correctly, because replaying the first
 * response would ship the order to the wrong address. From the customer's side the
 * checkout was simply stuck until they reloaded the page.
 *
 * THE RULE
 * --------
 * The key is a function of the request, not of the page:
 *
 *   same material request      -> same key (this is the whole point)
 *   network timeout / no reply -> same key; the request may have succeeded
 *                                server-side, and a new key would create a
 *                                SECOND checkout session and a second Razorpay
 *                                order for one purchase
 *   Razorpay modal dismissed   -> same key; nothing about the request changed
 *   cart, customer or address
 *     materially changed       -> NEW key; it is a different request
 *   IDEMPOTENCY_CONFLICT       -> NEW key, once. The conflict is proof the stored
 *                                request differs from this one, so nothing about
 *                                THIS request has been recorded and a fresh key
 *                                cannot duplicate anything.
 *
 * WHY THE FINGERPRINT IS HASHED
 * -----------------------------
 * It is persisted so the key survives a reload mid-checkout (a reload is a retry,
 * not a new order). The material request contains a name, email, phone and street
 * address, and none of that belongs in web storage - so what is stored is a hash.
 * The hash only ever has to answer "is this the same request as last time"; a
 * collision would produce a reused key, which the backend rejects as a conflict and
 * the rotation above then resolves.
 */

/** A cart line, reduced to the parts that change what is being bought. */
export interface FingerprintCartLine {
  shopifyVariantId: string;
  quantity: number;
  /** Sent as expectedUnitPricePaise, so a changed cart price is a changed request. */
  unitPricePaise: number;
}

/** The customer and destination, reduced to the parts the backend acts on. */
export interface FingerprintCustomer {
  fullName: string;
  email: string;
  phone: string;
  line1: string;
  line2?: string | undefined;
  city: string;
  state: string;
  postalCode: string;
  countryCode: string;
}

export interface CheckoutKeyState {
  /** Hash of the material request this key belongs to. */
  fingerprint: string;
  key: string;
  /** How many keys have been issued for this fingerprint (conflict rotations). */
  rotations: number;
}

/**
 * 32-bit FNV-1a, run twice with different offset bases and concatenated.
 *
 * Not a cryptographic hash and not used as one: it compares a request against the
 * previous request, in this browser, in memory the customer can already read. What
 * matters is that it is synchronous (crypto.subtle is not, and this runs inside a
 * submit handler) and stable across reloads.
 */
function fnv1aHex(input: string, offsetBasis: number): string {
  let hash = offsetBasis;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    // >>> 0 keeps it an unsigned 32-bit value; Math.imul does the 32-bit multiply.
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

/** Canonical text for the request. Explicitly ordered - never JSON.stringify of an object. */
function canonicalise(items: FingerprintCartLine[], customer: FingerprintCustomer): string {
  // Sorted by variant id: re-ordering the same basket does not change what is being
  // bought, so it must not invalidate the key.
  const lines = [...items]
    .sort((left, right) => left.shopifyVariantId.localeCompare(right.shopifyVariantId))
    .map((line) => `${line.shopifyVariantId}:${line.quantity}:${line.unitPricePaise}`)
    .join("|");

  // Trimmed and lower-cased so cosmetic typing differences ("  Bengaluru" vs
  // "Bengaluru") are not treated as a different destination. The values sent to the
  // backend are the validated ones; this only decides sameness.
  const normalise = (value: string | undefined): string => (value ?? "").trim().toLowerCase();

  const destination = [
    normalise(customer.fullName),
    normalise(customer.email),
    normalise(customer.phone),
    normalise(customer.line1),
    normalise(customer.line2),
    normalise(customer.city),
    normalise(customer.state),
    normalise(customer.postalCode),
    normalise(customer.countryCode),
  ].join("|");

  return `v1;lines=${lines};to=${destination}`;
}

/** Stable fingerprint of everything that makes this a particular order. */
export function checkoutFingerprint(
  items: FingerprintCartLine[],
  customer: FingerprintCustomer,
): string {
  const canonical = canonicalise(items, customer);
  return `${fnv1aHex(canonical, 0x811c9dc5)}${fnv1aHex(canonical, 0x01000193)}`;
}

/** Format the backend accepts: 8-200 chars of [A-Za-z0-9._~:-]. */
const VALID_KEY = /^[A-Za-z0-9._~:-]{8,200}$/;

export function isValidIdempotencyKey(key: string): boolean {
  return VALID_KEY.test(key);
}

/**
 * Generates a key.
 *
 * A key is not a credential - it only has to be unique per purchase attempt - but it
 * must match the backend's format, or a protected write turns into a 400 at the worst
 * possible moment.
 */
export function newIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `kanay-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

/**
 * The key to send for this submission.
 *
 * Reuses the stored key when the request is materially unchanged - including after a
 * timeout, a dismissed payment modal or a page reload - and issues a new one when it
 * is not.
 */
export function resolveCheckoutKey(
  stored: CheckoutKeyState | null,
  fingerprint: string,
  generate: () => string = newIdempotencyKey,
): { state: CheckoutKeyState; reused: boolean } {
  if (stored !== null && stored.fingerprint === fingerprint && isValidIdempotencyKey(stored.key)) {
    return { state: stored, reused: true };
  }
  return { state: { fingerprint, key: generate(), rotations: 0 }, reused: false };
}

/** How many times one fingerprint may rotate its key before the UI gives up. */
export const MAX_CONFLICT_ROTATIONS = 1;

/**
 * A new key for the same request, after the backend reported IDEMPOTENCY_CONFLICT.
 *
 * Safe by definition: a conflict means the key is recorded against a DIFFERENT
 * request, so this request has not been accepted under it and a fresh key cannot
 * duplicate anything.
 *
 * Bounded to one rotation. Beyond that, something is wrong that a client cannot fix
 * by trying again - a colliding key from another tab, say - and looping would turn a
 * clear failure into an invisible one.
 */
export function rotateCheckoutKeyAfterConflict(
  stored: CheckoutKeyState,
  generate: () => string = newIdempotencyKey,
): { state: CheckoutKeyState; exhausted: boolean } {
  if (stored.rotations >= MAX_CONFLICT_ROTATIONS) {
    return { state: stored, exhausted: true };
  }
  return {
    state: { fingerprint: stored.fingerprint, key: generate(), rotations: stored.rotations + 1 },
    exhausted: false,
  };
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

/** Just enough of the Storage interface to be substitutable in a test. */
export interface KeyStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const CHECKOUT_KEY_STORAGE_KEY = "kanay-checkout-key";

/**
 * sessionStorage, not localStorage.
 *
 * A stale key outliving the purchase is a real failure: a customer who buys the same
 * basket to the same address twice inside the backend's retention window would hit a
 * replay of the FIRST order instead of placing a second one. Tab-scoped storage bounds
 * that to a single session, and the key is cleared outright once a payment completes.
 */
function defaultStorage(): KeyStorage | null {
  try {
    if (typeof sessionStorage === "undefined") return null;
    return sessionStorage;
  } catch {
    // Private mode / blocked storage. Not fatal: the key then lives only in memory,
    // which still covers every retry that does not reload the page.
    return null;
  }
}

export function loadCheckoutKey(storage: KeyStorage | null = defaultStorage()): CheckoutKeyState | null {
  if (storage === null) return null;
  try {
    const raw = storage.getItem(CHECKOUT_KEY_STORAGE_KEY);
    if (raw === null) return null;
    const parsed = JSON.parse(raw) as Partial<CheckoutKeyState> | null;
    if (
      parsed === null ||
      typeof parsed.fingerprint !== "string" ||
      typeof parsed.key !== "string" ||
      !isValidIdempotencyKey(parsed.key)
    ) {
      return null;
    }
    return {
      fingerprint: parsed.fingerprint,
      key: parsed.key,
      rotations: typeof parsed.rotations === "number" ? parsed.rotations : 0,
    };
  } catch {
    // Corrupt or unreadable: behave as though nothing was stored rather than
    // failing a checkout over a storage value.
    return null;
  }
}

export function saveCheckoutKey(
  state: CheckoutKeyState,
  storage: KeyStorage | null = defaultStorage(),
): void {
  if (storage === null) return;
  try {
    storage.setItem(CHECKOUT_KEY_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* Storage full or blocked. The in-memory key still covers this page's retries. */
  }
}

/**
 * Forgets the key. Called once a payment has been verified.
 *
 * Without this, the same basket to the same address later in the session would reuse
 * the completed purchase's key and replay it instead of ordering again.
 */
export function clearCheckoutKey(storage: KeyStorage | null = defaultStorage()): void {
  if (storage === null) return;
  try {
    storage.removeItem(CHECKOUT_KEY_STORAGE_KEY);
  } catch {
    /* Nothing to do, and nothing worth failing a completed order over. */
  }
}
