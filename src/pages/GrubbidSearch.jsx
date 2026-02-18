import React, { useMemo } from "react";
import SearchResultCard from "../components/SearchResultCard";

import { useLocation, useNavigate } from "react-router-dom";

export default function GrubbidSearch() {
  const nav = useNavigate();
  const { search } = useLocation();

  const qp = useMemo(() => new URLSearchParams(search), [search]);

  const q = qp.get("q") || "";
  const cuisine = qp.get("cuisine") || "Any";
  const price = (qp.get("price") || "").split("|").filter(Boolean);
  const delivery = qp.get("delivery") === "1";
  const health = (qp.get("health") || "").split("|").filter(Boolean);
  const ingredients = (qp.get("ingredients") || "").split("|").filter(Boolean);
  const zip = qp.get("zip") || "";
    // TEMP: fake results so you can see the result cards now (before backend wiring)
  const results = useMemo(() => {
    const city = zip ? zip : "Los Angeles";
    return [
      {
        id: "r1",
        name: q ? `${q} Special` : "Chicken Sandwich",
        price: 9.99,
        description: "Crispy, juicy, and fast. This is placeholder text until backend results.",
        restaurant: { name: "Example Diner", city, neighborhood: "Westwood" },
        flags: { vegan: false, gluten_free: false, deal_active: true },
        insights: {
          summary: "Matches your query and filters. Deal is active at this restaurant.",
          why_matched: q ? `Matched query: "${q}"` : "Matched default popular item",
          highlights: ["Popular near you", "Great value under $10", "Deal available today"],
        },
        nutrition: { calories: 780, protein_g: 34, carbs_g: 68, fat_g: 38 },
        pairings: { items: [{ name: "Fries", reason: "Classic pairing" }, { name: "Iced Tea", reason: "Balances the salt" }] },
      },
      {
        id: "r2",
        name: q ? `${q} Lite` : "Vegan Pancakes",
        price: 8.5,
        description: "Light and fluffy. Placeholder item demonstrating vegan/gluten tags.",
        restaurant: { name: "Green Spoon", city, neighborhood: "Sawtelle" },
        flags: { vegan: true, gluten_free: true, deal_active: false },
        insights: {
          summary: "Strong health match. Vegan + gluten-free flags detected.",
          why_matched: health.length ? `Health filters: ${health.join(", ")}` : "Health-friendly option",
          highlights: ["Vegan", "Gluten-free", "High review volume (placeholder)"],
        },
        nutrition: { calories: 520, protein_g: 14, carbs_g: 78, fat_g: 16 },
        pairings: { items: [{ name: "Fruit Cup", reason: "Adds freshness" }] },
      },
    ];
  }, [q, zip, health]);


  const styles = {
    page: { maxWidth: 980, margin: "40px auto", padding: "0 20px", fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial" },
    headerRow: { display: "flex", justifyContent: "space-between", alignItems: "baseline" },
    h1: { margin: 0, fontSize: 34 },
    sub: { color: "#666", marginTop: 6 },
    back: { border: "1px solid #e6e6e6", padding: "10px 12px", borderRadius: 10, background: "#fff", cursor: "pointer" },

    card: { marginTop: 18, padding: 16, border: "1px solid #eee", borderRadius: 12, background: "#fff" },
    row: { display: "flex", gap: 14, flexWrap: "wrap", fontSize: 13, color: "#333", lineHeight: 1.6 },
    k: { color: "#666" },
    v: { fontWeight: 600 },

    resultsBox: { marginTop: 16, padding: 16, border: "1px solid #eee", borderRadius: 12, background: "#fafafa", color: "#666" },
  };

  return (
    <div style={styles.page}>
      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.h1}>Search</h1>
          <div style={styles.sub}>Showing results for: <span style={{ fontWeight: 700 }}>{q ? q : "(no search term yet)"}</span></div>
        </div>
        <button style={styles.back} onClick={() => nav("/")}>← Back to Discovery</button>
      </div>

      <div style={styles.card}>
        <div style={{ fontWeight: 700, marginBottom: 10 }}>Your filters</div>
        <div style={styles.row}>
          <div><span style={styles.k}>Cuisine:</span> <span style={styles.v}>{cuisine}</span></div>
          <div><span style={styles.k}>Price:</span> <span style={styles.v}>{price.length ? price.join(", ") : "Any"}</span></div>
          <div><span style={styles.k}>Delivery:</span> <span style={styles.v}>{delivery ? "Yes" : "No"}</span></div>
          <div><span style={styles.k}>Health:</span> <span style={styles.v}>{health.length ? health.join(", ") : "None"}</span></div>
          <div><span style={styles.k}>Ingredients:</span> <span style={styles.v}>{ingredients.length ? ingredients.join(", ") : "None"}</span></div>
          <div><span style={styles.k}>City/ZIP:</span> <span style={styles.v}>{zip || "-"}</span></div>
        </div>
      </div>

            <div style={{ marginTop: 16 }}>
        {!results.length ? (
          <div style={styles.resultsBox}>No results yet.</div>
        ) : (
          results.map((r) => <SearchResultCard key={r.id} result={r} />)
        )}
      </div>

    </div>
  );
}
