/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import ReplaceCartModal from "../components/basket/ReplaceCartModal.jsx";
import OrderCartToast from "../components/basket/OrderCartToast.jsx";
import {
  addItemToCart,
  getCartSummary,
  normalizeStoredCart,
  removeCartLine,
  updateCartLineQuantity,
} from "./orderCartModel.js";

const STORAGE_KEY = "grubbid_cart";
const LEGACY_STORAGE_KEY = "grubbid.order-cart.v1";
const OrderCartContext = createContext(null);

function readStoredCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) {
      return { restaurant: null, items: [], updatedAt: null };
    }

    return normalizeStoredCart(JSON.parse(raw));
  } catch {
    return { restaurant: null, items: [], updatedAt: null };
  }
}

export function OrderCartProvider({ children }) {
  const [{ restaurant, items, updatedAt }, setCartState] = useState(readStoredCart);
  const [isOpen, setIsOpen] = useState(false);
  const [notice, setNotice] = useState(null);
  const [pendingReplacement, setPendingReplacement] = useState(null);
  const stateRef = useRef({ restaurant, items, updatedAt });

  useEffect(() => {
    stateRef.current = { restaurant, items, updatedAt };
    try {
      if (!restaurant?.restaurantId || items.length === 0) {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(LEGACY_STORAGE_KEY);
        return;
      }

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          restaurant_id: restaurant.restaurantId,
          restaurant_name: restaurant.restaurantName,
          restaurant_slug: restaurant.slug ?? null,
          items,
          updated_at: updatedAt,
        })
      );
    } catch {
      // Ignore persistence failures in browsers that block storage.
    }
  }, [restaurant, items, updatedAt]);

  useEffect(() => {
    if (!notice?.message) return undefined;
    if (Array.isArray(notice.actions) && notice.actions.length > 0) return undefined;
    const timeoutId = window.setTimeout(() => {
      setNotice(null);
    }, 2400);
    return () => window.clearTimeout(timeoutId);
  }, [notice]);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);
  const clearNotice = useCallback(() => {
    setNotice(null);
  }, []);
  const dismissReplacement = useCallback(() => setPendingReplacement(null), []);

  const clearCart = useCallback(({ announce = false } = {}) => {
    setCartState({ restaurant: null, items: [], updatedAt: null });
    setPendingReplacement(null);
    setNotice(announce ? { tone: "success", title: "Cart cleared", message: "Cart cleared" } : null);
  }, []);

  const commitReplacement = useCallback(() => {
    if (!pendingReplacement) return null;
    const result = addItemToCart({ restaurant: null, items: [], updatedAt: null }, pendingReplacement);
    if (!result.ok) {
      setNotice({
        tone: "warning",
        title: "Cart notice",
        message: result.message,
      });
      return result;
    }

    setCartState(result.cart);
    setPendingReplacement(null);
    setIsOpen(true);
    setNotice({
      tone: "success",
      title: "Added to your order",
      message: "Added to your order",
    });
    return result;
  }, [pendingReplacement]);

  const addToCart = useCallback(({ restaurant: nextRestaurant, item }) => {
    const result = addItemToCart(stateRef.current, {
      restaurant: nextRestaurant,
      item,
    });

    if (!result.ok) {
      if (result.code === "restaurant_conflict") {
        setPendingReplacement({
          restaurant: nextRestaurant,
          item,
          currentRestaurantName: stateRef.current.restaurant?.restaurantName || "another restaurant",
        });
        return result;
      }

      setNotice({
        tone: "warning",
        title: "Cart notice",
        message: result.message,
      });
      return result;
    }

    setCartState(result.cart);
    setIsOpen(true);
    setNotice({
      tone: "success",
      title: "Added to your order",
      message: "Added to your order",
    });
    return result;
  }, []);
  const addMenuItem = addToCart;

  const updateQuantity = useCallback((lineId, quantity) => {
    setCartState((prev) => updateCartLineQuantity(prev, lineId, quantity));
  }, []);

  const removeItem = useCallback((lineId) => {
    setCartState((prev) => removeCartLine(prev, lineId));
  }, []);

  const { subtotalCents, itemCount } = useMemo(
    () => getCartSummary({ restaurant, items, updatedAt }),
    [restaurant, items, updatedAt]
  );

  const value = useMemo(
    () => ({
      restaurant,
      items,
      updatedAt,
      isOpen,
      notice,
      subtotalCents,
      itemCount,
      openCart,
      closeCart,
      clearCart,
      clearNotice,
      dismissReplacement,
      addToCart,
      addMenuItem,
      updateQuantity,
      removeItem,
      commitReplacement,
    }),
    [
      restaurant,
      items,
      updatedAt,
      isOpen,
      notice,
      subtotalCents,
      itemCount,
      openCart,
      closeCart,
      clearCart,
      clearNotice,
      dismissReplacement,
      addToCart,
      addMenuItem,
      updateQuantity,
      removeItem,
      commitReplacement,
    ]
  );

  return (
    <>
      <OrderCartContext.Provider value={value}>{children}</OrderCartContext.Provider>
      <OrderCartToast notice={notice} onDismiss={clearNotice} />
      <ReplaceCartModal
        open={Boolean(pendingReplacement)}
        currentRestaurantName={pendingReplacement?.currentRestaurantName}
        nextRestaurantName={pendingReplacement?.restaurant?.restaurantName}
        onKeep={dismissReplacement}
        onReplace={commitReplacement}
      />
    </>
  );
}

export function useOrderCart() {
  const context = useContext(OrderCartContext);
  if (!context) {
    throw new Error("useOrderCart must be used inside OrderCartProvider.");
  }
  return context;
}
