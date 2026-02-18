import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function GrubbidHome() {
  const nav = useNavigate();

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
      ].sort((a, b) => a.localeCompare(b)),
    []
  );

  const INGREDIENTS = useMemo(
    () =>
      ["Dairy-free", "Gluten-free", "Peanut-free", "Seed-oil free"].sort(
        (a, b) => a.localeCompare(b)
      ),
    []
  );

  const CUISINES = useMemo(
    () => ["Any", "American", "Chinese", "Indian", "Italian", "Japanese", "Korean"],
    []
  );

  const [q, setQ] = useState("");
  const [cuisine, setCuisine] = useState("Any");
  const [price, setPrice] = useState([]);
  const [delivery, setDelivery] = useState(false);
  const [health, setHealth] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [zip, setZip] = useState("");

  function toggleInList(value, list, setList) {
    setList((prev) =>
      prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value]
    );
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
    if (cuisine !== "Any") params.set("cuisine", cuisine);
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
        'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial',
      color: "#111",
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      marginBottom: 22,
    },
    brand: { fontWeight: 800, fontSize: 18 },
    subbrand: { fontSize: 12, color: "#666" },
    centerTag: { textAlign: "center", color: "#666", marginBottom: 18 },
    searchInput: {
      width: "100%",
      height: 44,
      borderRadius: 999,
      border: "1px solid #e5e5e5",
      padding: "0 16px",
      marginBottom: 16,
    },
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
    panel: {
      background: "#f7f7fb",
      borderRadius: 16,
      padding: 18,
      marginBottom: 16,
      border: "1px solid #efeff6",
    },
    select: {
      width: "100%",
      height: 40,
      borderRadius: 12,
      border: "1px solid #e5e5e5",
      padding: "0 12px",
      marginBottom: 14,
    },
    chipRow: {
      display: "flex",
      flexWrap: "wrap",
      gap: 10,
      marginBottom: 14,
    },
    chip: (active) => ({
      padding: "8px 12px",
      borderRadius: 999,
      border: active ? "1px solid #111" : "1px solid #e5e5e5",
      cursor: "pointer",
      fontSize: 12,
      fontWeight: 600,
    }),
    footer: {
      textAlign: "center",
      marginTop: 30,
      paddingTop: 20,
      borderTop: "1px solid #eee",
    },
    footerLink: {
      color: "#6b5cff",
      fontWeight: 800,
      textDecoration: "none",
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

      <input
        style={styles.searchInput}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search dishes, cuisines, ingredients, or restaurant name..."
      />

      <div style={styles.panel}>
        <select
          style={styles.select}
          value={cuisine}
          onChange={(e) => setCuisine(e.target.value)}
        >
          {CUISINES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>

        <div style={styles.chipRow}>
          {PRICE_BUCKETS.map((p) => (
            <div
              key={p}
              style={styles.chip(price.includes(p))}
              onClick={() => toggleInList(p, price, setPrice)}
            >
              {p}
            </div>
          ))}

          <div
            style={styles.chip(delivery)}
            onClick={() => setDelivery((v) => !v)}
          >
            Delivery
          </div>
        </div>

        <div style={styles.chipRow}>
          {HEALTH.map((h) => (
            <div
              key={h}
              style={styles.chip(health.includes(h))}
              onClick={() => toggleInList(h, health, setHealth)}
            >
              {h}
            </div>
          ))}
        </div>

        <div style={styles.chipRow}>
          {INGREDIENTS.map((i) => (
            <div
              key={i}
              style={styles.chip(ingredients.includes(i))}
              onClick={() => toggleInList(i, ingredients, setIngredients)}
            >
              {i}
            </div>
          ))}
        </div>

        <div style={{ textAlign: "right" }}>
          <button style={styles.searchBtn} onClick={goSearch}>
            Search
          </button>
        </div>
      </div>

      <div>
        <input
          style={styles.searchInput}
          value={zip}
          onChange={(e) => setZip(e.target.value)}
          placeholder="City or ZIP code"
        />
        <button onClick={clearAll}>Clear</button>
      </div>

      {/* NEW CLEAN FOOTER */}
      <div style={styles.footer}>
        <Link to="/restaurant" style={styles.footerLink}>
          Restaurant sign up
        </Link>{" "}
        · get discovered
      </div>
    </div>
  );
}
