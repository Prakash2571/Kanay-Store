import Image from "next/image";
import Link from "next/link";

import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { moneyToPaise } from "@/lib/storefront/money";
import type { CartProductItem, StorefrontProductSummary } from "@/lib/storefront/types";

import { ProductPrice } from "./ProductPrice";

export function ProductCard({ product, priority = false }: { product: StorefrontProductSummary; priority?: boolean }) {
  const image = product.images[0] ?? null;
  const priceVaries = product.priceRange.min.amount !== product.priceRange.max.amount;
  const quickVariant = product.quickAddVariant;
  const quickPricePaise = quickVariant ? moneyToPaise(quickVariant.price) : null;
  const cartItem: CartProductItem | null = quickVariant && quickPricePaise !== null
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
    <article className="group flex min-w-0 flex-col">
      <Link className="relative block aspect-[4/5] overflow-hidden bg-surface-muted focus-visible:outline focus-visible:outline-2" href={`/products/${product.handle}`} aria-label={`View ${product.title}`}>
        {image ? (
          <Image
            alt={image.alt || product.title}
            className="object-cover transition-transform duration-500 ease-out motion-safe:group-hover:scale-[1.025]"
            fill
            priority={priority}
            sizes="(max-width: 639px) 72vw, (max-width: 1023px) 33vw, 25vw"
            src={image.url}
          />
        ) : (
          <span className="grid h-full place-items-center px-6 text-center font-serif text-2xl text-ink-muted">{product.title}</span>
        )}
      </Link>
      <div className="flex flex-1 flex-col pt-3">
        {product.productType ? <p className="mb-1 text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-ink-muted">{product.productType}</p> : null}
        <h3 className="line-clamp-2 text-sm font-semibold leading-5">
          <Link className="hover:text-accent-ink focus-visible:outline focus-visible:outline-2" href={`/products/${product.handle}`}>{product.title}</Link>
        </h3>
        <div className="mt-1.5">
          <ProductPrice
            compareAtPrice={product.compareAtPriceRange?.min}
            prefix={priceVaries ? "From " : undefined}
            price={product.priceRange.min}
          />
        </div>
        <div className="mt-auto pt-3">
          {cartItem ? (
            <AddToCartButton item={cartItem} />
          ) : (
            <Link className="inline-flex min-h-10 w-full items-center justify-center border border-ink px-4 text-xs font-bold transition-colors hover:bg-ink hover:text-canvas focus-visible:outline focus-visible:outline-2 active:translate-y-px" href={`/products/${product.handle}`}>
              {product.availableForSale ? "Choose options" : "View item"}
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
