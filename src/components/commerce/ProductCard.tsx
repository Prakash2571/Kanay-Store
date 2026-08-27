import Image from "next/image";
import Link from "next/link";

import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { calculateDiscountPercent, moneyToPaise } from "@/lib/storefront/money";
import type { CartProductItem, StorefrontProductSummary } from "@/lib/storefront/types";

import { ProductPrice } from "./ProductPrice";

/**
 * The product card, in the reference's style: white surface, subtle warm border, rounded
 * corners, square image, compact title, price with any strike-through, and a full-width Add
 * to cart.
 *
 * TWO THINGS THE REFERENCE HAS THAT THIS DOES NOT, ON PURPOSE
 * -----------------------------------------------------------
 * A star rating and a wishlist heart. Neither has a backend: nothing collects reviews and
 * nothing stores a saved item. A decorative "4.8 ★" is a fabricated rating on a page where
 * a shopper is deciding what to buy, and a heart that silently does nothing is worse than no
 * heart — the customer believes the item is saved and finds an empty list later. Both slots
 * are ready for real data; the discount badge occupies the corner the heart would use.
 *
 * The image is a SQUARE (the reference is too) rather than the old 4:5 portrait. Portrait
 * crops flatter clothing and cut the top off appliances and boxed goods, which is most of
 * this catalog.
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
        }
      : null;

  return (
    <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface transition-[border-color,box-shadow] hover:border-accent-soft hover:shadow-[var(--shadow-card)]">
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

        {discount !== null ? (
          <span className="absolute left-2 top-2 rounded-[var(--radius-pill)] bg-accent px-2 py-0.5 text-[0.65rem] font-extrabold text-white">
            {discount}% off
          </span>
        ) : null}

        {soldOut ? (
          <span className="absolute right-2 top-2 rounded-[var(--radius-pill)] bg-ink px-2 py-0.5 text-[0.65rem] font-extrabold text-white">
            Sold out
          </span>
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col p-3">
        {product.productType ? (
          <p className="mb-1 truncate text-[0.65rem] font-bold uppercase tracking-[0.08em] text-ink-subtle">
            {product.productType}
          </p>
        ) : null}

        <h3 className="line-clamp-2 text-[0.85rem] font-semibold leading-5 sm:text-sm">
          <Link
            className="rounded transition-colors hover:text-accent-ink focus-visible:outline focus-visible:outline-2"
            href={`/products/${product.handle}`}
          >
            {product.title}
          </Link>
        </h3>

        <div className="mt-1.5">
          <ProductPrice
            compareAtPrice={compareAt}
            prefix={priceVaries ? "From " : undefined}
            price={product.priceRange.min}
          />
        </div>

        <div className="mt-auto pt-3">
          {cartItem ? (
            <AddToCartButton className="w-full" item={cartItem} />
          ) : (
            <Link
              className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--radius-control)] border border-line bg-surface-muted px-3 text-xs font-bold transition-colors hover:border-ink focus-visible:outline focus-visible:outline-2 active:translate-y-px"
              href={`/products/${product.handle}`}
            >
              {product.availableForSale ? "Choose options" : "View item"}
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
