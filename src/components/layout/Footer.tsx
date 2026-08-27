import Link from "next/link";

import type { StorefrontCollectionSummary } from "@/lib/storefront/types";

/**
 * Multi-column footer.
 *
 * Contact details and the address are rendered only when configured, and there is no
 * fabricated "About us" prose, no invented social accounts and no customer-count claim.
 * The payment row lists the methods Razorpay actually presents at checkout rather than a
 * row of card logos the store may not accept.
 */
export function Footer({ collections = [] }: { collections?: StorefrontCollectionSummary[] }) {
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim();
  const supportPhone = process.env.NEXT_PUBLIC_SUPPORT_PHONE?.trim();
  const supportAddress = process.env.NEXT_PUBLIC_SUPPORT_ADDRESS?.trim();
  const year = new Date().getUTCFullYear();
  const hasContact = Boolean(supportEmail || supportPhone || supportAddress);

  return (
    <footer className="mt-4 border-t border-line bg-surface-muted">
      <div className="shell py-10 lg:py-14">
        <div className="grid gap-9 border-b border-line pb-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1.1fr]">
          <div>
            <Link
              className="inline-flex items-center gap-2.5 rounded-[var(--radius-control)] focus-visible:outline focus-visible:outline-2"
              href="/"
            >
              <span
                aria-hidden="true"
                className="grid size-9 place-items-center rounded-[var(--radius-control)] bg-accent text-base font-extrabold leading-none text-white"
              >
                K
              </span>
              <span className="text-[0.95rem] font-extrabold tracking-[0.14em]">KANAY STORE</span>
            </Link>
            <p className="mt-4 max-w-[34ch] text-sm leading-6 text-ink-muted">
              A general store for everyday products — electronics, home and kitchen, beauty,
              accessories, fashion and more. Retail and wholesale, priced in INR.
            </p>
          </div>

          <FooterGroup title="Shop">
            <FooterLink href="/shop">All products</FooterLink>
            <FooterLink href="/shop?sort=NEWEST">New arrivals</FooterLink>
            <FooterLink href="/#best-sellers">Best sellers</FooterLink>
            <FooterLink href="/#categories">Categories</FooterLink>
            <FooterLink href="/#wholesale">Wholesale</FooterLink>
            <FooterLink href="/#deals">Deals</FooterLink>
          </FooterGroup>

          <FooterGroup title="Customer service">
            <FooterLink href="/track-order">Track order</FooterLink>
            <FooterLink href="/cart">Your cart</FooterLink>
            <FooterLink href="/search">Search</FooterLink>
            <FooterLink href="/about#shipping">Shipping</FooterLink>
            <FooterLink href="/about#returns">Returns</FooterLink>
            <FooterLink href="/about#faqs">FAQs</FooterLink>
          </FooterGroup>

          <FooterGroup title="Company">
            <FooterLink href="/about">About us</FooterLink>
            <FooterLink href="/about#wholesale">Wholesale</FooterLink>
            <FooterLink href="/about#policies">Policies</FooterLink>
            {collections.slice(0, 2).map((collection) => (
              <FooterLink href={`/collections/${collection.handle}`} key={collection.id}>
                {collection.title}
              </FooterLink>
            ))}
          </FooterGroup>

          <div>
            <h2 className="text-[0.7rem] font-bold uppercase tracking-[0.12em] text-ink">Contact</h2>
            <div className="mt-4 grid gap-2.5 text-sm text-ink-muted">
              {supportEmail ? (
                <a
                  className="rounded transition-colors hover:text-accent-ink focus-visible:outline focus-visible:outline-2"
                  href={`mailto:${supportEmail}`}
                >
                  {supportEmail}
                </a>
              ) : null}
              {supportPhone ? (
                <a
                  className="rounded transition-colors hover:text-accent-ink focus-visible:outline focus-visible:outline-2"
                  href={`tel:${supportPhone.replace(/\s/g, "")}`}
                >
                  {supportPhone}
                </a>
              ) : null}
              {supportAddress ? <p className="leading-6">{supportAddress}</p> : null}
              {!hasContact ? <p className="leading-6">Support details are published here once configured.</p> : null}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 pt-6 text-xs text-ink-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} Kanay Store</p>
          {/*
            No payment-method badges and no card-brand logos. Which methods are actually
            offered depends on what this store's Razorpay account has enabled, which this
            frontend cannot see - so a row of "UPI / Cards / Net banking / Wallets" chips
            would be advertising options that may not appear at checkout. Naming the
            processor is the part that is true, and it is the part that builds trust.
          */}
          <p>Payments are processed securely by Razorpay.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-[0.7rem] font-bold uppercase tracking-[0.12em] text-ink">{title}</h2>
      <ul className="mt-4 grid gap-2.5 text-sm text-ink-muted">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link
        className="rounded transition-colors hover:text-accent-ink focus-visible:outline focus-visible:outline-2"
        href={href}
      >
        {children}
      </Link>
    </li>
  );
}
