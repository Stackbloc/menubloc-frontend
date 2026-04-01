import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  addItemToCart,
  getCartSummary,
  normalizeStoredCart,
  removeCartLine,
  updateCartLineQuantity,
} from "./orderCartModel.js";

const STORAGE_KEY = "grubbid.order-cart.v1";
const OrderCartContext = createContext(null);

function readStoredCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { restaurant: null, items: [] };
    }

    return normalizeStoredCart(JSON.parse(raw));
  } catch {
    return { restaurant: null, items: [] };
  }
}

export function OrderCartProvider({ children }) {
  const [{ restaurant, items }, setCartState] = useState(readStoredCart);
  const [isOpen, setIsOpen] = useState(false);
  const [notice, setNotice] = useState(null);
  const stateRef = useRef({ restaurant, items });

  useEffect(() => {
    stateRef.current = { restaurant, items };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ restaurant, items }));
    } catch {
      // Ignore persistence failures in browsers that block storage.
    }
  }, [restaurant, items]);

  useEffect(() => {
    if (!notice?.message) return undefined;
    const timeoutId = window.setTimeout(() => {
      setNotice(null);
    }, 2400);
    return () => window.clearTimeout(timeoutId);
  }, [notice]);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);
  const clearNotice = useCallback(() => setNotice(null), []);

  const clearCart = useCallback(() => {
    setCartState({ restaurant: null, items: [] });
    setNotice(null);
  }, []);

  const addMenuItem = useCallback(({ restaurant: nextRestaurant, item }) => {
    const result = addItemToCart(stateRef.current, {
      restaurant: nextRestaurant,
      item,
    });

    if (!result.ok) {
      setNotice({
        tone: "warning",
        message: result.message,
      });
      return result;
    }

    setCartState(result.cart);
    setNotice({
      tone: "success",
      message: `Added ${result.addedLine?.name || item?.name || "item"}`,
    });
    return result;
  }, []);

  const updateQuantity = useCallback((lineId, quantity) => {
    setCartState((prev) => updateCartLineQuantity(prev, lineId, quantity));
  }, []);

  const removeItem = useCallback((lineId) => {
    setCartState((prev) => removeCartLine(prev, lineId));
  }, []);

  const { subtotalCents, itemCount } = useMemo(
    () => getCartSummary({ restaurant, items }),
    [restaurant, items]
  );

  const value = useMemo(
    () => ({
      restaurant,
      items,
      isOpen,
      notice,
      subtotalCents,
      itemCount,
      openCart,
      closeCart,
      clearCart,
      clearNotice,
      addMenuItem,
      updateQuantity,
      removeItem,
    }),
    [
      restaurant,
      items,
      isOpen,
      notice,
      subtotalCents,
      itemCount,
      openCart,
      closeCart,
      clearCart,
      clearNotice,
      addMenuItem,
      updateQuantity,
      removeItem,
    ]
  );

  return <OrderCartContext.Provider value={value}>{children}</OrderCartContext.Provider>;
}

export function useOrderCart() {
  const context = useContext(OrderCartContext);
  if (!context) {
    throw new Error("useOrderCart must be used inside OrderCartProvider.");
  }
  return context;
}
