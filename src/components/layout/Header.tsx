import { Menu, PackageSearch, Search, ShoppingCart } from "lucide-react";
import Link from "next/link";

import { CartCountBadge } from "@/components/cart/CartCountBadge";

const ICON_STROKE = 1.75;

/**
 * Primary navigation.
 *
 * The old header built its nav out of the first four Shopify collections, sorted by a
 * hard-coded preference list of "women, men, accessories, sale" — so a store selling
 * power tools and kitchenware advertised a womenswear department. The nav is now fixed and
 * category-neutral, and the actual categories live in the rail on the homepage and in the
 * shop filters, where they come from live data and scale past four.
 *
 * Every destination is a route that exists. There is deliberately no Account or Wishlist
 * entry: neither has a backend, and a nav link to a page that cannot work is worse than
 * its absence.
 */
const NAV_LINKS: { href: string; label: string }[] = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/#categories", label: "Categories" },
  { href: "/shop?sort=NEWEST", label: "New Arrivals" },
  { href: "/#best-sellers", label: "Best Sellers" },
  { href: "/#wholesale", label: "Wholesale" },
  { href: "/#deals", label: "Deals" },
  { href: "/about", label: "About" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/85">
      <div className="shell flex h-16 items-center gap-3 lg:h-[4.5rem] lg:gap-6">
        <MobileNav />

        <Link
          aria-label="Kanay Store home"
          className="flex shrink-0 items-center gap-2 rounded-[var(--radius-control)] focus-visible:outline focus-visible:outline-2"
          href="/"
        >
          <span
            aria-hidden="true"
            className="grid size-9 place-items-center rounded-[var(--radius-control)] bg-accent text-base font-extrabold leading-none text-white"
          >
            K
          </span>
          <span className="text-[0.95rem] font-extrabold tracking-[0.14em]">KANAY</span>
        </Link>

        {/* Search sits in the centre from md up, exactly as in the reference: it is the
            primary way to shop a catalog this broad, so it gets the widest slot. */}
        <SearchField className="hidden md:flex" id="header-search" />

        <nav aria-label="Main navigation" className="ml-auto hidden xl:block">
          <ul className="flex items-center gap-5 whitespace-nowrap text-[0.82rem] font-semibold">
            {NAV_LINKS.map((link) => (
              <li key={link.label}>
                <Link
                  className="rounded transition-colors hover:text-accent-ink focus-visible:outline focus-visible:outline-2"
                  href={link.href}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-0.5 xl:ml-2">
          <Link
            aria-label="Search products"
            className="grid size-11 place-items-center rounded-[var(--radius-control)] transition-colors hover:bg-surface-muted hover:text-accent-ink focus-visible:outline focus-visible:outline-2 md:hidden"
            href="/search"
          >
            <Search aria-hidden="true" size={21} strokeWidth={ICON_STROKE} />
          </Link>
          <Link
            className="hidden size-11 place-items-center rounded-[var(--radius-control)] transition-colors hover:bg-surface-muted hover:text-accent-ink focus-visible:outline focus-visible:outline-2 sm:grid"
            href="/track-order"
            aria-label="Track an order"
            title="Track an order"
          >
            <PackageSearch aria-hidden="true" size={21} strokeWidth={ICON_STROKE} />
          </Link>
          <Link
            aria-label="Open cart"
            className="relative grid size-11 place-items-center rounded-[var(--radius-control)] transition-colors hover:bg-surface-muted hover:text-accent-ink focus-visible:outline focus-visible:outline-2"
            href="/cart"
          >
            <ShoppingCart aria-hidden="true" size={21} strokeWidth={ICON_STROKE} />
            <CartCountBadge />
          </Link>
        </div>
      </div>

      {/* Secondary nav row for md-lg, where the eight links do not fit beside the search
          field but the screen is still too wide for a burger-only header. */}
      <nav
        aria-label="Category navigation"
        className="hidden border-t border-line bg-surface md:block xl:hidden"
      >
        <ul className="shell flex items-center gap-6 overflow-x-auto py-2.5 text-[0.82rem] font-semibold no-scrollbar">
          {NAV_LINKS.map((link) => (
            <li className="shrink-0" key={link.label}>
              <Link
                className="rounded transition-colors hover:text-accent-ink focus-visible:outline focus-visible:outline-2"
                href={link.href}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}

/**
 * Mobile navigation.
 *
 * `<details>` rather than a state-driven drawer, so it works before hydration and needs no
 * client bundle — the header is otherwise a server component and there is no reason to
 * ship JavaScript for a menu the browser can open itself.
 */
function MobileNav() {
  return (
    <details className="group relative xl:hidden md:hidden">
      <summary className="grid size-11 cursor-pointer list-none place-items-center rounded-[var(--radius-control)] transition-colors hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 [&::-webkit-details-marker]:hidden">
        <span className="sr-only">Open navigation</span>
        <Menu aria-hidden="true" size={22} strokeWidth={ICON_STROKE} />
      </summary>
      <nav
        aria-label="Mobile navigation"
        className="absolute left-0 top-[3.5rem] w-[min(20rem,calc(100vw-2rem))] rounded-[var(--radius-card)] border border-line bg-surface p-4 shadow-[var(--shadow-soft)]"
      >
        <SearchField className="mb-3 flex" id="mobile-search" />
        <ul className="grid">
          {NAV_LINKS.map((link) => (
            <li key={link.label}>
              <Link
                className="block min-h-11 border-b border-line py-3 text-sm font-semibold last:border-b-0 transition-colors hover:text-accent-ink focus-visible:outline focus-visible:outline-2"
                href={link.href}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </details>
  );
}

/** The real catalog search. GET to /search, so it works without JavaScript. */
function SearchField({ className = "", id }: { className?: string; id: string }) {
  return (
    <form
      action="/search"
      className={`min-w-0 flex-1 items-center gap-2 rounded-[var(--radius-pill)] border border-line bg-surface-muted px-3 focus-within:border-accent md:max-w-xl ${className}`}
      method="get"
      role="search"
    >
      <label className="sr-only" htmlFor={id}>
        Search products
      </label>
      <Search aria-hidden="true" className="shrink-0 text-ink-subtle" size={18} strokeWidth={ICON_STROKE} />
      <input
        autoComplete="off"
        className="min-h-11 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-subtle"
        id={id}
        name="q"
        placeholder="Search products, brands and categories"
        type="search"
      />
      <button
        className="my-1.5 hidden shrink-0 rounded-[var(--radius-pill)] bg-accent px-4 py-1.5 text-xs font-bold text-white transition-colors hover:bg-accent-hover focus-visible:outline focus-visible:outline-2 sm:block"
        type="submit"
      >
        Search
      </button>
      <button aria-label="Submit search" className="grid size-9 shrink-0 place-items-center sm:hidden" type="submit">
        <Search aria-hidden="true" size={18} strokeWidth={ICON_STROKE} />
      </button>
    </form>
  );
}
