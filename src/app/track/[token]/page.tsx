import type { Metadata } from "next";

import { OrderStatusView } from "@/components/orders/OrderStatusView";
import { getTrackedOrder, parseTrackingToken } from "@/lib/storefront/orders";

export const metadata: Metadata = {
  title: "Order status",
  robots: { index: false, follow: false },
};

export default async function TrackedOrderPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token: rawToken } = await params;
  const token = parseTrackingToken(rawToken);
  const result = token ? await getTrackedOrder(token) : null;

  return (
    <main className="mx-auto min-h-[75dvh] max-w-[1180px] px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
      {result?.ok ? (
        <OrderStatusView order={result.data} />
      ) : (
        <section className="mx-auto max-w-xl rounded-[var(--radius-card)] bg-surface-muted p-7 text-center sm:p-9">
          <h1 className="font-serif text-4xl font-semibold">Tracking is not available.</h1>
          <p className="mt-3 text-sm leading-6 text-ink-muted">
            Check that you opened the full secure link from your order confirmation.
          </p>
        </section>
      )}
    </main>
  );
}
