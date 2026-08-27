import { calculateDiscountPercent, formatMoney } from "@/lib/storefront/money";
import type { Money } from "@/lib/storefront/types";

export function ProductPrice({
  price,
  compareAtPrice,
  prefix,
  size = "default",
}: {
  price: Money;
  compareAtPrice?: Money | null;
  prefix?: string;
  size?: "default" | "large";
}) {
  const discount = calculateDiscountPercent(price, compareAtPrice);

  return (
    <div className={`flex flex-wrap items-baseline gap-x-2 gap-y-1 ${size === "large" ? "text-lg" : "text-sm"}`}>
      <span className="font-bold text-ink">{prefix}{formatMoney(price)}</span>
      {discount !== null && compareAtPrice ? (
        <>
          <span className="text-ink-muted line-through">{formatMoney(compareAtPrice)}</span>
          {/*
            Amber, because this is a discount label — one of the three things amber is
            reserved for. `highlight-ink` (not `highlight`) since this is text on the page
            surface: it is a dark brown on white and a light amber on navy, so it stays
            readable in both themes.
          */}
          <span className="text-xs font-bold text-highlight-ink">{discount}% off</span>
        </>
      ) : null}
    </div>
  );
}
