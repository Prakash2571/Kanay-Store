import { ProductGridSkeleton } from "@/components/commerce/ProductGridSkeleton";
import { StoreShell } from "@/components/layout/StoreShell";

export default function CollectionLoading() {
  return <StoreShell><main className="shell px-5 py-10 sm:px-8 lg:px-12"><div className="mb-10 h-14 w-64 animate-pulse bg-surface-strong" /><ProductGridSkeleton /></main></StoreShell>;
}
