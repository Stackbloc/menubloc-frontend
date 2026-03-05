/**
 * ============================================================
 * File: menubloc-frontend/src/pages/GrubbidDiscovery.jsx
 * Date: 2026-03-04
 * Purpose:
 *   Discovery search landing page and filter controls.
 *
 * Update (this revision):
 *   - NO headline text on the page (prompt lives inside search bar only)
 *   - Search bar placeholder:
 *       "What do you want to eat? Search food, ingredients, restaurants, or deals"
 *   - Search examples blob removed
 *   - Keep City/ZIP “Search another area” section at bottom
 *   - Day/Night mode toggle included and VERIFIED to affect the ENTIRE screen:
 *       - Button label is just: "Toggle"
 *       - Night mode sets document.body background to black and uses light text
 *       - Persists to localStorage key: "grubbid_theme"
 *       - Defaults to system preference when not set
 * ============================================================
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const THEME_KEY = "grubbid_theme"; // "light" | "dark"

function getSystemTheme() {
  try {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
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
    () => ["Diabetic-friendly", "High protein", "Keto", "Low carb (keto)", "Low sodium", "Under 700 cal", "Vegan", "Vegetarian"],
    []
  );
  const INGREDIENTS = useMemo(() => ["Dairy-free", "Gluten-free", "Peanut-free", "Seed-oil free"], []);
  const CUISINES = useMemo(() => ["Any", "American", "Chinese", "Indian", "Italian", "Japanese", "Korean"], []);

  // --- state
  const [q, setQ] = useState("");
  const [cuisine, setCuisine] = useState("Any");
  const [price, setPrice] = useState([]);
  const [distance, setDistance] = useState([]);
  const [delivery, setDelivery] = useState(false);
  const [dealsOnly, setDealsOnly] = useState(false);
  const [health, setHealth] = useState([]);
  const [ingredients, setIngredients] = useState([]);

  // City/ZIP (kept)
  const [zip, setZip] = useState("");
  const [areaOpen, setAreaOpen] = useState(false);

  // Theme toggle (works: localStorage + system default)
  const [theme, setTheme] = useState(getInitialTheme); // "light" | "dark"
  const isDark = theme === "dark";

  useEffect(() => {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // ignore
    }
  }, [theme]);

  // ✅ Ensures the *entire screen* switches to black in night mode
  useEffect(() => {
    const prevBg = document.body.style.backgroundColor;
    const prevColor = document.body.style.color;

    document.body.style.backgroundColor = isDark ? "#000" : "#fff";
    document.body.style.color = isDark ? "rgba(255,255,255,0.92)" : "#111";

    return () => {
      document.body.style.backgroundColor = prevBg;
      document.body.style.color = prevColor;
    };
  }, [isDark]);

  function toggleTheme() {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }

  function toggleInList(value, list, setList) {
    setList((prev) => (prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value]));
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
    // NOTE: Do NOT clear zip by default; user may want to keep location.
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

  function goSearch() {
    const params = new URLSearchParams();

    // Filtering MVP params (backend supports these)
    if (q.trim()) params.set("q", q.trim());

    const veganOn = health.includes("Vegan");
    const gfOn = ingredients.includes("Gluten-free");

    if (veganOn) params.set("vegan", "1");
    if (gfOn) params.set("gluten_free", "1");

    // Price buckets → pick the max bucket (simple)
    if (price.includes("<$10")) params.set("max_price", "10");
    else if (price.includes("<$20")) params.set("max_price", "20");
    else if (price.includes("<$50")) params.set("max_price", "50");

    if (dealsOnly) params.set("deals_only", "1");

    // carry for later / frontend params
    if (cuisine !== "Any") params.set("cuisine", cuisine);
    if (distance.length) params.set("distance", distance.join("|"));
    if (delivery) params.set("delivery", "1");
    if (health.length) params.set("health", health.join("|"));
    if (ingredients.length) params.set("ingredients", ingredients.join("|"));

    // City/ZIP carry in URL
    if (zip.trim()) params.set("zip", zip.trim());

    nav(`/search?${params.toString()}`);
  }

  const styles = {
    page: {
      maxWidth: 980,
      margin: "0 auto",
      padding: "18px 20px 0",
      fontFamily: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial',
      color: isDark ? "rgba(255,255,255,0.92)" : "#111",
      background: "transparent", // body handles full-screen background
      minHeight: "100vh",
    },

    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 },
    brand: { fontWeight: 800, fontSize: 18 },
    subbrand: { fontSize: 12, color: isDark ? "rgba(255,255,255,0.65)" : "#666" },

    themeToggle: {
      height: 36,
      padding: "0 12px",
      borderRadius: 999,
      border: isDark ? "1px solid rgba(255,255,255,0.20)" : "1px solid #e5e5e5",
      background: isDark ? "rgba(255,255,255,0.06)" : "#fff",
      color: isDark ? "rgba(255,255,255,0.92)" : "#111",
      fontWeight: 800,
      cursor: "pointer",
    },

    centerTag: { textAlign: "center", color: isDark ? "rgba(255,255,255,0.60)" : "#666", marginBottom: 18 },

    // Top search row
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
      border: isDark ? "1px solid rgba(255,255,255,0.18)" : "1px solid #e5e5e5",
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
      pointerEvents: "none",
    },

    panel: {
      background: isDark ? "rgba(255,255,255,0.05)" : "#f7f7fb",
      borderRadius: 16,
      padding: 18,
      marginBottom: 16,
      border: isDark ? "1px solid rgba(255,255,255,0.10)" : "1px solid #efeff6",
    },

    label: { fontSize: 12, fontWeight: 700, color: isDark ? "rgba(255,255,255,0.75)" : "#444", marginBottom: 6 },

    select: {
      width: "100%",
      height: 40,
      borderRadius: 12,
      border: isDark ? "1px solid rgba(255,255,255,0.16)" : "1px solid #e5e5e5",
      padding: "0 12px",
      marginBottom: 14,
      background: isDark ? "rgba(255,255,255,0.06)" : "#fff",
      color: isDark ? "rgba(255,255,255,0.92)" : "#111",
      outline: "none",
    },

    sectionTitle: {
      textAlign: "center",
      fontSize: 12,
      fontWeight: 800,
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
          ? "1px solid rgba(255,255,255,0.80)"
          : "1px solid #111"
        : isDark
        ? "1px solid rgba(255,255,255,0.18)"
        : "1px solid #e5e5e5",
      cursor: "pointer",
      fontSize: 12,
      fontWeight: 600,
      background: active ? (isDark ? "rgba(255,255,255,0.10)" : "#fff") : "transparent",
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
      fontWeight: 700,
      cursor: "pointer",
    },

    clearBtn: {
      height: 44,
      padding: "0 18px",
      borderRadius: 12,
      border: isDark ? "1px solid rgba(255,255,255,0.18)" : "1px solid #e5e5e5",
      background: isDark ? "rgba(255,255,255,0.06)" : "#fff",
      color: isDark ? "rgba(255,255,255,0.92)" : "#111",
      cursor: "pointer",
      fontWeight: 700,
    },

    // --- Sticky “Search another area” control ABOVE footer (kept)
    stickyAreaWrap: {
      position: "sticky",
      bottom: 10,
      zIndex: 20,
      display: "flex",
      justifyContent: "center",
      marginTop: 10,
      marginBottom: 8,
    },
    stickyAreaInner: {
      width: "min(520px, calc(100vw - 28px))",
    },

    spaceBar: (active) => ({
      height: 30,
      borderRadius: 10,
      border: active
        ? isDark
          ? "1px solid rgba(255,255,255,0.80)"
          : "1px solid #111"
        : isDark
        ? "1px solid rgba(255,255,255,0.18)"
        : "1px solid #e5e5e5",
      background: isDark ? "rgba(255,255,255,0.06)" : "#fff",
      boxShadow: isDark ? "0 3px 10px rgba(0,0,0,0.50)" : "0 3px 10px rgba(0,0,0,0.08)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 12,
      fontWeight: 700,
      color: isDark ? "rgba(255,255,255,0.92)" : "#222",
      cursor: "pointer",
      userSelect: "none",
    }),
    spaceBarHint: {
      marginLeft: 8,
      color: isDark ? "rgba(255,255,255,0.55)" : "#777",
      fontSize: 11,
      fontWeight: 600,
    },

    popover: {
      marginBottom: 6,
      background: isDark ? "rgba(0,0,0,0.98)" : "#fff",
      border: isDark ? "1px solid rgba(255,255,255,0.14)" : "1px solid #eee",
      borderRadius: 12,
      padding: 8,
      boxShadow: isDark ? "0 6px 18px rgba(0,0,0,0.65)" : "0 4px 14px rgba(0,0,0,0.10)",
    },
    popoverRow: { display: "flex", gap: 8, alignItems: "center" },
    popoverInput: {
      flex: 1,
      height: 32,
      borderRadius: 10,
      border: isDark ? "1px solid rgba(255,255,255,0.18)" : "1px solid #e5e5e5",
      padding: "0 10px",
      fontSize: 12,
      background: isDark ? "rgba(255,255,255,0.06)" : "#fff",
      color: isDark ? "rgba(255,255,255,0.92)" : "#111",
      outline: "none",
    },
    miniBtn: {
      height: 32,
      padding: "0 10px",
      borderRadius: 10,
      border: isDark ? "1px solid rgba(255,255,255,0.18)" : "1px solid #e5e5e5",
      background: isDark ? "rgba(255,255,255,0.06)" : "#fff",
      color: isDark ? "rgba(255,255,255,0.92)" : "#111",
      cursor: "pointer",
      fontWeight: 800,
      fontSize: 11,
      whiteSpace: "nowrap",
    },
    miniBtnPrimary: {
      height: 32,
      padding: "0 10px",
      borderRadius: 10,
      border: 0,
      background: isDark ? "#fff" : "#111",
      color: isDark ? "#111" : "#fff",
      cursor: "pointer",
      fontWeight: 800,
      fontSize: 11,
      whiteSpace: "nowrap",
    },

    footer: {
      textAlign: "center",
      marginTop: 18,
      paddingTop: 18,
      paddingBottom: 18,
      borderTop: isDark ? "1px solid rgba(255,255,255,0.12)" : "1px solid #eee",
      color: isDark ? "rgba(255,255,255,0.85)" : "#111",
    },

    footerLink: {
      color: isDark ? "rgba(255,255,255,0.92)" : "#111",
      fontWeight: 700,
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

        <button type="button" style={styles.themeToggle} onClick={toggleTheme} aria-label="Toggle theme">
          Toggle
        </button>
      </div>

      <div style={styles.centerTag}>the food intelligence platform</div>

      <div style={styles.searchRow}>
        <input
          style={styles.searchInput}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={handleSearchInputKeyDown}
          placeholder="What do you want to eat? Search food, ingredients, restaurants, or deals"
        />
        <div aria-hidden="true" style={styles.topButtonSpacer} />
      </div>

      <div style={styles.panel}>
        <div style={styles.label}>Cuisine</div>
        <select style={styles.select} value={cuisine} onChange={(e) => setCuisine(e.target.value)}>
          {CUISINES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
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

          <div style={styles.chip(delivery)} onClick={() => setDelivery((v) => !v)} {...chipA11y(() => setDelivery((v) => !v))}>
            Delivery
          </div>

          <div style={styles.chip(dealsOnly)} onClick={() => setDealsOnly((v) => !v)} {...chipA11y(() => setDealsOnly((v) => !v))}>
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

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
          <button type="button" style={styles.clearBtn} onClick={clearAll}>
            Clear
          </button>
          <button type="button" style={styles.searchBtn} onClick={goSearch}>
            Search
          </button>
        </div>
      </div>

      {/* Sticky “Search another area” selector ABOVE footer (kept) */}
      <div style={styles.stickyAreaWrap}>
        <div style={styles.stickyAreaInner}>
          {areaOpen && (
            <div style={styles.popover}>
              <div style={{ fontSize: 11, fontWeight: 800, color: isDark ? "rgba(255,255,255,0.75)" : "#444", marginBottom: 6 }}>
                Search another area
              </div>
              <div style={styles.popoverRow}>
                <input
                  ref={areaInputRef}
                  style={styles.popoverInput}
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      goSearch();
                      closeArea();
                    }
                    if (e.key === "Escape") closeArea();
                  }}
                  placeholder="City or ZIP"
                />
                <button type="button" style={styles.miniBtn} onClick={() => setZip("")}>
                  Clear
                </button>
                <button
                  type="button"
                  style={styles.miniBtnPrimary}
                  onClick={() => {
                    goSearch();
                    closeArea();
                  }}
                >
                  Apply
                </button>
              </div>
            </div>
          )}

          <div
            style={styles.spaceBar(areaOpen)}
            onClick={() => {
              setAreaOpen((v) => !v);
              setTimeout(() => areaInputRef.current?.focus(), 0);
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setAreaOpen((v) => !v);
                setTimeout(() => areaInputRef.current?.focus(), 0);
              }
              if (e.key === "Escape") closeArea();
            }}
          >
            Search another area
            <span style={styles.spaceBarHint}>{zip.trim() ? `(${zip.trim()})` : "City or ZIP"}</span>
          </div>
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