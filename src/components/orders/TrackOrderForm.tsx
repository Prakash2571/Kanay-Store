"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { parseTrackingToken } from "@/lib/storefront/orders";

export function TrackOrderForm() {
  const router = useRouter();
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const token = parseTrackingToken(String(data.get("tracking") ?? ""));
    if (!token) {
      setError("Enter the secure tracking link or token from your order confirmation.");
      return;
    }
    router.push(`/track/${encodeURIComponent(token)}`);
  }

  function resumeRecentCheckout() {
    try {
      const parsed = JSON.parse(localStorage.getItem("kanay-last-checkout") ?? "null") as {
        id?: string;
        token?: string;
      } | null;
      if (!parsed?.id || !parsed.token) {
        setError("No recent checkout was found on this device.");
        return;
      }
      const params = new URLSearchParams({ session: parsed.id, token: parsed.token });
      router.push(`/order/success?${params.toString()}`);
    } catch {
      setError("No recent checkout was found on this device.");
    }
  }

  return (
    <div className="grid gap-5">
      <form onSubmit={submit} noValidate>
        <label htmlFor="tracking" className="text-sm font-semibold">
          Secure tracking link or token
        </label>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <input
            id="tracking"
            name="tracking"
            autoComplete="off"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "tracking-error" : "tracking-help"}
            className="min-h-12 min-w-0 flex-1 rounded-[var(--radius-control)] border border-line bg-surface px-4 text-base focus:border-focus focus:outline-2"
            placeholder="Paste your secure order link"
          />
          <button
            type="submit"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-ink px-6 font-semibold whitespace-nowrap text-canvas transition-transform active:scale-[0.98]"
          >
            <Search aria-hidden="true" size={17} strokeWidth={1.75} />
            View order
          </button>
        </div>
        <p id="tracking-help" className="mt-2 text-xs leading-5 text-ink-muted">
          Order numbers alone cannot be used to view customer information.
        </p>
        {error && (
          <p id="tracking-error" role="alert" className="mt-3 text-sm font-medium text-danger">
            {error}
          </p>
        )}
      </form>
      <div className="border-t border-line pt-5">
        <button
          type="button"
          onClick={resumeRecentCheckout}
          className="min-h-11 rounded-[var(--radius-control)] border border-ink px-5 text-sm font-semibold transition-[transform,background-color,color] active:scale-[0.98] hover:bg-ink hover:text-canvas"
        >
          Resume checkout from this device
        </button>
      </div>
    </div>
  );
}
