import { describe, expect, it } from "vitest";

import { calculateDiscountPercent, formatMoney, formatPaise, parseInrAmountToPaise } from "./money";

describe("storefront money", () => {
  it("formats integer paise with Indian grouping", () => {
    expect(formatPaise(149900)).toBe("₹1,499");
    expect(formatPaise(125050)).toBe("₹1,250.50");
  });

  it("parses decimal INR without floating point arithmetic", () => {
    expect(parseInrAmountToPaise("1499.00")).toBe(149900);
    expect(parseInrAmountToPaise("0.5")).toBe(50);
    expect(parseInrAmountToPaise("1.234")).toBeNull();
  });

  it("refuses non-INR display money", () => {
    expect(formatMoney({ amount: "20.00", currencyCode: "USD" as "INR" })).toBe("Price unavailable");
  });

  it("only reports a real compare-at discount", () => {
    expect(
      calculateDiscountPercent(
        { amount: "1499.00", currencyCode: "INR" },
        { amount: "2499.00", currencyCode: "INR" },
      ),
    ).toBe(40);
    expect(
      calculateDiscountPercent(
        { amount: "1499.00", currencyCode: "INR" },
        { amount: "1499.00", currencyCode: "INR" },
      ),
    ).toBeNull();
  });

  it("rounds a discount DOWN, so a saving is never overstated", () => {
    // 49.6% must read as 49, not 50. This number is printed on product cards and drives
    // the hero's "up to X% off" badge, so rounding up advertises a better price than
    // anything in the catalog actually has - on the one figure a shopper price-checks.
    expect(
      calculateDiscountPercent(
        { amount: "504.00", currencyCode: "INR" },
        { amount: "1000.00", currencyCode: "INR" },
      ),
    ).toBe(49);
  });

  it("treats a saving under one percent as no discount", () => {
    // It would floor to 0, and a "0% off" badge is noise that makes every other badge
    // less trustworthy.
    expect(
      calculateDiscountPercent(
        { amount: "999.00", currencyCode: "INR" },
        { amount: "1000.00", currencyCode: "INR" },
      ),
    ).toBeNull();
  });
});
