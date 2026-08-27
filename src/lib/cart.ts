import { z } from "zod";

import type { CartProductItem } from "@/lib/storefront/types";

/**
 * Largest quantity the cart holds for one variant.
 *
 * THIS WAS 10, WHICH MADE WHOLESALE IMPOSSIBLE.
 * It mirrored the backend's old retail cap. Both are now 10,000: enough for any plausible
 * bulk order, and low enough that quantity x unit price stays a safe integer in paise and a
 * mistyped 100000 cannot become an order. The backend enforces the same bound
 * (MAX_LINE_QUANTITY in checkout.validation.ts) - this copy exists so the UI can disable a
 * control rather than letting the customer discover the limit at checkout.
 */
export const MAX_CART_QUANTITY = 10_000;

export type CartLine = CartProductItem & {
  quantity: number;
};

export type CartState = {
  items: CartLine[];
  hydrated: boolean;
};

export type CartAction =
  | { type: "hydrate"; items: CartLine[] }
  | { type: "add"; item: CartProductItem; quantity: number }
  | { type: "setQuantity"; shopifyVariantId: string; quantity: number }
  | { type: "remove"; shopifyVariantId: string }
  | { type: "clear" };

const cartLineSchema = z.object({
  shopifyProductId: z.string().min(1),
  shopifyVariantId: z.string().min(1),
  handle: z.string().min(1),
  title: z.string().min(1),
  variantTitle: z.string(),
  selectedOptions: z.array(
    z.object({
      name: z.string().min(1),
      value: z.string().min(1),
    }),
  ),
  image: z
    .object({
      url: z.string().url(),
      alt: z.string(),
      width: z.number().int().positive().nullable().optional(),
      height: z.number().int().positive().nullable().optional(),
    })
    .nullable(),
  unitPricePaise: z.number().int().positive(),
  currencyCode: z.literal("INR"),
  availableForSale: z.boolean(),
  minimumOrderQuantity: z.number().int().positive().nullable().optional(),
  quantity: z.number().int().min(1).max(MAX_CART_QUANTITY),
});

/**
 * Constrains a quantity to [floor, MAX_CART_QUANTITY].
 *
 * The floor is the product's wholesale minimum where it has one, so a line can never sit
 * below the quantity the backend will accept. Without this, a shopper could decrement a
 * `moq:12` item to 11 in the cart and only discover the problem when the checkout refused
 * the whole order - after they had filled in an address.
 *
 * The backend re-checks the same rule against freshly read Shopify data; this is the copy
 * that keeps the UI honest, never the control.
 */
function clampQuantity(quantity: number, minimum?: number | null): number {
  const floor = minimum !== null && minimum !== undefined && minimum > 0 ? minimum : 1;
  if (!Number.isFinite(quantity)) return floor;
  return Math.max(floor, Math.min(MAX_CART_QUANTITY, Math.trunc(quantity)));
}

/**
 * The smallest quantity a line may hold: its MOQ, or one.
 *
 * Takes `Partial<CartProductItem>` rather than `{ minimumOrderQuantity?: number | null }`.
 * The narrower shape is a weak type — every property optional — so TypeScript rejects any
 * argument that has no property in common with it, which means a caller holding a complete
 * cart item that simply predates this field cannot pass it. Widening to the partial item keeps
 * the "no minimum is one, never zero" guarantee while accepting every real caller.
 */
export function minimumQuantityFor(item: Partial<CartProductItem>): number {
  const minimum = item.minimumOrderQuantity;
  return minimum !== null && minimum !== undefined && minimum > 0 ? minimum : 1;
}

export function parsePersistedCart(value: string | null): CartLine[] {
  if (!value) return [];

  try {
    const parsed = z.array(cartLineSchema).safeParse(JSON.parse(value));
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}

export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "hydrate":
      return { items: action.items, hydrated: true };
    case "add": {
      if (
        !action.item.availableForSale ||
        !Number.isSafeInteger(action.item.unitPricePaise) ||
        action.item.unitPricePaise <= 0
      ) {
        return state;
      }

      const existing = state.items.find(
        (item) => item.shopifyVariantId === action.item.shopifyVariantId,
      );
      if (!existing) {
        return {
          ...state,
          items: [
            ...state.items,
            {
              ...action.item,
              quantity: clampQuantity(action.quantity, action.item.minimumOrderQuantity),
            },
          ],
        };
      }

      return {
        ...state,
        items: state.items.map((item) =>
          item.shopifyVariantId === action.item.shopifyVariantId
            ? {
                ...item,
                ...action.item,
                quantity: clampQuantity(
                  item.quantity + action.quantity,
                  action.item.minimumOrderQuantity,
                ),
              }
            : item,
        ),
      };
    }
    case "setQuantity":
      // Zero still removes the line. The MOQ floor governs how FEW may be ordered, not
      // whether the item may be taken out of the cart entirely.
      if (action.quantity <= 0) {
        return {
          ...state,
          items: state.items.filter(
            (item) => item.shopifyVariantId !== action.shopifyVariantId,
          ),
        };
      }
      return {
        ...state,
        items: state.items.map((item) =>
          item.shopifyVariantId === action.shopifyVariantId
            ? { ...item, quantity: clampQuantity(action.quantity, item.minimumOrderQuantity) }
            : item,
        ),
      };
    case "remove":
      return {
        ...state,
        items: state.items.filter(
          (item) => item.shopifyVariantId !== action.shopifyVariantId,
        ),
      };
    case "clear":
      return { ...state, items: [] };
    default:
      return state;
  }
}

export function calculateCartSubtotal(items: CartLine[]): number {
  return items.reduce((subtotal, item) => {
    const lineTotal = item.unitPricePaise * item.quantity;
    if (!Number.isSafeInteger(lineTotal) || !Number.isSafeInteger(subtotal + lineTotal)) {
      throw new Error("Cart total exceeds the supported amount");
    }
    return subtotal + lineTotal;
  }, 0);
}

export function calculateCartCount(items: CartLine[]): number {
  return items.reduce((count, item) => count + item.quantity, 0);
}
