"use client";

import { useCart } from "./CartProvider";

/**
 * The item count on the cart icon.
 *
 * Its own tiny client component so the header itself stays a server component: the cart
 * lives in a provider that only exists on the client, and lifting the whole header into
 * the client bundle to render one number would be a poor trade.
 *
 * Renders nothing until the cart has hydrated from storage. A badge that flashes "0" and
 * then corrects itself reads as "your cart was emptied", which is alarming on the one
 * control a shopper watches most.
 */
export function CartCountBadge() {
  const { hydrated, itemCount } = useCart();

  if (!hydrated || itemCount === 0) return null;

  return (
    <span
      aria-hidden="true"
      className="absolute -right-0.5 -top-0.5 grid min-w-[1.15rem] place-items-center rounded-[var(--radius-pill)] bg-brand px-1 text-[0.65rem] font-bold leading-[1.15rem] text-white"
    >
      {itemCount > 99 ? "99+" : itemCount}
    </span>
  );
}
