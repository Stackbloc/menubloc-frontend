/**
 * ============================================================
 * File: TopPicksPage.jsx
 * Path: menubloc-frontend/src/pages/TopPicksPage.jsx
 * Purpose:
 *   Canonical public reference page for Menuply discovery styling.
 *   This page must consume the shared Menuply design system rather
 *   than define its own typography or surface styling.
 * ============================================================
 */

import { Link, useLocation } from "react-router-dom";
import StickyPageHeader from "../components/StickyPageHeader.jsx";
import BottomNav from "../components/BottomNav.jsx";
import { Card } from "../components/grubbid/GrubbidPrimitives.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";

const CATEGORIES = [
  { emoji: "🥗", titleKey: "topPicks.smartHealth", descKey: "topPicks.smartHealthDesc", query: "healthy" },
  { emoji: "🔥", titleKey: "topPicks.lowCalorie", descKey: "topPicks.lowCalorieDesc", query: "low calorie" },
  { emoji: "💪", titleKey: "topPicks.highProtein", descKey: "topPicks.highProteinDesc", query: "high protein" },
  { emoji: "💸", titleKey: "topPicks.bestValue", descKey: "topPicks.bestValueDesc", query: "best value" },
  { emoji: "🌱", titleKey: "topPicks.vegan", descKey: "topPicks.veganDesc", query: "vegan" },
  { emoji: "🍔", titleKey: "topPicks.popular", descKey: "topPicks.popularDesc", query: "popular" },
  { emoji: "⚡", titleKey: "topPicks.quick", descKey: "topPicks.quickDesc", query: "quick meal" },
  { emoji: "🧂", titleKey: "topPicks.lowSodium", descKey: "topPicks.lowSodiumDesc", query: "low sodium" },
  { emoji: "🍬", titleKey: "topPicks.lowSugar", descKey: "topPicks.lowSugarDesc", query: "low sugar" },
];

export default function TopPicksPage() {
  const { t } = useLanguage();
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
    <div style={{ minHeight: "100vh", background: "var(--gb-color-page)", color: "var(--gb-color-ink)" }}>
      <StickyPageHeader
        title={`${t("topPicks.title", "Top picks")}${locationLabel ? ` · ${locationLabel}` : ""}`}
      />
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
                    {t(category.titleKey, category.titleKey)}
                  </div>
                  <div
                    style={{
                      color: "var(--gb-color-ink-muted)",
                      fontSize: "13px",
                      lineHeight: 1.45,
                    }}
                  >
                    {t(category.descKey, category.descKey)}
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
