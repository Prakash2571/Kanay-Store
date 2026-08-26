"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { formatMoney, moneyToPaise } from "@/lib/storefront/money";
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

export function ProductPurchasePanel({ product }: { product: StorefrontProduct }) {
  const router = useRouter();
  const { addItem } = useCart();
  const [selection, setSelection] = useState<Record<string, string>>(() =>
    initialSelection(product),
  );
  const [quantity, setQuantity] = useState(1);

  const selectedVariant = useMemo(
    () => product.variants.find((variant) => variantMatches(variant, selection)) ?? null,
    [product.variants, selection],
  );

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
    };
  }, [product, selectedVariant]);

  const canBuy = Boolean(item?.availableForSale);

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
                  className="min-h-11 min-w-12 rounded-[var(--radius-control)] border border-line bg-surface px-4 text-sm font-semibold transition-[transform,border-color,background-color] active:scale-[0.98] enabled:hover:border-ink aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-canvas disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {value}
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}

      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-ink-muted">Selected price</p>
          <p className="mt-1 text-xl font-semibold">
            {selectedVariant ? formatMoney(selectedVariant.price) : "Option unavailable"}
          </p>
        </div>
        <label className="flex items-center gap-3 text-sm font-semibold">
          Quantity
          <select
            value={quantity}
            onChange={(event) => setQuantity(Number(event.target.value))}
            className="min-h-11 rounded-[var(--radius-control)] border border-line bg-surface px-3"
          >
            {Array.from({ length: 10 }, (_, index) => index + 1).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
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
          <AddToCartButton item={item} quantity={quantity} className="w-full" />
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
            addItem(item, quantity);
            router.push("/checkout");
          }}
          className="min-h-12 rounded-[var(--radius-control)] border border-ink bg-transparent px-5 font-semibold whitespace-nowrap transition-[transform,background-color,color] active:scale-[0.98] enabled:hover:bg-ink enabled:hover:text-canvas disabled:cursor-not-allowed disabled:border-line disabled:text-ink-muted"
        >
          Buy now
        </button>
      </div>
    </section>
  );
}
