import { AnnouncementBar } from "./AnnouncementBar";
import { Footer } from "./Footer";
import { Header } from "./Header";
import type { StorefrontCollectionSummary } from "@/lib/storefront/types";

export function StoreShell({
  children,
  collections = [],
}: {
  children: React.ReactNode;
  collections?: StorefrontCollectionSummary[];
}) {
  return (
    <div className="min-h-[100dvh] bg-canvas text-ink">
      <AnnouncementBar />
      <Header collections={collections} />
      {children}
      <Footer collections={collections} />
    </div>
  );
}
