"use strict";

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import OwnerLayout, { OWNER_COLORS, PageCard, SectionTitle } from "./OwnerLayout.jsx";
import { getOwnerPhmsIncidents } from "../../lib/ownerApi.js";

const STATUS_COLORS = {
  OPEN: { bg: "#fee2e2", border: "#fca5a5", text: "#991b1b" },
  ASSIGNED: { bg: "#ffedd5", border: "#fdba74", text: "#9a3412" },
  IN_PROGRESS: { bg: "#fef9c3", border: "#fde047", text: "#854d0e" },
  FIX_SUBMITTED: { bg: "#e0e7ff", border: "#a5b4fc", text: "#3730a3" },
  VERIFICATION_RUNNING: { bg: "#dbeafe", border: "#93c5fd", text: "#1e40af" },
  VERIFIED: { bg: "#dcfce7", border: "#86efac", text: "#166534" },
  CLOSED: { bg: "#f3f4f6", border: "#d1d5db", text: "#374151" },
  REOPENED: { bg: "#fce7f3", border: "#f9a8d4", text: "#9d174d" },
};

const BUCKETS = [
  { id: "", label: "All" },
  { id: "open", label: "Open" },
  { id: "in_progress", label: "In Progress" },
  { id: "waiting_verification", label: "Waiting Verification" },
  { id: "closed", label: "Closed" },
  { id: "reopened", label: "Reopened" },
];

const SORT_OPTIONS = [
  { id: "priority", label: "Priority" },
  { id: "severity", label: "Severity" },
  { id: "age", label: "Age" },
  { id: "owner", label: "Owner" },
  { id: "regression", label: "Regression" },
  { id: "customer_impact", label: "Customer Impact" },
];

function StatusBadge({ status }) {
  const c = STATUS_COLORS[status] || STATUS_COLORS.OPEN;
  return (
    <span style={{
      display: "inline-block", padding: "2px 8px", borderRadius: 99, fontSize: 10,
      fontWeight: 800, background: c.bg, border: `1px solid ${c.border}`, color: c.text,
    }}>
      {status}
    </span>
  );
}

function fmtTime(iso) {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleString(); } catch (_) { return iso; }
}

export default function OwnerPhmsIncidents() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bucket, setBucket] = useState("");
  const [sortBy, setSortBy] = useState("priority");

  function load() {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (bucket) params.set("bucket", bucket);
    if (sortBy) params.set("sortBy", sortBy);
    getOwnerPhmsIncidents(params.toString())
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [bucket, sortBy]);

  const summary = data?.summary || {};
  const incidents = data?.incidents || [];

  return (
    <OwnerLayout title="Incident Manager">
      <div style={{ marginBottom: 16, fontSize: 13, color: OWNER_COLORS.muted }}>
        PHMS operational workflow — persistent incidents with lifecycle tracking.{" "}
        <Link to="/owner/phms" style={{ color: OWNER_COLORS.accent }}>← Platform Health</Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10, marginBottom: 24 }}>
        {[
          ["Open", summary.open],
          ["In Progress", summary.inProgress],
          ["Waiting Verify", summary.waitingVerification],
          ["Closed", summary.closed],
          ["Reopened", summary.reopened],
          ["Blockers", summary.deploymentBlockers],
        ].map(([label, count]) => (
          <div key={label} style={{ background: "#fff", border: `1px solid ${OWNER_COLORS.line}`, borderRadius: 10, padding: "12px 14px", textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{count ?? 0}</div>
            <div style={{ fontSize: 11, color: OWNER_COLORS.muted }}>{label}</div>
          </div>
        ))}
      </div>

      <PageCard style={{ padding: "20px 22px", marginBottom: 20 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
          {BUCKETS.map((b) => (
            <button key={b.id || "all"} type="button" onClick={() => setBucket(b.id)}
              style={{
                fontSize: 12, fontWeight: 700, padding: "6px 12px", borderRadius: 8, cursor: "pointer",
                border: `1px solid ${bucket === b.id ? OWNER_COLORS.accent : OWNER_COLORS.line}`,
                background: bucket === b.id ? "#eff6ff" : "#fff",
              }}>
              {b.label}
            </button>
          ))}
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
            style={{ marginLeft: "auto", fontSize: 12, padding: "6px 10px", borderRadius: 8, border: `1px solid ${OWNER_COLORS.line}` }}>
            {SORT_OPTIONS.map((o) => <option key={o.id} value={o.id}>Sort: {o.label}</option>)}
          </select>
          <button type="button" onClick={load} disabled={loading}
            style={{ fontSize: 12, fontWeight: 700, padding: "6px 12px", borderRadius: 8, border: `1px solid ${OWNER_COLORS.line}`, background: "#fff", cursor: "pointer" }}>
            Refresh
          </button>
        </div>

        {error && <div style={{ color: "#991b1b", fontSize: 13, marginBottom: 12 }}>{error}</div>}
        {loading && <div style={{ color: OWNER_COLORS.muted, fontSize: 13 }}>Loading incidents…</div>}

        {!loading && incidents.length === 0 && (
          <div style={{ padding: 14, background: "#f0fdf4", borderRadius: 10, color: "#166534", fontSize: 13 }}>
            No incidents in this view. Run <code>npm run phms:run</code> to sync failures.
          </div>
        )}

        <div style={{ display: "grid", gap: 10 }}>
          {incidents.map((inc) => (
            <Link key={inc.incidentId} to={`/owner/phms/incidents/${encodeURIComponent(inc.incidentId)}`}
              style={{ textDecoration: "none", color: "inherit" }}>
              <div style={{
                border: `1px solid ${OWNER_COLORS.line}`, borderRadius: 12, padding: "14px 16px",
                background: "#fff", display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap",
              }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 14 }}>{inc.title}</div>
                  <div style={{ fontSize: 12, color: OWNER_COLORS.muted, marginTop: 4 }}>
                    {inc.incidentId} · {inc.phmsCheckId} · {inc.ownerDepartment}
                  </div>
                  <div style={{ fontSize: 11, color: OWNER_COLORS.muted, marginTop: 4 }}>
                    First: {fmtTime(inc.firstDetected)} · Last: {fmtTime(inc.lastDetected)}
                    {inc.recurring && <span style={{ color: "#9d174d", fontWeight: 700 }}> · Recurring ({inc.regressionCount})</span>}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                  <StatusBadge status={inc.status} />
                  <span style={{ fontSize: 11, fontWeight: 700 }}>{inc.priority}</span>
                  {inc.deploymentBlocker && <span style={{ fontSize: 10, color: "#991b1b", fontWeight: 800 }}>DEPLOY BLOCKER</span>}
                  {inc.customerVisible && <span style={{ fontSize: 10, color: "#854d0e" }}>Customer-visible</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </PageCard>
    </OwnerLayout>
  );
}
