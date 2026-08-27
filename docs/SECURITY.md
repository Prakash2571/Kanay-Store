# Security notes: tokens, headers and what the browser is trusted with

Kanay Store holds **no** Shopify credentials, no Razorpay secret, no database connection
and no supplier credential. It has exactly one privileged thing to look after: the order
tokens the backend issues. This documents how they are handled and where the remaining
sharp edges are.

## The two tokens

| Token | Issued by | Grants | Lifetime |
| --- | --- | --- | --- |
| `statusToken` | `POST /api/storefront/checkout` | read the status of **that** checkout | until the checkout record expires |
| `trackingToken` | `POST /api/storefront/payments/verify` | read **that** order's status, items, masked email and address summary | as long as the order exists |

Both are 43-character base64url HMAC values. The backend stores only their hashes and
compares in constant time, so a leak of the database does not yield working tokens. On
this side they are **bearer credentials**: whoever holds one can read that order. Every
rule below follows from that one fact.

## Where a token is allowed to exist

| Place | Allowed | Why |
| --- | --- | --- |
| In flight to the Trademart API | yes | that is the point |
| The URL of the confirmation page, on arrival | yes, briefly | the page is server-rendered, so the token must arrive with the request |
| The URL after hydration | **no** | `StripSensitiveParams` removes it with `history.replaceState` |
| `sessionStorage` | yes, one entry | so an interrupted checkout can be resumed in the same tab |
| `localStorage` | **no** | it persists after the tab closes and is readable by any script on the origin |
| An analytics event | **no** | the allow-list in `lib/analytics/events.ts` cannot carry one, by construction |
| A `console.log` | **no** | there are no `console` calls in `src/` |
| Rendered metadata | **no** | order pages are `robots: noindex, nofollow` and render no token into head tags |
| A Next.js cache entry | **no** | both order pages are `force-dynamic` and the upstream fetch is `cache: "no-store"` |

The last row is the one worth restating: a cached render of an order page would serve one
customer's name, address and items to the next request for the same URL — and since the
URL *is* the credential, anything that stores a response keyed by it is a leak.

## Browser navigation

- Navigating to the confirmation page uses `router.replace`, not `push`, so the
  token-bearing URL is never a back-button entry.
- `StripSensitiveParams` then rewrites the current entry, so pressing Back after
  hydration cannot resurrect it either.
- The rewrite is idempotent and skips the history write when there is nothing to strip
  (`stripSensitiveParams` returns `changed: false`), so it does not churn on every
  render.

## Response headers

Set for every response in `next.config.ts`:

| Header | Value | Reason |
| --- | --- | --- |
| `Referrer-Policy` | `no-referrer` | order URLs carry a token; the browser default still sends the origin to the Razorpay script and the image CDN |
| `X-Content-Type-Options` | `nosniff` | stop a response being reinterpreted as script |
| `X-Frame-Options` | `SAMEORIGIN` | this storefront frames Razorpay; nothing needs to frame this storefront |
| `Permissions-Policy` | camera/mic/geolocation/interest-cohort all denied | no feature here uses them |
| `Content-Security-Policy-Report-Only` | see below | evaluated, not enforced |

### Why the CSP is report-only

A CSP that breaks Razorpay Checkout breaks it at the exact moment a customer tries to
pay — the most expensive place in the application to be wrong, and one that cannot be
verified from a build. Razorpay loads a script from `checkout.razorpay.com`, opens its
own frames, talks to `api.razorpay.com` and `lumberjack.razorpay.com`, and uses inline
styles.

There is also a genuine blocker: `connect-src` must include the Trademart API origin,
which comes from `NEXT_PUBLIC_TRADEMART_API_URL` and is **per-deployment**, so the
correct policy cannot be written as a static string here.

**To enforce it:**

1. Add the deployment's API origin to `connect-src`.
2. Run a real card payment and a real UPI payment against a Razorpay **test** key with
   the browser console open.
3. Confirm no violation is reported for a resource the payment needs.
4. Rename the header to `Content-Security-Policy`.

`report-uri` is deliberately absent: there is no collector, and pointing violations at a
third party would send them the URLs of pages that carry order tokens.

`'unsafe-inline'` is granted for **styles only** — Next and the Razorpay widget both
inject them. Scripts do not get it, because script injection is the attack that matters
on a checkout page.

## HSTS

Not set here. TLS is terminated by nginx in front of this container
(`Trademart_B/deploy/nginx`), which is the only place that knows whether every
subdomain is HTTPS-ready — and a `Strict-Transport-Security` header with
`includeSubDomains` sent from the wrong layer is very hard to walk back. It belongs in
the reverse-proxy configuration.

## What this application deliberately does not do

- **No third-party analytics or tag manager.** `lib/analytics/events.ts` builds events
  and sends them nowhere until a sink is installed. Loading a vendor script is a consent
  decision a merchant makes, and a third-party tag can read the page regardless of what
  the allow-list permits.
- **No client-side price authority.** The cart price is sent as
  `expectedUnitPricePaise` purely so the backend can answer `PRICE_CHANGED`; the charge
  is always recomputed server-side from Shopify.
- **No Razorpay key secret.** Only the public `keyId`, and it arrives in the checkout
  response rather than being baked into the bundle.
