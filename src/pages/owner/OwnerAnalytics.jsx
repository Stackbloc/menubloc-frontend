import React, { useEffect, useMemo, useState } from "react";
import OwnerLayout, { EmptyState, OWNER_COLORS, PageCard, SectionTitle } from "./OwnerLayout.jsx";
import {
  downloadOwnerAnalyticsCampaignPdf,
  downloadOwnerAnalyticsCampaignsCsv,
  downloadOwnerAnalyticsDailyCsv,
  getOwnerAnalyticsCampaigns,
  getOwnerAnalyticsHub,
} from "../../lib/ownerApi.js";
import NetworksTab from "./OwnerAnalyticsNetworks.jsx";
import NetworkValueTab from "./OwnerAnalyticsNetworkValue.jsx";

// Owner Analytics: one page, aggregates only. Days are America/Los_Angeles; the backend owns every definition.
const TABS = [
  ["scorecard", "Scorecard"],
  ["audience", "Audience"],
  ["engagement", "Engagement & Retention"],
  ["discovery", "Restaurant Discovery"],
  ["social", "Social & Wall"],
  ["networks", "Networks"],
  ["network_value", "Network Value & Rewards"],
  ["advertising", "Advertising"],
  ["reports", "Reports & Exports"],
];
const GRAINS = [["day", "Day"], ["week", "Week"], ["month", "Month"]];
const BAR = "#2563EB";
const MIN_PEOPLE = 5;

