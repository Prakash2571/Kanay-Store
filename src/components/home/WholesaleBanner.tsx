import { ArrowRight, Boxes, PackageCheck, Truck } from "lucide-react";
import Link from "next/link";

/**
 * The wholesale section.
 *
 * DISCOVERY AND RULES, NOT TIER PRICING — DELIBERATELY
 * ----------------------------------------------------
 * There is one wholesale number this section is allowed to talk about, and that is the
 * minimum order quantity: it comes from the product's `moq:<n>` tag and the checkout enforces
 * it, so stating it is stating a rule the system keeps.
 *
 * Quantity BREAKS are a different matter. The storefront API returns no tier table and the
 * backend is the only authority on price, so this section quotes no percentage and no "20% off
 * at 50 units". A buyer promised that here and charged per-unit retail at checkout is a
 * support ticket and a lost account.
 *
 * When the backend gains quantity pricing, this is the section that gains those numbers.
 */
export function WholesaleBanner() {
  const points = [
    {
      icon: Boxes,
      title: "Minimums stated up front",
      text: "Bulk lines carry an MOQ badge on the card and a minimum order value beside the unit price.",
    },
    {
      icon: PackageCheck,
      title: "Same approved catalog",
      text: "Wholesale draws on the same stock and the same product data as retail — no separate, staler list.",
    },
    {
      icon: Truck,
      title: "Delivery across India",
      text: "Shipping is quoted at checkout before any payment is taken, whatever the order size.",
    },
  ];

  return (
    <section aria-labelledby="wholesale-heading" className="shell section-y" id="wholesale">
      <div className="grid gap-8 rounded-[var(--radius-card)] border border-line bg-surface-blue p-6 sm:p-9 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-12 lg:p-12">
        <div>
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-accent-ink">Wholesale</p>
          <h2
            className="mt-3 max-w-[22ch] text-2xl font-extrabold leading-tight tracking-[-0.015em] sm:text-[1.75rem]"
            id="wholesale-heading"
          >
            Buying in quantity? Here is how it works.
          </h2>
          <p className="mt-3 max-w-[54ch] text-sm leading-6 text-ink-muted">
            Products sold in bulk show their minimum order quantity before you add them, and
            checkout re-checks it against live catalog data. For volumes beyond that, send us the
            items and quantities — pricing is confirmed by our team, and this page never quotes a
            bulk rate the checkout has not agreed to.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-brand px-6 text-sm font-bold text-white transition-colors hover:bg-brand-hover focus-visible:outline focus-visible:outline-2 active:translate-y-px"
              href="/about#moq"
            >
              How MOQ works
              <ArrowRight aria-hidden="true" size={17} strokeWidth={2} />
            </Link>
            <Link
              className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-control)] border border-line-strong bg-surface px-6 text-sm font-bold text-ink transition-colors hover:border-brand hover:text-brand-ink focus-visible:outline focus-visible:outline-2 active:translate-y-px"
              href="/shop"
            >
              View all products
            </Link>
          </div>
        </div>

        <ul className="grid gap-3">
          {points.map(({ icon: Icon, title, text }) => (
            <li
              className="flex items-start gap-3.5 rounded-[var(--radius-card)] bg-surface/80 p-4"
              key={title}
            >
              <Icon aria-hidden="true" className="mt-0.5 shrink-0 text-brand" size={22} strokeWidth={1.7} />
              <div>
                <h3 className="text-sm font-bold">{title}</h3>
                <p className="mt-1 text-[0.8rem] leading-5 text-ink-muted">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
