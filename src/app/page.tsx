import type { Metadata } from "next";

import { StoreShell } from "@/components/layout/StoreShell";
import { BestSellers } from "@/components/home/BestSellers";
import { CategoryRail } from "@/components/home/CategoryRail";
import { EditorialPromotions } from "@/components/home/EditorialPromotions";
import { Hero } from "@/components/home/Hero";
import { LifestyleFeature } from "@/components/home/LifestyleFeature";
import { Testimonials } from "@/components/home/Testimonials";
import { TrustStrip } from "@/components/home/TrustStrip";
import { getCatalog } from "@/lib/storefront/catalog";
import { getCollections } from "@/lib/storefront/collections";

export const metadata: Metadata = {
  title: "Modern fashion and lifestyle",
  description: "Shop considered fashion, accessories and everyday essentials from Kanay Store.",
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const [catalogResult, collectionsResult] = await Promise.all([
    getCatalog({ availability: "SELLABLE", first: 8, sort: "FEATURED" }),
    getCollections(),
  ]);
  const products = catalogResult.ok ? catalogResult.data.products : [];
  const collections = collectionsResult.ok
    ? collectionsResult.data
    : catalogResult.ok
      ? catalogResult.data.filters.collections
      : [];

  return (
    <StoreShell collections={collections}>
      <main>
        <Hero collections={collections} />
        <CategoryRail collections={collections} />
        <EditorialPromotions collections={collections} />
        <BestSellers loadFailed={!catalogResult.ok} products={products} />
        <LifestyleFeature />
        <TrustStrip />
        <Testimonials />
      </main>
    </StoreShell>
  );
}
