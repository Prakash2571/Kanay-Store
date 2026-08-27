import type { Metadata } from "next";
import { Manrope } from "next/font/google";

import { CartProvider } from "@/components/cart/CartProvider";
import { THEME_INIT_SCRIPT } from "@/components/theme/theme";
import { siteOrigin, storeName as resolveStoreName } from "@/lib/seo/site";

import "./globals.css";

/**
 * One typeface, a clean geometric sans.
 *
 * The editorial serif (Cormorant Garamond) that used to set every heading has been
 * removed. It is a beautiful fashion-magazine face and that was precisely the problem:
 * "Style that earns its place." in 72px Cormorant tells a visitor this is an apparel
 * label, which mis-sells the electronics, kitchenware, tools and wholesale lots that
 * make up most of the catalog. Compact sans headings in the 24-52px range read as a
 * general store, and they let the product photography carry the page.
 */
const sans = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const storeName = resolveStoreName();
const siteUrl = siteOrigin();

const TAGLINE = "Wholesale sourcing across every category";
const DESCRIPTION =
  "Source electronics, home and kitchen, appliances, accessories, beauty, tools, office supplies, fitness and everyday products at wholesale-friendly quantities. Minimum order quantities shown per product, priced in INR.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${storeName} | ${TAGLINE}`,
    template: `%s | ${storeName}`,
  },
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: storeName,
    title: `${storeName} | ${TAGLINE}`,
    description: DESCRIPTION,
    url: siteUrl,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className={sans.variable} lang="en-IN" suppressHydrationWarning>
      <head>
        {/*
          Applies the stored (or OS) theme BEFORE first paint, so the page never renders
          light and then snaps to dark. It has to be inline and it has to be in <head> -
          anything deferred is, by definition, after the flash.

          dangerouslySetInnerHTML is required to emit a raw script body, and is safe here for
          one specific reason: THEME_INIT_SCRIPT is a fixed string literal with no
          interpolation (asserted in theme.test.ts), so there is no input to inject into.
        */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
