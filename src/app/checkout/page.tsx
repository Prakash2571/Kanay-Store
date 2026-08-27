import type { Metadata } from "next";

import { CheckoutForm } from "@/components/checkout/CheckoutForm";

export const metadata: Metadata = {
  title: "Secure checkout",
  description: "Complete your Kanay Store purchase with secure Razorpay Checkout.",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <main className="mx-auto min-h-[75dvh] max-w-[1240px] px-5 py-10 sm:px-8 lg:px-12 lg:py-14">
      <header className="mb-9 border-b border-line pb-6">
        <p className="text-sm font-semibold text-accent">Guest checkout</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
          Delivery and payment
        </h1>
        <p className="mt-2 max-w-[55ch] text-sm leading-6 text-ink-muted">
          No account is required. We use these details only to prepare and deliver this order.
        </p>
      </header>
      <CheckoutForm />
    </main>
  );
}
