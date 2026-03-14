/**
 * ============================================================
 * File: GrubbidDiscovery.jsx
 * Path: menubloc-frontend/src/pages/GrubbidDiscovery.jsx
 * Date: 2026-03-13
 * Purpose:
 *   Discovery search landing page and filter controls.
 *
 *   Mobile-safe revision:
 *   - Removes desktop-only width assumptions
 *   - Stacks search + browse button on small screens
 *   - Makes action buttons full-width on small screens
 *   - Tightens spacing and type sizes for phones
 *   - Preserves:
 *       1. no top-of-page "What do you want to eat?" headline
 *       2. empty-search preflight behavior
 * ============================================================
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API = (import.meta.env.VITE_API_URL || "http://localhost:3001").replace(/\/$/, "");
const THEME_KEY = "grubbid_theme";
const BROWSE_MENUS_PATH = "/browse-menus";

function getSystemTheme() {
  try {
    return window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  } catch {
    return "light";
  }
}

function getInitialTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "dark" || saved === "light") return saved;
  } catch {
    // ignore
  }
  return getSystemTheme();
}

function normalizeRows(json) {
  if (!json) return [];
  if (Array.isArray(json.results)) return json.results;
  if (Array.isArray(json.rows)) return json.rows;
  if (Array.isArray(json.menu_items)) return json.menu_items;
  if (Array.isArray(json.restaurants)) return json.restaurants;
  return [];
}

function hasSearchResults(json) {
  const rows = normalizeRows(json);
  return Array.isArray(rows) && rows.length > 0;
}

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

export default function GrubbidDiscovery() {
  const nav = useNavigate();
  const areaInputRef = useRef(null);
  const isMobile = useIsMobile();

  const PRICE_BUCKETS = useMemo(() => ["<$10", "<$20", "<$50"], []);
  const DISTANCE = useMemo(() => ["< 3 miles"], []);

  const HEALTH = useMemo(
    () => [
      "Diabetic-friendly",
      "High protein",
      "Keto",
      "Low carb (keto)",
      "Low sodium",
      "Under 700 cal",
      "Vegan",
      "Vegetarian",
    ],
    []
  );

  const INGREDIENTS = useMemo(
    () => ["Dairy-free", "Gluten-free", "Peanut-free", "Seed-oil free"],
    []
  );

  const CUISINES = useMemo(
    () => ["Any", "American", "Chinese", "Indian", "Italian", "Japanese", "Korean"],
    []
  );

  const [q, setQ] = useState("");
  const [cuisine, setCuisine] = useState("Any");
  const [price, setPrice] = useState([]);
  const [distance, setDistance] = useState([]);
  const [delivery, setDelivery] = useState(false);
  const [dealsOnly, setDealsOnly] = useState(false);
  const [health, setHealth] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [zip, setZip] = useState("");
  const [theme, setTheme] = useState(getInitialTheme);

  const [searching, setSearching] = useState(false);
  const [inlineError, setInlineError] = useState("");
  const [emptyMessage, setEmptyMessage] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // ignore
    }
  }, [theme]);

  function toggleTheme() {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }

  function toggleInList(value, list, setList) {
    setList((prev) =>
      prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value]
    );
  }

  function clearAll() {
    setQ("");
    setCuisine("Any");
    setPrice([]);
    setDistance([]);
    setDelivery(false);
    setDealsOnly(false);
    setHealth([]);
    setIngredients([]);
    setZip("");
    setInlineError("");
    setEmptyMessage("");
    if (areaInputRef.current) areaInputRef.current.focus();
  }

  function priceBucketsToMax(buckets) {
    let max = null;
    for (const b of buckets) {
      if (b === "<$10") max = Math.max(max ?? 0, 10);
      if (b === "<$20") max = Math.max(max ?? 0, 20);
      if (b === "<$50") max = Math.max(max ?? 0, 50);
    }
    return max;
  }

  function buildSearchParams() {
    const params = new URLSearchParams();

    if (q.trim()) params.set("q", q.trim());

    if (health.includes("Vegan")) params.set("vegan", "1");
    if (ingredients.includes("Gluten-free")) params.set("gluten_free", "1");

    const priceMax = priceBucketsToMax(price);
    if (priceMax != null) params.set("max_price", String(priceMax));

    if (dealsOnly) params.set("deals_only", "1");
    if (cuisine !== "Any") params.set("cuisine", cuisine);
    if (distance.length) params.set("distance", distance.join("|"));
    if (delivery) params.set("delivery", "1");
    if (health.length) params.set("health", health.join("|"));
    if (ingredients.length) params.set("ingredients", ingredients.join("|"));
    if (zip.trim()) params.set("zip", zip.trim());

    return params;
  }

  async function goSearch() {
    const params = buildSearchParams();
    const searchUrl = `${API}/search?${params.toString()}`;

    setSearching(true);
    setInlineError("");
    setEmptyMessage("");

    try {
      const res = await fetch(searchUrl, { credentials: "include" });
      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || `HTTP ${res.status}`);
      }

      if (hasSearchResults(json)) {
        nav(`/search?${params.toString()}`);
        return;
      }

      const queryLabel = q.trim() ? ` for "${q.trim()}"` : "";
      setEmptyMessage(`No results found${queryLabel}. Try a broader search or fewer filters.`);
    } catch (err) {
      setInlineError(String(err?.message || err || "Search failed"));
    } finally {
      setSearching(false);
    }
  }

  function goBrowseMenus() {
    nav(BROWSE_MENUS_PATH);
  }

  function handleSearchInputKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      goSearch();
    }
  }

  function chipA11y(onActivate) {
    return {
      role: "button",
      tabIndex: 0,
      onKeyDown: (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onActivate();
        }
      },
    };
  }

  const isDark = theme === "dark";

  const pageBg = isDark ? "#111" : "#fff";
  const pageFg = isDark ? "#fff" : "#111";
  const muted = isDark ? "rgba(255,255,255,0.68)" : "#666";

  const styles = {
    outer: {
      minHeight: "100vh",
      background: pageBg,
      overflowX: "hidden",
    },

    page: {
      maxWidth: 980,
      width: "100%",
      boxSizing: "border-box",
      margin: "0 auto",
      padding: isMobile ? "18px 14px 28px" : "40px 20px",
      fontFamily:
        "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
      color: pageFg,
    },

    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: isMobile ? "flex-start" : "center",
      marginBottom: isMobile ? 14 : 18,
      gap: 12,
    },

    brand: {
      fontWeight: 900,
      fontSize: isMobile ? 16 : 18,
      color: pageFg,
      lineHeight: 1.1,
    },

    subbrand: {
      fontSize: 12,
      color: muted,
      marginTop: 2,
    },

    themeToggle: {
      height: 36,
      minWidth: isMobile ? 84 : "auto",
      padding: "0 14px",
      borderRadius: 999,
      border: isDark ? "1px solid #fff" : "1px solid #111",
      background: isDark ? "#fff" : "#111",
      color: isDark ? "#111" : "#fff",
      fontWeight: 800,
      cursor: "pointer",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },

    centerTag: {
      textAlign: isMobile ? "left" : "center",
      color: muted,
      marginBottom: isMobile ? 14 : 18,
      marginTop: 6,
      fontSize: isMobile ? 13 : 14,
      lineHeight: 1.35,
    },

    searchRow: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1fr) auto",
      alignItems: "stretch",
      gap: isMobile ? 10 : 14,
      marginBottom: 12,
    },

    searchInput: {
      width: "100%",
      minWidth: 0,
      boxSizing: "border-box",
      height: isMobile ? 46 : 48,
      borderRadius: 999,
      border: isDark ? "1px solid rgba(255,255,255,0.24)" : "1px solid #dcdcdc",
      padding: isMobile ? "0 16px" : "0 18px",
      background: isDark ? "#000" : "#fff",
      color: pageFg,
      outline: "none",
      fontSize: isMobile ? 14 : 14,
    },

    browseMenusBtn: {
      width: isMobile ? "100%" : "auto",
      minWidth: isMobile ? 0 : 166,
      height: isMobile ? 46 : 48,
      padding: "0 18px",
      borderRadius: 14,
      border: isDark ? "1px solid rgba(255,255,255,0.24)" : "1px solid #d9dece",
      background: isDark ? "#000" : "#f3f6ea",
      color: pageFg,
      fontWeight: 900,
      cursor: "pointer",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      lineHeight: 1.05,
      boxSizing: "border-box",
    },

    browseMenusMain: {
      fontSize: 14,
      fontWeight: 900,
    },

    browseMenusSub: {
      marginTop: 2,
      fontSize: 11,
      fontWeight: 700,
      opacity: 0.78,
    },

    feedback: {
      marginBottom: 14,
      padding: isMobile ? "11px 12px" : "12px 14px",
      borderRadius: 12,
      fontSize: 14,
      fontWeight: 700,
      lineHeight: 1.4,
      wordBreak: "break-word",
    },

    feedbackError: {
      border: "1px solid #ffd2d2",
      background: "#fff5f5",
      color: "#7a1b1b",
    },

    feedbackEmpty: {
      border: isDark ? "1px solid rgba(255,255,255,0.12)" : "1px solid #e8ebef",
      background: isDark ? "rgba(255,255,255,0.05)" : "#fafbfc",
      color: pageFg,
    },

    panel: {
      background: isDark ? "rgba(255,255,255,0.04)" : "#f7f7fb",
      borderRadius: 16,
      padding: isMobile ? 14 : 18,
      marginBottom: 16,
      border: isDark ? "1px solid rgba(255,255,255,0.10)" : "1px solid #efeff6",
      boxSizing: "border-box",
    },

    label: {
      fontSize: 12,
      fontWeight: 800,
      color: isDark ? "rgba(255,255,255,0.82)" : "#444",
      marginBottom: 6,
    },

    select: {
      width: "100%",
      minWidth: 0,
      boxSizing: "border-box",
      height: 40,
      borderRadius: 12,
      border: isDark ? "1px solid rgba(255,255,255,0.16)" : "1px solid #e5e5e5",
      padding: "0 12px",
      marginBottom: 14,
      background: isDark ? "#000" : "#fff",
      color: pageFg,
      fontSize: 14,
    },

    sectionTitle: {
      textAlign: isMobile ? "left" : "center",
      fontSize: 12,
      fontWeight: 900,
      color: pageFg,
      margin: "10px 0 10px",
    },

    chipRow: {
      display: "flex",
      flexWrap: "wrap",
      gap: 10,
      marginBottom: 14,
    },

    chipRowCentered: {
      display: "flex",
      flexWrap: "wrap",
      gap: 10,
      justifyContent: isMobile ? "flex-start" : "center",
      marginBottom: 14,
    },

    chip: (active) => ({
      padding: isMobile ? "8px 11px" : "8px 12px",
      borderRadius: 999,
      border: active
        ? isDark
          ? "1px solid #fff"
          : "1px solid #111"
        : isDark
        ? "1px solid rgba(255,255,255,0.18)"
        : "1px solid #e5e5e5",
      cursor: "pointer",
      fontSize: 12,
      fontWeight: 700,
      background: active
        ? isDark
          ? "rgba(255,255,255,0.12)"
          : "#fff"
        : "transparent",
      userSelect: "none",
      color: pageFg,
      lineHeight: 1.2,
    }),

    actionRow: {
      display: "flex",
      gap: 10,
      justifyContent: "flex-end",
      flexWrap: "wrap",
      flexDirection: isMobile ? "column-reverse" : "row",
    },

    searchBtn: {
      height: 44,
      width: isMobile ? "100%" : "auto",
      padding: "0 18px",
      borderRadius: 12,
      border: 0,
      background: isDark ? "#fff" : "#111",
      color: isDark ? "#111" : "#fff",
      fontWeight: 900,
      cursor: searching ? "default" : "pointer",
      opacity: searching ? 0.72 : 1,
      boxSizing: "border-box",
    },

    clearBtnBig: {
      height: 44,
      width: isMobile ? "100%" : "auto",
      padding: "0 18px",
      borderRadius: 12,
      border: isDark ? "1px solid rgba(255,255,255,0.18)" : "1px solid #e5e5e5",
      background: isDark ? "#000" : "#fff",
      color: pageFg,
      cursor: "pointer",
      fontWeight: 900,
      boxSizing: "border-box",
    },

    footer: {
      textAlign: "center",
      marginTop: 18,
      paddingTop: 18,
      paddingBottom: 18,
      borderTop: isDark ? "1px solid rgba(255,255,255,0.12)" : "1px solid #eee",
      color: pageFg,
      fontSize: isMobile ? 13 : 14,
      lineHeight: 1.4,
    },

    footerLink: {
      color: pageFg,
      fontWeight: 800,
      textDecoration: "underline",
      textUnderlineOffset: "3px",
      cursor: "pointer",
    },
  };

  return (
    <div style={styles.outer}>
      <div style={styles.page}>
        <div style={styles.header}>
          <div>
            <div style={styles.brand}>Grubbid</div>
            <div style={styles.subbrand}>Discovery</div>
          </div>

          <button
            type="button"
            style={styles.themeToggle}
            onClick={toggleTheme}
            aria-label="Toggle color mode"
          >
            Toggle
          </button>
        </div>

        <div style={styles.centerTag}>the food intelligence platform</div>

        <div style={styles.searchRow}>
          <input
            ref={areaInputRef}
            style={styles.searchInput}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              if (inlineError) setInlineError("");
              if (emptyMessage) setEmptyMessage("");
            }}
            onKeyDown={handleSearchInputKeyDown}
            placeholder="What do you want to eat today? Search food, ingredients, restaurants, or deals"
          />

          <button
            type="button"
            style={styles.browseMenusBtn}
            onClick={goBrowseMenus}
            aria-label="Browse local menus"
          >
            <span style={styles.browseMenusMain}>Browse Menus</span>
            <span style={styles.browseMenusSub}>(Local)</span>
          </button>
        </div>

        {inlineError ? (
          <div style={{ ...styles.feedback, ...styles.feedbackError }}>
            Search error: {inlineError}
          </div>
        ) : null}

        {emptyMessage ? (
          <div style={{ ...styles.feedback, ...styles.feedbackEmpty }}>
            {emptyMessage}
          </div>
        ) : null}

        <div style={styles.panel}>
          <div style={styles.label}>Cuisine</div>
          <select
            style={styles.select}
            value={cuisine}
            onChange={(e) => setCuisine(e.target.value)}
          >
            {CUISINES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>

          <div style={styles.sectionTitle}>Convenience</div>
          <div style={styles.chipRowCentered}>
            {PRICE_BUCKETS.map((p) => (
              <div
                key={p}
                style={styles.chip(price.includes(p))}
                onClick={() => toggleInList(p, price, setPrice)}
                {...chipA11y(() => toggleInList(p, price, setPrice))}
              >
                {p}
              </div>
            ))}

            {DISTANCE.map((d) => (
              <div
                key={d}
                style={styles.chip(distance.includes(d))}
                onClick={() => toggleInList(d, distance, setDistance)}
                {...chipA11y(() => toggleInList(d, distance, setDistance))}
              >
                {d}
              </div>
            ))}

            <div
              style={styles.chip(delivery)}
              onClick={() => setDelivery((v) => !v)}
              {...chipA11y(() => setDelivery((v) => !v))}
            >
              Delivery
            </div>

            <div
              style={styles.chip(dealsOnly)}
              onClick={() => setDealsOnly((v) => !v)}
              {...chipA11y(() => setDealsOnly((v) => !v))}
            >
              Deals
            </div>
          </div>

          <div style={styles.sectionTitle}>Health</div>
          <div style={styles.chipRow}>
            {HEALTH.map((h) => (
              <div
                key={h}
                style={styles.chip(health.includes(h))}
                onClick={() => toggleInList(h, health, setHealth)}
                {...chipA11y(() => toggleInList(h, health, setHealth))}
              >
                {h}
              </div>
            ))}
          </div>

          <div style={styles.sectionTitle}>Ingredients</div>
          <div style={styles.chipRowCentered}>
            {INGREDIENTS.map((i) => (
              <div
                key={i}
                style={styles.chip(ingredients.includes(i))}
                onClick={() => toggleInList(i, ingredients, setIngredients)}
                {...chipA11y(() => toggleInList(i, ingredients, setIngredients))}
              >
                {i}
              </div>
            ))}
          </div>

          <div style={{ ...styles.label, marginTop: 4 }}>ZIP code</div>
          <input
            value={zip}
            onChange={(e) => setZip(e.target.value)}
            placeholder="Optional ZIP code"
            style={{
              ...styles.searchInput,
              height: 40,
              borderRadius: 12,
              marginBottom: 14,
            }}
          />

          <div style={styles.actionRow}>
            <button type="button" style={styles.clearBtnBig} onClick={clearAll}>
              Clear
            </button>
            <button
              type="button"
              style={styles.searchBtn}
              onClick={goSearch}
              disabled={searching}
            >
              {searching ? "Searching..." : "Search"}
            </button>
          </div>
        </div>

        <div style={styles.footer}>
          <Link to="/restaurant/signup" style={styles.footerLink}>
            Restaurant sign up
          </Link>{" "}
          · get discovered
        </div>
      </div>
    </div>
  );
}