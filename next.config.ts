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
/**
 * Content-Security-Policy, in REPORT-ONLY mode.
 *
 * WHY REPORT-ONLY AND NOT ENFORCED
 * --------------------------------
 * A CSP that breaks Razorpay Checkout breaks it at the exact moment a customer tries to
 * pay - the most expensive place in the whole application to be wrong, and the one place
 * that cannot be verified from a build. Razorpay loads a script from checkout.razorpay.com,
 * opens frames of its own, talks to api.razorpay.com and lumberjack.razorpay.com, and its
 * own bundle uses inline styles. Getting any of that list wrong produces a checkout that
 * looks fine until the modal fails to open.
 *
 * So the policy below is shipped in Report-Only: browsers evaluate it and report what it
 * WOULD have blocked, and nothing breaks. That turns "we think this is the right policy"
 * into evidence, which is what is needed before enforcing it.
 *
 * TO ENFORCE IT, once verified against a live Razorpay test key:
 *   1. run a real card and a real UPI payment with a browser console open
 *   2. confirm no violation is reported for a resource the payment needs
 *   3. rename the header to `Content-Security-Policy`
 *
 * `report-uri` is deliberately absent: there is no collector, and pointing violations at
 * a third party would send them the URLs of pages that carry order tokens.
 *
 * 'unsafe-inline' for styles is a real weakening and is deliberate: Next injects inline
 * styles, and Razorpay's widget does too. Scripts do NOT get it - a nonce-based script
 * policy is the part worth keeping strict, because script injection is the attack that
 * matters on a checkout page.
 */
const contentSecurityPolicyReportOnly = [
  "default-src 'self'",
  // Razorpay Checkout is loaded from their CDN at runtime.
  "script-src 'self' 'unsafe-inline' https://checkout.razorpay.com",
  "style-src 'self' 'unsafe-inline'",
  // Shopify CDN serves product imagery; data: covers inlined placeholders.
  "img-src 'self' data: blob: https://cdn.shopify.com https://images.unsplash.com https://*.razorpay.com",
  "font-src 'self' data:",
  // The Trademart backend origin is not known at build time, so it cannot be listed
  // here. That is the main reason this policy is not yet enforced: connect-src has to
  // include NEXT_PUBLIC_TRADEMART_API_URL, which is per-deployment.
  "connect-src 'self' https://api.razorpay.com https://lumberjack.razorpay.com https://*.razorpay.com",
  // Razorpay opens its checkout inside a frame it owns.
  "frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com https://*.razorpay.com",
  // Nothing may frame this storefront - the same statement as X-Frame-Options, in the
  // modern form that browsers actually honour for nested contexts.
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self' https://api.razorpay.com",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

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
  // Evaluated by the browser, enforced by nobody. See the comment above.
  { key: "Content-Security-Policy-Report-Only", value: contentSecurityPolicyReportOnly },
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
