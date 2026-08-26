import Link from "next/link";

import { StoreShell } from "@/components/layout/StoreShell";

export default function ProductNotFound() {
  return <StoreShell><main className="mx-auto grid min-h-[55dvh] max-w-[1400px] place-items-center px-5 py-16 text-center"><div><h1 className="font-serif text-5xl font-semibold">Product not found</h1><p className="mt-3 text-sm text-ink-muted">This item is unavailable or no longer published.</p><Link className="mt-7 inline-flex min-h-11 items-center bg-ink px-6 text-sm font-bold text-canvas" href="/shop">Browse the shop</Link></div></main></StoreShell>;
}
