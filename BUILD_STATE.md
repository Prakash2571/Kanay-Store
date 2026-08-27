# Kanay Store Build State

> Cross-repository handoff. Another agent must be able to resume from this file plus the
> repositories. Keep it current: before/after each milestone, on contract or schema change,
> after tests, after commits, and before stopping.

## Current checkpoint

Recovery session 2026-08-26. Local state inspected and preserved. No reset, clean, checkout,
stash, or restore was run.

Headline findings:

1. Kanay-Store local `main` is exactly equal to the known pushed checkpoint
   `0ce6453f85ddb7b7dfd45ee36fafe2e49e7e8bfc`. Working tree clean. Nothing was lost.
2. Trademart_B has SUBSTANTIAL UNCOMMITTED LOCAL WORK that is AHEAD of GitHub: a new
   `src/storefront/` module (30 files, ~4,200 lines), 3 new Mongo models, a new
   `variant.mapping.ts` + test, and 8 modified tracked files. This is the public customer
   commerce backend. It is NOT committed and NOT pushed. PRESERVE IT.
3. The Trademart_B storefront module is NOT mounted in `src/app.ts`. It is therefore dead
   code at runtime: no `/api/storefront/*` route is currently reachable.
4. Trademart_B typecheck fails with exactly 2 errors, both in
   `src/storefront/checkout/catalog-checkout.adapter.ts`.
5. The backend catalog DTOs and the Kanay frontend Zod schemas DISAGREE. This is the main
   integration blocker. Detail under "API contracts".
6. `BUILD_STATE.md` previously lived OUTSIDE any repository at `/home/ubuntu/store/BUILD_STATE.md`,
   which is why it was never pushed. It now lives at `kanaystore/BUILD_STATE.md` (tracked).
   The old file is retained for history until this one is committed.

## Local repository state

Verified with `git status --short --branch`, `git rev-parse HEAD`, `git rev-parse origin/main`,
`git branch -vv`, `git log --oneline --decorate -15`, `git diff --stat`, `git diff --cached --stat`.

### Kanay-Store

- path: `/home/ubuntu/store/kanaystore`
- remote: `https://github.com/Prakash2571/Kanay-Store.git`
- branch: `main` (tracking `origin/main`)
- HEAD: `0ce6453f85ddb7b7dfd45ee36fafe2e49e7e8bfc` (`first commit`)
- previous commit: `c2dcddb chore: bootstrap kanay storefront`
- origin/main: `0ce6453f85ddb7b7dfd45ee36fafe2e49e7e8bfc`
- dirty: NO (clean; `git diff` and `git diff --cached` both empty)
- ahead/behind: IN SYNC (0 ahead, 0 behind)
- note: branch `feat/kanay-storefront-v1` referenced in the old handoff no longer exists;
  the work was landed on `main`. Do not try to recreate that branch over `main`.

### Trademart_B

- path: `/home/ubuntu/store/trade/Trademart_B`
- remote: `https://github.com/Prakash2571/Trademart_B`
- branch: `feat/kanay-public-storefront` (NO upstream tracking branch yet)
- HEAD: `6d231db8428aef76c8d448367d204532f8658b61`
  (`Merge #17: operator plaintext OPERATOR_PASSWORD login`)
- origin/main: `6d231db8428aef76c8d448367d204532f8658b61`
- dirty: YES, heavily. See "Files changed".
- ahead/behind: HEAD is EQUAL to `origin/main` in commits (0 ahead, 0 behind), but the
  WORKING TREE IS AHEAD via uncommitted changes. All storefront value is uncommitted.
- other local branches: `main` (= origin/main), `feat/docker-compose-deployment`
  (`2178b74`, tracks origin)

### Trademart_F

- path: `/home/ubuntu/store/trade/Trademart_F`
- branch: `main` (tracking `origin/main`)
- HEAD: `e266cb15d2fe3d3e0852377087541cb54d197c9e`
  (`Merge #10: sliding sidebar + top-aligned nav header`)
- origin/main: `e266cb15d2fe3d3e0852377087541cb54d197c9e`
- dirty: NO
- ahead/behind: IN SYNC
- role: operator/admin application only. MUST NOT become the customer storefront.

