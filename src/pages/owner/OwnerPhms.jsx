import React, { useEffect, useState } from "react";
import OwnerLayout, { OWNER_COLORS, PageCard, SectionTitle } from "./OwnerLayout.jsx";
import {
  getOwnerPhmsHealth,
  getOwnerPhmsMenuStatus,
  getOwnerPhmsDisplayAudit,
  getOwnerPhmsDeploymentHealth,
  captureOwnerPhmsDisplaySnapshot,
  getOwnerPhmsRepairTickets,
  acknowledgeOwnerPhmsRepairTicket,
} from "../../lib/ownerApi.js";

// ── Status palette ────────────────────────────────────────────────────────────
const STATUS_COLORS = {
  PASS:    { bg: "#dcfce7", border: "#86efac", text: "#166534" },
  WARN:    { bg: "#fef9c3", border: "#fde047", text: "#854d0e" },
  FAIL:    { bg: "#fee2e2", border: "#fca5a5", text: "#991b1b" },
  UNKNOWN: { bg: "#f3f4f6", border: "#d1d5db", text: "#374151" },
  HEALTHY:  { bg: "#dcfce7", border: "#86efac", text: "#166534" },
  DEGRADED: { bg: "#fef9c3", border: "#fde047", text: "#854d0e" },
  CRITICAL: { bg: "#fee2e2", border: "#fca5a5", text: "#991b1b" },
};

function StatusBadge({ status, style = {} }) {
  const c = STATUS_COLORS[status] || STATUS_COLORS.UNKNOWN;
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 10px",
      borderRadius: 99,
      fontSize: 11,
      fontWeight: 800,
      letterSpacing: "0.08em",
      background: c.bg,
      border: `1px solid ${c.border}`,
      color: c.text,
      ...style,
    }}>
      {status}
    </span>
  );
}

function HealthCard({ check }) {
  const c = STATUS_COLORS[check.status] || STATUS_COLORS.UNKNOWN;
  return (
    <div style={{
      background: "#fff",
      border: `1.5px solid ${c.border}`,
      borderRadius: 14,
      padding: "16px 18px",
      display: "flex",
      flexDirection: "column",
      gap: 6,
      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: OWNER_COLORS.ink, lineHeight: 1.3 }}>
          {check.label}
        </div>
        <StatusBadge status={check.status} />
      </div>
      <div style={{ fontSize: 12, color: OWNER_COLORS.muted, wordBreak: "break-all" }}>
        {check.detail}
      </div>
      {check.latencyMs != null && (
        <div style={{ fontSize: 11, color: OWNER_COLORS.muted }}>{check.latencyMs}ms</div>
      )}
    </div>
  );
}

function SectionError({ msg }) {
  return (
    <div style={{ padding: "12px 16px", background: "#fee2e2", borderRadius: 10, color: "#991b1b", fontSize: 13 }}>
      {msg}
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ padding: 24, color: OWNER_COLORS.muted, fontSize: 13, textAlign: "center" }}>
      Loading…
    </div>
  );
}

function fmtTime(isoStr) {
  if (!isoStr) return "—";
  try {
    return new Date(isoStr).toLocaleString();
  } catch (_) {
    return isoStr;
  }
}

