# Deployment

## Docker image

The Dockerfile builds Next.js standalone output in multiple stages and runs as the non-root `nextjs` user.

```bash
docker build -t kanay-store:local .
docker run --rm -p 3000:3000 --env-file .env.local kanay-store:local
```

The container health check calls `GET /api/health`.

## Runtime configuration

Provide the variables listed in `.env.example` through the deployment platform. Do not bake environment files or secrets into the image.

`NEXT_PUBLIC_` values are compiled into browser assets during `next build`. Production deployments should therefore provide the public site, API, and Razorpay key IDs at build time as well as runtime when the platform separates those phases.

## Network policy

The browser must reach:

- The Kanay Store origin
- The explicit Trademart_B public API origin
- Razorpay Checkout and payment endpoints
- Approved Shopify CDN image hosts

Trademart_B CORS must allow the exact Kanay Store production origin. Do not use a wildcard with credentialed admin routes.

## Release checks

```bash
npm ci
npm run typecheck
npm run lint
npm test
npm run build
docker build -t kanay-store:release .
```

Before production, validate Razorpay in test mode, Shopify order creation in a development store, and supplier fulfillment recognition with a controlled item. An application build alone does not prove those integrations.
