/**
 * Demo ordering (Andre, 2026-10-13): lets one device treat every menu as orderable so the
 * ordering flow can be shown before restaurants connect Stripe payouts. Device-only on
 * purpose — real diners never see ordering a restaurant cannot be paid for.
 *
 *   https://menuply.com/try       → on for this browser (persists), lands on the Feed
 *   https://menuply.com/try/off   → off
 *   (?demo_ordering=on|off on any URL works too)
 *
 * Checkout still needs the restaurant's Stripe payouts, so a demo order stops at payment.
 */

export const DEMO_ORDERING_STORAGE_KEY = "menuply.demoOrdering.v1";
export const DEMO_ORDERING_PARAM = "demo_ordering";

export function isDemoOrderingOn() {
  try {
    return typeof window !== "undefined" && window.localStorage.getItem(DEMO_ORDERING_STORAGE_KEY) === "on";
  } catch {
    return false;
  }
}

export const DEMO_ORDERING_ON_PATH = "/try";
export const DEMO_ORDERING_OFF_PATH = "/try/off";

/** Read /try, /try/off or ?demo_ordering=on|off once at app start (before the router mounts). */
export function syncDemoOrderingFromUrl() {
  if (typeof window === "undefined") return;
  try {
    const path = window.location.pathname.replace(/\/+$/, "") || "/";
    if (path === DEMO_ORDERING_ON_PATH || path === DEMO_ORDERING_OFF_PATH) {
      if (path === DEMO_ORDERING_ON_PATH) window.localStorage.setItem(DEMO_ORDERING_STORAGE_KEY, "on");
      else window.localStorage.removeItem(DEMO_ORDERING_STORAGE_KEY);
      window.history.replaceState(null, "", "/feed");
      return;
    }
    const value = new URLSearchParams(window.location.search).get(DEMO_ORDERING_PARAM);
    if (value === "on") window.localStorage.setItem(DEMO_ORDERING_STORAGE_KEY, "on");
    if (value === "off") window.localStorage.removeItem(DEMO_ORDERING_STORAGE_KEY);
  } catch {
    /* storage blocked — demo stays off */
  }
}
