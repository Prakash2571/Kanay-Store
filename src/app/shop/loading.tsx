import { ProductGridSkeleton } from "@/components/commerce/ProductGridSkeleton";
import { StoreShell } from "@/components/layout/StoreShell";

export default function ShopLoading() {
  return (
    <StoreShell>
      <main className="shell section-y">
        <div className="h-14 w-52 animate-pulse bg-surface-strong" />
        <div className="my-8 h-24 animate-pulse border-y border-line bg-surface-muted" />
        <ProductGridSkeleton />
      </main>
    </StoreShell>
  );
}
