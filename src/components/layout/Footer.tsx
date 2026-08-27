import Link from "next/link";

import type { StorefrontCollectionSummary } from "@/lib/storefront/types";

/**
 * Multi-column footer, on dark navy.
 *
 * WHY THE FOOTER IS DARK IN BOTH THEMES
 * -------------------------------------
 * It was a light grey panel, which meant the page just ran out at the bottom. A dark navy
 * footer terminates the page and is the one place in this design where the brand's darkest
 * navy gets real surface area. It uses its own token set (`--footer-bg`, `--footer-ink`,
 * `--footer-muted`) precisely so it does NOT invert with the theme: in light mode it is the
 * anchor at the end of a bright page, and in dark mode it deepens slightly rather than
 * lightening into the page it is supposed to close off.
 *
 * WHAT IS NOT HERE
 * ----------------
 * Contact details and the address render only when configured. There is no fabricated
 * "About us" paragraph, no invented social accounts, no customer-count claim and no row of
 * card-brand logos — which methods this store actually offers depends on what its Razorpay
 * account has enabled, and this frontend cannot see that.
 */
export function Footer({ collections = [] }: { collections?: StorefrontCollectionSummary[] }) {
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim();
  const supportPhone = process.env.NEXT_PUBLIC_SUPPORT_PHONE?.trim();
  const supportAddress = process.env.NEXT_PUBLIC_SUPPORT_ADDRESS?.trim();
  const year = new Date().getUTCFullYear();
  const hasContact = Boolean(supportEmail || supportPhone || supportAddress);

  return (
    <footer className="mt-6 bg-footer-bg text-footer-ink">
      <div className="shell py-14 lg:py-18">
        <div className="grid gap-10 border-b border-white/10 pb-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]">
          <div>
            <Link
              className="inline-flex items-center gap-2.5 rounded-[var(--radius-control)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              href="/"
            >
              <span
                aria-hidden="true"
                className="grid size-9 place-items-center rounded-[var(--radius-control)] bg-brand text-base font-extrabold leading-none text-white"
              >
                K
              </span>
              <span className="text-[0.95rem] font-extrabold tracking-[0.14em] text-white">
                KANAY STORE
              </span>
            </Link>
            <p className="mt-5 max-w-[34ch] text-sm leading-6 text-footer-muted">
              A general-purpose wholesale and retail marketplace — electronics, home and
              kitchen, tools, office supplies, beauty, accessories and more. Bulk minimums
              where they apply, per-unit pricing in INR, delivery across India.
            </p>
          </div>

          {/*
            WHOLESALE IS ITS OWN COLUMN, AND IT IS FIRST.
            On a marketplace whose identity is bulk buying, wholesale links buried under
            "Company" tell a business buyer they are the secondary audience.
          */}
          <FooterGroup title="Wholesale">
            <FooterLink href="/#wholesale">Bulk orders</FooterLink>
            <FooterLink href="/about#moq">MOQ information</FooterLink>
            <FooterLink href="/about#wholesale">Wholesale enquiry</FooterLink>
            <FooterLink href="/about#support">Business support</FooterLink>
          </FooterGroup>

          <FooterGroup title="Shop">
            <FooterLink href="/shop">All products</FooterLink>
            <FooterLink href="/shop?sort=NEWEST">New arrivals</FooterLink>
            <FooterLink href="/#best-sellers">Best sellers</FooterLink>
            <FooterLink href="/#categories">Categories</FooterLink>
            <FooterLink href="/#deals">Deals</FooterLink>
            {collections.slice(0, 1).map((collection) => (
              <FooterLink href={`/collections/${collection.handle}`} key={collection.id}>
                {collection.title}
              </FooterLink>
            ))}
          </FooterGroup>

          <FooterGroup title="Customer service">
            <FooterLink href="/track-order">Track order</FooterLink>
            <FooterLink href="/cart">Your cart</FooterLink>
            <FooterLink href="/search">Search</FooterLink>
            <FooterLink href="/about#shipping">Shipping</FooterLink>
            <FooterLink href="/about#returns">Returns</FooterLink>
            <FooterLink href="/about#faqs">FAQs</FooterLink>
          </FooterGroup>

          <div>
            <h2 className="text-[0.7rem] font-bold uppercase tracking-[0.12em] text-white">
              Company
            </h2>
            <ul className="mt-4 grid gap-2.5 text-sm text-footer-muted">
              <FooterLink href="/about">About us</FooterLink>
              <FooterLink href="/about#policies">Policies</FooterLink>
            </ul>

            <h2 className="mt-7 text-[0.7rem] font-bold uppercase tracking-[0.12em] text-white">
              Contact
            </h2>
            <div className="mt-4 grid gap-2.5 text-sm text-footer-muted">
              {supportEmail ? (
                <a
                  className="rounded transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  href={`mailto:${supportEmail}`}
                >
                  {supportEmail}
                </a>
              ) : null}
              {supportPhone ? (
                <a
                  className="rounded transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  href={`tel:${supportPhone.replace(/\s/g, "")}`}
                >
                  {supportPhone}
                </a>
              ) : null}
              {supportAddress ? <p className="leading-6">{supportAddress}</p> : null}
              {!hasContact ? (
                <p className="leading-6">Support details are published here once configured.</p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 pt-7 text-xs text-footer-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} Kanay Store</p>
          <p>Payments are processed securely by Razorpay.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-[0.7rem] font-bold uppercase tracking-[0.12em] text-white">{title}</h2>
      <ul className="mt-4 grid gap-2.5 text-sm text-footer-muted">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link
        className="rounded transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        href={href}
      >
        {children}
      </Link>
    </li>
  );
}
