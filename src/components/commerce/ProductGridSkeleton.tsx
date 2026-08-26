export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div aria-label="Loading products" className="grid grid-cols-2 gap-x-3 gap-y-9 sm:gap-x-5 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-6" role="status">
      {Array.from({ length: count }, (_, index) => (
        <div className="animate-pulse" key={index}>
          <div className="aspect-[4/5] bg-surface-strong" />
          <div className="mt-4 h-3 w-1/3 bg-surface-strong" />
          <div className="mt-2 h-4 w-4/5 bg-surface-strong" />
          <div className="mt-2 h-4 w-2/5 bg-surface-strong" />
        </div>
      ))}
    </div>
  );
}
