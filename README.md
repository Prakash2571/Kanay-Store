# Kanay Store

Kanay Store is the customer-facing ecommerce application for the Trademart commerce system. It is a separate Next.js application and does not contain operator tools or Shopify Admin credentials.

It is a **general-purpose retail and wholesale marketplace**, not a single-category brand: electronics and mobile accessories, home and kitchen, appliances, beauty and personal care, bags, watches, jewellery, toys, sports and fitness, office supplies, stationery, home decor, lighting, tools, automotive accessories, travel goods, gifts, seasonal lines, wholesale lots — and fashion as one category among them.

## Design system

Navy and cobalt carry the brand, cool grey carries the page, teal marks wholesale information, and amber is rationed. One clean sans (Manrope) at compact ecommerce sizes. Tokens live in `src/app/globals.css`; the `shell`, `section-y` and `no-scrollbar` utilities defined there set the 1320px centred column and the section rhythm, so every page lines up without repeating gutter classes.

The palette used to be peach on cream with an orange accent. It was clean, and it read as a beauty or skincare brand — warm blush surfaces plus a coral CTA is the visual grammar of cosmetics retail, which mis-sells a marketplace whose catalog is mostly electronics, appliances, tools and office supplies. Blue is the conventional trust colour in commerce because payment, logistics and B2B platforms use it, and conventional is exactly right for the screen where someone commits money to a 500-unit order.

Rules that are load-bearing rather than stylistic:

- **Amber (`--highlight`) is only for discount labels, offer flags and warnings.** The moment it becomes a general-purpose accent the page drifts back towards the warm-retail feel this palette exists to leave behind.
- **Dark mode is class-driven, not media-driven.** Tokens are redefined under `.dark`, and `<html>` gets that class from `THEME_INIT_SCRIPT` before first paint. A `prefers-color-scheme` block alone cannot support a toggle, and a toggle that only applies after hydration flashes the wrong theme on every load. Dark surfaces are navy-slate, never pure black, and **no filter, opacity or blend mode is ever applied to product imagery** — a dimmed photograph misrepresents merchandise a buyer is judging from it.
- **Fill tokens and text tokens are separate where the background does not invert.** `--brand-dark` is a fill and stays deep navy in both themes; `--brand-ink` is text and lightens in dark mode. Colours inside a surface that keeps its value across themes (the navy quote band, the amber discount disc) are literals, not tokens, for the same reason.
- **No fabricated content.** The homepage has no testimonials (there is no review backend), no star ratings, no wishlist, no payment-method badges and no hard-coded discount percentage. The hero's "up to X% off" badge is computed from real `compareAtPrice` data and is not rendered when nothing is discounted; the Deals row appears only when products genuinely carry a saving; the Wholesale Deals row appears only when products genuinely carry an MOQ. The stats strip prints two figures, both read from live catalog facets — there is deliberately no product total, because the catalog API is cursor-paginated and any number would be the size of the slice the page fetched. Hero and category imagery come from the live catalog, not stock photography.

## Wholesale minimums (MOQ)

A minimum order quantity is set by tagging a Shopify product `moq:<n>`. The backend parses it (`storefront/catalog/moq.ts` in Trademart_B) and returns `minimumOrderQuantity` on every product summary; `null` means no minimum, never one.

The storefront surfaces it as an `MOQ n` badge and a "Min. order ₹X" line on the card, a wholesale terms block on the product page, a quantity field that **starts at the minimum**, and a cart stepper whose minus button stops there. None of that is enforcement. The backend re-derives the minimum from freshly read Shopify data at checkout and refuses the order with `MOQ_NOT_MET` (409) before payment — the frontend copy of the rule exists only so a customer cannot build a cart that is guaranteed to be rejected. `MOQ_NOT_MET` is the one error code whose backend message is shown verbatim, because it is the only one that names the product and its minimum.

## Stack

- Next.js 16 App Router
- React 19
- TypeScript 6 in strict mode
- Tailwind CSS 4
- `next/font` and `next/image`
- Vitest
- Razorpay Checkout in test mode during development

## Local setup

Requirements:

- Node.js 20.9 or newer
- A running Trademart_B instance with the public storefront routes enabled
- Razorpay test credentials configured in Trademart_B

```bash
cp .env.example .env.local
npm ci
npm run dev
```

Open `http://localhost:3000`.

Never place a Razorpay key secret, Shopify Admin token, Mongo connection string, or supplier credential in this application. Only variables prefixed with `NEXT_PUBLIC_` are available to the browser. The Razorpay public key ID is returned by the backend in the checkout session response (`keyId`) — no client-side env var is needed.

## Environment

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_STORE_NAME` | Public store name |
| `NEXT_PUBLIC_TRADEMART_API_URL` | Trademart_B public API origin (default port 4000) |
| `NEXT_PUBLIC_SITE_URL` | Canonical storefront URL |
| `NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD_PAISE` | Optional configured customer shipping threshold |
| `NEXT_PUBLIC_STANDARD_SHIPPING_PAISE` | Optional configured customer shipping charge |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | Optional displayed support email |
| `NEXT_PUBLIC_SUPPORT_PHONE` | Optional displayed support phone |

Commercial policy values are display hints only. Trademart_B computes the authoritative checkout snapshot and total.

## Quality checks

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## Razorpay test flow

1. Configure Razorpay test credentials in Trademart_B only.
2. Add a sellable product with an approved INR price to the cart.
3. Submit the guest checkout form.
4. Confirm the response amount and snapshot came from Trademart_B.
5. Complete Razorpay Checkout with an official test payment method.
6. Verify server-side signature validation, webhook reconciliation, and a single Shopify order.

Do not use a real payment method or production key without explicit authorization.

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Checkout flow](docs/CHECKOUT_FLOW.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Design audit](docs/DESIGN_AUDIT.md)
