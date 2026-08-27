# Kanay Store

Kanay Store is the customer-facing ecommerce application for the Trademart commerce system. It is a separate Next.js application and does not contain operator tools or Shopify Admin credentials.

It is a **general-purpose retail and wholesale marketplace**, not a single-category brand: electronics and mobile accessories, home and kitchen, appliances, beauty and personal care, bags, watches, jewellery, toys, sports and fitness, office supplies, stationery, home decor, lighting, tools, automotive accessories, travel goods, gifts, seasonal lines, wholesale lots — and fashion as one category among them.

## Design system

White carries the page, blue carries structure and trust, and orange is the accent. One clean sans (Manrope) at compact ecommerce sizes. Tokens live in `src/app/globals.css`; the `shell`, `section-y` and `no-scrollbar` utilities defined there set the centred column (1360px) and the section rhythm, so every page lines up without repeating gutter classes.

Target balance: roughly two thirds white, a fifth pale blue (`#EEF6FF`), and orange in single-digit percentages.

The palette used to be peach on cream with an orange accent. It was clean, and it read as a beauty or skincare brand — warm blush *surfaces* plus a coral CTA is the visual grammar of cosmetics retail, which mis-sells a marketplace whose catalog is mostly electronics, appliances, tools and office supplies. The fix was not to remove warmth but to move it: blue owns the surfaces and the structure, orange owns a small, fixed set of jobs.

Rules that are load-bearing rather than stylistic:

- **Orange (`--accent`) is confined to a list**: the single most important CTA in a section, offer/sale/discount badges, small accent marks (a rule, a quote glyph, a nav underline), and eyebrow labels. Not section backgrounds, not every button, not headings. There is no separate amber family any more — discounts used to be amber while the accent was teal, which put three warm hues in competition for one job.
- **There is one theme, and it is light.** No `.dark` block, no `prefers-color-scheme` inversion, no toggle. `color-scheme: light` is declared so the browser paints form controls, scrollbars and autofill to match. A dark variant was built and removed; the four contrast bugs it introduced (navy text on near-black, white CTA labels on a near-white `--ink` fill, a white tick on light green, white on amber) are why one verified palette beats two.
- **Fills and text are separate tokens.** `--brand` and `--accent` sit behind white text; `--brand-ink` and `--accent-ink` are the same hues dark enough to *be* text on white. `--accent` is 2.3:1 on white, so an orange label written with the fill token is unreadable — the easiest mistake to make in this palette.
- **No filter, opacity or blend mode is ever applied to product imagery.** A dimmed or tinted photograph misrepresents merchandise a wholesale buyer is judging from it.
- **The homepage visual is photography, not icons.** Hero and category imagery come from live catalog images first. When the catalog cannot fill them, `src/lib/storefront/showcase.ts` supplies curated *category* photographs — see the note in that file for why category illustration is acceptable where a fabricated product card would not be. On a configured store with product images, none of it renders.
- **No fabricated content.** No testimonials (there is no review backend), no star ratings, no wishlist, no payment-method badges, no hard-coded discount percentage, no invented bulk tier pricing. The hero's "up to X% off" badge is computed from real `compareAtPrice` data and is not rendered when nothing is discounted; the Deals row appears only when products genuinely carry a saving; the Wholesale Deals row appears only when products genuinely carry an MOQ.
- **The stats strip mixes two kinds of figure and labels them differently.** Categories is *derived* from live catalog facets. Daily buyers and product count are *static business figures* stated by the store owner, written as conservative floors ("25+", "120+") and never described as live, current or real-time — there is no analytics pipeline and the catalog API is cursor-paginated with no total. See the comment in `StatsStrip.tsx` before changing them.

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
