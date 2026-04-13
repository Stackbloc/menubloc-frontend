/**
 * ============================================================
 * File: Top5HealthiestPage.jsx
 * Path: menubloc-frontend/src/pages/Top5HealthiestPage.jsx
 * Purpose:
 *   "Top Health Score Dishes in [City, ST]"
 *   Fetches live data from GET /health/top?city=
 * ============================================================
 */

import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { PageNav } from "../components/NavButton.jsx";
import Breadcrumbs from "../components/ui/Breadcrumbs.jsx";

const API = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001").replace(/\/$/, "");

const ACCENT_COLORS = ["#2d6a4f", "#1d4e89", "#7b2d8b", "#b5451b", "#5c4813"];

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

function DishCard({ dish, rank, isMobile }) {
  const accent = ACCENT_COLORS[(rank - 1) % ACCENT_COLORS.length];

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
          background: accent,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          fontSize: isMobile ? 18 : 22,
          fontWeight: 900,
          lineHeight: 1,
        }}
      >
        {rank}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <Link
          to={`/menu-items/${dish.id}`}
          style={{
            fontSize: isMobile ? 18 : 21,
            fontWeight: 900,
            color: "#11211a",
            lineHeight: 1.2,
            marginBottom: 3,
            display: "block",
            textDecoration: "none",
          }}
        >
          {dish.name}
        </Link>

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
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            alignItems: "center",
          }}
        >
          {(dish.reasons || []).map((r) => (
            <Badge key={r} label={r} />
          ))}
          <span
            style={{
              marginLeft: 4,
              fontSize: 12,
              fontWeight: 800,
              color: "#667085",
            }}
          >
            Score: {dish.health_score}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function Top5HealthiestPage() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { search } = useLocation();
  const urlParams = new URLSearchParams(search);
  const city  = urlParams.get("city")  || "";
  const state = urlParams.get("state") || "";

  const locationLabel = [city, state].filter(Boolean).join(", ");

  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!city) return;
    let alive = true;
    setLoading(true);
    setError("");

    fetch(`${API}/health/top?city=${encodeURIComponent(city)}`)
      .then((r) => r.json())
      .then((json) => {
        if (!alive) return;
        if (json?.ok && Array.isArray(json.dishes)) {
          setDishes(json.dishes);
        } else {
          setError("Could not load results.");
        }
      })
      .catch(() => {
        if (alive) setError("Could not load results.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => { alive = false; };
  }, [city]);

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
        <PageNav />
        <Breadcrumbs
          items={[
            { label: "Discovery", to: "/" },
            { label: "Top Health Score Dishes" },
          ]}
        />

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
            Top Health Score Dishes
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
            Ranked by protein content, fiber, glycemic impact, sodium, and preparation quality
            across restaurants{locationLabel ? ` in ${locationLabel}` : " near you"}.
          </p>
        </div>

        {/* States */}
        {loading && (
          <div style={{ color: "#667085", fontWeight: 600, fontSize: 14 }}>Loading…</div>
        )}
        {error && (
          <div style={{ color: "#b91c1c", fontWeight: 600, fontSize: 14 }}>{error}</div>
        )}
        {!loading && !error && dishes.length === 0 && city && (
          <div style={{ color: "#667085", fontWeight: 600, fontSize: 14 }}>
            No scored dishes found in {locationLabel || city} yet.
          </div>
        )}
        {!city && (
          <div style={{ color: "#667085", fontWeight: 600, fontSize: 14 }}>
            No city specified. Try navigating here from the discovery page.
          </div>
        )}

        {/* Dish list */}
        {dishes.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 14 : 18 }}>
            {dishes.map((dish, i) => (
              <DishCard key={dish.id} dish={dish} rank={i + 1} isMobile={isMobile} />
            ))}
          </div>
        )}

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

          <div style={{ display: "flex", gap: 20, fontSize: 13, color: "#667085" }}>
            <Link to="/terms"   style={{ color: "#667085", textDecoration: "none", fontWeight: 600 }}>Terms of Use</Link>
            <Link to="/contact" style={{ color: "#667085", textDecoration: "none", fontWeight: 600 }}>Contact Us</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
