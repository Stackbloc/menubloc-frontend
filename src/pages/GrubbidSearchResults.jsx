/**
 * ============================================================
 * File: GrubbidSearchResults.jsx
 * Path: menubloc-frontend/src/pages/GrubbidSearchResults.jsx
 * Date: 2026-03-13
 * Purpose:
 *   Search results page for Grubbid.
 *   - Reads query params from URL
 *   - Calls backend /search endpoint (with lat/lng when available)
 *   - Groups menu-item results by restaurant
 *   - Dedupes menu items per restaurant (best score, then lower price)
 *   - Interactive filter bar (vegan, gluten-free, deals, price max)
 *   - Geo-proximity: browser geolocation is requested on mount.
 *
 *   Mobile-safe revision:
 *   - tighter spacing and typography on phones
 *   - filter controls wrap cleanly
 *   - no horizontal overflow
 *   - cards remain one-column and readable on small screens
 * ============================================================
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import SearchResultCard from "../components/SearchResultCard";
import { toConsumerErrorMessage } from "../lib/api.js";
import { saveDietPrefs } from "../hooks/useDietPreferences";

const API = (import.meta.env.VITE_API_URL || "http://localhost:3001").replace(/\/$/, "");
const SESSION_LOCATION_KEY = "grubbid.discovery.location";
const SEARCH_SESSION_KEY = "grubbid.search.session_id";

/* ---- Mobile hook ---- */

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

/* ---- Geolocation hook ---- */

