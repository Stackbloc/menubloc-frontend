/**
 * ============================================================
 * File: Top5HealthiestPage.jsx
 * Path: menubloc-frontend/src/pages/Top5HealthiestPage.jsx
 * Date: 2026-03-16
 * Purpose:
 *   Editorial page: "Top 5 Healthiest Dishes in [City, ST]"
 *   Currently uses placeholder data. When real intelligence data
 *   is available this page should fetch scored menu items from
 *   the backend filtered by city/state and ranked by nutrition score.
 * ============================================================
 */

import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { PageNav } from "../components/NavButton.jsx";

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth <= breakpoint;
  });

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    function handleResize() {
      setIsMobile(window.innerWidth <= breakpoint);
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [breakpoint]);

  return isMobile;
}

// ── Placeholder data ─────────────────────────────────────────
// Replace with a real API fetch when nutrition scoring is live.
const PLACEHOLDER_DISHES = [
  {
    rank: 1,
    name: "Garden Harvest Salad",
    restaurant: "Fresh Market Café",
    description:
      "Mixed baby greens, cherry tomatoes, shaved cucumber, roasted carrot, sliced avocado, and pepitas, tossed in a bright lemon-herb vinaigrette. Simple, clean, and nutrient-dense.",
    calories: 320,
    badges: ["Low Calorie", "High Fiber", "Vegan"],
    accent: "#2d6a4f",
  },
  {
    rank: 2,
    name: "Grilled Salmon Power Bowl",
    restaurant: "Harbor Grille",
    description:
      "Atlantic salmon fillet over brown rice with roasted broccoli, shelled edamame, shredded purple cabbage, and a citrus-ginger drizzle. High protein, omega-rich, and deeply satisfying.",
    calories: 490,
    badges: ["High Protein", "Omega-3 Rich", "Gluten-Free"],
    accent: "#1d4e89",
  },
  {
    rank: 3,
    name: "Mediterranean Quinoa Bowl",
    restaurant: "The Olive Branch",
    description:
      "Fluffy quinoa tossed with roasted chickpeas, diced cucumber, kalamata olives, roasted red pepper, and crumbled feta, finished with a lemon-herb tahini dressing.",
    calories: 410,
    badges: ["High Fiber", "Plant-Based", "Low Sugar"],
    accent: "#7b2d8b",
  },
  {
    rank: 4,
    name: "Asian Chicken Lettuce Wraps",
    restaurant: "Golden Bowl Kitchen",
    description:
      "Grilled chicken, water chestnuts, green onion, and shredded carrot served in crisp butter lettuce cups with a light ginger-soy glaze on the side. Low carb, lean, and fresh.",
    calories: 280,
    badges: ["Low Carb", "High Protein", "Low Calorie"],
    accent: "#b5451b",
  },
  {
    rank: 5,
    name: "Roasted Veggie & Lentil Bowl",
    restaurant: "Harvest Table",
    description:
      "French lentils, roasted sweet potato cubes, wilted kale, toasted pumpkin seeds, and a warm lemon-turmeric vinaigrette. A complete plant-based meal packed with iron and fiber.",
    calories: 375,
    badges: ["High Fiber", "Iron-Rich", "Vegan"],
    accent: "#5c4813",
  },
];

// ── Badge chip ────────────────────────────────────────────────

