import type { Metadata } from "next";
import { Search } from "lucide-react";

import { CatalogEmpty, CatalogError } from "@/components/commerce/CatalogState";
import { ProductGrid } from "@/components/commerce/ProductGrid";
import { StoreShell } from "@/components/layout/StoreShell";
import { getCatalog } from "@/lib/storefront/catalog";
import { getCollections } from "@/lib/storefront/collections";

export const metadata: Metadata = {
  title: "Search",
  description: "Search the live Kanay Store product catalog.",
  robots: { index: false, follow: true },
};

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const query = await searchParams;
  const q = typeof query.q === "string" ? query.q.trim().slice(0, 120) : "";
  const [catalogResult, collectionsResult] = await Promise.all([
    q ? getCatalog({ q, availability: "SELLABLE", first: 24 }) : Promise.resolve(null),
    getCollections(),
  ]);
  const collections = collectionsResult.ok ? collectionsResult.data : [];

  return (
    <StoreShell collections={collections}>
      <main className="shell section-y min-h-[60dvh]">
        <h1 className="text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">Search</h1>
        <form action="/search" className="mt-7 flex max-w-2xl border border-line bg-surface" method="get">
          <label className="sr-only" htmlFor="catalog-search">Search products</label>
          <input autoFocus className="min-h-12 min-w-0 flex-1 bg-transparent px-4 text-sm placeholder:text-ink-muted" defaultValue={q} id="catalog-search" name="q" placeholder="Search by product name or category" type="search" />
          <button className="grid min-h-12 w-12 place-items-center bg-brand text-white transition-opacity hover:opacity-85 focus-visible:outline focus-visible:outline-2" type="submit"><Search aria-hidden="true" size={20} strokeWidth={1.75} /><span className="sr-only">Search</span></button>
        </form>
        {!q ? (
          <div className="mt-12 border-t border-line pt-8"><p className="text-sm text-ink-muted">Enter a product name, category or collection.</p></div>
        ) : catalogResult?.ok ? (
          <section aria-labelledby="result-heading" className="mt-10">
            <h2 className="mb-7 text-sm font-bold" id="result-heading">{catalogResult.data.products.length} {catalogResult.data.products.length === 1 ? "result" : "results"} for “{q}”</h2>
            {catalogResult.data.products.length ? <ProductGrid priorityCount={4} products={catalogResult.data.products} /> : <CatalogEmpty title="No matching products" message="Check the spelling or try a broader search." />}
          </section>
        ) : (
          <div className="mt-10"><CatalogError /></div>
        )}
      </main>
    </StoreShell>
  );
}
