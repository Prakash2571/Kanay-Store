/**
 * Presenting a wholesale minimum order quantity.
 *
 * The backend owns the RULE (a `moq:<n>` product tag, enforced at checkout against freshly
 * read Shopify data). This module owns how it READS on a card: what the badge says, what the
 * minimum order costs, and where a quantity stepper should start.
 *
 * Pure, because the arithmetic is money arithmetic. "₹349/unit, MOQ 10, minimum ₹3,490" is
 * three numbers a buyer will check against their own spreadsheet, and getting the third one
 * wrong by multiplying a formatted string is a classic.
 */

import { formatPaise, moneyToPaise } from "./money";
import type { Money } from "./types";

/** Products with no `moq:` tag have no minimum. Null is "no minimum", never "one". */
export function hasMinimum(minimumOrderQuantity?: number | null): boolean {
  return (
    minimumOrderQuantity !== null &&
    minimumOrderQuantity !== undefined &&
    Number.isSafeInteger(minimumOrderQuantity) &&
    minimumOrderQuantity > 1
  );
}

/**
 * The quantity a stepper or selector should start at.
 *
 * Starting at 1 on a product that cannot be bought in ones is a form that is wrong the
 * moment it renders, and the customer only finds out when they press the button.
 */
export function startingQuantity(minimumOrderQuantity?: number | null): number {
  return hasMinimum(minimumOrderQuantity) ? (minimumOrderQuantity as number) : 1;
}

/** "MOQ 10", or null when the product has no minimum and the badge should be omitted. */
export function moqLabel(minimumOrderQuantity?: number | null): string | null {
  return hasMinimum(minimumOrderQuantity) ? `MOQ ${minimumOrderQuantity as number}` : null;
}

/**
 * Total for one minimum order, formatted, or null when it cannot be computed reliably.
 *
 * Null rather than a guess: a price range whose lower bound cannot be parsed, or a product
 * with no minimum, must not produce a "minimum order" figure. The spec asks for this "where
 * it can be calculated reliably", and this is what that means in code.
 */
export function minimumOrderValueLabel(
  price: Money,
  minimumOrderQuantity?: number | null,
): string | null {
  if (!hasMinimum(minimumOrderQuantity)) return null;
  const unit = moneyToPaise(price);
  if (unit === null || unit <= 0) return null;

  const total = unit * (minimumOrderQuantity as number);
  if (!Number.isSafeInteger(total)) return null;

  return formatPaise(total);
}

/**
 * The per-unit price, always suffixed.
 *
 * On a wholesale listing "₹349" alone is ambiguous - it could be the line total for a pack.
 * "₹349 / unit" is the phrasing a buyer comparing suppliers expects, and it is worth the
 * extra characters on every card.
 */
export function unitPriceLabel(price: Money, prefix?: string): string {
  const unit = moneyToPaise(price);
  const amount = unit === null ? "Price unavailable" : formatPaise(unit);
  return unit === null ? amount : `${prefix ?? ""}${amount} / unit`;
}
