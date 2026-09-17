/**
 * Keep Month in Food in sync with My Menuply profile mutations.
 * Same-tab: CustomEvent. Cross-tab: localStorage storage event.
 */

export const MONTH_IN_FOOD_STALE_EVENT = "menuply:month-in-food-stale";
export const MONTH_IN_FOOD_STALE_KEY = "menuply:month-in-food-stale";

export function notifyMonthInFoodStale(reason = "profile") {
  if (typeof window === "undefined") return;
  const payload = { t: Date.now(), reason: String(reason || "profile") };
  try {
    localStorage.setItem(MONTH_IN_FOOD_STALE_KEY, JSON.stringify(payload));
  } catch {
    /* private mode / quota */
  }
  window.dispatchEvent(new CustomEvent(MONTH_IN_FOOD_STALE_EVENT, { detail: payload }));
}

/** @returns {() => void} unsubscribe */
export function subscribeMonthInFoodStale(handler) {
  if (typeof window === "undefined" || typeof handler !== "function") {
    return () => {};
  }
  const onCustom = () => {
    handler();
  };
  const onStorage = (event) => {
    if (event.key === MONTH_IN_FOOD_STALE_KEY) handler();
  };
  window.addEventListener(MONTH_IN_FOOD_STALE_EVENT, onCustom);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(MONTH_IN_FOOD_STALE_EVENT, onCustom);
    window.removeEventListener("storage", onStorage);
  };
}
