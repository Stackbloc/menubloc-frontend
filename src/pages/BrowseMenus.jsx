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

import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import MenuPreviewCard from "../components/browse/MenuPreviewCard.jsx";
import AllergenFilterStatusBanner from "../components/consumer/AllergenFilterStatusBanner.jsx";
import { PageNav } from "../components/NavButton.jsx";
import {
  Card,
  FilterChip as GrubbidFilterChip,
  PageHero,
  PageShell,
  PageSplit,
  SelectField,
  StatusMessage,
} from "../components/grubbid/GrubbidPrimitives.jsx";
import { useConsumer } from "../context/ConsumerContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import { apiGet, getBrowseMenus, toConsumerErrorMessage } from "../lib/api.js";
import { buildDietaryQueryParams } from "../lib/dietaryParams.js";
import { buildRestaurantFilterQueryParams } from "../lib/restaurantFilterParams.js";
import { loadDietPrefs, saveDietPrefs, activePrefLabels, hasActiveDietPrefs } from "../hooks/useDietPreferences";
import { buildBrowseLocationParams, reverseGeocode } from "../lib/locationUtils.js";


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

function normalizeCuisineValue(rawCuisine, canonicalCuisineSet) {
  const cuisine = String(rawCuisine || "").trim().toLowerCase();
  if (!cuisine) return null;
  if (canonicalCuisineSet.has(cuisine)) return cuisine;

  const remapToAmerican = new Set([
    "southern",
    "seafood",
    "steakhouse",
    "diner",
    "breakfast",
    "wings",
    "burger",
    "chicken",
    "sandwich",
    "salad",
  ]);

  if (cuisine === "pizza") {
    if (canonicalCuisineSet.has("italian-american")) return "italian-american";
    if (canonicalCuisineSet.has("italian")) return "italian";
    return null;
  }

  if (remapToAmerican.has(cuisine) && canonicalCuisineSet.has("american")) {
    return "american";
  }

  return null;
}

function normalizeBrowseMenus(menus, canonicalCuisineOptions) {
  const cuisineLabelByValue = new Map(
    (Array.isArray(canonicalCuisineOptions) ? canonicalCuisineOptions : []).map((option) => [
      String(option?.value || "").trim().toLowerCase(),
      option?.label || option?.value || "",
    ])
  );
  const canonicalCuisineSet = new Set(cuisineLabelByValue.keys());

  return (Array.isArray(menus) ? menus : []).map((menu) => {
    const normalizedCuisine = normalizeCuisineValue(menu?.cuisine, canonicalCuisineSet);
    return {
      ...menu,
      cuisine: normalizedCuisine ? cuisineLabelByValue.get(normalizedCuisine) || normalizedCuisine : null,
    };
  });
}

