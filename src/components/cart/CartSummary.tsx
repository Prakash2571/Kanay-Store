import Link from "next/link";

import { formatPaise } from "@/lib/storefront/money";

type CartSummaryProps = {
  subtotalPaise: number;
  checkoutEnabled?: boolean;
};

export function CartSummary({ subtotalPaise, checkoutEnabled = true }: CartSummaryProps) {
  const threshold = Number(process.env.NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD_PAISE ?? "");
  const standardShipping = Number(process.env.NEXT_PUBLIC_STANDARD_SHIPPING_PAISE ?? "");
  const hasThreshold = Number.isSafeInteger(threshold) && threshold > 0;
  const hasStandardShipping = Number.isSafeInteger(standardShipping) && standardShipping >= 0;
  const shippingPaise =
    hasThreshold && subtotalPaise >= threshold
      ? 0
      : hasStandardShipping
        ? standardShipping
        : null;

  return (
    <aside className="rounded-[var(--radius-card)] bg-surface-muted p-5 sm:p-6">
      <h2 className="text-3xl font-semibold">Order summary</h2>
      <dl className="mt-6 space-y-3 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-ink-muted">Subtotal</dt>
          <dd className="font-semibold">{formatPaise(subtotalPaise)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-ink-muted">Shipping</dt>
          <dd className="text-right font-semibold">
            {shippingPaise === null
              ? "Calculated securely at checkout"
              : shippingPaise === 0
                ? "Free"
                : formatPaise(shippingPaise)}
          </dd>
        </div>
      </dl>
      <div className="mt-5 border-t border-line pt-5">
        <p className="text-xs leading-5 text-ink-muted">
          Prices and availability are verified again before payment. The backend total is authoritative.
        </p>
        {checkoutEnabled && (
          <Link
            href="/checkout"
            className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-[var(--radius-control)] bg-brand px-5 font-semibold whitespace-nowrap text-white transition-transform active:scale-[0.98]"
          >
            Secure checkout
          </Link>
        )}
      </div>
    </aside>
  );
}
