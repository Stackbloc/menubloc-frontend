/** Shared hash target for food discussion deep links from menu chrome. */
export const FOOD_COMMENTS_HASH = "food-comments";
export const FOOD_COMMENTS_HASH_SELECTOR = `#${FOOD_COMMENTS_HASH}`;

/**
 * Scroll Discussion into view below the sticky menu-item hero when present.
 * Retries because detail content loads async after navigation.
 */
export function scrollToFoodComments({ behavior = "smooth" } = {}) {
  if (typeof document === "undefined" || typeof window === "undefined") return false;
  const el = document.getElementById(FOOD_COMMENTS_HASH);
  if (!el) return false;

  const sticky = document.querySelector("[data-menu-item-sticky-hero]");
  const stickyH = sticky ? sticky.getBoundingClientRect().height : 0;
  // Cap margin so Discussion still lands in the viewport under a tall sticky hero.
  const margin = Math.min(Math.max(stickyH, 72), Math.floor(window.innerHeight * 0.42));
  el.style.scrollMarginTop = `${margin + 12}px`;
  el.scrollIntoView({ behavior, block: "start" });
  return true;
}

export function scheduleScrollToFoodComments({ attempts = 8, delayMs = 120 } = {}) {
  if (typeof window === "undefined") return () => {};
  if (window.location.hash !== FOOD_COMMENTS_HASH_SELECTOR) return () => {};

  const timers = [];
  let cancelled = false;

  const run = (i) => {
    if (cancelled) return;
    if (scrollToFoodComments({ behavior: i === 0 ? "auto" : "smooth" })) {
      // One follow-up after layout settles (images / sticky height).
      timers.push(window.setTimeout(() => {
        if (!cancelled) scrollToFoodComments({ behavior: "smooth" });
      }, 280));
      return;
    }
    if (i + 1 < attempts) {
      timers.push(window.setTimeout(() => run(i + 1), delayMs * (i + 1)));
    }
  };

  timers.push(window.setTimeout(() => run(0), 40));
  return () => {
    cancelled = true;
    timers.forEach((t) => window.clearTimeout(t));
  };
}
