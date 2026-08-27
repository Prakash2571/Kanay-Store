import Link from "next/link";

/**
 * The brand statement band.
 *
 * WHY IT IS LIGHT NOW
 * -------------------
 * It was a full-bleed deep-navy block. That gave the page a spine, and it also put the single
 * heaviest element on a page whose whole point is to read as bright and white — the balance this
 * palette targets is roughly two thirds white, and one navy band the width of the content column
 * spent a disproportionate share of the page's visual weight on a sentence.
 *
 * It is now a very light orange panel with a hairline border. It still separates the sections
 * around it, because it is the only warm surface on the page, and the separation now comes from
 * hue rather than from darkness.
 *
 * IT IS A POSITIONING STATEMENT, NOT A TESTIMONIAL
 * -----------------------------------------------
 * Nobody is quoted, no name is attached, no stars appear. It reads as the store's own voice
 * because it is — which is the honest version of this section on a store with no review
 * backend. The quote glyph is decorative and aria-hidden; the sentence is a heading, not a
 * blockquote, because there is no source to attribute it to and `<blockquote>` implies one.
 */
export function BrandQuote() {
  return (
    <section aria-labelledby="brand-quote-heading" className="shell section-y">
      <div className="relative overflow-hidden rounded-[var(--radius-card)] border border-line bg-quote-bg px-6 py-12 text-center sm:px-10 sm:py-14 lg:py-18">
        {/*
          The one large orange mark on the page. Decorative, so it is aria-hidden and the
          sentence below reads on its own.
        */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-2 -translate-x-1/2 select-none font-serif text-[7rem] leading-[1] text-accent/20 sm:text-[9.5rem]"
        >
          &ldquo;
        </span>

        <div className="relative mx-auto max-w-3xl 2xl:max-w-4xl">
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-accent-ink">
            Why buyers use Kanay
          </p>
          <p
            className="display-2 mt-5 max-w-[30ch] mx-auto font-extrabold text-balance"
            id="brand-quote-heading"
          >
            Buy smarter. Buy together. Grow further.
          </p>
          <span aria-hidden="true" className="mx-auto mt-6 block h-0.5 w-14 rounded-full bg-accent" />
          <p className="lead mx-auto mt-6 max-w-[62ch] text-ink-muted">
            Volume is what turns a fair price into a good one. Kanay puts wholesale minimums,
            retail quantities and one approved catalog behind a single checkout, so a shop owner
            ordering fifty units and a household ordering one are buying from the same verified
            stock.
          </p>

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-control)] bg-accent px-8 text-sm font-bold text-ink transition-colors hover:bg-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 active:translate-y-px"
              href="/shop"
            >
              Browse wholesale
            </Link>
            <Link
              className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-control)] border border-line-strong bg-surface px-8 text-sm font-bold text-ink transition-colors hover:border-brand hover:text-brand-ink focus-visible:outline focus-visible:outline-2 active:translate-y-px"
              href="/about#wholesale"
            >
              How wholesale works
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
