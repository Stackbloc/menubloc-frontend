/**
 * ============================================================
 * File: menubloc-frontend/src/pages/GrubbidSearchResults.jsx
 * Date: 2026-03-03
 * Purpose:
 *   Search results page for Grubbid.
 *   - Reads query params from URL
 *   - Calls backend /search endpoint
 *   - Displays results
 *   - Shows query clearly to user ("Your search: ...")
 *   - Normalizes backend response shapes so UI stays stable as
 *     ingestion/search evolve (results/menu_items/restaurants).
 * ============================================================
 */

import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import SearchResultCard from "../components/SearchResultCard";

const API = (import.meta.env.VITE_API_URL || "http://localhost:3001").replace(/\/$/, "");

function useQueryParams() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

function isDishRow(x) {
  return !!(x?.menu_item_id || x?.menu_item_name);
}

/**
 * Normalize backend response shapes into a flat “row” structure that
 * SearchResultCard can consistently render, regardless of whether the backend
 * returns:
 * - results: [{ menu_item_id, menu_item_name, restaurant_id, restaurant_name, ... }]
 * - results: [{ item: {...}, restaurant: {...} }]
 * - rows: [...]
 * - menu_items: [...]
 * - restaurants: [...]
 */
function normalizeRows(json) {
  if (!json) return [];

  // Preferred: explicit results
  if (Array.isArray(json.results) && json.results.length) {
    const out = [];
    for (const r of json.results) {
      // Newer nested format: { item: {...}, restaurant: {...} }
      if (r?.item && r?.restaurant) {
        out.push({
          ...r,
          menu_item_id: r.item.id ?? r.item.menu_item_id ?? null,
          menu_item_name: r.item.name ?? r.item.menu_item_name ?? null,
          restaurant_id: r.restaurant.id ?? r.restaurant.restaurant_id ?? null,
          restaurant_name:
            r.restaurant.name ?? r.restaurant.restaurant_name ?? r.restaurant.title ?? null,
          price_cents: r.item.price_cents ?? r.item.priceMinor ?? r.item.price_minor ?? null,
          // Preserve original nested objects too (harmless, might be useful later)
          item: r.item,
          restaurant: r.restaurant,
        });
      } else {
        // Already flat or unknown shape — pass through
        out.push(r);
      }
    }
    return out;
  }

  // Legacy / alternate shapes
  if (Array.isArray(json.rows)) return json.rows;
  if (Array.isArray(json.menu_items)) return json.menu_items;
  if (Array.isArray(json.restaurants)) return json.restaurants;

  return [];
}

export default function GrubbidSearchResults() {
  const params = useQueryParams();

  const q = String(params.get("q") || "").trim();
  const vegan = params.get("vegan") === "1";
  const gluten_free = params.get("gluten_free") === "1";
  const deals_only = params.get("deals_only") === "1";
  const zip = String(params.get("zip") || "").trim();
  const price_max = params.get("price_max");

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
    if (price_max && String(price_max).trim() !== "") {
      u.searchParams.set("price_max", String(price_max));
    }
    return u.toString();
  }, [q, vegan, gluten_free, deals_only, zip, price_max]);

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

        const next = normalizeRows(json);
        setRows(next);
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

    return () => {
      alive = false;
    };
  }, [requestUrl]);

  const dishRows = useMemo(() => rows.filter(isDishRow), [rows]);
  const restaurantOnlyRows = useMemo(() => rows.filter((r) => !isDishRow(r)), [rows]);

  const styles = {
    wrap: { padding: 16, maxWidth: 980, margin: "0 auto" },

    headerRow: {
      display: "flex",
      justifyContent: "space-between",
      gap: 12,
      alignItems: "baseline",
    },

    h2: {
      margin: 0,
      fontSize: 18,
      fontWeight: 900,
    },

    back: {
      fontWeight: 900,
      textDecoration: "underline",
      color: "#111",
    },

    meta: {
      marginTop: 6,
      color: "#666",
      fontSize: 12,
    },

    grid: {
      display: "grid",
      gap: 12,
      marginTop: 14,
    },

    error: {
      marginTop: 12,
      padding: 12,
      border: "1px solid #ffd2d2",
      borderRadius: 12,
      background: "#fff5f5",
    },

    empty: {
      marginTop: 12,
      padding: 12,
      border: "1px solid #eee",
      borderRadius: 12,
      background: "#fafafa",
    },

    section: {
      marginTop: 16,
      fontWeight: 900,
      color: "#333",
    },
  };

  const emptyMessage = useMemo(() => {
    if (!q) return "No results.";
    return `No results for "${q}".`;
  }, [q]);

  return (
    <div style={styles.wrap}>
      <div style={styles.headerRow}>
        <div>
          <div style={styles.h2}>
            {q ? (
              <>
                Your search: <span style={{ fontWeight: 900 }}>"{q}"</span>
              </>
            ) : (
              "Search results"
            )}
          </div>

          <div style={styles.meta}>
            {vegan ? "Vegan · " : ""}
            {gluten_free ? "Gluten-free · " : ""}
            {deals_only ? "Deals only · " : ""}
            {zip ? `Zip: ${zip} · ` : ""}
            {price_max ? `Max: $${price_max}` : ""}
            {!vegan && !gluten_free && !deals_only && !zip && !price_max
              ? "No filters"
              : ""}
          </div>
        </div>

        <Link to="/" style={styles.back}>
          Back
        </Link>
      </div>

      {err && <div style={styles.error}>{emptyMessage}</div>}

      {loading && <div style={styles.empty}>Loading…</div>}

      {!loading && !err && q && dishRows.length === 0 && (
        <div style={styles.empty}>{emptyMessage}</div>
      )}

      <div style={styles.grid}>
        {dishRows.map((r) => (
          <SearchResultCard
            key={`${r.menu_item_id || r.id}-${r.restaurant_id || ""}`}
            item={r}
            query={q}
          />
        ))}
      </div>

      {!loading && !err && restaurantOnlyRows.length > 0 && (
        <>
          <div style={styles.section}>Restaurants</div>
          <div style={styles.grid}>
            {restaurantOnlyRows.map((r) => (
              <SearchResultCard
                key={`r-${r.restaurant_id || r.id}`}
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