"use client";

import { Info } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { MAX_CART_QUANTITY } from "@/lib/cart";
import { minimumOrderValueLabel, startingQuantity } from "@/lib/storefront/moq";
import { formatMoney, formatPaise, moneyToPaise } from "@/lib/storefront/money";
import type {
  SelectedOption,
  StorefrontProduct,
  StorefrontVariant,
} from "@/lib/storefront/types";

import { AddToCartButton } from "./AddToCartButton";
import { useCart } from "./CartProvider";

function optionMap(options: SelectedOption[]): Record<string, string> {
  return Object.fromEntries(options.map((option) => [option.name, option.value]));
}

function variantMatches(variant: StorefrontVariant, selection: Record<string, string>): boolean {
  const values = optionMap(variant.selectedOptions);
  return Object.entries(selection).every(([name, value]) => values[name] === value);
}

function initialSelection(product: StorefrontProduct): Record<string, string> {
  const preferred =
    product.variants.find((variant) => variant.availability === "SELLABLE") ?? product.variants[0];
  return preferred ? optionMap(preferred.selectedOptions) : {};
}

/**
 * Options, quantity and the two purchase buttons.
 *
 * THE QUANTITY CONTROL IS A NUMBER FIELD, NOT A 1–10 SELECT
 * --------------------------------------------------------
 * It used to be a `<select>` listing 1 to 10, which made this store unable to take a
 * wholesale order at all, and made a `moq:25` product literally unbuyable: every option in
 * the list was below its minimum. A select cannot enumerate up to MAX_CART_QUANTITY, so this
 * is a number input bounded by [minimum, MAX_CART_QUANTITY].
 *
 * IT STARTS AT THE MINIMUM
 * ------------------------
 * On a product with `moq:10` the field opens at 10, not 1. A form that opens in a state the
 * checkout will reject is a form that is wrong before the customer has touched it, and they
 * only find out after filling in an address.
 *
 * CLAMPING HAPPENS ON COMMIT, NOT PER KEYSTROKE
 * --------------------------------------------
 * The raw string is kept in state while typing, because clamping on every keystroke means
 * someone typing "100" into a field with minimum 10 gets fought at "1" (clamped up to 10,
 * so the next keystroke produces "100" → fine) and, worse, someone clearing the field to
 * retype cannot. Blur and submit are the moments the value has to be legal, so those are
 * where it is enforced — and the reducer clamps again, so an out-of-range value can never
 * reach the cart even if this component is wrong.
 */
