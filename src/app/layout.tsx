import type { Metadata } from "next";
import { Manrope } from "next/font/google";

import { CartProvider } from "@/components/cart/CartProvider";
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

const TAGLINE = "Everyday products at better prices";
const DESCRIPTION =
  "Shop electronics, home and kitchen, beauty, accessories, fashion, toys, fitness and thousands of everyday products at Kanay Store. Retail and wholesale, priced in INR.";

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
    <html lang="en-IN" className={sans.variable}>
      <body>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
