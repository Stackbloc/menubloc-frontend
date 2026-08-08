import React, { useState } from "react";
import { Link } from "react-router-dom";
import DistributorLayout, { DIST_COLORS, PageCard, SectionTitle } from "./DistributorLayout.jsx";
import {
  requestRestaurantConnection,
  searchDistributorRestaurants,
} from "../../lib/distributorApi.js";

export default function DistributorSearchPage() {
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [relationship, setRelationship] = useState("");
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [actionMsg, setActionMsg] = useState("");

  async function runSearch(e) {
    e?.preventDefault?.();
    setBusy(true);
    setError("");
    setActionMsg("");
    try {
      const data = await searchDistributorRestaurants({
        q,
        city,
        state,
        relationship: relationship || undefined,
      });
      setRows(Array.isArray(data.restaurants) ? data.restaurants : []);
    } catch (err) {
      setError(err.message || "Search failed");
    } finally {
      setBusy(false);
    }
  }

  async function requestConnect(restaurantId) {
    setActionMsg("");
    try {
      await requestRestaurantConnection(restaurantId);
      setActionMsg("Connection request sent.");
      await runSearch();
    } catch (err) {
      setActionMsg(err.message || "Request failed");
    }
  }

  return (
    <DistributorLayout title="Search restaurants">
      <PageCard>
        <SectionTitle
          title="Find restaurants"
          subtitle="Search by name, Menuply ID (MPL-R-…), city, or state. Not consumer dish search."
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
          <select
            value={relationship}
            onChange={(e) => setRelationship(e.target.value)}
            style={inputStyle}
          >
            <option value="">Any relationship</option>
            <option value="none">No relationship</option>
            <option value="reported">Reported usage</option>
            <option value="requested">Pending</option>
            <option value="connected">Connected</option>
          </select>
          <button type="submit" disabled={busy} style={btnStyle}>
            {busy ? "Searching…" : "Search"}
          </button>
        </form>
        {error ? <div style={{ color: "#b91c1c", marginTop: 12 }}>{error}</div> : null}
        {actionMsg ? <div style={{ color: DIST_COLORS.muted, marginTop: 12 }}>{actionMsg}</div> : null}
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
                <div style={{ fontSize: 12, marginTop: 4 }}>
                  Status:{" "}
                  <strong>{r.relationship_status || "none"}</strong>
                  {r.usage_reported ? " · reported usage" : ""}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <Link to={`/distributor/restaurants/${r.id}`} style={linkBtn}>
                  View
                </Link>
                {!r.relationship_status ||
                ["reported", "declined", "disconnected"].includes(r.relationship_status) ? (
                  <button type="button" onClick={() => requestConnect(r.id)} style={btnStyle}>
                    Request
                  </button>
                ) : null}
              </div>
            </div>
          ))}
          {!busy && rows.length === 0 ? (
            <div style={{ color: DIST_COLORS.muted }}>No results yet. Run a search.</div>
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
