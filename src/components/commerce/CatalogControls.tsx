import type { CatalogSort, StorefrontCatalogData } from "@/lib/storefront/types";

export function CatalogControls({
  action,
  catalog,
  values,
  showCollection = true,
}: {
  action: string;
  catalog: StorefrontCatalogData;
  values: { q?: string; collection?: string; productType?: string; availability?: string; minPrice?: string; maxPrice?: string; sort?: CatalogSort };
  showCollection?: boolean;
}) {
  return (
    <form action={action} className="grid gap-4 border-y border-line py-5 sm:grid-cols-2 lg:grid-cols-6" method="get">
      {values.q ? <input name="q" type="hidden" value={values.q} /> : null}
      {showCollection ? (
        <Field label="Collection">
          <select className="min-h-11 w-full border border-line bg-surface px-3 text-sm" defaultValue={values.collection ?? ""} name="collection">
            <option value="">All collections</option>
            {catalog.filters.collections.map((collection) => <option key={collection.id} value={collection.handle}>{collection.title}</option>)}
          </select>
        </Field>
      ) : null}
      <Field label="Category">
        <select className="min-h-11 w-full border border-line bg-surface px-3 text-sm" defaultValue={values.productType ?? ""} name="productType">
          <option value="">All categories</option>
          {catalog.filters.productTypes.map((type) => <option key={type} value={type}>{type}</option>)}
        </select>
      </Field>
      <Field label="Minimum price">
        <input className="min-h-11 w-full border border-line bg-surface px-3 text-sm placeholder:text-ink-muted" defaultValue={values.minPrice} inputMode="numeric" min="0" name="minPrice" placeholder="₹" type="number" />
      </Field>
      <Field label="Maximum price">
        <input className="min-h-11 w-full border border-line bg-surface px-3 text-sm placeholder:text-ink-muted" defaultValue={values.maxPrice} inputMode="numeric" min="0" name="maxPrice" placeholder="₹" type="number" />
      </Field>
      <Field label="Sort by">
        <select className="min-h-11 w-full border border-line bg-surface px-3 text-sm" defaultValue={values.sort ?? "FEATURED"} name="sort">
          <option value="FEATURED">Featured</option>
          <option value="NEWEST">Newest</option>
          <option value="PRICE_ASC">Price low-high</option>
          <option value="PRICE_DESC">Price high-low</option>
        </select>
      </Field>
      <div className="flex items-end">
        <button className="min-h-11 w-full bg-ink px-5 text-sm font-bold text-canvas transition-opacity hover:opacity-85 focus-visible:outline focus-visible:outline-2 active:translate-y-px" type="submit">Apply filters</button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-2 text-xs font-bold text-ink-muted"><span>{label}</span>{children}</label>;
}
