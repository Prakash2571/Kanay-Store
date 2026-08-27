import Link from "next/link";

import { StoreShell } from "@/components/layout/StoreShell";

export default function ProductNotFound() {
  return <StoreShell><main className="shell grid min-h-[55dvh] place-items-center py-16 text-center"><div><h1 className="text-2xl font-semibold">Product not found</h1><p className="mt-3 text-sm text-ink-muted">This item is unavailable or no longer published.</p><Link className="mt-7 inline-flex min-h-11 items-center rounded-[var(--radius-control)] bg-brand px-6 text-sm font-bold text-white transition-colors hover:bg-brand-hover" href="/shop">Browse the shop</Link></div></main></StoreShell>;
}
