import Link from "next/link";

import type { StorefrontCollectionSummary } from "@/lib/storefront/types";

export function Footer({ collections = [] }: { collections?: StorefrontCollectionSummary[] }) {
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim();
  const supportPhone = process.env.NEXT_PUBLIC_SUPPORT_PHONE?.trim();
  const year = new Date().getUTCFullYear();

  return (
    <footer className="bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-[1400px] px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
        <div className="grid gap-10 border-b border-zinc-800 pb-12 sm:grid-cols-2 lg:grid-cols-[1.45fr_1fr_1fr_1fr_1.15fr]">
          <div>
            <Link className="inline-flex items-center gap-3 focus-visible:outline focus-visible:outline-2" href="/">
              <span className="grid size-10 place-items-center border border-zinc-600 font-serif text-2xl text-accent" aria-hidden="true">K</span>
              <span className="text-sm font-extrabold tracking-[0.18em]">KANAY STORE</span>
            </Link>
            <p className="mt-5 max-w-[30ch] text-sm leading-6 text-zinc-400">Considered fashion and everyday pieces, presented for clear and simple shopping.</p>
          </div>

          <FooterGroup title="Shop">
            <FooterLink href="/shop">All products</FooterLink>
            {collections.slice(0, 3).map((collection) => (
              <FooterLink href={`/collections/${collection.handle}`} key={collection.id}>{collection.title}</FooterLink>
            ))}
          </FooterGroup>

          <FooterGroup title="Customer service">
            <FooterLink href="/cart">Your cart</FooterLink>
            <FooterLink href="/track-order">Track order</FooterLink>
            <FooterLink href="/search">Search</FooterLink>
          </FooterGroup>

          <FooterGroup title="Company">
            <FooterLink href="/#our-edit">Our edit</FooterLink>
            <FooterLink href="/shop?sort=NEWEST">New arrivals</FooterLink>
          </FooterGroup>

          <div>
            <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-zinc-300">Contact</h2>
            <div className="mt-5 grid gap-3 text-sm text-zinc-400">
              {supportEmail ? <a className="transition-colors hover:text-accent" href={`mailto:${supportEmail}`}>{supportEmail}</a> : null}
              {supportPhone ? <a className="transition-colors hover:text-accent" href={`tel:${supportPhone.replace(/\s/g, "")}`}>{supportPhone}</a> : null}
              {!supportEmail && !supportPhone ? <p>Support details will be published here when configured.</p> : null}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 pt-6 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} Kanay Store</p>
          <p>Payments are completed on Razorpay checkout.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-zinc-300">{title}</h2>
      <ul className="mt-5 grid gap-3 text-sm text-zinc-400">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <li><Link className="transition-colors hover:text-accent focus-visible:outline focus-visible:outline-2" href={href}>{children}</Link></li>;
}
