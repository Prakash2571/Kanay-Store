import { SearchX, ShoppingBag } from "lucide-react";
import Link from "next/link";

const ICON_STROKE = 1.6;

export function CatalogEmpty({
  title = "No products found",
  message = "Try a different search or remove one of the filters.",
}: {
  title?: string;
  message?: string;
}) {
  return (
    <div className="grid min-h-72 place-items-center border border-line bg-surface px-6 py-12 text-center">
      <div>
        <SearchX aria-hidden="true" className="mx-auto text-ink-muted" size={30} strokeWidth={ICON_STROKE} />
        <h2 className="mt-5 font-serif text-3xl font-semibold">{title}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-muted">{message}</p>
        <Link className="mt-6 inline-flex min-h-11 items-center justify-center bg-ink px-6 text-sm font-bold text-canvas transition-opacity hover:opacity-85 focus-visible:outline focus-visible:outline-2 active:translate-y-px" href="/shop">Browse all</Link>
      </div>
    </div>
  );
}

export function CatalogError() {
  return (
    <div className="grid min-h-72 place-items-center border border-line bg-surface px-6 py-12 text-center" role="status">
      <div>
        <ShoppingBag aria-hidden="true" className="mx-auto text-ink-muted" size={30} strokeWidth={ICON_STROKE} />
        <h2 className="mt-5 font-serif text-3xl font-semibold">The shop is taking a moment</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-muted">We could not load the latest catalog. Refresh the page or try again shortly.</p>
      </div>
    </div>
  );
}
