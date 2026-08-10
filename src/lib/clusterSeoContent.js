/**
 * Slug-keyed Cluster SEO content — unique intro, card blurbs, document meta,
 * and contextual search placeholders for public Clusters.
 *
 * Authoritative for consumer-facing SEO copy on this deploy path.
 * Does not replace API identity fields (name, city, state, type, geo).
 * Prefer this overlay over DB short_description for long-form intro + meta
 * so copy can ship without production data updates.
 */

/** @typedef {"airport"|"university"|"stadium"|"entertainment_complex"|"convention_district"|"downtown"|"other"} ClusterSeoType */

/**
 * @typedef {object} ClusterSeoEntry
 * @property {string} slug
 * @property {string} displayName
 * @property {string} city
 * @property {string} state
 * @property {ClusterSeoType} clusterType
 * @property {string} intro Visible page intro (~60–120 words). Qualified language only.
 * @property {string} cardDescription Short directory card blurb.
 * @property {string} seoTitle Document / OG title.
 * @property {string} metaDescription Meta / OG description.
 * @property {string} searchPlaceholder Contextual Food search placeholder.
 */

/** Public Cluster slugs that must have unique SEO config. */
export const PUBLIC_CLUSTER_SEO_SLUGS = Object.freeze([
  "la-live",
  "lacc",
  "lax",
  "atl-airport",
  "american-airlines-center",
  "att-stadium",
  "ucla",
  "usc",
]);

const DEFAULT_SEARCH_PLACEHOLDER = "Search food here";

