import { z } from "zod";

import type { CartProductItem } from "@/lib/storefront/types";

export const MAX_CART_QUANTITY = 10;

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
  quantity: z.number().int().min(1).max(MAX_CART_QUANTITY),
});

function clampQuantity(quantity: number): number {
  if (!Number.isFinite(quantity)) return 1;
  return Math.max(1, Math.min(MAX_CART_QUANTITY, Math.trunc(quantity)));
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
            { ...action.item, quantity: clampQuantity(action.quantity) },
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
                quantity: clampQuantity(item.quantity + action.quantity),
              }
            : item,
        ),
      };
    }
    case "setQuantity":
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
            ? { ...item, quantity: clampQuantity(action.quantity) }
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
