import type { Money } from "./types";

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

const wholeInrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function parseInrAmountToPaise(amount: string): number | null {
  const normalized = amount.trim();
  const match = /^(0|[1-9]\d*)(?:\.(\d{1,2}))?$/.exec(normalized);
  if (!match) return null;

  const rupees = Number(match[1]);
  const paise = Number((match[2] ?? "").padEnd(2, "0"));
  const total = rupees * 100 + paise;
  return Number.isSafeInteger(total) ? total : null;
}

export function moneyToPaise(money: Money): number | null {
  if (money.currencyCode !== "INR") return null;
  return parseInrAmountToPaise(money.amount);
}

export function formatPaise(paise: number): string {
  if (!Number.isSafeInteger(paise)) return "Price unavailable";
  const hasPaise = paise % 100 !== 0;
  return (hasPaise ? inrFormatter : wholeInrFormatter).format(paise / 100);
}

export function formatMoney(money: Money): string {
  const paise = moneyToPaise(money);
  return paise === null ? "Price unavailable" : formatPaise(paise);
}

export function calculateDiscountPercent(price: Money, compareAtPrice?: Money | null): number | null {
  if (!compareAtPrice) return null;
  const current = moneyToPaise(price);
  const original = moneyToPaise(compareAtPrice);
  if (current === null || original === null || current >= original || original === 0) return null;
  return Math.round(((original - current) / original) * 100);
}
