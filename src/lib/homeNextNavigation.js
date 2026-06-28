import { parseLocation, buildSearchLocationParams } from "./locationUtils.js";
import { EMPTY_FILTERS, filtersToUrlParams } from "./filterUtils.js";

const LOCAL_RADIUS_MILES = 8;
const BROWSE_MENUS_PATH = "/browse-menus";

export function buildHomeSearchUrl({
  query = "",
  filterKey = null,
  cuisine = null,
  category = null,
  appliedLocation = "",
  autoLocation = null,
  shouldUseGeoBrowse = false,
}) {
  const explicitLocationValue =
    shouldUseGeoBrowse && !appliedLocation ? "" : appliedLocation;

  const params = buildSearchLocationParams({
    query,
    explicitLocationValue,
    autoLocation: shouldUseGeoBrowse ? autoLocation : null,
    radiusMiles: LOCAL_RADIUS_MILES,
  });

  if (cuisine) params.set("cuisine", cuisine);
  if (category) params.set("category", category);

  if (filterKey) {
    const filters = { ...EMPTY_FILTERS, [filterKey]: true };
    const merged = filtersToUrlParams(filters, params);
    return `/search?${merged.toString()}`;
  }

  const qs = params.toString();
  return qs ? `/search?${qs}` : "/search";
}

/** Navigate target for a home chip entry object. */
export function buildHomeChipUrl(entry, locationContext) {
  if (entry?.to) return entry.to;
  return buildHomeSearchUrl({
    query: entry?.query || "",
    filterKey: entry?.filterKey || null,
    cuisine: entry?.cuisine || null,
    category: entry?.category || null,
    ...locationContext,
  });
}

/**
 * Browse-all link for home discovery sections (existing /browse-menus route).
 * Category-specific backend filters deferred — location scope only for now.
 */
export function buildHomeBrowseUrl({
  sectionId = "",
  appliedLocation = "",
  autoLocation = null,
  shouldUseGeoBrowse = false,
}) {
  const params = new URLSearchParams();

  if (shouldUseGeoBrowse && autoLocation?.lat != null && autoLocation?.lng != null) {
    if (autoLocation.city) params.set("city", autoLocation.city);
    if (autoLocation.state) params.set("state", autoLocation.state);
    params.set("lat", String(autoLocation.lat));
    params.set("lng", String(autoLocation.lng));
    params.set("radius_miles", String(LOCAL_RADIUS_MILES));
  } else if (appliedLocation) {
    const loc = parseLocation(appliedLocation);
    if (loc.city) params.set("city", loc.city);
    if (loc.state) params.set("state", loc.state);
    if (loc.zip) params.set("zip", loc.zip);
  } else if (autoLocation?.city) {
    params.set("city", autoLocation.city);
    if (autoLocation.state) params.set("state", autoLocation.state);
  }

  if (sectionId === "nearby" && shouldUseGeoBrowse) {
    params.set("sort", "nearby");
  }

  const qs = params.toString();
  return qs ? `${BROWSE_MENUS_PATH}?${qs}` : BROWSE_MENUS_PATH;
}
