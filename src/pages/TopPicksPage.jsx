/**
 * ============================================================
 * File: TopPicksPage.jsx
 * Path: menubloc-frontend/src/pages/TopPicksPage.jsx
 * Purpose:
 *   "Top Picks in [City]" — curated search category hub.
 *   Each category card links to a predefined search query.
 * ============================================================
 */

import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth <= breakpoint;
  });
  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    function handleResize() { setIsMobile(window.innerWidth <= breakpoint); }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [breakpoint]);
  return isMobile;
}

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
  const isMobile = useIsMobile();
  const navigate  = useNavigate();
  const { search } = useLocation();
  const urlParams = new URLSearchParams(search);
  const city  = urlParams.get("city")  || "";
  const state = urlParams.get("state") || "";
  const locationLabel = [city, state].filter(Boolean).join(", ");

  function searchHref(query) {
    const p = new URLSearchParams({ q: query });
    if (city)  p.set("city",  city);
    if (state) p.set("state", state);
    return `/search?${p.toString()}`;
  }

  const topRowStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: isMobile ? 24 : 32,
  };

  return (
    <div style={{ minHeight: "100vh" }}>
      <div
        style={{
          maxWidth: 820,
          margin: "0 auto",
          padding: isMobile ? "20px 14px 56px" : "36px 24px 80px",
          boxSizing: "border-box",
          fontFamily: "var(--font-ui, Inter, system-ui, sans-serif)",
          color: "#101828",
        }}
      >
        {/* Nav */}
        <div style={topRowStyle}>
          <Link
            to="/"
            style={{
              fontSize: isMobile ? 17 : 19,
              fontWeight: 900,
              color: "#11211a",
              textDecoration: "none",
              letterSpacing: "-0.02em",
            }}
          >
            Grubbid
          </Link>
          <button
            onClick={() => navigate(-1)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              fontSize: 13,
              fontWeight: 600,
              color: "#475467",
              background: "rgba(0,0,0,0.04)",
              border: "1px solid rgba(0,0,0,0.09)",
              borderRadius: 999,
              padding: "5px 12px",
              cursor: "pointer",
            }}
          >
            ← Back
          </button>
        </div>

        {/* Hero */}
        <div style={{ marginBottom: isMobile ? 28 : 40 }}>
          <div
            style={{
              fontSize: isMobile ? 11 : 12,
              fontWeight: 800,
              letterSpacing: 1.4,
              textTransform: "uppercase",
              color: "#667085",
              marginBottom: 8,
            }}
          >
            Curated by Grubbid Intelligence
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: isMobile ? 26 : 34,
              fontWeight: 900,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              color: "#11211a",
            }}
          >
            Top Picks
            {locationLabel ? (
              <span style={{ color: "#2d6a4f" }}> in {locationLabel}</span>
            ) : null}
          </h1>
          <p
            style={{
              margin: "12px 0 0",
              fontSize: isMobile ? 14 : 15,
              color: "#475467",
              lineHeight: 1.6,
              maxWidth: 520,
            }}
          >
            Browse curated categories — each one powered by Grubbid's food
            intelligence engine.
          </p>
        </div>

        {/* Category grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
            gap: isMobile ? 10 : 14,
          }}
        >
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.query}
              to={searchHref(cat.query)}
              style={{ textDecoration: "none" }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 14,
                  padding: isMobile ? "14px 16px" : "18px 20px",
                  background: "#fff",
                  border: "1px solid var(--border, #e4e9f0)",
                  borderRadius: 16,
                  boxShadow: "var(--shadow-1, 0 6px 18px rgba(16,24,40,0.06))",
                  cursor: "pointer",
                  transition: "box-shadow 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 8px 28px rgba(16,24,40,0.11)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "var(--shadow-1, 0 6px 18px rgba(16,24,40,0.06))";
                }}
              >
                <span style={{ fontSize: isMobile ? 28 : 32, lineHeight: 1, flexShrink: 0 }}>
                  {cat.emoji}
                </span>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: isMobile ? 14 : 15,
                      fontWeight: 800,
                      color: "#11211a",
                      letterSpacing: "-0.01em",
                      marginBottom: 3,
                    }}
                  >
                    {cat.title}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: "#667085",
                      lineHeight: 1.4,
                    }}
                  >
                    {cat.description}
                  </div>
                </div>
                <span
                  style={{
                    marginLeft: "auto",
                    flexShrink: 0,
                    fontSize: 16,
                    color: "#b0bac8",
                    alignSelf: "center",
                  }}
                >
                  →
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: isMobile ? 40 : 56,
            paddingTop: isMobile ? 20 : 28,
            borderTop: "1px solid #e4e7ec",
            display: "flex",
            gap: 20,
            fontSize: 13,
            color: "#667085",
          }}
        >
          <Link to="/terms"   style={{ color: "#667085", textDecoration: "none", fontWeight: 600 }}>Terms of Use</Link>
          <Link to="/contact" style={{ color: "#667085", textDecoration: "none", fontWeight: 600 }}>Contact Us</Link>
        </div>
      </div>
    </div>
  );
}
