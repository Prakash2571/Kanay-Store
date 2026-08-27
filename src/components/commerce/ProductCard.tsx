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
/**
 * Optional row badge.
 *
 * `new` is set by the New arrivals row and `featured` by the Best sellers row. Both are TRUE
 * claims: the backend's NEWEST sort is genuinely recency-ordered, and FEATURED is genuinely the
 * merchant's featured order.
 *
 * There is deliberately no "Best seller" badge. Shopify's FEATURED sort is manual merchandising
 * order, not sales data, and nothing in this system records units sold — so a best-seller badge
 * would be a popularity claim with nothing behind it. "Featured" says exactly what is true.
 */
export type ProductCardBadge = "new" | "featured";

const ROW_BADGE: Record<ProductCardBadge, { label: string; className: string }> = {
  new: { label: "New", className: "bg-tint-lavender text-tint-lavender-ink" },
  featured: { label: "Featured", className: "bg-tint-yellow text-tint-yellow-ink" },
};

export function ProductCard({
  product,
  priority = false,
  badge,
}: {
  product: StorefrontProductSummary;
  priority?: boolean;
  badge?: ProductCardBadge;
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
    <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface transition-[border-color,box-shadow] hover:border-brand hover:shadow-[var(--shadow-card)]">
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

        {/*
          Badges are soft-background pills with dark ink, not saturated fills with white text.
          Every saturated colour in this palette lands between 2.0:1 and 3.5:1 against white, so a
          solid orange pill with a white label is unreadable — and a row of loud pills on a white
          card is the thing that makes a grid look cheap. Soft fill plus dark ink stays legible and
          stays calm, and the hue still does the scanning work.
        */}
        <span className="absolute left-2 top-2 flex flex-col items-start gap-1">
          {discount !== null ? (
            <span className="rounded-[var(--radius-pill)] bg-tint-orange px-2 py-0.5 text-[0.65rem] font-extrabold text-tint-orange-ink shadow-[var(--shadow-card)]">
              {discount}% off
            </span>
          ) : null}
          {hasMinimum(moq) ? (
            <span className="rounded-[var(--radius-pill)] bg-tint-teal px-2 py-0.5 text-[0.65rem] font-extrabold text-tint-teal-ink shadow-[var(--shadow-card)]">
              Wholesale
            </span>
          ) : null}
        </span>

        <span className="absolute right-2 top-2 flex flex-col items-end gap-1">
          {/* Neutral ink: sold out is not a thing to promote, so it gets no brand colour. */}
          {soldOut ? (
            <span className="rounded-[var(--radius-pill)] bg-ink px-2 py-0.5 text-[0.65rem] font-extrabold text-white">
              Sold out
            </span>
          ) : null}
          {badge && !soldOut ? (
            <span
              className={`rounded-[var(--radius-pill)] px-2 py-0.5 text-[0.65rem] font-extrabold shadow-[var(--shadow-card)] ${ROW_BADGE[badge].className}`}
            >
              {ROW_BADGE[badge].label}
            </span>
          ) : null}
        </span>
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
              className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--radius-control)] border border-line bg-surface-muted px-3 text-xs font-bold transition-colors hover:border-brand hover:text-brand-ink focus-visible:outline focus-visible:outline-2 active:translate-y-px"
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
