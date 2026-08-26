import { Check, Clock3, ExternalLink, PackageCheck } from "lucide-react";
import Link from "next/link";

import { formatPaise } from "@/lib/storefront/money";
import type { PublicOrder } from "@/lib/storefront/orders";

export function OrderStatusView({ order, success = false }: { order: PublicOrder; success?: boolean }) {
  const isPending = order.status === "PAYMENT_PENDING" || order.status === "ORDER_PENDING";
  const trackingUrl = safeTrackingUrl(order.tracking?.url);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
      <div>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent-ink">
          {isPending ? (
            <Clock3 aria-hidden="true" size={24} strokeWidth={1.75} />
          ) : success ? (
            <Check aria-hidden="true" size={25} strokeWidth={1.9} />
          ) : (
            <PackageCheck aria-hidden="true" size={25} strokeWidth={1.75} />
          )}
        </div>
        <h1 className="mt-5 font-serif text-5xl font-semibold tracking-[-0.03em] sm:text-6xl">
          {isPending
            ? order.status === "PAYMENT_PENDING"
              ? "We are confirming your payment."
              : "Payment received. We are preparing your order."
            : success
              ? "Thank you for your order."
              : "Order status"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-ink-muted">
          {order.orderNumber ? `Order ${order.orderNumber}` : "Your order reference is being prepared."}
          {order.emailMasked ? ` Updates will be sent to ${order.emailMasked}.` : ""}
        </p>

        {order.timeline.length > 0 ? (
          <ol className="mt-10 space-y-0" aria-label="Order timeline">
            {order.timeline.map((entry, index) => (
              <li key={entry.key} className="grid grid-cols-[28px_1fr] gap-4">
                <div className="flex flex-col items-center">
                  <span
                    className={`grid h-7 w-7 place-items-center rounded-full border ${
                      entry.completed
                        ? "border-success bg-success text-canvas"
                        : "border-line bg-surface text-ink-muted"
                    }`}
                  >
                    {entry.completed ? (
                      <Check aria-hidden="true" size={14} strokeWidth={2} />
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    )}
                  </span>
                  {index < order.timeline.length - 1 && (
                    <span className="min-h-12 w-px grow bg-line" aria-hidden="true" />
                  )}
                </div>
                <div className="pb-7">
                  <p className={`font-semibold ${entry.completed ? "text-ink" : "text-ink-muted"}`}>
                    {entry.label}
                  </p>
                  {entry.occurredAt && (
                    <time className="mt-1 block text-xs text-ink-muted" dateTime={entry.occurredAt}>
                      {new Intl.DateTimeFormat("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(entry.occurredAt))}
                    </time>
                  )}
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-8 rounded-[var(--radius-control)] bg-surface-muted px-4 py-3 text-sm text-ink-muted">
            Tracking information is not available yet.
          </p>
        )}

        {trackingUrl && (
          <a
            href={trackingUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-control)] border border-ink px-4 text-sm font-semibold"
          >
            Carrier tracking
            <ExternalLink aria-hidden="true" size={15} strokeWidth={1.75} />
          </a>
        )}
      </div>

      <aside className="rounded-[var(--radius-card)] bg-surface-muted p-5 sm:p-6">
        <h2 className="font-serif text-3xl font-semibold">Order summary</h2>
        <dl className="mt-5 space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-ink-muted">Payment</dt>
            <dd className="font-semibold">{order.paymentStatus}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink-muted">Amount</dt>
            <dd className="font-semibold">{formatPaise(order.amountPaidPaise)}</dd>
          </div>
          {order.shippingAddressSummary && (
            <div className="border-t border-line pt-3">
              <dt className="text-ink-muted">Delivery address</dt>
              <dd className="mt-1 leading-6">{order.shippingAddressSummary}</dd>
            </div>
          )}
          {order.estimatedDelivery && (
            <div className="border-t border-line pt-3">
              <dt className="text-ink-muted">Estimated delivery</dt>
              <dd className="mt-1 font-semibold">{order.estimatedDelivery}</dd>
            </div>
          )}
        </dl>
        <div className="mt-6 border-t border-line pt-5">
          <h3 className="text-sm font-semibold">Items</h3>
          <ul className="mt-3 space-y-3 text-sm">
            {order.items.map((item, index) => (
              <li key={`${item.title}-${index}`} className="flex justify-between gap-4">
                <span>
                  {item.title}
                  {item.variantTitle ? `, ${item.variantTitle}` : ""} × {item.quantity}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <Link
          href="/shop"
          className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-[var(--radius-control)] bg-ink px-5 text-sm font-semibold text-canvas"
        >
          Continue shopping
        </Link>
      </aside>
    </div>
  );
}

function safeTrackingUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}
