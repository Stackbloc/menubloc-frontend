import { buildSearchLocationParams } from "./locationUtils.js";
import { EMPTY_FILTERS, filtersToUrlParams } from "./filterUtils.js";

const LOCAL_RADIUS_MILES = 8;

export function buildHomeSearchUrl({
  query = "",
  filterKey = null,
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

  if (filterKey) {
    const filters = { ...EMPTY_FILTERS, [filterKey]: true };
    const merged = filtersToUrlParams(filters, params);
    return `/search?${merged.toString()}`;
  }

  const qs = params.toString();
  return qs ? `/search?${qs}` : "/search";
}
