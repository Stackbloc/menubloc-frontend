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
  const [pendingReplacement, setPendingReplacement] = useState(null);
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
    setPendingReplacement(null);
  }, []);

  const clearCart = useCallback(() => {
    setCartState({ restaurant: null, items: [] });
    setNotice(null);
    setPendingReplacement(null);
  }, []);

  const commitReplacement = useCallback((payload) => {
    const result = addItemToCart({ restaurant: null, items: [] }, payload);
    if (!result.ok) {
      setNotice({
        tone: "warning",
        message: result.message,
      });
      return result;
    }

    setCartState(result.cart);
    setPendingReplacement(null);
    setNotice({
      tone: "success",
      message: `Started a new basket with ${result.addedLine?.name || payload?.item?.name || "item"}.`,
    });
    return result;
  }, []);

  const addMenuItem = useCallback(({ restaurant: nextRestaurant, item }) => {
    const result = addItemToCart(stateRef.current, {
      restaurant: nextRestaurant,
      item,
    });

    if (!result.ok) {
      const currentRestaurantName =
        stateRef.current.restaurant?.restaurantName || "your current restaurant";
      if (/already has items from/i.test(result.message || "")) {
        setPendingReplacement({ restaurant: nextRestaurant, item });
        setNotice({
          tone: "warning",
          message: `Your basket has items from ${currentRestaurantName}. Replace it to start ordering from ${nextRestaurant?.restaurantName || "this restaurant"}.`,
          actions: [
            { id: "replace-cart", label: "Replace basket" },
            { id: "dismiss", label: "Keep current basket" },
          ],
        });
        return result;
      }

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

  const handleNoticeAction = useCallback((actionId) => {
    if (actionId === "replace-cart" && pendingReplacement) {
      commitReplacement(pendingReplacement);
      return;
    }

    clearNotice();
  }, [clearNotice, commitReplacement, pendingReplacement]);

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
      handleNoticeAction,
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
      handleNoticeAction,
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
