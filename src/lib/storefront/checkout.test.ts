import { describe, expect, it } from "vitest";

import { customerCheckoutMessage, guestCheckoutSchema } from "./checkout";

const valid = {
  fullName: "Aarav Mehta",
  email: "AARAV@example.com",
  phone: "98765 43210",
  line1: "24 Residency Road",
  line2: "",
  city: "Bengaluru",
  state: "Karnataka",
  postalCode: "560001",
  countryCode: "IN" as const,
};

describe("guest checkout validation", () => {
  it("normalizes Indian phone and email", () => {
    const parsed = guestCheckoutSchema.parse(valid);
    expect(parsed.phone).toBe("+919876543210");
    expect(parsed.email).toBe("aarav@example.com");
    expect(parsed.line2).toBeUndefined();
  });

  it("rejects invalid PIN codes and mobile numbers", () => {
    expect(
      guestCheckoutSchema.safeParse({ ...valid, phone: "12345", postalCode: "000000" }).success,
    ).toBe(false);
  });

  it("maps price changes to safe customer copy", () => {
    expect(customerCheckoutMessage("PRICE_CHANGED")).toContain("price changed");
    expect(customerCheckoutMessage("UNKNOWN", "internal stack trace".repeat(20))).not.toContain(
      "stack trace",
    );
  });
});
