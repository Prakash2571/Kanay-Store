import { Headset, RotateCcw, ShieldCheck, Truck } from "lucide-react";

/**
 * The four-service strip.
 *
 * Wording is kept to what the system genuinely does. "Reliable delivery tracking" is true —
 * guest order tracking exists and is tokenised. "Protected Razorpay checkout" is true: card
 * and UPI entry happens inside Razorpay and this storefront never sees payment details.
 * There is no delivery-time promise and no returns window here, because neither is
 * configured anywhere in the system yet.
 */
const SERVICES = [
  {
    icon: Truck,
    title: "Order tracking",
    text: "Follow any order with a secure link — no account needed.",
  },
  {
    icon: RotateCcw,
    title: "Returns",
    // No window and no self-service flow exist yet, so this describes the route that
    // does exist rather than implying a policy the system cannot enforce.
    text: "Damaged, faulty or wrong item? Contact us and we sort it out.",
  },
  {
    icon: ShieldCheck,
    title: "Secure payment",
    text: "Card and UPI details are entered only inside Razorpay.",
  },
  {
    icon: Headset,
    title: "Customer support",
    text: "Reach us about an order, a product or a bulk enquiry.",
  },
];

export function ServicesStrip() {
  return (
    <section aria-labelledby="services-heading" className="shell pb-2">
      <h2 className="sr-only" id="services-heading">
        Store services
      </h2>
      <ul className="grid gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-4">
        {SERVICES.map(({ icon: Icon, title, text }) => (
          <li className="flex items-start gap-3 sm:px-1" key={title}>
            <span className="grid size-10 shrink-0 place-items-center rounded-[var(--radius-pill)] bg-surface-peach-soft">
              <Icon aria-hidden="true" className="text-accent-ink" size={19} strokeWidth={1.8} />
            </span>
            <div className="min-w-0">
              <h3 className="text-[0.82rem] font-bold uppercase tracking-[0.06em]">{title}</h3>
              <p className="mt-1 text-[0.8rem] leading-5 text-ink-muted">{text}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
