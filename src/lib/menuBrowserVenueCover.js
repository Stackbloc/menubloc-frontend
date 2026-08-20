/**
 * Yellow Browser venue cover ads — Coachella + L.A. LIVE for now.
 * Complements Cluster Place themes without proprietary logos/assets.
 */

export const MENU_BROWSER_VENUE_SLUGS = Object.freeze(["la-live", "coachella-2027"]);

export const MENU_BROWSER_VENUE_AD_REGIONS = Object.freeze([
  "cluster_landing_hero",
  "cluster_search_top",
  "cluster_deals_top",
  "cluster_events_top",
]);

/** Insert a sponsored page after every N restaurant menus (a few ads per deck). */
export const MENU_BROWSER_AD_EVERY_N_MENUS = 3;

const VENUE_COVERS = Object.freeze({
  "la-live": Object.freeze({
    slug: "la-live",
    brandLine: "L.A. LIVE",
    poweredBy: "powered by Menuply",
    headline: "Eat & drink before the show",
    subhead: "Downtown sports & entertainment dining — swipe through menus like a book.",
    prompt: "What do you want to browse?",
    foodLabel: "Food",
    drinksLabel: "Drinks",
    theme: "la-live",
    ink: "#f4f1ea",
    muted: "#b8b3a8",
    accent: "#e8c56a",
    accentStrong: "#c81d3a",
    pageBg:
      "radial-gradient(90% 60% at 10% -5%, rgba(200,29,58,0.35), transparent 55%), radial-gradient(70% 50% at 100% 0%, rgba(232,197,106,0.18), transparent 50%), linear-gradient(180deg, #0a0c10 0%, #12161f 55%, #1c2230 100%)",
    buttonBg: "#e8c56a",
    buttonInk: "#12161f",
    buttonBorder: "#e8c56a",
    secondaryButtonBg: "rgba(244,241,234,0.08)",
  }),
  "coachella-2027": Object.freeze({
    slug: "coachella-2027",
    brandLine: "Coachella 2027",
    poweredBy: "powered by Menuply",
    headline: "Festival food & drink, page by page",
    subhead: "Browse Indio Central Market, Street Food Alley, Terrace & Camping menus.",
    prompt: "What do you want to browse?",
    foodLabel: "Food",
    drinksLabel: "Drinks",
    theme: "coachella",
    ink: "#010100",
    muted: "#4b3a32",
    accent: "#e4572e",
    accentStrong: "#6b3fa0",
    pageBg:
      "radial-gradient(90% 55% at 8% -8%, rgba(255,138,61,0.4), transparent 58%), radial-gradient(70% 50% at 100% 0%, rgba(107,63,160,0.2), transparent 52%), linear-gradient(180deg, #fff8ef 0%, #fff3e3 42%, #f7e7d3 100%)",
    buttonBg: "#010100",
    buttonInk: "#fff3e3",
    buttonBorder: "#010100",
    secondaryButtonBg: "rgba(255,255,255,0.72)",
  }),
});

/**
 * @param {string|null|undefined} raw
 * @param {{ hostname?: string|null, sessionSlug?: string|null }} [opts]
 * @returns {string|null} Place slug for membership scope, or null for city-wide browse.
 * Does NOT default to la-live — bare /browse-menus is city.
 */
export function resolveMenuBrowserMembershipSlug(raw, { hostname = null, sessionSlug = null } = {}) {
  const slug = String(raw || "").trim().toLowerCase();
  if (MENU_BROWSER_VENUE_SLUGS.includes(slug)) return slug;
  const host = String(hostname || "").trim().toLowerCase();
  if (host === "venues.menuply.com" || host === "www.venues.menuply.com") {
    return "coachella-2027";
  }
  const session = String(sessionSlug || "").trim().toLowerCase();
  if (MENU_BROWSER_VENUE_SLUGS.includes(session)) return session;
  return null;
}

/**
 * Cover branding resolver. When membership is unset, falls back to la-live cover assets only
 * (not membership). Prefer resolveMenuBrowserMembershipSlug for deck scope.
 * @param {string|null|undefined} raw
 * @param {{ hostname?: string|null, sessionSlug?: string|null }} [opts]
 */
export function resolveMenuBrowserVenueSlug(raw, { hostname = null, sessionSlug = null } = {}) {
  return (
    resolveMenuBrowserMembershipSlug(raw, { hostname, sessionSlug }) || "la-live"
  );
}

export function getMenuBrowserVenueCover(slug) {
  const key = resolveMenuBrowserVenueSlug(slug);
  return VENUE_COVERS[key] || VENUE_COVERS["la-live"];
}

/**
 * Build swipe pages: restaurant menus with a few sponsored venue ad pages interleaved.
 * @param {object[]} entries
 * @param {string|null} venueSlug
 */
export function buildMenuBrowserPages(entries, venueSlug) {
  const list = Array.isArray(entries) ? entries : [];
  const venue = String(venueSlug || "").trim().toLowerCase();
  if (!venue || !MENU_BROWSER_VENUE_SLUGS.includes(venue) || list.length === 0) {
    return list.map((entry, entryIndex) => ({
      kind: "menu",
      entry,
      entryIndex,
      pageKey: `menu-${entry?.restaurant_id ?? entryIndex}`,
    }));
  }

  const pages = [];
  let adCount = 0;
  const maxAds = 3;

  list.forEach((entry, entryIndex) => {
    pages.push({
      kind: "menu",
      entry,
      entryIndex,
      pageKey: `menu-${entry?.restaurant_id ?? entryIndex}`,
    });
    const afterBlock = (entryIndex + 1) % MENU_BROWSER_AD_EVERY_N_MENUS === 0;
    const notLast = entryIndex < list.length - 1;
    if (afterBlock && notLast && adCount < maxAds) {
      pages.push({
        kind: "venue_ad",
        venueSlug: venue,
        pageRegion: MENU_BROWSER_VENUE_AD_REGIONS[adCount % MENU_BROWSER_VENUE_AD_REGIONS.length],
        adIndex: adCount,
        pageKey: `venue-ad-${venue}-${adCount}`,
      });
      adCount += 1;
    }
  });

  return pages;
}
