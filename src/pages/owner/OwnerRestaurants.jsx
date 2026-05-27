import React, { useEffect, useState } from "react";
import OwnerLayout, { EmptyState, PageCard, SectionTitle } from "./OwnerLayout.jsx";
import { getOwnerRestaurantSignups } from "../../lib/ownerApi.js";

export default function OwnerRestaurants() {
  const [filters, setFilters] = useState(() => ({ ...defaultRange(), city: "", state: "", claimed: "0" }));
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== ""));
    getOwnerRestaurantSignups(params).then(setData).catch(() => setError("Owner dashboard data is temporarily unavailable."));
  }, [filters]);

  return (
    <OwnerLayout title="Restaurant Profile" actions={<Filters value={filters} onChange={setFilters} />}>
      {error ? <ErrorBanner message={error} /> : null}
      {!data?.available ? <EmptyState>{data?.reason || "Restaurant signup data is not available."}</EmptyState> : (
        <div style={{ display: "grid", gap: 18 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(180px, 1fr))", gap: 14 }}>
            <MetricCard label="Total Profiles" value={data?.summary?.total_signups} />
            <MetricCard label="Claimed" value={data?.summary?.claimed_restaurants} />
            <PaidSubscribersCard
              annual={data?.summary?.paid_subscribers_annual}
              monthly={data?.summary?.paid_subscribers_monthly}
            />
            <MetricCard label="Free / Verified" value={data?.summary?.non_pro_signups} />
          </div>

          <PageCard style={{ padding: 22 }}>
            <SectionTitle title="Signup Trend" subtitle="Restaurants created in the selected date range." />
            <SimpleTable rows={data?.signups_by_day || []} columns={[["Day", "day"], ["Signups", "signups"]]} />
          </PageCard>

          <PageCard style={{ padding: 22 }}>
            <SectionTitle
              title="Latest Onboarding Activity"
              subtitle={data?.source_tracking?.native_signup_source ? "Using signup_source when present." : "Falling back to current available source fields."}
            />
            <SimpleTable
              rows={data?.latest_restaurants || []}
              columns={[
                ["Restaurant", "restaurant_name"],
                ["City", "city"],
                ["State", "state"],
                ["Created", "created_at"],
                ["Claim Status", "claim_status"],
                ["Plan", "profile_tier"],
                ["Source", "signup_source"],
                ["Onboarding", "onboarding_status"],
              ]}
            />
          </PageCard>
        </div>
      )}
    </OwnerLayout>
  );
}

function Filters({ value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
      <input type="date" value={value.from} onChange={(e) => onChange((cur) => ({ ...cur, from: e.target.value }))} style={inputStyle} />
      <input type="date" value={value.to} onChange={(e) => onChange((cur) => ({ ...cur, to: e.target.value }))} style={inputStyle} />
      <input value={value.city} placeholder="City" onChange={(e) => onChange((cur) => ({ ...cur, city: e.target.value }))} style={inputStyle} />
      <input value={value.state} placeholder="State" onChange={(e) => onChange((cur) => ({ ...cur, state: e.target.value }))} style={{ ...inputStyle, width: 90 }} />
      <select value={value.claimed} onChange={(e) => onChange((cur) => ({ ...cur, claimed: e.target.value }))} style={inputStyle}>
        <option value="0">All claims</option>
        <option value="1">Claimed only</option>
      </select>
    </div>
  );
}

function MetricCard({ label, value }) {
  return <PageCard style={{ padding: 18 }}><div style={{ fontSize: 12, fontWeight: 700 }}>{label}</div><div style={{ fontSize: 28, fontWeight: 800, marginTop: 10 }}>{value ?? "N/A"}</div></PageCard>;
}

function PaidSubscribersCard({ annual, monthly }) {
  return (
    <PageCard style={{ padding: 18 }}>
      <div style={{ fontSize: 12, fontWeight: 700 }}>Paid Subscribers</div>
      <div style={{ fontSize: 16, fontWeight: 700, marginTop: 12, lineHeight: 1.5 }}>
        Annual: {annual ?? "N/A"} / Monthly: {monthly ?? "N/A"}
      </div>
    </PageCard>
  );
}

function SimpleTable({ rows, columns }) {
  if (!rows.length) return <EmptyState>No matching restaurants in this range.</EmptyState>;
  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead><tr>{columns.map(([label]) => <th key={label} style={thStyle}>{label}</th>)}</tr></thead>
      <tbody>{rows.map((row, index) => <tr key={`${row.id || index}`}>{columns.map(([label, key]) => <td key={label} style={tdStyle}>{row[key] ?? "N/A"}</td>)}</tr>)}</tbody>
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
  const prior = new Date(today.getTime() - 59 * 24 * 60 * 60 * 1000);
  return { from: prior.toISOString().slice(0, 10), to: today.toISOString().slice(0, 10) };
}
