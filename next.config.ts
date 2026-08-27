import type { NextConfig } from "next";

/**
 * Response headers.
 *
 * Referrer-Policy is the one that matters most here. Order confirmation and tracking
 * URLs carry a status/tracking token, and the browser default
 * (strict-origin-when-cross-origin) still sends the ORIGIN on every outbound request -
 * including to the Razorpay checkout script and any image CDN. `no-referrer` sends
 * nothing at all, which costs this storefront nothing: no feature here reads a referrer,
 * and analytics is first-party by construction (see lib/analytics/events.ts).
 *
 * NOT set here: Content-Security-Policy. A meaningful CSP for this app has to allow the
 * Razorpay checkout script, its frames and its API origins, and getting that list wrong
 * breaks payments in a way that only shows up at the moment a customer tries to pay. It
 * belongs in a change that can be verified against a live Razorpay test key, not bolted
 * on blind - and a permissive CSP that allows everything would be worse than none,
 * because it looks like protection.
 */
const securityHeaders = [
  // Never leak a token-bearing URL through a referrer.
  { key: "Referrer-Policy", value: "no-referrer" },
  // Stop a response being reinterpreted as a script or stylesheet.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // This storefront frames Razorpay; nothing needs to frame this storefront.
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // No feature here uses these, and a third-party frame should not inherit them.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
];

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.shopify.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
