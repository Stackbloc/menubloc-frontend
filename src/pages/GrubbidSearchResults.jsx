/**
 * ============================================================
 * File: GrubbidSearchResults.jsx
 * Path: menubloc-frontend/src/pages/GrubbidSearchResults.jsx
 * Date: 2026-03-05
 * Purpose:
 *   Search results page for Grubbid.
 *   - Reads query params from URL
 *   - Calls backend /search endpoint
 *   - Groups menu-item results by restaurant
 *   - Dedupes menu items per restaurant (best score, then lower price)
 *   - Interactive filter bar (vegan, gluten-free, deals, price max)
 *   - Location line from search params
 * ============================================================
 */

import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SearchResultCard from "../components/SearchResultCard";

const API = (import.meta.env.VITE_API_URL || "http://localhost:3001").replace(/\/$/, "");

function useQueryParams() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
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
          restaurant_name: r.restaurant.name ?? r.restaurant.restaurant_name ?? r.restaurant.title ?? null,
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
    const restaurantName = asString(pickFirst(row, ["restaurant_name", "restaurantName"], "Restaurant"));
    const restaurantKey = restaurantId ? `id:${restaurantId}` : `name:${normalizeKey(restaurantName)}`;

    if (!restaurantMap.has(restaurantKey)) {
      restaurantMap.set(restaurantKey, {
        restaurant_id: restaurantId,
        restaurant_name: restaurantName || "Restaurant",
        _first: row,
        _itemMap: new Map(),
      });
    }

    const group = restaurantMap.get(restaurantKey);
    const menuItemId = asString(pickFirst(row, ["menu_item_id", "menuItemId"], ""));
    const nameKey = normalizeKey(pickFirst(row, ["menu_item_name", "menuItemName", "name"], ""));
    const sectionKey = normalizeKey(pickFirst(row, ["section", "section_name", "menu_section"], ""));
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

function FilterToggle({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        borderRadius: 999,
        padding: "5px 13px",
        fontSize: "var(--text-2, 14px)",
        fontWeight: 700,
        lineHeight: 1,
        cursor: "pointer",
        border: active ? "1.5px solid var(--link, #124ba3)" : "1px solid var(--border, #e3e8ef)",
        background: active ? "var(--link, #124ba3)" : "#fff",
        color: active ? "#fff" : "var(--ink, #0f1720)",
        transition: "background 0.1s, color 0.1s",
      }}
    >
      {label}
    </button>
  );
}

const PRICE_OPTIONS = [
  { label: "Any price", value: "" },
  { label: "Under $10", value: "10" },
  { label: "Under $15", value: "15" },
  { label: "Under $20", value: "20" },
  { label: "Under $25", value: "25" },
];

