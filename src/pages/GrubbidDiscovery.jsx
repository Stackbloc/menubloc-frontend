// menubloc-frontend/src/pages/GrubbidDiscovery.jsx
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
      marginBottom: 16,
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
      width: "min(520px, calc(100vw - 28px))", // wide enough for the wording
    },

    spaceBar: (active) => ({
      height: 30, // smaller, but readable
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

    // ✅ ONLY CHANGE: consistent typography, still clearly a link
    footerLink: {
      color: "#111",
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
      </div>

      <div style={styles.centerTag}>the food intelligence platform</div>

      <div style={styles.searchRow}>
        <input
          style={styles.searchInput}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") goSearch();
          }}
          placeholder="Search dishes, cuisines, ingredients, or restaurant name..."
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
        {/* ✅ FIX: point to the real onboarding route */}
        <Link to="/signup" style={styles.footerLink}>
          Restaurant sign up
        </Link>{" "}
        · get discovered
      </div>
    </div>
  );
}