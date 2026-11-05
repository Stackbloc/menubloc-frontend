/**
 * Owner launch pages: /join/:clusterLaunch (e.g. /join/usc-launch).
 * Plan: 21-cluster-owner-claim-and-sales-page-plan.md (Andre 2026-11-04).
 *
 * Paid steps (deal promotion, billboards, clips) hand off to the advertising
 * marketplace built separately (Codex). This file holds the agreed hand-off
 * URLs; it never prices, sells or confirms anything itself.
 */

// Off until the marketplace's /advertise page and hand-off token check exist.
// While off, paid steps show a clearly marked "opens soon" placeholder.
export const ADVERTISING_MARKETPLACE_LIVE = false;

export const JOIN_STEPS = ["deal", "billboards", "clip", "ordering"];

const CLUSTERS = {
  usc: {
    clusterSlug: "usc",
    areaLabel: "near USC",
    eyebrow: "For restaurants near USC",
    clusterLabel: "our University Park cluster",
    launchLabel: "January 2027",
    launchMonth: "JAN",
    launchYear: "2027",
    disclaimer:
      "Menuply is independent and is not affiliated with or endorsed by the University of Southern California.",
  },
};

/** "/join/usc-launch" → USC config; unknown clusters → null. */
export function resolveJoinCluster(clusterLaunch) {
  const m = String(clusterLaunch || "").toLowerCase().match(/^([a-z0-9-]+)-launch$/);
  if (!m) return null;
  return CLUSTERS[m[1]] || null;
}

export function joinBasePath(clusterSlug) {
  return `/join/${clusterSlug}-launch`;
}

/** Cuisine labels come in mixed case ("chinese", "Chinese"); show one form. */
export function displayCuisine(value) {
  const s = String(value || "").replace(/_/g, " ").trim();
  if (!s) return "";
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Agreed contract: /advertise?restaurant=&cluster=&step=&src=[&deal_id=] */
export function buildAdvertiseUrl({ restaurantId, clusterSlug, step, src, dealId }) {
  const p = new URLSearchParams();
  p.set("restaurant", String(restaurantId));
  p.set("cluster", clusterSlug);
  p.set("step", step);
  if (src) p.set("src", src);
  if (dealId) p.set("deal_id", String(dealId));
  return `/advertise?${p.toString()}`;
}

/** Only same-site /join/… paths may be used as a return target. */
export function safeJoinReturnPath(value) {
  const s = String(value || "").trim();
  if (!s.startsWith("/join/") || s.startsWith("//") || s.includes("://")) return null;
  return s;
}

// ---------------------------------------------------------------------------
// Claim intent: survives sign-up / sign-in / email verification, which land
// new owners on /operator/claim without our query params.
// ---------------------------------------------------------------------------

const INTENT_KEY = "menuply.joinClaimIntent";
const INTENT_MAX_AGE_MS = 6 * 60 * 60 * 1000;

export function saveClaimIntent({ restaurantId, restaurantName, returnPath, src }) {
  try {
    window.sessionStorage.setItem(
      INTENT_KEY,
      JSON.stringify({ restaurantId, restaurantName, returnPath, src: src || null, savedAt: Date.now() }),
    );
  } catch {
    /* storage blocked: the URL params still carry the intent when signed in */
  }
}

export function readClaimIntent() {
  try {
    const raw = window.sessionStorage.getItem(INTENT_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw);
    if (!v || Date.now() - Number(v.savedAt || 0) > INTENT_MAX_AGE_MS) return null;
    return v;
  } catch {
    return null;
  }
}

export function clearClaimIntent() {
  try {
    window.sessionStorage.removeItem(INTENT_KEY);
  } catch {
    /* ignore */
  }
}
