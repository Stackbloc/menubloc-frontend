import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import OwnerLayout, { EmptyState, PageCard, SectionTitle } from "./OwnerLayout.jsx";
import { getOwnerError, getOwnerErrors } from "../../lib/ownerErrorsApi.js";
import { formatApiErrorForDisplay } from "../../lib/apiErrorDisplay.js";

const RANGES = [
  { hours: 1, label: "Last hour" },
  { hours: 24, label: "Last 24 hours" },
  { hours: 24 * 7, label: "Last 7 days" },
  { hours: 24 * 30, label: "Last 30 days" },
  { hours: 24 * 90, label: "Last 90 days" },
];

/** Owner → Errors: every server error (5xx) with a plain-English explanation. */
export default function OwnerErrors() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestId = searchParams.get("request_id") || "";
  const selectedId = searchParams.get("id") || "";
  const [sinceHours, setSinceHours] = useState(requestId ? 24 * 90 : 24);
  const [query, setQuery] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setError("");
    getOwnerErrors({ since_hours: sinceHours, q: query.trim(), request_id: requestId, limit: 200 })
      .then((json) => {
        setData(json);
        if (requestId && !selectedId && json.events?.[0]) {
          setSearchParams({ request_id: requestId, id: String(json.events[0].id) }, { replace: true });
        }
      })
      .catch((err) => setError(formatApiErrorForDisplay(err)))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sinceHours, query, requestId]);

  const select = (id) => setSearchParams(requestId ? { request_id: requestId, id: String(id) } : { id: String(id) });

  return (
    <OwnerLayout
      title="Errors"
      actions={(
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <select value={sinceHours} onChange={(e) => setSinceHours(Number(e.target.value))} style={inputStyle} aria-label="Time range">
            {RANGES.map((r) => <option key={r.hours} value={r.hours}>{r.label}</option>)}
          </select>
          <input value={query} placeholder="Search path or message" onChange={(e) => setQuery(e.target.value)} style={inputStyle} aria-label="Search errors" />
        </div>
      )}
    >
      {error ? <Banner tone="error">{error}</Banner> : null}
      {requestId ? (
        <Banner tone="info">
          Showing request <code>{requestId}</code>.{" "}
          <button type="button" onClick={() => setSearchParams({})} style={linkButton}>Show all errors</button>
        </Banner>
      ) : null}
      {data && data.available === false ? (
        <Banner tone="info">The error log is not set up yet (migration 0362). Error emails still arrive.</Banner>
      ) : null}

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 18 }}>
        <div className="owner-responsive-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(160px, 1fr))", gap: 14 }}>
          <Metric label="Errors in range" value={loading ? null : data?.summary?.total} />
          <Metric label="Last hour" value={loading ? null : data?.summary?.last_hour} />
          <Metric label="Different kinds" value={loading ? null : data?.summary?.kinds} />
        </div>

        {selectedId ? <ErrorDetail id={selectedId} onClose={() => setSearchParams(requestId ? { request_id: requestId } : {})} onSelect={select} /> : null}

        <PageCard style={{ padding: 22 }}>
          <SectionTitle title="By kind" subtitle="Same error on the same route, grouped. Click to see the latest one." />
          {loading ? <Loading /> : !data?.groups?.length ? (
            <EmptyState>No server errors in this range.</EmptyState>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={tableStyle}>
                <thead><tr>{["Error", "Route", "Count", "Last seen"].map((h) => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                <tbody>
                  {data.groups.map((g) => (
                    <tr key={g.fingerprint} onClick={() => select(g.latest_id)} style={{ cursor: "pointer" }}>
                      <td style={tdStyle}><CodeBadge code={g.code} /> <span style={{ color: "#344054" }}>{g.title}</span></td>
                      <td style={{ ...tdStyle, fontFamily: monoFont, fontSize: 13 }}>{g.method} {g.route_pattern}</td>
                      <td style={tdStyle}>{g.count}</td>
                      <td style={tdStyle}>{formatDate(g.last_seen)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </PageCard>

        <PageCard style={{ padding: 22 }}>
          <SectionTitle title="Every error" subtitle="Newest first. Click a row for the full explanation." />
          {loading ? <Loading /> : !data?.events?.length ? (
            <EmptyState>No server errors in this range.</EmptyState>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={tableStyle}>
                <thead><tr>{["When", "Error", "Route", "Who", "What they saw", "Emailed"].map((h) => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                <tbody>
                  {data.events.map((e) => (
                    <tr key={e.id} onClick={() => select(e.id)} style={{ cursor: "pointer", background: String(e.id) === selectedId ? "#fff6ef" : undefined }}>
                      <td style={tdStyle}>{formatDate(e.occurred_at)}</td>
                      <td style={tdStyle}><CodeBadge code={e.code} /> <span style={{ color: "#667085" }}>{e.status}</span></td>
                      <td style={{ ...tdStyle, fontFamily: monoFont, fontSize: 13 }}>{e.method} {e.path}</td>
                      <td style={tdStyle}>{actorLabel(e)}</td>
                      <td style={tdStyle}>{e.public_message || "—"}</td>
                      <td style={tdStyle}>{e.emailed ? "Yes" : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </PageCard>
      </div>
    </OwnerLayout>
  );
}

function ErrorDetail({ id, onClose, onSelect }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const panelRef = useRef(null);

  useEffect(() => {
    setData(null);
    setError("");
    panelRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
    getOwnerError(id).then(setData).catch((err) => setError(formatApiErrorForDisplay(err)));
  }, [id]);

  const e = data?.event;
  const x = e?.explanation;
  return (
    <div ref={panelRef} style={{ scrollMarginTop: 16 }}>
    <PageCard style={{ padding: 22, border: "1px solid #f0c9b3" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
        <div style={{ minWidth: 0 }}>
          {e ? <CodeBadge code={e.code} /> : null}
          <h2 style={{ fontSize: 19, margin: "8px 0 4px", overflowWrap: "anywhere" }}>{x?.headline || "Loading…"}</h2>
          {e ? <div style={{ color: "#667085", fontSize: 13 }}>{formatDate(e.occurred_at)} · HTTP {e.status} · {data.counts?.last_24h ?? 0} in the last 24 hours ({data.counts?.total ?? 0} total)</div> : null}
        </div>
        <button type="button" onClick={onClose} style={closeButton} aria-label="Close details">Close</button>
      </div>
      {error ? <Banner tone="error">{error}</Banner> : null}
      {x ? (
        <div style={{ display: "grid", gap: 14, marginTop: 16 }}>
          <Field label="What happened">{x.what_happened}</Field>
          <Field label="What it means">{x.meaning}</Field>
          <Field label="Likely cause">{x.likely_cause}</Field>
          {x.server_detail ? (
            <Field label="Server detail">
              <pre style={preStyle}>{x.server_detail}{e.internal_code ? `\n\ninternal code: ${e.internal_code}` : ""}</pre>
            </Field>
          ) : null}
          <Field label="What to do">
            <ol style={{ margin: 0, paddingLeft: 20 }}>{x.what_to_do.map((step) => <li key={step} style={{ marginBottom: 4 }}>{step}</li>)}</ol>
          </Field>
          <Field label="Request">
            <div style={{ fontFamily: monoFont, fontSize: 13, display: "grid", gap: 4 }}>
              <span>{e.method} {e.path}</span>
              <span>request id: <span style={{ userSelect: "all" }}>{e.request_id || "—"}</span></span>
              <span>who: {actorLabel(e)}{e.user_agent ? ` · ${e.user_agent}` : ""}</span>
              <span>emailed: {e.emailed ? "yes" : "no (same kind was emailed within the hour)"}</span>
            </div>
          </Field>
          {data.similar?.length ? (
            <Field label="Same error, earlier">
              <div style={{ display: "grid", gap: 4 }}>
                {data.similar.map((s) => (
                  <button key={s.id} type="button" onClick={() => onSelect(s.id)} style={{ ...linkButton, textAlign: "left" }}>
                    {formatDate(s.occurred_at)} · {s.path}
                  </button>
                ))}
              </div>
            </Field>
          ) : null}
        </div>
      ) : null}
    </PageCard>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#667085", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14, color: "#1d2939", lineHeight: 1.5, overflowWrap: "anywhere" }}>{children}</div>
    </div>
  );
}

function CodeBadge({ code }) {
  return <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 999, background: "#fff1ef", color: "#8b2e1a", fontFamily: monoFont, fontSize: 12, fontWeight: 700 }}>{code}</span>;
}

function Metric({ label, value }) {
  return <PageCard style={{ padding: 18 }}><div style={{ fontSize: 12, fontWeight: 700 }}>{label}</div><div style={{ fontSize: 28, fontWeight: 800, marginTop: 10 }}>{value ?? "—"}</div></PageCard>;
}

function Banner({ tone, children }) {
  const colors = tone === "error" ? { background: "#fff1ef", color: "#8b2e1a" } : { background: "#eef4ff", color: "#1d3a8a" };
  return <div style={{ marginBottom: 16, padding: "12px 14px", borderRadius: 12, ...colors }}>{children}</div>;
}

function Loading() {
  return <div style={{ padding: 32, textAlign: "center", color: "#667085", fontSize: 14 }}>Loading errors…</div>;
}

function actorLabel(e) {
  if (!e.actor_type || e.actor_type === "guest") return "Not signed in";
  return `${e.actor_type}${e.actor_id ? ` #${e.actor_id}` : ""}`;
}

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

const monoFont = "ui-monospace, SFMono-Regular, Menlo, monospace";
const inputStyle = { padding: "10px 12px", borderRadius: 12, border: "1px solid #d7c5b8", background: "#fff" };
const tableStyle = { width: "100%", borderCollapse: "collapse" };
const thStyle = { textAlign: "left", padding: "0 12px 12px 0", fontSize: 12, color: "#667085" };
const tdStyle = { padding: "12px 12px 12px 0", borderTop: "1px solid #ead9ce", fontSize: 14, verticalAlign: "top" };
const preStyle = { margin: 0, whiteSpace: "pre-wrap", background: "#f4f4f5", padding: 10, borderRadius: 8, fontSize: 12, fontFamily: monoFont };
const linkButton = { background: "none", border: 0, padding: 0, color: "#9f3a22", fontWeight: 700, cursor: "pointer", font: "inherit" };
const closeButton = { padding: "8px 14px", borderRadius: 10, border: "1px solid #d7c5b8", background: "#fff", cursor: "pointer" };
