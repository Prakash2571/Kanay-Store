import { SearchX, ShoppingBag } from "lucide-react";
import Link from "next/link";

const ICON_STROKE = 1.6;

export function CatalogEmpty({
  title = "No products found",
  message = "Try a different search, or remove one of the filters.",
}: {
  title?: string;
  message?: string;
}) {
  return (
    <div className="grid min-h-64 place-items-center rounded-[var(--radius-card)] border border-line bg-surface px-6 py-12 text-center">
      <div>
        <span className="mx-auto grid size-12 place-items-center rounded-[var(--radius-pill)] bg-surface-blue">
          <SearchX aria-hidden="true" className="text-brand-ink" size={24} strokeWidth={ICON_STROKE} />
        </span>
        <h2 className="mt-4 text-xl font-extrabold">{title}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-muted">{message}</p>
        <Link
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-[var(--radius-control)] bg-brand px-6 text-sm font-bold text-white transition-colors hover:bg-brand-hover focus-visible:outline focus-visible:outline-2 active:translate-y-px"
          href="/shop"
        >
          Browse all products
        </Link>
      </div>
    </div>
  );
}

export function CatalogError() {
  return (
    <div
      className="grid min-h-64 place-items-center rounded-[var(--radius-card)] border border-line bg-surface px-6 py-12 text-center"
      role="status"
    >
      <div>
        <span className="mx-auto grid size-12 place-items-center rounded-[var(--radius-pill)] bg-surface-blue">
          <ShoppingBag aria-hidden="true" className="text-brand-ink" size={24} strokeWidth={ICON_STROKE} />
        </span>
        <h2 className="mt-4 text-xl font-extrabold">The shop is taking a moment</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-muted">
          We could not load the latest products. Refresh the page or try again shortly.
        </p>
      </div>
    </div>
  );
}
