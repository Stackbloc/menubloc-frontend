/**
 * ============================================================
 * File: menubloc-frontend/src/pages/GrubbidDiscovery.jsx
 * Date: 2026-02-28
 * Purpose:
 *   Discovery search landing page and filter controls.
 *
 * Update (today):
 *   - Adds "Search examples" that TEACH Grubbid’s unique capabilities
 *     (ingredient-aware + intent-aware), not generic food prompts.
 *   - Clicking an example sets query + (optionally) toggles relevant filters,
 *     then runs search immediately.
 *   - Fixes Restaurant sign up link to the actual route: /restaurant/signup
 * ============================================================
 */

import React, { useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function GrubbidDiscovery() {
  const nav = useNavigate();
  const areaInputRef = useRef(null);

  // --- UI option sets
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

  // --- state
  const [q, setQ] = useState("");
  const [cuisine, setCuisine] = useState("Any");
  const [price, setPrice] = useState([]);
  const [distance, setDistance] = useState([]);
  const [delivery, setDelivery] = useState(false);
  const [dealsOnly, setDealsOnly] = useState(false);
  const [health, setHealth] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [zip, setZip] = useState(""); // City/ZIP carried in URL
  const [areaOpen, setAreaOpen] = useState(false);

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

    // Filtering MVP params (backend supports these)
    if (q.trim()) params.set("q", q.trim());

    const veganOn = health.includes("Vegan");
    if (veganOn) params.set("vegan", "1");

    const gfOn = ingredients.includes("Gluten-free");
    if (gfOn) params.set("gluten_free", "1");

    const priceMax = priceBucketsToMax(price);
    if (priceMax != null) params.set("price_max", String(priceMax));

    if (dealsOnly) params.set("deals_only", "1");

    // carry for later
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

  /**
   * Example clicks:
   * - Teach capability
   * - Set query and optionally prime the MVP filters we actually support today
   * - Run search immediately
   */
  function applyExample(ex) {
    // reset only the filter types this example explicitly wants to control
    if (ex.reset === "all") {
      clearAll();
    }

    if (typeof ex.q === "string") setQ(ex.q);

    if (ex.vegan === true) setHealth((prev) => (prev.includes("Vegan") ? prev : [...prev, "Vegan"]));
    if (ex.vegan === false) setHealth((prev) => prev.filter((x) => x !== "Vegan"));

    if (ex.gf === true) setIngredients((prev) => (prev.includes("Gluten-free") ? prev : [...prev, "Gluten-free"]));
    if (ex.gf === false) setIngredients((prev) => prev.filter((x) => x !== "Gluten-free"));

    if (typeof ex.dealsOnly === "boolean") setDealsOnly(ex.dealsOnly);

    if (typeof ex.priceMax === "number") {
      // map to buckets (simple)
      const buckets = [];
      if (ex.priceMax <= 10) buckets.push("<$10");
      else if (ex.priceMax <= 20) buckets.push("<$20");
      else if (ex.priceMax <= 50) buckets.push("<$50");
      setPrice(buckets);
    }

    // Cuisine is "carry for later" today (not supported by backend), but we can still set it.
    if (typeof ex.cuisine === "string") setCuisine(ex.cuisine);

    // Zip/city carry
    if (typeof ex.zip === "string") setZip(ex.zip);

    // run search next tick so state is applied
    setTimeout(() => {
      goSearch();
    }, 0);
  }

  const EXAMPLE_SECTIONS = useMemo(
    () => [
      {
        title: "Search by ingredient",
        subtitle: "Find menu items that contain what you care about.",
        items: [
          { label: "pumpkin", q: "pumpkin", reset: "none" },
          { label: "arugula", q: "arugula", reset: "none" },
          { label: "no dairy desserts", q: "dessert", reset: "none", /* teach */ },
        ],
      },
      {
        title: "Search by diet",
        subtitle: "Diet intent + discovery (works best with filters).",
        items: [
          { label: "vegan tacos", q: "tacos", vegan: true, reset: "none" },
          { label: "gluten-free breakfast", q: "breakfast", gf: true, reset: "none" },
          { label: "keto-friendly lunch", q: "lunch keto", reset: "none" },
        ],
      },
      {
        title: "Search by goals",
        subtitle: "Nutrition intent (query-first now; structured later).",
        items: [
          { label: "high protein under 700 calories", q: "high protein under 700 calories", reset: "none" },
          { label: "low sodium options", q: "low sodium", reset: "none" },
          { label: "diabetic-friendly", q: "diabetic friendly", reset: "none" },
        ],
      },
      {
        title: "Search by value",
        subtitle: "Price + deals (these are supported today).",
        items: [
          { label: "meals under $10", q: "", priceMax: 10, reset: "none" },
          { label: "meals under $20", q: "", priceMax: 20, reset: "none" },
          { label: "restaurants with active deals", q: "", dealsOnly: true, reset: "none" },
        ],
      },
    ],
    []
  );

  const styles = {
    page: {
      maxWidth: 980,
      margin: "40px auto",
      padding: "0 20px",
      fontFamily:
        'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial',
      color: "#111",
    },

    header: { display: "flex", marginBottom: 22 },
    brand: { fontWeight: 800, fontSize: 18 },
    subbrand: { fontSize: 12, color: "#666" },

    centerTag: { textAlign: "center", color: "#666", marginBottom: 18 },

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
      border: "1px solid #e5e5e5",
      padding: "0 16px",
      background: "#fff",
    },
    topButtonSpacer: {
      width: 110,
      height: 44,
      borderRadius: 12,
      background: "transparent",
      border: "1px solid transparent",
      pointerEvents: "none",
    },

    examplesWrap: {
      margin: "0 auto 16px",
      maxWidth: 920,
    },
    examplesHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-end",
      gap: 12,
      marginBottom: 10,
    },
    examplesTitle: { fontSize: 12, fontWeight: 900, color: "#111" },
    examplesHint: { fontSize: 12, color: "#666" },

    examplesGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
      gap: 12,
    },
    exampleCard: {
      background: "#fff",
      border: "1px solid #eee",
      borderRadius: 16,
      padding: 12,
      boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
    },
    exampleCardTitle: { fontSize: 12, fontWeight: 900, marginBottom: 3 },
    exampleCardSub: { fontSize: 12, color: "#666", marginBottom: 10 },
    examplePills: { display: "flex", flexWrap: "wrap", gap: 8 },
    examplePill: {
      padding: "8px 10px",
      borderRadius: 999,
      border: "1px solid #e5e5e5",
      background: "#fff",
      fontSize: 12,
      fontWeight: 800,
      cursor: "pointer",
      userSelect: "none",
    },

    panel: {
      background: "#f7f7fb",
      borderRadius: 16,
      padding: 18,
      marginBottom: 16,
      border: "1px solid #efeff6",
    },

    label: { fontSize: 12, fontWeight: 700, color: "#444", marginBottom: 6 },

    select: {
      width: "100%",
      height: 40,
      borderRadius: 12,
      border: "1px solid #e5e5e5",
      padding: "0 12px",
      marginBottom: 14,
      background: "#fff",
    },

    sectionTitle: {
      textAlign: "center",
      fontSize: 12,
      fontWeight: 800,
      color: "#111",
      margin: "10px 0 10px",
    },

    chipRow: {
      display: "flex",
      flexWrap: "wrap",
      gap: 10,
      justifyContent: "flex-start",
      marginBottom: 14,
    },

    // Centered rows (you requested Convenience + Ingredients centered)
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
      border: active ? "1px solid #111" : "1px solid #e5e5e5",
      cursor: "pointer",
      fontSize: 12,
      fontWeight: 600,
      background: active ? "#fff" : "transparent",
      userSelect: "none",
    }),

    searchBtn: {
      height: 44,
      padding: "0 18px",
      borderRadius: 12,
      border: 0,
      background: "#111",
      color: "#fff",
      fontWeight: 700,
      cursor: "pointer",
    },

    clearBtnBig: {
      height: 44,
      padding: "0 18px",
      borderRadius: 12,
      border: "1px solid #e5e5e5",
      background: "#fff",
      cursor: "pointer",
      fontWeight: 700,
    },

    // --- Sticky “Search another area” control ABOVE footer
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
      border: active ? "1px solid #111" : "1px solid #e5e5e5",
      background: "#fff",
      boxShadow: "0 3px 10px rgba(0,0,0,0.08)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 12,
      fontWeight: 700,
      color: "#222",
      cursor: "pointer",
      userSelect: "none",
    }),
    spaceBarHint: {
      marginLeft: 8,
      color: "#777",
      fontSize: 11,
      fontWeight: 600,
    },

    popover: {
      marginBottom: 6,
      background: "#fff",
      border: "1px solid #eee",
      borderRadius: 12,
      padding: 8,
      boxShadow: "0 4px 14px rgba(0,0,0,0.10)",
    },
    popoverRow: { display: "flex", gap: 8, alignItems: "center" },
    popoverInput: {
      flex: 1,
      height: 32,
      borderRadius: 10,
      border: "1px solid #e5e5e5",
      padding: "0 10px",
      fontSize: 12,
      background: "#fff",
    },
    miniBtn: {
      height: 32,
      padding: "0 10px",
      borderRadius: 10,
      border: "1px solid #e5e5e5",
      background: "#fff",
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
      background: "#111",
      color: "#fff",
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
      borderTop: "1px solid #eee",
    },

    footerLink: {
      color: "#111",
      fontWeight: 700,
      textDecoration: "underline",
      textUnderlineOffset: "3px",
      cursor: "pointer",
    },

    // Responsive tweak
    mediaNote: {
      marginTop: 8,
      fontSize: 11,
      color: "#777",
      textAlign: "center",
    },
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <div style={styles.brand}>Grubbid</div>
          <div style={styles.subbrand}>Discovery</div>
        </div>
      </div>

      <div style={styles.centerTag}>the food intelligence platform</div>

      <div style={styles.searchRow}>
        <input
          style={styles.searchInput}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={handleSearchInputKeyDown}
          placeholder="Search dishes, cuisines, ingredients, or restaurant name..."
        />
        <div aria-hidden="true" style={styles.topButtonSpacer} />
      </div>

      {/* ✅ TEACHING EXAMPLES */}
      <div style={styles.examplesWrap}>
        <div style={styles.examplesHeader}>
          <div style={styles.examplesTitle}>Search examples (what Grubbid is good at)</div>
          <div style={styles.examplesHint}>Click any example to search instantly</div>
        </div>

        <div style={styles.examplesGrid}>
          {EXAMPLE_SECTIONS.map((sec) => (
            <div key={sec.title} style={styles.exampleCard}>
              <div style={styles.exampleCardTitle}>{sec.title}</div>
              <div style={styles.exampleCardSub}>{sec.subtitle}</div>
              <div style={styles.examplePills}>
                {sec.items.map((ex) => (
                  <div
                    key={ex.label}
                    style={styles.examplePill}
                    onClick={() => applyExample(ex)}
                    {...chipA11y(() => applyExample(ex))}
                    aria-label={`Search example: ${ex.label}`}
                  >
                    {ex.label}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={styles.mediaNote}>
          Note: “nutrition goals” are query-first right now; structured nutrition constraints can be wired in later.
        </div>
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
              aria-pressed={price.includes(p)}
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
              aria-pressed={distance.includes(d)}
            >
              {d}
            </div>
          ))}

          <div
            style={styles.chip(delivery)}
            onClick={() => setDelivery((v) => !v)}
            {...chipA11y(() => setDelivery((v) => !v))}
            aria-pressed={delivery}
          >
            Delivery
          </div>

          <div
            style={styles.chip(dealsOnly)}
            onClick={() => setDealsOnly((v) => !v)}
            {...chipA11y(() => setDealsOnly((v) => !v))}
            aria-pressed={dealsOnly}
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
              aria-pressed={health.includes(h)}
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
              aria-pressed={ingredients.includes(i)}
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

      {/* Sticky “Search another area” selector ABOVE footer */}
      <div style={styles.stickyAreaWrap}>
        <div style={styles.stickyAreaInner}>
          {areaOpen && (
            <div style={styles.popover}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#444", marginBottom: 6 }}>
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
            aria-pressed={areaOpen}
          >
            Search another area
            <span style={styles.spaceBarHint}>
              {zip.trim() ? `(${zip.trim()})` : "City or ZIP"}
            </span>
          </div>
        </div>
      </div>

      <div style={styles.footer}>
        {/* ✅ Correct route per App.jsx */}
        <Link to="/restaurant/signup" style={styles.footerLink}>
          Restaurant sign up
        </Link>{" "}
        · get discovered
      </div>
    </div>
  );
}