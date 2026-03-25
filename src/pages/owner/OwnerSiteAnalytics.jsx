import React, { useEffect, useState } from "react";
import OwnerLayout, { EmptyState, PageCard, SectionTitle } from "./OwnerLayout.jsx";
import { getOwnerTrafficAnalytics } from "../../lib/ownerApi.js";

export default function OwnerSiteAnalytics() {
  const [filters, setFilters] = useState(() => defaultRange());
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getOwnerTrafficAnalytics(filters).then(setData).catch((err) => setError(err.message || "Unable to load traffic analytics"));
  }, [filters]);

  return (
    <OwnerLayout title="Site Analytics" actions={<DateFilters value={filters} onChange={setFilters} />}>
      {error ? <ErrorBanner message={error} /> : null}
      {!data?.available ? <EmptyState>{data?.reason || "Traffic data is not available yet."}</EmptyState> : (
        <div style={{ display: "grid", gap: 18 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(220px, 1fr))", gap: 14 }}>
            <MetricCard label="Total Visits" value={data?.totals?.total_visits} />
            <MetricCard label="Unique Sessions" value={data?.totals?.unique_sessions} />
          </div>

          <PageCard style={{ padding: 22 }}>
            <SectionTitle title="Visits by Day" subtitle="Tracked page visits over time." />
            <SimpleTable rows={data?.series || []} columns={[["Day", "day"], ["Visits", "visits"]]} />
          </PageCard>

          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 18 }}>
            <PageCard style={{ padding: 22 }}>
              <SectionTitle title="Top Pages" subtitle="Most visited paths in the selected window." />
              <SimpleTable rows={data?.top_pages || []} columns={[["Path", "path"], ["Visits", "visits"]]} />
            </PageCard>
            <PageCard style={{ padding: 22 }}>
              <SectionTitle title="Referrals" subtitle="Direct and known referrers." />
              <SimpleTable rows={data?.referral_sources || []} columns={[["Source", "source"], ["Visits", "visits"]]} />
            </PageCard>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(240px, 1fr))", gap: 18 }}>
            <PageCard style={{ padding: 22 }}>
              <SectionTitle title="Devices" subtitle="Basic device-type summary from captured visits." />
              <SimpleTable rows={data?.device_summary || []} columns={[["Device", "device_type"], ["Visits", "visits"]]} />
            </PageCard>
            <PageCard style={{ padding: 22 }}>
              <SectionTitle title="Locations" subtitle="Location fields only appear when the client sends them." />
              <SimpleTable rows={data?.location_summary || []} columns={[["Location", "location_label"], ["Visits", "visits"]]} />
            </PageCard>
          </div>
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
  if (!rows.length) return <EmptyState>No tracked rows for this range.</EmptyState>;
  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead><tr>{columns.map(([label]) => <th key={label} style={thStyle}>{label}</th>)}</tr></thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={index}>{columns.map(([label, key]) => <td key={label} style={tdStyle}>{row[key] ?? "N/A"}</td>)}</tr>
        ))}
      </tbody>
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
