import { describe, expect, it } from "vitest";

import {
  RECENT_CHECKOUT_STORAGE_KEY,
  forgetRecentCheckout,
  readRecentCheckout,
  rememberCheckout,
  type CheckoutStorage,
} from "./recentCheckout";

/**
 * A checkout status token is a bearer credential: it reads an order's status, name and
 * address with no other proof of identity. These tests pin the two properties that make
 * storing one defensible - it is tab-scoped, and a value that is not plausibly a token
 * is never handed back to be sent anywhere.
 */

function memoryStorage(initial: Record<string, string> = {}): CheckoutStorage & {
  data: Record<string, string>;
} {
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

const TOKEN = "a".repeat(43);

describe("rememberCheckout", () => {
  it("round-trips an id and token", () => {
    const storage = memoryStorage();
    rememberCheckout({ id: "cs_1", token: TOKEN }, storage);

    expect(readRecentCheckout(storage)).toEqual({ id: "cs_1", token: TOKEN });
  });

  it("stores nothing when either half is missing", () => {
    const storage = memoryStorage();
    rememberCheckout({ id: "", token: TOKEN }, storage);
    rememberCheckout({ id: "cs_1", token: "" }, storage);

    expect(storage.data[RECENT_CHECKOUT_STORAGE_KEY]).toBeUndefined();
  });

  it("does not throw when storage is full or blocked", () => {
    const hostile: CheckoutStorage = {
      getItem: () => null,
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
      removeItem: () => {
        throw new Error("SecurityError");
      },
    };

    expect(() => rememberCheckout({ id: "cs_1", token: TOKEN }, hostile)).not.toThrow();
    expect(() => forgetRecentCheckout(hostile)).not.toThrow();
  });
});

describe("readRecentCheckout", () => {
  it("returns null when nothing was stored", () => {
    expect(readRecentCheckout(memoryStorage())).toBeNull();
    expect(readRecentCheckout(null)).toBeNull();
  });

  it("rejects a token too short to be one", () => {
    // The backend issues 43-character base64url tokens. A short value is either
    // corruption or someone's guess, and sending it would only produce a pointless
    // request against the tracking rate limit.
    const storage = memoryStorage({
      [RECENT_CHECKOUT_STORAGE_KEY]: JSON.stringify({ id: "cs_1", token: "abc" }),
    });
    expect(readRecentCheckout(storage)).toBeNull();
  });

  it("rejects a malformed or partial record", () => {
    expect(readRecentCheckout(memoryStorage({ [RECENT_CHECKOUT_STORAGE_KEY]: "{not json" }))).toBeNull();
    expect(readRecentCheckout(memoryStorage({ [RECENT_CHECKOUT_STORAGE_KEY]: "null" }))).toBeNull();
    expect(
      readRecentCheckout(
        memoryStorage({ [RECENT_CHECKOUT_STORAGE_KEY]: JSON.stringify({ token: TOKEN }) }),
      ),
    ).toBeNull();
    expect(
      readRecentCheckout(
        memoryStorage({ [RECENT_CHECKOUT_STORAGE_KEY]: JSON.stringify({ id: "  ", token: TOKEN }) }),
      ),
    ).toBeNull();
  });
});

describe("forgetRecentCheckout", () => {
  it("removes the record", () => {
    const storage = memoryStorage({
      [RECENT_CHECKOUT_STORAGE_KEY]: JSON.stringify({ id: "cs_1", token: TOKEN }),
    });

    forgetRecentCheckout(storage);

    expect(readRecentCheckout(storage)).toBeNull();
  });
});
