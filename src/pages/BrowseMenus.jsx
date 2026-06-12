/**
 * ============================================================
 * File: BrowseMenus.jsx
 * Path: menubloc-frontend/src/pages/BrowseMenus.jsx
 * Date: 2026-03-25
 * Purpose:
 *   Browse Menus / Netflix-style browser page.
 *
 *   Search mode priority (explicit beats implicit):
 *   1. If ?city= and ?state= are in the URL → city/state mode.
 *      Geolocation is NOT called. Backend receives city+state params.
 *      Subtitle: "Showing menus near Dothan, AL"
 *      Distance filter is hidden — no lat/lng to compute from.
 *   2. Otherwise → browser geolocation mode.
 *      Backend receives lat/lng + radius. Results sorted nearest-first.
 *      Distance filter is visible; user can change radius.
 *
 *   Fix 2026-03-16:
 *     city+state in URL → skip geolocation, send city+state to backend.
 *
 *   Fix 2026-03-25 (Distance filter):
 *     Added Distance filter UI to sidebar (geo mode only). User can
 *     select a radius: 1, 3, 5, 10, 25 miles. Default 10 miles.
 *     radiusMiles state is added to useEffect dependency array so a
 *     change triggers a re-fetch. In city/state mode the distance
 *     section is hidden because the backend has no user coordinates to
 *     compute from.
 * ============================================================
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import DiscoveryCard from "../components/discovery/DiscoveryCard.jsx";
import StickyPageHeader from "../components/StickyPageHeader.jsx";
import BottomNav from "../components/BottomNav.jsx";
import {
  Card,
  FilterChip as GrubbidFilterChip,
  SelectField,
  StatusMessage,
} from "../components/grubbid/GrubbidPrimitives.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import { apiGet, getBrowseMenus, toConsumerErrorMessage } from "../lib/api.js";
import { buildDietaryQueryParams } from "../lib/dietaryParams.js";
import { buildRestaurantFilterQueryParams } from "../lib/restaurantFilterParams.js";
import { parseFiltersFromUrl, filtersToUrlParams, hasActiveFilters, activeFilterList } from "../lib/filterUtils.js";
import ActiveFilterChips from "../components/discovery/ActiveFilterChips.jsx";
import { buildBrowseLocationParams, reverseGeocode } from "../lib/locationUtils.js";
import { dedupeDiscoveryMenus } from "../lib/discoveryFeedGuardrails.js";


function useIsMobile(breakpoint = 900) {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth <= breakpoint;
  });

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    function handleResize() {
      setIsMobile(window.innerWidth <= breakpoint);
    }

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [breakpoint]);

  return isMobile;
}

function readErrorMessage(error) {
  return toConsumerErrorMessage(
    error,
    "We couldn't load nearby menus right now. Please try again in a moment."
  );
}

function extractMenus(response) {
  if (Array.isArray(response?.menus)) return response.menus;
  const firstRow = Array.isArray(response?.rows) ? response.rows[0] : null;
  return Array.isArray(firstRow?.menus) ? firstRow.menus : [];
}

function normalizeBrowseMenus(menus) {
  return (Array.isArray(menus) ? menus : []).map((menu) => ({
    ...menu,
    cuisine: menu?.cuisine ? String(menu.cuisine).trim().toLowerCase() : null,
    category: menu?.category ? String(menu.category).trim().toLowerCase() : null,
  }));
}

function toTranslationSuffix(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[/\s-]+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function localizeCanonicalOption(option, prefix, t) {
  const rawValue = typeof option === "string" ? option : option?.value || option?.label || "";
  const rawLabel = typeof option === "string" ? option : option?.label || option?.value || "";
  const key = `${prefix}.${toTranslationSuffix(rawValue)}`;
  return {
    value: typeof option === "string" ? option : option?.value || "",
    label: t(key, rawLabel),
  };
}

function FilterChip({ label, active, onClick }) {
  return (
    <GrubbidFilterChip active={active} onClick={onClick}>
      {label}
    </GrubbidFilterChip>
  );
}

function FilterSelect({ label, options, value, onChange, allLabel = "All" }) {
  const normalizedOptions = (Array.isArray(options) ? options : []).map((option) =>
    typeof option === "string"
      ? { value: option, label: option }
      : { value: option?.value || "", label: option?.label || option?.value || "" }
  );

  return (
    <SelectField label={label} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{allLabel}</option>
        {normalizedOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </SelectField>
  );
}

function InlineSelect({ value, onChange, options, ariaLabel, disabled = false, prefix = "" }) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-label={ariaLabel}
      disabled={disabled}
      style={{
        minHeight: 38,
        maxWidth: "100%",
        border: "1px solid var(--gb-color-border)",
        borderRadius: 999,
        background: disabled ? "rgba(255,255,255,0.06)" : "var(--gb-color-surface-strong)",
        color: disabled ? "var(--gb-color-ink-muted)" : "var(--gb-color-ink)",
        fontSize: 13,
        fontWeight: 900,
        padding: "0 32px 0 12px",
        whiteSpace: "nowrap",
      }}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {prefix}{option.label}
        </option>
      ))}
    </select>
  );
}

// Distance radius options. "Any Distance" (null) = no radius cap.
// In city/state mode, selecting a specific radius triggers geolocation so the
// backend can apply a haversine WHERE clause from the user's actual position.
// Backend clamps radius to 4000 miles maximum via clampBrowseRadiusMiles().
const DISTANCE_RADIUS_OPTIONS = [
  { label: "Any Distance",    value: null },
  { label: "Within 1 mile",   value: 1    },
  { label: "Within 3 miles",  value: 3    },
  { label: "Within 5 miles",  value: 5    },
  { label: "Within 10 miles", value: 10   },
  { label: "Within 25 miles", value: 25   },
];

function getUserCoords() {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !navigator?.geolocation) {
      resolve({ lat: null, lng: null, source: "unavailable" });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = Number(position?.coords?.latitude);
        const lng = Number(position?.coords?.longitude);

        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          resolve({ lat, lng, source: "browser" });
          return;
        }

        resolve({ lat: null, lng: null, source: "unavailable" });
      },
      () => {
        resolve({ lat: null, lng: null, source: "unavailable" });
      },
      {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 300000,
      }
    );
  });
}

export default function BrowseMenus() {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { search } = useLocation();
  const urlParams = new URLSearchParams(search);
  const urlCity = urlParams.get("city") || "";
  const urlState = urlParams.get("state") || "";
  const urlCuisine = urlParams.get("cuisine") || "";
  const urlCategory = urlParams.get("category") || "";

  // True when the URL explicitly specifies the location — geolocation must not run.
  // City alone is sufficient; state is optional and used as an additional filter when present.
  const hasCityStateParams = Boolean(urlCity);

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [menus, setMenus] = useState([]);
  const [browseOffset, setBrowseOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const BROWSE_LIMIT = 24;
  // Seed from URL so a shared/bookmarked link shows the label immediately
  const [locationLabel, setLocationLabel] = useState(() => {
    const parts = [urlCity, urlState].filter(Boolean);
    return parts.join(", ");
  });
  const filters = useMemo(
    () => parseFiltersFromUrl(new URLSearchParams(search)),
    [search]
  );
  const [localFilters, setLocalFilters] = useState(() => ({
    cuisine: urlCuisine,
    category: urlCategory,
  }));
  const [cuisineOptions, setCuisineOptions] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [browseCuisineFacets, setBrowseCuisineFacets] = useState([]);
  const [marketplaceMenuCount, setMarketplaceMenuCount] = useState(0);
  const [supportsNearbySort, setSupportsNearbySort] = useState(false);
  const browseRequestRef = useRef(0);
  // radiusMiles: null = any distance (no radius cap).
  // In geo mode default to 10 miles. In city/state mode default to null (any).
  // When a non-null radius is selected in city/state mode, geolocation is requested
  // so the backend can filter by actual distance from the user's position.
  const [radiusMiles, setRadiusMiles] = useState(() => hasCityStateParams ? null : 10);
  const [alphaGroup, setAlphaGroup] = useState(null);
  const localizedDistanceOptions = DISTANCE_RADIUS_OPTIONS.map((opt) => {
    if (opt.value == null) {
      return { ...opt, label: t("browse.anyDistance") };
    }
    return {
      ...opt,
      label: opt.value === 1
        ? t("browse.withinMile", opt.label, { count: opt.value })
        : t("browse.withinMiles", opt.label, { count: opt.value }),
    };
  });
  const localizedCategoryOptions = categoryOptions.map((option) =>
    localizeCanonicalOption(option, "category", t)
  );
  const localizedBrowseCuisineOptions = useMemo(() => {
    const canonicalLabelByValue = new Map(
      cuisineOptions.map((option) => [
        String(option?.value || "").trim().toLowerCase(),
        option?.label || option?.value || "",
      ])
    );

    return browseCuisineFacets
      .filter((facet) => Number(facet?.count || 0) > 0)
      .map((facet) => {
        const value = String(facet?.value || "").trim().toLowerCase();
        const canonical = {
          value,
          label: canonicalLabelByValue.get(value) || facet?.label || value,
        };
        return {
          ...localizeCanonicalOption(canonical, "cuisine", t),
          count: Number(facet?.count || 0),
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [browseCuisineFacets, cuisineOptions, t]);
  const browseCuisineControlOptions = [
    { value: "", label: t("browse.allCuisines", "All cuisines") },
    ...localizedBrowseCuisineOptions,
  ];
  const browseScopeKey = useMemo(
    () => `${hasCityStateParams ? `${urlCity}|${urlState}` : "geo"}::${search}::${radiusMiles ?? "any"}`,
    [hasCityStateParams, urlCity, urlState, search, radiusMiles]
  );
  const browseScopeRef = useRef(browseScopeKey);

  useEffect(() => {
    browseScopeRef.current = browseScopeKey;
  }, [browseScopeKey]);

  useEffect(() => {
    let cancelled = false;

    Promise.allSettled([
      apiGet("/api/meta/cuisines"),
      apiGet("/api/meta/categories"),
    ]).then(([cuisinesResult, categoriesResult]) => {
      if (cancelled) return;

      setCuisineOptions(
        cuisinesResult.status === "fulfilled" && Array.isArray(cuisinesResult.value?.cuisines)
          ? cuisinesResult.value.cuisines
          : []
      );
      setCategoryOptions(
        categoriesResult.status === "fulfilled" && Array.isArray(categoriesResult.value?.categories)
          ? categoriesResult.value.categories
          : []
      );
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setLocalFilters({
      cuisine: urlCuisine,
      category: urlCategory,
    });
  }, [urlCuisine, urlCategory]);

  const activeFilterLabel = (() => {
    if (filters.vegan) return "vegan";
    if (filters.vegetarian) return "vegetarian";
    if (filters.diabetic_friendly) return "diabetic-friendly";
    if (filters.dairy_free) return "dairy-free";
    if (filters.gluten_free) return "gluten-free";
    if (filters.keto) return "keto";
    if (filters.low_fat) return "low-fat";
    if (filters.low_sodium) return "low-sodium";
    if (filters.deals) return "deal";
    return null;
  })();

  const activeFilterParams = (() => {
    const p = new URLSearchParams();
    for (const [key, value] of Object.entries(buildDietaryQueryParams(filters))) {
      if (value) p.set(key, String(value));
    }
    for (const [key, value] of Object.entries(buildRestaurantFilterQueryParams(localFilters))) {
      if (value) p.set(key, value);
    }
    if (filters.deals)             p.set("deals", "1");
    return p.toString();
  })();

  function updateBrowseQuery(nextLocalFilters) {
    const next = new URLSearchParams(search);
    const restaurantParams = buildRestaurantFilterQueryParams(nextLocalFilters);
    if (restaurantParams.cuisine) next.set("cuisine", restaurantParams.cuisine);
    else next.delete("cuisine");
    if (restaurantParams.category) next.set("category", restaurantParams.category);
    else next.delete("category");
    navigate({ search: next.toString() ? `?${next.toString()}` : "" }, { replace: true });
  }

  function toggleFilter(key) {
    const next = { ...filters, [key]: !filters[key] };
    const nextParams = filtersToUrlParams(next, new URLSearchParams(search));
    navigate({ search: nextParams.toString() ? `?${nextParams.toString()}` : "" }, { replace: true });
  }

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const requestId = browseRequestRef.current + 1;
    browseRequestRef.current = requestId;

    async function run(loadMoreOffset = 0) {
      if (loadMoreOffset === 0) {
        setLoading(true);
        setMenus([]);
        setBrowseOffset(0);
        setHasMore(false);
      } else {
        setLoadingMore(true);
      }
      setError("");

      try {
        let apiParams;

        const dietaryParams = {
          deals: filters.deals ? 1 : "",
          ...buildDietaryQueryParams(filters),
          ...buildRestaurantFilterQueryParams(localFilters),
        };

        if (hasCityStateParams) {
          // ── Mode 1: explicit city/state from URL ─────────────────
          setLocationLabel([urlCity, urlState].filter(Boolean).join(", "));
          const coords = await getUserCoords();
          if (cancelled) return;
          const hasCoords = coords.lat !== null && coords.lng !== null;
          apiParams = {
            ...buildBrowseLocationParams({
              urlCity,
              urlState,
              coords: hasCoords ? coords : null,
              radiusMiles,
            }),
            limit: BROWSE_LIMIT,
            offset: loadMoreOffset,
            ...dietaryParams,
          };
        } else {
          // ── Mode 2: browser geolocation ───────────────────────────
          const coords = await getUserCoords();
          if (cancelled) return;
          const hasCoords = coords.lat !== null && coords.lng !== null;
          if (!hasCoords && radiusMiles !== null) {
            setRadiusMiles(null);
          }
          // Set display label from reverse-geocoded user position (precise city/state),
          // not from the first restaurant result. Restaurants nearby may have a different
          // city in their address than the user's actual location.
          if (hasCoords) {
            reverseGeocode(coords.lat, coords.lng)
              .then((geo) => {
                if (!cancelled && geo.label) setLocationLabel(geo.label);
              })
              .catch(() => {});
          }
          apiParams = {
            ...buildBrowseLocationParams({
              coords: hasCoords ? coords : null,
              radiusMiles,
            }),
            limit: BROWSE_LIMIT,
            offset: loadMoreOffset,
            ...dietaryParams,
          };
        }

        // Always show restaurant cards — dietary filters apply within each restaurant's menu
          const response = await getBrowseMenus(apiParams, { signal: controller.signal });
          if (cancelled || controller.signal.aborted || requestId !== browseRequestRef.current) return;

        const extractedMenus = dedupeDiscoveryMenus(
          normalizeBrowseMenus(extractMenus(response))
        );
        // Backend already returns results nearest-first (or alphabetical when no distance).
        // No client-side resort needed — preserve server order.

        const newTotal = response?.total_count ?? extractedMenus.length;
        const newOffset = response?.pagination?.next_offset ?? (loadMoreOffset + extractedMenus.length);

        if (loadMoreOffset === 0) {
          setMenus(extractedMenus);
        } else {
          setMenus((prev) => dedupeDiscoveryMenus([...prev, ...extractedMenus]));
        }
        setTotalCount(newTotal);
        setMarketplaceMenuCount(Number(response?.marketplace_menu_count ?? newTotal ?? 0));
        setBrowseCuisineFacets(Array.isArray(response?.facets?.cuisines) ? response.facets.cuisines : []);
        setSupportsNearbySort(response?.supports?.sort_nearby === true);
        setBrowseOffset(newOffset);
        setHasMore(response?.pagination?.has_more ?? (newOffset < newTotal));

        // In city/state mode the URL is already authoritative.
        // In geo mode the display label is set by reverseGeocode above (user's precise
        // city). We do NOT derive the display label from restaurant data — a restaurant
        // in an adjacent city would produce a misleading label (e.g. "Los Angeles" when
        // the user is in Pasadena). The URL stays lat/lng-based in geo mode.
        if (!hasCityStateParams) {
          // intentionally left blank — display label set from reverseGeocode above
          void 0;
        }
      } catch (fetchError) {
        if (cancelled || fetchError?.name === "AbortError" || requestId !== browseRequestRef.current) return;
        setError(readErrorMessage(fetchError));
      } finally {
        if (!cancelled && requestId === browseRequestRef.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    }

    run(0);

    return () => {
      cancelled = true;
      controller.abort();
    };
  // Re-run when the URL location, filters, or radius changes.
  // radiusMiles only affects geo mode — city/state mode ignores it.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlCity, urlState, filters, radiusMiles, localFilters, browseScopeKey]);

  const showEmptyState = !loading && !error && menus.length === 0;

  // ── Alpha range computation ────────────────────────────────────
  // Derive the unique first letters present in loaded menus, then
  // split them into 3 equal-ish groups to form range chips.
  const alphaRanges = [
    { label: "A – I", letters: new Set("ABCDEFGHI".split("")) },
    { label: "J – R", letters: new Set("JKLMNOPQR".split("")) },
    { label: "S – Z", letters: new Set("STUVWXYZ".split("")) },
  ];

  const visibleMenus = menus.filter((m) => {
    if (alphaGroup) {
      const first = (m.restaurant_name || m.name || "").trim().replace(/^[Tt]he\s+/, "")[0]?.toUpperCase();
      if (!alphaGroup.letters.has(first)) return false;
    }
    if (localFilters.cuisine) {
      if ((m.cuisine || "").toLowerCase() !== localFilters.cuisine.toLowerCase()) return false;
    }
    if (localFilters.category) {
      if ((m.category || "").toLowerCase() !== localFilters.category.toLowerCase()) return false;
    }
    return true;
  });
  const displayedMenuCount = totalCount || visibleMenus.length;
  const useExpandedBrowseControls = marketplaceMenuCount > 25;
  const browseSortOptions = [{ value: "nearby", label: "Nearby" }];

  function updateCuisineFilter(value) {
    const nextLocalFilters = { ...localFilters, cuisine: value };
    setLocalFilters(nextLocalFilters);
    updateBrowseQuery(nextLocalFilters);
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--gb-color-page)", color: "var(--gb-color-ink)" }}>
      <StickyPageHeader
        title={locationLabel
          ? t("browse.nearTitle", `Browsing Near ${locationLabel}`, { location: locationLabel })
          : t("browse.title")}
      />
      <div style={{
        maxWidth: 1200, margin: "0 auto",
        padding: isMobile ? "10px 10px 80px" : "16px 20px 80px",
        display: "flex", flexDirection: isMobile ? "column" : "row",
        gap: 16, alignItems: "flex-start",
      }}>
        <div style={{ width: isMobile ? "100%" : 240, flexShrink: 0 }}>
          <Card>
            <div style={{ marginBottom: 14, color: "var(--gb-color-ink-strong)", fontSize: 16, fontWeight: 900 }}>
              {t("browse.viewBy", "View By")}
            </div>

            <div style={{ display: "grid", gap: 14 }}>
              {alphaRanges.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <span className="gb-field-label">{t("browse.alphabetically", "Alphabetically")}</span>
                  <div style={{ display: "grid", gap: 8 }}>
                    <FilterChip
                      label={t("common.all")}
                      active={alphaGroup === null}
                      onClick={() => setAlphaGroup(null)}
                    />
                    {alphaRanges.map((range) => (
                      <FilterChip
                        key={range.label}
                        label={range.label}
                        active={alphaGroup?.label === range.label}
                        onClick={() => setAlphaGroup(alphaGroup?.label === range.label ? null : range)}
                      />
                    ))}
                  </div>
                </div>
              ) : null}

              <FilterSelect
                label={t("browse.category")}
                  options={localizedCategoryOptions}
                value={localFilters.category}
                allLabel={t("common.all")}
                onChange={(value) => {
                  const nextLocalFilters = { ...localFilters, category: value };
                  setLocalFilters(nextLocalFilters);
                  updateBrowseQuery(nextLocalFilters);
                }}
              />

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <span className="gb-field-label">{t("browse.distance")}</span>
                <div style={{ display: "grid", gap: 8 }}>
                  {localizedDistanceOptions.map((opt) => (
                    <FilterChip
                      key={String(opt.value)}
                      label={opt.label}
                      active={radiusMiles === opt.value}
                      onClick={() => setRadiusMiles(opt.value)}
                    />
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <span className="gb-field-label">{t("browse.offers", "Offers")}</span>
                <div style={{ display: "grid", gap: 10 }}>
                  <FilterChip
                    label={t("common.deals", "Deals")}
                    active={filters.deals}
                    onClick={() => toggleFilter("deals")}
                  />
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <span className="gb-field-label">{t("discovery.dietary")}</span>
                <div style={{ display: "grid", gap: 10 }}>
                  <FilterChip label={t("diet.dairy_free")} active={filters.dairy_free} onClick={() => toggleFilter("dairy_free")} />
                  <FilterChip label={t("diet.diabetic_friendly")} active={filters.diabetic_friendly} onClick={() => toggleFilter("diabetic_friendly")} />
                  <FilterChip label={t("diet.gluten_free")} active={filters.gluten_free} onClick={() => toggleFilter("gluten_free")} />
                  <FilterChip label={t("diet.keto")} active={filters.keto} onClick={() => toggleFilter("keto")} />
                  <FilterChip label={t("diet.low_fat")} active={filters.low_fat} onClick={() => toggleFilter("low_fat")} />
                  <FilterChip label={t("diet.low_sodium")} active={filters.low_sodium} onClick={() => toggleFilter("low_sodium")} />
                  <FilterChip label={t("diet.vegan")} active={filters.vegan} onClick={() => toggleFilter("vegan")} />
                  <FilterChip label={t("diet.vegetarian")} active={filters.vegetarian} onClick={() => toggleFilter("vegetarian")} />
                </div>
              </div>
            </div>
          </Card>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>

        <ActiveFilterChips filters={filters} onToggle={toggleFilter} />

        {/* GUARDRAIL:
            Do not render broad allergen warning blocks on public discovery/browse/menu-list cards.
            Allergen alerts are contextual item-level signals only and must remain small/restrained
            unless the user explicitly opens an allergen/nutrition detail context. */}

        <Card>
          <div
            style={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              alignItems: isMobile ? "flex-start" : "center",
              justifyContent: "space-between",
              gap: 8,
              padding: "4px 4px 18px",
            }}
          >
            <div className="gb-count-label" style={{ whiteSpace: "nowrap" }}>
              {displayedMenuCount === 1
                ? t("browse.menuCountSingle", "1 menu", { count: displayedMenuCount })
                : t("browse.menuCountPlural", `${displayedMenuCount} menus`, { count: displayedMenuCount })}
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                alignItems: "center",
                width: isMobile ? "100%" : "auto",
              }}
            >
              {useExpandedBrowseControls ? (
                <>
                  <InlineSelect
                    value={localFilters.cuisine}
                    onChange={updateCuisineFilter}
                    options={browseCuisineControlOptions}
                    ariaLabel={t("browse.cuisine", "Cuisine")}
                  />
                  <InlineSelect
                    value="nearby"
                    onChange={() => {}}
                    options={browseSortOptions}
                    ariaLabel="Sort"
                    prefix="Sort: "
                    disabled={!supportsNearbySort}
                  />
                  <button
                    type="button"
                    disabled
                    title="Open Now is unavailable until public hours logic is available."
                    style={{
                      minHeight: 38,
                      border: "1px solid var(--gb-color-border)",
                      borderRadius: 999,
                      background: "rgba(255,255,255,0.06)",
                      color: "var(--gb-color-ink-muted)",
                      fontSize: 13,
                      fontWeight: 900,
                      padding: "0 12px",
                    }}
                  >
                    Open Now
                  </button>
                </>
              ) : (
                <InlineSelect
                  value={localFilters.cuisine}
                  onChange={updateCuisineFilter}
                  options={browseCuisineControlOptions}
                  ariaLabel={t("browse.cuisine", "Cuisine")}
                />
              )}
            </div>
          </div>

          {hasActiveFilters(filters) && (
            <StatusMessage tone="success" className="gb-status-message--success" style={{ marginBottom: 10 }}>
              <span style={{ fontWeight: 800 }}>{t("browse.dietaryFiltersActive", "Dietary filters active:")}</span>{" "}
              {activeFilterList(filters).map((f) => f.label).join(", ")}
              <span style={{ color: "var(--gb-color-ink-soft)", fontWeight: 500, fontSize: 11 }}>
                {` ${t("browse.dietaryFiltersNote", "— counts reflect matching items inside each restaurant")}`}
              </span>
            </StatusMessage>
          )}

          {loading ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(220px, 1fr))",
                gap: 14,
                padding: "2px 4px 6px",
              }}
            >
              {[0, 1, 2, 3, 4, 5].map((card) => (
                <div
                  key={card}
                  style={{ height: 148, borderRadius: 16, background: "rgba(18,34,28,0.07)" }}
                />
              ))}
            </div>
          ) : null}

          {(error || showEmptyState) ? (
            <StatusMessage tone="muted">
              <strong style={{ display: "block", marginBottom: 8, color: "var(--gb-color-ink-strong)" }}>
                {t("browse.emptyTitle", "No local menus available in this area")}
              </strong>
              {error || t("browse.emptyBody", "We are constantly adding menus. Please check back soon.")}
            </StatusMessage>
          ) : null}

          {!loading && !error && menus.length > 0 ? (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(220px, 1fr))",
                  gap: 14,
                  padding: "2px 4px 8px",
                }}
              >
                {visibleMenus.map((menu, index) => (
                  <DiscoveryCard
                    key={String(menu?.menu_id ?? menu?.restaurant_id ?? index)}
                    menu={menu}
                    hasActiveFilters={hasActiveFilters(filters)}
                    activeFilterLabel={activeFilterLabel}
                    activeFilterParams={activeFilterParams}
                  />
                ))}
              </div>

              {hasMore && (
                <div style={{ display: "flex", justifyContent: "center", marginTop: 20 }}>
                  <button
                    type="button"
                    disabled={loadingMore}
                    className={`gb-pill-button ${loadingMore ? "gb-pill-button--secondary" : "gb-pill-button--primary"}`}
                    onClick={() => {
                      (async () => {
                        const requestScopeKey = browseScopeKey;
                        setLoadingMore(true);
                        setError("");
                        try {
                          const dietaryParams = {
                            deals: filters.deals ? 1 : "",
                            ...buildDietaryQueryParams(filters),
                            ...buildRestaurantFilterQueryParams(localFilters),
                          };
                          let coords = { lat: null, lng: null };
                          try {
                            coords = await getUserCoords();
                          } catch {
                            coords = { lat: null, lng: null };
                          }
                          const hasCoords = coords.lat !== null && coords.lng !== null;
                          const apiParams = {
                            ...buildBrowseLocationParams(
                              hasCityStateParams
                                ? {
                                    urlCity,
                                    urlState,
                                    coords: hasCoords ? coords : null,
                                    radiusMiles,
                                  }
                                : {
                                    coords: hasCoords ? coords : null,
                                    radiusMiles,
                                  }
                            ),
                            limit: BROWSE_LIMIT,
                            offset: browseOffset,
                            ...dietaryParams,
                          };
                          const response = await getBrowseMenus(apiParams);
                          if (requestScopeKey !== browseScopeRef.current) return;
                          const more = dedupeDiscoveryMenus(
                            normalizeBrowseMenus(extractMenus(response))
                          );
                          const newTotal = response?.total_count ?? (browseOffset + more.length);
                          const newOffset = response?.pagination?.next_offset ?? (browseOffset + more.length);
                          setMenus((prev) => dedupeDiscoveryMenus([...prev, ...more]));
                          setTotalCount(newTotal);
                          setBrowseOffset(newOffset);
                          setHasMore(response?.pagination?.has_more ?? (newOffset < newTotal));
                        } catch (e) {
                          setError(readErrorMessage(e));
                        } finally {
                          setLoadingMore(false);
                        }
                      })();
                    }}
                  >
                    {loadingMore ? "Loading…" : `Load More (${totalCount - menus.length} remaining)`}
                  </button>
                </div>
              )}
            </>
          ) : null}
        </Card>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
