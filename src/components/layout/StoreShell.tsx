import { Footer } from "./Footer";
import { Header } from "./Header";
import { ServiceStrip } from "./ServiceStrip";
import type { StorefrontCollectionSummary } from "@/lib/storefront/types";

export function StoreShell({
  children,
  collections = [],
}: {
  children: React.ReactNode;
  collections?: StorefrontCollectionSummary[];
}) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-canvas text-ink">
      <ServiceStrip />
      <Header />
      {/* flex-1 so a short page (an empty cart, a 404) still pins the footer to the
          bottom instead of leaving it floating mid-screen. */}
      <div className="flex-1">{children}</div>
      <Footer collections={collections} />
    </div>
  );
}
