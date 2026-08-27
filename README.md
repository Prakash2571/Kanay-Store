# Kanay Store

Kanay Store is the customer-facing ecommerce application for the Trademart commerce system. It is a separate Next.js application and does not contain operator tools or Shopify Admin credentials.

It is a **general-purpose retail and wholesale marketplace**, not a single-category brand: electronics and mobile accessories, home and kitchen, appliances, beauty and personal care, bags, watches, jewellery, toys, sports and fitness, office supplies, stationery, home decor, lighting, tools, automotive accessories, travel goods, gifts, seasonal lines, wholesale lots — and fashion as one category among them.

## Design system

White carries the page, blue carries structure and trust, orange is the action accent, and six soft tint families give categories and badges individual personality. One clean sans (Manrope). Tokens live in `src/app/globals.css`; `shell`, `section-y` and `no-scrollbar` set the 1680px centred column and the section rhythm, and `display-1/2/3`, `stat-figure` and `lead` set the fluid type scale.

Target balance: ~55–60% white, 15–20% light blue, 8–10% soft orange, 5–8% soft teal/green, small amounts of yellow and lavender, and the rest product photography. **Colour through details, not through large solid blocks.**

**The tints are deliberately deeper than a first instinct suggests.** The first pass used values like `#F8FAFC` canvas and `#EEF6FF` blue — a 1.03:1 and 1.09:1 difference from white, which is invisible on most screens below full brightness. The whole page read as white and the category colour coding did nothing. Every soft value sits one step deeper now, and every `-ink` pairing was re-measured against its deepened background (all clear 4.8:1+).

### The three-value rule

Every hue family has three values and they are not interchangeable:

|                 | purpose                                                  | contrast                              |
| --------------- | -------------------------------------------------------- | ------------------------------------- |
| `--tint-X`      | soft background — the value that gets **area**           | —                                     |
| `--tint-X-mark` | saturated — dots, rules, 2px bars. **Never behind text** | 2.0–3.5:1 on white                    |
| `--tint-X-ink`  | dark — text and meaningful icons                         | ≥5.5:1 on white _and_ on its own soft |

The same split applies to the two primaries, and in both cases it exists because the specified colour cannot do both jobs:

- **`--brand` (`#3B82F6`) vs `--brand-solid` (`#2563EB`).** White on `#3B82F6` is 3.68:1, which fails AA for the 14px bold labels every button uses. `--brand` decorates; `--brand-solid` is the button fill.
- **Orange buttons carry dark text.** White on `#F5824A` is 2.57:1. Darkening the orange enough to carry white text turns it rust and loses the warmth that is the point of having it. Dark ink on `#F5824A` is 6.79:1.

Badges follow the same logic: soft fill + dark ink, never saturated fill + white text.

### Category colour coding

Electronics blue · Home & Kitchen green · Accessories lavender · Beauty rose · Tools yellow · Office blue-grey · Fitness teal · Fashion orange. Unrecognised labels get neutral slate rather than a wrong colour.

The mapping lives in **one** table (`categoryTintFor` in `src/lib/storefront/showcase.ts`) because the entire value of colour coding is consistency — two components disagreeing about the colour of "Home" would destroy it. Colour lands on the card body and a 2px bar; typography stays dark. That is the line between colour-coded and childish.

> **Tailwind gotcha:** tint classes are written out in full (`bg-tint-blue`, not `bg-tint-${name}`). Tailwind v4 generates utilities by scanning source text, so a composed class name produces **no CSS at all**, renders unstyled, and throws nothing. `showcase.test.ts` asserts the class shapes for exactly this reason.

### Width and type scale

The content column is **1680px**. It went 1320 → 1360 → 1680 because on the 1920px displays this store is actually viewed on, 1360 left roughly 280px of empty page down each side and the column read as a document floating on a desktop. Paragraphs are capped in `ch` units, which is what lets the container grow without line length growing with it.

