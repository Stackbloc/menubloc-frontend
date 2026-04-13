/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useOrderCart } from "../../context/OrderCartContext.jsx";
import ResumeCartModal from "./ResumeCartModal.jsx";

const CART_STALE_MINUTES = 20;
const CART_PROMPT_SHOWN_KEY = "cart_prompt_shown";
const ELIGIBLE_PATHS = new Set(["/", "/deals", "/checkout"]);

export default function BasketResumePrompt() {
  const location = useLocation();
  const { restaurant, items, updatedAt, clearCart } = useOrderCart();
  const [visible, setVisible] = useState(false);
  const itemCount = items.length;
  const isEligiblePath = ELIGIBLE_PATHS.has(location.pathname);

  useEffect(() => {
    if (itemCount > 0 && !restaurant?.restaurantId) {
      clearCart({ announce: false });
    }
  }, [clearCart, itemCount, restaurant?.restaurantId]);

  useEffect(() => {
    if (!isEligiblePath || itemCount === 0 || !restaurant?.restaurantId || !updatedAt) return;
    if (Date.now() - Number(updatedAt) <= CART_STALE_MINUTES * 60 * 1000) return;
    try {
      if (sessionStorage.getItem(CART_PROMPT_SHOWN_KEY)) return;
      sessionStorage.setItem(CART_PROMPT_SHOWN_KEY, "true");
    } catch {
      // Ignore sessionStorage failures.
    }
    setVisible(true);
  }, [isEligiblePath, itemCount, restaurant?.restaurantId, updatedAt]);

  return (
    <ResumeCartModal
      open={visible && Boolean(restaurant?.restaurantId) && itemCount > 0}
      restaurantName={restaurant?.restaurantName || "this restaurant"}
      onKeep={() => setVisible(false)}
      onClear={() => {
        clearCart({ announce: true });
        setVisible(false);
      }}
    />
  );
}