export default function GrubbidSearchResults() {
  const params = useQueryParams();
  const navigate = useNavigate();

  const q = String(params.get("q") || "").trim();
  const vegan = params.get("vegan") === "1";
  const gluten_free = params.get("gluten_free") === "1";
  const deals_only = params.get("deals_only") === "1";
  const zip = String(params.get("zip") || "").trim();
  const city = String(params.get("city") || "").trim();
  const near = String(params.get("near") || "").trim();
  const maxPrice = String(params.get("max_price") || params.get("price_max") || "").trim();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const requestUrl = useMemo(() => {
    const u = new URL(`${API}/search`);
    if (q) u.searchParams.set("q", q);
    if (vegan) u.searchParams.set("vegan", "1");
    if (gluten_free) u.searchParams.set("gluten_free", "1");
    if (deals_only) u.searchParams.set("deals_only", "1");
    if (zip) u.searchParams.set("zip", zip);
    if (city) u.searchParams.set("city", city);
    if (near) u.searchParams.set("near", near);
    if (maxPrice) u.searchParams.set("max_price", maxPrice);
    return u.toString();
  }, [q, vegan, gluten_free, deals_only, zip, city, near, maxPrice]);

  useEffect(() => {
    let alive = true;

    async function run() {
      setLoading(true);
      setErr("");

      try {
        const res = await fetch(requestUrl, { credentials: "include" });
        const json = await res.json().catch(() => ({}));

        if (!res.ok || !json?.ok) {
          throw new Error(json?.error || `HTTP ${res.status}`);
        }
        if (!alive) return;

        setRows(normalizeRows(json));
      } catch (e) {
        if (!alive) return;
        setErr(String(e?.message || e));
        setRows([]);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    run();
    return () => { alive = false; };
  }, [requestUrl]);

  const dishRows = useMemo(() => rows.filter(isDishRow), [rows]);
  const restaurantOnlyRows = useMemo(() => rows.filter((r) => !isDishRow(r)), [rows]);
  const restaurantGroups = useMemo(() => buildRestaurantGroups(dishRows), [dishRows]);
  const hasMenuMatches = restaurantGroups.length > 0;

  /* Location label — from search params only, not from result rows */
  const locationLabel = city || near || (zip ? zip : "");

  const styles = {
    wrap: {
      padding: 18,
      maxWidth: 980,
      margin: "0 auto",
      fontFamily: "var(--font-ui, Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif)",
      color: "var(--ink, #0f1720)",
    },
    topRow: {
      display: "flex",
      alignItems: "center",
      gap: 12,
    },
    backBtn: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      border: "1px solid var(--border, #d6dde7)",
      borderRadius: 999,
      padding: "8px 12px",
      background: "#fff",
      color: "var(--ink, #0f1720)",
      fontWeight: 700,
      fontSize: "var(--text-2, 14px)",
      cursor: "pointer",
    },
    title: {
      margin: "14px 0 0",
      fontSize: "var(--text-6, 28px)",
      lineHeight: 1.12,
      fontWeight: 800,
      letterSpacing: "-0.015em",
      color: "var(--ink, #0f1720)",
    },
    titleQuery: {
      color: "var(--link, #1b4da1)",
      fontWeight: 850,
    },
    locationLine: {
      marginTop: 4,
      color: "var(--muted, #5d6674)",
      fontSize: "var(--text-2, 14px)",
      fontWeight: 600,
    },
    meta: {
      marginTop: 6,
      color: "var(--muted, #5d6674)",
      fontSize: "var(--text-2, 14px)",
      fontWeight: 650,
    },
    filterBar: {
      marginTop: 12,
      display: "flex",
      gap: 8,
      flexWrap: "wrap",
      alignItems: "center",
    },
    priceSelect: {
      border: "1px solid var(--border, #e3e8ef)",
      borderRadius: 999,
      padding: "5px 10px",
      fontSize: "var(--text-2, 14px)",
      fontWeight: 700,
      background: maxPrice ? "var(--link, #124ba3)" : "#fff",
      color: maxPrice ? "#fff" : "var(--ink, #0f1720)",
      cursor: "pointer",
      outline: "none",
      appearance: "none",
      WebkitAppearance: "none",
    },
    grid: {
      display: "grid",
      gap: 12,
      marginTop: 16,
    },
    error: {
      marginTop: 12,
      padding: 12,
      border: "1px solid #ffd2d2",
      borderRadius: 12,
      background: "#fff5f5",
      color: "#7a1b1b",
      fontWeight: 700,
      whiteSpace: "pre-wrap",
    },
    empty: {
      marginTop: 12,
      padding: 12,
      border: "1px solid #e8ebef",
      borderRadius: 12,
      background: "#fafbfc",
      color: "#3c4757",
      fontWeight: 600,
    },
    section: {
      marginTop: 18,
      fontWeight: 800,
      color: "var(--ink, #0f1720)",
      fontSize: "var(--text-3, 16px)",
      letterSpacing: "-0.01em",
    },
  };

  const emptyMessage = q ? `No results for "${q}".` : "No results.";

  return (
    <div style={styles.wrap}>
      <div style={styles.topRow}>
        <button
          type="button"
          style={styles.backBtn}
          onClick={() => {
            if (window.history.length > 1) navigate(-1);
            else navigate("/");
          }}
          aria-label="Go back"
        >
          <span aria-hidden="true">←</span>
          <span>Back</span>
        </button>
      </div>

      <h1 style={styles.title}>
        {q ? (
          <>
            Results for <span style={styles.titleQuery}>&quot;{q}&quot;</span>
          </>
        ) : (
          "Search results"
        )}
      </h1>

      {locationLabel && (
        <div style={styles.locationLine}>Near {locationLabel}</div>
      )}

      <div style={styles.meta}>
        {hasMenuMatches
          ? `${restaurantGroups.length} restaurant${restaurantGroups.length === 1 ? "" : "s"} with menu matches`
          : restaurantOnlyRows.length
            ? `${restaurantOnlyRows.length} restaurant suggestion${restaurantOnlyRows.length === 1 ? "" : "s"}`
            : loading
              ? ""
              : "No matches yet."}
      </div>

      {/* Interactive filter bar */}
      <div style={styles.filterBar}>
        <FilterToggle
          label="Vegan"
          active={vegan}
          onClick={() => applyFilter(params, navigate, "vegan", "1")}
        />
        <FilterToggle
          label="Gluten-free"
          active={gluten_free}
          onClick={() => applyFilter(params, navigate, "gluten_free", "1")}
        />
        <FilterToggle
          label="Deals"
          active={deals_only}
          onClick={() => applyFilter(params, navigate, "deals_only", "1")}
        />
        <select
          value={maxPrice}
          onChange={(e) => setFilter(params, navigate, "max_price", e.target.value)}
          style={styles.priceSelect}
          aria-label="Price filter"
        >
          {PRICE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {err && <div style={styles.error}>Error: {err}</div>}
      {loading && <div style={styles.empty}>Loading...</div>}

      {!loading && !err && q && !hasMenuMatches && restaurantOnlyRows.length === 0 && (
        <div style={styles.empty}>{emptyMessage}</div>
      )}

      <div style={styles.grid}>
        {restaurantGroups.map((g) => (
          <SearchResultCard
            key={`rg-${g.restaurant_id || g.restaurant_name}`}
            restaurant={{
              id: g.restaurant_id,
              name: g.restaurant_name,
              raw: g._first,
            }}
            items={g.items}
            query={q}
          />
        ))}
      </div>

      {!loading && !err && !hasMenuMatches && restaurantOnlyRows.length > 0 && (
        <>
          <div style={styles.section}>Suggested restaurants</div>
          <div style={styles.grid}>
            {restaurantOnlyRows.map((r) => (
              <SearchResultCard
                key={`r-${asString(pickFirst(r, ["restaurant_id", "id"], "")) || asString(r?.name)}`}
                item={r}
                query={q}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
