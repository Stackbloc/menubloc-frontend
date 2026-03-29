// ============================================================
// File: src/pages/DealsPage.jsx
// Purpose: Display active restaurant deals with canonical Grubbid
// public discovery styling.
// ============================================================

import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { PageNav } from "../components/NavButton.jsx";
import {
  Card,
  FilterChip,
  PageHero,
  PageShell,
  PageSplit,
  SelectField,
  StatusMessage,
} from "../components/grubbid/GrubbidPrimitives.jsx";

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

export default function DealsPage() {
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

        const response = await fetch(`${API_BASE}/deals?${params.toString()}`);
        const data = await response.json().catch(() => ({}));

        if (cancelled) return;
        if (!data.ok && data.error) throw new Error(data.error);

        setDeals(data.deals || []);
      } catch (nextError) {
        if (!cancelled) setError(nextError.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchDeals();
    return () => {
      cancelled = true;
    };
  }, [urlCity, urlState, cuisine]);

  return (
    <PageShell width="wide">
      <PageNav />

      <PageSplit
        aside={(
          <Card>
            <div style={{ marginBottom: 14, color: "var(--gb-color-ink-strong)", fontSize: 16, fontWeight: 900 }}>
              Filter By
            </div>
            <div style={{ display: "grid", gap: 14 }}>
              <SelectField label="Cuisine" value={cuisine} onChange={(event) => setCuisine(event.target.value)}>
                <option value="">All</option>
                {CUISINE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </SelectField>

              <FilterChip active={!cuisine} onClick={() => setCuisine("")}>
                Show all deals
              </FilterChip>
            </div>
          </Card>
        )}
      >
        <PageHero
          title={locationLabel ? `Restaurant Deals Near ${locationLabel}` : "Restaurant Deals"}
          description="Deals uses the same typography, spacing, controls, and card language as Top Picks and Search."
        />

        <Card>
          {loading ? (
            <div style={{ display: "grid", gap: 12 }}>
              {[0, 1, 2, 3].map((index) => (
                <div
                  key={index}
                  style={{
                    height: 96,
                    borderRadius: "var(--gb-radius-card-tight)",
                    background: "rgba(0, 0, 0, 0.06)",
                  }}
                />
              ))}
            </div>
          ) : null}

          {!loading && error ? (
            <StatusMessage tone="muted">
              <strong style={{ display: "block", marginBottom: 8, color: "var(--gb-color-ink-strong)" }}>
                Could not load deals
              </strong>
              {error}
            </StatusMessage>
          ) : null}

          {!loading && !error && deals.length === 0 ? (
            <StatusMessage tone="muted">
              <strong style={{ display: "block", marginBottom: 8, color: "var(--gb-color-ink-strong)" }}>
                {locationLabel
                  ? `Currently, there are not any deals near ${locationLabel}.`
                  : "Currently, there are not any deals in this area."}
              </strong>
              Check back soon. We are still growing.
            </StatusMessage>
          ) : null}

          {!loading && !error && deals.length > 0 ? (
            <>
              <div className="gb-count-label" style={{ marginBottom: 14 }}>
                {deals.length} {deals.length === 1 ? "deal" : "deals"}
              </div>

              <div style={{ display: "grid", gap: 12 }}>
                {deals.map((deal) => (
                  <Card
                    key={deal.id}
                    muted
                    style={{
                      borderRadius: "var(--gb-radius-card-tight)",
                      padding: "16px 20px",
                      boxShadow: "none",
                    }}
                  >
                    <div style={{ color: "var(--gb-color-ink-strong)", fontSize: 16, fontWeight: 900 }}>
                      {deal.title || "Untitled Deal"}
                    </div>

                    {deal.description ? (
                      <div style={{ marginTop: 6, color: "var(--gb-color-ink-soft)", fontSize: 14, lineHeight: 1.55 }}>
                        {deal.description}
                      </div>
                    ) : null}

                    {deal.discount_value ? (
                      <div
                        style={{
                          marginTop: 8,
                          display: "inline-block",
                          padding: "3px 10px",
                          borderRadius: "var(--gb-radius-pill)",
                          background: "var(--gb-color-success-bg)",
                          border: "1px solid var(--gb-color-success-border)",
                          color: "var(--gb-color-success-text)",
                          fontSize: 12,
                          fontWeight: 800,
                        }}
                      >
                        {deal.discount_value}
                      </div>
                    ) : null}

                    {deal.restaurant_name ? (
                      <div style={{ marginTop: 8, color: "var(--gb-color-ink-muted)", fontSize: 13, fontWeight: 600 }}>
                        {deal.restaurant_name}
                      </div>
                    ) : null}

                    {deal.restaurant_id ? (
                      <div style={{ marginTop: 10 }}>
                        <Link to={`/restaurants/${deal.restaurant_id}`} className="gb-linkish" style={{ fontSize: 13, fontWeight: 800 }}>
                          View Restaurant →
                        </Link>
                      </div>
                    ) : null}
                  </Card>
                ))}
              </div>
            </>
          ) : null}
        </Card>
      </PageSplit>
    </PageShell>
  );
}
