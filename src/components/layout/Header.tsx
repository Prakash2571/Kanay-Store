import { Menu, PackageSearch, Search, ShoppingCart } from "lucide-react";
import Link from "next/link";

import { CartCountBadge } from "@/components/cart/CartCountBadge";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

const ICON_STROKE = 1.75;

/**
 * Primary navigation.
 *
 * Wholesale-first ordering: Wholesale and Deals sit in the main row rather than being buried,
 * because "can I buy in bulk" is the first question a business visitor has. Every destination
 * is a route that exists; there is deliberately no Account entry, since account handling has
 * no backend and a nav link to a page that cannot work is worse than its absence.
 */
const NAV_LINKS: { href: string; label: string }[] = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/#categories", label: "Categories" },
  { href: "/#wholesale", label: "Wholesale" },
  { href: "/shop?sort=NEWEST", label: "New Arrivals" },
  { href: "/#best-sellers", label: "Best Sellers" },
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
          {/* Blue mark, dark wordmark: the brand signal sits in the symbol, not in the type. */}
          <span
            aria-hidden="true"
            className="grid size-9 place-items-center rounded-[var(--radius-control)] bg-brand text-base font-extrabold leading-none text-white"
          >
            K
          </span>
          <span className="text-[0.95rem] font-extrabold tracking-[0.14em] text-ink">KANAY</span>
        </Link>

        <SearchField className="hidden md:flex" id="header-search" />

        <nav aria-label="Main navigation" className="ml-auto hidden xl:block">
          <ul className="flex items-center gap-5 whitespace-nowrap text-[0.82rem] font-semibold">
            {NAV_LINKS.map((link) => (
              <li key={link.label}>
                <Link
                  className="rounded text-ink-muted transition-colors hover:text-brand-ink focus-visible:outline focus-visible:outline-2"
                  href={link.href}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Search, track, theme, cart - the order the brief specifies. */}
        <div className="ml-auto flex items-center gap-0.5 xl:ml-2">
          <Link
            aria-label="Search products"
            className="grid size-11 place-items-center rounded-[var(--radius-control)] text-ink-muted transition-colors hover:bg-surface-muted hover:text-brand-ink focus-visible:outline focus-visible:outline-2 md:hidden"
            href="/search"
          >
            <Search aria-hidden="true" size={21} strokeWidth={ICON_STROKE} />
          </Link>
          <Link
            aria-label="Track an order"
            className="hidden size-11 place-items-center rounded-[var(--radius-control)] text-ink-muted transition-colors hover:bg-surface-muted hover:text-brand-ink focus-visible:outline focus-visible:outline-2 sm:grid"
            href="/track-order"
            title="Track an order"
          >
            <PackageSearch aria-hidden="true" size={21} strokeWidth={ICON_STROKE} />
          </Link>
          <ThemeToggle />
          <Link
            aria-label="Open cart"
            className="relative grid size-11 place-items-center rounded-[var(--radius-control)] text-ink-muted transition-colors hover:bg-surface-muted hover:text-brand-ink focus-visible:outline focus-visible:outline-2"
            href="/cart"
          >
            <ShoppingCart aria-hidden="true" size={21} strokeWidth={ICON_STROKE} />
            <CartCountBadge />
          </Link>
        </div>
      </div>

      {/* Secondary nav row for md-lg, where eight links do not fit beside the search field. */}
      <nav
        aria-label="Category navigation"
        className="hidden border-t border-line bg-surface md:block xl:hidden"
      >
        <ul className="shell flex items-center gap-6 overflow-x-auto py-2.5 text-[0.82rem] font-semibold no-scrollbar">
          {NAV_LINKS.map((link) => (
            <li className="shrink-0" key={link.label}>
              <Link
                className="rounded text-ink-muted transition-colors hover:text-brand-ink focus-visible:outline focus-visible:outline-2"
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
 * `<details>` rather than a state-driven drawer: it works before hydration and ships no
 * client JavaScript for a menu the browser can open itself.
 */
function MobileNav() {
  return (
    <details className="group relative md:hidden">
      <summary className="grid size-11 cursor-pointer list-none place-items-center rounded-[var(--radius-control)] text-ink-muted transition-colors hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 [&::-webkit-details-marker]:hidden">
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
                className="block min-h-11 border-b border-line py-3 text-sm font-semibold last:border-b-0 transition-colors hover:text-brand-ink focus-visible:outline focus-visible:outline-2"
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
      className={`min-w-0 flex-1 items-center gap-2 rounded-[var(--radius-pill)] border border-line bg-surface-muted px-3 focus-within:border-brand md:max-w-xl ${className}`}
      method="get"
      role="search"
    >
      <label className="sr-only" htmlFor={id}>
        Search products
      </label>
      <Search aria-hidden="true" className="shrink-0 text-ink-subtle" size={18} strokeWidth={ICON_STROKE} />
      <input
        autoComplete="off"
        className="min-h-11 min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-subtle"
        id={id}
        name="q"
        placeholder="Search products, brands and categories"
        type="search"
      />
      <button
        className="my-1.5 hidden shrink-0 rounded-[var(--radius-pill)] bg-brand px-4 py-1.5 text-xs font-bold text-white transition-colors hover:bg-brand-hover focus-visible:outline focus-visible:outline-2 sm:block"
        type="submit"
      >
        Search
      </button>
      <button aria-label="Submit search" className="grid size-9 shrink-0 place-items-center text-ink-muted sm:hidden" type="submit">
        <Search aria-hidden="true" size={18} strokeWidth={ICON_STROKE} />
      </button>
    </form>
  );
}
