import { buildSearchLocationParams } from "./locationUtils.js";
import { EMPTY_FILTERS, filtersToUrlParams } from "./filterUtils.js";

const LOCAL_RADIUS_MILES = 8;

export function buildHomeSearchUrl({
  query = "",
  filterKey = null,
  cuisine = null,
  category = null,
  mealPeriod = null,
  occasion = null,
  diningMode = null,
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
  // Structured context for the shared backend contextual recommendation pipeline.
  if (mealPeriod) params.set("meal_period", mealPeriod);
  if (occasion) params.set("occasion", occasion);
  if (diningMode) params.set("dining_mode", diningMode);

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
  const context = entry?.context && typeof entry.context === "object" ? entry.context : {};
  if (entry?.contextAware && entry?.mealPeriod) {
    return buildHomeSearchUrl({
      query: entry?.query || "",
      mealPeriod: entry.mealPeriod || context.mealPeriod || null,
      ...locationContext,
    });
  }
  return buildHomeSearchUrl({
    query: entry?.query || "",
    filterKey: entry?.filterKey || null,
    cuisine: entry?.cuisine || context.cuisine || null,
    category: entry?.category || null,
    mealPeriod: context.mealPeriod || entry?.mealPeriod || null,
    occasion: context.occasion || null,
    diningMode: context.diningMode || null,
    ...locationContext,
  });
}
