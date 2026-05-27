import React, { useEffect, useState } from "react";
import { useLanguage } from "../../context/LanguageContext.jsx";
import OwnerLayout, { EmptyState, PageCard, SectionTitle } from "./OwnerLayout.jsx";
import { getOwnerRevenueSummary } from "../../lib/ownerApi.js";

export default function OwnerRevenue() {
  const { t } = useLanguage();
  const [filters, setFilters] = useState(() => defaultRange());
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getOwnerRevenueSummary(filters).then(setData).catch(() => setError("Owner dashboard data is temporarily unavailable."));
  }, [filters]);

  return (
    <OwnerLayout title="Revenue" actions={<DateFilters value={filters} onChange={setFilters} />}>
      {error ? <ErrorBanner message={error} /> : null}
      {!data?.available ? <EmptyState>{data?.reason || "Revenue data is not available."}</EmptyState> : (
        <div style={{ display: "grid", gap: 18 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(150px, 1fr))", gap: 14 }}>
            <MetricCard label="Total Revenue" value={formatMoney(data?.summary?.total_revenue_cents)} />
            <MetricCard label="Booked Revenue" value={formatMoney(data?.summary?.booked_revenue_cents)} />
            <MetricCard label="MRR" value={formatMoney(data?.summary?.mrr_cents)} />
            <MetricCard label="ARR" value={formatMoney(data?.summary?.arr_cents)} />
            <MetricCard label="Failed Payments" value={data?.summary?.failed_payments} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
            <PageCard style={{ padding: 22 }}>
              <SectionTitle title="Revenue Trend" subtitle="Billing history grouped by month." />
              <SimpleTable rows={data?.revenue_trend || []} columns={[["Month", "month"], ["Amount", "amount_cents"]]} formatters={{ amount_cents: formatMoney }} />
            </PageCard>
            <PageCard style={{ padding: 22 }}>
              <SectionTitle title="Revenue by Source" subtitle="Plan and billing cycle breakdown." />
              <SimpleTable rows={data?.revenue_by_source || []} columns={[["Source", "source"], ["Cycle", "billing_cycle"], ["Payments", "payment_count"], ["Amount", "amount_cents"]]} formatters={{ amount_cents: formatMoney }} />
            </PageCard>
          </div>

          <PageCard style={{ padding: 22 }}>
            <SectionTitle title="Recent Payments" subtitle="Latest billing records captured by the backend." />
            <SimpleTable rows={data?.recent_payments || []} columns={[["Date", "billing_date"], ["Plan", "plan_name"], ["Operator", "operator_id"], ["Status", "status"], ["Amount", "amount_cents"], ["Description", "description"]]} formatters={{ amount_cents: formatMoney }} />
          </PageCard>
        </div>
      )}
    </OwnerLayout>
  );
}

function MetricCard({ label, value }) {
  return <PageCard style={{ padding: 18 }}><div style={{ fontSize: 12, fontWeight: 700 }}>{label}</div><div style={{ fontSize: 24, fontWeight: 800, marginTop: 10 }}>{value ?? "N/A"}</div></PageCard>;
}

function DateFilters({ value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 10 }}>
      <input type="date" value={value.from} onChange={(e) => onChange((cur) => ({ ...cur, from: e.target.value }))} style={inputStyle} />
      <input type="date" value={value.to} onChange={(e) => onChange((cur) => ({ ...cur, to: e.target.value }))} style={inputStyle} />
    </div>
  );
}

function SimpleTable({ rows, columns, formatters = {} }) {
  if (!rows.length) return <EmptyState>No billing records in this range.</EmptyState>;
  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead><tr>{columns.map(([label]) => <th key={label} style={thStyle}>{label}</th>)}</tr></thead>
      <tbody>{rows.map((row, index) => <tr key={index}>{columns.map(([label, key]) => <td key={label} style={tdStyle}>{formatters[key] ? formatters[key](row[key]) : (row[key] ?? "N/A")}</td>)}</tr>)}</tbody>
    </table>
  );
}

function ErrorBanner({ message }) {
  return <div style={{ marginBottom: 16, padding: "12px 14px", borderRadius: 12, background: "#fff1ef", color: "#8b2e1a" }}>{message}</div>;
}

function formatMoney(cents) {
  if (cents == null) return "N/A";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(cents || 0) / 100);
}

const inputStyle = { padding: "10px 12px", borderRadius: 12, border: "1px solid #d7c5b8", background: "#fff" };
const thStyle = { textAlign: "left", padding: "0 0 12px", fontSize: 12, color: "#667085" };
const tdStyle = { padding: "12px 0", borderTop: "1px solid #ead9ce", fontSize: 14 };

function defaultRange() {
  const today = new Date();
  const prior = new Date(today.getTime() - 89 * 24 * 60 * 60 * 1000);
  return { from: prior.toISOString().slice(0, 10), to: today.toISOString().slice(0, 10) };
}
