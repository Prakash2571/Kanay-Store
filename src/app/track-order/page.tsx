import type { Metadata } from "next";

import { TrackOrderForm } from "@/components/orders/TrackOrderForm";

export const metadata: Metadata = {
  title: "Track order",
  description: "Use your secure Kanay Store link to view order and shipment status.",
  robots: { index: false, follow: false },
};

export default function TrackOrderPage() {
  return (
    <main className="mx-auto min-h-[70dvh] max-w-3xl px-5 py-14 sm:px-8 lg:py-20">
      <h1 className="font-serif text-5xl font-semibold tracking-[-0.03em] sm:text-6xl">Track your order</h1>
      <p className="mt-4 max-w-[58ch] text-sm leading-6 text-ink-muted">
        Open the secure link from your order confirmation. Sequential order numbers are never accepted on their own.
      </p>
      <section className="mt-9 rounded-[var(--radius-card)] bg-surface-muted p-6 sm:p-8">
        <TrackOrderForm />
      </section>
    </main>
  );
}