function laToday() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" }).format(new Date());
}
function shiftDay(day, n) {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
function defaultFilters() {
  const to = laToday();
  return { from: shiftDay(to, -27), to, cluster_id: 0, grain: "day" };
}

const num = (v) => (v == null ? "—" : Number(v).toLocaleString("en-US"));
const pct = (v) => (v == null ? "—" : `${v}%`);
const money = (cents) => (cents == null ? "—" : `$${(Number(cents) / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
const dollars = (v) => (v == null ? "—" : `$${Number(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
const people = (v) => (v == null ? "—" : Number(v) > 0 && Number(v) < MIN_PEOPLE ? `<${MIN_PEOPLE}` : num(v));
const FORMAT = { people, count: num, percent: pct, cents: money, dollars };

function saveBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function OwnerAnalytics() {
  const [filters, setFilters] = useState(defaultFilters);
  const [tab, setTab] = useState("scorecard");
  const [data, setData] = useState(null);
  const [campaigns, setCampaigns] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    setLoading(true);
    setError("");
    getOwnerAnalyticsHub(filters)
      .then((res) => live && setData(res))
      .catch(() => live && setError("Analytics are temporarily unavailable."))
      .finally(() => live && setLoading(false));
    return () => { live = false; };
  }, [filters]);

  useEffect(() => {
    if (tab !== "advertising" && tab !== "reports") return undefined;
    let live = true;
    setCampaigns(null);
    getOwnerAnalyticsCampaigns(filters)
      .then((res) => live && setCampaigns(res?.campaigns || []))
      .catch(() => live && setCampaigns([]));
    return () => { live = false; };
  }, [filters, tab]);

  const clusterName = useMemo(() => {
    if (!Number(filters.cluster_id)) return "Menuply-wide";
    return data?.clusters?.find((c) => Number(c.id) === Number(filters.cluster_id))?.name || "Cluster";
  }, [data, filters.cluster_id]);

  return (
    <OwnerLayout title="Analytics" actions={<Filters value={filters} onChange={setFilters} clusters={data?.clusters || []} />}>
      <Tabs value={tab} onChange={setTab} />
      {error ? <Banner tone="error">{error}</Banner> : null}
      {loading && !data ? (
        <div style={{ padding: 40, textAlign: "center", color: OWNER_COLORS.muted, fontSize: 14 }}>Loading analytics…</div>
      ) : data && data.available === false ? (
        <EmptyState>{data.reason || "Owner Analytics isn't enabled yet."}</EmptyState>
      ) : data ? (
        <div style={{ display: "grid", gap: 18, opacity: loading ? 0.6 : 1 }}>
          <div style={{ fontSize: 12, color: OWNER_COLORS.muted }}>
            {clusterName} · {data.range?.from} to {data.range?.to} (Los Angeles days) · compared with {data.previous_range?.from} to {data.previous_range?.to}
            {data.last_computed ? ` · data through ${data.last_computed}` : " · no computed days yet (first run is within the hour)"}
          </div>
          {tab === "scorecard" ? <Scorecard items={data.scorecard || []} /> : null}
          {tab === "audience" ? <Audience a={data.audience} grain={filters.grain} defs={data.definitions} /> : null}
          {tab === "engagement" ? <Engagement e={data.engagement} defs={data.definitions} /> : null}
          {tab === "discovery" ? <Discovery d={data.discovery} m={data.marketplace} grain={filters.grain} defs={data.definitions} /> : null}
          {tab === "social" ? <Social s={data.social} /> : null}
          {tab === "networks" ? <NetworksTab filters={filters} /> : null}
          {tab === "network_value" ? <NetworkValueTab filters={filters} /> : null}
          {tab === "advertising" ? <Advertising ad={data.advertising} campaigns={campaigns} filters={filters} defs={data.definitions} /> : null}
          {tab === "reports" ? <Reports filters={filters} campaigns={campaigns} defs={data.definitions} /> : null}
        </div>
      ) : null}
    </OwnerLayout>
  );
}

// ── Controls ──────────────────────────────────────────────────────────────────

function Filters({ value, onChange, clusters }) {
  const set = (patch) => onChange((cur) => ({ ...cur, ...patch }));
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
      <select aria-label="Cluster" value={value.cluster_id} onChange={(e) => set({ cluster_id: Number(e.target.value) })} style={inputStyle}>
        <option value={0}>Menuply-wide</option>
        {clusters.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <input aria-label="From" type="date" value={value.from} max={value.to} onChange={(e) => e.target.value && set({ from: e.target.value })} style={inputStyle} />
      <input aria-label="To" type="date" value={value.to} min={value.from} onChange={(e) => e.target.value && set({ to: e.target.value })} style={inputStyle} />
      <Segmented options={GRAINS} value={value.grain} onChange={(grain) => set({ grain })} label="Group by" />
    </div>
  );
}

function Segmented({ options, value, onChange, label }) {
  return (
    <div role="radiogroup" aria-label={label} style={{ display: "inline-flex", background: "#EEF0F3", borderRadius: 999, padding: 3 }}>
      {options.map(([key, text]) => (
        <button key={key} type="button" role="radio" aria-checked={value === key} onClick={() => onChange(key)}
          style={{ border: 0, borderRadius: 999, padding: "6px 12px", fontSize: 13, fontWeight: 600, cursor: "pointer",
            background: value === key ? "#fff" : "transparent", color: value === key ? OWNER_COLORS.ink : OWNER_COLORS.muted,
            boxShadow: value === key ? "0 1px 2px rgba(0,0,0,0.08)" : "none" }}>
          {text}
        </button>
      ))}
    </div>
  );
}

function Tabs({ value, onChange }) {
  return (
    <div role="tablist" style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
      {TABS.map(([key, text]) => (
        <button key={key} type="button" role="tab" aria-selected={value === key} onClick={() => onChange(key)}
          style={{ border: `1px solid ${value === key ? OWNER_COLORS.ink : OWNER_COLORS.line}`, borderRadius: 999, padding: "7px 14px",
            fontSize: 13, fontWeight: 600, cursor: "pointer", background: value === key ? OWNER_COLORS.ink : "#fff",
            color: value === key ? "#fff" : OWNER_COLORS.ink }}>
          {text}
        </button>
      ))}
    </div>
  );
}

function Banner({ children, tone = "info" }) {
  const styles = tone === "error" ? { background: "#fff1ef", color: "#8b2e1a" } : { background: "#F3F4F6", color: OWNER_COLORS.ink };
  return <div style={{ padding: "12px 14px", borderRadius: 12, fontSize: 13, ...styles }}>{children}</div>;
}

// ── Building blocks ───────────────────────────────────────────────────────────

const STATUS = {
  measured: { text: "Measured", bg: "#EEF0F3", fg: "#344054" },
  partial: { text: "Partial", bg: "#FEF3C7", fg: "#92400E" },
  not_measured: { text: "Not measured", bg: "#F3F4F6", fg: "#98A2B3" },
};

function StatusChip({ status }) {
  const s = STATUS[status] || STATUS.measured;
  return <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 999, background: s.bg, color: s.fg, whiteSpace: "nowrap" }}>{s.text}</span>;
}

