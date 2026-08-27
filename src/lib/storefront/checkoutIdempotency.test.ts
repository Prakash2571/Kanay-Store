import { describe, expect, it } from "vitest";

import {
  CHECKOUT_KEY_STORAGE_KEY,
  MAX_CONFLICT_ROTATIONS,
  checkoutFingerprint,
  clearCheckoutKey,
  isValidIdempotencyKey,
  loadCheckoutKey,
  newIdempotencyKey,
  resolveCheckoutKey,
  rotateCheckoutKeyAfterConflict,
  saveCheckoutKey,
  type CheckoutKeyState,
  type FingerprintCartLine,
  type FingerprintCustomer,
  type KeyStorage,
} from "./checkoutIdempotency";

/**
 * The rule under test, in one place:
 *
 *   same material request        -> same key
 *   timeout / dismissed modal    -> same key (the request may have succeeded)
 *   cart / customer / address
 *     materially changed         -> new key
 *   IDEMPOTENCY_CONFLICT         -> new key, once
 *   purchase completed           -> key forgotten
 *
 * The failure this prevents is not hypothetical: the key used to be generated once
 * per mounted form, so correcting a mistyped PIN code and resubmitting sent a
 * DIFFERENT request under the ORIGINAL key, and the backend refused it with 409 for
 * the rest of the page's life.
 */

const line = (overrides: Partial<FingerprintCartLine> = {}): FingerprintCartLine => ({
  shopifyVariantId: "gid://shopify/ProductVariant/1",
  quantity: 1,
  unitPricePaise: 149900,
  ...overrides,
});

const customer = (overrides: Partial<FingerprintCustomer> = {}): FingerprintCustomer => ({
  fullName: "Aarav Mehta",
  email: "aarav@example.com",
  phone: "+919876543210",
  line1: "24 Residency Road",
  city: "Bengaluru",
  state: "Karnataka",
  postalCode: "560001",
  countryCode: "IN",
  ...overrides,
});

/** An in-memory Storage, so nothing depends on a DOM or a real sessionStorage. */
function memoryStorage(initial: Record<string, string> = {}): KeyStorage & { data: Record<string, string> } {
  const data: Record<string, string> = { ...initial };
  return {
    data,
    getItem: (key) => data[key] ?? null,
    setItem: (key, value) => {
      data[key] = value;
    },
    removeItem: (key) => {
      delete data[key];
    },
  };
}

/** Deterministic key generator, so "did it issue a new key" is unambiguous. */
function sequence(prefix = "key"): () => string {
  let index = 0;
  return () => {
    index += 1;
    return `${prefix}-00000${index}`;
  };
}

describe("checkoutFingerprint", () => {
  it("is stable for the same request", () => {
    const first = checkoutFingerprint([line()], customer());
    const second = checkoutFingerprint([line()], customer());
    expect(first).toBe(second);
  });

  it("ignores the order of cart lines", () => {
    // Re-ordering the same basket does not change what is being bought.
    const a = line({ shopifyVariantId: "gid://shopify/ProductVariant/1" });
    const b = line({ shopifyVariantId: "gid://shopify/ProductVariant/2" });
    expect(checkoutFingerprint([a, b], customer())).toBe(checkoutFingerprint([b, a], customer()));
  });

  it("ignores cosmetic whitespace and case in the address", () => {
    expect(checkoutFingerprint([line()], customer({ city: "  bengaluru " }))).toBe(
      checkoutFingerprint([line()], customer({ city: "Bengaluru" })),
    );
  });

  it("changes when the quantity changes", () => {
    expect(checkoutFingerprint([line({ quantity: 2 })], customer())).not.toBe(
      checkoutFingerprint([line({ quantity: 1 })], customer()),
    );
  });

  it("changes when a variant is added or swapped", () => {
    const base = checkoutFingerprint([line()], customer());
    expect(checkoutFingerprint([line(), line({ shopifyVariantId: "gid://x/2" })], customer())).not.toBe(base);
    expect(checkoutFingerprint([line({ shopifyVariantId: "gid://x/9" })], customer())).not.toBe(base);
  });

  it("changes when the cart price changes", () => {
    // The price is sent as expectedUnitPricePaise, so a repriced cart is a different
    // request - and the backend hashes it too.
    expect(checkoutFingerprint([line({ unitPricePaise: 159900 })], customer())).not.toBe(
      checkoutFingerprint([line({ unitPricePaise: 149900 })], customer()),
    );
  });

  it("changes when any address or contact field changes", () => {
    const base = checkoutFingerprint([line()], customer());
    const fields: Partial<FingerprintCustomer>[] = [
      { fullName: "Aarav Mehtaa" },
      { email: "someone.else@example.com" },
      { phone: "+919876543211" },
      { line1: "25 Residency Road" },
      { line2: "Flat 4" },
      { city: "Mysuru" },
      { state: "Kerala" },
      { postalCode: "560002" },
    ];
    for (const override of fields) {
      expect(checkoutFingerprint([line()], customer(override))).not.toBe(base);
    }
  });

  it("does not carry the customer's details in its output", () => {
    // It is persisted, so it must not be a place a name, email or address ends up.
    const fingerprint = checkoutFingerprint([line()], customer());
    expect(fingerprint).not.toContain("aarav");
    expect(fingerprint).not.toContain("Residency");
    expect(fingerprint).not.toContain("560001");
    expect(fingerprint).toMatch(/^[0-9a-f]{16}$/);
  });
});

