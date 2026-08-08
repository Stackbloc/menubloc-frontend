import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DistributorLayout, { DIST_COLORS, PageCard, SectionTitle } from "./DistributorLayout.jsx";
import {
  listDistributorCatalog,
  searchDistributorRestaurants,
} from "../../lib/distributorApi.js";

/**
 * Restaurants hub — search Menuply restaurants (not consumer dish search).
 * Reported-usage filters appear only when the server exposes reported_usage_visible.
 */
export default function DistributorSearchPage() {
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [restaurantType, setRestaurantType] = useState("");
  const [reportedDistributorSlug, setReportedDistributorSlug] = useState("");
  const [catalog, setCatalog] = useState([]);
  const [reportedVisible, setReportedVisible] = useState(false);
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listDistributorCatalog()
      .then((data) => {
        if (cancelled) return;
        setReportedVisible(data?.reported_usage_visible === true);
        setCatalog(Array.isArray(data?.distributors) ? data.distributors : []);
      })
      .catch(() => {
        if (!cancelled) {
          setReportedVisible(false);
          setCatalog([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function runSearch(e) {
    e?.preventDefault?.();
    setBusy(true);
    setError("");
    setSearched(true);
    try {
      const params = {
        q,
        city,
        state,
        restaurant_type: restaurantType || undefined,
      };
      if (reportedVisible && reportedDistributorSlug) {
        params.reported_distributor_slug = reportedDistributorSlug;
      }
      const data = await searchDistributorRestaurants(params);
      setReportedVisible(data?.reported_usage_visible === true);
      setRows(Array.isArray(data.restaurants) ? data.restaurants : []);
    } catch (err) {
      setError(err.message || "Search failed");
      setRows([]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <DistributorLayout title="Restaurants">
      <PageCard>
        <SectionTitle
          title="Restaurants"
          subtitle="Search Menuply restaurants by name, Menuply ID (MPL-R-…), city, state, or type. Open public profiles and menus."
        />
        <form
          onSubmit={runSearch}
          style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}
        >
          <input
            placeholder="Name or MPL-R-…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={inputStyle}
          />
          <input
            placeholder="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            style={inputStyle}
          />
          <input
            placeholder="State"
            value={state}
            onChange={(e) => setState(e.target.value)}
            style={inputStyle}
          />
          <input
            placeholder="Restaurant type"
            value={restaurantType}
            onChange={(e) => setRestaurantType(e.target.value)}
            style={inputStyle}
          />
          {reportedVisible ? (
            <select
              value={reportedDistributorSlug}
              onChange={(e) => setReportedDistributorSlug(e.target.value)}
              style={inputStyle}
              aria-label="Reported distributor"
            >
              <option value="">Any reported distributor</option>
              {catalog.map((d) => (
                <option key={d.id} value={d.slug}>
                  {d.display_name}
                </option>
              ))}
            </select>
          ) : null}
          <button type="submit" disabled={busy} style={btnStyle}>
            {busy ? "Searching…" : "Search"}
          </button>
        </form>
        {error ? <div style={{ color: "#b91c1c", marginTop: 12 }}>{error}</div> : null}
        <div style={{ marginTop: 18, display: "grid", gap: 10 }}>
          {rows.map((r) => (
            <div
              key={r.id}
              style={{
                border: `1px solid ${DIST_COLORS.line}`,
                borderRadius: 12,
                padding: 14,
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div>
                <div style={{ fontWeight: 800 }}>{r.restaurant_name}</div>
                <div style={{ fontSize: 12, color: DIST_COLORS.muted, marginTop: 4 }}>
                  {r.menuply_public_id || "—"}
                  {r.city || r.state
                    ? ` · ${[r.city, r.state].filter(Boolean).join(", ")}`
                    : ""}
                  {r.restaurant_type ? ` · ${r.restaurant_type}` : ""}
                </div>
                {reportedVisible && Array.isArray(r.reported_distributors) && r.reported_distributors.length ? (
                  <div style={{ fontSize: 12, marginTop: 6, color: DIST_COLORS.muted }}>
                    Reported distributors:{" "}
                    {r.reported_distributors.map((d) => d.display_name).join(", ")}
                  </div>
                ) : null}
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <Link to={`/distributor/restaurants/${r.id}`} style={linkBtn}>
                  View Restaurant
                </Link>
              </div>
            </div>
          ))}
          {!busy && searched && rows.length === 0 ? (
            <div style={{ color: DIST_COLORS.muted }}>No restaurants matched this search.</div>
          ) : null}
          {!busy && !searched ? (
            <div style={{ color: DIST_COLORS.muted }}>Enter a search to explore restaurants.</div>
          ) : null}
        </div>
      </PageCard>
    </DistributorLayout>
  );
}

const inputStyle = {
  border: `1px solid ${DIST_COLORS.line}`,
  borderRadius: 10,
  padding: "10px 12px",
  fontSize: 14,
  fontFamily: "inherit",
};

const btnStyle = {
  border: "none",
  borderRadius: 10,
  padding: "10px 14px",
  background: DIST_COLORS.accent,
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "inherit",
};

const linkBtn = {
  ...btnStyle,
  background: "#fff",
  color: DIST_COLORS.ink,
  border: `1px solid ${DIST_COLORS.line}`,
  textDecoration: "none",
  display: "inline-block",
};
