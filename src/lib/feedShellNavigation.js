import { isFeedAsHomeEnabled } from "./featureFlags.js";

/** Feed shell search route — same query params as `/search`, no menu-window discovery. */
export const FEED_SHELL_SEARCH_PATH = "/feed/search";

/** Discovery home path for Feed shell Search tab (avoids loop when Feed is `/`). */
export function resolveFeedSearchHomePath() {
  return isFeedAsHomeEnabled() ? "/home-next" : "/";
}

/** Rewrite `/search?…` targets to stay inside the Feed shell (params unchanged). */
export function rewriteSearchPathForFeedShell(url) {
  if (typeof url !== "string" || !url.startsWith("/search")) return url;
  return url.replace(/^\/search(?=[?#]|$)/, FEED_SHELL_SEARCH_PATH);
}

const FEED_SEARCH_RESULTS_PARAM_KEYS = [
  "q",
  "vegan",
  "vegetarian",
  "gluten_free",
  "deals_only",
  "keto",
  "low_fat",
  "low_sodium",
  "high_protein",
  "dairy_free",
  "diabetic_friendly",
  "glp1_friendly",
  "cuisine",
  "category",
  "meal_period",
  "occasion",
  "dining_mode",
  "source",
  "price_max",
  "waiter",
  "context",
  "filterKey",
];

/** True when `/feed/search` should render results instead of discovery chrome. */
export function isFeedShellSearchResultsView(searchParams) {
  if (!searchParams) return false;
  const q = String(searchParams.get("q") || "").trim();
  if (q) return true;
  return FEED_SEARCH_RESULTS_PARAM_KEYS.some((key) => {
    if (key === "q") return false;
    const value = searchParams.get(key);
    return value != null && String(value).trim() !== "";
  });
}