export function ProductPurchasePanel({ product }: { product: StorefrontProduct }) {
  const router = useRouter();
  const { addItem } = useCart();
  const [selection, setSelection] = useState<Record<string, string>>(() =>
    initialSelection(product),
  );

  const minimum = startingQuantity(product.minimumOrderQuantity);
  const hasMoq = minimum > 1;
  const [draft, setDraft] = useState(String(minimum));

  const selectedVariant = useMemo(
    () => product.variants.find((variant) => variantMatches(variant, selection)) ?? null,
    [product.variants, selection],
  );

  /** The committed, legal quantity. Everything downstream uses this, never `draft`. */
  const quantity = useMemo(() => {
    const parsed = Number.parseInt(draft, 10);
    if (!Number.isFinite(parsed)) return minimum;
    return Math.max(minimum, Math.min(MAX_CART_QUANTITY, parsed));
  }, [draft, minimum]);

  const belowMinimum = draft.trim() !== "" && Number.parseInt(draft, 10) < minimum;

  const item = useMemo(() => {
    if (!selectedVariant) return null;
    const unitPricePaise = moneyToPaise(selectedVariant.price);
    if (unitPricePaise === null) return null;
    return {
      shopifyProductId: product.shopifyProductId,
      shopifyVariantId: selectedVariant.shopifyVariantId,
      handle: product.handle,
      title: product.title,
      variantTitle: selectedVariant.title,
      selectedOptions: selectedVariant.selectedOptions,
      image: selectedVariant.image ?? product.images[0] ?? null,
      unitPricePaise,
      currencyCode: "INR" as const,
      availableForSale:
        product.availableForSale &&
        selectedVariant.availableForSale &&
        selectedVariant.availability === "SELLABLE",
      /**
       * Carried into the cart so the line can never be decremented below what the checkout
       * will accept. The backend re-derives this from Shopify and is the authority; this copy
       * exists to keep the UI from offering an order it knows will be refused.
       */
      minimumOrderQuantity: product.minimumOrderQuantity ?? null,
    };
  }, [product, selectedVariant]);

  const canBuy = Boolean(item?.availableForSale);

  const unitPricePaise = selectedVariant ? moneyToPaise(selectedVariant.price) : null;
  const lineTotal =
    unitPricePaise !== null && Number.isSafeInteger(unitPricePaise * quantity)
      ? formatPaise(unitPricePaise * quantity)
      : null;
  const minimumValue = selectedVariant
    ? minimumOrderValueLabel(selectedVariant.price, product.minimumOrderQuantity)
    : null;

  return (
    <section aria-label="Purchase options" className="mt-7 border-t border-line pt-6">
      {product.options.map((option) => (
        <fieldset key={option.name} className="mb-6">
          <legend className="mb-3 text-sm font-semibold">{option.name}</legend>
          <div className="flex flex-wrap gap-2">
            {option.values.map((value) => {
              const nextSelection = { ...selection, [option.name]: value };
              const exists = product.variants.some((variant) => variantMatches(variant, nextSelection));
              const selected = selection[option.name] === value;
              return (
                <button
                  key={value}
                  type="button"
                  disabled={!exists}
                  aria-pressed={selected}
                  onClick={() => setSelection(nextSelection)}
                  className="min-h-11 min-w-12 rounded-[var(--radius-control)] border border-line bg-surface px-4 text-sm font-semibold transition-[transform,border-color,background-color] active:scale-[0.98] enabled:hover:border-brand aria-pressed:border-brand aria-pressed:bg-brand aria-pressed:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {value}
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}

      {/*
        The wholesale terms block. Rendered only for products that actually have a minimum,
        because an "MOQ: 1" panel on every retail product is noise that trains people to
        ignore the panel on the products where it matters.
      */}
      {hasMoq ? (
        <div className="mb-5 flex items-start gap-3 rounded-[var(--radius-card)] border border-tint-teal-mark/25 bg-tint-teal p-4">
          <Info aria-hidden="true" className="mt-0.5 shrink-0 text-tint-teal-ink" size={18} strokeWidth={1.9} />
          <div className="min-w-0 text-sm">
            <p className="font-bold text-tint-teal-ink">Wholesale item · minimum {minimum} units</p>
            <p className="mt-1 leading-6 text-ink-muted">
              This product is sold in bulk, so orders start at {minimum} units
              {minimumValue ? ` (${minimumValue})` : ""}. Checkout re-checks the minimum and
              will not accept a smaller quantity.
            </p>
          </div>
        </div>
      ) : null}

      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-ink-muted">{hasMoq ? "Price per unit" : "Selected price"}</p>
          <p className="mt-1 text-xl font-semibold">
            {selectedVariant ? formatMoney(selectedVariant.price) : "Option unavailable"}
          </p>
        </div>
        <div>
          <label className="block text-sm font-semibold" htmlFor="purchase-quantity">
            Quantity
          </label>
          <input
            aria-describedby="purchase-quantity-hint"
            aria-invalid={belowMinimum}
            className="mt-1.5 min-h-11 w-28 rounded-[var(--radius-control)] border border-line bg-surface px-3 text-sm font-semibold tabular-nums outline-none focus:border-brand aria-[invalid=true]:border-danger"
            id="purchase-quantity"
            inputMode="numeric"
            max={MAX_CART_QUANTITY}
            min={minimum}
            // Commit on blur; the raw string survives while the field has focus.
            onBlur={() => setDraft(String(quantity))}
            onChange={(event) => setDraft(event.target.value)}
            step={1}
            type="number"
            value={draft}
          />
          <p
            aria-live="polite"
            className="mt-1.5 min-h-4 text-xs leading-4 text-ink-subtle"
            id="purchase-quantity-hint"
          >
            {belowMinimum ? (
              <span className="font-semibold text-danger">Minimum is {minimum} units.</span>
            ) : lineTotal !== null && quantity > 1 ? (
              // The line total, because the entire reason a per-unit price needs explaining is
              // that nobody buying 240 units wants to do the multiplication themselves.
              <span>
                {quantity} units · {lineTotal}
              </span>
            ) : null}
          </p>
        </div>
      </div>

      {!canBuy && (
        <p className="mb-4 rounded-[var(--radius-control)] bg-surface-muted px-4 py-3 text-sm text-ink-muted">
          {selectedVariant?.availability === "OUT_OF_STOCK"
            ? "That option just sold out. Please choose another."
            : "This option is not available to purchase."}
        </p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {item ? (
          <AddToCartButton className="w-full" item={item} quantity={quantity} variant="primary" />
        ) : (
          <button
            type="button"
            disabled
            className="min-h-12 rounded-[var(--radius-control)] bg-surface-strong px-5 font-semibold text-ink-muted"
          >
            Unavailable
          </button>
        )}
        <button
          type="button"
          disabled={!canBuy || !item}
          onClick={() => {
            if (!item) return;
            // `quantity` is already clamped to [minimum, MAX_CART_QUANTITY], so an
            // uncommitted draft below the minimum cannot skip straight to checkout.
            addItem(item, quantity);
            router.push("/checkout");
          }}
          className="min-h-12 rounded-[var(--radius-control)] border border-line-strong bg-transparent px-5 font-semibold whitespace-nowrap transition-[transform,border-color,color] active:scale-[0.98] enabled:hover:border-brand enabled:hover:text-brand-ink disabled:cursor-not-allowed disabled:border-line disabled:text-ink-muted"
        >
          Buy now
        </button>
      </div>
    </section>
  );
}
