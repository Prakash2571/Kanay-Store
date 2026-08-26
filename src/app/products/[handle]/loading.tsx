import { StoreShell } from "@/components/layout/StoreShell";

export default function ProductLoading() {
  return <StoreShell><main className="mx-auto max-w-[1400px] px-5 py-8 sm:px-8 lg:px-12"><div className="grid animate-pulse gap-9 lg:grid-cols-[1.15fr_0.85fr]"><div className="aspect-[4/5] bg-surface-strong" /><div className="py-8"><div className="h-5 w-24 bg-surface-strong" /><div className="mt-4 h-14 w-4/5 bg-surface-strong" /><div className="mt-6 h-6 w-36 bg-surface-strong" /><div className="mt-10 h-40 bg-surface-muted" /></div></div></main></StoreShell>;
}
