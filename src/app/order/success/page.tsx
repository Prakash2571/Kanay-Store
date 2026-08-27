import type { Metadata } from "next";
import Link from "next/link";

import { OrderStatusView } from "@/components/orders/OrderStatusView";
import { StripSensitiveParams } from "@/components/orders/StripSensitiveParams";
import { getCheckoutStatus, getTrackedOrder } from "@/lib/storefront/orders";

export const metadata: Metadata = {
  title: "Order received",
  robots: { index: false, follow: false },
};

type SuccessPageProps = {
  searchParams: Promise<{ session?: string; token?: string; tracking?: string }>;
};

export default async function OrderSuccessPage({ searchParams }: SuccessPageProps) {
  const params = await searchParams;
  const result = params.tracking
    ? await getTrackedOrder(params.tracking)
    : params.session && params.token
      ? await getCheckoutStatus(params.session, params.token)
      : null;

  return (
    <main className="mx-auto min-h-[75dvh] max-w-[1180px] px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
      {/*
        The tokens have done their job by the time this renders - the order was read on
        the server above. Clearing them from the address bar keeps a bearer credential
        out of history, bookmarks, shared links and proxy logs.
      */}
      <StripSensitiveParams params={["token", "tracking", "session"]} />
      {result?.ok ? (
        <OrderStatusView order={result.data} success />
      ) : (
        <section className="mx-auto max-w-2xl rounded-[var(--radius-card)] bg-surface-muted p-7 sm:p-10">
          <h1 className="font-serif text-5xl font-semibold tracking-[-0.03em]">
            We are checking your order.
          </h1>
          <p className="mt-4 text-sm leading-6 text-ink-muted">
            Tracking information is not available yet. If Razorpay confirmed your payment, do not pay again.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/track-order"
              className="inline-flex min-h-11 items-center rounded-[var(--radius-control)] bg-ink px-5 text-sm font-semibold text-canvas"
            >
              Track order
            </Link>
            <Link
              href="/shop"
              className="inline-flex min-h-11 items-center rounded-[var(--radius-control)] border border-ink px-5 text-sm font-semibold"
            >
              Continue shopping
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}