// ── Section: Critical Health ──────────────────────────────────────────────────
function CriticalHealthSection({ onDataChange }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  function load() {
    setLoading(true);
    setError(null);
    getOwnerPhmsHealth()
      .then((d) => { setData(d); if (onDataChange) onDataChange(d); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  const overall = data?.overallStatus;
  const c = overall ? (STATUS_COLORS[overall] || STATUS_COLORS.UNKNOWN) : null;

  return (
    <PageCard style={{ padding: "24px 26px", marginBottom: 28 }}>
      <SectionTitle
        title="Critical Health"
        subtitle={data ? `Checked at ${fmtTime(data.checkedAt)}` : "Live probes of core platform routes"}
        action={
          <button
            onClick={load}
            disabled={loading}
            style={{ fontSize: 12, fontWeight: 700, border: `1px solid ${OWNER_COLORS.line}`, background: "#fff", borderRadius: 10, padding: "7px 14px", cursor: "pointer" }}
          >
            {loading ? "Checking…" : "Refresh"}
          </button>
        }
      />

      {overall && (
        <div style={{
          display: "flex", alignItems: "center", gap: 10, marginBottom: 20,
          padding: "12px 16px", borderRadius: 12,
          background: c.bg, border: `1.5px solid ${c.border}`,
        }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: c.text }}>Overall: {overall}</span>
        </div>
      )}

      {error ? <SectionError msg={error} /> : null}
      {loading && !data ? <Spinner /> : null}

      {data?.checks && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
          {data.checks.map((check) => (
            <HealthCard key={check.id} check={check} />
          ))}
        </div>
      )}
    </PageCard>
  );
}

// ── Section: Menu Status ──────────────────────────────────────────────────────
function MenuStatusSection() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getOwnerPhmsMenuStatus()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const counts = data?.menu_counts || {};

  return (
    <PageCard style={{ padding: "24px 26px", marginBottom: 28 }}>
      <SectionTitle title="Menu Status" subtitle="Published, draft, and geo-coverage counts" />
      {error ? <SectionError msg={error} /> : null}
      {loading ? <Spinner /> : null}

      {data && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 18 }}>
            {[
              ["Published", counts.published, "PASS"],
              ["Draft", counts.draft, counts.draft > 0 ? "WARN" : "PASS"],
              ["Archived", counts.archived, "UNKNOWN"],
              ["Total", counts.total, "UNKNOWN"],
            ].map(([label, value, status]) => (
              <div key={label} style={{
                background: "#fff", border: `1px solid ${OWNER_COLORS.line}`, borderRadius: 12,
                padding: "14px 16px", display: "flex", flexDirection: "column", gap: 6,
              }}>
                <div style={{ fontSize: 12, color: OWNER_COLORS.muted, fontWeight: 700 }}>{label}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: OWNER_COLORS.ink }}>{value ?? "—"}</div>
                <StatusBadge status={status} />
              </div>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10,
            background: data.geo_status === "PASS" ? "#dcfce7" : "#fef9c3",
            border: `1px solid ${data.geo_status === "PASS" ? "#86efac" : "#fde047"}` }}>
            <StatusBadge status={data.geo_status} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>
              {data.published_missing_geo === 0
                ? "All published menus have geo coordinates"
                : `${data.published_missing_geo} published menu(s) missing geo — restaurants won't appear in distance results`}
            </span>
          </div>

          {data.recent_upload_statuses?.length > 0 && (
            <div style={{ marginTop: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Upload Activity (Last 24h)</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {data.recent_upload_statuses.map((row) => (
                  <div key={row.status} style={{
                    background: "#fff", border: `1px solid ${OWNER_COLORS.line}`,
                    borderRadius: 10, padding: "8px 14px", fontSize: 13,
                  }}>
                    <span style={{ fontWeight: 700 }}>{row.cnt}</span>{" "}
                    <span style={{ color: OWNER_COLORS.muted }}>{row.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </PageCard>
  );
}

// ── Section: Display Audit ────────────────────────────────────────────────────
function DisplayAuditSection() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [capturing, setCapturing] = useState(false);
  const [error, setError] = useState(null);
  const [captureMsg, setCaptureMsg] = useState(null);

  function load() {
    setLoading(true);
    setError(null);
    getOwnerPhmsDisplayAudit()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleCaptureAll() {
    setCapturing(true);
    setCaptureMsg(null);
    try {
      const result = await captureOwnerPhmsDisplaySnapshot({ capture_all: true });
      const ok = result.captured?.filter((r) => r.ok).length || 0;
      const fail = result.captured?.filter((r) => !r.ok).length || 0;
      setCaptureMsg(`Captured ${ok} markets${fail > 0 ? `, ${fail} failed` : ""}`);
      load();
    } catch (e) {
      setCaptureMsg(`Capture failed: ${e.message}`);
    } finally {
      setCapturing(false);
    }
  }

  const disappearances = data?.disappearances || [];
  const phmsChecks = data?.phms_checks || [];
  const snapshots = data?.snapshots || [];

  return (
    <PageCard style={{ padding: "24px 26px", marginBottom: 28 }}>
      <SectionTitle
        title="Display Audit"
        subtitle={`${data?.snapshot_count || 0} snapshots stored · Tracks restaurant visibility per market`}
        action={
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={load} disabled={loading} style={{ fontSize: 12, fontWeight: 700, border: `1px solid ${OWNER_COLORS.line}`, background: "#fff", borderRadius: 10, padding: "7px 14px", cursor: "pointer" }}>
              {loading ? "Loading…" : "Refresh"}
            </button>
            <button onClick={handleCaptureAll} disabled={capturing} style={{ fontSize: 12, fontWeight: 700, border: `1px solid ${OWNER_COLORS.accent}`, background: OWNER_COLORS.accentSoft, color: OWNER_COLORS.accent, borderRadius: 10, padding: "7px 14px", cursor: "pointer" }}>
              {capturing ? "Capturing…" : "Capture All Markets"}
            </button>
          </div>
        }
      />

      {captureMsg && (
        <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 10, background: "#f0fdf4", border: "1px solid #86efac", fontSize: 13 }}>
          {captureMsg}
        </div>
      )}

      {error ? <SectionError msg={error} /> : null}
      {loading ? <Spinner /> : null}

      {phmsChecks.length > 0 && (
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>PHMS Display Checks</div>
          <div style={{ display: "grid", gap: 8 }}>
            {phmsChecks.map((c) => (
              <div key={c.id} style={{
                display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                gap: 12, padding: "10px 14px", borderRadius: 10,
                background: "#fff", border: `1px solid ${OWNER_COLORS.line}`,
              }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: OWNER_COLORS.muted, marginBottom: 2 }}>{c.id}</div>
                  <div style={{ fontSize: 13, color: OWNER_COLORS.ink }}>{c.detail}</div>
                </div>
                <StatusBadge status={c.status} style={{ flexShrink: 0 }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {disappearances.length > 0 && (
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#991b1b", marginBottom: 10 }}>
            Disappearances Detected ({disappearances.length})
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {disappearances.map((d, i) => (
              <div key={i} style={{
                padding: "12px 16px", borderRadius: 10,
                background: "#fee2e2", border: "1px solid #fca5a5",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{d.restaurant_name}</div>
                    <div style={{ fontSize: 12, color: "#7f1d1d", marginTop: 3 }}>
                      {d.city}, {d.state} · Surface: {d.surface}
                    </div>
                    <div style={{ fontSize: 12, color: "#7f1d1d", marginTop: 2 }}>
                      Had active menu: {d.had_active_menu ? "Yes" : "No"} · Last seen: {fmtTime(d.last_seen_at)} · Disappeared: {fmtTime(d.disappeared_at)}
                    </div>
                  </div>
                  <StatusBadge status={d.severity || "WARN"} style={{ flexShrink: 0 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {disappearances.length === 0 && !loading && data && (
        <div style={{ marginBottom: 18, padding: "10px 14px", borderRadius: 10, background: "#f0fdf4", border: "1px solid #86efac", fontSize: 13, color: "#166534" }}>
          No menu-backed restaurant disappearances detected.
        </div>
      )}

      {snapshots.length > 0 && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Recent Snapshots</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: OWNER_COLORS.accentSoft }}>
                  {["Market", "Surface", "Restaurants", "Menu-Backed", "Captured"].map((h) => (
                    <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontWeight: 700, color: OWNER_COLORS.accent, borderBottom: `1px solid ${OWNER_COLORS.line}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {snapshots.slice(0, 15).map((s) => (
                  <tr key={s.id} style={{ borderBottom: `1px solid ${OWNER_COLORS.line}` }}>
                    <td style={{ padding: "8px 12px", fontWeight: 600 }}>{s.market_slug}</td>
                    <td style={{ padding: "8px 12px" }}>{s.surface}</td>
                    <td style={{ padding: "8px 12px" }}>{s.restaurant_count}</td>
                    <td style={{ padding: "8px 12px" }}>
                      <span style={{ fontWeight: 700, color: s.menu_backed_count > 0 ? "#166534" : "#991b1b" }}>
                        {s.menu_backed_count}
                      </span>
                    </td>
                    <td style={{ padding: "8px 12px", color: OWNER_COLORS.muted }}>{fmtTime(s.captured_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && data && snapshots.length === 0 && (
        <div style={{ padding: "16px", color: OWNER_COLORS.muted, fontSize: 13 }}>
          No snapshots yet. Click "Capture All Markets" to take the first snapshot.
        </div>
      )}
    </PageCard>
  );
}

// ── Section: Search Health ────────────────────────────────────────────────────
function SearchHealthSection({ healthData }) {
  if (!healthData) return null;
  const checks = (healthData.checks || []).filter((c) =>
    ["search_working", "browse_working"].includes(c.id)
  );
  return (
    <PageCard style={{ padding: "24px 26px", marginBottom: 28 }}>
      <SectionTitle title="Search Health" subtitle="Live probes for search and browse" />
      {checks.length === 0 ? (
        <div style={{ fontSize: 13, color: OWNER_COLORS.muted }}>Health data not yet loaded.</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
          {checks.map((c) => <HealthCard key={c.id} check={c} />)}
        </div>
      )}
    </PageCard>
  );
}

// ── Section: Deployment Health ────────────────────────────────────────────────
function DeploymentHealthSection() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  function load() {
    setLoading(true);
    setError(null);
    getOwnerPhmsDeploymentHealth()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  return (
    <PageCard style={{ padding: "24px 26px", marginBottom: 28 }}>
      <SectionTitle
        title="Deployment Health"
        subtitle={data ? `Checked ${fmtTime(data.checked_at)}` : "Vercel frontend + Railway backend live check"}
        action={
          <button onClick={load} disabled={loading} style={{ fontSize: 12, fontWeight: 700, border: `1px solid ${OWNER_COLORS.line}`, background: "#fff", borderRadius: 10, padding: "7px 14px", cursor: "pointer" }}>
            {loading ? "Checking…" : "Run Check"}
          </button>
        }
      />

      {error ? <SectionError msg={error} /> : null}
      {loading ? <Spinner /> : null}

      {!loading && !data && !error && (
        <div style={{ fontSize: 13, color: OWNER_COLORS.muted }}>Click "Run Check" to probe production deployment.</div>
      )}

      {data && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
          <div style={{ background: "#fff", border: `1px solid ${OWNER_COLORS.line}`, borderRadius: 12, padding: "16px 18px" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: OWNER_COLORS.muted, marginBottom: 6 }}>Frontend (menuply.com)</div>
            <StatusBadge status={data.frontend?.status || "UNKNOWN"} />
            <div style={{ fontSize: 12, color: OWNER_COLORS.muted, marginTop: 6 }}>HTTP {data.frontend?.http_status} · {data.frontend?.latency_ms}ms</div>
          </div>

          <div style={{ background: "#fff", border: `1px solid ${OWNER_COLORS.line}`, borderRadius: 12, padding: "16px 18px" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: OWNER_COLORS.muted, marginBottom: 6 }}>Backend (Railway)</div>
            <StatusBadge status={data.backend?.status || "UNKNOWN"} />
            <div style={{ fontSize: 12, color: OWNER_COLORS.muted, marginTop: 6 }}>HTTP {data.backend?.http_status} · {data.backend?.latency_ms}ms</div>
            {data.backend?.commit_hash && (
              <div style={{ fontSize: 11, color: OWNER_COLORS.muted, marginTop: 4, fontFamily: "monospace" }}>commit: {data.backend.commit_hash}</div>
            )}
          </div>

          <div style={{ background: "#fff", border: `1px solid ${OWNER_COLORS.line}`, borderRadius: 12, padding: "16px 18px" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: OWNER_COLORS.muted, marginBottom: 6 }}>JS Bundle API URLs</div>
            <StatusBadge status={data.bundle?.status || "UNKNOWN"} />
            <div style={{ fontSize: 12, color: OWNER_COLORS.muted, marginTop: 6 }}>{data.bundle?.detail}</div>
          </div>
        </div>
      )}
    </PageCard>
  );
}

// ── Section: Repair Tickets ───────────────────────────────────────────────────
function RepairTicketsSection() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copyMsg, setCopyMsg] = useState(null);

  function load() {
    setLoading(true);
    setError(null);
    getOwnerPhmsRepairTickets()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function copyText(text, label) {
    try {
      await navigator.clipboard.writeText(text);
      setCopyMsg(label);
      setTimeout(() => setCopyMsg(null), 2000);
    } catch (e) {
      setCopyMsg(`Copy failed: ${e.message}`);
    }
  }

  function exportMarkdown(ticket) {
    const blob = new Blob([ticket.markdown || ""], { type: "text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${ticket.checkId}-repair-ticket.md`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function markResolved(checkId) {
    try {
      await acknowledgeOwnerPhmsRepairTicket(checkId);
      setCopyMsg(`Acknowledged ${checkId} — PHMS must pass to verify`);
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  const tickets = data?.tickets || [];

  return (
    <PageCard style={{ padding: "24px 26px", marginBottom: 28 }}>
      <SectionTitle
        title="Repair Tickets"
        subtitle={data?.generatedAt ? `From PHMS run ${fmtTime(data.generatedAt)}` : "Auto-generated from latest PHMS archive"}
        action={
          <button onClick={load} disabled={loading} style={{ fontSize: 12, fontWeight: 700, border: `1px solid ${OWNER_COLORS.line}`, background: "#fff", borderRadius: 10, padding: "7px 14px", cursor: "pointer" }}>
            {loading ? "Loading…" : "Refresh"}
          </button>
        }
      />

      {copyMsg && (
        <div style={{ marginBottom: 12, padding: "8px 12px", background: "#f0fdf4", borderRadius: 8, fontSize: 12, color: "#166534" }}>
          {copyMsg}
        </div>
      )}

      {error ? <SectionError msg={error} /> : null}
      {loading ? <Spinner /> : null}

      {!loading && data?.message && tickets.length === 0 && (
        <div style={{ fontSize: 13, color: OWNER_COLORS.muted }}>{data.message}</div>
      )}

      {!loading && tickets.length === 0 && !data?.message && (
        <div style={{ padding: "12px 14px", background: "#f0fdf4", borderRadius: 10, color: "#166534", fontSize: 13 }}>
          No open repair tickets — all PHMS checks passing in latest archive.
        </div>
      )}

      {!loading && tickets.length > 0 && (
        <div style={{ display: "grid", gap: 14 }}>
          {tickets.map((ticket) => (
            <div key={ticket.incidentId} style={{
              border: `1px solid ${OWNER_COLORS.line}`,
              borderRadius: 12,
              padding: "16px 18px",
              background: "#fff",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 14 }}>{ticket.checkId} — {ticket.checkName}</div>
                  <div style={{ fontSize: 12, color: OWNER_COLORS.muted, marginTop: 4 }}>
                    {ticket.department} · {ticket.suspectedSubsystem?.label} ({ticket.suspectedSubsystem?.confidencePct}%)
                  </div>
                  <div style={{ fontSize: 12, color: OWNER_COLORS.muted, marginTop: 2, fontFamily: "monospace" }}>
                    {ticket.incidentId}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <StatusBadge status={ticket.priority === "Critical" ? "CRITICAL" : ticket.priority === "High" ? "FAIL" : "WARN"} />
                  {ticket.customerVisible === "Yes" && (
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#991b1b" }}>Customer-visible</span>
                  )}
                </div>
              </div>
              <p style={{ fontSize: 13, color: OWNER_COLORS.ink, margin: "10px 0 12px", lineHeight: 1.45 }}>
                {ticket.problemSummary?.slice(0, 280)}{ticket.problemSummary?.length > 280 ? "…" : ""}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                <button type="button" onClick={() => copyText(ticket.markdown, "Repair ticket copied")} style={{ fontSize: 11, fontWeight: 700, padding: "6px 10px", borderRadius: 8, border: `1px solid ${OWNER_COLORS.line}`, background: "#fff", cursor: "pointer" }}>
                  Copy Repair Ticket
                </button>
                <button type="button" onClick={() => copyText(ticket.agentPrompt, "Agent prompt copied")} style={{ fontSize: 11, fontWeight: 700, padding: "6px 10px", borderRadius: 8, border: `1px solid ${OWNER_COLORS.line}`, background: "#fff", cursor: "pointer" }}>
                  Copy Agent Prompt
                </button>
                <button type="button" onClick={() => exportMarkdown(ticket)} style={{ fontSize: 11, fontWeight: 700, padding: "6px 10px", borderRadius: 8, border: `1px solid ${OWNER_COLORS.line}`, background: "#fff", cursor: "pointer" }}>
                  Export Markdown
                </button>
                <button type="button" disabled title="GitHub integration not yet implemented" style={{ fontSize: 11, fontWeight: 700, padding: "6px 10px", borderRadius: 8, border: `1px solid ${OWNER_COLORS.line}`, background: "#f9fafb", cursor: "not-allowed", opacity: 0.6 }}>
                  Create GitHub Issue
                </button>
                <button type="button" onClick={() => markResolved(ticket.checkId)} style={{ fontSize: 11, fontWeight: 700, padding: "6px 10px", borderRadius: 8, border: "1px solid #86efac", background: "#f0fdf4", cursor: "pointer", color: "#166534" }}>
                  Mark Resolved
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageCard>
  );
}

// ── Section: Recent Incidents ─────────────────────────────────────────────────
function RecentIncidentsSection({ healthData }) {
  if (!healthData?.checks) return null;
  const failing = healthData.checks.filter((c) => c.status === "FAIL" || c.status === "WARN");
  return (
    <PageCard style={{ padding: "24px 26px", marginBottom: 28 }}>
      <SectionTitle title="Recent Incidents" subtitle="Failing or degraded checks from the last health probe" />
      {failing.length === 0 ? (
        <div style={{ padding: "12px 14px", background: "#f0fdf4", borderRadius: 10, color: "#166534", fontSize: 13 }}>
          No active incidents — all checks passing.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {failing.map((c) => (
            <div key={c.id} style={{
              padding: "12px 16px", borderRadius: 10,
              background: c.status === "FAIL" ? "#fee2e2" : "#fef9c3",
              border: `1px solid ${c.status === "FAIL" ? "#fca5a5" : "#fde047"}`,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{c.label}</div>
                  <div style={{ fontSize: 12, marginTop: 3, color: c.status === "FAIL" ? "#7f1d1d" : "#78350f" }}>
                    {c.detail}
                  </div>
                </div>
                <StatusBadge status={c.status} style={{ flexShrink: 0 }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </PageCard>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function OwnerPhms() {
  const [healthData, setHealthData] = useState(null);

  return (
    <OwnerLayout title="Platform Health">
      <div style={{ marginBottom: 10, fontSize: 13, color: OWNER_COLORS.muted, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <span>Live critical-health monitoring · Display disappearance detection · Deployment verification</span>
        <a href="/owner/phms/incidents" style={{ color: OWNER_COLORS.accent, fontWeight: 700, fontSize: 12 }}>Incident Manager →</a>
      </div>

      <CriticalHealthSection onHealthLoaded={setHealthData} onDataChange={setHealthData} />
      <SearchHealthSection healthData={healthData} />
      <MenuStatusSection />
      <DisplayAuditSection />
      <DeploymentHealthSection />
      <RepairTicketsSection />
      <RecentIncidentsSection healthData={healthData} />
    </OwnerLayout>
  );
}
