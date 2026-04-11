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

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001").replace(/\/$/, "");

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

const DISTANCE_OPTIONS = [
  { label: "5 miles",  value: "5"  },
  { label: "10 miles", value: "10" },
  { label: "25 miles", value: "25" },
  { label: "50 miles", value: "50" },
];

function formatDealBadge(deal) {
  const raw = String(deal?.discount_value || "").trim();
  if (!raw) return "";
  if (deal?.deal_type === "fixed_price" && /^\$\d+(?:\.\d{1,2})?$/i.test(raw)) {
    return `Only ${raw}`;
  }
  if (deal?.deal_type === "amount_off" && /^\$\d+(?:\.\d{1,2})?$/i.test(raw)) {
    return `${raw} off`;
  }
  if (deal?.deal_type === "percent_off" && /^\d+(?:\.\d+)?%$/i.test(raw)) {
    return `${raw} off`;
  }
  if (/^\d+(?:\.\d+)?%$/i.test(raw)) return `${raw} off`;
  if (/^\$\d+(?:\.\d{1,2})?$/i.test(raw)) return `${raw} off`;
  return raw;
}

function buildDealUrl(deal) {
  const base = deal.restaurant_slug || deal.restaurant_id;
  if (!base) return null;
  if (deal.menu_item_id) {
    return `/restaurants/${base}/menu-items/${deal.menu_item_id}`;
  }
  return `/restaurants/${base}/menu`;
}

export default function DealsPage() {
  const { search } = useLocation();
  const urlParams = new URLSearchParams(search);
  const urlCity  = urlParams.get("city")  || "";
  const urlState = urlParams.get("state") || "";
  const urlLat   = urlParams.get("lat")   ? parseFloat(urlParams.get("lat"))  : null;
  const urlLng   = urlParams.get("lng")   ? parseFloat(urlParams.get("lng"))  : null;
  const locationLabel = [urlCity, urlState].filter(Boolean).join(", ");

  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);
  const [cuisine, setCuisine] = useState("");
  const [radiusMiles, setRadiusMiles] = useState("");

  // User coordinates — from URL params or browser geolocation
  const [userLat, setUserLat] = useState(urlLat);
  const [userLng, setUserLng] = useState(urlLng);
  const [locDetecting, setLocDetecting] = useState(false);

  useEffect(() => {
    if (urlLat != null && urlLng != null) return; // already have coords from URL
    if (!navigator.geolocation) return;
    setLocDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLat(pos.coords.latitude);
        setUserLng(pos.coords.longitude);
        setLocDetecting(false);
      },
      () => setLocDetecting(false),
      { timeout: 8000 }
    );
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchDeals() {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (urlCity)  params.set("city",  urlCity);
        if (urlState) params.set("state", urlState);
        if (cuisine)  params.set("cuisine", cuisine);
        if (userLat != null && userLng != null && radiusMiles) {
          params.set("lat",          userLat);
          params.set("lng",          userLng);
          params.set("radius_miles", radiusMiles);
        }

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
    return () => { cancelled = true; };
  }, [urlCity, urlState, cuisine, userLat, userLng, radiusMiles]);

  const hasLocation = userLat != null && userLng != null;

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
                  <option key={option} value={option}>{option}</option>
                ))}
              </SelectField>

              {/* Distance filter — only shown when user location is available */}
              {hasLocation ? (
                <SelectField
                  label="Distance"
                  value={radiusMiles}
                  onChange={(event) => setRadiusMiles(event.target.value)}
                >
                  <option value="">Any distance</option>
                  {DISTANCE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </SelectField>
              ) : locDetecting ? (
                <div style={{ fontSize: 13, color: "var(--gb-color-ink-muted)" }}>
                  Detecting location for distance filter…
                </div>
              ) : null}

              <FilterChip active={!cuisine && !radiusMiles} onClick={() => { setCuisine(""); setRadiusMiles(""); }}>
                Show all deals
              </FilterChip>
            </div>
          </Card>
        )}
      >
        <PageHero
          title={locationLabel ? `Restaurant Deals Near ${locationLabel}` : "Restaurant Deals"}
          description="Active promotions from restaurants in your area."
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
                {deals.map((deal) => {
                  const dealUrl = buildDealUrl(deal);
                  return (
                    <Card
                      key={deal.deal_id || deal.id}
                      muted
                      style={{
                        borderRadius: "var(--gb-radius-card-tight)",
                        padding: "16px 20px",
                        boxShadow: "none",
                      }}
                    >
                      {/* Restaurant name — most prominent */}
                      {deal.restaurant_name ? (
                        <div style={{ color: "var(--gb-color-ink-strong)", fontSize: 18, fontWeight: 900, marginBottom: 6 }}>
                          {deal.restaurant_name}
                        </div>
                      ) : null}

                      {/* Deal title — clickable, goes to menu or menu item */}
                      <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.4 }}>
                        {dealUrl ? (
                          <Link
                            to={dealUrl}
                            style={{
                              color: "var(--gb-color-brand, #1a73e8)",
                              textDecoration: "none",
                            }}
                          >
                            {deal.title || "Untitled Deal"}
                          </Link>
                        ) : (
                          <span style={{ color: "var(--gb-color-ink-strong)" }}>
                            {deal.title || "Untitled Deal"}
                          </span>
                        )}
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
                          {formatDealBadge(deal)}
                        </div>
                      ) : null}

                      {dealUrl ? (
                        <div style={{ marginTop: 10 }}>
                          <Link to={dealUrl} className="gb-linkish" style={{ fontSize: 13, fontWeight: 800 }}>
                            {deal.menu_item_id ? `View ${deal.menu_item_name || "Item"} →` : "View Menu →"}
                          </Link>
                        </div>
                      ) : null}
                    </Card>
                  );
                })}
              </div>
            </>
          ) : null}
        </Card>
      </PageSplit>
    </PageShell>
  );
}
