import Image from "next/image";
import Link from "next/link";

import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { calculateDiscountPercent, formatMoney, moneyToPaise } from "@/lib/storefront/money";
import {
  hasMinimum,
  minimumOrderValueLabel,
  moqLabel,
  startingQuantity,
  unitPriceLabel,
} from "@/lib/storefront/moq";
import type { CartProductItem, StorefrontProductSummary } from "@/lib/storefront/types";

/**
 * The wholesale product card.
 *
 * WHAT A WHOLESALE CARD HAS TO ANSWER
 * -----------------------------------
 * A retail card answers "what does this cost". A wholesale card has to answer four things before
 * a buyer will click: what department it is in, the UNIT price, the MINIMUM they must take, and
 * what that minimum costs them. Without the fourth, every buyer opens a calculator — and a card
 * showing "₹349" beside "MOQ 10" invites the reading that ₹349 is the pack price.
 *
 * BADGE COLOURS CARRY MEANING
 * ---------------------------
 * Blue for the MOQ, because a minimum is structural information about how the product is sold.
 * Orange for a discount, because that is an offer. When every badge shared one accent colour
 * they read as decoration; two families mean a buyer can scan a grid and see which items are
 * discounted without reading a word.
 */
export function ProductCard({
  product,
  priority = false,
}: {
  product: StorefrontProductSummary;
  priority?: boolean;
}) {
  const image = product.images[0] ?? null;
  const priceVaries = product.priceRange.min.amount !== product.priceRange.max.amount;
  const compareAt = product.compareAtPriceRange?.min ?? null;
  const discount = calculateDiscountPercent(product.priceRange.min, compareAt);
  const moq = product.minimumOrderQuantity ?? null;
  const minimumOrder = minimumOrderValueLabel(product.priceRange.min, moq);
  const quickVariant = product.quickAddVariant;
  const quickPricePaise = quickVariant ? moneyToPaise(quickVariant.price) : null;
  const soldOut = !product.availableForSale;

  const cartItem: CartProductItem | null =
    quickVariant && quickPricePaise !== null
      ? {
          shopifyProductId: product.shopifyProductId,
          shopifyVariantId: quickVariant.shopifyVariantId,
          handle: product.handle,
          title: product.title,
          variantTitle: quickVariant.title,
          selectedOptions: quickVariant.selectedOptions,
          image: quickVariant.image ?? image,
          unitPricePaise: quickPricePaise,
          currencyCode: "INR",
          availableForSale: product.availableForSale && quickVariant.availableForSale,
          minimumOrderQuantity: moq,
        }
      : null;

  return (
    <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface transition-[border-color,box-shadow] hover:border-accent hover:shadow-[var(--shadow-card)]">
      <Link
        aria-label={`View ${product.title}`}
        className="relative block aspect-square overflow-hidden bg-surface-muted focus-visible:outline focus-visible:outline-2"
        href={`/products/${product.handle}`}
      >
        {image ? (
          <Image
            alt={image.alt || product.title}
            className="object-cover transition-transform duration-500 ease-out motion-safe:group-hover:scale-[1.03]"
            fill
            priority={priority}
            sizes="(max-width: 639px) 45vw, (max-width: 1023px) 30vw, (max-width: 1279px) 23vw, 18vw"
            src={image.url}
          />
        ) : (
          <span className="grid h-full place-items-center px-4 text-center text-xs font-semibold text-ink-subtle">
            {product.title}
          </span>
        )}

        {/* Orange is reserved for exactly this: an offer. White on `--accent` is 3.1:1, which
            is why this badge is bold and small-caps rather than regular weight. */}
        {discount !== null ? (
          <span className="absolute left-2 top-2 rounded-[var(--radius-pill)] bg-accent px-2 py-0.5 text-[0.65rem] font-extrabold text-white shadow-[var(--shadow-card)]">
            {discount}% off
          </span>
        ) : null}

        {/* Neutral ink, deliberately not brand or accent: sold out is not a thing to promote. */}
        {soldOut ? (
          <span className="absolute right-2 top-2 rounded-[var(--radius-pill)] bg-ink px-2 py-0.5 text-[0.65rem] font-extrabold text-white">
            Sold out
          </span>
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col p-3.5">
        {product.productType ? (
          <p className="mb-1 truncate text-[0.65rem] font-bold uppercase tracking-[0.08em] text-ink-subtle">
            {product.productType}
          </p>
        ) : null}

        <h3 className="line-clamp-2 text-[0.85rem] font-semibold leading-5 sm:text-sm">
          <Link
            className="rounded transition-colors hover:text-brand-ink focus-visible:outline focus-visible:outline-2"
            href={`/products/${product.handle}`}
          >
            {product.title}
          </Link>
        </h3>

        <p className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-sm font-extrabold text-ink sm:text-[0.95rem]">
            {unitPriceLabel(product.priceRange.min, priceVaries ? "From " : undefined)}
          </span>
          {discount !== null && compareAt ? (
            <span className="text-xs text-ink-subtle line-through">{formatMoney(compareAt)}</span>
          ) : null}
        </p>

        {hasMinimum(moq) ? (
          <p className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1">
            <span className="rounded-[var(--radius-control)] bg-brand-soft px-1.5 py-0.5 text-[0.65rem] font-bold text-brand-ink">
              {moqLabel(moq)}
            </span>
            {minimumOrder ? (
              <span className="text-[0.68rem] font-semibold text-ink-muted">
                Min. order {minimumOrder}
              </span>
            ) : null}
          </p>
        ) : null}

        <div className="mt-auto pt-3.5">
          {cartItem ? (
            <AddToCartButton className="w-full" item={cartItem} quantity={startingQuantity(moq)} />
          ) : (
            <Link
              className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--radius-control)] border border-line bg-surface-muted px-3 text-xs font-bold transition-colors hover:border-accent hover:text-accent-ink focus-visible:outline focus-visible:outline-2 active:translate-y-px"
              href={`/products/${product.handle}`}
            >
              {product.availableForSale ? "View product" : "View item"}
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
