import Link from "next/link";

/**
 * The deep-navy brand statement band.
 *
 * WHY A DARK BAND HERE
 * --------------------
 * The homepage is otherwise a run of light cards on a cool grey page, and by the time a
 * visitor has scrolled past four product rows the sections stop registering as separate.
 * One full-width dark band gives the page a spine and a place to say what Kanay is for,
 * without a photograph and without a claim that needs backing up.
 *
 * It is a POSITIONING statement, not a testimonial. Nobody is quoted, no name is attached,
 * no five stars appear. It reads as the store's own voice because it is, which is the
 * honest version of this section on a store with no review backend.
 *
 * The navy is `--brand-dark` (#163a70), the one place in this design where the brand's
 * darkest value gets real surface area. Teal is the accent on the rule and the eyebrow, which
 * is exactly the secondary role teal has everywhere else in the system.
 *
 * THE TEAL HERE IS `--accent-bright`, NOT `--accent`
 * -------------------------------------------------
 * `--accent` (#0f766e) is tuned for text on light surfaces and lands at roughly 1.5:1 against
 * this navy — invisible. `--accent-bright` is the same hue taken light enough to read on a dark
 * fill. That is the whole reason the two tokens exist separately.
 */
export function BrandQuote() {
  return (
    <section aria-labelledby="brand-quote-heading" className="shell section-y">
      <div className="relative overflow-hidden rounded-[var(--radius-card)] bg-brand-dark px-6 py-12 text-center sm:px-10 sm:py-16 lg:py-20">
        {/*
          Two soft radial washes, drawn with the accent and brand colours at low alpha.
          Decorative and aria-hidden - they add depth without importing an image, which
          matters on a band that sits mid-scroll and must not cost a network request.
        */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 -top-24 size-64 rounded-full bg-accent-bright/20 blur-3xl"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-28 -right-20 size-72 rounded-full bg-brand/25 blur-3xl"
        />

        <div className="relative mx-auto max-w-3xl">
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-accent-soft">
            Why buyers use Kanay
          </p>
          <p
            className="mt-5 text-[1.6rem] font-extrabold leading-[1.2] tracking-[-0.02em] text-white sm:text-[2.1rem] lg:text-[2.4rem]"
            id="brand-quote-heading"
          >
            Buy smarter. Buy together. Grow further.
          </p>
          <span
            aria-hidden="true"
            className="mx-auto mt-7 block h-0.5 w-16 rounded-full bg-accent-bright"
          />
          <p className="mx-auto mt-7 max-w-[58ch] text-sm leading-6 text-white/80 sm:text-base sm:leading-7">
            Volume is what turns a fair price into a good one. Kanay puts wholesale minimums,
            retail quantities and the same approved catalog behind one checkout, so a shop
            owner ordering fifty units and a household ordering one are buying from the same
            verified stock.
          </p>

          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link
              className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-control)] bg-white px-6 text-sm font-bold text-brand-dark transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white active:translate-y-px"
              href="/shop"
            >
              Browse wholesale
            </Link>
            <Link
              className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-control)] border border-white/35 px-6 text-sm font-bold text-white transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white active:translate-y-px"
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