function Change({ value, previous, unit }) {
  if (value == null || previous == null || typeof value !== "number") return null;
  if (unit === "percent") {
    const diff = Number((value - previous).toFixed(1));
    return <span style={{ color: OWNER_COLORS.muted }}>{diff > 0 ? "▲" : diff < 0 ? "▼" : "—"} {Math.abs(diff)} pts vs previous</span>;
  }
  if (!previous) return <span style={{ color: OWNER_COLORS.muted }}>Previous: {FORMAT[unit]?.(previous) ?? previous}</span>;
  const change = Math.round(((value - previous) / previous) * 100);
  return <span style={{ color: OWNER_COLORS.muted }}>{change > 0 ? "▲" : change < 0 ? "▼" : "—"} {Math.abs(change)}% vs previous</span>;
}

function Kpi({ label, value, unit = "count", previous = null, status = null, definition = null, note = null }) {
  const shown = status === "not_measured" ? "—" : (FORMAT[unit] || num)(value);
  return (
    <PageCard style={{ padding: 16, display: "grid", gap: 8, alignContent: "start" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: OWNER_COLORS.ink }}>{label}</div>
        {status ? <StatusChip status={status} /> : null}
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: OWNER_COLORS.ink, fontVariantNumeric: "tabular-nums" }}>{shown}</div>
      <div style={{ fontSize: 12 }}>{status === "not_measured" ? null : <Change value={value} previous={previous} unit={unit} />}</div>
      {note ? <div style={{ fontSize: 12, color: OWNER_COLORS.muted }}>{note}</div> : null}
      {definition ? <div style={{ fontSize: 11, color: OWNER_COLORS.muted, lineHeight: 1.4 }}>{definition}</div> : null}
    </PageCard>
  );
}