describe("resolveCheckoutKey", () => {
  it("issues a key on the first submission", () => {
    const generate = sequence();
    const { state, reused } = resolveCheckoutKey(null, "fp-1", generate);

    expect(reused).toBe(false);
    expect(state.key).toBe("key-000001");
    expect(state.rotations).toBe(0);
  });

  it("REUSES the key for an unchanged request", () => {
    // This covers the retry after a network timeout and the retry after the customer
    // dismisses the Razorpay modal: the request is identical, so the key must be too,
    // or one purchase becomes two checkout sessions and two Razorpay orders.
    const generate = sequence();
    const first = resolveCheckoutKey(null, "fp-1", generate).state;
    const second = resolveCheckoutKey(first, "fp-1", generate);

    expect(second.reused).toBe(true);
    expect(second.state.key).toBe(first.key);
  });

  it("issues a NEW key when the request changed materially", () => {
    const generate = sequence();
    const first = resolveCheckoutKey(null, checkoutFingerprint([line()], customer()), generate).state;

    const corrected = resolveCheckoutKey(
      first,
      // The customer fixed their PIN code and submitted again.
      checkoutFingerprint([line()], customer({ postalCode: "560002" })),
      generate,
    );

    expect(corrected.reused).toBe(false);
    expect(corrected.state.key).not.toBe(first.key);
    // Rotations are per-request, so a new request starts from zero.
    expect(corrected.state.rotations).toBe(0);
  });

  it("issues a new key when the stored one is not a valid key", () => {
    // A corrupt or truncated storage value must not be sent as an Idempotency-Key:
    // the backend would reject it as a 400 mid-checkout.
    const stored: CheckoutKeyState = { fingerprint: "fp-1", key: "short", rotations: 0 };
    const resolved = resolveCheckoutKey(stored, "fp-1", sequence());

    expect(resolved.reused).toBe(false);
    expect(isValidIdempotencyKey(resolved.state.key)).toBe(true);
  });

  it("survives a reload: the key comes back from storage", () => {
    const storage = memoryStorage();
    const fingerprint = checkoutFingerprint([line()], customer());
    const first = resolveCheckoutKey(null, fingerprint, sequence()).state;
    saveCheckoutKey(first, storage);

    // A reload loses the ref, so the next attempt starts from storage.
    const afterReload = resolveCheckoutKey(loadCheckoutKey(storage), fingerprint, sequence("other"));

    expect(afterReload.reused).toBe(true);
    expect(afterReload.state.key).toBe(first.key);
  });
});

