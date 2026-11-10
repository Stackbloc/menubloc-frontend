import React, { useCallback, useEffect, useState } from "react";
import { EmptyState, OWNER_COLORS } from "./OwnerLayout.jsx";
import {
  addOwnerNetworkMember, createOwnerNetwork, getOwnerNetworkMembers, getOwnerNetworkReport, getOwnerNetworks,
  removeOwnerNetworkMember, updateOwnerNetwork,
} from "../../lib/ownerApi.js";
import { Banner, Definitions, Grid, Kpi, Section, Segmented, Table, inputStyle, num, pct, smallButton, srOnly } from "./OwnerAnalytics.jsx";

// Owner Analytics → Networks: network effects inside a cluster, kept apart from product utility.
// Observational only: no critical-mass number, no fitted curves, no projections.

const SERIES = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#6250d6", "#e34948"]; // validated order
const KINDS = [["greek", "Greek house"], ["residence_hall", "Residence hall"], ["club", "Club"], ["other", "Other"]];
const KIND_LABEL = Object.fromEntries(KINDS);
const SAMPLE_NOTE = { too_few: "Too few to compare", suppressed: "Under 5: hidden", none: "None yet" };
const isNum = (v) => typeof v === "number" && Number.isFinite(v);
const shown = (v, f = num) => (typeof v === "string" ? v : f(v));
const laDate = (ts) => (ts ? new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" }).format(new Date(ts)) : "—");

export default function NetworksTab({ filters }) {
  const [report, setReport] = useState(null);
  const [networkId, setNetworkId] = useState(0);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const clusterId = Number(filters.cluster_id) || 0;

  useEffect(() => { setNetworkId(0); }, [clusterId]);

  useEffect(() => {
    let live = true;
    setError("");
    getOwnerNetworkReport({ ...filters, network_id: networkId })
      .then((res) => live && setReport(res))
      .catch(() => live && setError("Network analytics are temporarily unavailable."));
    return () => { live = false; };
  }, [filters, networkId, reload]);

  if (report && report.available === false) return <EmptyState>{report.reason}</EmptyState>;
  const defs = report?.definitions || {};
  return (
    <div style={{ display: "grid", gap: 18, gridTemplateColumns: "minmax(0, 1fr)" }}>
      <Banner>
        Network effects only. Product usefulness (search success, menu accuracy, discovery) stays on the Scorecard and Restaurant Discovery tabs.
        Everything here shows what happened together, not what caused what: busier people both connect and plan more.
      </Banner>
      {error ? <Banner tone="error">{error}</Banner> : null}
      {!clusterId ? <Banner>Pick a cluster above to manage its networks. Menuply-wide shows every network together.</Banner> : null}

      {report ? (
        <>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", fontSize: 13 }}>
            <label htmlFor="net-scope" style={{ color: OWNER_COLORS.muted }}>Show</label>
            <select id="net-scope" value={networkId} onChange={(e) => setNetworkId(Number(e.target.value))} style={inputStyle}>
              <option value={0}>Everyone active in {clusterId ? "this cluster" : "Menuply"} (each person once)</option>
              {report.networks.map((n) => <option key={n.id} value={n.id}>{n.name}{n.archived ? " (archived)" : ""}</option>)}
            </select>
            <span style={{ color: OWNER_COLORS.muted }}>
              {shown(report.people_in_scope)} registered people · closed weeks {report.week_ends[0] || "—"} to {report.week_ends[report.week_ends.length - 1] || "—"}
            </span>
          </div>
          <GraphA report={report} />
          <GraphB report={report} />
          <Outcomes report={report} />
          <Retention report={report} />
          <Growth report={report} />
          {report.comparison.length ? <Comparison rows={report.comparison} /> : null}
          <Definitions defs={defs} keys={["network", "active_user", "active_connection", "graph_a", "density", "eligible_invitation", "confirmed", "graph_b", "time_to_confirm", "retention", "social_repeat", "activation", "sample", "observational"]} />
        </>
      ) : !error ? <div style={{ padding: 30, color: OWNER_COLORS.muted, fontSize: 14 }}>Loading networks…</div> : null}

      {clusterId ? <Rosters clusterId={clusterId} referrals={report?.referrals || []} onChange={() => setReload((n) => n + 1)} /> : null}
    </div>
  );
}

// ── Graph A: active members → connectivity ────────────────────────────────────

const Y_A = [["median", "Median"], ["mean", "Mean"], ["two_plus_pct", "% with 2+"]];

function GraphA({ report }) {
  const [scope, setScope] = useState("within");
  const [measure, setMeasure] = useState("median");
  const [hover, setHover] = useState(null);
  const series = report.graph_a.map((s, i) => ({
    ...s, color: SERIES[i % SERIES.length],
    pts: s.points.filter((p) => isNum(p.active_members) && p[scope] && p[scope][measure] != null)
      .map((p) => ({ ...p, x: p.active_members, y: p[scope][measure] })),
  }));
  const hidden = report.graph_a.reduce((n, s) => n + s.points.filter((p) => p.sample === "suppressed").length, 0);
  const all = series.flatMap((s) => s.pts);
  const unitY = measure === "two_plus_pct" ? "%" : "";
  const title = "Graph A — connectivity as active membership grows";
  const subtitle = `One point per network per closed week. Across: active members. Up: ${measure === "two_plus_pct" ? "share of active members with 2+ active connections" : `${measure} active connections per active member`} (${scope === "within" ? "within the network" : "to anyone on Menuply"}).`;
  const controls = (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      <Segmented label="Connections to" options={[["within", "Within network"], ["anyone", "Anyone"]]} value={scope} onChange={setScope} />
      <Segmented label="Measure" options={Y_A} value={measure} onChange={setMeasure} />
    </div>
  );
  if (!report.graph_a.length) {
    return <Section title={title} subtitle="Add a network below to see this graph.">{controls}</Section>;
  }
  const W = 640, H = 260, L = 44, B = 34, T = 12, Rr = 16;
  const maxX = Math.max(5, ...all.map((p) => p.x));
  const maxY = measure === "two_plus_pct" ? 100 : Math.max(2, ...all.map((p) => p.y));
  const sx = (x) => L + (x / maxX) * (W - L - Rr);
  const sy = (y) => T + (1 - y / maxY) * (H - T - B);
  const ticksY = [0, maxY / 2, maxY];
  return (
    <Section title={title} subtitle={subtitle} action={controls}>
      {all.length ? (
        <div style={{ position: "relative" }}>
          <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={title} style={{ maxHeight: 300 }}>
            {ticksY.map((t) => (
              <g key={t}>
                <line x1={L} x2={W - Rr} y1={sy(t)} y2={sy(t)} stroke="#EEF0F3" />
                <text x={L - 6} y={sy(t) + 4} fontSize="11" textAnchor="end" fill={OWNER_COLORS.muted}>{Number(t.toFixed(1))}{unitY}</text>
              </g>
            ))}
            <line x1={L} x2={W - Rr} y1={H - B} y2={H - B} stroke={OWNER_COLORS.line} />
            {[0, Math.round(maxX / 2), maxX].map((t) => (
              <text key={t} x={sx(t)} y={H - B + 16} fontSize="11" textAnchor="middle" fill={OWNER_COLORS.muted}>{t}</text>
            ))}
            <text x={(L + W - Rr) / 2} y={H - 4} fontSize="11" textAnchor="middle" fill={OWNER_COLORS.muted}>Active members</text>
            {series.map((s) => (
              <g key={s.network_id}>
                {s.pts.length > 1 ? <polyline points={s.pts.map((p) => `${sx(p.x)},${sy(p.y)}`).join(" ")} fill="none" stroke={s.color} strokeWidth="2" opacity="0.5" /> : null}
                {s.pts.map((p, i) => (
                  <circle key={p.day} cx={sx(p.x)} cy={sy(p.y)} r={hover?.s === s.network_id && hover?.i === i ? 6 : 4.5}
                    fill={p.sample === "too_few" ? "#fff" : s.color} stroke={p.sample === "too_few" ? s.color : "#fff"} strokeWidth="2"
                    onMouseEnter={() => setHover({ s: s.network_id, i, p, name: s.name })} onMouseLeave={() => setHover(null)} />
                ))}
              </g>
            ))}
          </svg>
          {hover ? (
            <div style={{ position: "absolute", top: 8, right: 8, background: "#fff", border: `1px solid ${OWNER_COLORS.line}`, borderRadius: 8,
              padding: "8px 10px", fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.08)", pointerEvents: "none", lineHeight: 1.5 }}>
              <div style={{ fontWeight: 700, color: OWNER_COLORS.ink }}>{hover.name} · week ending {hover.p.day}</div>
              <div>{hover.p.active_members} active of {hover.p.members} members</div>
              <div>Median {hover.p[scope].median} · mean {hover.p[scope].mean} · {pct(hover.p[scope].two_plus_pct)} with 2+</div>
              <div>Within-network density {pct(hover.p.density_pct)}</div>
              {hover.p.sample === "too_few" ? <div style={{ color: OWNER_COLORS.muted }}>Fewer than {report.rules.min_group} active members: too few to compare</div> : null}
            </div>
          ) : null}
          <Legend items={series.map((s) => ({ label: s.name, color: s.color }))} extra="Hollow point = fewer than 20 active members" />
          <table style={srOnly}>
            <caption>{title}</caption>
            <tbody>{series.flatMap((s) => s.pts.map((p) => (
              <tr key={`${s.network_id}-${p.day}`}><th>{s.name} {p.day}</th><td>{p.x} active</td><td>{p.y}{unitY}</td></tr>
            )))}</tbody>
          </table>
        </div>
      ) : <EmptyState>No network-week has 5 or more active members yet, so there's nothing to plot.</EmptyState>}
      {hidden ? <div style={{ fontSize: 12, color: OWNER_COLORS.muted, marginTop: 8 }}>{hidden} network-week{hidden === 1 ? "" : "s"} with under 5 active members not shown.</div> : null}
    </Section>
  );
}

function Legend({ items, extra }) {
  return (
    <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 12, color: OWNER_COLORS.ink, marginTop: 8 }}>
      {items.map((it) => (
        <span key={it.label} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span aria-hidden style={{ width: 10, height: 10, borderRadius: 999, background: it.color }} />{it.label}
        </span>
      ))}
      {extra ? <span style={{ color: OWNER_COLORS.muted }}>{extra}</span> : null}
    </div>
  );
}

// ── Graph B: organizer's connections → invitations confirmed within 24 h ───────

function GraphB({ report }) {
  const [hover, setHover] = useState(null);
  const rows = report.graph_b;
  const title = "Graph B — connections and confirmed plans";
  const subtitle = `Across: the organizer's active connections the day before inviting. Up: share of their private and group invitations another person accepted within ${report.rules.confirm_window_hours} hours. Unconfirmed invitations count in every bar.`;
  const total = rows.reduce((n, r) => n + (isNum(r.invitations) ? r.invitations : 0), 0);
  if (!rows.some((r) => r.invitations)) {
    return <Section title={title} subtitle={subtitle}><EmptyState>No eligible invitations in this range yet.</EmptyState></Section>;
  }
  const W = 640, H = 230, L = 44, B = 48, T = 12;
  const bw = (W - L) / rows.length;
  const sy = (v) => T + (1 - v / 100) * (H - T - B);
  return (
    <Section title={title} subtitle={subtitle}>
      <div style={{ position: "relative" }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={title} style={{ maxHeight: 280 }}>
          <defs>
            <pattern id="hatch-b" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="6" height="6" fill="#dbe8f8" /><line x1="0" y1="0" x2="0" y2="6" stroke="#2a78d6" strokeWidth="1.5" />
            </pattern>
          </defs>
          {[0, 50, 100].map((t) => (
            <g key={t}>
              <line x1={L} x2={W} y1={sy(t)} y2={sy(t)} stroke="#EEF0F3" />
              <text x={L - 6} y={sy(t) + 4} fontSize="11" textAnchor="end" fill={OWNER_COLORS.muted}>{t}%</text>
            </g>
          ))}
          {rows.map((r, i) => {
            const x = L + i * bw + 6;
            const w = bw - 12;
            const v = isNum(r.confirmed_pct) ? r.confirmed_pct : null;
            const h = v != null ? Math.max(v ? 2 : 0, (v / 100) * (H - T - B)) : 0;
            return (
              <g key={r.key} onMouseEnter={() => setHover(r)} onMouseLeave={() => setHover(null)}>
                <rect x={L + i * bw} y={T} width={bw} height={H - T - B} fill="transparent" />
                {h ? <path d={`M${x},${sy(0)} V${sy(v) + 4} Q${x},${sy(v)} ${x + 4},${sy(v)} H${x + w - 4} Q${x + w},${sy(v)} ${x + w},${sy(v) + 4} V${sy(0)} Z`}
                  fill={r.sample === "too_few" ? "url(#hatch-b)" : "#2a78d6"} /> : null}
                <text x={x + w / 2} y={H - B + 16} fontSize="12" fontWeight="600" textAnchor="middle" fill={OWNER_COLORS.ink}>{r.label}</text>
                <text x={x + w / 2} y={H - B + 31} fontSize="11" textAnchor="middle" fill={OWNER_COLORS.muted}>n={shown(r.invitations)}</text>
                {v != null ? <text x={x + w / 2} y={sy(v) - 6} fontSize="11" textAnchor="middle" fill={OWNER_COLORS.ink}>{v}%</text> : null}
              </g>
            );
          })}
          <line x1={L} x2={W} y1={sy(0)} y2={sy(0)} stroke={OWNER_COLORS.line} />
        </svg>
        {hover ? (
          <div style={{ position: "absolute", top: 8, right: 8, background: "#fff", border: `1px solid ${OWNER_COLORS.line}`, borderRadius: 8,
            padding: "8px 10px", fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.08)", pointerEvents: "none", lineHeight: 1.5 }}>
            <div style={{ fontWeight: 700 }}>{hover.label} active connection{hover.label === "1" ? "" : "s"}</div>
            <div>{shown(hover.invitations)} invitations from {shown(hover.organizers)} organizers</div>
            <div>{shown(hover.confirmed)} confirmed · {shown(hover.unconfirmed)} not confirmed in {report.rules.confirm_window_hours} h</div>
            {SAMPLE_NOTE[hover.sample] ? <div style={{ color: OWNER_COLORS.muted }}>{SAMPLE_NOTE[hover.sample]}</div> : null}
          </div>
        ) : null}
        <div style={{ fontSize: 12, color: OWNER_COLORS.muted, marginTop: 6 }}>
          {num(total)} eligible invitations shown. Striped bars have fewer than {report.rules.min_group} invitations: too few to compare. A few busy organizers can fill one bar; check the organizer count.
        </div>
      </div>
      <Table rows={rows} columns={[
        ["Active connections", "label"], ["Invitations", (r) => shown(r.invitations)], ["Organizers", (r) => shown(r.organizers)],
        ["Confirmed ≤24 h", (r) => shown(r.confirmed)], ["Not confirmed", (r) => shown(r.unconfirmed)],
        ["Rate", (r) => pct(r.confirmed_pct)], ["Sample", (r) => SAMPLE_NOTE[r.sample] || "OK"],
      ]} />
    </Section>
  );
}

function Outcomes({ report }) {
  const t = report.time_to_confirm;
  const label = (h) => (h === 1 ? "1 hour" : h === 24 ? "24 hours" : "7 days");
  return (
    <Section title="Invitation outcomes" subtitle="Each window counts only invitations old enough to have had the whole window. Not confirmed = no acceptance inside it.">
      <Grid>
        {report.outcome_windows.map((w) => (
          <Kpi key={w.hours} label={`Confirmed within ${label(w.hours)}`} value={w.confirmed_pct} unit="percent"
            note={`${num(w.confirmed)} of ${num(w.eligible)} · ${num(w.unconfirmed)} not confirmed`} />
        ))}
        <Kpi label="Median hours to confirmed plan" value={t.median_hours} unit="count"
          note={t.median_hours != null ? `Over ${num(t.observed)} invitations observed 7 days (${num(t.unconfirmed_after_7d)} never confirmed)` : (t.median_note || "No invitations observed for 7 days yet")} />
        {report.social_repeat ? (
          <Kpi label="Weekly repeat social activity" value={report.social_repeat.repeated_pct} unit="percent"
            note={`${shown(report.social_repeat.repeated)} of ${shown(report.social_repeat.eligible)} person-weeks${SAMPLE_NOTE[report.social_repeat.sample] ? ` · ${SAMPLE_NOTE[report.social_repeat.sample]}` : ""}`} />
        ) : null}
      </Grid>
    </Section>
  );
}

function Retention({ report }) {
  return (
    <Section title="Do people with active connections come back?" subtitle="People active in a closed week, grouped by active connections at the end of it. Retained = active again the next week.">
      <Table rows={report.retention} columns={[
        ["Group", "label"], ["Person-weeks", (r) => shown(r.eligible)], ["Retained", (r) => shown(r.retained)],
        ["Retention", (r) => pct(r.retained_pct)], ["Sample", (r) => SAMPLE_NOTE[r.sample] || "OK"],
      ]} />
    </Section>
  );
}

function Growth({ report }) {
  const s = report.activation.summary;
  return (
    <Section title="Activation and attrition" subtitle="Weekly counts of people who became active and people who lapsed. Counted, never projected.">
      <div style={{ fontSize: 13, marginBottom: 10 }}>
        {s.weeks ? `${s.weeks_net_positive} of ${s.weeks} closed weeks had more activations than lapses${s.current_positive_streak ? `; the last ${s.current_positive_streak} in a row` : ""}. One good stretch is not a sign of self-sustaining growth.` : "No closed weeks in this range yet."}
      </div>
      <Table rows={report.activation.weeks} columns={[
        ["Week ending", "week_end"], ["Active (28-day)", (r) => shown(r.active)], ["Activated", (r) => shown(r.activated)],
        ["Lapsed", (r) => shown(r.lapsed)], ["Net", (r) => (r.net == null ? "—" : r.net > 0 ? `+${r.net}` : String(r.net))],
      ]} />
    </Section>
  );
}

function Comparison({ rows }) {
  const ret = (r, key) => r.retention.find((g) => g.key === key);
  return (
    <Section title="Networks side by side" subtitle="Same weeks, same rules. Compare networks of similar size; small ones swing a lot.">
      <Table rows={rows} columns={[
        ["Network", (r) => `${r.name}${r.archived ? " (archived)" : ""}`], ["Kind", (r) => KIND_LABEL[r.kind] || r.kind],
        ["Members", (r) => shown(r.members_now)], ["Active last week", (r) => shown(r.last_week?.active_members)],
        ["Median within", (r) => shown(r.last_week?.within?.median)], ["% with 2+ within", (r) => pct(r.last_week?.within?.two_plus_pct)],
        ["Density", (r) => pct(r.last_week?.density_pct)],
        ["Confirmed ≤24 h", (r) => `${pct(r.invitations.confirmed_pct)} (n=${shown(r.invitations.n)})`],
        ["Retention 2+ vs 0", (r) => `${pct(ret(r, "2+")?.retained_pct)} vs ${pct(ret(r, "0")?.retained_pct)}`],
        ["Weeks net positive", (r) => `${r.growth.weeks_net_positive}/${r.growth.weeks}`],
      ]} />
    </Section>
  );
}

// ── Rosters: create, rename, archive, members, link ───────────────────────────

function Rosters({ clusterId, referrals, onChange }) {
  const [list, setList] = useState(null);
  const [archived, setArchived] = useState(false);
  const [form, setForm] = useState({ name: "", kind: "greek" });
  const [msg, setMsg] = useState("");
  const [open, setOpen] = useState(null);

  const load = useCallback(() => {
    getOwnerNetworks({ cluster_id: clusterId, archived }).then((res) => setList(res.networks || [])).catch(() => setList([]));
  }, [clusterId, archived]);
  useEffect(() => { load(); }, [load]);

  const act = async (fn, ok) => {
    setMsg("");
    try { await fn(); setMsg(ok); load(); onChange(); } catch (e) { setMsg(e.message || "Didn't save."); }
  };

  const linkOf = (code) => `${window.location.origin}/n/${code}`;
  return (
    <Section title="Networks in this cluster" subtitle="Analytics groupings only: students never see them. Members are added by you; a link visit is a referral, never membership, and creates no connections or invites."
      action={<label style={{ fontSize: 12, display: "flex", gap: 6, alignItems: "center" }}><input type="checkbox" checked={archived} onChange={(e) => setArchived(e.target.checked)} /> Show archived</label>}>
      <form onSubmit={(e) => { e.preventDefault(); act(() => createOwnerNetwork({ cluster_id: clusterId, ...form }), "Network added."); setForm((f) => ({ ...f, name: "" })); }}
        style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        <input aria-label="Network name" placeholder="Name, e.g. Kappa house" value={form.name} maxLength={80} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} />
        <select aria-label="Kind" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })} style={inputStyle}>
          {KINDS.map(([k, t]) => <option key={k} value={k}>{t}</option>)}
        </select>
        <button type="submit" disabled={!form.name.trim()} style={smallButton}>Add network</button>
      </form>
      {msg ? <div role="status" style={{ fontSize: 13, marginBottom: 10 }}>{msg}</div> : null}
      {list == null ? <div style={{ fontSize: 13, color: OWNER_COLORS.muted }}>Loading…</div> : !list.length ? <EmptyState>No networks yet.</EmptyState> : (
        <div style={{ display: "grid", gap: 10 }}>
          {list.map((n) => {
            const ref = referrals.find((r) => r.network_id === Number(n.id));
            return (
              <div key={n.id} style={{ border: `1px solid ${OWNER_COLORS.line}`, borderRadius: 12, padding: 12 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{n.name}{n.archived_at ? " · archived" : ""}</div>
                    <div style={{ fontSize: 12, color: OWNER_COLORS.muted }}>
                      {KIND_LABEL[n.kind]} · {num(n.members)} members · came by link: {num(n.referred_signups)} signed up, {num(n.referred_signins)} signed in ({num(n.referred_now_members)} now members)
                      {ref ? ` · in this range: ${shown(ref.signed_up)} signed up, ${shown(ref.signed_in)} signed in` : ""}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <button type="button" style={smallButton} onClick={() => setOpen(open === n.id ? null : n.id)}>{open === n.id ? "Close" : "Members"}</button>
                    {!n.archived_at ? <button type="button" style={smallButton} onClick={() => navigator.clipboard?.writeText(linkOf(n.link_code)).then(() => setMsg("Link copied."), () => setMsg(linkOf(n.link_code)))}>Copy link</button> : null}
                    <button type="button" style={smallButton} onClick={() => {
                      const name = window.prompt("Rename network", n.name);
                      if (name && name.trim() !== n.name) act(() => updateOwnerNetwork(n.id, { name }), "Renamed.");
                    }}>Rename</button>
                    {!n.archived_at ? <button type="button" style={smallButton} onClick={() => window.confirm("Make a new link? The old link stops working.") && act(() => updateOwnerNetwork(n.id, { regenerate_link: true }), "New link made.")}>New link</button> : null}
                    <button type="button" style={smallButton} onClick={() => act(() => updateOwnerNetwork(n.id, { archived: !n.archived_at }), n.archived_at ? "Unarchived." : "Archived. Its link stops working; history stays.")}>
                      {n.archived_at ? "Unarchive" : "Archive"}
                    </button>
                  </div>
                </div>
                {open === n.id ? <Members network={n} onChange={() => { load(); onChange(); }} /> : null}
              </div>
            );
          })}
        </div>
      )}
    </Section>
  );
}

function Members({ network, onChange }) {
  const [rows, setRows] = useState(null);
  const [who, setWho] = useState("");
  const [msg, setMsg] = useState("");
  const load = useCallback(() => {
    getOwnerNetworkMembers(network.id).then((res) => setRows(res.members || [])).catch(() => setRows([]));
  }, [network.id]);
  useEffect(() => { load(); }, [load]);
  const run = async (fn, ok) => {
    setMsg("");
    try { await fn(); setMsg(ok); load(); onChange(); } catch (e) { setMsg(e.message || "Didn't save."); }
  };
  return (
    <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
      {!network.archived_at ? (
        <form onSubmit={(e) => { e.preventDefault(); run(() => addOwnerNetworkMember(network.id, who.trim()), "Member added."); setWho(""); }} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input aria-label="Member email or account ID" placeholder="Exact Menuply email or account ID" value={who} onChange={(e) => setWho(e.target.value)} style={{ ...inputStyle, minWidth: 260 }} />
          <button type="submit" disabled={!who.trim()} style={smallButton}>Add member</button>
        </form>
      ) : null}
      {msg ? <div role="status" style={{ fontSize: 13 }}>{msg}</div> : null}
      {rows == null ? null : (
        <Table rows={rows} empty="No members yet." columns={[
          ["Account", (r) => r.user_id], ["Name", (r) => r.display_name || "—"], ["Email", "email"],
          ["Added", (r) => <span style={{ whiteSpace: "nowrap" }}>{laDate(r.added_at)}</span>], ["Came by link", (r) => (r.came_by_link ? "Yes" : "No")],
          ["Active (28 days)", (r) => (r.active ? "Yes" : "No")],
          ["", (r) => <button type="button" style={smallButton} onClick={() => window.confirm("Remove from this network?") && run(() => removeOwnerNetworkMember(network.id, r.user_id), "Removed.")}>Remove</button>],
        ]} />
      )}
    </div>
  );
}
