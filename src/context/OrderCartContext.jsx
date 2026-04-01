import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

const STORAGE_KEY = "grubbid.order-cart.v1";
const OrderCartContext = createContext(null);

function readStoredCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { restaurant: null, items: [] };
    }

    const parsed = JSON.parse(raw);
    return {
      restaurant: parsed?.restaurant || null,
      items: Array.isArray(parsed?.items) ? parsed.items : [],
    };
  } catch {
    return { restaurant: null, items: [] };
  }
}

export function OrderCartProvider({ children }) {
  const [{ restaurant, items }, setCartState] = useState(readStoredCart);
  const [isOpen, setIsOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const stateRef = useRef({ restaurant, items });

  useEffect(() => {
    stateRef.current = { restaurant, items };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ restaurant, items }));
    } catch {
      // Ignore persistence failures in browsers that block storage.
    }
  }, [restaurant, items]);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);
  const clearNotice = useCallback(() => setNotice(""), []);

  const clearCart = useCallback(() => {
    setCartState({ restaurant: null, items: [] });
    setNotice("");
  }, []);

  const addMenuItem = useCallback(({ restaurant: nextRestaurant, item }) => {
    const current = stateRef.current;

    if (!nextRestaurant?.restaurantId || !item?.menuItemId) {
      return { ok: false, message: "Cart item is missing restaurant or menu item context." };
    }

    if (
      current.restaurant &&
      Number(current.restaurant.restaurantId) !== Number(nextRestaurant.restaurantId)
    ) {
      const message = `Your cart already has items from ${current.restaurant.restaurantName}. Clear it before ordering from another restaurant.`;
      setNotice(message);
      return { ok: false, message };
    }

    setCartState((prev) => {
      const existingIndex = prev.items.findIndex(
        (entry) => Number(entry.menuItemId) === Number(item.menuItemId)
      );

      if (existingIndex >= 0) {
        const nextItems = [...prev.items];
        nextItems[existingIndex] = {
          ...nextItems[existingIndex],
          quantity: nextItems[existingIndex].quantity + 1,
        };

        return {
          restaurant: prev.restaurant || nextRestaurant,
          items: nextItems,
        };
      }

      return {
        restaurant: prev.restaurant || nextRestaurant,
        items: [
          ...prev.items,
          {
            ...item,
            quantity: Number(item.quantity) > 0 ? Number(item.quantity) : 1,
          },
        ],
      };
    });

    setNotice(`${item.name} added to your cart.`);
    return { ok: true };
  }, []);

  const updateQuantity = useCallback((menuItemId, quantity) => {
    setCartState((prev) => {
      const normalizedQuantity = Number(quantity);
      const nextItems = prev.items
        .map((item) =>
          Number(item.menuItemId) === Number(menuItemId)
            ? { ...item, quantity: normalizedQuantity }
            : item
        )
        .filter((item) => item.quantity > 0);

      return {
        restaurant: nextItems.length > 0 ? prev.restaurant : null,
        items: nextItems,
      };
    });
  }, []);

  const removeItem = useCallback((menuItemId) => {
    setCartState((prev) => {
      const nextItems = prev.items.filter(
        (item) => Number(item.menuItemId) !== Number(menuItemId)
      );

      return {
        restaurant: nextItems.length > 0 ? prev.restaurant : null,
        items: nextItems,
      };
    });
  }, []);

  const subtotalCents = useMemo(
    () => items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0),
    [items]
  );

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
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