function Badge({ label }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "4px 10px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: 0.3,
        background: "rgba(18,34,28,0.07)",
        color: "#344054",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

// ── Dish card ─────────────────────────────────────────────────

function DishCard({ dish, isMobile }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        gap: isMobile ? 16 : 28,
        padding: isMobile ? "20px 18px" : "28px 32px",
        background: "#fff",
        borderRadius: 24,
        border: "1px solid rgba(18,34,28,0.08)",
        boxShadow: "0 8px 28px rgba(15,23,42,0.06)",
        alignItems: "flex-start",
      }}
    >
      {/* Rank number */}
      <div
        style={{
          flexShrink: 0,
          width: isMobile ? 40 : 56,
          height: isMobile ? 40 : 56,
          borderRadius: "50%",
          background: dish.accent,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          fontSize: isMobile ? 18 : 22,
          fontWeight: 900,
          lineHeight: 1,
        }}
      >
        {dish.rank}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: isMobile ? 18 : 21,
            fontWeight: 900,
            color: "#11211a",
            lineHeight: 1.2,
            marginBottom: 3,
          }}
        >
          {dish.name}
        </div>

        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "#667085",
            marginBottom: 10,
          }}
        >
          {dish.restaurant}
        </div>

        <div
          style={{
            fontSize: isMobile ? 13 : 14,
            color: "#475467",
            lineHeight: 1.6,
            marginBottom: 14,
          }}
        >
          {dish.description}
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            alignItems: "center",
          }}
        >
          {dish.badges.map((b) => (
            <Badge key={b} label={b} />
          ))}
          <span
            style={{
              marginLeft: 6,
              fontSize: 12,
              fontWeight: 800,
              color: "#667085",
            }}
          >
            ~{dish.calories} cal
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────

export default function Top5HealthiestPage() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { search } = useLocation();
  const urlParams = new URLSearchParams(search);
  const city  = urlParams.get("city")  || "";
  const state = urlParams.get("state") || "";

  const locationLabel = [city, state].filter(Boolean).join(", ");

  // Build link back to search for healthy dishes in this city
  const searchParams = new URLSearchParams();
  searchParams.set("q", "healthy");
  if (city)  searchParams.set("city",  city);
  if (state) searchParams.set("state", state);

  return (
    <div style={{ minHeight: "100vh", background: "#f7f6f1", color: "#101828" }}>
      <div
        style={{
          maxWidth: 820,
          margin: "0 auto",
          padding: isMobile ? "20px 14px 48px" : "36px 24px 72px",
          boxSizing: "border-box",
        }}
      >
        {/* Nav */}
        <div style={{ marginBottom: isMobile ? 24 : 32 }}>
          <PageNav />
          <div style={{ fontSize: isMobile ? 16 : 18, fontWeight: 800, color: "#11211a" }}>
            Grubbid
          </div>
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
              letterSpacing: -0.5,
              lineHeight: 1.1,
              color: "#11211a",
            }}
          >
            Top 5 Healthiest Dishes
          </h1>

          {locationLabel ? (
            <div
              style={{
                fontSize: isMobile ? 17 : 21,
                fontWeight: 700,
                color: "#2d6a4f",
                marginTop: 6,
              }}
            >
              in {locationLabel}
            </div>
          ) : null}

          <p
            style={{
              margin: "14px 0 0",
              fontSize: isMobile ? 14 : 15,
              color: "#475467",
              lineHeight: 1.6,
              maxWidth: 560,
            }}
          >
            These dishes were selected based on calorie density, protein content, fiber, and
            low added sugar — across restaurants{locationLabel ? ` in ${locationLabel}` : " near you"}.
            Placeholder data shown — live rankings coming soon.
          </p>
        </div>

        {/* Dish list */}
        <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 14 : 18 }}>
          {PLACEHOLDER_DISHES.map((dish) => (
            <DishCard key={dish.rank} dish={dish} isMobile={isMobile} />
          ))}
        </div>

        {/* Footer CTA */}
        <div
          style={{
            marginTop: isMobile ? 40 : 56,
            paddingTop: isMobile ? 24 : 32,
            borderTop: "1px solid #e4e7ec",
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            alignItems: isMobile ? "flex-start" : "center",
            justifyContent: "space-between",
            gap: 14,
          }}
        >
          <div>
            <button
              type="button"
              onClick={() => navigate(`/search?${searchParams.toString()}`)}
              style={{
                height: 44,
                padding: "0 20px",
                borderRadius: 12,
                border: "1px solid #101828",
                background: "#101828",
                color: "#fff",
                fontSize: 14,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              Search healthy dishes near you
            </button>
          </div>

          <div style={{ display: "flex", gap: 20, fontSize: 13, color: "#667085" }}>
            <Link to="/terms"   style={{ color: "#667085", textDecoration: "none", fontWeight: 600 }}>Terms of Use</Link>
            <Link to="/contact" style={{ color: "#667085", textDecoration: "none", fontWeight: 600 }}>Contact Us</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