Display type is **fluid** (`clamp`) rather than stepped at breakpoints, defined once in `globals.css` as `display-1` (hero), `display-2` (banner/statement), `display-3` (section headings), `stat-figure` and `lead`. Two reasons it lives there instead of as `text-[clamp(...)]` classes: the scale is tunable in one place, and an arbitrary value Tailwind fails to parse renders at the default font size **with no error**.

**A display cap must be checked against the width of the column it sits in, not the width of the page.** `display-1` was briefly 4.15rem, which needed ~790px for "Everything you need." while the hero's text column is ~738px — the headline broke onto four lines and the hero grew tall enough to fill the viewport by itself. The caps are sized with a real margin against that column.

**`ch` units belong on paragraphs, not on wrappers or large headings.** `1ch` resolves against the _element's own_ font size, so `max-w-[46ch]` on a `<div>` is ~386px (inherited 16px) and on a 51px heading is ~1400px — neither is the line length it looks like. Paragraphs use `ch` because that is exactly where measuring in characters is meaningful; containers and display headings use `rem`.

**Grid counts are 2 / 3 / 4 / 6 and rows are capped at 12 items.** 12 divides by all four, so no breakpoint ends in a half-empty row. The old 5-column step was removed for exactly that reason — nothing sensible divides by both 5 and 6. If you change a column count, check the item cap with it.

### Other load-bearing rules

- **One theme, light.** No `.dark` block, no `prefers-color-scheme` inversion, no toggle. `color-scheme: light` is declared so the browser paints form controls, scrollbars and autofill to match. A dark variant was built and removed; the four contrast bugs it introduced are why one verified palette beats two.
- **No filter, opacity or blend mode on product imagery.** A tinted photograph misrepresents merchandise a buyer is judging from it.
- **Homepage image precedence is explicit.** Live Shopify product/collection imagery wins, then owner-supplied category files discovered in `public/categories/`, then reviewed Pexels photographs pinned to permanent numeric photo IDs, then the **restrained studio fallback** — a lit sweep in the department colour with a faint icon watermark. The brand banner follows the same owner-first rule through root-level `public/brand-story.*`, with its navy container underneath as the delivery-failure state. There is deliberately **no drawn product artwork**: two attempts (flat vector, then gradient-shaded) both read as cartoons. Source-page titles, subjects and licence links for every default photograph are recorded in `public/categories/README.md`; none uses a random/search endpoint. `scripts/add-category-photo.sh` and `add-category-photos.sh` validate owner-supplied URLs by HTTP status, content type and size. A local raster file wins without code changes, while SVG sources remain `unoptimized` in `next/image`.
- **No fabricated content.** No testimonials (no review backend), no star ratings, no wishlist, no payment-method badges, no hard-coded discount percentage, no invented tier pricing. There is deliberately **no "Best seller" badge** — Shopify's FEATURED sort is manual merchandising order and nothing records units sold, so the badge says "Featured", which is true.
- **Stats mix two kinds of figure.** Categories is _derived_ from live catalog facets. Daily buyers and product count are _static business figures_ stated by the owner, written as conservative floors, and never labelled live/current/today. See the comment in `StatsStrip.tsx`.

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

| Variable                                    | Purpose                                           |
| ------------------------------------------- | ------------------------------------------------- |
| `NEXT_PUBLIC_STORE_NAME`                    | Public store name                                 |
| `NEXT_PUBLIC_TRADEMART_API_URL`             | Trademart_B public API origin (default port 4000) |
| `NEXT_PUBLIC_SITE_URL`                      | Canonical storefront URL                          |
| `NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD_PAISE` | Optional configured customer shipping threshold   |
| `NEXT_PUBLIC_STANDARD_SHIPPING_PAISE`       | Optional configured customer shipping charge      |
| `NEXT_PUBLIC_SUPPORT_EMAIL`                 | Optional displayed support email                  |
| `NEXT_PUBLIC_SUPPORT_PHONE`                 | Optional displayed support phone                  |

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
