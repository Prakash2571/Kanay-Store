"use client";

import { ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";

import { useCart } from "./CartProvider";
import type { CartProductItem } from "@/lib/storefront/types";

type AddToCartButtonProps = {
  item: CartProductItem;
  quantity?: number;
  className?: string;
};

export function AddToCartButton({ item, quantity = 1, className = "" }: AddToCartButtonProps) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!added) return;
    const timer = window.setTimeout(() => setAdded(false), 1800);
    return () => window.clearTimeout(timer);
  }, [added]);

  return (
    <button
      type="button"
      disabled={!item.availableForSale}
      onClick={() => {
        addItem(item, quantity);
        setAdded(true);
      }}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-ink px-4 text-sm font-semibold whitespace-nowrap text-canvas transition-[transform,background-color] duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-surface-strong disabled:text-ink-muted ${className}`}
      aria-live="polite"
    >
      <ShoppingBag aria-hidden="true" size={17} strokeWidth={1.75} />
      {added ? "Added" : item.availableForSale ? "Add to cart" : "Unavailable"}
    </button>
  );
}