describe("rotateCheckoutKeyAfterConflict", () => {
  it("issues a new key for the same request", () => {
    // A conflict proves the key is recorded against a DIFFERENT request, so nothing
    // about this one was accepted under it and a fresh key cannot duplicate a charge.
    const state: CheckoutKeyState = { fingerprint: "fp-1", key: "key-000001", rotations: 0 };
    const rotated = rotateCheckoutKeyAfterConflict(state, sequence("new"));

    expect(rotated.exhausted).toBe(false);
    expect(rotated.state.key).toBe("new-000001");
    expect(rotated.state.fingerprint).toBe("fp-1");
    expect(rotated.state.rotations).toBe(1);
  });

  it("stops after the allowed number of rotations", () => {
    // Looping would hide a problem the client cannot fix by trying again.
    const state: CheckoutKeyState = {
      fingerprint: "fp-1",
      key: "key-000001",
      rotations: MAX_CONFLICT_ROTATIONS,
    };
    const rotated = rotateCheckoutKeyAfterConflict(state, sequence("new"));

    expect(rotated.exhausted).toBe(true);
    expect(rotated.state.key).toBe("key-000001");
  });
});

describe("persistence", () => {
  it("round-trips a state", () => {
    const storage = memoryStorage();
    const state: CheckoutKeyState = { fingerprint: "fp-1", key: "key-000001", rotations: 0 };

    saveCheckoutKey(state, storage);
    expect(loadCheckoutKey(storage)).toEqual(state);
  });

  it("forgets the key once the purchase completes", () => {
    // Otherwise the same basket to the same address later in the session would reuse a
    // completed purchase's key, and the backend would replay the finished order
    // instead of placing a new one.
    const storage = memoryStorage();
    saveCheckoutKey({ fingerprint: "fp-1", key: "key-000001", rotations: 0 }, storage);

    clearCheckoutKey(storage);

    expect(loadCheckoutKey(storage)).toBeNull();
    expect(storage.data[CHECKOUT_KEY_STORAGE_KEY]).toBeUndefined();
  });

  it("treats unreadable storage as empty rather than failing checkout", () => {
    expect(loadCheckoutKey(memoryStorage({ [CHECKOUT_KEY_STORAGE_KEY]: "{not json" }))).toBeNull();
    expect(loadCheckoutKey(memoryStorage({ [CHECKOUT_KEY_STORAGE_KEY]: "null" }))).toBeNull();
    expect(
      loadCheckoutKey(memoryStorage({ [CHECKOUT_KEY_STORAGE_KEY]: JSON.stringify({ key: "x" }) })),
    ).toBeNull();
  });

  it("does nothing at all when storage is unavailable", () => {
    // Private mode. The key still lives in the component ref, which covers every
    // retry that does not reload the page.
    expect(loadCheckoutKey(null)).toBeNull();
    expect(() => saveCheckoutKey({ fingerprint: "f", key: "key-000001", rotations: 0 }, null)).not.toThrow();
    expect(() => clearCheckoutKey(null)).not.toThrow();
  });

  it("survives a storage that throws on write", () => {
    const hostile: KeyStorage = {
      getItem: () => null,
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
      removeItem: () => {
        throw new Error("SecurityError");
      },
    };

    expect(() => saveCheckoutKey({ fingerprint: "f", key: "key-000001", rotations: 0 }, hostile)).not.toThrow();
    expect(() => clearCheckoutKey(hostile)).not.toThrow();
  });
});

describe("generated keys", () => {
  it("match the format the backend accepts", () => {
    // 8-200 characters of [A-Za-z0-9._~:-]. A key the backend rejects would turn a
    // protected write into a 400 at the moment of payment.
    for (let index = 0; index < 20; index += 1) {
      expect(isValidIdempotencyKey(newIdempotencyKey())).toBe(true);
    }
  });

  it("differ between purchases", () => {
    expect(newIdempotencyKey()).not.toBe(newIdempotencyKey());
  });

  it("rejects values the backend would reject", () => {
    expect(isValidIdempotencyKey("short")).toBe(false);
    expect(isValidIdempotencyKey("has spaces in it")).toBe(false);
    expect(isValidIdempotencyKey("a".repeat(201))).toBe(false);
    expect(isValidIdempotencyKey("a".repeat(8))).toBe(true);
  });
});
