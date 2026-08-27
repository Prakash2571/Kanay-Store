import { describe, expect, it } from "vitest";

import {
  hasMinimum,
  minimumOrderValueLabel,
  moqLabel,
  startingQuantity,
  unitPriceLabel,
} from "./moq";
import type { Money } from "./types";

const inr = (amount: string): Money => ({ amount, currencyCode: "INR" });

/**
 * How a wholesale minimum reads on a card.
 *
 * The numbers here go into a buyer's own spreadsheet, so the arithmetic is worth pinning -
 * particularly the "minimum order" total, which is the one figure that is easy to get wrong
 * by multiplying a formatted string instead of paise.
 */

describe("hasMinimum", () => {
  it("is false when the merchant set no minimum", () => {
    expect(hasMinimum(null)).toBe(false);
    expect(hasMinimum(undefined)).toBe(false);
  });

  it("is false for a minimum of one", () => {
    // "MOQ 1" is not information - it is the default for every product in a mostly
    // unrestricted catalog, and a badge on everything is a badge nobody reads.
    expect(hasMinimum(1)).toBe(false);
  });

  it("is true for a real minimum", () => {
    expect(hasMinimum(2)).toBe(true);
    expect(hasMinimum(500)).toBe(true);
  });

  it("rejects a nonsense value rather than displaying it", () => {
    for (const value of [0, -5, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(hasMinimum(value)).toBe(false);
    }
  });
});

describe("startingQuantity", () => {
  it("starts a stepper at the minimum", () => {
    // A form that opens at 1 on a product that cannot be bought in ones is wrong the moment
    // it renders, and the customer only discovers it when the button fails.
    expect(startingQuantity(12)).toBe(12);
  });

  it("starts at one when there is no minimum", () => {
    expect(startingQuantity(null)).toBe(1);
    expect(startingQuantity(1)).toBe(1);
  });
});

describe("moqLabel", () => {
  it("reads as a buyer expects", () => {
    expect(moqLabel(10)).toBe("MOQ 10");
  });

  it("is null when there is nothing to say", () => {
    expect(moqLabel(null)).toBeNull();
    expect(moqLabel(1)).toBeNull();
  });
});

describe("minimumOrderValueLabel", () => {
  it("multiplies unit price by the minimum", () => {
    // ₹349 x 10 = ₹3,490.
    expect(minimumOrderValueLabel(inr("349.00"), 10)).toBe("₹3,490");
  });

  it("keeps paise when the total is not whole rupees", () => {
    expect(minimumOrderValueLabel(inr("349.50"), 3)).toBe("₹1,048.50");
  });

  it("is null when there is no minimum", () => {
    expect(minimumOrderValueLabel(inr("349.00"), null)).toBeNull();
    expect(minimumOrderValueLabel(inr("349.00"), 1)).toBeNull();
  });

  it("is null rather than wrong when the price cannot be parsed", () => {
    // The spec asks for this figure "where it can be calculated reliably". An unparseable
    // amount is exactly where it cannot be.
    expect(minimumOrderValueLabel(inr("not-a-price"), 10)).toBeNull();
    expect(minimumOrderValueLabel(inr("0.00"), 10)).toBeNull();
  });
});

describe("unitPriceLabel", () => {
  it("always says per unit", () => {
    // On a wholesale listing a bare "₹349" could be read as a pack price.
    expect(unitPriceLabel(inr("349.00"))).toBe("₹349 / unit");
  });

  it("supports a From prefix for variant price ranges", () => {
    expect(unitPriceLabel(inr("349.00"), "From ")).toBe("From ₹349 / unit");
  });

  it("degrades honestly when the price is unusable", () => {
    // No "/ unit" suffix on a non-price: "Price unavailable / unit" would be nonsense.
    expect(unitPriceLabel(inr("nonsense"))).toBe("Price unavailable");
  });
});
