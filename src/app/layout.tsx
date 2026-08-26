import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";

import { CartProvider } from "@/components/cart/CartProvider";

import "./globals.css";

const sans = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const editorial = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  weight: ["500", "600", "700"],
  display: "swap",
});

const storeName = process.env.NEXT_PUBLIC_STORE_NAME ?? "Kanay Store";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${storeName} | Modern fashion and lifestyle`,
    template: `%s | ${storeName}`,
  },
  description:
    "Shop considered fashion, accessories and everyday essentials from Kanay Store.",
  openGraph: {
    type: "website",
    siteName: storeName,
    title: `${storeName} | Modern fashion and lifestyle`,
    description:
      "Shop considered fashion, accessories and everyday essentials from Kanay Store.",
    url: siteUrl,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-IN" className={`${sans.variable} ${editorial.variable}`}>
      <body>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
