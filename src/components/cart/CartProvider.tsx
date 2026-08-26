"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";

import {
  calculateCartCount,
  calculateCartSubtotal,
  cartReducer,
  parsePersistedCart,
  type CartLine,
} from "@/lib/cart";
import type { CartProductItem } from "@/lib/storefront/types";

const STORAGE_KEY = "kanay-store-cart-v1";

type CartContextValue = {
  items: CartLine[];
  itemCount: number;
  subtotalPaise: number;
  hydrated: boolean;
  addItem: (item: CartProductItem, quantity?: number) => void;
  setQuantity: (shopifyVariantId: string, quantity: number) => void;
  removeItem: (shopifyVariantId: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    hydrated: false,
  });

  useEffect(() => {
    dispatch({ type: "hydrate", items: parsePersistedCart(localStorage.getItem(STORAGE_KEY)) });
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
  }, [state.hydrated, state.items]);

  const value = useMemo<CartContextValue>(
    () => ({
      items: state.items,
      itemCount: calculateCartCount(state.items),
      subtotalPaise: calculateCartSubtotal(state.items),
      hydrated: state.hydrated,
      addItem: (item, quantity = 1) => dispatch({ type: "add", item, quantity }),
      setQuantity: (shopifyVariantId, quantity) =>
        dispatch({ type: "setQuantity", shopifyVariantId, quantity }),
      removeItem: (shopifyVariantId) => dispatch({ type: "remove", shopifyVariantId }),
      clearCart: () => dispatch({ type: "clear" }),
    }),
    [state],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used inside CartProvider");
  return value;
}
