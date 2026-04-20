/**
 * ============================================================
 * File: TopPicksPage.jsx
 * Path: menubloc-frontend/src/pages/TopPicksPage.jsx
 * Purpose:
 *   Canonical public reference page for Grubbid discovery styling.
 *   This page must consume the shared Grubbid design system rather
 *   than define its own typography or surface styling.
 * ============================================================
 */

import { Link, useLocation } from "react-router-dom";
import StickyPageHeader from "../components/StickyPageHeader.jsx";
import BottomNav from "../components/BottomNav.jsx";
import { Card } from "../components/grubbid/GrubbidPrimitives.jsx";

const CATEGORIES = [
  {
    emoji: "🥗",
    title: "Smart Health Picks",
    description: "Ranked by protein, fiber, glycemic impact, and sodium.",
    query: "healthy",
  },
  {
    emoji: "🔥",
    title: "Low Calorie Favorites",
    description: "Satisfying options that keep calories in check.",
    query: "low calorie",
  },
  {
    emoji: "💪",
    title: "High Protein Picks",
    description: "Top dishes for muscle recovery and lasting fullness.",
    query: "high protein",
  },
  {
    emoji: "💸",
    title: "Best Bang for the Buck",
    description: "Great food at prices that won't break the budget.",
    query: "best value",
  },
  {
    emoji: "🌱",
    title: "Top Vegan Options",
    description: "Plant-based dishes worth ordering again and again.",
    query: "vegan",
  },
  {
    emoji: "🍔",
    title: "Most Popular Near You",
    description: "The dishes everyone is talking about right now.",
    query: "popular",
  },
  {
    emoji: "⚡",
    title: "Best Quick Meals",
    description: "Fast prep and takeout-friendly picks for busy days.",
    query: "quick meal",
  },
  {
    emoji: "🧂",
    title: "Low Sodium Choices",
    description: "Heart-friendly dishes with minimal added salt.",
    query: "low sodium",
  },
  {
    emoji: "🍬",
    title: "Low Sugar Options",
    description: "Tasty picks that keep your sugar intake in check.",
    query: "low sugar",
  },
];

export default function TopPicksPage() {
  const { search } = useLocation();
  const urlParams = new URLSearchParams(search);
  const city = urlParams.get("city") || "";
  const state = urlParams.get("state") || "";
  const locationLabel =
    urlParams.get("location_label") ||
    [city, state].filter(Boolean).join(", ");

  function searchHref(query) {
    const params = new URLSearchParams(search);
    params.set("q", query);
    return `/search?${params.toString()}`;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f7f6f1", color: "#101828" }}>
      <StickyPageHeader title={`Top Picks${locationLabel ? ` in ${locationLabel}` : ""}`} />
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "14px 14px 80px" }}>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 14,
        }}
      >
        {CATEGORIES.map((category) => (
          <Link
            key={category.query}
            to={searchHref(category.query)}
            style={{ color: "inherit", textDecoration: "none" }}
          >
            <Card interactive style={{ height: "100%" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 14, minHeight: "100%" }}>
                <span style={{ fontSize: 30, lineHeight: 1, flexShrink: 0 }}>{category.emoji}</span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      marginBottom: 4,
                      color: "var(--gb-color-ink-strong)",
                      fontSize: "15px",
                      fontWeight: 800,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {category.title}
                  </div>
                  <div
                    style={{
                      color: "var(--gb-color-ink-muted)",
                      fontSize: "13px",
                      lineHeight: 1.45,
                    }}
                  >
                    {category.description}
                  </div>
                </div>
                <span
                  aria-hidden="true"
                  style={{
                    alignSelf: "center",
                    color: "var(--gb-color-ink-muted)",
                    fontSize: 16,
                    flexShrink: 0,
                  }}
                >
                  →
                </span>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <div
        style={{
          marginTop: 48,
          paddingTop: 24,
          borderTop: "1px solid var(--gb-color-border)",
          display: "flex",
          gap: 20,
          flexWrap: "wrap",
          color: "var(--gb-color-ink-muted)",
          fontSize: "13px",
          fontWeight: 600,
        }}
      >
        <Link to="/terms" className="gb-linkish">Terms of Use</Link>
        <Link to="/contact" className="gb-linkish">Contact Us</Link>
      </div>
      </div>
      <BottomNav />
    </div>
  );
}
