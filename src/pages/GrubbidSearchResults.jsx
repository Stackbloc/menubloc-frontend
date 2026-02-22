// menubloc-frontend/src/pages/GrubbidSearchResults.jsx
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
    const u = new URL(`${API}/public/search`);
    if (q) u.searchParams.set("q", q);
    if (vegan) u.searchParams.set("vegan", "1");
    if (gluten_free) u.searchParams.set("gluten_free", "1");
    if (deals_only) u.searchParams.set("deals_only", "1");
    if (zip) u.searchParams.set("zip", zip);
    if (price_max && String(price_max).trim() !== "") u.searchParams.set("price_max", String(price_max));
    return u.toString();
  }, [q, vegan, gluten_free, deals_only, zip, price_max]);

  useEffect(() => {
    let alive = true;

    async function run() {
      setLoading(true);
      setErr("");
      try {
        const res = await fetch(requestUrl, { credentials: "include" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();

        const next = Array.isArray(json?.rows) ? json.rows : Array.isArray(json?.restaurants) ? json.restaurants : [];
        if (!alive) return;

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

  const headerText = useMemo(() => {
    if (!q) return "Search results";
    const n = dishRows.length;
    const dishWord = n === 1 ? "dish" : "dishes";
    return `${n} ${dishWord} matching “${q}”`;
  }, [q, dishRows.length]);

  const styles = {
    wrap: { padding: 16, maxWidth: 980, margin: "0 auto" },
    headerRow: { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" },
    h2: { margin: 0, fontSize: 18, fontWeight: 900 },
    back: { fontWeight: 900, textDecoration: "underline", color: "#111" },
    meta: { marginTop: 6, color: "#666", fontSize: 12 },
    grid: { display: "grid", gap: 12, marginTop: 14 },
    error: { marginTop: 12, padding: 12, border: "1px solid #ffd2d2", borderRadius: 12, background: "#fff5f5" },
    empty: { marginTop: 12, padding: 12, border: "1px solid #eee", borderRadius: 12, background: "#fafafa" },
    section: { marginTop: 16, fontWeight: 900, color: "#333" },
  };

  return (
    <div style={styles.wrap}>
      <div style={styles.headerRow}>
        <div>
          <div style={styles.h2}>{headerText}</div>
          <div style={styles.meta}>
            {vegan ? "Vegan · " : ""}
            {gluten_free ? "Gluten-free · " : ""}
            {deals_only ? "Deals only · " : ""}
            {zip ? `Zip: ${zip} · ` : ""}
            {price_max ? `Max: $${price_max}` : ""}
            {!vegan && !gluten_free && !deals_only && !zip && !price_max ? "No filters" : ""}
          </div>
        </div>

        <Link to="/discover" style={styles.back}>
          Back
        </Link>
      </div>

      {err ? <div style={styles.error}>Error: {err}</div> : null}
      {loading ? <div style={styles.empty}>Loading…</div> : null}

      {!loading && !err && q && dishRows.length === 0 ? (
        <div style={styles.empty}>No dishes found for “{q}”. Try removing filters or using a shorter keyword.</div>
      ) : null}

      {/* Dish results */}
      <div style={styles.grid}>
        {dishRows.map((r) => (
          <SearchResultCard key={`${r.menu_item_id || r.id}-${r.restaurant_id || ""}`} item={r} query={q} />
        ))}
      </div>

      {/* If any restaurant-only rows show up, render them at bottom (rare with your current backend, but safe) */}
      {!loading && !err && restaurantOnlyRows.length > 0 ? (
        <>
          <div style={styles.section}>Restaurants</div>
          <div style={styles.grid}>
            {restaurantOnlyRows.map((r) => (
              <SearchResultCard key={`r-${r.restaurant_id || r.id}`} item={r} query={q} />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
