import { buildSearchLocationParams } from "./locationUtils.js";
import { EMPTY_FILTERS, filtersToUrlParams } from "./filterUtils.js";

const LOCAL_RADIUS_MILES = 8;

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
  if (entry?.contextAware && entry?.mealPeriod) {
    return buildHomeSearchUrl({
      query: entry?.query || "",
      ...locationContext,
    });
  }
  return buildHomeSearchUrl({
    query: entry?.query || "",
    filterKey: entry?.filterKey || null,
    cuisine: entry?.cuisine || null,
    category: entry?.category || null,
    ...locationContext,
  });
}
