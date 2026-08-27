# Kanay Store

Kanay Store is the customer-facing ecommerce application for the Trademart commerce system. It is a separate Next.js application and does not contain operator tools or Shopify Admin credentials.

It is a **general-purpose retail and wholesale marketplace**, not a single-category brand: electronics and mobile accessories, home and kitchen, appliances, beauty and personal care, bags, watches, jewellery, toys, sports and fitness, office supplies, stationery, home decor, lighting, tools, automotive accessories, travel goods, gifts, seasonal lines, wholesale lots — and fashion as one category among them.

## Design system

Bright off-white page, white cards, soft peach surfaces, orange accent, near-black text, one clean sans (Manrope) at compact ecommerce sizes. Tokens live in `src/app/globals.css`; the `shell`, `section-y` and `no-scrollbar` utilities defined there set the 1320px centred column and the section rhythm, so every page lines up without repeating gutter classes.

Two rules that are load-bearing rather than stylistic:

- **No dark page background and no `prefers-color-scheme: dark` inversion.** There used to be one, and it turned the storefront black on any device in dark mode — a second identity nobody designed.
- **No fabricated content.** The homepage has no testimonials (there is no review backend), no star ratings, no wishlist, no payment-method badges and no hard-coded discount percentage. The hero's "up to X% off" badge is computed from real `compareAtPrice` data and is not rendered when nothing is discounted; the Deals row appears only when products genuinely carry a saving. Hero and category imagery come from the live catalog, not stock photography, so the page shows what the store actually sells.

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
