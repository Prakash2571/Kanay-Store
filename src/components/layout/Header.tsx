import { Menu, Search, ShoppingBag } from "lucide-react";
import Link from "next/link";

import type { StorefrontCollectionSummary } from "@/lib/storefront/types";

const ICON_STROKE = 1.75;

function collectionPriority(collection: StorefrontCollectionSummary) {
  const order = ["women", "men", "accessories", "sale"];
  const index = order.findIndex((handle) => collection.handle.toLowerCase().includes(handle));
  return index === -1 ? order.length : index;
}

export function Header({ collections = [] }: { collections?: StorefrontCollectionSummary[] }) {
  const collectionLinks = [...collections]
    .sort((a, b) => collectionPriority(a) - collectionPriority(b))
    .slice(0, 4);
  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/shop", label: "Shop" },
    ...collectionLinks.map((collection) => ({
      href: `/collections/${collection.handle}`,
      label: collection.title,
    })),
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-950 text-zinc-100">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-6 px-4 sm:px-8 lg:h-[4.5rem] lg:px-12">
        <details className="group relative lg:hidden">
          <summary className="flex size-11 cursor-pointer list-none items-center justify-center focus-visible:outline focus-visible:outline-2 [&::-webkit-details-marker]:hidden">
            <span className="sr-only">Open navigation</span>
            <Menu aria-hidden="true" size={22} strokeWidth={ICON_STROKE} />
          </summary>
          <nav className="absolute left-0 top-[3.25rem] w-[min(20rem,calc(100vw-2rem))] border border-zinc-800 bg-zinc-950 p-5 shadow-2xl shadow-black/20" aria-label="Mobile navigation">
            <ul className="grid gap-1">
              {navLinks.map((link) => (
                <li key={`${link.href}-${link.label}`}>
                  <Link className="block min-h-11 border-b border-zinc-800 py-3 text-sm font-semibold transition-colors hover:text-accent focus-visible:outline focus-visible:outline-2" href={link.href}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <form action="/search" className="mt-5 flex border border-zinc-700 bg-zinc-900">
              <label className="sr-only" htmlFor="mobile-store-search">Search products</label>
              <input id="mobile-store-search" name="q" className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm text-zinc-100 placeholder:text-zinc-400" placeholder="Search products" type="search" />
              <button aria-label="Submit search" className="flex size-11 items-center justify-center text-zinc-100 transition-colors hover:text-accent active:translate-y-px" type="submit">
                <Search aria-hidden="true" size={19} strokeWidth={ICON_STROKE} />
              </button>
            </form>
          </nav>
        </details>

        <Link className="mr-auto inline-flex items-center gap-2.5 whitespace-nowrap focus-visible:outline focus-visible:outline-2 lg:mr-2" href="/" aria-label="Kanay Store home">
          <span aria-hidden="true" className="grid size-8 place-items-center border border-zinc-500 font-serif text-xl font-semibold leading-none text-accent">K</span>
          <span className="text-sm font-extrabold tracking-[0.18em]">KANAY</span>
        </Link>

        <nav className="hidden min-w-0 flex-1 lg:block" aria-label="Main navigation">
          <ul className="flex items-center gap-6 whitespace-nowrap text-[0.78rem] font-semibold xl:gap-8">
            {navLinks.map((link) => (
              <li key={`${link.href}-${link.label}`}>
                <Link className="transition-colors hover:text-accent focus-visible:outline focus-visible:outline-2" href={link.href}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <form action="/search" className="hidden w-48 border-b border-zinc-700 xl:flex">
          <label className="sr-only" htmlFor="desktop-store-search">Search products</label>
          <input id="desktop-store-search" name="q" className="min-w-0 flex-1 bg-transparent py-2 text-xs text-zinc-100 placeholder:text-zinc-400" placeholder="Search products" type="search" />
          <button aria-label="Submit search" className="grid size-9 place-items-center transition-colors hover:text-accent active:translate-y-px" type="submit">
            <Search aria-hidden="true" size={18} strokeWidth={ICON_STROKE} />
          </button>
        </form>

        <Link className="grid size-11 place-items-center transition-colors hover:text-accent focus-visible:outline focus-visible:outline-2 xl:hidden" href="/search" aria-label="Search products">
          <Search aria-hidden="true" size={21} strokeWidth={ICON_STROKE} />
        </Link>
        <Link className="grid size-11 place-items-center transition-colors hover:text-accent focus-visible:outline focus-visible:outline-2" href="/cart" aria-label="Open cart">
          <ShoppingBag aria-hidden="true" size={21} strokeWidth={ICON_STROKE} />
        </Link>
      </div>
    </header>
  );
}
