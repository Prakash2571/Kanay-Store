import { ArrowRight, Boxes, PackageCheck, Truck } from "lucide-react";
import Link from "next/link";

/**
 * The wholesale section.
 *
 * DISCOVERY, NOT PRICING — DELIBERATELY
 * -------------------------------------
 * Kanay supports wholesale, but the storefront API does not yet return quantity breaks, and
 * the backend is the only authority on price. So this section navigates and explains; it
 * quotes no percentage, no minimum order value and no tier table. Every one of those would
 * be a number invented in the frontend, and a wholesale buyer who is quoted "20% off at 50
 * units" here and charged retail at checkout is a support ticket and a lost account.
 *
 * When the backend gains quantity pricing, this is the section that gains real numbers.
 */
export function WholesaleBanner() {
  const points = [
    {
      icon: Boxes,
      title: "Bulk quantities",
      text: "Order the same item in volume across most of the catalog.",
    },
    {
      icon: PackageCheck,
      title: "Same approved catalog",
      text: "Wholesale draws on the same stock and the same product data as retail.",
    },
    {
      icon: Truck,
      title: "Delivery across India",
      text: "Shipping is quoted at checkout before any payment is taken.",
    },
  ];

  return (
    <section aria-labelledby="wholesale-heading" className="shell section-y" id="wholesale">
      <div className="grid gap-8 rounded-[var(--radius-card)] border border-line bg-surface-peach p-6 sm:p-8 lg:grid-cols-[1fr_1fr] lg:items-center lg:p-12">
        <div>
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-accent-ink">Wholesale</p>
          <h2
            className="mt-3 max-w-[22ch] text-2xl font-extrabold leading-tight tracking-[-0.015em] sm:text-[1.75rem]"
            id="wholesale-heading"
          >
            Buying in quantity? Let&apos;s talk.
          </h2>
          <p className="mt-3 max-w-[54ch] text-sm leading-6 text-ink-muted">
            Browse the catalog for products you want in volume and contact us with the items and
            quantities. Pricing is confirmed by our team — this page never quotes a bulk rate the
            checkout has not agreed to.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-ink px-6 text-sm font-bold text-white transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 active:translate-y-px"
              href="/about#wholesale"
            >
              About wholesale
              <ArrowRight aria-hidden="true" size={17} strokeWidth={2} />
            </Link>
            <Link
              className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-control)] border border-ink bg-surface px-6 text-sm font-bold text-ink transition-colors hover:bg-ink hover:text-white focus-visible:outline focus-visible:outline-2 active:translate-y-px"
              href="/shop"
            >
              View all products
            </Link>
          </div>
        </div>

        <ul className="grid gap-3">
          {points.map(({ icon: Icon, title, text }) => (
            <li
              className="flex items-start gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-4"
              key={title}
            >
              <Icon aria-hidden="true" className="mt-0.5 shrink-0 text-accent" size={22} strokeWidth={1.7} />
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
