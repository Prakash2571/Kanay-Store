import { ProductGridSkeleton } from "@/components/commerce/ProductGridSkeleton";
import { StoreShell } from "@/components/layout/StoreShell";

export default function SearchLoading() {
  return <StoreShell><main className="shell px-5 py-10 sm:px-8 lg:px-12"><div className="h-14 w-52 animate-pulse bg-surface-strong" /><div className="my-8 h-12 max-w-2xl animate-pulse bg-surface-muted" /><ProductGridSkeleton /></main></StoreShell>;
}
