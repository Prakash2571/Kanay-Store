import type { Metadata } from "next";
import Link from "next/link";

import { CatalogControls } from "@/components/commerce/CatalogControls";
import { CatalogEmpty, CatalogError } from "@/components/commerce/CatalogState";
import { ProductGrid } from "@/components/commerce/ProductGrid";
import { StoreShell } from "@/components/layout/StoreShell";
import { getCatalog } from "@/lib/storefront/catalog";
import type { CatalogQuery, CatalogSort } from "@/lib/storefront/types";

export const metadata: Metadata = {
  title: "Shop",
  description: "Browse the current Kanay Store catalog in INR.",
  alternates: { canonical: "/shop" },
};

type SearchParams = Record<string, string | string[] | undefined>;

function single(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined;
}

function positivePaise(value: string | undefined) {
  if (!value || !/^\d+$/.test(value)) return undefined;
  const rupees = Number(value);
  const paise = rupees * 100;
  return Number.isSafeInteger(paise) ? paise : undefined;
}

function parseSort(value: string | undefined): CatalogSort {
  return value === "NEWEST" || value === "PRICE_ASC" || value === "PRICE_DESC" ? value : "FEATURED";
}

export default async function ShopPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const values = {
    collection: single(params.collection),
    productType: single(params.productType),
    availability: single(params.availability),
    minPrice: single(params.minPrice),
    maxPrice: single(params.maxPrice),
    sort: parseSort(single(params.sort)),
  };
  const query: CatalogQuery = {
    collection: values.collection,
    productType: values.productType,
    availability: values.availability === "SELLABLE" ? "SELLABLE" : undefined,
    minPricePaise: positivePaise(values.minPrice),
    maxPricePaise: positivePaise(values.maxPrice),
    sort: values.sort,
    first: 24,
    after: single(params.after),
  };
  const result = await getCatalog(query);
  const collections = result.ok ? result.data.filters.collections : [];

  return (
    <StoreShell collections={collections}>
      <main className="mx-auto max-w-[1400px] px-5 py-10 sm:px-8 lg:px-12 lg:py-14">
        <div className="max-w-2xl">
          <h1 className="font-serif text-5xl font-semibold tracking-[-0.035em] sm:text-6xl">Shop all</h1>
          <p className="mt-3 text-sm leading-6 text-ink-muted">Browse products currently approved for the Kanay Store catalog.</p>
        </div>
        {result.ok ? (
          <>
            <div id="collections">
              <CatalogControls action="/shop" catalog={result.data} values={values} />
            </div>
            <div className="py-8">
              {result.data.products.length ? <ProductGrid priorityCount={4} products={result.data.products} /> : <CatalogEmpty />}
            </div>
            {result.data.pageInfo.hasNextPage && result.data.pageInfo.endCursor ? (
              <NextPageLink basePath="/shop" cursor={result.data.pageInfo.endCursor} params={params} />
            ) : null}
          </>
        ) : (
          <div className="mt-8"><CatalogError /></div>
        )}
      </main>
    </StoreShell>
  );
}

function NextPageLink({ basePath, cursor, params }: { basePath: string; cursor: string; params: SearchParams }) {
  const next = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (key !== "after" && typeof value === "string") next.set(key, value);
  });
  next.set("after", cursor);
  return (
    <div className="flex justify-center">
      <Link className="inline-flex min-h-11 items-center justify-center border border-ink px-7 text-sm font-bold transition-colors hover:bg-ink hover:text-canvas focus-visible:outline focus-visible:outline-2 active:translate-y-px" href={`${basePath}?${next.toString()}`}>Load more</Link>
    </div>
  );
}
