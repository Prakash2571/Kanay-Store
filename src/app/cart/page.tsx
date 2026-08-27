import type { Metadata } from "next";

import { CartPageClient } from "@/components/cart/CartPageClient";

export const metadata: Metadata = {
  title: "Cart",
  description: "Review the items in your Kanay Store cart.",
  // Every other private route already declared this; the cart did not. A cart is
  // per-visitor and empty for a crawler, so an indexed copy is useless at best and
  // spends crawl budget that belongs to product pages.
  robots: { index: false, follow: true },
};

export default function CartPage() {
  return (
    <main className="shell section-y min-h-[70dvh]">
      <header className="mb-8 border-b border-line pb-6">
        <h1 className="text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">Your cart</h1>
        <p className="mt-2 text-sm text-ink-muted">Review options and quantities before checkout.</p>
      </header>
      <CartPageClient />
    </main>
  );
}
