/**
 * Restaurant engagement analytics (owner / manager of the selected restaurant).
 * Data: GET /operator/restaurants/:restaurantId/analytics — scoped server-side to this restaurant.
 */
import React, { useEffect, useState } from "react";
import OperatorLayout from "./OperatorLayout.jsx";
import { useOperator } from "../../context/OperatorContext.jsx";
import { getRestaurantEngagementAnalytics } from "../../lib/operatorApi.js";

function isoDay(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const PRESETS = [
  ["7 days", -6],
  ["30 days", -29],
  ["90 days", -89],
];

const CHANNEL_LABELS = {
  copy_link: "Link copied",
  native: "Phone share sheet",
  sms: "Text message",
  email: "Email",
  facebook: "Facebook",
  x: "X",
  whatsapp: "WhatsApp",
};

function social(entry, noun) {
  return entry ? `${entry.total_active} ${noun} total` : null;
}

const OUTBOUND_LABELS = { website: "Website", directions: "Directions", phone: "Phone", order: "External ordering link" };

export default function OperatorAnalyticsPage() {
  const { selectedRestaurant } = useOperator();
  const rid = selectedRestaurant?.id || null;
  const [range, setRange] = useState({ from: isoDay(-29), to: isoDay(0) });
  const requestKey = `${rid}|${range.from}|${range.to}`;
  const [state, setState] = useState({ key: null, error: "", data: null });

  useEffect(() => {
    if (!rid) return undefined;
    let cancelled = false;
    getRestaurantEngagementAnalytics(rid, range)
      .then((data) => !cancelled && setState({ key: requestKey, error: "", data }))
      .catch((err) => {
        if (cancelled) return;
        const message =
          err?.status === 403
            ? "Analytics are available to this restaurant's owners and managers."
            : "Analytics are temporarily unavailable.";
        setState({ key: requestKey, error: message, data: null });
      });
    return () => { cancelled = true; };
  }, [rid, range, requestKey]);

  const loading = Boolean(rid) && state.key !== requestKey;
  const payload = loading ? null : state.data;
  const rep = payload?.report;
  const o = rep?.overview || {};

  return (
    <OperatorLayout title="Analytics">
      <div data-testid="operator-analytics" style={{ maxWidth: 960, display: "grid", gap: 16 }}>
        <div style={{ fontSize: 14, color: "#5b6675", lineHeight: 1.5 }}>
          How diners found and used {selectedRestaurant?.restaurant_name || "your restaurant"} on Menuply.
          Only your restaurant&apos;s activity is shown.
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          {PRESETS.map(([label, offset]) => {
            const active = range.from === isoDay(offset) && range.to === isoDay(0);
            return (
              <button
                key={label}
                type="button"
                onClick={() => setRange({ from: isoDay(offset), to: isoDay(0) })}
                style={{ ...chipStyle, ...(active ? chipActiveStyle : null) }}
              >
                {label}
              </button>
            );
          })}
          <input type="date" value={range.from} max={range.to} onChange={(e) => e.target.value && setRange((r) => ({ ...r, from: e.target.value }))} style={dateStyle} aria-label="From" />
          <span style={{ color: "#5b6675" }}>to</span>
          <input type="date" value={range.to} min={range.from} onChange={(e) => e.target.value && setRange((r) => ({ ...r, to: e.target.value }))} style={dateStyle} aria-label="To" />
        </div>

        {!rid ? <Notice>Select a restaurant to see analytics.</Notice> : null}
        {loading ? <Notice>Loading analytics…</Notice> : null}
        {!loading && state.error ? <Notice tone="error">{state.error}</Notice> : null}
        {payload && payload.available === false ? <Notice>{payload.reason}</Notice> : null}

        {rep ? (
          <>
            <div style={grid}>
              <Metric label="Profile views" value={o.profile_views} />
              <Metric label="Menu views" value={o.menu_views} />
              <Metric label="Unique visitors" value={o.unique_visitors} note="Distinct browsers" />
              <Metric label="Menu item clicks" value={o.menu_item_clicks} note="Item details opened" />
              <Metric label="Profile → menu clicks" value={o.profile_to_menu_clicks} />
              <Metric label="Deal impressions / clicks" value={`${o.deal_impressions || 0} / ${o.deal_clicks || 0}`} />
              <Metric label="Cluster listing clicks" value={o.cluster_listing_clicks} note={`${o.cluster_listing_impressions || 0} listing impressions`} />
              <Metric label="Website, directions, phone, order" value={o.outbound_clicks} />
              <Metric label="Profile shares" value={o.profile_shares} />
              <Metric label="Menu shares" value={o.menu_shares} />
              <Metric label="Menu item shares" value={o.menu_item_shares} />
              <Metric label="Menu item likes" value={rep.social?.menu_item_likes?.in_period} note={social(rep.social?.menu_item_likes, "active likes")} />
              <Metric label="New followers" value={rep.social?.restaurant_follows?.in_period} note={social(rep.social?.restaurant_follows, "followers")} />
              <Metric label="Diner comments" value={rep.social?.diner_comments?.in_period} />
            </div>

            <Section title="Menu items by clicks" note="How often diners opened each item. Item views are not measured.">
              <Table
                rows={rep.menu_items}
                columns={[
                  ["Menu item", (r) => `${r.menu_item_name || "—"}${r.item_deleted ? " (removed)" : ""}`],
                  ["Clicks", (r) => r.clicks],
                  ["Unique diners", (r) => r.unique_clickers],
                  ["From clusters", (r) => r.cluster_clicks],
                ]}
                empty="No item clicks in this period."
              />
            </Section>

            <Section title="Traffic from clusters" note="Your listing on each cluster page, and your profile/menu activity within 30 minutes of a click from that cluster (same browser tab).">
              <Table
                rows={rep.cluster_traffic}
                columns={[
                  ["Cluster", (r) => r.cluster_name || `Cluster ${r.cluster_id}`],
                  ["Listing impressions", (r) => r.listing_impressions],
                  ["Listing clicks", (r) => r.listing_clicks],
                  ["Item clicks on cluster", (r) => r.menu_item_clicks_on_cluster],
                  ["Profile views after", (r) => r.attributed_profile_views],
                  ["Menu views after", (r) => r.attributed_menu_views],
                  ["Item clicks after", (r) => r.attributed_menu_item_clicks],
                ]}
                empty="No cluster traffic in this period."
              />
            </Section>

            <Section title="Deals" note="Impressions, detail views, and clicks. Redemptions are not measured.">
              <Table
                rows={rep.deals}
                columns={[
                  ["Deal", (r) => r.deal_title || `Deal ${r.deal_id}`],
                  ["Impressions", (r) => r.impressions],
                  ["Detail views", (r) => r.detail_views],
                  ["Clicks", (r) => r.clicks],
                  ["CTR", (r) => (r.ctr_pct == null ? "—" : `${r.ctr_pct}%`)],
                ]}
                empty="No deal activity in this period."
              />
            </Section>

            <Section title="Shares" note="Shared = link copied, device share sheet completed, or a text/email/social app opened. Menuply can't confirm the message was sent.">
              <Table
                rows={rep.shares?.by_channel}
                columns={[["Channel", (r) => CHANNEL_LABELS[r.channel] || r.channel], ["Shares", (r) => r.shares]]}
                empty="No shares in this period."
              />
              <div style={{ height: 12 }} />
              <Table
                rows={rep.shares?.top_items}
                columns={[["Most-shared item", (r) => r.menu_item_name || `Item ${r.menu_item_id}`], ["Shares", (r) => r.shares]]}
                empty="No menu item shares in this period."
              />
            </Section>

            <Section title="Most-liked items" note="Likes from signed-in diners in this period that are still active.">
              <Table
                rows={rep.social?.top_liked_items}
                columns={[["Menu item", (r) => r.menu_item_name || `Item ${r.menu_item_id}`], ["Likes", (r) => r.likes_in_period]]}
                empty="No likes in this period."
              />
            </Section>

            <Section title="Actions" note="Clicks only — completed calls, visits, or orders are not measured.">
              <Table
                rows={rep.outbound_clicks}
                columns={[
                  ["Action", (r) => OUTBOUND_LABELS[r.action] || r.action],
                  ["Clicks", (r) => r.clicks],
                ]}
                empty="No outbound clicks in this period."
              />
            </Section>

            <Section title="Menu categories selected">
              <Table rows={rep.categories} columns={[["Menu", (r) => r.category], ["Selections", (r) => r.selections]]} empty="No menu switches in this period." />
            </Section>

            <Section title="Where visits came from" note="'unknown' = direct, external, or not attributable.">
              <Table rows={rep.traffic_sources} columns={[["Source", (r) => r.source_page_type], ["Page views", (r) => r.page_views]]} empty="No visits in this period." />
            </Section>

            <Section title="Daily">
              <Table
                rows={rep.series}
                columns={[["Day", (r) => r.day], ["Profile views", (r) => r.profile_views], ["Menu views", (r) => r.menu_views], ["Item clicks", (r) => r.menu_item_clicks]]}
                empty="No activity in this period."
              />
            </Section>

            {payload.counting_rules?.length ? (
              <details style={{ fontSize: 13, color: "#5b6675" }}>
                <summary style={{ cursor: "pointer", fontWeight: 700 }}>How these numbers are counted</summary>
                <ul style={{ lineHeight: 1.55, paddingLeft: 18 }}>
                  {payload.counting_rules.map((rule) => <li key={rule}>{rule}</li>)}
                </ul>
              </details>
            ) : null}
          </>
        ) : null}
      </div>
    </OperatorLayout>
  );
}

function Metric({ label, value, note }) {
  return (
    <div style={card}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#5b6675" }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 800, marginTop: 6, color: "#101828" }}>{value ?? 0}</div>
      {note ? <div style={{ fontSize: 12, color: "#5b6675", marginTop: 4 }}>{note}</div> : null}
    </div>
  );
}

function Section({ title, note, children }) {
  return (
    <section style={card}>
      <div style={{ fontSize: 15, fontWeight: 800, color: "#101828" }}>{title}</div>
      {note ? <div style={{ fontSize: 12, color: "#5b6675", marginTop: 4, marginBottom: 10 }}>{note}</div> : <div style={{ height: 10 }} />}
      {children}
    </section>
  );
}

function Table({ rows, columns, empty }) {
  if (!rows?.length) return <div style={{ fontSize: 13, color: "#5b6675" }}>{empty}</div>;
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr>
            {columns.map(([label], i) => (
              <th key={label} style={{ ...th, textAlign: i === 0 ? "left" : "right" }}>{label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx}>
              {columns.map(([label, cell], i) => (
                <td key={label} style={{ ...td, textAlign: i === 0 ? "left" : "right" }}>{cell(row) ?? 0}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Notice({ children, tone }) {
  return (
    <div style={{ ...card, color: tone === "error" ? "#b91c1c" : "#5b6675", fontSize: 14 }}>{children}</div>
  );
}

const card = { background: "#fff", border: "1px solid #e4e7ec", borderRadius: 14, padding: 16, minWidth: 0 };
const grid = { display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" };
const th = { padding: "0 8px 8px", fontSize: 12, color: "#5b6675", whiteSpace: "nowrap", fontWeight: 700 };
const td = { padding: "10px 8px", borderTop: "1px solid #eef0f3", verticalAlign: "top" };
const chipStyle = { padding: "7px 12px", borderRadius: 999, border: "1px solid #d0d5dd", background: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" };
const chipActiveStyle = { borderColor: "#166534", background: "#ecfdf3", color: "#166534" };
const dateStyle = { padding: "7px 10px", borderRadius: 10, border: "1px solid #d0d5dd", fontSize: 13 };