## Architecture decisions

Carried forward from the previous session and still binding:

- Kanay Store is a separate customer-facing Next.js application. Trademart_F stays operator-only.
- Trademart remains authoritative for sellability, pricing, FX, sourceability, checkout
  snapshots, payment verification, and order orchestration. The browser is never a
  commercial authority.
- Shopify remains the product/variant/order/fulfillment/tracking record. Razorpay processes
  payments. The supplier (Tradelle or other) stays behind Trademart and Shopify.
- Trademart_B is Express 4, TypeScript 5.7, Mongoose 8, Shopify GraphQL Admin API `2026-07`.
  No `razorpay` npm package: the Razorpay client is hand-rolled over `fetch` + `node:crypto`.
- Success envelope `{ success: true, data, meta? }`; failure `{ success: false, code, message, details? }`.
- A single fail-closed sellability evaluator serves both catalog projection and checkout
  revalidation: `src/storefront/catalog/sellability.ts` / `evaluateStorefrontSellability`.
- Integer money only. `normalizeInrAmount` returns a strict decimal string;
  `inrAmountToPaise` returns `bigint | null`. No floating-point payment arithmetic.
- Admin `ProductDto`/`OrderDto` are unsafe for the public surface. Separate safe DTOs exist
  in `src/storefront/catalog/types.ts`.

Decisions made or confirmed in THIS session:

- The uncommitted Trademart_B storefront module is the correct foundation and will be
  continued, not rewritten.
- `BUILD_STATE.md` must live inside the Kanay-Store repository to be pushable. Moved.
- CONTRACT DIRECTION: the backend will be aligned to the already-built, already-tested Kanay
  frontend Zod contract, because the frontend is further along and the task brief (Step 8 and
  Step 12) explicitly names `shopifyProductId` and `shopifyVariantId` in the public shape.
  Shopify product/variant GIDs are not secrets (Shopify's own Storefront API exposes them),
  so exposing them does not violate the Step 8 privacy list. The opaque `kp_`/`kc_` public ids
  are RETAINED alongside them, so the durable mapping identity is preserved.
  Supplier cost, source URLs, supplier IDs, research/confidence scores, profit, margin,
  audit data, `pushIntent`, and raw Shopify Admin metadata remain excluded.

### Tasteskill

Approved dials remain, and are NOT to be re-asked:

`DESIGN_VARIANCE: 7`
`MOTION_INTENSITY: 4`
`VISUAL_DENSITY: 7`

Direction (revised — supersedes the earlier "premium fashion/lifestyle" direction, which
mis-sold a multi-category catalog as an apparel label):

General-purpose WHOLESALE + retail marketplace. White-led, blue structure, orange action accent,
six soft tint families for category coding.

Superseded three times. (1) Peach/cream + orange #F28C5B read as beauty/skincare. (2) All-blue was
trustworthy but cold and its hero fell back to an icon grid, which read as a wireframe. (3) Blue +
orange only was still visually flat.

Palette: white #FFFFFF on #F8FAFC, light blue #EEF6FF, blue #3B82F6 (decor) / #2563EB (button
fill), orange #F5824A (hover #EA6F33, soft #FFF0E6, ink #9A4A16), teal #E8F7F4/#149A8A/#0B6B5F,
yellow #FFF8D9/#E9A900/#855C00, lavender #F2EEFF/#7567D8/#4C3FA8, green #EDF8EE/#4D9A58/#2F6B38,
rose #FFF1EC/#D9705C/#9C4A3C, slate #F1F5F9/#64748B/#475569. Quote surface #F2F7FF, newsletter
#FFF2E8, footer #182230. Target ~55-60% white / 15-20% light blue / 8-10% soft orange / 5-8% soft
teal-green / traces of yellow+lavender / rest photography.

THREE VALUES PER FAMILY, NOT INTERCHANGEABLE:
  --tint-X        soft background, gets AREA
  --tint-X-mark   saturated, decoration ONLY, never behind text (2.0-3.5:1 on white)
  --tint-X-ink    dark, text and meaningful icons (>=5.5:1 on white and on its own soft)

