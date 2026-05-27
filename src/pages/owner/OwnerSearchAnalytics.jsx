import React, { useEffect, useState } from "react";
import OwnerLayout, { EmptyState, PageCard, SectionTitle } from "./OwnerLayout.jsx";
import { getOwnerSearchAnalytics } from "../../lib/ownerApi.js";

export default function OwnerSearchAnalytics() {
  const [filters, setFilters] = useState(() => defaultRange());
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getOwnerSearchAnalytics(filters).then(setData).catch(() => setError("Owner dashboard data is temporarily unavailable."));
  }, [filters]);

  return (
    <OwnerLayout title="Search Analytics" actions={<DateFilters value={filters} onChange={setFilters} />}>
      {error ? <ErrorBanner message={error} /> : null}
      {!data?.available ? <EmptyState>{data?.reason || "Search analytics are not available yet."}</EmptyState> : (
        <div style={{ display: "grid", gap: 18 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(220px, 1fr))", gap: 14 }}>
            <MetricCard label="Total Searches" value={data?.totals?.total_searches} />
            <MetricCard label="Zero-Result Searches" value={data?.totals?.zero_result_searches} />
          </div>

          <PageCard style={{ padding: 22 }}>
            <SectionTitle title="Searches by Day" subtitle="Daily search volume in the selected range." />
            <SimpleTable rows={data?.searches_by_day || []} columns={[["Day", "day"], ["Searches", "searches"]]} />
          </PageCard>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
            <PageCard style={{ padding: 22 }}>
              <SectionTitle title="Top Queries" subtitle="Most common searches across the platform." />
              <SimpleTable rows={data?.top_queries || []} columns={[["Query", "query"], ["Count", "count"]]} />
            </PageCard>
            <PageCard style={{ padding: 22 }}>
              <SectionTitle title="Zero Results" subtitle="High-priority queries where search is failing." />
              <SimpleTable rows={data?.zero_result_queries || []} columns={[["Query", "query"], ["Count", "count"]]} />
            </PageCard>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
            <PageCard style={{ padding: 22 }}>
              <SectionTitle title="Searches by Session" subtitle="Anonymous session visibility where tracked." />
              <SimpleTable rows={data?.searches_by_session || []} columns={[["Session", "session_id"], ["Count", "count"]]} />
            </PageCard>
            <PageCard style={{ padding: 22 }}>
              <SectionTitle title="Searches by Location" subtitle="City/state derived from tracked search payloads." />
              <SimpleTable rows={data?.searches_by_location || []} columns={[["Location", "location_label"], ["Count", "count"]]} />
            </PageCard>
          </div>

          <PageCard style={{ padding: 22 }}>
            <SectionTitle title="Tracking Limitations" subtitle="Current gaps are explicit so the owner view stays honest." />
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {(data?.tracked_limitations || []).map((item) => <li key={item} style={{ marginBottom: 8 }}>{item}</li>)}
            </ul>
          </PageCard>
        </div>
      )}
    </OwnerLayout>
  );
}

function MetricCard({ label, value }) {
  return <PageCard style={{ padding: 18 }}><div style={{ fontSize: 12, fontWeight: 700 }}>{label}</div><div style={{ fontSize: 28, fontWeight: 800, marginTop: 10 }}>{value ?? "N/A"}</div></PageCard>;
}

function DateFilters({ value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 10 }}>
      <input type="date" value={value.from} onChange={(e) => onChange((cur) => ({ ...cur, from: e.target.value }))} style={inputStyle} />
      <input type="date" value={value.to} onChange={(e) => onChange((cur) => ({ ...cur, to: e.target.value }))} style={inputStyle} />
    </div>
  );
}

function SimpleTable({ rows, columns }) {
  if (!rows.length) return <EmptyState>No rows for this range.</EmptyState>;
  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead><tr>{columns.map(([label]) => <th key={label} style={thStyle}>{label}</th>)}</tr></thead>
      <tbody>{rows.map((row, index) => <tr key={index}>{columns.map(([label, key]) => <td key={label} style={tdStyle}>{row[key] ?? "N/A"}</td>)}</tr>)}</tbody>
    </table>
  );
}

function ErrorBanner({ message }) {
  return <div style={{ marginBottom: 16, padding: "12px 14px", borderRadius: 12, background: "#fff1ef", color: "#8b2e1a" }}>{message}</div>;
}

const inputStyle = { padding: "10px 12px", borderRadius: 12, border: "1px solid #d7c5b8", background: "#fff" };
const thStyle = { textAlign: "left", padding: "0 0 12px", fontSize: 12, color: "#667085" };
const tdStyle = { padding: "12px 0", borderTop: "1px solid #ead9ce", fontSize: 14 };

function defaultRange() {
  const today = new Date();
  const prior = new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000);
  return { from: prior.toISOString().slice(0, 10), to: today.toISOString().slice(0, 10) };
}
