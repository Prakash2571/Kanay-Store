"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { MAX_CART_QUANTITY, minimumQuantityFor, type CartLine } from "@/lib/cart";
import { formatPaise } from "@/lib/storefront/money";

import { useCart } from "./CartProvider";

/**
 * One cart line.
 *
 * THE STEPPER RESPECTS THE WHOLESALE MINIMUM
 * ------------------------------------------
 * On a `moq:12` product the minus button stops at 12 and is disabled there, with the reason
 * stated next to it. Previously it stepped down to 1, and the customer discovered the problem
 * when the checkout refused the entire order — after entering an address.
 *
 * The remove button is the way out. A minimum governs how FEW of an item may be ordered, not
 * whether it may be taken out of the cart, so removal is never blocked (the reducer treats
 * quantity 0 as removal for the same reason).
 */
export function CartItem({ item }: { item: CartLine }) {
  const { removeItem, setQuantity } = useCart();

  return (
    <article className="grid grid-cols-[92px_1fr] gap-4 border-b border-line py-5 sm:grid-cols-[120px_1fr_auto]">
      <Link
        href={`/products/${item.handle}`}
        className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-card)] bg-surface-muted"
      >
        {item.image ? (
          <Image
            src={item.image.url}
            alt={item.image.alt || item.title}
            fill
            sizes="120px"
            className="object-cover"
          />
        ) : (
          <span className="flex h-full items-center justify-center px-2 text-center text-xs text-ink-muted">
            Image unavailable
          </span>
        )}
      </Link>

      <div className="min-w-0">
        <Link href={`/products/${item.handle}`} className="font-semibold hover:underline">
          {item.title}
        </Link>
        {item.selectedOptions.length > 0 && (
          <p className="mt-1 text-sm text-ink-muted">
            {item.selectedOptions.map((option) => option.value).join(" / ")}
          </p>
        )}
        <p className="mt-3 text-sm font-semibold">
          {formatPaise(item.unitPricePaise)}
          <span className="ml-1 font-normal text-ink-subtle">/ unit</span>
        </p>
        <MinimumNote item={item} />

        <div className="mt-4 flex items-center gap-2 sm:hidden">
          <QuantityControls item={item} setQuantity={setQuantity} />
          <RemoveButton onRemove={() => removeItem(item.shopifyVariantId)} />
        </div>
      </div>

      <div className="hidden min-w-36 flex-col items-end justify-between sm:flex">
        <p className="font-semibold">{formatPaise(item.unitPricePaise * item.quantity)}</p>
        <div className="flex items-center gap-2">
          <QuantityControls item={item} setQuantity={setQuantity} />
          <RemoveButton onRemove={() => removeItem(item.shopifyVariantId)} />
        </div>
      </div>
    </article>
  );
}

/** Teal MOQ note, shown only on lines that carry a real minimum. */
function MinimumNote({ item }: { item: CartLine }) {
  const minimum = minimumQuantityFor(item);
  if (minimum <= 1) return null;

  return (
    <p className="mt-2 inline-flex items-center rounded-[var(--radius-pill)] bg-surface-teal px-2.5 py-1 text-[0.7rem] font-bold text-accent-ink">
      Wholesale · minimum {minimum} units
    </p>
  );
}

function QuantityControls({
  item,
  setQuantity,
}: {
  item: CartLine;
  setQuantity: (variantId: string, quantity: number) => void;
}) {
  const minimum = minimumQuantityFor(item);
  const atMinimum = item.quantity <= minimum;

  return (
    <div className="flex min-h-10 items-center rounded-[var(--radius-control)] border border-line bg-surface">
      <button
        type="button"
        aria-label={
          atMinimum && minimum > 1
            ? `${item.title} is already at its minimum order quantity of ${minimum}`
            : `Decrease quantity of ${item.title}`
        }
        // Disabled AT the minimum rather than clamping silently: a button that appears to
        // work and then does nothing reads as a broken page. The reducer clamps as well, so
        // this is presentation, not enforcement.
        disabled={atMinimum && minimum > 1}
        onClick={() => setQuantity(item.shopifyVariantId, item.quantity - 1)}
        className="grid min-h-10 min-w-10 place-items-center transition-colors hover:bg-surface-muted disabled:opacity-35"
      >
        <Minus aria-hidden="true" size={16} strokeWidth={1.75} />
      </button>
      <span className="min-w-8 text-center text-sm font-semibold tabular-nums" aria-live="polite">
        {item.quantity}
      </span>
      <button
        type="button"
        aria-label={`Increase quantity of ${item.title}`}
        disabled={item.quantity >= MAX_CART_QUANTITY}
        onClick={() => setQuantity(item.shopifyVariantId, item.quantity + 1)}
        className="grid min-h-10 min-w-10 place-items-center transition-colors hover:bg-surface-muted disabled:opacity-35"
      >
        <Plus aria-hidden="true" size={16} strokeWidth={1.75} />
      </button>
    </div>
  );
}

function RemoveButton({ onRemove }: { onRemove: () => void }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="grid min-h-10 min-w-10 place-items-center rounded-[var(--radius-control)] text-ink-muted transition-colors hover:bg-surface-muted hover:text-danger"
      aria-label="Remove item"
    >
      <Trash2 aria-hidden="true" size={17} strokeWidth={1.75} />
    </button>
  );
}
