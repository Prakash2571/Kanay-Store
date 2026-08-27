"use client";

import { ShoppingBag } from "lucide-react";
import Link from "next/link";

import { CartItem } from "./CartItem";
import { useCart } from "./CartProvider";
import { CartSummary } from "./CartSummary";

export function CartPageClient() {
  const { hydrated, items, subtotalPaise } = useCart();

  if (!hydrated) {
    return (
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]" aria-label="Loading cart">
        <div className="h-72 animate-pulse rounded-[var(--radius-card)] bg-surface-muted" />
        <div className="h-64 animate-pulse rounded-[var(--radius-card)] bg-surface-muted" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <section className="mx-auto max-w-lg py-16 text-center">
        <ShoppingBag
          aria-hidden="true"
          size={34}
          strokeWidth={1.5}
          className="mx-auto text-brand-ink"
        />
        <h2 className="mt-5 text-4xl font-semibold">Your cart is ready for a first pick.</h2>
        <p className="mx-auto mt-3 max-w-[42ch] text-sm leading-6 text-ink-muted">
          Browse the latest available pieces. Your cart will stay on this device between visits.
        </p>
        <Link
          href="/shop"
          className="mt-7 inline-flex min-h-12 items-center rounded-[var(--radius-control)] bg-brand-solid px-6 font-semibold text-white"
        >
          Shop the collection
        </Link>
      </section>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
      <section aria-label="Cart items">
        {items.map((item) => (
          <CartItem key={item.shopifyVariantId} item={item} />
        ))}
      </section>
      <div className="lg:sticky lg:top-28">
        <CartSummary subtotalPaise={subtotalPaise} />
      </div>
    </div>
  );
}
