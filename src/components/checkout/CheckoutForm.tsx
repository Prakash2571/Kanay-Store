"use client";

import { CreditCard, LockKeyhole } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";

import { useCart } from "@/components/cart/CartProvider";
import { formatPaise } from "@/lib/storefront/money";
import {
  createCheckoutSession,
  guestCheckoutSchema,
  verifyRazorpayPayment,
  type CheckoutSessionResponse,
  type GuestCheckoutValues,
} from "@/lib/storefront/checkout";

type FormErrors = Partial<Record<keyof GuestCheckoutValues | "form", string>>;

type RazorpaySuccess = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayFailure = {
  error?: { description?: string };
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: "INR";
  name: string;
  description: string;
  order_id: string;
  prefill: { name: string; email: string; contact: string };
  theme: { color: string };
  modal: { ondismiss: () => void; confirm_close: boolean };
  handler: (response: RazorpaySuccess) => void;
};

type RazorpayInstance = {
  open: () => void;
  on: (event: "payment.failed", handler: (response: RazorpayFailure) => void) => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

const fieldClass =
  "min-h-12 w-full rounded-[var(--radius-control)] border border-line bg-surface px-4 text-base text-ink placeholder:text-ink-muted/70 focus:border-focus focus:outline-2";

function valuesFromForm(form: HTMLFormElement): Record<string, string> {
  const data = new FormData(form);
  return Object.fromEntries(Array.from(data.entries()).map(([key, value]) => [key, String(value)]));
}

function newIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

async function loadRazorpay(): Promise<boolean> {
  if (window.Razorpay) return true;
  const existing = document.querySelector<HTMLScriptElement>("script[data-kanay-razorpay]");
  if (existing) {
    return new Promise((resolve) => {
      existing.addEventListener("load", () => resolve(Boolean(window.Razorpay)), { once: true });
      existing.addEventListener("error", () => resolve(false), { once: true });
    });
  }

  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.dataset.kanayRazorpay = "true";
    script.onload = () => resolve(Boolean(window.Razorpay));
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

export function CheckoutForm() {
  const router = useRouter();
  const { hydrated, items, subtotalPaise, clearCart } = useCart();
  const idempotencyKey = useRef<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [busy, setBusy] = useState(false);
  const [approvedSummary, setApprovedSummary] = useState<CheckoutSessionResponse["summary"] | null>(
    null,
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || items.length === 0) return;
    setErrors({});

    const parsed = guestCheckoutSchema.safeParse(valuesFromForm(event.currentTarget));
    if (!parsed.success) {
      const next: FormErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof GuestCheckoutValues;
        if (key && !next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }

    setBusy(true);
    idempotencyKey.current ??= newIdempotencyKey();
    const created = await createCheckoutSession(items, parsed.data, idempotencyKey.current);
    if (!created.ok) {
      setErrors({ form: created.error.message });
      setBusy(false);
      return;
    }
    setApprovedSummary(created.data.summary);
    localStorage.setItem(
      "kanay-last-checkout",
      JSON.stringify({ id: created.data.checkoutSessionId, token: created.data.statusToken }),
    );

    const loaded = await loadRazorpay();
    if (!loaded || !window.Razorpay) {
      setErrors({ form: "Secure payment could not be opened. Please try again." });
      setBusy(false);
      return;
    }

    const instance = new window.Razorpay({
      key: created.data.keyId,
      amount: created.data.amountPaise,
      currency: "INR",
      name: process.env.NEXT_PUBLIC_STORE_NAME ?? "Kanay Store",
      description: "Kanay Store order",
      order_id: created.data.razorpayOrderId,
      prefill: {
        name: parsed.data.fullName,
        email: parsed.data.email,
        contact: parsed.data.phone,
      },
      theme: { color: "#d77858" },
      modal: {
        confirm_close: true,
        ondismiss: () => {
          setErrors({
            form: "Payment was not completed. You can try again when you are ready.",
          });
          setBusy(false);
        },
      },
      handler: async (response) => {
        const verified = await verifyRazorpayPayment({
          checkoutSessionId: created.data.checkoutSessionId,
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
        });
        if (!verified.ok) {
          setErrors({ form: verified.error.message });
          setBusy(false);
          return;
        }

        clearCart();
        const params = new URLSearchParams({
          session: created.data.checkoutSessionId,
          token: created.data.statusToken,
        });
        if (verified.data.trackingToken) params.set("tracking", verified.data.trackingToken);
        router.push(`/order/success?${params.toString()}`);
      },
    });

    instance.on("payment.failed", () => {
      setErrors({
        form: "Payment was not completed. You were not charged if Razorpay shows the payment as failed.",
      });
      setBusy(false);
    });
    instance.open();
  }

  if (!hydrated) {
    return <div className="h-96 animate-pulse rounded-[var(--radius-card)] bg-surface-muted" />;
  }

  if (items.length === 0) {
    return (
      <section className="rounded-[var(--radius-card)] bg-surface-muted p-8 text-center">
        <h2 className="font-serif text-4xl font-semibold">Your cart is empty.</h2>
        <p className="mt-3 text-sm text-ink-muted">Choose an available product before checkout.</p>
        <Link
          href="/shop"
          className="mt-6 inline-flex min-h-12 items-center rounded-[var(--radius-control)] bg-ink px-6 font-semibold text-canvas"
        >
          Go to shop
        </Link>
      </section>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div>
        <section aria-labelledby="contact-heading">
          <h2 id="contact-heading" className="font-serif text-3xl font-semibold">
            Contact
          </h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <Field label="Full name" name="fullName" error={errors.fullName} autoComplete="name" />
            <Field
              label="Email"
              name="email"
              error={errors.email}
              type="email"
              autoComplete="email"
            />
            <Field
              label="Phone"
              name="phone"
              error={errors.phone}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="98765 43210"
            />
          </div>
        </section>

        <section aria-labelledby="shipping-heading" className="mt-10 border-t border-line pt-8">
          <h2 id="shipping-heading" className="font-serif text-3xl font-semibold">
            Shipping address
          </h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field
                label="Address line 1"
                name="line1"
                error={errors.line1}
                autoComplete="address-line1"
              />
            </div>
            <div className="sm:col-span-2">
              <Field
                label="Address line 2 (optional)"
                name="line2"
                error={errors.line2}
                autoComplete="address-line2"
              />
            </div>
            <Field label="City" name="city" error={errors.city} autoComplete="address-level2" />
            <Field label="State" name="state" error={errors.state} autoComplete="address-level1" />
            <Field
              label="PIN code"
              name="postalCode"
              error={errors.postalCode}
              inputMode="numeric"
              autoComplete="postal-code"
            />
            <label className="grid content-start gap-2 text-sm font-semibold">
              Country
              <select name="countryCode" defaultValue="IN" className={fieldClass}>
                <option value="IN">India</option>
              </select>
            </label>
          </div>
        </section>
      </div>

      <aside className="h-fit rounded-[var(--radius-card)] bg-surface-muted p-5 sm:p-6 lg:sticky lg:top-28">
        <h2 className="font-serif text-3xl font-semibold">Review</h2>
        <div className="mt-5 space-y-4">
          {items.map((item) => (
            <div key={item.shopifyVariantId} className="flex justify-between gap-4 text-sm">
              <div>
                <p className="font-semibold">{item.title}</p>
                <p className="mt-1 text-xs text-ink-muted">
                  {item.variantTitle} × {item.quantity}
                </p>
              </div>
              <p className="font-semibold">{formatPaise(item.unitPricePaise * item.quantity)}</p>
            </div>
          ))}
        </div>
        <dl className="mt-6 border-t border-line pt-5 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-ink-muted">Cart subtotal</dt>
            <dd className="font-semibold">{formatPaise(subtotalPaise)}</dd>
          </div>
          <p className="mt-3 text-xs leading-5 text-ink-muted">
            The backend verifies every item, price and shipping charge before Razorpay opens.
          </p>
          {approvedSummary && (
            <div className="mt-4 flex justify-between gap-4 border-t border-line pt-4">
              <dt className="font-semibold">Approved total</dt>
              <dd className="font-semibold">{formatPaise(approvedSummary.totalPaise)}</dd>
            </div>
          )}
        </dl>

        {errors.form && (
          <p role="alert" className="mt-5 rounded-[var(--radius-control)] bg-accent-soft px-4 py-3 text-sm text-accent-ink">
            {errors.form}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-control)] bg-ink px-5 font-semibold whitespace-nowrap text-canvas transition-transform active:scale-[0.98] disabled:cursor-wait disabled:opacity-60"
        >
          <CreditCard aria-hidden="true" size={18} strokeWidth={1.75} />
          {busy ? "Preparing secure payment" : "Pay securely"}
        </button>
        <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-ink-muted">
          <LockKeyhole aria-hidden="true" size={15} strokeWidth={1.75} className="mt-0.5 shrink-0" />
          Card and UPI details are entered only in Razorpay Checkout. Kanay Store does not store card data.
        </p>
      </aside>
    </form>
  );
}

type FieldProps = {
  label: string;
  name: keyof GuestCheckoutValues;
  error?: string;
  type?: "text" | "email" | "tel";
  inputMode?: "text" | "email" | "tel" | "numeric";
  autoComplete?: string;
  placeholder?: string;
};

function Field({
  label,
  name,
  error,
  type = "text",
  inputMode,
  autoComplete,
  placeholder,
}: FieldProps) {
  const errorId = `${name}-error`;
  return (
    <label className="grid content-start gap-2 text-sm font-semibold">
      {label}
      <input
        name={name}
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={fieldClass}
      />
      {error && (
        <span id={errorId} role="alert" className="text-xs font-medium text-danger">
          {error}
        </span>
      )}
    </label>
  );
}