/** @type {Readonly<Record<string, ClusterSeoEntry>>} */
export const CLUSTER_SEO_CONTENT = Object.freeze({
  "la-live": Object.freeze({
    slug: "la-live",
    displayName: "L.A. Live",
    city: "Los Angeles",
    state: "CA",
    clusterType: "entertainment_complex",
    intro:
      "Discover available restaurants, menus, drinks, and dining options around L.A. Live in downtown Los Angeles, California. Browse participating restaurants in and near the entertainment district — from burgers, pizza, and tacos to seafood, desserts, coffee, and cocktails — before events at nearby arenas, theaters, hotels, and attractions. Use Menuply to explore menu items and plan where to eat when you are visiting this part of downtown Los Angeles.",
    cardDescription:
      "Available restaurants and menus around the L.A. Live entertainment district in downtown Los Angeles.",
    seoTitle: "L.A. Live Restaurants, Menus & Food | Menuply",
    metaDescription:
      "Explore available restaurants, menus, food, and drinks around L.A. Live in Los Angeles, CA. Search dining options with Menuply.",
    searchPlaceholder: "Search L.A. Live menus",
  }),
  lacc: Object.freeze({
    slug: "lacc",
    displayName: "Los Angeles Convention Center",
    city: "Los Angeles",
    state: "CA",
    clusterType: "convention_district",
    intro:
      "Discover available restaurants, menus, drinks, and dining options within walking distance of the Los Angeles Convention Center in downtown Los Angeles, California. Browse participating restaurants near the convention campus and neighboring dining — including options around nearby L.A. Live — before events, conferences, and shows. Use Menuply to explore menu items and plan where to eat when you are visiting this part of downtown Los Angeles.",
    cardDescription:
      "Available restaurants and menus within walking distance of the Los Angeles Convention Center.",
    seoTitle: "Los Angeles Convention Center Restaurants, Menus & Food | Menuply",
    metaDescription:
      "Explore available restaurants, menus, food, and drinks near the Los Angeles Convention Center in Los Angeles, CA. Search dining options with Menuply.",
    searchPlaceholder: "Search Convention Center menus",
  }),
  lax: Object.freeze({
    slug: "lax",
    displayName: "Los Angeles International Airport",
    city: "Los Angeles",
    state: "CA",
    clusterType: "airport",
    intro:
      "Browse available restaurant menus, airport food, coffee shops, bars, and dining options at Los Angeles International Airport (LAX) in Los Angeles, California. Search food and drinks before departure, after arrival, or during a layover — including breakfast, burgers, pizza, sandwiches, coffee, and other grab-and-go meals listed on Menuply for this airport destination. Coverage continues to expand by terminal and nearby dining, so explore what is currently available before you travel.",
    cardDescription:
      "Available airport dining, coffee, and menus at Los Angeles International Airport (LAX).",
    seoTitle: "LAX Restaurants, Menus & Food | Menuply",
    metaDescription:
      "Explore available restaurant menus, airport food, coffee, and drinks at Los Angeles International Airport (LAX). Search dining options with Menuply.",
    searchPlaceholder: "Search Dining Options at LAX",
  }),
  "atl-airport": Object.freeze({
    slug: "atl-airport",
    displayName: "Hartsfield-Jackson Atlanta International Airport",
    city: "Atlanta",
    state: "GA",
    clusterType: "airport",
    intro:
      "Find available restaurant menus, airport dining, coffee, drinks, and grab-and-go food associated with Hartsfield-Jackson Atlanta International Airport in Atlanta, Georgia. Explore dining options for breakfast, burgers, pizza, sandwiches, coffee, and other meals before a flight or during a layover. Coverage continues to grow — browse what is listed on Menuply for this Atlanta airport destination without assuming every outlet is included yet.",
    cardDescription:
      "Available airport dining and menus at Hartsfield-Jackson Atlanta International Airport (ATL).",
    seoTitle: "ATL Airport Restaurants, Menus & Food | Menuply",
    metaDescription:
      "Explore available restaurant menus, airport dining, coffee, and drinks at Hartsfield-Jackson Atlanta International Airport. Search with Menuply.",
    searchPlaceholder: "Search Dining Options at Hartsfield",
  }),
  "american-airlines-center": Object.freeze({
    slug: "american-airlines-center",
    displayName: "American Airlines Center",
    city: "Dallas",
    state: "TX",
    clusterType: "stadium",
    intro:
      "Explore available restaurants, concession food, drinks, and menus associated with American Airlines Center in Dallas, Texas. Search dining options before basketball games, hockey games, concerts, and other arena events. Menuply lists participating food and drink information for this Dallas arena destination as coverage grows — browse what is available before you head to the venue, and treat listings as a discovery guide rather than a complete concession catalog.",
    cardDescription:
      "Available food, drinks, and menus associated with American Airlines Center in Dallas.",
    seoTitle: "American Airlines Center Restaurants, Menus & Food | Menuply",
    metaDescription:
      "Explore available restaurants, concession food, drinks, and menus associated with American Airlines Center in Dallas, TX. Search with Menuply.",
    searchPlaceholder: "Search food at American Airlines Center",
  }),
  "att-stadium": Object.freeze({
    slug: "att-stadium",
    displayName: "AT&T Stadium",
    city: "Arlington",
    state: "TX",
    clusterType: "stadium",
    intro:
      "Browse available food, drinks, restaurants, and menu information associated with AT&T Stadium in Arlington, Texas. Explore dining options before football games, concerts, tours, and other stadium events. Use Menuply to search participating listings for this Arlington stadium destination as the directory grows — without assuming every concession or restaurant is included — so you can plan a meal around game day or an event visit.",
    cardDescription:
      "Available food, drinks, and menus associated with AT&T Stadium in Arlington, Texas.",
    seoTitle: "AT&T Stadium Restaurants, Menus & Food | Menuply",
    metaDescription:
      "Explore available food, drinks, restaurants, and menus associated with AT&T Stadium in Arlington, TX. Search dining options with Menuply.",
    searchPlaceholder: "Search Dining Options at AT&T Stadium",
  }),
  ucla: Object.freeze({
    slug: "ucla",
    displayName: "UCLA",
    city: "Los Angeles",
    state: "CA",
    clusterType: "university",
    intro:
      "Explore available restaurants, cafés, coffee shops, and menus near UCLA in Westwood, Los Angeles, California. Search nearby food by cuisine, menu item, dietary preference, or nutrition-related intent before visiting campus for class, events, or daily dining. Menuply organizes participating restaurants and menu information around this university destination so you can decide what to eat before you go, whether you need a quick coffee, a fuller meal, or a specific menu item.",
    cardDescription:
      "Available restaurants, cafés, and menus near UCLA in Westwood, Los Angeles.",
    seoTitle: "UCLA Restaurants, Menus & Food | Menuply",
    metaDescription:
      "Explore available restaurants, cafés, coffee shops, and menus near UCLA in Westwood, Los Angeles. Search dining options with Menuply.",
    searchPlaceholder: "Search Dining Options near UCLA",
  }),
  usc: Object.freeze({
    slug: "usc",
    displayName: "USC",
    city: "Los Angeles",
    state: "CA",
    clusterType: "university",
    intro:
      "Discover available restaurants and menus near the University of Southern California in Los Angeles, California. Search nearby food by cuisine, menu item, dietary preference, or nutrition-related intent before class, campus events, or games. Use Menuply to browse participating restaurants around USC and explore what you can eat in this university neighborhood — from everyday campus meals to food worth seeking out before a game or event.",
    cardDescription:
      "Available restaurants and menus near USC and the University of Southern California in Los Angeles.",
    seoTitle: "USC Restaurants, Menus & Food | Menuply",
    metaDescription:
      "Explore available restaurants and menus near USC in Los Angeles, CA. Search nearby dining options with Menuply.",
    searchPlaceholder: "Search Dining Options near USC",
  }),
});

function asSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

/**
 * @param {string} slug
 * @returns {ClusterSeoEntry|null}
 */
export function getClusterSeoContent(slug) {
  const key = asSlug(slug);
  if (!key) return null;
  return CLUSTER_SEO_CONTENT[key] || null;
}

/**
 * Visible intro: SEO config → API short_description → description → null.
 * Warns in development when a loaded public cluster lacks SEO config.
 * @param {object|null|undefined} cluster
 * @returns {string|null}
 */
export function resolveClusterIntro(cluster) {
  if (!cluster) return null;
  const seo = getClusterSeoContent(cluster.slug);
  if (seo?.intro) return seo.intro;

  if (typeof import.meta !== "undefined" && import.meta.env?.DEV) {
    const slug = asSlug(cluster.slug);
    if (slug) {
      console.warn(
        `[clusterSeoContent] Missing unique SEO intro for cluster slug "${slug}". Add an entry to CLUSTER_SEO_CONTENT before publishing generic copy.`,
      );
    }
  }

  const fallback = String(cluster.short_description || cluster.description || "").trim();
  return fallback || null;
}

/**
 * @param {object|null|undefined} cluster
 * @returns {string}
 */
export function resolveClusterSearchPlaceholder(cluster) {
  const seo = getClusterSeoContent(cluster?.slug);
  return seo?.searchPlaceholder || DEFAULT_SEARCH_PLACEHOLDER;
}

/**
 * @param {object|null|undefined} cluster
 * @returns {{ title: string|null, description: string|null }}
 */
export function resolveClusterDocumentMeta(cluster) {
  const seo = getClusterSeoContent(cluster?.slug);
  if (!seo) return { title: null, description: null };
  return {
    title: seo.seoTitle || null,
    description: seo.metaDescription || null,
  };
}

/**
 * Directory card blurb: SEO cardDescription → short_description → null.
 * @param {object|null|undefined} cluster
 * @returns {string|null}
 */
export function resolveClusterCardDescription(cluster) {
  if (!cluster) return null;
  const seo = getClusterSeoContent(cluster.slug);
  if (seo?.cardDescription) return seo.cardDescription;
  const fallback = String(cluster.short_description || "").trim();
  return fallback || null;
}

/**
 * Assert every required public slug has unique non-empty intro + metaDescription.
 * @param {readonly string[]} [requiredSlugs]
 * @returns {{ ok: true } | { ok: false, errors: string[] }}
 */
export function assertPublicClusterSeoCoverage(requiredSlugs = PUBLIC_CLUSTER_SEO_SLUGS) {
  const errors = [];
  const intros = new Set();
  const metas = new Set();

  for (const slug of requiredSlugs) {
    const entry = CLUSTER_SEO_CONTENT[slug];
    if (!entry) {
      errors.push(`Missing CLUSTER_SEO_CONTENT entry for slug "${slug}"`);
      continue;
    }
    const intro = String(entry.intro || "").trim();
    const meta = String(entry.metaDescription || "").trim();
    const title = String(entry.seoTitle || "").trim();
    const card = String(entry.cardDescription || "").trim();
    const placeholder = String(entry.searchPlaceholder || "").trim();

    if (!intro) errors.push(`Empty intro for "${slug}"`);
    if (!meta) errors.push(`Empty metaDescription for "${slug}"`);
    if (!title) errors.push(`Empty seoTitle for "${slug}"`);
    if (!card) errors.push(`Empty cardDescription for "${slug}"`);
    if (!placeholder) errors.push(`Empty searchPlaceholder for "${slug}"`);

    if (intro) {
      if (intros.has(intro)) errors.push(`Duplicate intro shared by "${slug}"`);
      intros.add(intro);
    }
    if (meta) {
      if (metas.has(meta)) errors.push(`Duplicate metaDescription shared by "${slug}"`);
      metas.add(meta);
    }

    if (intro && /you're here\. now let's find something great to eat/i.test(intro)) {
      errors.push(`Generic arrival tagline used as intro for "${slug}"`);
    }
  }

  return errors.length ? { ok: false, errors } : { ok: true };
}
