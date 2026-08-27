"use client";

import { ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";

import { useCart } from "./CartProvider";
import { minimumQuantityFor } from "@/lib/cart";
import type { CartProductItem } from "@/lib/storefront/types";

type AddToCartButtonProps = {
  item: CartProductItem;
  /**
   * Quantity to add. Defaults to the product's wholesale minimum rather than 1: adding a
   * single unit of a `moq:12` product would create a cart line the checkout is guaranteed to
   * refuse, which the customer would only discover after entering an address.
   */
  quantity?: number;
  className?: string;
  /**
   * `card` is the bordered button used inside a product card, where a solid blue fill on every
   * tile turns a grid into a wall of buttons. `primary` is the cobalt CTA on a product page,
   * where it is the single most important control.
   */
  variant?: "card" | "primary";
};

const VARIANTS: Record<"card" | "primary", string> = {
  card:
    "border border-line bg-surface-muted text-ink hover:border-brand hover:bg-brand-soft hover:text-brand-ink",
  primary: "bg-brand text-white hover:bg-brand-hover",
};

export function AddToCartButton({
  item,
  quantity,
  className = "",
  variant = "card",
}: AddToCartButtonProps) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const amount = quantity ?? minimumQuantityFor(item);

  useEffect(() => {
    if (!added) return;
    const timer = window.setTimeout(() => setAdded(false), 1800);
    return () => window.clearTimeout(timer);
  }, [added]);

  return (
    <button
      aria-live="polite"
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-control)] px-4 text-xs font-bold whitespace-nowrap transition-[transform,background-color,border-color,color] duration-200 focus-visible:outline focus-visible:outline-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:border-line disabled:bg-surface-muted disabled:text-ink-subtle sm:text-sm ${VARIANTS[variant]} ${className}`}
      disabled={!item.availableForSale}
      onClick={() => {
        addItem(item, amount);
        setAdded(true);
      }}
      type="button"
    >
      <ShoppingCart aria-hidden="true" size={16} strokeWidth={2} />
      {added
        ? "Added"
        : !item.availableForSale
          ? "Unavailable"
          : amount > 1
            ? `Add ${amount} to cart`
            : "Add to cart"}
    </button>
  );
}
