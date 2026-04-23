/**
 * ============================================================
 * File: GrubbidSearchResults.jsx
 * Path: menubloc-frontend/src/pages/GrubbidSearchResults.jsx
 * Date: 2026-04-21
 * Purpose:
 *   Search results page for Grubbid.
 *   - Reads query params from URL
 *   - Calls backend /search endpoint with canonical URL-authored location
 *   - Groups menu-item results by restaurant
 *   - Dedupes menu items per restaurant (best score, then lower price)
 *   - Interactive filter bar (vegan, gluten-free, deals, price max)
 *
 *   Location authority:
 *   - URL is the only authority
 *   - Location is parsed only through parseLocationFromSearch()
 *   - API location params are built only through buildApiLocationParams()
 *   - Invalid location prevents fetching and shows explicit fallback UI
 * ============================================================
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import SearchResultCard from "../components/SearchResultCard";
import ActiveFilterChips from "../components/discovery/ActiveFilterChips.jsx";
import { BrandLogo } from "../components/BrandLogo.jsx";
import BottomNav from "../components/BottomNav.jsx";
import { SectionTitle, StatusMessage } from "../components/grubbid/GrubbidPrimitives.jsx";
import AllergenFilterStatusBanner from "../components/consumer/AllergenFilterStatusBanner.jsx";
import { useConsumer } from "../context/ConsumerContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import { buildDietaryQueryParams } from "../lib/dietaryParams.js";
import { buildRestaurantFilterQueryParams } from "../lib/restaurantFilterParams.js";
import { parseFiltersFromUrl, filtersToUrlParams } from "../lib/filterUtils.js";
import { toConsumerErrorMessage } from "../lib/api.js";
import { parseLocationFromSearch } from "../lib/location/locationUrl.js";
import { buildLocationLabel } from "../lib/location/locationLabel.js";
import { buildApiLocationParams } from "../lib/location/locationRequest.js";
import { isGeoMode } from "../lib/location/locationModel.js";

const API = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001").replace(/\/$/, "");
const SEARCH_SESSION_KEY = "grubbid.search.session_id";

function useIsMobile(breakpoint = 768) {
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

function useQueryParams() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

function getOrCreateSearchSessionId() {
  if (typeof window === "undefined") return "";

  const existing = String(window.sessionStorage.getItem(SEARCH_SESSION_KEY) || "").trim();
  if (existing) return existing;

  const created =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `search-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  window.sessionStorage.setItem(SEARCH_SESSION_KEY, created);
  return created;
}

function compactObject(value) {
  if (Array.isArray(value)) {
    return value
      .map(compactObject)
      .filter((item) => item !== undefined);
  }

  if (value && typeof value === "object") {
    const out = {};
    for (const [key, nextValue] of Object.entries(value)) {
      const compacted = compactObject(nextValue);
      if (compacted !== undefined) out[key] = compacted;
    }
    return Object.keys(out).length ? out : undefined;
  }

  if (value === undefined || value === null || value === "") return undefined;
  return value;
}

function buildVisibleResultSignature(json) {
  const rows = normalizeRows(json);
  return rows
    .slice(0, 50)
    .map((row) => {
      const menuItemId = asString(pickFirst(row, ["menu_item_id", "menuItemId", "id"], ""));
      const restaurantId = asString(
        pickFirst(row, ["restaurant_id", "restaurantId"], "")
      );
      const name = asString(
        pickFirst(
          row,
          ["search_display_name", "menu_item_name", "menuItemName", "restaurant_name", "name"],
          ""
        )
      ).toLowerCase();

      return [menuItemId, restaurantId, name].join(":");
    })
    .join("|");
}

function isDishRow(x) {
  return !!(x?.menu_item_id || x?.menu_item_name);
}

function normalizeRows(json) {
  if (!json) return [];

  if (Array.isArray(json.results) && json.results.length) {
    const out = [];
    for (const r of json.results) {
      if (r?.item && r?.restaurant) {
        out.push({
          ...r,
          menu_item_id: r.item.id ?? r.item.menu_item_id ?? null,
          menu_item_name: r.item.name ?? r.item.menu_item_name ?? null,
          search_display_name:
            r.item.search_display_name ?? r.search_display_name ?? r.item.name ?? r.item.menu_item_name ?? null,
          restaurant_id: r.restaurant.id ?? r.restaurant.restaurant_id ?? null,
          restaurant_slug: r.restaurant.slug ?? r.restaurant.restaurant_slug ?? null,
          restaurant_name:
            r.restaurant.name ?? r.restaurant.restaurant_name ?? r.restaurant.title ?? null,
          price_cents: r.item.price_cents ?? r.item.priceMinor ?? r.item.price_minor ?? null,
          item: r.item,
          restaurant: r.restaurant,
        });
      } else {
        out.push(r);
      }
    }
    return out;
  }

  if (Array.isArray(json.rows)) return json.rows;
  if (Array.isArray(json.menu_items)) return json.menu_items;
  if (Array.isArray(json.restaurants)) return json.restaurants;

  return [];
}

function hasDegradedEmptyResponse(json) {
  return json?.degraded === true && normalizeRows(json).length === 0;
}

function asString(v) {
  return v === undefined || v === null ? "" : String(v).trim();
}

function pickFirst(obj, keys, fallback = "") {
  for (const key of keys) {
    const v = obj?.[key];
    if (v !== undefined && v !== null && asString(v) !== "") return v;
  }
  return fallback;
}

function normalizeKey(v) {
  return asString(v).toLowerCase().replace(/\s+/g, " ").trim();
}

function canonicalizeMenuItemName(v) {
  return normalizeKey(v)
    .replace(/\((?:\s*\d+\s*(?:pc|pcs|piece|pieces|count|ct)\s*)\)/g, " ")
    .replace(/\b\d+\s*(?:pc|pcs|piece|pieces|count|ct)\b/g, " ")
    .replace(/\b(?:small|medium|large|regular)\b/g, " ")
    .replace(/\b\d+(?:\.\d+)?\s*(?:oz|ounce|ounces|lb|lbs)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function asNumber(v) {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string") {
    const cleaned = v.replace(/[^\d.-]/g, "");
    if (!cleaned) return null;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function getScore(row) {
  return asNumber(row?.score);
}

function getPriceMinor(row) {
  const minor = asNumber(row?.price_minor_units);
  if (minor !== null) return Math.round(minor);
  const cents = asNumber(row?.price_cents);
  if (cents !== null) return Math.round(cents);
  const dollars = asNumber(row?.price);
  if (dollars !== null) return Math.round(dollars * 100);
  return null;
}

function getDistanceMiles(row) {
  const distance = asNumber(
    pickFirst(row, ["distance_miles", "restaurant_distance_miles"], null)
  );
  return distance !== null ? distance : null;
}

function isBetterRestaurantRepresentative(nextRow, currentRow) {
  const nextDistance = getDistanceMiles(nextRow);
  const currentDistance = getDistanceMiles(currentRow);

  if (nextDistance !== null && currentDistance !== null && nextDistance !== currentDistance) {
    return nextDistance < currentDistance;
  }
  if (nextDistance !== null && currentDistance === null) return true;
  if (nextDistance === null && currentDistance !== null) return false;

  return isBetterRow(nextRow, currentRow);
}

function isBetterRow(nextRow, currentRow) {
  const nextScore = getScore(nextRow);
  const currentScore = getScore(currentRow);
  if (nextScore !== null && currentScore !== null && nextScore !== currentScore) {
    return nextScore > currentScore;
  }
  if (nextScore !== null && currentScore === null) return true;
  if (nextScore === null && currentScore !== null) return false;

  const nextPrice = getPriceMinor(nextRow);
  const currentPrice = getPriceMinor(currentRow);
  if (nextPrice !== null && currentPrice !== null && nextPrice !== currentPrice) {
    return nextPrice < currentPrice;
  }
  return false;
}

function buildRestaurantGroups(dishRows) {
  const restaurantMap = new Map();

  for (const row of dishRows) {
    const chainId = asString(pickFirst(row, ["chain_id", "restaurant_chain_id"], ""));
    const restaurantId = asString(pickFirst(row, ["restaurant_id", "restaurantId"], ""));
    const restaurantSlug = asString(pickFirst(row, ["restaurant_slug", "restaurantSlug"], ""));
    const restaurantName = asString(
      pickFirst(row, ["restaurant_name", "restaurantName"], "Restaurant")
    );
    const normalizedBrand = normalizeKey(restaurantName);
    const restaurantKey = chainId
      ? `chain:${chainId}`
      : normalizedBrand
      ? `brand:${normalizedBrand}`
      : restaurantId
      ? `id:${restaurantId}`
      : `name:${normalizedBrand}`;

    if (!restaurantMap.has(restaurantKey)) {
      restaurantMap.set(restaurantKey, {
        restaurant_id: restaurantId,
        restaurant_slug: restaurantSlug,
        restaurant_name: restaurantName || "Restaurant",
        _first: row,
        _itemMap: new Map(),
      });
    }

    const group = restaurantMap.get(restaurantKey);

    if (isBetterRestaurantRepresentative(row, group._first)) {
      group.restaurant_id = restaurantId || group.restaurant_id;
      group.restaurant_slug = restaurantSlug || group.restaurant_slug;
      group.restaurant_name = restaurantName || group.restaurant_name;
      group._first = row;
    }

    if (!group.restaurant_slug && restaurantSlug) {
      group.restaurant_slug = restaurantSlug;
    }

    const nameKey = canonicalizeMenuItemName(
      pickFirst(row, ["search_display_name", "menu_item_name", "menuItemName", "name"], "")
    );
    const sectionKey = normalizeKey(
      pickFirst(row, ["section", "section_name", "menu_section"], "")
    );
    const itemKey = `ns:${nameKey}::${sectionKey}`;

    const existing = group._itemMap.get(itemKey);
    if (!existing) {
      group._itemMap.set(itemKey, { ...row, __dupCount: 1 });
      continue;
    }

    const nextDupCount = (existing.__dupCount || 1) + 1;
    if (isBetterRow(row, existing)) {
      group._itemMap.set(itemKey, { ...row, __dupCount: nextDupCount });
    } else {
      group._itemMap.set(itemKey, { ...existing, __dupCount: nextDupCount });
    }
  }

  const groups = [];
  for (const g of restaurantMap.values()) {
    const items = Array.from(g._itemMap.values()).sort((a, b) => {
      const sa = getScore(a);
      const sb = getScore(b);
      if (sa !== null && sb !== null && sa !== sb) return sb - sa;
      const pa = getPriceMinor(a);
      const pb = getPriceMinor(b);
      if (pa !== null && pb !== null && pa !== pb) return pa - pb;
      return 0;
    });

    groups.push({
      restaurant_id: g.restaurant_id,
      restaurant_slug: g.restaurant_slug,
      restaurant_name: g.restaurant_name,
      _first: g._first,
      items,
    });
  }

  return groups;
}

function FilterToggle({ label, active, onClick, isMobile }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 999,
        padding: isMobile ? "8px 13px" : "5px 13px",
        minHeight: isMobile ? 36 : "auto",
        fontSize: "var(--text-2, 14px)",
        fontWeight: 700,
        lineHeight: 1,
        cursor: "pointer",
        border: active ? "1.5px solid #11211a" : "1px solid rgba(18,34,28,0.12)",
        background: active ? "#11211a" : "#fff",
        color: active ? "#fff" : "#11211a",
        transition: "background 0.1s, color 0.1s",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}

export default function GrubbidSearchResults() {
  const { t } = useLanguage();
  const { isAuthenticated, allergenFilter: consumerAllergenFilter } = useConsumer();
  const params = useQueryParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const q = String(params.get("q") || "").trim();
  const routeMetroId = String(params.get("metro_id") || "").trim();
  const routeCuisine = String(params.get("cuisine") || "").trim();
  const routeCategory = String(params.get("category") || "").trim();
  const sortMode = String(params.get("sort") || "default_relevance").trim() || "default_relevance";

  const vegan = params.get("vegan") === "1";
  const gluten_free = params.get("gluten_free") === "1";
  const deals_only = params.get("deals_only") === "1";
  const vegetarian = params.get("vegetarian") === "1";
  const keto = params.get("keto") === "1" || params.get("low_carb") === "1";
  const low_sodium = params.get("low_sodium") === "1";
  const dairy_free = params.get("dairy_free") === "1";
  const diabetic_friendly = params.get("diabetic_friendly") === "1";
  const goal = String(params.get("goal") || "").trim().toLowerCase();

  const locationModel = useMemo(() => parseLocationFromSearch(params), [params]);
  const apiLocationParams = useMemo(() => buildApiLocationParams(locationModel), [locationModel]);
  const locationLabel = useMemo(() => buildLocationLabel(locationModel), [locationModel]);

  const sessionId = useMemo(() => getOrCreateSearchSessionId(), []);
  const trackedEventKeysRef = useRef(new Set());

  const [rows, setRows] = useState([]);
  const [restaurantMetaMap, setRestaurantMetaMap] = useState(new Map());
  const [queryMeta, setQueryMeta] = useState(null);
  const [searchMeta, setSearchMeta] = useState(null);
  const [responseAllergenFilter, setResponseAllergenFilter] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [err, setErr] = useState("");
  const [searchOffset, setSearchOffset] = useState(0);
  const [searchHasMore, setSearchHasMore] = useState(false);
  const [searchTotalCount, setSearchTotalCount] = useState(0);
  const SEARCH_LIMIT = 24;

  const primaryUrl = useMemo(() => {
    if (!apiLocationParams) return "";

    const u = new URL(`${API}/search`);
    if (q) u.searchParams.set("q", q);

    const dietaryParams = buildDietaryQueryParams({
      vegan,
      vegetarian,
      gluten_free,
      dairy_free,
      diabetic_friendly,
      keto,
      low_sodium,
    });
    for (const [key, value] of Object.entries(dietaryParams)) {
      if (value) u.searchParams.set(key, String(value));
    }

    const restaurantParams = buildRestaurantFilterQueryParams({
      cuisine: routeCuisine,
      category: routeCategory,
    });
    for (const [key, value] of Object.entries(restaurantParams)) {
      if (value) u.searchParams.set(key, value);
    }

    if (deals_only) u.searchParams.set("deals_only", "1");
    if (goal === "energy" || goal === "immunity" || goal === "vitamin_c") u.searchParams.set("goal", goal);

    for (const [key, value] of Object.entries(apiLocationParams)) {
      u.searchParams.set(key, String(value));
    }

    u.searchParams.set("limit", String(SEARCH_LIMIT));
    return u.toString();
  }, [
    apiLocationParams,
    q,
    vegan,
    vegetarian,
    gluten_free,
    dairy_free,
    diabetic_friendly,
    keto,
    low_sodium,
    deals_only,
    goal,
    routeCuisine,
    routeCategory,
  ]);

  useEffect(() => {
    if (!apiLocationParams) {
      setRows([]);
      setRestaurantMetaMap(new Map());
      setQueryMeta(null);
      setSearchMeta(null);
      setResponseAllergenFilter(null);
      setLoading(false);
      setLoadingMore(false);
      setErr("");
      setSearchOffset(0);
      setSearchHasMore(false);
      setSearchTotalCount(0);
      return;
    }

    let alive = true;
    const startedAt = new Date().toISOString();

    async function fetchSearch(url) {
      const res = await fetch(url, { credentials: "include" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok || hasDegradedEmptyResponse(json)) {
        throw new Error(json?.error || `HTTP ${res.status}`);
      }
      return json;
    }

    async function trackSearchEvent(resultJson) {
      if (!q) return;

      const payload = compactObject({
        searchTarget: {
          city: locationModel.city || null,
          state: locationModel.state || null,
          metroId: routeMetroId || null,
          lat: apiLocationParams.lat ?? null,
          lng: apiLocationParams.lng ?? null,
          radiusMiles: apiLocationParams.radius ?? null,
        },
        filters: {
          vegan,
          vegetarian,
          gluten_free,
          deals_only,
        },
        sortMode,
        resultCount: normalizeRows(resultJson).length,
        geoFallbackUsed: false,
      });

      if (!payload) return;

      const eventKey = JSON.stringify({
        q,
        sessionId,
        sortMode,
        searchTarget: payload.searchTarget || null,
        filters: payload.filters || null,
        resultCount: payload.resultCount ?? 0,
        visibleResults: buildVisibleResultSignature(resultJson),
      });

      if (trackedEventKeysRef.current.has(eventKey)) return;
      trackedEventKeysRef.current.add(eventKey);

      try {
        await fetch(`${API}/search/track`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query_text: q,
            occurred_at: startedAt,
            session_id: sessionId || null,
            metro_id: routeMetroId || null,
            event_payload_json: payload,
          }),
        });
      } catch (trackingError) {
        console.error("search tracking failed:", trackingError);
      }
    }

    async function run() {
      setLoading(true);
      setErr("");
      setLoadingMore(false);
      setSearchOffset(0);
      setSearchHasMore(false);
      setRestaurantMetaMap(new Map());

      try {
        const json = await fetchSearch(primaryUrl);
        if (!alive) return;

        const resultRows = normalizeRows(json);
        const pagination = json?.pagination || {};
        const total = pagination.total_count ?? resultRows.length;
        const returned = pagination.returned_count ?? resultRows.length;
        const pageOffset = pagination.offset ?? 0;

        const rMeta = new Map();
        if (Array.isArray(json?.restaurants)) {
          for (const r of json.restaurants) {
            const id = asString(pickFirst(r, ["restaurant_id", "id"], ""));
            if (id) rMeta.set(id, r);
          }
        }

        setRows(resultRows);
        setRestaurantMetaMap(rMeta);
        setQueryMeta(json?.query || null);
        setSearchMeta(json?.search_meta || null);
        setResponseAllergenFilter(json?.allergen_filter || null);
        setSearchTotalCount(total);
        setSearchOffset(pageOffset + returned);
        setSearchHasMore(pageOffset + returned < total);
        void trackSearchEvent(json);
      } catch (e) {
        if (!alive) return;
        setErr(
          toConsumerErrorMessage(
            e,
            "We couldn’t load search results right now. Please try again in a moment."
          )
        );
        setRows([]);
        setQueryMeta(null);
        setSearchMeta(null);
        setResponseAllergenFilter(null);
      } finally {
        if (alive) setLoading(false);
      }
    }

    void run();
    return () => {
      alive = false;
    };
  }, [
    apiLocationParams,
    primaryUrl,
    q,
    routeMetroId,
    vegan,
    vegetarian,
    gluten_free,
    deals_only,
    sessionId,
    sortMode,
    locationModel.city,
    locationModel.state,
  ]);

  const dishRows = useMemo(() => rows.filter(isDishRow), [rows]);
  const restaurantOnlyRows = useMemo(() => rows.filter((r) => !isDishRow(r)), [rows]);
  const restaurantGroups = useMemo(() => buildRestaurantGroups(dishRows), [dishRows]);

  const activeFilters = useMemo(() => parseFiltersFromUrl(params), [params]);

  function toggleSearchFilter(key) {
    const next = { ...activeFilters, [key]: !activeFilters[key] };
    if (key === "energy") next.immunity = false;
    if (key === "immunity") next.energy = false;
    if (key === "vitamin_c") {
      next.energy = false;
      next.immunity = false;
    }
    const nextParams = filtersToUrlParams(next, params);
    navigate("?" + nextParams.toString(), { replace: true });
  }

  const activeDietFilterLabels = useMemo(() => {
    const labels = [];
    if (vegan) labels.push("Vegan");
    if (vegetarian) labels.push("Vegetarian");
    if (gluten_free) labels.push("Gluten-Free");
    if (keto) labels.push("Keto");
    if (low_sodium) labels.push("Low-Sodium");
    if (dairy_free) labels.push("Dairy-Free");
    if (diabetic_friendly) labels.push("Diabetic-Friendly");
    if (goal === "energy") labels.push("Energy");
    if (goal === "immunity") labels.push("Immunity");
    if (goal === "vitamin_c") labels.push("High Vitamin C");
    return labels;
  }, [vegan, vegetarian, gluten_free, keto, low_sodium, dairy_free, diabetic_friendly, goal]);
  const hasDietFilter = activeDietFilterLabels.length > 0;

  const crossRestaurantItems = useMemo(() => {
    return restaurantGroups
      .filter((g) => g.items.length > 0)
      .map((g) => ({
        restaurant_id: asString(g.restaurant_id),
        restaurant_name: g.restaurant_name,
        items: g.items,
      }));
  }, [restaurantGroups]);

  const hasMenuMatches = restaurantGroups.length > 0;
  const restaurantIntent = !!(
    searchMeta?.restaurant_oriented ||
    searchMeta?.restaurant_first ||
    searchMeta?.direct_restaurant_name
  );

  const restaurantGroupsById = useMemo(() => {
    const s = new Set();
    for (const g of restaurantGroups) {
      const id = asString(g.restaurant_id);
      if (id) s.add(id);
    }
    return s;
  }, [restaurantGroups]);

  const restaurantOnlyVisible = useMemo(() => {
    if (!restaurantOnlyRows.length) return [];
    return restaurantOnlyRows.filter((r) => {
      const id = asString(pickFirst(r, ["restaurant_id", "id"], ""));
      if (!id) return true;
      return !restaurantGroupsById.has(id);
    });
  }, [restaurantOnlyRows, restaurantGroupsById]);

  const locationPhrase = useMemo(() => {
    if (!locationLabel) return "";
    if (isGeoMode(locationModel)) return ` near ${locationLabel}`;
    return ` in ${locationLabel}`;
  }, [locationLabel, locationModel]);

  const styles = {
    grid: {
      display: "grid",
      gap: 12,
      marginTop: 16,
      minWidth: 0,
    },
  };

  const emptyMessage = q
    ? t("search.noResultsFor", `No results for "${q}"${locationPhrase}.`, {
        query: q,
        location: locationPhrase,
      })
    : t("search.noResultsGeneric", `No results${locationPhrase}.`, {
        location: locationPhrase,
      });

  const effectiveAllergenFilter = isAuthenticated
    ? (responseAllergenFilter || consumerAllergenFilter || null)
    : null;

  const geoCard =
    apiLocationParams?.lat != null && apiLocationParams?.lng != null
      ? { lat: apiLocationParams.lat, lng: apiLocationParams.lng }
      : null;

  return (
    <div style={{ position: "relative", minHeight: "100vh", background: "#f7f6f1", color: "#101828" }}>
      <div style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "#f7f6f1",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
        paddingBottom: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px 10px" }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Go back"
            style={{ border: "none", background: "transparent", fontSize: 22, color: "#101828", cursor: "pointer", padding: 4, lineHeight: 1, flexShrink: 0 }}
          >
            ←
          </button>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <BrandLogo width={72} height={48} radius={14} pageColor="#f7f6f1" />
            <div style={{
              width: 72, marginTop: -1, padding: "4px 0 6px", textAlign: "center",
              background: "linear-gradient(180deg, #1a6b47 0%, #0d3d28 100%)",
              color: "#6ee7b7", fontSize: 8, fontWeight: 900,
              letterSpacing: "0.13em", textTransform: "uppercase",
              borderRadius: "0 0 7px 7px",
              boxShadow: "0 6px 16px rgba(13,61,40,0.55), inset 0 1px 0 rgba(255,255,255,0.10)",
              userSelect: "none",
            }}>
              ✦ BidFree Bidding
            </div>
          </div>
          <div style={{ width: 30, flexShrink: 0 }} />
        </div>
        <div style={{ maxWidth: 576, margin: "0 auto", padding: "0 14px", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 17, fontWeight: 900, color: "#101828", letterSpacing: "-0.02em" }}>
            🔍 {q ? `"${q}"` : "Search"}
          </span>
          {locationLabel && (
            <span style={{
              fontSize: 12, fontWeight: 600, color: "#486257",
              background: "rgba(22,101,62,0.08)", borderRadius: 999,
              padding: "2px 10px", border: "1px solid rgba(22,101,62,0.14)",
            }}>
              Near {locationLabel}
            </span>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 576, margin: "0 auto", padding: "10px 14px 80px" }}>
        <ActiveFilterChips filters={activeFilters} onToggle={toggleSearchFilter} />

        {effectiveAllergenFilter ? (
          <AllergenFilterStatusBanner allergenFilter={effectiveAllergenFilter} style={{ marginBottom: 14 }} />
        ) : null}

        {!apiLocationParams && (
          <StatusMessage tone="muted">
            {t(
              "search.locationRequired",
              "Location is required to search. Open this page with a valid city/state or geo URL."
            )}
          </StatusMessage>
        )}

        {err && <StatusMessage>Error: {err}</StatusMessage>}
        {loading && <StatusMessage tone="muted">{t("common.loading")}</StatusMessage>}

        {!loading && !err && apiLocationParams && !hasMenuMatches && hasDietFilter && (
          <StatusMessage tone="muted">
            {t("search.noDietaryResults", `No menu items meet your preference for ${activeDietFilterLabels.join(", ")}.`, {
              filters: activeDietFilterLabels.join(", "),
            })}
          </StatusMessage>
        )}

        {!loading && !err && apiLocationParams && q && !hasMenuMatches && !hasDietFilter && restaurantOnlyVisible.length === 0 && (
          <StatusMessage tone="muted">{emptyMessage}</StatusMessage>
        )}

        {!loading && !err && apiLocationParams && !hasDietFilter && restaurantOnlyVisible.length > 0 && (restaurantIntent || !hasMenuMatches) && (
          <>
            <SectionTitle>{t("search.restaurants", "Restaurants")}</SectionTitle>
            <div style={styles.grid}>
              {restaurantOnlyVisible.map((r) => (
                <SearchResultCard
                  key={`r-${
                    asString(pickFirst(r, ["restaurant_id", "id"], "")) || asString(r?.name)
                  }`}
                  item={r}
                  query={q}
                  queryMeta={queryMeta}
                  matchContext={{
                    wantsNearby: searchMeta?.wants_nearby === true,
                    coordinateSearchActive: isGeoMode(locationModel),
                  }}
                  crossRestaurantItems={crossRestaurantItems}
                />
              ))}
            </div>
          </>
        )}

        {!loading && !err && apiLocationParams && hasMenuMatches && (
          <>
            <SectionTitle>{restaurantIntent ? t("common.dishes") : t("common.results")}</SectionTitle>
            <div style={styles.grid}>
              {restaurantGroups.map((g) => {
                const rMeta = restaurantMetaMap.get(asString(g.restaurant_id));
                return (
                  <SearchResultCard
                    key={`rg-${g.restaurant_id || g.restaurant_name}`}
                    restaurant={{
                      id: g.restaurant_id,
                      slug: g.restaurant_slug || g._first?.restaurant_slug || g._first?.slug || null,
                      name: g.restaurant_name,
                      cuisine: g._first?.cuisine || g._first?.restaurant_cuisine || null,
                      category: g._first?.category || g._first?.restaurant_category || null,
                      phone: g._first?.phone || g._first?.restaurant_phone || null,
                      distance_miles:
                        g._first?.distance_miles ?? g._first?.restaurant_distance_miles ?? null,
                      profile_tier:
                        g._first?.profile_tier || g._first?.restaurant_profile_tier || null,
                      listing_status:
                        g._first?.listing_status || g._first?.restaurant_listing_status || null,
                      location_count: rMeta?.location_count ?? null,
                      raw: g._first,
                    }}
                    items={g.items}
                    query={q}
                    queryMeta={queryMeta}
                    matchContext={{
                      wantsNearby: searchMeta?.wants_nearby === true,
                      coordinateSearchActive: isGeoMode(locationModel),
                    }}
                    crossRestaurantItems={crossRestaurantItems}
                    geo={geoCard}
                  />
                );
              })}
            </div>
          </>
        )}

        {!loading && !err && apiLocationParams && searchHasMore && (
          <div style={{ display: "flex", justifyContent: "center", marginTop: 24 }}>
            <button
              type="button"
              disabled={loadingMore}
              className={`gb-pill-button ${loadingMore ? "gb-pill-button--secondary" : "gb-pill-button--primary"}`}
              onClick={async () => {
                setLoadingMore(true);
                setErr("");
                try {
                  const u = new URL(primaryUrl);
                  u.searchParams.set("limit", String(SEARCH_LIMIT));
                  u.searchParams.set("offset", String(searchOffset));
                  const res = await fetch(u.toString(), { credentials: "include" });
                  const json = await res.json().catch(() => ({}));
                  if (!res.ok || !json?.ok) throw new Error(json?.error || `HTTP ${res.status}`);
                  const moreRows = normalizeRows(json);
                  const pagination = json?.pagination || {};
                  const total = pagination.total_count ?? (searchOffset + moreRows.length);
                  const returned = pagination.returned_count ?? moreRows.length;
                  const pageOffset = pagination.offset ?? searchOffset;
                  if (Array.isArray(json?.restaurants)) {
                    setRestaurantMetaMap((prev) => {
                      const next = new Map(prev);
                      for (const r of json.restaurants) {
                        const id = asString(pickFirst(r, ["restaurant_id", "id"], ""));
                        if (id) next.set(id, r);
                      }
                      return next;
                    });
                  }
                  setRows((prev) => [...prev, ...moreRows]);
                  setQueryMeta((prev) => json?.query || prev || null);
                  setResponseAllergenFilter((prev) => json?.allergen_filter || prev);
                  setSearchTotalCount(total);
                  setSearchOffset(pageOffset + returned);
                  setSearchHasMore(pageOffset + returned < total);
                } catch (e) {
                  setErr(toConsumerErrorMessage(e, "Couldn't load more results. Please try again."));
                } finally {
                  setLoadingMore(false);
                }
              }}
            >
              {loadingMore
                ? "Loading…"
                : `Load More (${searchTotalCount - rows.length} remaining)`}
            </button>
          </div>
        )}

        {!loading && !err && apiLocationParams && locationModel.city && (
          <div
            style={{
              marginTop: isMobile ? 32 : 44,
              paddingTop: isMobile ? 16 : 20,
              borderTop: "1px solid rgba(18,34,28,0.08)",
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: isMobile ? 13 : 14,
              color: "#667085",
            }}
          >
            <span style={{ fontWeight: 500 }}>Looking for something healthier?</span>
            <Link
              to={`/top-picks?city=${encodeURIComponent(locationModel.city)}${locationModel.state ? `&state=${encodeURIComponent(locationModel.state)}` : ""}`}
              style={{
                color: "#2d6a4f",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              Top Picks in {locationModel.city} →
            </Link>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
