import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductPurchasePanel } from "@/components/cart/ProductPurchasePanel";
import { ProductCard } from "@/components/commerce/ProductCard";
import { ProductGallery } from "@/components/commerce/ProductGallery";
import { ProductPrice } from "@/components/commerce/ProductPrice";
import { StoreShell } from "@/components/layout/StoreShell";
import { getCatalog } from "@/lib/storefront/catalog";
import { getCollections } from "@/lib/storefront/collections";
import { getProduct } from "@/lib/storefront/products";
import type { StorefrontProduct } from "@/lib/storefront/types";

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const { handle } = await params;
  const result = await getProduct(handle);
  if (!result.ok) return { title: "Product" };
  const product = result.data;
  const description = product.seo?.description || product.descriptionExcerpt || product.description;
  return {
    title: product.seo?.title || product.title,
    description,
    alternates: { canonical: `/products/${product.handle}` },
    openGraph: product.images[0] ? { images: [{ url: product.images[0].url, alt: product.images[0].alt || product.title }] } : undefined,
  };
}

export default async function ProductPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const [productResult, collectionsResult] = await Promise.all([getProduct(handle), getCollections()]);
  if (!productResult.ok && productResult.error.status === 404) notFound();
  const collections = collectionsResult.ok ? collectionsResult.data : [];

  if (!productResult.ok) {
    return (
      <StoreShell collections={collections}>
        <main className="mx-auto grid min-h-[55dvh] max-w-[1400px] place-items-center px-5 py-16 text-center">
          <div><h1 className="font-serif text-5xl font-semibold">This item cannot be loaded</h1><p className="mt-3 text-sm text-ink-muted">Refresh the page or try again shortly.</p><Link className="mt-7 inline-flex min-h-11 items-center bg-ink px-6 text-sm font-bold text-canvas" href="/shop">Back to shop</Link></div>
        </main>
      </StoreShell>
    );
  }

  const product = productResult.data;
  const recommendationCollection = product.collections[0]?.handle;
  const recommendationsResult = await getCatalog({ collection: recommendationCollection, availability: "SELLABLE", first: 5 });
  const recommendations = recommendationsResult.ok
    ? recommendationsResult.data.products.filter((item) => item.id !== product.id).slice(0, 4)
    : [];

  return (
    <StoreShell collections={collections}>
      <main>
        <div className="mx-auto max-w-[1400px] px-5 py-6 sm:px-8 lg:px-12 lg:py-10">
          <nav aria-label="Breadcrumb" className="mb-6 text-xs text-ink-muted"><Link className="hover:text-ink" href="/shop">Shop</Link> / {product.title}</nav>
          <div className="grid gap-9 lg:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)] lg:gap-14">
            <ProductGallery images={product.images} title={product.title} />
            <div className="lg:sticky lg:top-28 lg:self-start">
              {product.productType ? <p className="text-xs font-bold uppercase tracking-[0.12em] text-accent-ink">{product.productType}</p> : null}
              <h1 className="mt-3 font-serif text-4xl font-semibold leading-[1] tracking-[-0.025em] sm:text-5xl">{product.title}</h1>
              {product.vendorPublicName ? <p className="mt-2 text-xs text-ink-muted">By {product.vendorPublicName}</p> : null}
              <div className="mt-5">
                <ProductPrice compareAtPrice={product.compareAtPriceRange?.min} prefix={product.priceRange.min.amount !== product.priceRange.max.amount ? "From " : undefined} price={product.priceRange.min} size="large" />
              </div>
              <p className={`mt-4 text-sm font-semibold ${product.availableForSale ? "text-success" : "text-ink-muted"}`}>
                {product.availableForSale ? "Available to order" : product.availability === "OUT_OF_STOCK" ? "Out of stock" : "Currently unavailable"}
              </p>
              {product.descriptionExcerpt ? <p className="mt-5 max-w-[55ch] text-sm leading-6 text-ink-muted">{product.descriptionExcerpt}</p> : null}
              <ProductPurchasePanel product={product} />
              <div className="mt-7 grid gap-3 border-t border-line pt-6 text-sm">
                <details className="border-b border-line pb-3" open>
                  <summary className="cursor-pointer py-2 font-bold">Product details</summary>
                  <p className="pb-2 leading-6 text-ink-muted">{product.description || "Additional product details are not available yet."}</p>
                </details>
                <details className="border-b border-line pb-3">
                  <summary className="cursor-pointer py-2 font-bold">Shipping</summary>
                  <p className="pb-2 leading-6 text-ink-muted">Shipping charges and destination availability are confirmed before payment.</p>
                </details>
              </div>
            </div>
          </div>
        </div>
        {recommendations.length ? (
          <section aria-labelledby="recommended-heading" className="border-t border-line bg-surface py-14 lg:py-20">
            <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
              <h2 className="mb-7 font-serif text-4xl font-semibold tracking-[-0.025em]" id="recommended-heading">You may also like</h2>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">{recommendations.map((item) => <ProductCard key={item.id} product={item} />)}</div>
            </div>
          </section>
        ) : null}
        <ProductStructuredData product={product} />
      </main>
    </StoreShell>
  );
}

function ProductStructuredData({ product }: { product: StorefrontProduct }) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const data = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.descriptionExcerpt || product.description,
    image: product.images.map((image) => image.url),
    brand: product.vendorPublicName ? { "@type": "Brand", name: product.vendorPublicName } : undefined,
    url: `${siteUrl.replace(/\/$/, "")}/products/${product.handle}`,
    offers: product.variants.map((variant) => ({
      "@type": "Offer",
      price: variant.price.amount,
      priceCurrency: "INR",
      availability: variant.availableForSale ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      sku: variant.skuPublic || undefined,
      url: `${siteUrl.replace(/\/$/, "")}/products/${product.handle}`,
    })),
  };
  return <script dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} type="application/ld+json" />;
}
