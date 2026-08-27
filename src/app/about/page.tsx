import type { Metadata } from "next";
import Link from "next/link";

import { StoreShell } from "@/components/layout/StoreShell";
import { getCollections } from "@/lib/storefront/collections";

export const metadata: Metadata = {
  title: "About, shipping and policies",
  description:
    "How Kanay Store works: what we sell, wholesale enquiries, shipping, returns, payments and order tracking.",
  alternates: { canonical: "/about" },
};

/**
 * The information page behind the About, Shipping, Returns, FAQs, Wholesale and Policies
 * links in the nav and footer.
 *
 * WHY IT IS DELIBERATELY SPARSE
 * -----------------------------
 * Every one of those links previously pointed at a homepage anchor or did not exist. A page
 * of confident marketing prose would be easy to write and would be mostly untrue: there is
 * no published returns window, no delivery SLA, no company registration detail and no
 * customer-count in this system. So each section states what the software genuinely does and
 * says plainly where a policy has yet to be published, with the anchors the footer expects
 * (#wholesale, #shipping, #returns, #faqs, #policies).
 */
export default async function AboutPage() {
  const collectionsResult = await getCollections();
  const collections = collectionsResult.ok ? collectionsResult.data : [];
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim();
  const supportPhone = process.env.NEXT_PUBLIC_SUPPORT_PHONE?.trim();

  const contactLine = supportEmail
    ? `Email ${supportEmail}`
    : supportPhone
      ? `Call ${supportPhone}`
      : "Contact details are published on this site once configured";

  return (
    <StoreShell collections={collections}>
      <main className="shell section-y">
        <header className="max-w-[62ch]">
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-brand-ink">About</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-[-0.02em] sm:text-4xl">
            A wholesale and retail marketplace for everyday products
          </h1>
          <p className="mt-4 text-sm leading-6 text-ink-muted sm:text-base">
            Kanay Store sells across categories — electronics and mobile accessories, home and
            kitchen, appliances, beauty and personal care, bags, watches, toys, sports and
            fitness, office supplies, home decor, tools, automotive accessories, travel goods
            and fashion. Some lines carry a minimum order quantity for bulk buyers; the rest can
            be bought one at a time. Products, prices and stock come from our live catalog, and
            every price shown is in INR.
          </p>
        </header>

        <div className="mt-10 grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
          <Panel id="wholesale" title="Wholesale">
            <p>
              Most of the catalog can be ordered in quantity. Browse for the items you need,
              then contact us with the products and quantities you have in mind and our team
              confirms pricing and availability.
            </p>
            <p>
              Quantity-based pricing is not shown on product pages yet. Until it is, this site
              deliberately quotes no bulk rate — the price you see at checkout is the price the
              system has actually approved.
            </p>
            <p className="font-semibold text-ink">{contactLine}</p>
          </Panel>

          {/*
            The MOQ panel is the reference the badges on product cards point at. It explains
            the rule precisely, because "MOQ 10" on a card is only useful to someone who knows
            what happens if they try to order nine.
          */}
          <Panel id="moq" title="Minimum order quantities (MOQ)">
            <p>
              Some products can only be bought in bulk. Where that applies, the product carries
              a minimum order quantity and you will see it in three places: an{" "}
              <span className="font-semibold text-ink">MOQ</span> badge on the product card, the
              minimum order value beneath the per-unit price, and a quantity selector that
              starts at the minimum rather than at one.
            </p>
            <p>
              The minimum is checked again by our backend when you check out, against freshly
              read catalog data. If a line is below its minimum the order is refused before any
              payment is taken and the message names the product and the quantity needed. That
              double check is deliberate: a rule enforced only in the browser is not a rule.
            </p>
            <p>
              Products with no badge have no minimum and can be ordered one at a time. A
              minimum is set by us per product, so it can change — the figure shown when you
              check out is the one that applies.
            </p>
          </Panel>

          <Panel id="support" title="Business support">
            <p>
              For bulk quotes, repeat orders, invoicing questions or help choosing between
              lines, contact us with the product names and the quantities you are planning.
              Specific quantities get a specific answer faster than a general enquiry.
            </p>
            <p>
              Support covers orders placed on this site. There is no separate reseller portal or
              account manager tier — one route in, and it is the one below.
            </p>
            <p className="font-semibold text-ink">{contactLine}</p>
          </Panel>

          <Panel id="shipping" title="Shipping">
            <p>
              We deliver across India. Shipping is calculated and shown at checkout, before any
              payment is taken, so the total you approve is the total you pay.
            </p>
            <p>
              Delivery timeframes are not published here yet, because they depend on the
              destination and the item. Your order confirmation carries a tracking link.
            </p>
          </Panel>

          <Panel id="returns" title="Returns">
            <p>
              If something arrives damaged, faulty or incorrect, contact us with your order
              number and we will arrange the return.
            </p>
            <p>
              A published returns window and a self-service return flow are not live yet. Rather
              than state a policy the system cannot enforce, returns are handled by support case
              by case.
            </p>
          </Panel>

          <Panel id="payments" title="Payments">
            <p>
              Checkout is handled by Razorpay, which supports UPI, cards, net banking and
              wallets. Card and UPI details are entered inside Razorpay — this store never sees
              or stores them.
            </p>
            <p>
              Prices are recalculated by our backend at checkout from live catalog data, so a
              stale price in your cart is caught before you pay rather than after.
            </p>
          </Panel>

          <Panel id="faqs" title="Common questions">
            <Question q="Do I need an account?">
              No. Checkout is available as a guest, and orders can be tracked with the secure
              link on your confirmation.
            </Question>
            <Question q="How do I track an order?">
              Open the <Link className="font-semibold text-brand-ink underline" href="/track-order">track order</Link>{" "}
              page and paste the secure link from your confirmation. The link is what proves the
              order is yours, so treat it like a password.
            </Question>
            <Question q="Why did my cart price change?">
              Prices come from the live catalog. If an item was repriced after you added it, the
              checkout tells you before taking payment.
            </Question>
          </Panel>

          <Panel id="policies" title="Policies">
            <p>
              Formal terms of service, privacy and refund policy documents are not published
              yet, so nothing on this site links to one. A link to an unwritten policy is worse
              than no link at all.
            </p>
            <p>
              In the meantime: we collect the name, contact details and address needed to
              deliver an order, and payment details are handled solely by Razorpay.
            </p>
          </Panel>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-control)] bg-brand-solid px-6 text-sm font-bold text-white transition-colors hover:bg-brand-solid-hover focus-visible:outline focus-visible:outline-2"
            href="/shop"
          >
            Browse all products
          </Link>
          <Link
            className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-control)] border border-line-strong bg-surface px-6 text-sm font-bold transition-colors hover:border-brand hover:text-brand-ink focus-visible:outline focus-visible:outline-2"
            href="/track-order"
          >
            Track an order
          </Link>
        </div>
      </main>
    </StoreShell>
  );
}

function Panel({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      aria-labelledby={`${id}-heading`}
      className="rounded-[var(--radius-card)] border border-line bg-surface p-5 sm:p-6"
      id={id}
    >
      <h2 className="text-lg font-extrabold tracking-[-0.01em]" id={`${id}-heading`}>
        {title}
      </h2>
      <div className="mt-3 grid gap-3 text-sm leading-6 text-ink-muted">{children}</div>
    </section>
  );
}

function Question({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-bold text-ink">{q}</h3>
      <p className="mt-1">{children}</p>
    </div>
  );
}
