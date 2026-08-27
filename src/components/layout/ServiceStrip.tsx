import { BadgeIndianRupee, RotateCcw, ShieldCheck, Truck } from "lucide-react";

import { formatPaise } from "@/lib/storefront/money";

function readConfiguredPaise(name: string): number | null {
  const raw = process.env[name]?.trim();
  if (!raw || !/^\d+$/.test(raw)) return null;
  const value = Number(raw);
  return Number.isSafeInteger(value) && value >= 0 ? value : null;
}

/**
 * The thin service bar above the header.
 *
 * Every claim here has to be one the store actually keeps, so the shipping message only
 * appears when a free-shipping threshold is configured — the previous version had the
 * same rule and it is worth keeping. "Wholesale pricing" is phrased as an enquiry rather
 * than a promise, because quantity pricing is not yet in the backend contract.
 */
export function ServiceStrip() {
  const threshold = readConfiguredPaise("NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD_PAISE");

  const items = [
    threshold !== null
      ? { icon: Truck, text: `Free shipping above ${formatPaise(threshold)}` }
      : { icon: Truck, text: "Delivery across India" },
    { icon: RotateCcw, text: "Returns supported" },
    { icon: ShieldCheck, text: "Secure payments" },
    // Not "wholesale discounts": what the system genuinely does is publish and enforce a
    // minimum, and quantity pricing is still confirmed by a person.
    { icon: BadgeIndianRupee, text: "Bulk minimums shown per product" },
  ];

  return (
    <aside aria-label="Store services" className="border-b border-line bg-surface-blue">
      <div className="shell flex min-h-9 items-center justify-start gap-6 overflow-x-auto py-1.5 text-[0.72rem] font-semibold text-ink-muted no-scrollbar sm:justify-center sm:gap-8 lg:justify-between">
        {items.map(({ icon: Icon, text }) => (
          <span className="flex shrink-0 items-center gap-1.5" key={text}>
            <Icon aria-hidden="true" className="text-brand-ink" size={14} strokeWidth={2} />
            {text}
          </span>
        ))}
      </div>
    </aside>
  );
}
