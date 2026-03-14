/**
 * CartContext.jsx
 * Path: menubloc-frontend/src/context/CartContext.jsx
 *
 * Global cart state for Grubbid.
 * Supports both subscription and one_time product types.
 *
 * Usage:
 *   const { cart, addToCart, removeFromCart, clearCart, openCart, closeCart, isOpen } = useCart();
 *
 * Item shape:
 *   {
 *     id:          string   — unique product/plan identifier
 *     name:        string   — display name
 *     description: string   — optional subtitle
 *     price:       number   — display price in USD
 *     type:        'subscription' | 'one_time'
 *     interval:    'month' | 'year' | null  — for subscriptions
 *     paypalPlanId: string  — PayPal Plan ID (subscriptions only)
 *   }
 *
 * Cart only holds one subscription at a time — adding a new
 * subscription replaces the existing one.
 */

import { createContext, useCallback, useContext, useReducer, useState } from "react";

const CartContext = createContext(null);

function cartReducer(state, action) {
  switch (action.type) {
    case "ADD": {
      const item = action.item;
      // Only one subscription allowed at a time — replace existing subscription
      if (item.type === "subscription") {
        const without = state.filter((i) => i.type !== "subscription");
        return [...without, item];
      }
      // One-time: replace if same id, otherwise append
      const exists = state.findIndex((i) => i.id === item.id);
      if (exists !== -1) {
        const updated = [...state];
        updated[exists] = item;
        return updated;
      }
      return [...state, item];
    }
    case "REMOVE":
      return state.filter((i) => i.id !== action.id);
    case "CLEAR":
      return [];
    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [cart, dispatch] = useReducer(cartReducer, []);
  const [isOpen, setIsOpen] = useState(false);

  const addToCart  = useCallback((item) => dispatch({ type: "ADD",    item }), []);
  const removeFromCart = useCallback((id) => dispatch({ type: "REMOVE", id }), []);
  const clearCart  = useCallback(() => dispatch({ type: "CLEAR" }), []);
  const openCart   = useCallback(() => setIsOpen(true),  []);
  const closeCart  = useCallback(() => setIsOpen(false), []);

  const total = cart.reduce((sum, i) => sum + (i.price || 0), 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, isOpen, openCart, closeCart, total }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
