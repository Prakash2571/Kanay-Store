import { ArrowRight, BadgeCheck, Boxes, Truck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { brandStoryMedia } from "@/lib/storefront/categoryMedia";

/**
 * The full-width brand story / trust banner.
 *
 * WHAT IT IS FOR
 * --------------
 * The homepage is a run of light sections and product grids, and by the fourth row they stop
 * registering as separate things. This is one branded moment that breaks that rhythm and says
 * what Kanay is for — sourcing confidence, practical minimums, dependable fulfilment — rather
 * than selling a specific product.
 *
 * WHY THE IMAGE IS CARTONS AND NOT A PERSON
 * -----------------------------------------
 * A person as the focus is what turns a trust banner into a lifestyle campaign, which is the
 * failure mode this section has to avoid. Stacked shipping cartons is the most legible shorthand
 * for "a real wholesale operation that dispatches orders", and it reads correctly at a glance and
 * at any crop.
 *
 * THE OVERLAY IS SLATE-NAVY, NOT BLACK, AT 52%
 * -------------------------------------------
 * Black flattens a photograph into a grey smear, which defeats the point of having one. Navy at
 * roughly half strength keeps the cartons legible as cartons while holding white text well clear
 * of AA. There is a second, stronger gradient on the content side only — a flat overlay heavy
 * enough for text everywhere makes the whole image muddy, whereas a directional one keeps the
 * far side of the photograph bright.
 *
 * IT DEGRADES INTO A DESIGNED STATE
 * ---------------------------------
 * The navy gradient is painted by the container, not by the image, so the banner is a deep navy
 * panel with readable white text even if the photograph fails to load. No layout shift, no broken
 * image icon, no unreadable text — which matters because the image URL could not be verified from
 * the environment this was built in.
 *
 * NOT FULL-BLEED
 * --------------
 * It sits inside `shell` with the same card radius as every other block. Genuinely edge-to-edge
 * would be wider than the header, the footer and every product row, and would read as an embedded
 * advert rather than part of the page. "Expansive" here comes from height and from the image, not
 * from breaking the grid.
 */
export function BrandStory() {
  /**
   * Optional. Drop `public/brand-story.jpg` in and it becomes the background; without it the
   * section is the navy panel it already renders underneath, which is why there is no placeholder
   * and no broken-image state to design around.
   */
  const image = brandStoryMedia();

  return (
    <section aria-labelledby="brand-story-heading" className="shell section-y">
      <div className="relative isolate overflow-hidden rounded-[var(--radius-card)] bg-[#0f172a]">
        {image ? (
          <Image
            alt={image.alt}
            className="absolute inset-0 -z-10 object-cover"
            fill
            sizes="(max-width: 1023px) 100vw, 1680px"
            src={image.url}
          />
        ) : null}

        {/* Flat base overlay: readability floor across the whole image. */}
        <span
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[var(--overlay)]"
        />
        {/*
          Directional overlay, content side only. Left-weighted on desktop so the copy sits on the
          darkest part and the right of the photograph stays bright; top-to-bottom on mobile, where
          the content stacks over the middle of the crop.
        */}
        <span
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-gradient-to-b from-[var(--overlay-strong)] via-transparent to-[var(--overlay-strong)] lg:bg-gradient-to-r lg:from-[var(--overlay-strong)] lg:via-[var(--overlay)] lg:to-transparent"
        />

        <div className="flex min-h-[21rem] flex-col justify-center px-6 py-14 sm:min-h-[24rem] sm:px-10 sm:py-16 lg:min-h-[27rem] lg:px-14 lg:py-18 2xl:px-16">
          <div className="max-w-[34rem] lg:max-w-[42rem]">
            {/* Orange eyebrow — the small warm accent that ties this to the rest of the page. */}
            <p className="flex items-center gap-2 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-[#ffb185]">
              <Boxes aria-hidden="true" size={15} strokeWidth={2} />
              Wholesale sourcing
            </p>

            <h2
              className="display-2 mt-4 font-extrabold text-balance text-white"
              id="brand-story-heading"
            >
              Built for better bulk buying
            </h2>

            <p className="lead mt-4 max-w-[54ch] text-white/85">
              Kanay helps businesses source products across categories with practical minimum order
              quantities, reliable fulfilment support, and a marketplace designed for smarter
              wholesale buying.
            </p>

            {/*
              Three short proof points rather than a second paragraph. Each one is something the
              system genuinely does: minimums are enforced at checkout, the catalog is the same one
              retail buys from, and delivery is quoted before payment. No numbers, because none of
              these would survive being quantified from a frontend.
            */}
            <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-3">
              {[
                { icon: Boxes, text: "Minimums shown up front" },
                { icon: BadgeCheck, text: "One approved catalog" },
                { icon: Truck, text: "Delivery across India" },
              ].map(({ icon: Icon, text }) => (
                <li className="flex items-center gap-2 text-xs font-semibold text-white/90" key={text}>
                  <Icon aria-hidden="true" className="text-[#7db3ff]" size={15} strokeWidth={2} />
                  {text}
                </li>
              ))}
            </ul>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-accent px-8 text-sm font-bold text-ink transition-colors hover:bg-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white active:translate-y-px"
                href="/shop"
              >
                Explore wholesale
                <ArrowRight aria-hidden="true" size={17} strokeWidth={2} />
              </Link>
              <Link
                className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-control)] border border-white/35 px-8 text-sm font-bold text-white transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white active:translate-y-px"
                href="/#categories"
              >
                Browse categories
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
