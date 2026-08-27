"use client";

import { Mail } from "lucide-react";
import { useState, type FormEvent } from "react";

/**
 * Newsletter signup.
 *
 * NOT CONNECTED TO ANYTHING YET — AND IT SAYS SO
 * ----------------------------------------------
 * There is no mailing-list integration in this system: no endpoint, no provider, no consent
 * record. So this form validates the address and then tells the truth, which is that signup
 * is not live yet.
 *
 * It deliberately does NOT show "Thanks, you're subscribed!". A fake confirmation means a
 * customer believes they will hear about a restock and never does, and it also implies a
 * consent record exists where none does. A form that admits it is not wired up is a minor
 * disappointment; a form that lies is a broken promise plus a data-protection story.
 *
 * TO MAKE THIS REAL: post to a backend route that records the address and the consent
 * timestamp, then replace `status` handling with the response. The email must never be sent
 * to a third party directly from the browser.
 */
export function Newsletter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "invalid" | "unavailable">("idle");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = email.trim();
    // Same shape check the checkout form uses. Kept simple on purpose: the authority on a
    // deliverable address is the mail provider, not a regex.
    const looksLikeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed);
    setStatus(looksLikeEmail ? "unavailable" : "invalid");
  }

  return (
    <section aria-labelledby="newsletter-heading" className="shell section-y">
      <div className="grid items-center gap-6 rounded-[var(--radius-card)] bg-surface-blue p-6 sm:p-8 lg:grid-cols-[1fr_1fr] lg:gap-10 lg:p-10">
        <div className="flex items-start gap-4">
          <span className="hidden size-11 shrink-0 place-items-center rounded-[var(--radius-pill)] bg-surface sm:grid">
            <Mail aria-hidden="true" className="text-brand-ink" size={20} strokeWidth={1.8} />
          </span>
          <div>
            <h2 className="text-xl font-extrabold tracking-[-0.01em] sm:text-2xl" id="newsletter-heading">
              Get updates &amp; special deals
            </h2>
            <p className="mt-2 max-w-[52ch] text-sm leading-6 text-ink-muted">
              Be the first to know about new products, wholesale opportunities and special
              offers across every category.
            </p>
          </div>
        </div>

        <form className="w-full" noValidate onSubmit={handleSubmit}>
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="sr-only" htmlFor="newsletter-email">
              Email address
            </label>
            <input
              aria-describedby="newsletter-status"
              aria-invalid={status === "invalid"}
              autoComplete="email"
              className="min-h-12 w-full min-w-0 flex-1 rounded-[var(--radius-control)] border border-line bg-surface px-4 text-sm outline-none placeholder:text-ink-subtle focus:border-brand"
              id="newsletter-email"
              inputMode="email"
              name="email"
              onChange={(event) => {
                setEmail(event.target.value);
                if (status !== "idle") setStatus("idle");
              }}
              placeholder="Enter your email"
              type="email"
              value={email}
            />
            <button
              className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-control)] bg-brand px-6 text-sm font-bold whitespace-nowrap text-white transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 active:translate-y-px"
              type="submit"
            >
              Subscribe
            </button>
          </div>

          {/* aria-live so the message is announced, and role=status rather than alert
              because none of these are errors the shopper must act on. */}
          <p
            aria-live="polite"
            className="mt-3 min-h-5 text-xs leading-5 text-brand-ink"
            id="newsletter-status"
            role="status"
          >
            {status === "invalid" ? "Enter a valid email address." : null}
            {status === "unavailable"
              ? "Newsletter signup is not connected yet, so nothing was saved. Please check back soon."
              : null}
          </p>
        </form>
      </div>
    </section>
  );
}
