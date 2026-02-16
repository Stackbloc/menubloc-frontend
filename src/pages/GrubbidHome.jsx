// menubloc-frontend/src/pages/GrubbidHome.jsx
import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function GrubbidHome() {
  const nav = useNavigate();

  // --- UI option sets (sorted)
  const PRICE_BUCKETS = useMemo(() => ["<$10", "<$20", "<$50"], []);

  const HEALTH = useMemo(
    () =>
      [
        "Diabetic-friendly",
        "High protein",
        "Keto",
        "Low carb (keto)",
        "Low sodium",
        "Under 700 cal",
        "Vegan",
        "Vegetarian",
      ]
        .slice()
        .sort((a, b) => a.localeCompare(b)),
    []
  );

  const INGREDIENTS = useMemo(
    () =>
      ["Dairy-free", "Gluten-free", "Peanut-free", "Seed-oil free"]
        .slice()
        .sort((a, b) => a.localeCompare(b)),
    []
  );

  const CUISINES = useMemo(
    () => ["Any", "American", "Chinese", "Indian", "Italian", "Japanese", "Korean"],
    []
  );

  // --- state
  const [q, setQ] = useState("");
  const [cuisine, setCuisine] = useState("Any");
  const [price, setPrice] = useState([]); // multi-select
  const [delivery, setDelivery] = useState(false);
  const [health, setHealth] = useState([]); // multi-select
  const [ingredients, setIngredients] = useState([]); // multi-select
  const [zip, setZip] = useState("");

  function toggleInList(value, list, setList) {
    setList((prev) => (prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value]));
  }

  function clearAll() {
    setQ("");
    setCuisine("Any");
    setPrice([]);
    setDelivery(false);
    setHealth([]);
    setIngredients([]);
    setZip("");
  }

  function goSearch() {
    const params = new URLSearchParams();

    if (q.trim()) params.set("q", q.trim());
    if (cuisine && cuisine !== "Any") params.set("cuisine", cuisine);

    if (price.length) params.set("price", price.join("|"));
    if (delivery) params.set("delivery", "1");

    if (health.length) params.set("health", health.join("|"));
    if (ingredients.length) params.set("ingredients", ingredients.join("|"));

    if (zip.trim()) params.set("zip", zip.trim());

    nav(`/search?${params.toString()}`);
  }

  const styles = {
    page: {
      maxWidth: 980,
      margin: "40px auto",
      padding: "0 20px",
      fontFamily:
        'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji"',
      color: "#111",
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: 16,
      marginBottom: 22,
    },
    brand: { fontWeight: 800, fontSize: 18, lineHeight: 1.1 },
    subbrand: { fontSize: 12, color: "#666", marginTop: 2 },
    centerTag: { textAlign: "center", color: "#666", fontSize: 13, marginBottom: 10 },
    searchRow: {
      display: "flex",
      gap: 12,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 18,
    },
    searchInput: {
      width: "min(640px, 100%)",
      height: 44,
      borderRadius: 999,
      border: "1px solid #e5e5e5",
      padding: "0 16px",
      outline: "none",
      fontSize: 14,
      background: "#fff",
    },
    searchBtn: {
      height: 44,
      padding: "0 18px",
      borderRadius: 12,
      border: "0",
      background: "#111",
      color: "#fff",
      fontWeight: 700,
      cursor: "pointer",
      minWidth: 110,
    },
    panel: {
      background: "#f7f7fb",
      borderRadius: 16,
      padding: 18,
      margin: "0 auto 16px",
      width: "min(760px, 100%)",
      border: "1px solid #efeff6",
    },
    row: { display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" },
    label: { fontSize: 12, color: "#666", marginBottom: 6, fontWeight: 700 },
    select: {
      width: "100%",
      height: 40,
      borderRadius: 12,
      border: "1px solid #e5e5e5",
      padding: "0 12px",
      background: "#fff",
      outline: "none",
      fontSize: 14,
    },
    sectionTitle: { textAlign: "center", fontWeight: 800, fontSize: 12, marginTop: 14 },
    chipRow: { display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", marginTop: 10 },
    chip: (active) => ({
      padding: "8px 12px",
      borderRadius: 999,
      border: active ? "1px solid #111" : "1px solid #e5e5e5",
      background: active ? "#fff" : "#fff",
      cursor: "pointer",
      fontSize: 12,
      fontWeight: 700,
      userSelect: "none",
    }),
    zipBox: {
      width: "min(760px, 100%)",
      margin: "0 auto",
      background: "#fff",
      border: "1px solid #efefef",
      borderRadius: 14,
      padding: 14,
    },
    zipInput: {
      width: "100%",
      height: 40,
      borderRadius: 12,
      border: "1px solid #e5e5e5",
      padding: "0 12px",
      outline: "none",
      fontSize: 14,
    },
    actions: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 16,
      gap: 12,
      flexWrap: "wrap",
    },
    secondaryBtn: {
      height: 40,
      padding: "0 14px",
      borderRadius: 12,
      border: "1px solid #e5e5e5",
      background: "#fff",
      cursor: "pointer",
      fontWeight: 700,
    },
    footerLink: {
      textAlign: "center",
      marginTop: 18,
      fontSize: 13,
      color: "#666",
    },
    footerAnchor: { color: "#6b5cff", textDecoration: "none", fontWeight: 800 },
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <div style={styles.brand}>Grubbid</div>
          <div style={styles.subbrand}>Discovery</div>
        </div>
        <div style={{ fontSize: 12, color: "#999" }} />
      </div>

      <div style={styles.centerTag}>the food intelligence platform</div>

      {/* Main search (keep ALL search intents; just add restaurant name emphasis) */}
      <div style={styles.searchRow}>
        <input
          style={styles.searchInput}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search dishes, cuisines, ingredients, or restaurant name..."
        />
        <button style={styles.searchBtn} onClick={goSearch} type="button">
          Search
        </button>
      </div>

      <div style={styles.panel}>
        <div style={styles.row}>
          <div style={{ flex: 1, minWidth: 280 }}>
            <div style={styles.label}>Cuisine</div>
            <select style={styles.select} value={cuisine} onChange={(e) => setCuisine(e.target.value)}>
              {CUISINES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={styles.sectionTitle}>Convenience</div>
        <div style={styles.chipRow}>
          {/* Price buckets (replaces "Budget friendly") */}
          {PRICE_BUCKETS.map((p) => (
            <div
              key={p}
              style={styles.chip(price.includes(p))}
              onClick={() => toggleInList(p, price, setPrice)}
              role="button"
              tabIndex={0}
            >
              {p}
            </div>
          ))}

          <div style={styles.chip(false)} role="button" tabIndex={0} title="Placeholder for later">
            {"< 3 miles"}
          </div>

          {/* Delivery aligned (same row) */}
          <div
            style={styles.chip(delivery)}
            onClick={() => setDelivery((v) => !v)}
            role="button"
            tabIndex={0}
          >
            Delivery
          </div>
        </div>

        <div style={styles.sectionTitle}>Health</div>
        <div style={styles.chipRow}>
          {HEALTH.map((h) => (
            <div
              key={h}
              style={styles.chip(health.includes(h))}
              onClick={() => toggleInList(h, health, setHealth)}
              role="button"
              tabIndex={0}
            >
              {h}
            </div>
          ))}
        </div>

        <div style={{ ...styles.sectionTitle, display: "flex", gap: 8, justifyContent: "center", alignItems: "center" }}>
          <span style={{ color: "#d33" }}>⊘</span>
          <span>Ingredients</span>
        </div>
        <div style={styles.chipRow}>
          {INGREDIENTS.map((i) => (
            <div
              key={i}
              style={styles.chip(ingredients.includes(i))}
              onClick={() => toggleInList(i, ingredients, setIngredients)}
              role="button"
              tabIndex={0}
            >
              {i}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
          <button style={styles.searchBtn} onClick={goSearch} type="button">
            Search
          </button>
        </div>
      </div>

      <div style={styles.zipBox}>
        <div style={styles.label}>Search another area</div>
        <input
          style={styles.zipInput}
          value={zip}
          onChange={(e) => setZip(e.target.value)}
          placeholder="City or ZIP code"
        />
        <div style={styles.actions}>
          <button style={styles.secondaryBtn} onClick={clearAll} type="button">
            Clear
          </button>
        </div>
      </div>

      <div style={styles.footerLink}>
        <Link to="/restaurant" style={styles.footerAnchor}>
          Restaurant sign up
        </Link>{" "}
        <span>· get discovered</span>
      </div>
    </div>
  );
}