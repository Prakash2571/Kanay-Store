import { ProductGridSkeleton } from "@/components/commerce/ProductGridSkeleton";
import { StoreShell } from "@/components/layout/StoreShell";

export default function ShopLoading() {
  return (
    <StoreShell>
      <main className="mx-auto max-w-[1400px] px-5 py-10 sm:px-8 lg:px-12 lg:py-14">
        <div className="h-14 w-52 animate-pulse bg-surface-strong" />
        <div className="my-8 h-24 animate-pulse border-y border-line bg-surface-muted" />
        <ProductGridSkeleton />
      </main>
    </StoreShell>
  );
}
