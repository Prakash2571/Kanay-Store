/**
 * JSON-LD builders.
 *
 * PURE, AND SEPARATE FROM THE COMPONENT
 * -------------------------------------
 * The product page built its JSON-LD inline, so nothing could assert what it emitted.
 * Structured data is exactly the kind of output that is never looked at again once it
 * renders, and a silent mismatch with the visible page is what Google penalises. These
 * functions take data and return plain objects, so tests can check them precisely.
 *
 * THE BUG THIS FIXES
 * ------------------
 * `priceCurrency` was hardcoded to "INR" while every price already carries a real
 * `currencyCode` from Shopify. A store priced in any other currency was publishing
 * structured data claiming rupees - a machine-readable price that contradicts the
 * checkout, which is worse than emitting nothing.
 *
 * WHAT IS DELIBERATELY NOT EMITTED
 * --------------------------------
 * No supplier id, supplier cost, margin, opportunity score, confidence, or internal
 * note. JSON-LD is published to the page source in plain text, so it is one of the
 * easiest places to leak internal data without noticing.
 */

import type { StorefrontProduct } from "@/lib/storefront/types";

/** Schema.org availability values, spelled exactly as the vocabulary requires. */
const IN_STOCK = "https://schema.org/InStock";
const OUT_OF_STOCK = "https://schema.org/OutOfStock";

export interface JsonLdOffer {
  "@type": "Offer";
  price: string;
  priceCurrency: string;
  availability: string;
  url: string;
  sku?: string;
}

export interface JsonLdProduct {
  "@context": "https://schema.org";
  "@type": "Product";
  name: string;
  description?: string;
  image?: string[];
  brand?: { "@type": "Brand"; name: string };
  url: string;
  offers: JsonLdOffer[];
}

export interface JsonLdBreadcrumbList {
  "@context": "https://schema.org";
  "@type": "BreadcrumbList";
  itemListElement: {
    "@type": "ListItem";
    position: number;
    name: string;
    item: string;
  }[];
}

function clean(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

/**
 * Product structured data.
 *
 * Offers are built only from variants that carry a usable price. A variant with a
 * missing or malformed amount is omitted rather than published as "0", because a
 * machine-readable price of zero is a far worse claim than a missing offer.
 */
export function buildProductJsonLd(
  product: StorefrontProduct,
  origin: string,
): JsonLdProduct {
  const url = `${origin}/products/${encodeURIComponent(product.handle)}`;
  const description = clean(product.seo?.description) ?? clean(product.descriptionExcerpt) ?? clean(product.description);
  const brandName = clean(product.vendorPublicName);
  const images = product.images.map((image) => image.url).filter(Boolean);

  const offers: JsonLdOffer[] = product.variants.flatMap((variant) => {
    const price = clean(variant.price?.amount);
    // Currency comes from the variant, never a constant. This is the bug that was here.
    const priceCurrency = clean(variant.price?.currencyCode);
    if (!price || !priceCurrency || !/^\d+(\.\d+)?$/.test(price)) return [];

    const sku = clean(variant.skuPublic);
    return [
      {
        "@type": "Offer" as const,
        price,
        priceCurrency: priceCurrency.toUpperCase(),
        availability: variant.availableForSale ? IN_STOCK : OUT_OF_STOCK,
        url,
        ...(sku ? { sku } : {}),
      },
    ];
  });

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    ...(description ? { description } : {}),
    ...(images.length > 0 ? { image: images } : {}),
    ...(brandName ? { brand: { "@type": "Brand" as const, name: brandName } } : {}),
    url,
    offers,
  };
}

/**
 * Breadcrumb structured data.
 *
 * Takes the trail the page actually renders, so the markup and the structured data
 * cannot describe different navigation - which is the specific thing Google flags when
 * breadcrumb data does not match the page.
 */
export function buildBreadcrumbJsonLd(
  trail: readonly { name: string; path: string }[],
  origin: string,
): JsonLdBreadcrumbList {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((entry, index) => ({
      "@type": "ListItem" as const,
      position: index + 1,
      name: entry.name,
      item: `${origin}${entry.path.startsWith("/") ? entry.path : `/${entry.path}`}`,
    })),
  };
}

/**
 * Serialises JSON-LD for embedding in a <script> tag.
 *
 * Escapes `<` so a merchant-authored product title containing `</script>` cannot break
 * out of the script element. This is a real injection path: the title comes from
 * Shopify, and anyone who can edit a product could otherwise inject markup into every
 * product page.
 *
 * `\u2028` and `\u2029` are escaped too - they are valid in JSON strings but are line
 * terminators in JavaScript, so an unescaped one is a syntax error inside the script.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
