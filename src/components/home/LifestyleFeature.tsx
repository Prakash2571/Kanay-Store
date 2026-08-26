import Image from "next/image";
import Link from "next/link";

// Unsplash editorial photography. This is not used as product imagery.
const IMAGE = "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1800&q=82";

export function LifestyleFeature() {
  return (
    <section className="mx-auto grid max-w-[1400px] md:grid-cols-[1.2fr_0.8fr]" aria-labelledby="wardrobe-heading">
      <div className="relative min-h-[26rem] md:min-h-[36rem]">
        <Image alt="A considered edit of clothing on a retail rail" className="object-cover" fill sizes="(max-width: 767px) 100vw, 60vw" src={IMAGE} />
      </div>
      <div className="flex items-center bg-accent-soft px-6 py-12 text-accent-ink sm:px-10 lg:px-14">
        <div>
          <h2 className="max-w-[9ch] font-serif text-4xl font-semibold leading-[0.98] tracking-[-0.025em] sm:text-5xl" id="wardrobe-heading">A sharper everyday wardrobe.</h2>
          <p className="mt-5 max-w-[38ch] text-sm leading-6">Clean proportions, useful layers and accessories that finish the look without doing too much.</p>
          <Link className="mt-7 inline-flex min-h-11 items-center justify-center bg-accent-ink px-6 text-sm font-bold text-accent-soft transition-opacity hover:opacity-85 focus-visible:outline focus-visible:outline-2 active:translate-y-px" href="/shop?sort=NEWEST">See what is new</Link>
        </div>
      </div>
    </section>
  );
}
