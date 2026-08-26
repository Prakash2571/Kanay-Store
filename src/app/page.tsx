export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-[1400px] items-center px-5 py-16 sm:px-8 lg:px-12">
      <div className="max-w-2xl">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.14em] text-accent">
          Kanay Store
        </p>
        <h1 className="font-serif text-5xl font-semibold leading-[0.98] tracking-[-0.035em] sm:text-7xl">
          The storefront is taking shape.
        </h1>
        <p className="mt-6 max-w-[48ch] text-base leading-7 text-ink-muted">
          Product discovery, secure guest checkout and Shopify-backed order tracking are being built as one focused retail experience.
        </p>
      </div>
    </main>
  );
}
