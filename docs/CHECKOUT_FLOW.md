# Checkout Flow

## Customer flow

1. The customer adds an exact Shopify-backed public variant to the local cart.
2. The customer enters name, email, Indian mobile number, and delivery address.
3. Kanay Store sends product IDs, variant IDs, quantities, customer details, and address to Trademart_B.
4. Trademart_B re-fetches and revalidates every line.
5. Trademart_B freezes the authoritative checkout snapshot in integer paise.
6. Trademart_B creates a Razorpay Order for the exact snapshot total.
7. Kanay Store opens Razorpay Checkout with the public key ID and Razorpay Order ID.
8. Razorpay returns payment identifiers to the browser.
9. Kanay Store sends those identifiers to Trademart_B.
10. Trademart_B verifies the signature server-side and records payment state.
11. Trademart_B creates at most one Shopify order for the paid checkout session.
12. Shopify remains the fulfillment and tracking record.

## Checkout snapshot

The durable snapshot contains:

- Exact Shopify product and variant IDs
- Quantity
- Public title and variant snapshots
- Unit and line totals in paise
- Customer and Indian shipping address
- Subtotal, customer shipping, discount, tax, and total in paise
- Razorpay Order ID and payment state
- Shopify order ID/name when created
- Status and high-entropy public status/tracking tokens

The browser's displayed cart amount is never copied into the charged snapshot.

## Price and availability changes

If a price changes before checkout-session creation, Trademart_B returns `PRICE_CHANGED` and the customer reviews the current price. If a product or exact variant is no longer sellable, Trademart_B refuses checkout with `PRODUCT_UNAVAILABLE` or `VARIANT_UNAVAILABLE`.

After Razorpay Order creation the snapshot amount is immutable. A later catalog change cannot silently mutate that payment attempt.

## Payment verification and webhooks

The browser callback is not payment authority. Trademart_B verifies Razorpay's HMAC signature with the server-only secret.

The raw-body Razorpay webhook provides recovery when the browser closes before calling verify. Webhook events are persisted and deduplicated before finalization. Duplicate delivery must converge on the same paid CheckoutSession and the same Shopify order.

## Shopify order recovery

Payment and order creation are separate durable states:

```text
PAYMENT_PENDING
      |
      v
PAYMENT_PAID
      |
      v
ORDER_PENDING
      |
      v
ORDER_CREATED
```

If Shopify is temporarily unavailable, the session stays paid and order-pending. A Mongo-backed lease/retry process safely retries Shopify order creation. The customer is never asked to pay again.

A unique constraint on checkout session/order orchestration ensures one paid session creates at most one Shopify order.

## Guest tracking

The order receives a random high-entropy token. `/track/:token` returns only customer-safe status fields. Sequential Shopify order IDs or order numbers are never accepted as anonymous authorization.

Unknown carrier or shipment state is displayed as unavailable, not translated into an invented processing state.
