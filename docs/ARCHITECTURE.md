# Kanay Store Architecture

## System boundary

```text
Tradelle or another supplier
              |
              v
        Trademart_B
   sourceability, price, FX
              |
              v
           Shopify
 products, variants, orders
       |             ^
       v             |
   Kanay Store   fulfillment
       |
       v
    Customer
       |
       v
 Razorpay Checkout
       |
       v
 Trademart verifies payment
```

Kanay Store never talks to Tradelle and never calls the Shopify Admin API. Its commerce data comes only from Trademart_B's narrow public storefront surface.

## Data ownership

| System | Owns |
| --- | --- |
| Kanay Store | Presentation, locally persisted cart, and customer-entered guest checkout form |
| Trademart | Sellability, approved retail pricing, FX policy, supplier/sourceability evidence, checkout snapshot, payment verification, and order orchestration |
| Shopify | Commerce products, exact variants, orders, fulfillment, and tracking records |
| Razorpay | Payment processing and payment events |
| Tradelle or another supplier | Supplier fulfillment behind Trademart and Shopify |

## Public catalog boundary

Only products that pass the centralized sellability gate are purchasable. The gate requires:

1. Shopify product status permits sale.
2. The product is published to the configured Online Store publication.
3. Current Trademart sourceability policy permits sale.
4. The exact verified supplier variant maps to the exact Shopify variant.
5. The selected Shopify variant is available for sale.
6. The approved retail price is positive INR.

Catalog projection and checkout validation call the same authority. A disabled frontend button is only a convenience and cannot bypass backend refusal.

The public DTO excludes supplier cost, supplier URLs, Tradelle references, confidence or internal scores, profit, audit fields, raw evidence, Mongo internals, inventory item IDs, and private customer information.

## Variant identity

Variant identity is stable across the chain:

```text
supplierVariantId
        |
verified variant snapshot
        |
shopifyVariantId
        |
public storefront variant ID
```

The mapping uses supplier IDs, SKU, and exact option values. Array position is never identity. Unavailable supplier variants are not created as purchasable Shopify variants.

## Currency

Kanay Store renders only approved INR retail prices. It formats values with `Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })` and uses integer paise for cart and payment calculations.

FX conversion, when enabled, happens in Trademart under a timestamped provider or manual-admin policy. Missing, mismatched, or stale rates fail closed according to Trademart policy. The storefront never converts supplier currency.

## Security boundary

- Razorpay and Shopify secrets remain in Trademart_B.
- Public checkout does not accept browser amounts or discounts.
- Public checkout requests contain only exact product/variant IDs and quantities.
- Razorpay signatures and webhooks are verified from raw server bytes.
- Checkout and paid-order state is durable and idempotent.
- Tracking links use random high-entropy tokens.
- Public errors are mapped to customer-safe messages.
- Customer PII must be redacted from application logs.
