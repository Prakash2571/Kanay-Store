import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CatalogEmpty, CatalogError } from "@/components/commerce/CatalogState";
import { ProductGrid } from "@/components/commerce/ProductGrid";
import { StoreShell } from "@/components/layout/StoreShell";
import { getCollection, getCollections } from "@/lib/storefront/collections";
import type { CatalogSort } from "@/lib/storefront/types";

function parseSort(value: string | string[] | undefined): CatalogSort {
  return value === "NEWEST" || value === "PRICE_ASC" || value === "PRICE_DESC" ? value : "FEATURED";
}

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const { handle } = await params;
  const result = await getCollection(handle, { first: 1 });
  if (!result.ok) return { title: "Collection" };
  const collection = result.data.collection;
  return {
    title: collection.seo?.title || collection.title,
    description: collection.seo?.description || collection.description || `Shop ${collection.title} at Kanay Store.`,
    alternates: { canonical: `/collections/${collection.handle}` },
    openGraph: collection.image ? { images: [{ url: collection.image.url, alt: collection.image.alt || collection.title }] } : undefined,
  };
}

export default async function CollectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ handle: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ handle }, query] = await Promise.all([params, searchParams]);
  const sort = parseSort(query.sort);
  const [result, collectionsResult] = await Promise.all([
    getCollection(handle, {
      first: 24,
      after: typeof query.after === "string" ? query.after : undefined,
      sort,
    }),
    getCollections(),
  ]);
  if (!result.ok && result.error.status === 404) notFound();
  const collections = collectionsResult.ok ? collectionsResult.data : [];

  return (
    <StoreShell collections={collections}>
      <main className="shell section-y">
        {result.ok ? (
          <>
            <div className="max-w-3xl">
              <nav aria-label="Breadcrumb" className="mb-5 text-xs text-ink-muted"><Link className="hover:text-ink" href="/shop">Shop</Link> / {result.data.collection.title}</nav>
              <h1 className="text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">{result.data.collection.title}</h1>
              {result.data.collection.description ? <p className="mt-4 max-w-[60ch] text-sm leading-6 text-ink-muted">{result.data.collection.description}</p> : null}
            </div>
            <form className="my-8 flex items-end justify-end border-y border-line py-4" method="get">
              <label className="grid w-full max-w-xs gap-2 text-xs font-bold text-ink-muted">Sort by
                <select className="min-h-11 border border-line bg-surface px-3 text-sm text-ink" defaultValue={sort} name="sort">
                  <option value="FEATURED">Featured</option>
                  <option value="NEWEST">Newest</option>
                  <option value="PRICE_ASC">Price low-high</option>
                  <option value="PRICE_DESC">Price high-low</option>
                </select>
              </label>
              <button className="ml-3 min-h-11 rounded-[var(--radius-control)] bg-brand-solid px-5 text-sm font-bold text-white" type="submit">Sort</button>
            </form>
            {result.data.products.length ? <ProductGrid priorityCount={4} products={result.data.products} /> : <CatalogEmpty title="This collection is empty" message="No approved products are available in this collection right now." />}
          </>
        ) : <CatalogError />}
      </main>
    </StoreShell>
  );
}
