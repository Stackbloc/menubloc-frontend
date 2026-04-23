import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import DiscoveryCard from "../components/discovery/DiscoveryCard.jsx";
import AllergenFilterStatusBanner from "../components/consumer/AllergenFilterStatusBanner.jsx";
import StickyPageHeader from "../components/StickyPageHeader.jsx";
import BottomNav from "../components/BottomNav.jsx";
import {
  Card,
  FilterChip as GrubbidFilterChip,
  SelectField,
  StatusMessage,
} from "../components/grubbid/GrubbidPrimitives.jsx";
import { useConsumer } from "../context/ConsumerContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import { apiGet, getBrowseMenus, toConsumerErrorMessage } from "../lib/api.js";
import { buildDietaryQueryParams } from "../lib/dietaryParams.js";
import { buildRestaurantFilterQueryParams } from "../lib/restaurantFilterParams.js";
import { parseFiltersFromUrl, filtersToUrlParams, hasActiveFilters, activeFilterList } from "../lib/filterUtils.js";
import ActiveFilterChips from "../components/discovery/ActiveFilterChips.jsx";
import { isGeoMode } from "../lib/location/locationModel.js";
import { buildLocationLabel } from "../lib/location/locationLabel.js";
import { buildApiLocationParams } from "../lib/location/locationRequest.js";
import { parseLocationFromSearch, mergeLocationIntoSearch } from "../lib/location/locationUrl.js";

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

const DISTANCE_RADIUS_OPTIONS = [
  { label: "Any Distance", value: null },
  { label: "Within 1 mile", value: 1 },
  { label: "Within 3 miles", value: 3 },
  { label: "Within 5 miles", value: 5 },
  { label: "Within 10 miles", value: 10 },
  { label: "Within 25 miles", value: 25 },
];

export default function BrowseMenus() {
  const { t } = useLanguage();
  const { isAuthenticated, allergenFilter: consumerAllergenFilter } = useConsumer();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { search } = useLocation();

  const urlParams = useMemo(() => new URLSearchParams(search), [search]);
  const urlCuisine = urlParams.get("cuisine") || "";
  const urlCategory = urlParams.get("category") || "";

  const locationModel = useMemo(() => parseLocationFromSearch(urlParams), [urlParams]);
  const apiLocationParams = useMemo(() => buildApiLocationParams(locationModel), [locationModel]);
  const isGeoLocation = isGeoMode(locationModel);
  const locationLabel = apiLocationParams ? buildLocationLabel(locationModel) : "";

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [menus, setMenus] = useState([]);
  const [browseOffset, setBrowseOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [responseAllergenFilter, setResponseAllergenFilter] = useState(null);
  const BROWSE_LIMIT = 24;

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
    if (filters.deals) p.set("deals", "1");
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

  function updateRadius(nextRadiusMiles) {
    if (!apiLocationParams || !isGeoLocation) return;

    const nextLocation = {
      ...locationModel,
      radius_miles: nextRadiusMiles,
    };
    const nextParams = mergeLocationIntoSearch(new URLSearchParams(search), nextLocation);
    navigate({ search: nextParams.toString() ? `?${nextParams.toString()}` : "" }, { replace: true });
  }

  useEffect(() => {
    let cancelled = false;

    if (!apiLocationParams) {
      setLoading(false);
      setLoadingMore(false);
      setError("");
      setMenus([]);
      setBrowseOffset(0);
      setHasMore(false);
      setTotalCount(0);
      setResponseAllergenFilter(null);
      return () => {
        cancelled = true;
      };
    }

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
        const dietaryParams = {
          deals: filters.deals ? 1 : "",
          ...buildDietaryQueryParams(filters),
          ...buildRestaurantFilterQueryParams(localFilters),
        };

        const response = await getBrowseMenus({
          ...apiLocationParams,
          limit: BROWSE_LIMIT,
          offset: loadMoreOffset,
          ...dietaryParams,
        });
        if (cancelled) return;

        const extractedMenus = normalizeBrowseMenus(extractMenus(response), cuisineOptions);
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
  }, [apiLocationParams, filters, cuisineOptions, localFilters]);

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

  const showEmptyState = !loading && !error && visibleMenus.length === 0;
  const effectiveAllergenFilter = isAuthenticated
    ? (responseAllergenFilter || consumerAllergenFilter || null)
    : null;

  if (!apiLocationParams) {
    return (
      <div style={{ minHeight: "100vh", background: "#f7f6f1", color: "#101828" }}>
        <StickyPageHeader title={t("browse.title")} />
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: isMobile ? "10px 10px 80px" : "16px 20px 80px",
          }}
        >
          <Card>
            <StatusMessage tone="muted">
              <strong style={{ display: "block", marginBottom: 8, color: "var(--gb-color-ink-strong)" }}>
                {t("browse.locationRequiredTitle", "Location is required")}
              </strong>
              {t(
                "browse.locationRequiredBody",
                "Open this page with a valid city/state or geo URL."
              )}
            </StatusMessage>
          </Card>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f7f6f1", color: "#101828" }}>
      <StickyPageHeader
        title={locationLabel
          ? t("browse.nearTitle", `Browsing Near ${locationLabel}`, { location: locationLabel })
          : t("browse.title")}
      />
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: isMobile ? "10px 10px 80px" : "16px 20px 80px",
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          gap: 16,
          alignItems: "flex-start",
        }}
      >
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

              {isGeoLocation ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <span className="gb-field-label">{t("browse.distance")}</span>
                  <div style={{ display: "grid", gap: 8 }}>
                    {localizedDistanceOptions.map((opt) => (
                      <FilterChip
                        key={String(opt.value)}
                        label={opt.label}
                        active={locationModel.radius_miles === opt.value}
                        onClick={() => updateRadius(opt.value)}
                      />
                    ))}
                  </div>
                </div>
              ) : null}

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

            {hasActiveFilters(filters) && (
              <StatusMessage tone="success" className="gb-status-message--success" style={{ marginBottom: 10 }}>
                <span style={{ fontWeight: 800 }}>{t("browse.dietaryFiltersActive", "Dietary filters active:")}</span>{" "}
                {activeFilterList(filters).map((f) => f.label).join(", ")}
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
                  {error ? "No local menus available in this area" : "No menus found in this area yet."}
                </strong>
                {error || "Try another city or check back soon."}
              </StatusMessage>
            ) : null}

            {!loading && !error && visibleMenus.length > 0 ? (
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
                            const response = await getBrowseMenus({
                              ...apiLocationParams,
                              limit: BROWSE_LIMIT,
                              offset: browseOffset,
                              ...dietaryParams,
                            });
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
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
