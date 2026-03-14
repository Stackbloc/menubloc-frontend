/**
 * ============================================================
 * File: menubloc-frontend/src/pages/GrubbidDiscovery.jsx
 * Date: 2026-03-03
 * Purpose:
 *   Discovery search landing page and filter controls.
 *
 * Update (this revision):
 *   - Search headline: "What do you want to eat?"
 *   - Search placeholder: "Search food, ingredients, restaurants, or deals"
 *   - Added Day/Night toggle (light/dark) for Discovery page only
 *     - Persists to localStorage key: "grubbid_theme"
 *     - Defaults to system preference when not set
 * ============================================================
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const THEME_KEY = "grubbid_theme"; // "light" | "dark"

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

export default function GrubbidDiscovery() {
  const nav = useNavigate();
  const areaInputRef = useRef(null);

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
  const [areaOpen, setAreaOpen] = useState(false);

  const [theme, setTheme] = useState(getInitialTheme); // "light" | "dark"

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
    setAreaOpen(false);
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

  function goSearch() {
    const params = new URLSearchParams();

    if (q.trim()) params.set("q", q.trim());

    const veganOn = health.includes("Vegan");
    if (veganOn) params.set("vegan", "1");

    const gfOn = ingredients.includes("Gluten-free");
    if (gfOn) params.set("gluten_free", "1");

    const priceMax = priceBucketsToMax(price);
    if (priceMax != null) params.set("price_max", String(priceMax));

    if (dealsOnly) params.set("deals_only", "1");

    if (cuisine !== "Any") params.set("cuisine", cuisine);
    if (distance.length) params.set("distance", distance.join("|"));
    if (delivery) params.set("delivery", "1");
    if (health.length) params.set("health", health.join("|"));
    if (ingredients.length) params.set("ingredients", ingredients.join("|"));
    if (zip.trim()) params.set("zip", zip.trim());

    nav(`/search?${params.toString()}`);
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

  function closeArea() {
    setAreaOpen(false);
  }

  const isDark = theme === "dark";

  const styles = {
    page: {
      maxWidth: 980,
      margin: "40px auto",
      padding: "0 20px",
      fontFamily:
        'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial',
      color: isDark ? "rgba(255,255,255,0.92)" : "#111",
    },

    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
    brand: { fontWeight: 900, fontSize: 18 },
    subbrand: { fontSize: 12, color: isDark ? "rgba(255,255,255,0.65)" : "#666" },

    themeToggle: {
      height: 36,
      padding: "0 12px",
      borderRadius: 999,
      border: isDark ? "1px solid rgba(255,255,255,0.18)" : "1px solid #e5e5e5",
      background: isDark ? "rgba(255,255,255,0.06)" : "#fff",
      color: isDark ? "rgba(255,255,255,0.92)" : "#111",
      fontWeight: 800,
      cursor: "pointer",
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
    },

    headline: {
      textAlign: "center",
      fontSize: 28,
      fontWeight: 950,
      letterSpacing: -0.2,
      margin: "12px 0 6px",
    },

    centerTag: { textAlign: "center", color: isDark ? "rgba(255,255,255,0.60)" : "#666", marginBottom: 18 },

    searchRow: {
      display: "flex",
      alignItems: "center",
      gap: 16,
      justifyContent: "center",
      marginBottom: 12,
    },

    searchInput: {
      flex: 1,
      maxWidth: 720,
      height: 44,
      borderRadius: 999,
      border: isDark ? "1px solid rgba(255,255,255,0.16)" : "1px solid #e5e5e5",
      padding: "0 16px",
      background: isDark ? "rgba(255,255,255,0.06)" : "#fff",
      color: isDark ? "rgba(255,255,255,0.92)" : "#111",
      outline: "none",
    },

    topButtonSpacer: {
      width: 110,
      height: 44,
      borderRadius: 12,
      background: "transparent",
      border: "1px solid transparent",
      pointerEvents: "none",
    },

    panel: {
      background: isDark ? "rgba(255,255,255,0.05)" : "#f7f7fb",
      borderRadius: 16,
      padding: 18,
      marginBottom: 16,
      border: isDark ? "1px solid rgba(255,255,255,0.10)" : "1px solid #efeff6",
    },

    label: { fontSize: 12, fontWeight: 800, color: isDark ? "rgba(255,255,255,0.78)" : "#444", marginBottom: 6 },

    select: {
      width: "100%",
      height: 40,
      borderRadius: 12,
      border: isDark ? "1px solid rgba(255,255,255,0.14)" : "1px solid #e5e5e5",
      padding: "0 12px",
      marginBottom: 14,
      background: isDark ? "rgba(0,0,0,0.25)" : "#fff",
      color: isDark ? "rgba(255,255,255,0.92)" : "#111",
    },

    sectionTitle: {
      textAlign: "center",
      fontSize: 12,
      fontWeight: 900,
      color: isDark ? "rgba(255,255,255,0.92)" : "#111",
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
      justifyContent: "center",
      marginBottom: 14,
    },

    chip: (active) => ({
      padding: "8px 12px",
      borderRadius: 999,
      border: active
        ? isDark
          ? "1px solid rgba(255,255,255,0.75)"
          : "1px solid #111"
        : isDark
        ? "1px solid rgba(255,255,255,0.16)"
        : "1px solid #e5e5e5",
      cursor: "pointer",
      fontSize: 12,
      fontWeight: 700,
      background: active
        ? isDark
          ? "rgba(255,255,255,0.10)"
          : "#fff"
        : "transparent",
      userSelect: "none",
      color: isDark ? "rgba(255,255,255,0.92)" : "#111",
    }),

    searchBtn: {
      height: 44,
      padding: "0 18px",
      borderRadius: 12,
      border: 0,
      background: isDark ? "#fff" : "#111",
      color: isDark ? "#111" : "#fff",
      fontWeight: 900,
      cursor: "pointer",
    },

    clearBtnBig: {
      height: 44,
      padding: "0 18px",
      borderRadius: 12,
      border: isDark ? "1px solid rgba(255,255,255,0.16)" : "1px solid #e5e5e5",
      background: isDark ? "rgba(255,255,255,0.06)" : "#fff",
      color: isDark ? "rgba(255,255,255,0.92)" : "#111",
      cursor: "pointer",
      fontWeight: 900,
    },

    footer: {
      textAlign: "center",
      marginTop: 18,
      paddingTop: 18,
      paddingBottom: 18,
      borderTop: isDark ? "1px solid rgba(255,255,255,0.12)" : "1px solid #eee",
      color: isDark ? "rgba(255,255,255,0.80)" : "#111",
    },

    footerLink: {
      color: isDark ? "rgba(255,255,255,0.92)" : "#111",
      fontWeight: 800,
      textDecoration: "underline",
      textUnderlineOffset: "3px",
      cursor: "pointer",
    },
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <div style={styles.brand}>Grubbid</div>
          <div style={styles.subbrand}>Discovery</div>
        </div>

        <button type="button" style={styles.themeToggle} onClick={toggleTheme} aria-label="Toggle day/night mode">
          <span aria-hidden="true">{isDark ? "🌙" : "☀️"}</span>
          {isDark ? "Night" : "Day"}
        </button>
      </div>

      <div style={styles.headline}>What do you want to eat?</div>
      <div style={styles.centerTag}>the food intelligence platform</div>

      <div style={styles.searchRow}>
        <input
          style={styles.searchInput}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={handleSearchInputKeyDown}
          placeholder="Search food, ingredients, restaurants, or deals"
        />
        <div aria-hidden="true" style={styles.topButtonSpacer} />
      </div>

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

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button type="button" style={styles.clearBtnBig} onClick={clearAll}>
            Clear
          </button>
          <button type="button" style={styles.searchBtn} onClick={goSearch}>
            Search
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
  );
}