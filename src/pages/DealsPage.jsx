// ============================================================
// File: src/pages/DealsPage.jsx
// Purpose: Display active restaurant deals with cuisine filter sidebar
// ============================================================

import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { PageNav } from "../components/NavButton.jsx";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:3001").replace(/\/$/, "");

const CUISINE_OPTIONS = [
  "American",
  "Chinese",
  "Indian",
  "Italian",
  "Japanese",
  "Korean",
  "Mexican",
  "Thai",
  "Vietnamese",
];

function useIsMobile(breakpoint = 900) {
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

function FilterChip({ label, isMobile, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        height: 40,
        width: isMobile ? "100%" : "auto",
        padding: "0 16px",
        borderRadius: 999,
        border: active ? "1px solid #11211a" : "1px solid rgba(18,34,28,0.12)",
        background: active ? "#11211a" : "#fff",
        color: active ? "#f7f6f1" : "#667085",
        fontSize: 13,
        fontWeight: 800,
        cursor: "pointer",
        textAlign: "left",
        boxSizing: "border-box",
      }}
    >
      {label}
    </button>
  );
}

function FilterSelect({ label, options, value, onChange }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <span
        style={{
          fontSize: 11,
          fontWeight: 900,
          letterSpacing: 0.9,
          textTransform: "uppercase",
          color: "#667085",
        }}
      >
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          height: 44,
          width: "100%",
          borderRadius: 14,
          border: "1px solid rgba(18,34,28,0.10)",
          background: "#fff",
          padding: "0 14px",
          color: "#667085",
          fontSize: 14,
          fontWeight: 700,
          outline: "none",
          cursor: "pointer",
          boxSizing: "border-box",
        }}
      >
        <option value="">All</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function DealsPage() {
  const isMobile = useIsMobile();
  const { search } = useLocation();
  const urlParams = new URLSearchParams(search);
  const urlCity = urlParams.get("city") || "";
  const urlState = urlParams.get("state") || "";

  const locationLabel = [urlCity, urlState].filter(Boolean).join(", ");

  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cuisine, setCuisine] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function fetchDeals() {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (urlCity) params.set("city", urlCity);
        if (urlState) params.set("state", urlState);
        if (cuisine) params.set("cuisine", cuisine);

        const res = await fetch(`${API_BASE}/deals?${params.toString()}`);
        const data = await res.json().catch(() => ({}));

        if (cancelled) return;

        if (!data.ok && data.error) {
          throw new Error(data.error);
        }

        setDeals(data.deals || []);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchDeals();
    return () => { cancelled = true; };
  }, [urlCity, urlState, cuisine]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f7f6f1",
        color: "#11211a",
        overflowX: "hidden",
      }}
    >
      <div
        style={{
          maxWidth: 1450,
          margin: "0 auto",
          width: "100%",
          boxSizing: "border-box",
          padding: isMobile ? "16px 12px 32px" : "28px 20px 56px",
        }}
      >
        <div style={{ marginBottom: isMobile ? 18 : 26 }}>
          <PageNav />

          <div style={{ fontSize: isMobile ? 16 : 18, fontWeight: 800, color: "#11211a" }}>
            Grubbid
          </div>

          <h1
            style={{
              margin: "6px 0 4px",
              fontSize: isMobile ? 18 : 20,
              lineHeight: 1.2,
              fontWeight: 800,
              letterSpacing: -0.2,
            }}
          >
            {locationLabel ? `Restaurant Deals Near ${locationLabel}` : "Restaurant Deals"}
          </h1>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            flexWrap: "nowrap",
            alignItems: "flex-start",
            gap: isMobile ? 16 : 24,
          }}
        >
          {/* Sidebar */}
          <aside
            style={{
              flex: isMobile ? "1 1 auto" : "0 0 260px",
              width: isMobile ? "100%" : 260,
              position: isMobile ? "static" : "sticky",
              top: isMobile ? "auto" : 18,
              alignSelf: "flex-start",
              minWidth: 0,
            }}
          >
            <div
              style={{
                borderRadius: 24,
                padding: isMobile ? 14 : 18,
                background: "#fff",
                border: "1px solid rgba(18,34,28,0.08)",
                boxShadow: "0 8px 28px rgba(15,23,42,0.06)",
                boxSizing: "border-box",
              }}
            >
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 900,
                  color: "#11211a",
                  marginBottom: 14,
                }}
              >
                Filter By
              </div>

              <div style={{ display: "grid", gap: 14 }}>
                <FilterSelect
                  label="Cuisine"
                  options={CUISINE_OPTIONS}
                  value={cuisine}
                  onChange={setCuisine}
                />
              </div>
            </div>
          </aside>

          {/* Main content */}
          <main style={{ flex: "1 1 auto", minWidth: 0, width: "100%" }}>
            <div
              style={{
                borderRadius: 24,
                padding: isMobile ? "14px 14px 18px" : "18px 18px 22px",
                background: "#fff",
                border: "1px solid rgba(18,34,28,0.08)",
                boxShadow: "0 8px 28px rgba(15,23,42,0.06)",
                boxSizing: "border-box",
              }}
            >
              {loading ? (
                <div style={{ display: "grid", gap: 12 }}>
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      style={{ height: 96, borderRadius: 16, background: "rgba(0,0,0,0.06)" }}
                    />
                  ))}
                </div>
              ) : error ? (
                <div
                  style={{
                    padding: isMobile ? "28px 16px" : "44px 24px",
                    borderRadius: 24,
                    background: "#f7f6f1",
                    textAlign: "center",
                    color: "#667085",
                  }}
                >
                  <div style={{ fontSize: isMobile ? 20 : 24, fontWeight: 900, color: "#11211a", marginBottom: 10 }}>
                    Could not load deals
                  </div>
                  <div style={{ fontSize: 14 }}>{error}</div>
                </div>
              ) : deals.length === 0 ? (
                <div
                  style={{
                    padding: isMobile ? "28px 16px" : "44px 24px",
                    borderRadius: 24,
                    background: "#f7f6f1",
                    textAlign: "center",
                    color: "#667085",
                  }}
                >
                  <div style={{ fontSize: isMobile ? 20 : 24, fontWeight: 900, color: "#11211a", marginBottom: 10 }}>
                    {locationLabel
                      ? `Currently, there are not any deals near ${locationLabel}.`
                      : "Currently, there are not any deals in this area."}
                  </div>
                  <div style={{ fontSize: isMobile ? 14 : 15, maxWidth: 520, margin: "0 auto", lineHeight: 1.45 }}>
                    Check back soon. We are still growing.
                  </div>
                </div>
              ) : (
                <>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: "#667085",
                      marginBottom: 14,
                      padding: "0 4px",
                    }}
                  >
                    {deals.length} {deals.length === 1 ? "deal" : "deals"}
                  </div>

                  <div style={{ display: "grid", gap: 12 }}>
                    {deals.map((d) => (
                      <div
                        key={d.id}
                        style={{
                          padding: isMobile ? "14px 16px" : "16px 20px",
                          borderRadius: 16,
                          border: "1px solid rgba(18,34,28,0.08)",
                          background: "#f7f6f1",
                        }}
                      >
                        <div style={{ fontSize: 16, fontWeight: 900, color: "#11211a" }}>
                          {d.title || "Untitled Deal"}
                        </div>

                        {d.description ? (
                          <div style={{ marginTop: 6, fontSize: 14, color: "#475467", lineHeight: 1.5 }}>
                            {d.description}
                          </div>
                        ) : null}

                        {d.discount_value ? (
                          <div
                            style={{
                              marginTop: 8,
                              display: "inline-block",
                              padding: "3px 10px",
                              borderRadius: 999,
                              background: "#dcfce7",
                              border: "1px solid #bbf7d0",
                              fontSize: 12,
                              fontWeight: 800,
                              color: "#15803d",
                            }}
                          >
                            {d.discount_value}
                          </div>
                        ) : null}

                        {d.restaurant_name ? (
                          <div style={{ marginTop: 8, fontSize: 13, color: "#667085", fontWeight: 600 }}>
                            {d.restaurant_name}
                          </div>
                        ) : null}

                        {d.restaurant_id ? (
                          <div style={{ marginTop: 10 }}>
                            <Link
                              to={`/restaurants/${d.restaurant_id}`}
                              style={{
                                color: "#11211a",
                                fontWeight: 800,
                                fontSize: 13,
                                textDecoration: "none",
                              }}
                            >
                              View Restaurant →
                            </Link>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