function toTranslationSuffix(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[\/\s-]+/g, "_")
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
  const { isAuthenticated, allergenFilter: consumerAllergenFilter } = useConsumer();
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
  const [responseAllergenFilter, setResponseAllergenFilter] = useState(null);
  const BROWSE_LIMIT = 24;
  // Seed from URL so a shared/bookmarked link shows the label immediately
  const [locationLabel, setLocationLabel] = useState(() => {
    const parts = [urlCity, urlState].filter(Boolean);
    return parts.join(", ");
  });
  const [filters, setFilters] = useState(() => ({
    deals: false,
    ...loadDietPrefs(),
  }));
  const [localFilters, setLocalFilters] = useState(() => ({
    cuisine: urlCuisine,
    category: urlCategory,
  }));
  const [cuisineOptions, setCuisineOptions] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
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
  const localizedCuisineOptions = cuisineOptions.map((option) =>
    localizeCanonicalOption(option, "cuisine", t)
  );
  const localizedCategoryOptions = categoryOptions.map((option) =>
    localizeCanonicalOption(option, "category", t)
  );

  const hasDietaryFilter = filters.vegan || filters.vegetarian || filters.gluten_free ||
    filters.dairy_free || filters.diabetic_friendly || filters.keto || filters.low_sodium || filters.deals;

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

  // Persist diet prefs whenever they change
  useEffect(() => { saveDietPrefs(filters); }, [filters]);

  useEffect(() => {
    let cancelled = false;

    async function run(loadMoreOffset = 0) {
      if (loadMoreOffset === 0) {
        setLoading(true);
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
        const response = await getBrowseMenus(apiParams);
        if (cancelled) return;

        const extractedMenus = normalizeBrowseMenus(extractMenus(response), cuisineOptions);
        // Backend already returns results nearest-first (or alphabetical when no distance).
        // No client-side resort needed — preserve server order.

        const newTotal = response?.total_count ?? extractedMenus.length;
        const newOffset = response?.pagination?.next_offset ?? (loadMoreOffset + extractedMenus.length);

        if (loadMoreOffset === 0) {
          setMenus(extractedMenus);
        } else {
          setMenus((prev) => [...prev, ...extractedMenus]);
        }
        setResponseAllergenFilter(response?.allergen_filter || null);

        setTotalCount(newTotal);
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
        if (cancelled) return;
        setError(readErrorMessage(fetchError));
      } finally {
        if (!cancelled) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    }

    run(0);

    return () => {
      cancelled = true;
    };
  // Re-run when the URL location, filters, or radius changes.
  // radiusMiles only affects geo mode — city/state mode ignores it.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlCity, urlState, filters, radiusMiles, cuisineOptions, localFilters]);

  const showEmptyState = !loading && !error && menus.length === 0;
  const effectiveAllergenFilter = isAuthenticated
    ? (responseAllergenFilter || consumerAllergenFilter || null)
    : null;

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

  return (
    <PageShell width="wide">
      <PageNav />

      <PageSplit
        mobileStack={isMobile}
        aside={(
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
                label={t("browse.cuisine")}
                options={localizedCuisineOptions}
                value={localFilters.cuisine}
                allLabel={t("common.all")}
                onChange={(value) => {
                  const nextLocalFilters = { ...localFilters, cuisine: value };
                  setLocalFilters(nextLocalFilters);
                  updateBrowseQuery(nextLocalFilters);
                }}
              />
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
                    onClick={() => setFilters((prev) => ({ ...prev, deals: !prev.deals }))}
                  />
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <span className="gb-field-label">{t("discovery.dietary")}</span>
                <div style={{ display: "grid", gap: 10 }}>
                  <FilterChip label={t("diet.dairy_free")} active={filters.dairy_free} onClick={() => setFilters((prev) => ({ ...prev, dairy_free: !prev.dairy_free }))} />
                  <FilterChip label={t("diet.diabetic_friendly")} active={filters.diabetic_friendly} onClick={() => setFilters((prev) => ({ ...prev, diabetic_friendly: !prev.diabetic_friendly }))} />
                  <FilterChip label={t("diet.gluten_free")} active={filters.gluten_free} onClick={() => setFilters((prev) => ({ ...prev, gluten_free: !prev.gluten_free }))} />
                  <FilterChip label={t("diet.keto")} active={filters.keto} onClick={() => setFilters((prev) => ({ ...prev, keto: !prev.keto }))} />
                  <FilterChip label={t("diet.low_sodium")} active={filters.low_sodium} onClick={() => setFilters((prev) => ({ ...prev, low_sodium: !prev.low_sodium }))} />
                  <FilterChip label={t("diet.vegan")} active={filters.vegan} onClick={() => setFilters((prev) => ({ ...prev, vegan: !prev.vegan }))} />
                  <FilterChip label={t("diet.vegetarian")} active={filters.vegetarian} onClick={() => setFilters((prev) => ({ ...prev, vegetarian: !prev.vegetarian }))} />
                </div>
              </div>
            </div>
          </Card>
        )}
      >
        <PageHero
          title={locationLabel ? t("browse.nearTitle", `Browsing Menus Near ${locationLabel}`, { location: locationLabel }) : t("browse.title")}
        />

        {effectiveAllergenFilter ? (
          <AllergenFilterStatusBanner allergenFilter={effectiveAllergenFilter} style={{ marginBottom: 14 }} />
        ) : null}

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
              {visibleMenus.length === 1
                ? t("browse.menuCountSingle", "1 menu", { count: visibleMenus.length })
                : t("browse.menuCountPlural", `${visibleMenus.length} menus`, { count: visibleMenus.length })}
            </div>
          </div>

          {hasActiveDietPrefs(filters) && (
            <StatusMessage tone="success" className="gb-status-message--success" style={{ marginBottom: 10 }}>
              <span style={{ fontWeight: 800 }}>{t("browse.dietaryFiltersActive", "Dietary filters active:")}</span>{" "}
              {activePrefLabels(filters).join(", ")}
              <span style={{ color: "var(--gb-color-ink-soft)", fontWeight: 500, fontSize: 11 }}>
                {` ${t("browse.dietaryFiltersNote", "— will filter items inside each restaurant's menu")}`}
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
                  style={{ height: 148, borderRadius: 16, background: "rgba(0,0,0,0.06)" }}
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
                  <MenuPreviewCard
                    key={String(menu?.menu_id ?? menu?.restaurant_id ?? index)}
                    menu={menu}
                    index={index}
                    isMobile={isMobile}
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
                        setLoadingMore(true);
                        setError("");
                        try {
                          const dietaryParams = {
                            deals: filters.deals ? 1 : "",
                            ...buildDietaryQueryParams(filters),
                            ...buildRestaurantFilterQueryParams(localFilters),
                          };
                          let coords = { lat: null, lng: null };
                          try { coords = await getUserCoords(); } catch (_) {}
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
                          const more = normalizeBrowseMenus(extractMenus(response), cuisineOptions);
                          const newTotal = response?.total_count ?? (browseOffset + more.length);
                          const newOffset = response?.pagination?.next_offset ?? (browseOffset + more.length);
                          setMenus((prev) => [...prev, ...more]);
                          setResponseAllergenFilter((prev) => response?.allergen_filter || prev);
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
      </PageSplit>
    </PageShell>
  );
}
