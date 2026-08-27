import { Boxes, LayoutGrid, PackageSearch, Tags } from "lucide-react";

/**
 * The four-benefit block: why buy here rather than somewhere else.
 *
 * EVERY ONE OF THESE FOUR IS SOMETHING THE SYSTEM DOES
 * ---------------------------------------------------
 * Flexible minimums are real: the backend reads a `moq:<n>` product tag and the checkout
 * refuses a line below it, so a stated minimum is enforced rather than suggested.
 * Multi-category sourcing is real: one catalog, one cart, one payment. Order tracking is
 * real and tokenised, and works without an account.
 *
 * The one that needs care is pricing. There is no tier table in the backend and no quantity
 * break in the storefront contract, so this block says that buying more is where wholesale
 * pricing comes from and points at the enquiry route — it does not say "save 20% at 50
 * units". A percentage here would be a number the checkout has never agreed to, and the
 * customer would find that out on the payment screen.
 *
 * Line icons in brand blue on a tinted disc, no illustration and no photograph. A benefits
 * row is read, not looked at.
 */
const BENEFITS = [
  {
    icon: Boxes,
    title: "Flexible minimums",
    text: "Wholesale lines carry a stated minimum order quantity, shown on the product and enforced at checkout — never a surprise after payment.",
  },
  {
    icon: Tags,
    title: "Wholesale pricing",
    text: "Per-unit prices are shown as per-unit prices, so the cost of a bulk order is arithmetic you can check. Larger quantities are quoted by our team.",
  },
  {
    icon: LayoutGrid,
    title: "Multi-category sourcing",
    text: "Electronics, home and kitchen, tools, office supplies, beauty and more — one catalog, one cart and one payment instead of five suppliers.",
  },
  {
    icon: PackageSearch,
    title: "Order tracking",
    text: "Every order gets a secure tracking link that works without an account, so whoever placed it can follow it and so can whoever receives it.",
  },
];

export function WhyKanay() {
  return (
    <section aria-labelledby="why-heading" className="border-y border-line bg-surface">
      <div className="shell section-y">
        <div className="max-w-[56ch]">
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-accent-ink">
            Built for bulk buyers
          </p>
          <h2
            className="mt-3 text-xl font-extrabold tracking-[-0.015em] sm:text-2xl"
            id="why-heading"
          >
            Why businesses buy on Kanay
          </h2>
          <p className="mt-3 text-sm leading-6 text-ink-muted">
            Four things this store does differently, and each one is something you can verify
            before you pay.
          </p>
        </div>

        {/*
          Four columns separated by a rule, not four bordered cards.
          The card version made this read as another row of boxes on a page that already had
          plenty; a top rule per column gives the same grouping with a fraction of the weight.
          The rule is orange on the first item only — an accent, not a pattern.
        */}
        <ul className="mt-9 grid gap-x-8 gap-y-9 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map(({ icon: Icon, title, text }, index) => (
            <li className="border-t-2 border-line pt-5" key={title}>
              <span
                aria-hidden="true"
                className={`-mt-[calc(1.25rem+2px)] mb-5 block h-0.5 w-12 ${index === 0 ? "bg-accent" : "bg-transparent"}`}
              />
              <Icon
                aria-hidden="true"
                className="text-brand"
                size={22}
                strokeWidth={1.7}
              />
              <h3 className="mt-3.5 text-base font-extrabold tracking-[-0.01em]">{title}</h3>
              <p className="mt-2 text-[0.83rem] leading-6 text-ink-muted">{text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