Same split on the primaries, both forced by measured contrast: white on #3B82F6 is 3.68:1 (fails
AA for 14px bold), so --brand decorates and --brand-solid #2563EB is the button fill. White on
#F5824A is 2.57:1, so ORANGE BUTTONS CARRY DARK INK (6.79:1) - do not "fix" this to white.
Badges are soft fill + dark ink, never saturated fill + white text.

CATEGORY CODING (one table, categoryTintFor in lib/storefront/showcase.ts): Electronics blue,
Home & Kitchen green, Accessories lavender, Beauty rose, Tools yellow, Office slate, Fitness teal,
Fashion orange; unrecognised -> slate. Colour on card body + 2px bar only, typography stays dark.

TAILWIND GOTCHA: tint classes must be written out in full. `bg-tint-${name}` generates NO CSS,
renders unstyled and throws nothing. showcase.test.ts asserts the class shapes.

ONE THEME, LIGHT. No .dark block, no prefers-color-scheme inversion, no toggle, no pre-paint theme
script. A dark variant was built and removed at the client's request; NOT to be re-added. NO
filter/opacity/blend on product imagery.

Content width 1680px (was 1320 -> 1360; 1360 left ~280px dead each side on the 1920px displays
this is viewed on). Shell padding 1/1.5/2/2.5rem. Section rhythm 56px mobile / 80px desktop /
88px at 2xl.

FLUID TYPE SCALE in globals.css, not per-breakpoint classes: display-1 (hero,
clamp 2.1-4.15rem), display-2 (banner/statement, 1.75-3.1rem), display-3 (section headings,
1.3-1.95rem), stat-figure (1.7-2.7rem), lead (0.95-1.15rem). Defined as @utility rather than
text-[clamp(...)] so the scale is tunable in one place and cannot silently fail to parse.

GRID DIVISIBILITY RULE: product/category grids are 2 / 3 / 4 / 6 columns and rows are capped at
12 items, because 12 divides by all of them and no breakpoint ends in a half-empty row. The old
xl:grid-cols-5 step was REMOVED for this reason - nothing sensible divides by both 5 and 6. Change
a column count and you must re-check the item cap.

PHOTOGRAPHY: hero is an asymmetric 4-photo collage (featured tile spanning 2 rows + 3 supporting;
tiles exactly at both breakpoints). Category rail is image-backed tinted cards, 2/4/6 across. Live
catalog images lead; showcase.ts supplies curated CATEGORY photos (images.unsplash.com, already in
next.config remotePatterns and CSP img-src) only as fallback. departmentFor returns null rather
than guessing. Tints sit BEHIND photos so a bad URL degrades to a designed card - the URLs could
not be verified from the build environment.

BRAND STORY BANNER (BrandStory.tsx): full-width-in-shell photographic trust section, stacked
shipping cartons, navy overlay (--overlay 52% flat + a directional --overlay-strong gradient on the
content side only, so the far side of the photo stays bright). min-h 22/25/28rem. Navy gradient is
painted by the CONTAINER, so a failed image leaves a readable navy panel. Deliberately NOT
edge-to-edge - wider than header/footer/product rows would read as an embedded advert. No person as
focus: that is what turns a trust banner into a lifestyle campaign.

NO "BEST SELLER" BADGE. Shopify FEATURED is manual merchandising order and nothing records units
sold. The featured row badge says "Featured" (yellow); the newest row says "New" (lavender). Both
true.