function useGeolocation() {
  const [geo, setGeo] = useState({ status: "pending", lat: null, lng: null });

  useEffect(() => {
    if (!navigator?.geolocation) {
      setGeo({ status: "unavailable", lat: null, lng: null });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeo({
          status: "granted",
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => {
        setGeo({ status: "denied", lat: null, lng: null });
      },
      { timeout: 8000, maximumAge: 300000 }
    );
  }, []);

  return geo;
}

/* ---- Row normalization ---- */

function useQueryParams() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

const US_STATE_ABBREVS = new Set([
  "al","ak","az","ar","ca","co","ct","de","fl","ga","hi","id","il","in","ia",
  "ks","ky","la","me","md","ma","mi","mn","ms","mo","mt","ne","nv","nh","nj",
  "nm","ny","nc","nd","oh","ok","or","pa","ri","sc","sd","tn","tx","ut","vt",
  "va","wa","wv","wi","wy","dc",
]);

function parseLocation(rawValue) {
  const raw = String(rawValue || "").trim();
  if (!raw) return { zip: "", city: "", state: "", near: "", label: "" };
  if (/^\d{5}(?:-\d{4})?$/.test(raw)) {
    return { zip: raw, city: "", state: "", near: "", label: raw };
  }

  // Handle "City, ST" format (with comma)
  const parts = raw.split(",");
  if (parts.length >= 2) {
    const city = String(parts[0] || "").trim();
    const state = String(parts[1] || "").trim().toUpperCase();
    return { zip: "", city, state, near: "", label: raw };
  }

  // Handle "City ST" format (no comma) — strip trailing 2-letter state abbreviation
  const tokens = raw.split(/\s+/);
  const last = tokens[tokens.length - 1].toLowerCase();
  if (tokens.length >= 2 && US_STATE_ABBREVS.has(last)) {
    const city = tokens.slice(0, -1).join(" ");
    return { zip: "", city, state: last.toUpperCase(), near: "", label: raw };
  }

  return { zip: "", city: raw, state: "", near: "", label: raw };
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
        pickFirst(row, ["menu_item_name", "menuItemName", "restaurant_name", "name"], "")
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
    const restaurantId = asString(pickFirst(row, ["restaurant_id", "restaurantId"], ""));
    const restaurantSlug = asString(pickFirst(row, ["restaurant_slug", "restaurantSlug"], ""));
    const restaurantName = asString(
      pickFirst(row, ["restaurant_name", "restaurantName"], "Restaurant")
    );
    const restaurantKey = restaurantId
      ? `id:${restaurantId}`
      : `name:${normalizeKey(restaurantName)}`;

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

    if (!group.restaurant_slug && restaurantSlug) {
      group.restaurant_slug = restaurantSlug;
    }

    const menuItemId = asString(pickFirst(row, ["menu_item_id", "menuItemId"], ""));
    const nameKey = normalizeKey(
      pickFirst(row, ["menu_item_name", "menuItemName", "name"], "")
    );
    const sectionKey = normalizeKey(
      pickFirst(row, ["section", "section_name", "menu_section"], "")
    );
    const itemKey = menuItemId ? `id:${menuItemId}` : `ns:${nameKey}::${sectionKey}`;

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

/* ---- Filter helpers ---- */

function applyFilter(params, navigate, key, value) {
  const next = new URLSearchParams(params.toString());
  if (next.get(key) === value) {
    next.delete(key);
  } else {
    next.set(key, value);
  }
  navigate("?" + next.toString(), { replace: true });
}

function setFilter(params, navigate, key, value) {
  const next = new URLSearchParams(params.toString());
  if (!value) {
    next.delete(key);
  } else {
    next.set(key, value);
  }
  navigate("?" + next.toString(), { replace: true });
}

/* ---- Filter toggle button ---- */

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
  const params = useQueryParams();
  const navigate = useNavigate();
  const geo = useGeolocation();
  const isMobile = useIsMobile();
  const sessionLocation = useMemo(() => {
    if (typeof window === "undefined") return "";
    return String(window.sessionStorage.getItem(SESSION_LOCATION_KEY) || "").trim();
  }, []);

  const q = String(params.get("q") || "").trim();
  const vegan = params.get("vegan") === "1";
  const gluten_free = params.get("gluten_free") === "1";
  const deals_only = params.get("deals_only") === "1";
  const routeZip = String(params.get("zip") || "").trim();
  const routeCity = String(params.get("city") || "").trim();
  const routeState = String(params.get("state") || "").trim();
  const routeNear = String(params.get("near") || "").trim();
  const routeLocationLabel = String(params.get("location_label") || "").trim();
  const routeLat = params.get("lat");
  const routeLng = params.get("lng");
  const routeRadiusMiles = params.get("radius_miles");
  const routeMetroId = String(params.get("metro_id") || "").trim();
  const vegetarian = params.get("vegetarian") === "1";
  const keto = params.get("keto") === "1";
  const low_sodium = params.get("low_sodium") === "1";

  // Keep localStorage in sync with whatever diet filters are active in the URL
  // so navigating away and coming back (or going to a menu page) keeps them active
  useEffect(() => {
    saveDietPrefs({ vegan, vegetarian, gluten_free, keto, low_sodium,
      dairy_free: false, diabetic_friendly: false });
  }, [vegan, vegetarian, gluten_free, keto, low_sodium]);

  const fallbackLocation = useMemo(() => {
    if (routeZip || routeCity || routeState || routeNear || routeLocationLabel) {
      return {
        zip: routeZip,
        city: routeCity,
        state: routeState,
        near: routeNear,
        label: routeLocationLabel,
      };
    }
    return parseLocation(sessionLocation);
  }, [routeZip, routeCity, routeState, routeNear, routeLocationLabel, sessionLocation]);
  const zip = fallbackLocation.zip;
  const city = fallbackLocation.city;
  const state = fallbackLocation.state;
  const near = fallbackLocation.near;
  const explicitLocationLabel = fallbackLocation.label;

  // Persist the resolved location back to sessionStorage so that returning to
  // the Discovery page pre-fills the same location the user already searched with.
  // Only write when we have an explicit, actionable location from the URL —
  // geo-only (lat/lng) searches are intentionally excluded since we can't
  // reverse-geocode here without an extra API call.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const label = city && state
      ? `${city}, ${state}`
      : city || zip || near || "";
    if (label) {
      window.sessionStorage.setItem(SESSION_LOCATION_KEY, label);
    }
  }, [city, state, zip, near]);
  const sessionId = useMemo(() => getOrCreateSearchSessionId(), []);
  const trackedEventKeysRef = useRef(new Set());
  const sortMode = String(params.get("sort") || "default_relevance").trim() || "default_relevance";

  const [rows, setRows] = useState([]);
  const [searchMeta, setSearchMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const { primaryUrl, fallbackUrl, hasGeoFilter } = useMemo(() => {
    const u = new URL(`${API}/search`);
    // "explicit" means we have an actionable city/zip/near filter — not just a display label
    const hasExplicitLocation = Boolean(zip || city || near);
    if (q) u.searchParams.set("q", q);
    if (vegan) u.searchParams.set("vegan", "1");
    if (gluten_free) u.searchParams.set("gluten_free", "1");
    if (deals_only) u.searchParams.set("deals_only", "1");
    if (vegetarian) u.searchParams.set("vegetarian", "1");
    if (keto) u.searchParams.set("keto", "1");
    if (low_sodium) u.searchParams.set("low_sodium", "1");
    if (zip) u.searchParams.set("zip", zip);
    if (city) u.searchParams.set("city", city);
    if (state) u.searchParams.set("state", state);
    if (near) u.searchParams.set("near", near);

    // Save the base URL (no geo) for fallback use
    const baseUrl = u.toString();

    let geoAdded = false;
    if (!hasExplicitLocation) {
      const urlLat = routeLat != null ? Number(routeLat) : null;
      const urlLng = routeLng != null ? Number(routeLng) : null;
      if (urlLat != null && Number.isFinite(urlLat) && urlLng != null && Number.isFinite(urlLng)) {
        u.searchParams.set("lat", String(urlLat));
        u.searchParams.set("lng", String(urlLng));
        const r = routeRadiusMiles != null ? Number(routeRadiusMiles) : NaN;
        u.searchParams.set("radius_miles", String(Number.isFinite(r) && r > 0 ? r : 8));
        geoAdded = true;
      } else if (geo.lat != null && geo.lng != null) {
        u.searchParams.set("lat", String(geo.lat));
        u.searchParams.set("lng", String(geo.lng));
        u.searchParams.set("radius_miles", "8");
        geoAdded = true;
      }
    }

    return { primaryUrl: u.toString(), fallbackUrl: baseUrl, hasGeoFilter: geoAdded };
  }, [
    q,
    vegan,
    gluten_free,
    deals_only,
    vegetarian,
    keto,
    low_sodium,
    zip,
    city,
    state,
    near,
    routeLat,
    routeLng,
    routeRadiusMiles,
    geo.lat,
    geo.lng,
  ]);

  const [geoFallbackUsed, setGeoFallbackUsed] = useState(false);

  useEffect(() => {
    let alive = true;

    const startedAt = new Date().toISOString();

    async function fetchSearch(url) {
      const res = await fetch(url, { credentials: "include" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) throw new Error(json?.error || `HTTP ${res.status}`);
      return json;
    }

    async function trackSearchEvent(resultJson, fallbackUsed) {
      if (!q) return;

      const routeLatNum = routeLat != null ? Number(routeLat) : null;
      const routeLngNum = routeLng != null ? Number(routeLng) : null;
      const routeRadiusNum = routeRadiusMiles != null ? Number(routeRadiusMiles) : null;
      const hasExplicitTarget = Boolean(zip || city || near);

      const targetLat =
        !hasExplicitTarget && Number.isFinite(routeLatNum)
          ? routeLatNum
          : !hasExplicitTarget && Number.isFinite(geo.lat)
          ? geo.lat
          : null;
      const targetLng =
        !hasExplicitTarget && Number.isFinite(routeLngNum)
          ? routeLngNum
          : !hasExplicitTarget && Number.isFinite(geo.lng)
          ? geo.lng
          : null;
      const targetRadiusMiles =
        !hasExplicitTarget && Number.isFinite(routeRadiusNum) && routeRadiusNum > 0
          ? routeRadiusNum
          : !hasExplicitTarget && targetLat !== null && targetLng !== null
          ? 8
          : null;

      const originLat =
        Number.isFinite(geo.lat)
          ? geo.lat
          : Number.isFinite(routeLatNum)
          ? routeLatNum
          : null;
      const originLng =
        Number.isFinite(geo.lng)
          ? geo.lng
          : Number.isFinite(routeLngNum)
          ? routeLngNum
          : null;

      const originFallback = parseLocation(
        routeLocationLabel || explicitLocationLabel || sessionLocation || ""
      );

      const targetCity = city || near || originFallback.city || "";
      const targetState = state || originFallback.state || "";

      const payload = compactObject({
        searchOrigin: {
          lat: originLat,
          lng: originLng,
          city: originFallback.city || null,
          state: originFallback.state || null,
        },
        searchTarget: {
          city: targetCity || null,
          state: targetState || null,
          metroId: routeMetroId || null,
          lat: targetLat,
          lng: targetLng,
          radiusMiles: targetRadiusMiles,
        },
        filters: {
          vegan,
          vegetarian,
          gluten_free,
          deals_only,
        },
        sortMode,
        resultCount: normalizeRows(resultJson).length,
        geoFallbackUsed: fallbackUsed === true,
      });

      if (!payload) return;

      const eventKey = JSON.stringify({
        q,
        sessionId,
        sortMode,
        fallbackUsed: fallbackUsed === true,
        searchOrigin: payload.searchOrigin || null,
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
      setGeoFallbackUsed(false);

      try {
        let json = await fetchSearch(primaryUrl);
        let usedFallback = false;

        // If geo filter produced 0 results, retry without geo
        if (hasGeoFilter && fallbackUrl !== primaryUrl && normalizeRows(json).length === 0) {
          json = await fetchSearch(fallbackUrl);
          usedFallback = true;
          if (alive) setGeoFallbackUsed(true);
        }

        if (!alive) return;
        setRows(normalizeRows(json));
        setSearchMeta(json?.search_meta || null);
        void trackSearchEvent(json, usedFallback);
      } catch (e) {
        if (!alive) return;
        setErr(
          toConsumerErrorMessage(
            e,
            "We couldn’t load search results right now. Please try again in a moment."
          )
        );
        setRows([]);
        setSearchMeta(null);
      } finally {
        if (alive) setLoading(false);
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, [
    primaryUrl,
    fallbackUrl,
    hasGeoFilter,
    q,
    zip,
    city,
    state,
    near,
    routeLat,
    routeLng,
    routeRadiusMiles,
    routeLocationLabel,
    routeMetroId,
    vegan,
    vegetarian,
    gluten_free,
    deals_only,
    geo.lat,
    geo.lng,
    explicitLocationLabel,
    sessionLocation,
    sessionId,
    sortMode,
  ]);

  const dishRows = useMemo(() => rows.filter(isDishRow), [rows]);
  const restaurantOnlyRows = useMemo(() => rows.filter((r) => !isDishRow(r)), [rows]);
  const restaurantGroups = useMemo(() => buildRestaurantGroups(dishRows), [dishRows]);

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

  const minVisibleDistance = useMemo(() => {
    const distances = rows
      .map((row) => asNumber(pickFirst(row, ["distance_miles", "restaurant_distance_miles"], null)))
      .filter((value) => value !== null);
    if (!distances.length) return null;
    return Math.min(...distances);
  }, [rows]);

  const locationLabel = useMemo(() => {
    if (explicitLocationLabel) return explicitLocationLabel;
    if (city || near) return city || near;
    if (zip) return zip;
    if (geo.status === "granted" && minVisibleDistance !== null && minVisibleDistance <= 25) {
      return "your current location";
    }
    return "";
  }, [explicitLocationLabel, city, near, zip, geo.status, minVisibleDistance]);

  const locationPhrase = useMemo(() => {
    if (!locationLabel) return "";
    if (locationLabel === "your current location") return "near your current location";
    return `in ${locationLabel}`;
  }, [locationLabel]);

  const styles = {
    page: {
      minHeight: "100vh",
      background: "#f7f6f1",
    },
    wrap: {
      padding: isMobile ? "20px 14px 48px" : "36px 24px 72px",
      maxWidth: 820,
      margin: "0 auto",
      boxSizing: "border-box",
      overflowX: "hidden",
      color: "#101828",
      fontFamily: "var(--font-ui, Inter, system-ui, sans-serif)",
    },
    topRow: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: isMobile ? 16 : 22,
    },
    wordmark: {
      fontSize: isMobile ? 17 : 19,
      fontWeight: 900,
      color: "#11211a",
      textDecoration: "none",
      letterSpacing: "-0.02em",
    },
    backBtn: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      fontSize: 13,
      fontWeight: 600,
      color: "#475467",
      background: "rgba(0,0,0,0.04)",
      border: "1px solid rgba(0,0,0,0.09)",
      borderRadius: 999,
      padding: "5px 12px",
      cursor: "pointer",
      textDecoration: "none",
    },
    searchContext: {
      marginBottom: isMobile ? 14 : 18,
    },
    title: {
      margin: 0,
      fontSize: isMobile ? 20 : 24,
      lineHeight: 1.2,
      fontWeight: 900,
      letterSpacing: "-0.02em",
      color: "#11211a",
      wordBreak: "break-word",
    },
    titleQuery: {
      color: "#11211a",
    },
    subtitle: {
      marginTop: 4,
      color: "#667085",
      fontSize: isMobile ? 13 : 14,
      fontWeight: 500,
      lineHeight: 1.4,
    },
    filterBar: {
      marginTop: 12,
      display: "flex",
      gap: 8,
      flexWrap: "wrap",
      alignItems: "center",
    },
    grid: {
      display: "grid",
      gap: 12,
      marginTop: 16,
      minWidth: 0,
    },
    error: {
      marginTop: 12,
      padding: "14px 16px",
      border: "1px solid rgba(18,34,28,0.08)",
      borderRadius: 16,
      background: "#fff",
      color: "#475467",
      fontWeight: 700,
      wordBreak: "break-word",
      lineHeight: 1.5,
    },
    empty: {
      marginTop: 12,
      padding: "14px 16px",
      border: "1px solid rgba(18,34,28,0.08)",
      borderRadius: 16,
      background: "#fff",
      color: "#475467",
      fontWeight: 600,
      lineHeight: 1.4,
      wordBreak: "break-word",
    },
    section: {
      marginTop: 24,
      marginBottom: 4,
      fontWeight: 900,
      color: "#11211a",
      fontSize: isMobile ? 15 : 16,
      letterSpacing: "-0.01em",
    },
  };

  const emptyMessage = q
    ? `No results for "${q}"${locationPhrase ? ` ${locationPhrase}` : ""}.`
    : `No results${locationPhrase ? ` ${locationPhrase}` : ""}.`;

  return (
    <div style={styles.page}>
    <div style={styles.wrap}>
      {/* Nav bar */}
      <div style={styles.topRow}>
        <Link to="/" style={styles.wordmark}>Grubbid</Link>
        <a
          role="button"
          onClick={() => navigate(-1)}
          style={styles.backBtn}
        >
          ← Back
        </a>
      </div>

      {/* Search context */}
      <div style={styles.searchContext}>
        <h1 style={styles.title}>
          {q ? (
            <>Searching for <span style={styles.titleQuery}>&quot;{q}&quot;</span></>
          ) : (
            "Search results"
          )}
        </h1>
        <div style={styles.subtitle}>
          {[
            locationLabel && locationLabel !== "your current location"
              ? `near ${locationLabel}`
              : locationLabel === "your current location"
              ? "near you"
              : null,
            !loading && (() => {
              if (hasMenuMatches) {
                const totalDishes = restaurantGroups.reduce((acc, g) => acc + g.items.length, 0);
                return `${totalDishes} ${totalDishes === 1 ? "dish" : "dishes"} found`;
              }
              if (restaurantOnlyVisible.length) {
                return `${restaurantOnlyVisible.length} restaurant${restaurantOnlyVisible.length === 1 ? "" : "s"} found`;
              }
              return null;
            })(),
          ].filter(Boolean).join(" · ")}
        </div>
      </div>

      {geoFallbackUsed && (
        <div
          style={{
            marginTop: 10,
            padding: "8px 12px",
            borderRadius: 10,
            background: "#fffbeb",
            border: "1px solid #fcd34d",
            color: "#92400e",
            fontSize: isMobile ? 12 : 13,
            fontWeight: 700,
          }}
        >
          No results found near your location — showing all matching results instead.
        </div>
      )}

      {err && <div style={styles.error}>Error: {err}</div>}
      {loading && <div style={styles.empty}>Loading...</div>}

      {!loading && !err && q && !hasMenuMatches && restaurantOnlyVisible.length === 0 && (
        <div style={styles.empty}>{emptyMessage}</div>
      )}

      {!loading && !err && restaurantOnlyVisible.length > 0 && (restaurantIntent || !hasMenuMatches) && (
        <>
          <div style={styles.section}>Restaurants</div>
          <div style={styles.grid}>
            {restaurantOnlyVisible.map((r) => (
              <SearchResultCard
                key={`r-${
                  asString(pickFirst(r, ["restaurant_id", "id"], "")) || asString(r?.name)
                }`}
                item={r}
                query={q}
                crossRestaurantItems={crossRestaurantItems}
              />
            ))}
          </div>
        </>
      )}

      {!loading && !err && hasMenuMatches && (
        <>
          <div style={styles.section}>{restaurantIntent ? "Dishes" : "Results"}</div>
          <div style={styles.grid}>
            {restaurantGroups.map((g) => (
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
                  raw: g._first,
                }}
                items={g.items}
                query={q}
                crossRestaurantItems={crossRestaurantItems}
              />
            ))}
          </div>
        </>
      )}
      {/* Top 5 Healthiest link — shown when we have a city context */}
      {!loading && !err && city && (
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
            to={`/top-picks?city=${encodeURIComponent(city)}${state ? `&state=${encodeURIComponent(state)}` : ""}`}
            style={{
              color: "#2d6a4f",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Top Picks in {city} →
          </Link>
        </div>
      )}
    </div>
    </div>
  );
}