function Grid({ children, min = 200 }) {
  return <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fill, minmax(${min}px, 1fr))`, gap: 14 }}>{children}</div>;
}

function Section({ title, subtitle, children, action }) {
  return (
    <PageCard style={{ padding: 20 }}>
      <SectionTitle title={title} subtitle={subtitle} action={action} />
      {children}
    </PageCard>
  );
}

/** Single-series bars: one hue, hover tooltip, table view for screen readers. */
function Trend({ title, rows = [], format = num }) {
  const [hover, setHover] = useState(null);
  if (!rows.length) return <EmptyState>No data for {title.toLowerCase()} in this range yet.</EmptyState>;
  const max = Math.max(1, ...rows.map((r) => Number(r.value) || 0));
  const h = 140;
  const w = Math.max(rows.length * 14, 280);
  const bw = w / rows.length;
  return (
    <div style={{ position: "relative" }}>
      <svg viewBox={`0 0 ${w} ${h + 18}`} width="100%" height={h + 18} preserveAspectRatio="none" role="img" aria-label={title}>
        <line x1="0" x2={w} y1={h} y2={h} stroke={OWNER_COLORS.line} strokeWidth="1" />
        {rows.map((r, i) => {
          const v = Number(r.value) || 0;
          const bh = v ? Math.max(2, (v / max) * (h - 8)) : 0;
          const x = i * bw + 1;
          const width = Math.max(1, bw - 2);
          return (
            <g key={r.bucket} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <rect x={i * bw} y="0" width={bw} height={h} fill="transparent" />
              {bh ? <path d={barPath(x, h - bh, width, bh, Math.min(4, width / 2))} fill={BAR} opacity={hover == null || hover === i ? 1 : 0.45} /> : null}
            </g>
          );
        })}
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: OWNER_COLORS.muted, marginTop: -14 }}>
        <span>{rows[0].bucket}</span><span>{rows[rows.length - 1].bucket}</span>
      </div>
      {hover != null ? (
        <div style={{ position: "absolute", top: 0, left: `${Math.min(80, ((hover + 0.5) / rows.length) * 100)}%`, background: "#fff",
          border: `1px solid ${OWNER_COLORS.line}`, borderRadius: 8, padding: "6px 8px", fontSize: 12, pointerEvents: "none",
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)", whiteSpace: "nowrap" }}>
          <div style={{ color: OWNER_COLORS.muted }}>{rows[hover].bucket}</div>
          <div style={{ fontWeight: 700, color: OWNER_COLORS.ink }}>{format(rows[hover].value)}</div>
        </div>
      ) : null}
      <table style={srOnly}>
        <caption>{title}</caption>
        <tbody>{rows.map((r) => <tr key={r.bucket}><th>{r.bucket}</th><td>{format(r.value)}</td></tr>)}</tbody>
      </table>
    </div>
  );
}

function barPath(x, y, w, h, r) {
  return `M${x},${y + h} V${y + r} Q${x},${y} ${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h} Z`;
}

function Table({ rows = [], columns, empty = "Nothing in this range yet." }) {
  if (!rows.length) return <EmptyState>{empty}</EmptyState>;
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead><tr>{columns.map(([label]) => <th key={label} style={thStyle}>{label}</th>)}</tr></thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>{columns.map(([label, get]) => <td key={label} style={tdStyle}>{typeof get === "function" ? get(row) : row[get] ?? "—"}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Definitions({ defs = {}, keys }) {
  const items = keys.filter((k) => defs[k]);
  if (!items.length) return null;
  return (
    <details style={{ fontSize: 12, color: OWNER_COLORS.muted }}>
      <summary style={{ cursor: "pointer", fontWeight: 600, color: OWNER_COLORS.ink }}>How these are measured</summary>
      <dl style={{ margin: "10px 0 0", display: "grid", gap: 8 }}>
        {items.map((k) => <div key={k}><dt style={{ fontWeight: 700, color: OWNER_COLORS.ink }}>{k.replace(/_/g, " ")}</dt><dd style={{ margin: 0 }}>{defs[k]}</dd></div>)}
      </dl>
    </details>
  );
}

// ── Tabs ──────────────────────────────────────────────────────────────────────

function Scorecard({ items }) {
  return (
    <>
      <Grid min={220}>{items.map(({ key, ...k }) => <Kpi key={key} {...k} />)}</Grid>
      <div style={{ fontSize: 12, color: OWNER_COLORS.muted }}>
        Measured = fully tracked. Partial = some sources aren't reporting yet (for example the app). Not measured = no data source yet; never shown as zero.
      </div>
    </>
  );
}

function Audience({ a, grain, defs }) {
  if (!a) return null;
  const pops = [["registered", "Registered"], ["anonymous", "Anonymous visitors (devices)"], ["student", "Verified students"], ["nonstudent", "Not students"]];
  return (
    <>
      <Grid>
        <Kpi label="New registrations" value={a.registrations} unit="people" />
        <Kpi label="Student registrations" value={a.student_registrations} unit="people" />
        <Kpi label="Anonymous visitors" value={a.anonymous_visitors} unit="people" note="Devices, not people. Kept apart from registered users." />
        <Kpi label="Registered MAU incl. inferred" value={a.inferred_mau} unit="people" note="Adds activity tied to the cluster only through its restaurants." />
      </Grid>
      <Section title="Active users" subtitle="Latest day in range. DAU = that day; WAU = 7 days; MAU = 30 days. Bots, staff, admins and test accounts are excluded.">
        <Table rows={pops.map(([key, label]) => ({ label, ...(a.populations?.[key] || {}) }))}
          columns={[["Group", "label"], ["DAU", (r) => people(r.dau)], ["WAU", (r) => people(r.wau)], ["MAU", (r) => people(r.mau)]]} />
      </Section>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 18 }}>
        <Section title="Registered DAU" subtitle={`By ${grain}; the last day of each period.`}><Trend title="Registered DAU" rows={a.trends?.registered_dau} /></Section>
        <Section title="Registrations" subtitle={`By ${grain}.`}><Trend title="Registrations" rows={a.trends?.registrations} /></Section>
      </div>
      <Definitions defs={defs} keys={["active", "attribution", "registration_cluster", "anonymous"]} />
    </>
  );
}

function rate(n, d) {
  return d ? `${Math.round((n / d) * 100)}%` : "—";
}

function CohortTable({ rows }) {
  return (
    <Table rows={rows} empty="No registrations in the last 180 days."
      columns={[
        ["Cohort", "cohort"],
        ["Registered", (r) => people(r.members)],
        ["Engaged in 30 days", (r) => `${people(r.engaged)} (${rate(r.engaged, r.members)})`],
        ["D1", (r) => (r.retention?.d1?.eligible ? rate(r.retention.d1.retained, r.retention.d1.eligible) : "—")],
        ["D7", (r) => (r.retention?.d7?.eligible ? rate(r.retention.d7.retained, r.retention.d7.eligible) : "—")],
        ["D30", (r) => (r.retention?.d30?.eligible ? rate(r.retention.d30.retained, r.retention.d30.eligible) : "—")],
        ["Status", (r) => (r.status === "complete" ? "Complete" : "Provisional")],
      ]} />
  );
}

function Engagement({ e, defs }) {
  if (!e) return null;
  return (
    <>
      <Grid>
        <Kpi label="Engaged users" value={e.engaged_users} unit="people" note="Registered users with a qualifying action in range." />
        <Kpi label="Returning users" value={e.returning} unit="people" note="Active on 2+ different days in the last 30." />
      </Grid>
      <Section title="Verified students by registration cohort" subtitle="Engaged = 1+ qualifying action within 30 days of registering. Provisional until every member has had 30 days. Retention counts only people who've reached that day.">
        <CohortTable rows={e.student_cohorts} />
      </Section>
      <Section title="All registered users by cohort">
        <CohortTable rows={e.registered_cohorts} />
      </Section>
      <Definitions defs={defs} keys={["qualifying", "engaged", "student", "returning", "retention", "frozen"]} />
    </>
  );
}

function Discovery({ d, m, grain, defs }) {
  if (!d || !m) return null;
  return (
    <>
      <Grid>
        <Kpi label="Searches" value={d.searches} note={`${people(d.unique_searchers)} people searched`} />
        <Kpi label="Zero-result searches" value={d.zero} />
        <Kpi label="Search success" value={d.success_rate} unit="percent" note="Searches with results that led to a tap." />
        <Kpi label="Search abandonment" value={d.abandonment_rate} unit="percent" />
        <Kpi label="Search → menu" value={d.search_to_menu} unit="percent" />
        <Kpi label="Menu views" value={d.menu_views} note={`${people(d.unique_menu_viewers)} people`} />
        <Kpi label="Menu browses" value={d.menu_browses} note="A tap or 10 seconds on the menu." />
        <Kpi label="Dish views" value={d.dish_views} />
        <Kpi label="Restaurant actions" value={d.restaurant_actions} note="Directions, call, order, website." />
        <Kpi label="Menu → action" value={d.menu_to_action} unit="percent" />
      </Grid>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 18 }}>
        <Section title="Menu views" subtitle={`By ${grain}.`}><Trend title="Menu views" rows={d.trend_menu_views} /></Section>
        <Section title="Restaurant actions" subtitle={`By ${grain}.`}><Trend title="Restaurant actions" rows={d.trend_actions} /></Section>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 18 }}>
        <Section title="Most viewed dishes"><Table rows={d.dishes} columns={[["Dish", "name"], ["Restaurant", "restaurant"], ["Views", (r) => num(r.views)]]} /></Section>
        <Section title="Most viewed restaurants"><Table rows={d.restaurants} columns={[["Restaurant", "name"], ["Menu views", (r) => num(r.menu_views)], ["Actions", (r) => num(r.actions)]]} /></Section>
      </div>
      <Section title="Marketplace health" subtitle="Snapshot from the latest computed day.">
        <Grid min={170}>
          <Kpi label="Listings" value={m.listings} note={`${num(m.chain_listings)} chain locations`} />
          <Kpi label="Claimed" value={m.claimed} note={`${num(m.unclaimed)} unclaimed`} />
          <Kpi label="Usable menus" value={m.usable_menus} />
          <Kpi label="Fresh menus (90 days)" value={m.fresh_menus} />
          <Kpi label="Restaurants with activity" value={m.restaurants_with_activity} note={`${num(m.meaningful_restaurants)} with meaningful activity`} />
          <Kpi label="Top 10% share of actions" value={m.top_decile_share} unit="percent" />
          <Kpi label="Prices checked" value={m.mpi_checked} status={m.mpi_checked ? "partial" : "not_measured"}
            note={m.mpi_checked ? `${num(m.mpi_compliant)} matched · ${pct(m.price_coverage)} of items checked` : "No price checks recorded yet. Unchecked prices count as neither."} />
          <Kpi label="Restaurants advertising" value={m.ad_restaurants} />
        </Grid>
      </Section>
      <Definitions defs={defs} keys={["search_success", "zero_result", "abandonment", "search_to_menu", "browse", "dish_view", "menu_to_action", "restaurant_actions", "claim_rate", "usable_menu", "fresh_menu", "mpi"]} />
    </>
  );
}

function Social({ s }) {
  if (!s) return null;
  return (
    <Grid>
      <Kpi label="Wall visitors" value={s.wall_unique_visitors} unit="people" />
      <Kpi label="Wall opens" value={s.wall_opens} />
      <Kpi label="Wall posts" value={s.wall_posts} />
      <Kpi label="Wall interactions" value={s.wall_interactions} note="Post opens, clip plays, shares." />
      <Kpi label="Visits from shared Wall links" value={s.wall_shared_visits} />
      <Kpi label="Wall → registration" value={s.wall_to_registration} unit="people" />
      <Kpi label="Wall → menu" value={s.wall_to_menu} unit="percent" />
      <Kpi label="Invites sent" value={s.invites_sent} />
      <Kpi label="Invite acceptance" value={s.invite_acceptance} unit="percent" note={`${num(s.invites_accepted)} accepted`} />
      <Kpi label="Open Invites" value={s.open_invites} />
      <Kpi label="Plan RSVPs" value={s.plan_rsvps} />
      <Kpi label="Socially referred sign-ups" value={s.social_registrations} unit="people" note="Only with a tracked invite, QR or shared link." />
      <FeedConversations f={s.feed_conversations} />
    </Grid>
  );
}

/** Feed comments (backend mig 0423). Cluster = the clip's restaurant's only cluster; removed comments and test diners left out. */
function FeedConversations({ f }) {
  if (!f) return null;
  return (
    <>
      <Kpi label="Feed comments" value={f.comments} note={`${num(f.replies)} replies`} />
      <Kpi label="People commenting" value={f.commenters} unit="people" note={`${num(f.first_time)} for the first time`} />
      <Kpi label="Repeat commenters" value={f.repeat} unit="people" note="Commented on 2+ different days." />
      <Kpi label="Came back to a conversation" value={f.conversation_returns} unit="people" note="Commented again, on a later day, on a clip they had already commented on." />
      <Kpi label="Clips with comments" value={f.posts} note={`${f.comments_per_post ?? "—"} comments and ${f.replies_per_post ?? "—"} replies per clip`} />
      <Kpi label="Viewers who comment" value={f.viewer_comment_rate} unit="percent" note={`Of ${num(f.viewers)} signed-in diners who watched a Feed clip 3+ s.`} />
    </>
  );
}

function Advertising({ ad, campaigns, filters, defs }) {
  if (!ad) return null;
  return (
    <>
      <Grid>
        <Kpi label="Served (paid)" value={ad.served} note={`${num(ad.house_served)} house ads`} />
        <Kpi label="Viewable (paid)" value={ad.viewable} />
        <Kpi label="Reach" value={ad.reach} unit="people" note={ad.frequency ? `${ad.frequency} views per person` : null} />
        <Kpi label="Clicks" value={ad.clicks} note={`CTR ${pct(ad.ctr)}`} />
        <Kpi label="Sold fill" value={ad.sold_fill} unit="percent" note={`${num(ad.sold_share_days)} of ${num(ad.available_share_days)} share-days sold`} />
        <Kpi label="Paid delivery share" value={ad.delivery_fill} unit="percent" />
        <Kpi label="eCPM" value={ad.ecpm} unit="dollars" note="Recognized revenue per 1,000 served." />
        <Kpi label="Paying advertisers" value={ad.active_paying_advertisers} />
      </Grid>
      <Section title="Revenue" subtitle="Gross = charged on payment day. Collected = gross minus refunds. Recognized = earned over each campaign's run.">
        <Grid min={170}>
          <Kpi label="Gross sales" value={ad.gross_cents} unit="cents" />
          <Kpi label="Collected" value={ad.collected_cents} unit="cents" />
          <Kpi label="Recognized" value={ad.recognized_cents} unit="cents" />
        </Grid>
        <div style={{ height: 14 }} />
        <Table rows={ad.by_placement} empty="No paid placements in this range."
          columns={[["Placement", "placement"], ["Gross", (r) => money(r.gross)], ["Refunds", (r) => money(r.refunds)], ["Recognized", (r) => money(r.recognized)]]} />
      </Section>
      <CampaignSection campaigns={campaigns} filters={filters} />
      <Definitions defs={defs} keys={["impressions", "reach", "ctr", "cpm", "ecpm", "fill", "conversion", "attributed", "gross", "collected", "recognized"]} />
    </>
  );
}

function CampaignSection({ campaigns, filters }) {
  const [busy, setBusy] = useState("");
  const pdf = async (c) => {
    setBusy(`${c.kind}:${c.id}`);
    try {
      saveBlob(await downloadOwnerAnalyticsCampaignPdf(c.kind, c.id, filters), `menuply-campaign-${c.id}-${filters.from}-to-${filters.to}.pdf`);
    } catch {
      window.alert("The report couldn't be made. Try again.");
    } finally {
      setBusy("");
    }
  };
  return (
    <Section title="Campaigns" subtitle="Paid sponsorships and sold billboards. Cost is the share of the actual charge for days in range. Conversions are actions at the advertised restaurant within 7 days of a click on the same device. They are not purchases or visits.">
      {campaigns == null ? <div style={{ fontSize: 13, color: OWNER_COLORS.muted }}>Loading campaigns…</div> : (
        <Table rows={campaigns} empty="No paid campaigns ran in this range."
          columns={[
            ["Campaign", (r) => <div><div style={{ fontWeight: 600 }}>{r.name || "Untitled"}</div><div style={{ fontSize: 12, color: OWNER_COLORS.muted }}>{[r.advertiser, r.placement].filter(Boolean).join(" · ")}</div></div>],
            ["Dates", (r) => `${r.start_day || "?"} – ${r.end_day || "?"}`],
            ["Reach", (r) => people(r.reach)],
            ["Served", (r) => num(r.served)],
            ["Viewable", (r) => num(r.viewable)],
            ["Clicks", (r) => num(r.clicks)],
            ["CTR", (r) => pct(r.ctr)],
            ["Cost", (r) => money(r.cost_cents)],
            ["CPM", (r) => dollars(r.cpm)],
            ["CPC", (r) => dollars(r.cpc)],
            ["Conversions", (r) => num(r.attributed_conversions)],
            ["", (r) => <button type="button" disabled={busy === `${r.kind}:${r.id}`} onClick={() => pdf(r)} style={smallButton}>{busy === `${r.kind}:${r.id}` ? "Making…" : "PDF"}</button>],
          ]} />
      )}
    </Section>
  );
}

function Reports({ filters, campaigns, defs }) {
  const [busy, setBusy] = useState("");
  const run = async (key, fn, name) => {
    setBusy(key);
    try {
      saveBlob(await fn(filters), name);
    } catch {
      window.alert("The download didn't work. Try again.");
    } finally {
      setBusy("");
    }
  };
  return (
    <>
      <Section title="Downloads" subtitle="Aggregates only. No names, emails or individual activity are included.">
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button type="button" style={smallButton} disabled={busy === "daily"}
            onClick={() => run("daily", downloadOwnerAnalyticsDailyCsv, `menuply-analytics-${filters.from}-to-${filters.to}.csv`)}>
            {busy === "daily" ? "Preparing…" : "Daily metrics (CSV)"}
          </button>
          <button type="button" style={smallButton} disabled={busy === "campaigns"}
            onClick={() => run("campaigns", downloadOwnerAnalyticsCampaignsCsv, `menuply-campaigns-${filters.from}-to-${filters.to}.csv`)}>
            {busy === "campaigns" ? "Preparing…" : "Campaigns (CSV)"}
          </button>
        </div>
      </Section>
      <CampaignSection campaigns={campaigns} filters={filters} />
      <Section title="Definitions">
        <dl style={{ margin: 0, display: "grid", gap: 10, fontSize: 13 }}>
          {Object.entries(defs || {}).map(([k, v]) => (
            <div key={k}><dt style={{ fontWeight: 700, color: OWNER_COLORS.ink }}>{k.replace(/_/g, " ")}</dt><dd style={{ margin: 0, color: OWNER_COLORS.muted }}>{v}</dd></div>
          ))}
        </dl>
      </Section>
    </>
  );
}

const inputStyle = { border: `1px solid ${OWNER_COLORS.line}`, borderRadius: 10, padding: "7px 10px", fontSize: 13, background: "#fff", color: OWNER_COLORS.ink };
const smallButton = { border: `1px solid ${OWNER_COLORS.line}`, borderRadius: 999, padding: "6px 14px", fontSize: 13, fontWeight: 600, background: "#fff", color: OWNER_COLORS.ink, cursor: "pointer", whiteSpace: "nowrap" };
const thStyle = { textAlign: "left", padding: "8px 10px", fontSize: 12, color: OWNER_COLORS.muted, fontWeight: 600, borderBottom: `1px solid ${OWNER_COLORS.line}`, whiteSpace: "nowrap" };
const tdStyle = { padding: "9px 10px", borderBottom: `1px solid #F0F1F3`, color: OWNER_COLORS.ink, verticalAlign: "top", fontVariantNumeric: "tabular-nums" };
const srOnly = { position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap" };

// Shared with the Networks tab (OwnerAnalyticsNetworks.jsx).
export { Banner, Definitions, Grid, Kpi, Section, Segmented, Table, Trend, inputStyle, num, pct, smallButton, srOnly };