Homepage order: service strip -> header -> hero -> stats strip -> category cards -> promo (1 large
mint left + 2 stacked blue/orange right) -> best sellers [Featured] -> wholesale deals -> wholesale
banner -> new arrivals [New] -> deals -> why-Kanay benefits (tinted icon discs) -> BRAND STORY
BANNER -> brand quote (#F2F7FF, big orange quote mark) -> services strip -> newsletter (#FFF2E8).

Composition rule: sections must NOT all be equal-size bordered boxes. Stats is a divided strip with
small coloured dots, benefits are tinted discs with no card, promo is asymmetric, services is a
bordered strip, brand story is photographic.

STATS: categories is DERIVED from live catalog facets. Daily buyers (25+) and wholesale products
(120+) are STATIC BUSINESS FIGURES stated by the owner, conservative floors, never labelled
live/current/today and never made precise. See the comment block in StatsStrip.tsx.

Wholesale MOQ: source of truth is the Shopify product tag `moq:<n>`, parsed by the backend and
enforced at checkout (`MOQ_NOT_MET`, 409) against freshly read data. Frontend shows the badge,
the minimum order value, a quantity field that STARTS at the minimum and a cart stepper that
stops there — presentation only, never the control. Quantity caps are 10,000 at both ends
(they were 10, which made wholesale impossible and any `moq:>10` product unbuyable).

No fabricated content anywhere: no testimonials (no review backend), no star ratings, no
wishlist, no payment-method badges, no invented discount percentage, no fake newsletter
confirmation, no invented bulk tier pricing, and NO product/buyer/supplier counts in the stats
strip — the catalog API is cursor-paginated and returns no total, so the only figures printed
are the store-wide category count and lowest catalog price, both read from live filter facets.
The navy quote band is the store's own positioning statement, attributed to nobody, which is
the honest version of a testimonial section on a store with no reviews.

Final Design Audit: STILL PENDING. Must not be marked PASS until rendered responsive pages
are actually inspected at 375 / 390 / 430 / 768 / 1024 / 1440.

## Completed

Kanay-Store (committed, on `main` at `0ce6453`):

- [x] Next.js App Router + TypeScript + Tailwind + `next/font` bootstrap.
- [x] Routes: `/`, `/shop`, `/collections/[handle]`, `/products/[handle]`, `/search`, `/cart`,
      `/checkout`, `/order/success`, `/track-order`, `/track/[token]`, `/api/health`.
- [x] Typed Zod storefront API layer: `types.ts`, `catalog.ts`, `products.ts`,
      `collections.ts`, `checkout.ts`, `orders.ts`, `money.ts`.
- [x] Local persistent cart with exact Shopify product/variant IDs and integer-paise totals.
- [x] Guest checkout form + validation, Razorpay Checkout browser integration.
- [x] Secure tracking UI (token length >= 32 enforced client-side).
- [x] Tests: `cart.test.ts`, `checkout.test.ts`, `orders.test.ts`, `money.test.ts`.
- [x] Dockerfile, `.dockerignore`, `docs/ARCHITECTURE.md`, `docs/CHECKOUT_FLOW.md`,
      `docs/DEPLOYMENT.md`, `docs/DESIGN_AUDIT.md`.
- [x] No fake ratings, no fabricated testimonials. Preserve this honesty.

Trademart_B (UNCOMMITTED, working tree only):

- [x] `src/storefront/catalog/` — repository, service, router, projection, sellability,
      Shopify catalog reads, safe DTO types, sellability tests.
- [x] `src/storefront/checkout/` — controller, service, repository, snapshot, validation,
      types, catalog revalidation adapter, `StorefrontError`.
- [x] `src/storefront/payments/` — Razorpay client, config, signature verification, webhook
      receiver, webhook queue, payment service, payment repository.
- [x] `src/storefront/orders/` — Shopify order adapter + mutation, order orchestrator,
      orders controller, tracking token, tracking service.
- [x] `src/database/models/CheckoutSession.ts`, `PaymentAttempt.ts`, `RazorpayWebhookEvent.ts`.
- [x] `src/intelligence/variant.mapping.ts` + `variant.mapping.test.ts` — the truthful
      supplier -> verified -> Shopify -> public variant mapping.
- [x] Research draft-push variant collapse addressed in `push.draft.ts` and the push
      orchestrator/ports/service, with `pushedVariantMappings` persisted on `ProductCandidate`.

## In progress

Recovery session milestone: make the uncommitted Trademart_B storefront module actually
reachable, type-correct, and contract-compatible with the built Kanay frontend.

Ordered sub-tasks:

1. Fix the 2 typecheck errors in `catalog-checkout.adapter.ts`.
2. Align backend catalog DTOs/projection to the Kanay Zod contract.
3. Mount the storefront routers in `src/app.ts` outside operator auth, with the Razorpay
   webhook receiver ahead of `express.json()`, plus a storefront CORS origin and
   storefront-specific rate limits.
4. Add `expectedUnitPricePaise` handling for PRICE_CHANGED UX (already in backend
   `RequestedCheckoutLine`; frontend does not send it yet).
5. Resolve the `.env.example` port mismatch and the duplicate Razorpay key id.
6. Run the full test matrices.

## Remaining

1. Backend catalog contract alignment + router mounting + CORS/rate limits.
2. Checkout/payment/order orchestration end-to-end verification.
3. Razorpay webhook replay + browser-close recovery proof.
4. Shopify order idempotency proof (one paid session -> at most one Shopify order, ever).
5. Secure guest tracking + enumeration refusal proof.
6. Frontend run against the real development backend with real catalog data.
7. Full test matrices in both repositories.
8. Visual polish, then the Tasteskill final audit and `docs/DESIGN_AUDIT.md`.
9. Commit and push feature branches. Never force-push main.
10. Honest readiness and integration-limitation record.

## Files changed

### Kanay-Store

`BUILD_STATE.md` — NEW this session. The authoritative handoff, now inside the repo.

### Trademart_B — modified tracked files (uncommitted, `git diff --stat`)

```
 src/database/models/ProductCandidate.ts | 68 +++++++++++++++++++++-------
 src/intelligence/push.draft.ts          | 17 ++++-----
 src/intelligence/push.orchestrator.ts   | 46 +++++++++++++++++++++-
 src/intelligence/push.ports.ts          |  9 ++++-
 src/intelligence/push.service.ts        |  7 ++++
 src/shopify/graphql/product.queries.ts  |  4 ++
 src/shopify/shopify.mappers.ts          |  1 +
 src/shopify/shopify.types.ts            |  3 ++
 8 files changed, 129 insertions(+), 26 deletions(-)
```

`git diff --cached` is EMPTY. Nothing is staged.

### Trademart_B — untracked new files (uncommitted)

```
src/database/models/CheckoutSession.ts          120 lines
src/database/models/PaymentAttempt.ts            34
src/database/models/RazorpayWebhookEvent.ts      49
src/intelligence/variant.mapping.ts            314
src/intelligence/variant.mapping.test.ts       198
src/storefront/catalog/catalog.repository.ts   181
src/storefront/catalog/catalog.router.ts       103
src/storefront/catalog/catalog.service.ts      236
src/storefront/catalog/index.ts                 10
src/storefront/catalog/projection.ts           257
src/storefront/catalog/sellability.test.ts     151
src/storefront/catalog/sellability.ts          171
src/storefront/catalog/shopify.catalog.ts      323
src/storefront/catalog/types.ts                 82
src/storefront/checkout/catalog-checkout.adapter.ts  209
src/storefront/checkout/checkout.controller.ts       152
src/storefront/checkout/checkout.repository.ts       237
src/storefront/checkout/checkout.service.ts          141
src/storefront/checkout/checkout.snapshot.ts         125
src/storefront/checkout/checkout.types.ts            189
src/storefront/checkout/checkout.validation.ts       152
src/storefront/checkout/storefront.error.ts           40
src/storefront/orders/order.orchestrator.ts           85
src/storefront/orders/orders.controller.ts            38
src/storefront/orders/shopify-order.adapter.ts       277
src/storefront/orders/shopify-order.mutation.ts       39
src/storefront/orders/tracking-token.ts               42
src/storefront/orders/tracking.service.ts            192
src/storefront/payments/payment-webhook.queue.ts     131
src/storefront/payments/payment.repository.ts         64
src/storefront/payments/payment.service.ts           245
src/storefront/payments/razorpay.client.ts           215
src/storefront/payments/razorpay.config.ts            47
src/storefront/payments/razorpay.signature.ts         60
src/storefront/payments/razorpay.webhook.ts           63
deploy/.env.bak                                  PRE-EXISTING, DO NOT TOUCH
```

## API contracts

### Backend routes DEFINED but NOT MOUNTED

`src/storefront/catalog/catalog.router.ts` defines, expecting to be mounted under `/api`:

- `GET /api/storefront/catalog?limit&cursor&query&collection&productType&availability&sort`
- `GET /api/storefront/products/:handle`
- `GET /api/storefront/collections`
- `GET /api/storefront/collections/:handle?limit&cursor&sort`

`src/app.ts` contains NO reference to any storefront router. Confirmed by grep: the only
`storefront` matches in `src/app.ts`, `src/server.ts`, and `src/config/*.ts` are two unrelated
comments in `src/config/env.validation.ts` about a price/visibility kill switch.

### CONTRACT MISMATCH — backend DTO vs frontend Zod schema

This is the blocking integration defect. Frontend
`kanaystore/src/lib/storefront/types.ts` vs backend
`Trademart_B/src/storefront/catalog/types.ts`:

| Field | Frontend expects | Backend currently emits | Action |
| --- | --- | --- | --- |
| `shopifyProductId` | required string | ABSENT | ADD to backend |
| `shopifyVariantId` | required string on variant | ABSENT | ADD to backend |
| `descriptionExcerpt` | string, defaulted | ABSENT | ADD to backend |
| `images` on summary | array of image | only `featuredImage` | ADD `images[]` to summary |
| `priceRange` | `{ min: Money, max: Money }` where Money is `{ amount, currencyCode }` | `{ min: string, max: string, currencyCode }` | RESHAPE backend |
| `compareAtPriceRange` | `{ min: Money, max: Money }` | `{ min: string, max: string, currencyCode }` | RESHAPE backend |
| `availability` on summary | required enum | ABSENT on summary | ADD to backend |
| `collections[]` | `{ id, handle, title }` | `{ handle, title }` | ADD `id` |
| variant options | `selectedOptions: [{name,value}]` | `options: Record<string,string>` | ADD `selectedOptions[]` |
| variant `image` | optional image | ABSENT | ADD to backend |
| `filters` | `{ collections: collectionSummary[], productTypes: string[], priceRange? }` | `{ productTypes: string[], collections: {handle,title}[] }` | RESHAPE backend |
| `seo` | `{ title?, description? }` nullable | `{ title, description }` required | compatible, no change |
| collection `description` | string, defaulted | optional | compatible, no change |

Checkout identifier mismatch:

- Frontend `POST /api/storefront/checkout` sends `cartLines[].shopifyProductId` and
  `cartLines[].shopifyVariantId`.
- Backend `RequestedCheckoutLine` expects `productId` and `variantId` (the opaque `kp_`
  public ids), and `catalog-checkout.adapter.ts` resolves `line.variantId` against
  `ProductCandidate.pushedVariantMappings[].publicVariantId`.
- RESOLUTION: backend accepts BOTH. The public opaque id stays the durable mapping identity;
  `shopifyVariantId` is accepted and cross-checked against the resolved mapping so a
  browser-supplied Shopify id can never select a different variant than the mapping allows.

### Contracts confirmed ALREADY MATCHING

`POST /api/storefront/checkout` response, from backend `CreateCheckoutResponse`:

```ts
{
  checkoutSessionId: string;
  statusToken: string;
  razorpayOrderId: string;
  amountPaise: number;
  currency: 'INR';
  keyId: string;
  summary: {
    items: { title; variantTitle; quantity; unitPricePaise; lineTotalPaise; image? }[];
    subtotalPaise; shippingPaise; discountPaise; taxPaise; totalPaise;
  };
}
```

This matches the frontend expectation recorded in the previous handoff. PRESERVE IT.

Backend checkout status values, from `CHECKOUT_STATUSES`:

```
CREATED | PAYMENT_PENDING | PAYMENT_PAID | ORDER_PENDING | ORDER_CREATING | ORDER_CREATED | REFUNDED
```

NOTE: the frontend expects `PAYMENT_PENDING | PAID | ORDER_PENDING | COMPLETE`. A mapping
layer is required at the public boundary. Backend internal state stays richer.
`PAYMENT_PAID` -> `PAID`, `ORDER_CREATED` -> `COMPLETE`, `ORDER_CREATING` -> `ORDER_PENDING`,
`CREATED` -> `PAYMENT_PENDING`.

`RequestedCheckoutLine.expectedUnitPricePaise` ALREADY EXISTS in the backend types as an
optional display-snapshot field, documented as "A mismatch is returned as PRICE_CHANGED".
The frontend does not send it yet. It is never trusted as the charge amount.

## Environment variables

Names only. No secret values have been read or recorded.

Kanay-Store (`.env.example`, tracked):

- `NEXT_PUBLIC_TRADEMART_API_URL`
- `NEXT_PUBLIC_STORE_NAME`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_RAZORPAY_KEY_ID` — SUSPECTED UNUSED; checkout takes `keyId` from the backend
  checkout session response. To be removed if confirmed unused (two sources of truth for the
  same public key is misleading configuration).
- `NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD_PAISE`
- `NEXT_PUBLIC_STANDARD_SHIPPING_PAISE`
- `NEXT_PUBLIC_SUPPORT_EMAIL`
- `NEXT_PUBLIC_SUPPORT_PHONE`

Trademart_B, required additions:

- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET` — server only, never sent to Kanay Store
- `RAZORPAY_WEBHOOK_SECRET` — server only, never sent to Kanay Store
- `STOREFRONT_URL` — the public Kanay Store origin, separate from operator `FRONTEND_URL`

PORT MISMATCH TO RESOLVE: Kanay `.env.example` points at `http://localhost:3001`;
Trademart_B's historical default server port is 4000. Actual backend config must be read and
the examples made to agree, or the divergence documented.

## Database/schema changes

New Mongo models, uncommitted:

- `CheckoutSession` (120 lines) — checkout/payment orchestration. Holds the frozen snapshot,
  integer paise totals, Razorpay ids, status, Shopify order ids, `statusTokenHash`,
  `trackingTokenHash`, order attempt/lease/retry fields.
- `PaymentAttempt` (34 lines)
- `RazorpayWebhookEvent` (49 lines) — webhook dedupe by event identity.

`ProductCandidate` modified to persist `pushedVariantMappings` (the durable supplier ->
Shopify -> public variant mapping) and `pushedShopifyProductId`.

Token handling: only HASHES of the long-lived public status/tracking bearer tokens are
persisted (`statusTokenHash`, `trackingTokenHash`). Raw tokens are returned once to the client.

Indexes and the one-paid-session-one-order unique constraint still need verification.

## Commands successfully run

This session, all read-only except the BUILD_STATE.md write:

- `pwd`, `ls -la` in `/home/ubuntu/store` and `/home/ubuntu`
- `find /home/ubuntu -maxdepth 4 -name .git -type d` — located the three repositories
- `find /home/ubuntu/store -name BUILD_STATE.md` — found only the out-of-repo copy
- `git status --short --branch`, `git remote -v`, `git log --oneline --decorate -15`,
  `git branch -vv`, `git diff --stat`, `git diff --cached --stat`, `git rev-parse HEAD`,
  `git rev-parse origin/main` in all three repositories
- `git ls-files` in Kanay-Store — enumerated the 74 tracked files
- `find src/storefront -type f` + `wc -l` in Trademart_B — inventoried the uncommitted module
- `grep -rn storefront src/app.ts src/server.ts src/config/*.ts` — proved the module is unmounted
- `npm run typecheck` in Trademart_B — reproduced exactly 2 errors

## Failed commands

- `npm run typecheck` in Trademart_B currently reports 2 errors, both in
  `src/storefront/checkout/catalog-checkout.adapter.ts`:
  - line 164 `TS2322`: `unitPricePaise` is `bigint` but `AuthoritativeCheckoutLine`
    declares `number`. `inrAmountToPaise` returns `bigint | null`.
  - line 182 `TS2339`: `Property 'id' does not exist on type 'never'`. The local
    `CheckoutRawProduct` helper type uses
    `RawCatalogProduct['variants'] extends { nodes?: infer T } ? T : never`, which resolves to
    `never` because `variants` is `{ nodes?: RawCatalogVariant[] | null } | null | undefined`
    and the `| null | undefined` prevents the conditional from matching.

## Known problems

- Storefront module is unreachable: not mounted in `src/app.ts`.
- 2 typecheck errors, above.
- Backend/frontend catalog DTO mismatch, tabulated under "API contracts".
- Public checkout status vocabulary differs between backend internals and the frontend.
- CORS currently allows exactly one origin, `config.frontendUrl`, with `credentials: true`.
  The public storefront needs its own origin entry and must NOT be credentialed.
  Kanay uses `credentials: omit`, which is correct for guest commerce.
- Rate limiting is one global `/api` limiter at 300/min. Public checkout, payment
  verification, and tracking need their own tighter limits.
- No storefront tests exist yet beyond `sellability.test.ts` and `variant.mapping.test.ts`.
- Razorpay, Shopify development-store, and dropship credentials have not been validated.
- Kanay `.env.example` port mismatch and duplicate Razorpay key id, above.
- Product reads fetch 100 variants; a public projection must define explicit limits rather
  than silently truncating.
- Editorial image licensing plan not finalized. Product imagery must come from real Shopify media.

## Important assumptions

- `DESIGN_APPROVAL_REQUIRED=false`. The 7/4/7 dials are already approved; do not re-ask.
- `/home/ubuntu/store/kanaystore` is the Kanay-Store working copy despite the name casing.
- Trademart_F never becomes the storefront, and its operator cookies never cross into Kanay.
- Browser cart prices are display snapshots only. The backend always charges its own
  authoritative recomputed price.
- `Trademart_B/deploy/.env.bak` is pre-existing and untracked. Do not read, stage, modify,
  or delete it.
- Shopify product/variant GIDs are not secrets and may appear in the public contract.
  Supplier identity, cost, and internal scoring may not.

## Integration verification

Razorpay:
NOT VERIFIED

Shopify order creation:
NOT VERIFIED

Tradelle fulfillment:
NOT VERIFIED

No external credential has been exercised in this session. Nothing about live payment,
order creation, or supplier recognition may be claimed.

## Completion conditions status

All UNPROVEN. None may be claimed until demonstrated by a passing test or a real run.

- A. supplier unavailable blocks checkout — UNPROVEN (evaluator exists, path not wired)
- B. browser price tampering ignored — UNPROVEN (backend recomputes; no test yet)
- C. unavailable variant refused — UNPROVEN
- D. payment succeeds then browser closes — UNPROVEN (webhook queue exists, unmounted)
- E. duplicate Razorpay event yields one Shopify order — UNPROVEN
- F. Shopify fails after payment, no second charge — UNPROVEN
- G. guest purchase without account — UNPROVEN end to end
- H. tracking token works without login — UNPROVEN
- I. guessing order ids reveals nothing — UNPROVEN
- J. foreign supplier currency never reaches the customer — PARTIAL, `PRICE_NOT_INR` in
  `evaluateStorefrontSellability` fails closed, but untested end to end

## RESUME HERE

Exact next task:
Fix the 2 typecheck errors, align the backend catalog projection to the Kanay Zod contract,
then mount the storefront routers in `src/app.ts` outside operator auth.

Exact files:
- `/home/ubuntu/store/trade/Trademart_B/src/storefront/checkout/catalog-checkout.adapter.ts`
  (bigint -> number at line ~164; replace the broken `CheckoutRawProduct` conditional type)
- `/home/ubuntu/store/trade/Trademart_B/src/storefront/catalog/types.ts`
- `/home/ubuntu/store/trade/Trademart_B/src/storefront/catalog/projection.ts`
- `/home/ubuntu/store/trade/Trademart_B/src/app.ts`
- `/home/ubuntu/store/trade/Trademart_B/src/config/index.ts` and `env.validation.ts`
- `/home/ubuntu/store/kanaystore/src/lib/storefront/types.ts` (reference only, do not weaken)

Exact command:
`cd /home/ubuntu/store/trade/Trademart_B && npm run typecheck`

Expected result:
Zero typecheck errors, then `/api/storefront/catalog` reachable without an operator session
and returning a payload that the frontend `catalogDataSchema` parses successfully.
