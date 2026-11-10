import React, { useCallback, useEffect, useState } from "react";
import { EmptyState, OWNER_COLORS } from "./OwnerLayout.jsx";
import {
  actOnOwnerReward, createOwnerRewardType, getOwnerNetworkValueClusters, getOwnerNetworkValueLeaderboard,
  getOwnerNetworkValueOverview, getOwnerNetworkValueSettings, getOwnerNetworkValueUser, getOwnerRewardEligible,
  getOwnerRewardTypes, getOwnerRewards, proposeOwnerReward, saveOwnerNetworkValueSettings, updateOwnerRewardType,
} from "../../lib/ownerApi.js";
import { Banner, Definitions, Grid, Kpi, Section, Segmented, Table, Trend, inputStyle, num, pct, smallButton } from "./OwnerAnalytics.jsx";

// Owner Analytics → Network Value & Rewards (mig 0415). Owner-only: per-diner network data never
// leaves this page. "Sheep" is an internal label and appears nowhere a diner can see.

const VIEWS = [
  ["overview", "Overview"],
  ["builders", "Top Network Builders"],
  ["clusters", "Cluster Comparison"],
  ["rewards", "Rewards"],
  ["user", "User Detail"],
  ["scoring", "Scoring"],
];
const CATEGORIES = [["unconnected", "Unconnected"], ["sheep", "Sheep"], ["gold_standard", "Gold Standard"], ["influencer", "Influencer"]];
const CATEGORY_LABEL = Object.fromEntries(CATEGORIES);
const SOURCE_LABEL = {
  invite_code: "Invite friends link", diner_qr: "Personal QR", eat_invitation: "Invite to Eat",
  dining_crew: "Circle join", open_invite: "Open Invite",
};
const STATUS_LABEL = {
  pending: "Pending", approved: "Approved", rejected: "Rejected", issued: "Issued", redeemed: "Redeemed", expired: "Expired", void: "Void",
};
const ACTIONS = {
  pending: [["approve", "Approve"], ["reject", "Reject"]],
  approved: [["issue", "Mark issued"], ["void", "Void"]],
  issued: [["redeem", "Mark redeemed"], ["expire", "Mark expired"], ["void", "Void"]],
};
const DONE = { approve: "approved", reject: "rejected", issue: "issued", redeem: "redeemed", expire: "expired", void: "void" };
const money = (cents) => (cents == null ? "—" : `$${(Number(cents) / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
const shown = (v, f = num) => (typeof v === "string" ? v : f(v));
const laDate = (ts) => (ts ? new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" }).format(new Date(ts)) : "—");
const score = (v) => (v == null ? "—" : Number(v).toFixed(1));
const trend = (v) => (v == null ? "—" : `${v > 0 ? "▲" : v < 0 ? "▼" : ""} ${Math.abs(Number(v)).toFixed(1)}`.trim());
const errText = (err, fallback) => err?.payload?.error || err?.message || fallback;

export default function NetworkValueTab({ filters }) {
  const [view, setView] = useState("overview");
  const [userId, setUserId] = useState(null);
  const clusterId = Number(filters.cluster_id) || 0;
  const asOf = filters.to;
  const openUser = (id) => { setUserId(id); setView("user"); };

  return (
    <div style={{ display: "grid", gap: 18, gridTemplateColumns: "minmax(0, 1fr)" }}>
      <Banner>
        Who makes Menuply&apos;s dining network more valuable: connected, active diners who bring friends in and get plans made.
        Owner-only. Scores are saved once a day; the date shown is the &ldquo;To&rdquo; date above.
      </Banner>
      <div style={{ overflowX: "auto" }}>
        <Segmented label="Network Value view" options={VIEWS} value={view} onChange={setView} />
      </div>
      {view === "overview" ? <Overview clusterId={clusterId} asOf={asOf} /> : null}
      {view === "builders" ? <Builders clusterId={clusterId} asOf={asOf} onOpen={openUser} /> : null}
      {view === "clusters" ? <Clusters asOf={asOf} /> : null}
      {view === "rewards" ? <Rewards clusterId={clusterId} onOpen={openUser} /> : null}
      {view === "user" ? <UserDetail userId={userId} onPick={setUserId} /> : null}
      {view === "scoring" ? <Scoring /> : null}
    </div>
  );
}

function useLoad(load, deps) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let live = true;
    setError("");
    load()
      .then((res) => live && setData(res))
      .catch((err) => live && setError(errText(err, "Network Value is temporarily unavailable.")));
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);
  return { data, error, reload: () => setTick((n) => n + 1) };
}

function Gate({ data, error, loading = "Loading…", children }) {
  if (error) return <Banner tone="error">{error}</Banner>;
  if (!data) return <div style={{ padding: 30, color: OWNER_COLORS.muted, fontSize: 14 }}>{loading}</div>;
  if (data.available === false) return <EmptyState>{data.reason}</EmptyState>;
  if (data.scored === false) return <EmptyState>No scores yet. The first daily snapshot is made within the hour after the migration is applied.</EmptyState>;
  return children;
}

// ── Overview ──────────────────────────────────────────────────────────────────

function Overview({ clusterId, asOf }) {
  const { data, error } = useLoad(() => getOwnerNetworkValueOverview({ cluster_id: clusterId || "", as_of: asOf }), [clusterId, asOf]);
  return (
    <Gate data={data} error={error} loading="Loading network overview…">
      {data?.kpis ? <OverviewBody o={data} /> : null}
    </Gate>
  );
}

function OverviewBody({ o }) {
  const k = o.kpis;
  const d = o.definitions || {};
  const total = CATEGORIES.reduce((n, [key]) => n + (typeof k.classification[key] === "number" ? k.classification[key] : 0), 0);
  return (
    <>
      <div style={{ fontSize: 12, color: OWNER_COLORS.muted }}>Snapshot {o.as_of} · window {o.window.from} to {o.window.to} · scoring version {o.settings_version}</div>
      <Grid min={190}>
        <Kpi label="Registered users" value={k.registered_users} unit="people" note="Scored diners, test accounts excluded" />
        <Kpi label="Engaged (30 days)" value={k.engaged_30d} unit="people" definition="A qualifying action in the window" />
        <Kpi label="DAU / WAU / MAU" value={k.mau} unit="people" note={`DAU ${shown(k.dau)} · WAU ${shown(k.wau)} · MAU ${shown(k.mau)} (registered)`} />
        <Kpi label="Avg dining friends" value={k.avg_friends} note={`${pct(k.pct_connected)} have at least one`} />
        <Kpi label="5+ dining friends" value={k.pct_five_plus} unit="percent" />
        <Kpi label="Active dining connections" value={k.active_connections} definition={d.active_friend} />
        <Kpi label="Network-generated activated users" value={k.ngau.total} unit="people"
          note={k.ngau.share_of_new_activated == null ? "No new activated users yet" : `${pct(k.ngau.share_of_new_activated)} of ${num(k.ngau.new_activated)} new activated users`} />
        <Kpi label="Referral → activation" value={k.referral_activation_rate} unit="percent" note="Credited recruits who did something" />
        <Kpi label="Invitations sent" value={k.invitations_sent} note="Invite to Eat; sending isn't success" />
        <Kpi label="Confirmed plans" value={k.confirmed_plans} definition={d.coordination} />
        <Kpi label="Repeat coordination" value={k.repeat_coordination_rate} unit="percent" note="Hosts with 2+ confirmed plans in the window" />
      </Grid>

      <Section title="Network categories" subtitle="By accepted dining friends. Owner labels only.">
        {total ? (
          <div style={{ display: "grid", gap: 8 }}>
            {CATEGORIES.map(([key, label], i) => {
              const v = k.classification[key];
              const w = typeof v === "number" && total ? (v / total) * 100 : 0;
              return (
                <div key={key} style={{ display: "grid", gridTemplateColumns: "120px 1fr 60px", gap: 10, alignItems: "center", fontSize: 13 }}>
                  <span>{label}</span>
                  <div style={{ background: "#EEF0F3", borderRadius: 6, height: 14 }}>
                    <div style={{ width: `${w}%`, height: 14, borderRadius: 6, background: ["#98A2B3", "#7aa7e8", "#2a78d6", "#1d4f99"][i] }} />
                  </div>
                  <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{shown(v)}</span>
                </div>
              );
            })}
          </div>
        ) : <EmptyState>No diners scored in this cluster yet.</EmptyState>}
      </Section>

      <Section title="Where activated recruits came from" subtitle="One recruiter per new diner: the earliest link, QR, invite or Circle within 7 days of signing up.">
        <Table
          rows={Object.entries(k.ngau.by_source).map(([key, v]) => ({ key, ...v }))}
          columns={[["Source", (r) => SOURCE_LABEL[r.key] || r.key], ["Credited", "attributed"], ["Activated", "activated"], ["Same device (not counted)", "shared_device"]]}
        />
      </Section>

      <Grid min={300}>
        <Section title="Invite friends link" subtitle="Links shared from 2026-11-10 on carry the sharer's code.">
          <Table rows={[k.invite_link]} columns={[
            ["Opens (devices)", "opens"], ["Sign-ups", "signups"], ["Activated", "activated"],
            ["Open → sign-up", (r) => pct(r.open_to_signup)], ["Sign-up → active", (r) => pct(r.signup_to_activation)],
          ]} />
        </Section>
        <Section title="User reproduction rate" subtitle="New activated users per existing active diner in the window.">
          <Table rows={[k.reproduction]} columns={[
            ["Overall rate", (r) => (r.overall_rate == null ? "—" : r.overall_rate)],
            ["Eligible diners", "eligible_users"],
            ["Successful-referrer average", (r) => (r.successful_referrer_average == null ? "—" : r.successful_referrer_average)],
            ["Successful referrers", "successful_referrers"],
          ]} />
          <div style={{ fontSize: 12, color: OWNER_COLORS.muted, marginTop: 8 }}>
            A rate above 1 isn&apos;t proof of exponential growth: cohorts overlap, friend groups saturate and not everyone stays.
          </div>
        </Section>
      </Grid>

      <Section title="Retention: referred vs not" subtitle="Cohorts whose day 30 has ended. D30 = active in days 23–30. Under 5 people hidden.">
        <Table
          rows={["referred", "not_referred"].map((key) => ({ key, ...(k.retention_referred_vs_not[key] || { users: 0 }) }))}
          columns={[["Group", (r) => (r.key === "referred" ? "Came through a referral" : "Everyone else")], ["Diners", (r) => shown(r.users)], ["D7", (r) => pct(r.d7)], ["D30", (r) => pct(r.d30)]]}
        />
      </Section>

      <Section title="Network-generated activated users by week">
        <Trend title="NGAU by week" rows={o.trends.ngau_weekly.map((r) => ({ bucket: r.week, value: r.ngau }))} />
      </Section>

      <Banner>
        <strong>Not available yet:</strong>
        <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>{o.unavailable.map((t) => <li key={t}>{t}</li>)}</ul>
      </Banner>
      <Definitions defs={d} keys={["dining_friends", "classification", "active_friend", "recruit", "activated", "coordination", "retention", "shared_device", "history"]} />
    </>
  );
}

// ── Top Network Builders ──────────────────────────────────────────────────────

const SORTS = [["nvs", "NVS"], ["friends", "Friends"], ["active_friends", "Active friends"], ["activated_recruits", "Activated referrals"], ["confirmed_hosted", "Dining plans"], ["trend", "Trend"], ["rewards", "Rewards"]];
const linkButton = { border: 0, background: "none", padding: 0, color: "#1d4f99", cursor: "pointer", font: "inherit", fontWeight: 600, textAlign: "left" };

function Builders({ clusterId, asOf, onOpen }) {
  const [q, setQ] = useState({ classification: "", min_nvs: "", active: false, sort: "nvs", dir: "desc", limit: 50 });
  const { data, error } = useLoad(
    () => getOwnerNetworkValueLeaderboard({ cluster_id: clusterId || "", as_of: asOf, ...q, active: q.active ? "1" : "" }),
    [clusterId, asOf, q.classification, q.min_nvs, q.active, q.sort, q.dir, q.limit]
  );
  const set = (patch) => setQ((cur) => ({ ...cur, ...patch }));
  return (
    <Section title="Top Network Builders" subtitle="Owner-only ranking. Click a name for the score breakdown."
      action={
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", fontSize: 13 }}>
          <select aria-label="Category" value={q.classification} onChange={(e) => set({ classification: e.target.value })} style={inputStyle}>
            <option value="">All categories</option>
            {CATEGORIES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
          <input aria-label="Minimum NVS" type="number" min="0" max="100" placeholder="Min NVS" value={q.min_nvs}
            onChange={(e) => set({ min_nvs: e.target.value })} style={{ ...inputStyle, width: 90 }} />
          <select aria-label="Sort by" value={q.sort} onChange={(e) => set({ sort: e.target.value })} style={inputStyle}>
            {SORTS.map(([k, l]) => <option key={k} value={k}>Sort: {l}</option>)}
          </select>
          <button type="button" style={smallButton} aria-label="Sort direction" onClick={() => set({ dir: q.dir === "desc" ? "asc" : "desc" })}>
            {q.dir === "desc" ? "High → low" : "Low → high"}
          </button>
          <label style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
            <input type="checkbox" checked={q.active} onChange={(e) => set({ active: e.target.checked })} /> Active weeks only
          </label>
        </div>
      }>
      <Gate data={data} error={error} loading="Loading leaderboard…">
        {data?.rows ? (
          <>
            <div style={{ fontSize: 12, color: OWNER_COLORS.muted, marginBottom: 8 }}>
              {num(data.total)} diners · snapshot {data.as_of} · trend vs {data.trend_from} (— until that day has a snapshot)
            </div>
            <Table rows={data.rows.map((r, i) => ({ ...r, rank: i + 1 }))} empty="Nobody matches these filters." columns={[
              ["#", "rank"],
              ["User", (r) => (
                <button type="button" onClick={() => onOpen(r.user_id)} style={linkButton}>
                  {r.display_name} <span style={{ color: OWNER_COLORS.muted, fontWeight: 400 }}>#{r.user_id}</span>
                </button>
              )],
              ["Cluster", (r) => r.cluster_name || "—"],
              ["Category", "category"],
              ["Friends", "friends"],
              ["Active friends", "active_friends"],
              ["Activated referrals", "activated_recruits"],
              ["Dining plans", (r) => `${r.confirmed_hosted}${r.joined_plans ? ` (+${r.joined_plans} joined)` : ""}`],
              ["NVS", (r) => <strong>{score(r.nvs)}</strong>],
              ["Trend", (r) => trend(r.trend)],
              ["Rewards", (r) => `${r.rewards_issued} issued${r.rewards_open ? ` · ${r.rewards_open} open` : ""}`],
            ]} />
            {data.total > data.rows.length && q.limit < 200 ? (
              <button type="button" style={{ ...smallButton, marginTop: 10 }} onClick={() => set({ limit: Math.min(200, q.limit + 50) })}>Show more</button>
            ) : null}
          </>
        ) : null}
      </Gate>
    </Section>
  );
}

// ── Cluster Comparison ────────────────────────────────────────────────────────

function Clusters({ asOf }) {
  const { data, error } = useLoad(() => getOwnerNetworkValueClusters({ as_of: asOf }), [asOf]);
  return (
    <Section title="Cluster comparison" subtitle="Each diner counts in their primary cluster (most active days in the last 30). Under 5 diners: numbers hidden.">
      <Gate data={data} error={error} loading="Loading clusters…">
        {data?.clusters ? (
          <Table rows={data.clusters} empty="No diners with a primary cluster yet." columns={[
            ["Cluster", "name"], ["Diners", (r) => shown(r.users)], ["Connected", (r) => pct(r.connected_pct)],
            ["Network density", (r) => pct(r.density_pct)], ["Referral → activation", (r) => pct(r.referral_activation_pct)],
            ["Activated referrals", (r) => shown(r.activated_referrals)], ["Confirmed plans / 100 active", (r) => shown(r.confirmed_per_100_active)],
            ["Active 2+ of 4 weeks", (r) => pct(r.retained_pct)], ["Avg NVS", (r) => score(r.avg_nvs)],
          ]} />
        ) : null}
      </Gate>
    </Section>
  );
}

// ── Rewards ───────────────────────────────────────────────────────────────────

function Rewards({ clusterId, onOpen }) {
  const types = useLoad(() => getOwnerRewardTypes(), []);
  const [status, setStatus] = useState("");
  const rewards = useLoad(() => getOwnerRewards({ status }), [status]);
  const [eligibleFor, setEligibleFor] = useState(null);
  const [notice, setNotice] = useState("");
  const refresh = () => { types.reload(); rewards.reload(); };

  const act = async (reward, action) => {
    if ((action === "issue" || action === "void") && !window.confirm(`${action === "issue" ? "Mark this reward issued" : "Void this reward"} for ${reward.display_name}?`)) return;
    let body = {};
    if (action === "issue") {
      const exp = window.prompt("Expiry date (YYYY-MM-DD), or leave empty:", "");
      if (exp === null) return;
      if (exp && !/^\d{4}-\d{2}-\d{2}$/.test(exp)) { setNotice("Expiry must look like 2026-12-31."); return; }
      if (exp) body = { expires_at: `${exp}T23:59:59-08:00` };
    }
    try {
      await actOnOwnerReward(reward.id, action, body);
      setNotice(`${STATUS_LABEL[DONE[action]]}: ${reward.reward_name} for ${reward.display_name} (#${reward.consumer_user_id})`);
      refresh();
    } catch (err) {
      setNotice(errText(err, "That didn't work."));
    }
  };

  return (
    <>
      <Banner>
        Rewards need an owner&apos;s approval, and nothing pays out by itself: &ldquo;issued&rdquo; is a record you set after giving the perk.
        Restaurant perks only with that restaurant&apos;s agreement. These are earned rewards, never prize draws.
      </Banner>
      {notice ? <Banner>{notice}</Banner> : null}
      <Section title="Reward types" subtitle="Requirements are checked against each diner's latest daily score.">
        <Gate data={types.data} error={types.error}>
          {types.data?.types ? (
            <Table rows={types.data.types} empty="No reward types yet. Add one below." columns={[
              ["Reward", (t) => <><strong>{t.name}</strong>{t.description ? <div style={{ color: OWNER_COLORS.muted, fontSize: 12 }}>{t.description}</div> : null}</>],
              ["Requirements", (t) => describeEligibility(t.eligibility)],
              ["Value", (t) => money(t.value_cents)], ["Repeats", (t) => (t.repeat === "monthly" ? "Monthly" : "Once")],
              ["Issued", "issued"], ["Status", (t) => (t.active ? "On" : "Off")],
              ["", (t) => (
                <div style={{ display: "flex", gap: 6 }}>
                  {t.active ? <button type="button" style={smallButton} onClick={() => setEligibleFor(t)}>Who qualifies</button> : null}
                  <button type="button" style={smallButton} onClick={async () => {
                    try { await updateOwnerRewardType(t.id, { active: !t.active }); types.reload(); } catch (err) { setNotice(errText(err, "Couldn't change it.")); }
                  }}>{t.active ? "Turn off" : "Turn on"}</button>
                </div>
              )],
            ]} />
          ) : null}
        </Gate>
        <NewRewardType onCreated={(t) => { setNotice(`Added ${t.name}.`); types.reload(); }} onError={setNotice} />
      </Section>

      {eligibleFor ? (
        <Eligible type={eligibleFor} clusterId={clusterId} onOpen={onOpen} onClose={() => setEligibleFor(null)}
          onProposed={(name) => { setNotice(`Proposed ${eligibleFor.name} for ${name}: pending approval`); refresh(); }} onError={setNotice} />
      ) : null}

      <Section title="Rewards" subtitle="Every change records who did it and when."
        action={
          <select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)} style={inputStyle}>
            <option value="">All statuses</option>
            {Object.entries(STATUS_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        }>
        <Gate data={rewards.data} error={rewards.error}>
          {rewards.data?.rewards ? (
            <Table rows={rewards.data.rewards} empty="No rewards yet." columns={[
              ["Diner", (r) => (r.consumer_user_id ? (
                <button type="button" onClick={() => onOpen(r.consumer_user_id)} style={linkButton}>{r.display_name} #{r.consumer_user_id}</button>
              ) : "Deleted account")],
              ["Reward", (r) => `${r.reward_name}${r.period_key !== "once" ? ` · ${r.period_key}` : ""}`],
              ["Status", (r) => STATUS_LABEL[r.status]], ["Value", (r) => money(r.value_cents)],
              ["Proposed", (r) => `${laDate(r.proposed_at)}${r.proposed_by ? ` · ${r.proposed_by}` : ""}`],
              ["Decided", (r) => (r.decided_at ? `${laDate(r.decided_at)} · ${r.decided_by || "—"}` : "—")],
              ["Issued", (r) => (r.issued_at ? `${laDate(r.issued_at)}${r.expires_at ? ` · expires ${laDate(r.expires_at)}` : ""}` : "—")],
              ["NVS then → now", (r) => `${score(r.nvs_at_proposal)} → ${score(r.nvs_now)}`],
              ["Note", (r) => (r.eligibility_snapshot?.override ? `Override: ${r.note || ""}` : r.note || "—")],
              ["", (r) => (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {(ACTIONS[r.status] || []).map(([a, label]) => <button key={a} type="button" style={smallButton} onClick={() => act(r, a)}>{label}</button>)}
                </div>
              )],
            ]} />
          ) : null}
        </Gate>
      </Section>

      <Section title="Reward costs" subtitle="Issued value counts issued and redeemed rewards.">
        <Gate data={rewards.data} error={rewards.error}>
          {rewards.data?.costs ? (
            <Table rows={rewards.data.costs} empty="No reward types yet." columns={[
              ["Reward", "name"], ["Pending", "pending"], ["Approved", "approved"], ["Issued", "issued"], ["Redeemed", "redeemed"],
              ["Expired", "expired"], ["Issued value", (r) => money(r.issued_cents)], ["Redeemed value", (r) => money(r.redeemed_cents)],
            ]} />
          ) : null}
        </Gate>
      </Section>
    </>
  );
}

const ELIGIBILITY_FIELDS = [
  ["min_activated_recruits", "Activated referrals at least"],
  ["min_active_friends", "Active friends at least"],
  ["min_friends", "Dining friends at least"],
  ["max_friends", "Dining friends at most"],
  ["min_confirmed_hosted", "Confirmed plans at least"],
  ["min_active_weeks", "Active weeks (of 4) at least"],
  ["min_nvs", "NVS at least"],
];

function describeEligibility(e = {}) {
  const parts = ELIGIBILITY_FIELDS.filter(([k]) => e[k] != null).map(([k, l]) => `${l.replace(" at least", " ≥").replace(" at most", " ≤")} ${e[k]}`);
  if (e.classifications?.length) parts.push(e.classifications.map((c) => CATEGORY_LABEL[c]).join(" / "));
  return parts.length ? parts.join(" · ") : "Anyone (owner picks)";
}

function NewRewardType({ onCreated, onError }) {
  const blank = { name: "", description: "", value: "", repeat: "once", eligibility: {}, classifications: [] };
  const [f, setF] = useState(blank);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  if (!open) return <button type="button" style={{ ...smallButton, marginTop: 12 }} onClick={() => setOpen(true)}>Add a reward type</button>;
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const eligibility = { ...f.eligibility };
      if (f.classifications.length) eligibility.classifications = f.classifications;
      const out = await createOwnerRewardType({
        name: f.name, description: f.description, value_cents: Math.round(Number(f.value || 0) * 100), repeat: f.repeat, eligibility,
      });
      setF(blank);
      setOpen(false);
      onCreated(out.type);
    } catch (err) {
      onError(errText(err, "Couldn't add it."));
    } finally {
      setBusy(false);
    }
  };
  const field = { display: "grid", gap: 4, fontSize: 12, color: OWNER_COLORS.muted };
  return (
    <form onSubmit={submit} style={{ marginTop: 14, display: "grid", gap: 12, borderTop: `1px solid ${OWNER_COLORS.line}`, paddingTop: 14 }}>
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
        <label style={field}>Name<input required maxLength={80} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} style={inputStyle} placeholder="Rising Connector" /></label>
        <label style={field}>Value ($, for cost tracking)<input type="number" min="0" step="0.01" value={f.value} onChange={(e) => setF({ ...f, value: e.target.value })} style={inputStyle} /></label>
        <label style={field}>Repeats
          <select value={f.repeat} onChange={(e) => setF({ ...f, repeat: e.target.value })} style={inputStyle}>
            <option value="once">Once per diner</option><option value="monthly">Once per diner per month</option>
          </select>
        </label>
      </div>
      <label style={field}>Description<input maxLength={1000} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} style={inputStyle} placeholder="Small dining credit for bringing 3 friends who stayed" /></label>
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
        {ELIGIBILITY_FIELDS.map(([k, l]) => (
          <label key={k} style={field}>{l}
            <input type="number" min="0" value={f.eligibility[k] ?? ""} style={inputStyle}
              onChange={(e) => setF({ ...f, eligibility: { ...f.eligibility, [k]: e.target.value === "" ? undefined : Number(e.target.value) } })} />
          </label>
        ))}
      </div>
      <fieldset style={{ border: 0, padding: 0, margin: 0, display: "flex", gap: 12, flexWrap: "wrap", fontSize: 13 }}>
        <legend style={{ fontSize: 12, color: OWNER_COLORS.muted, marginBottom: 4 }}>Categories (none = any)</legend>
        {CATEGORIES.map(([k, l]) => (
          <label key={k} style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
            <input type="checkbox" checked={f.classifications.includes(k)}
              onChange={(e) => setF({ ...f, classifications: e.target.checked ? [...f.classifications, k] : f.classifications.filter((c) => c !== k) })} /> {l}
          </label>
        ))}
      </fieldset>
      <div style={{ fontSize: 12, color: OWNER_COLORS.muted }}>Restaurant perks need that restaurant&apos;s agreement first; set those up with Andre before adding them here.</div>
      <div style={{ display: "flex", gap: 8 }}>
        <button type="submit" disabled={busy} style={{ ...smallButton, background: OWNER_COLORS.ink, color: "#fff", borderColor: OWNER_COLORS.ink }}>{busy ? "Adding…" : "Add reward type"}</button>
        <button type="button" style={smallButton} onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </form>
  );
}

function Eligible({ type, clusterId, onOpen, onClose, onProposed, onError }) {
  const { data, error, reload } = useLoad(() => getOwnerRewardEligible(type.id, { cluster_id: clusterId || "" }), [type.id, clusterId]);
  const propose = async (row) => {
    try {
      await proposeOwnerReward({ reward_type_id: type.id, user_id: row.user_id });
      onProposed(row.display_name);
      reload();
    } catch (err) {
      onError(errText(err, "Couldn't propose it."));
    }
  };
  return (
    <Section title={`Who qualifies: ${type.name}`} subtitle={describeEligibility(type.eligibility)}
      action={<button type="button" style={smallButton} onClick={onClose}>Close</button>}>
      <Gate data={data} error={error} loading="Checking…">
        {data?.rows ? (
          <>
            <Table rows={data.rows} empty="Nobody qualifies right now (or they already have it for this period)." columns={[
              ["Diner", (r) => <button type="button" onClick={() => onOpen(r.user_id)} style={linkButton}>{r.display_name} #{r.user_id}</button>],
              ["Category", "category"], ["Active friends", "active_friends"], ["Activated referrals", "activated_recruits"],
              ["Plans", "confirmed_hosted"], ["NVS", (r) => score(r.nvs)],
              ["", (r) => <button type="button" style={smallButton} onClick={() => propose(r)}>Propose</button>],
            ]} />
            {data.more_not_checked ? <div style={{ fontSize: 12, color: OWNER_COLORS.muted, marginTop: 8 }}>Checked the top {data.checked} by NVS.</div> : null}
          </>
        ) : null}
      </Gate>
    </Section>
  );
}

// ── User Detail ───────────────────────────────────────────────────────────────

function UserDetail({ userId, onPick }) {
  const [input, setInput] = useState(userId ? String(userId) : "");
  useEffect(() => { if (userId) setInput(String(userId)); }, [userId]);
  const { data, error } = useLoad(() => (userId ? getOwnerNetworkValueUser(userId) : Promise.resolve({ idle: true })), [userId]);
  return (
    <>
      <form onSubmit={(e) => { e.preventDefault(); const id = Number(input); if (id > 0) onPick(id); }} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13 }}>
        <label htmlFor="nv-user" style={{ color: OWNER_COLORS.muted }}>Diner account id</label>
        <input id="nv-user" inputMode="numeric" value={input} onChange={(e) => setInput(e.target.value.replace(/\D/g, ""))} style={{ ...inputStyle, width: 120 }} />
        <button type="submit" style={smallButton}>Show</button>
      </form>
      {data?.idle ? <EmptyState>Pick a diner from Top Network Builders, or enter an account id.</EmptyState> : (
        <Gate data={data} error={error} loading="Loading diner…">
          {data?.user ? <UserBody d={data} /> : null}
        </Gate>
      )}
    </>
  );
}

function UserBody({ d }) {
  const l = d.latest;
  return (
    <>
      <Section title={`${d.user.display_name} · #${d.user.id}`}
        subtitle={`Joined ${laDate(d.user.created_at)}${d.user.edu_verified ? " · verified student" : ""}${d.user.is_test ? " · test account (never scored)" : ""}${d.recruited_by ? ` · came in through #${d.recruited_by.user_id} (${d.recruited_by.source})` : ""}`}>
        {l ? (
          <div style={{ display: "grid", gap: 14 }}>
            <div style={{ display: "flex", gap: 18, flexWrap: "wrap", alignItems: "baseline" }}>
              <div style={{ fontSize: 34, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{score(l.nvs)}<span style={{ fontSize: 14, color: OWNER_COLORS.muted }}> / 100</span></div>
              <div style={{ fontSize: 13, color: OWNER_COLORS.muted }}>{l.category} · {l.friends} dining friends · {l.cluster_name || "no primary cluster"} · snapshot {l.score_day}</div>
            </div>
            {d.breakdown.map((b) => (
              <div key={b.part} style={{ display: "grid", gap: 4 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <strong>{b.label}</strong><span style={{ fontVariantNumeric: "tabular-nums" }}>{score(b.points)} / {b.max}</span>
                </div>
                <div style={{ background: "#EEF0F3", borderRadius: 6, height: 10 }}>
                  <div style={{ width: `${b.max ? (b.points / b.max) * 100 : 0}%`, height: 10, borderRadius: 6, background: "#2a78d6" }} />
                </div>
                <div style={{ fontSize: 12, color: OWNER_COLORS.muted }}>{b.detail}</div>
              </div>
            ))}
          </div>
        ) : <EmptyState>No score yet for this diner.</EmptyState>}
      </Section>
      <Section title="NVS over time" subtitle="Daily snapshots, last 90 days.">
        <Trend title="NVS" rows={[...d.history].reverse().map((h) => ({ bucket: h.day, value: h.nvs }))} format={score} />
      </Section>
      <Section title="Recruits" subtitle="New diners credited to this person.">
        <Table rows={d.recruits} empty="Nobody credited yet." columns={[
          ["Diner", (r) => `${r.display_name} #${r.user_id}`], ["Source", "source"], ["Credited from", (r) => laDate(r.evidence_at)],
          ["Activated", (r) => (r.activated_at ? `${laDate(r.activated_at)} (${r.activation_kind === "accepted_invitation" ? "accepted an invitation" : "qualifying action"})` : "Not yet")],
          ["Counted", (r) => (r.shared_device ? "No: same device" : r.activated_at ? "Yes" : "—")],
        ]} />
      </Section>
      <Grid min={300}>
        <Section title="Plans hosted (90 days)" subtitle="Accepted isn't attended; 'said went' is self-reported.">
          <Table rows={d.hosted_plans} empty="No plans hosted." columns={[
            ["Created", (r) => laDate(r.created_at)], ["Kind", "invite_kind"], ["For", (r) => r.scheduled_date || "—"], ["Accepted", "accepted"], ["Said went", "said_went"],
          ]} />
        </Section>
        <Section title="Connections by month">
          <Table rows={d.connections_by_month} empty="No accepted Connects." columns={[["Month", "month"], ["New Connects", "n"]]} />
        </Section>
      </Grid>
      <Section title="Reward history">
        <Table rows={d.rewards} empty="No rewards." columns={[
          ["Reward", "reward_name"], ["Status", (r) => STATUS_LABEL[r.status]], ["Value", (r) => money(r.value_cents)],
          ["Proposed", (r) => laDate(r.proposed_at)], ["Decided", (r) => (r.decided_at ? `${laDate(r.decided_at)} · ${r.decided_by || "—"}` : "—")],
          ["Issued", (r) => laDate(r.issued_at)], ["Redeemed", (r) => laDate(r.redeemed_at)],
        ]} />
      </Section>
    </>
  );
}

// ── Scoring settings ──────────────────────────────────────────────────────────

const WEIGHT_FIELDS = [["recruits", "New activated users recruited"], ["coordination", "Successful dining coordination"], ["connections", "Active dining connections"], ["retention", "Repeat engagement"]];
const CAP_FIELDS = [["recruits", "Activated recruits for full points"], ["coordination", "Plans for full points"], ["connections", "Active friends for full points"], ["retention_weeks", "Active weeks counted"]];
const CLASS_FIELDS = [["sheep_min", "Sheep from"], ["gold_min", "Gold Standard from"], ["influencer_min", "Influencer from"]];

function Scoring() {
  const { data, error, reload } = useLoad(() => getOwnerNetworkValueSettings(), []);
  const [draft, setDraft] = useState(null);
  const [msg, setMsg] = useState("");
  useEffect(() => { if (data?.settings) setDraft(data.settings); }, [data]);
  const setIn = useCallback((group, key, value) => setDraft((d) => ({ ...d, [group]: { ...d[group], [key]: value === "" ? "" : Number(value) } })), []);
  const total = draft ? WEIGHT_FIELDS.reduce((n, [k]) => n + (Number(draft.weights[k]) || 0), 0) : 0;
  const save = async () => {
    setMsg("");
    try {
      const out = await saveOwnerNetworkValueSettings(draft);
      setMsg(`Saved as version ${out.settings.version}. The next hourly run uses it; earlier days keep the version they were scored with.`);
      reload();
    } catch (err) {
      setMsg(errText(err, "Couldn't save."));
    }
  };
  const box = (group, [k, label], extra = {}) => (
    <label key={k} style={{ display: "grid", gap: 4, fontSize: 12, color: OWNER_COLORS.muted }}>{label}
      <input type="number" min="0" step={extra.step || 1} value={draft[group][k]} onChange={(e) => setIn(group, k, e.target.value)} style={inputStyle} />
    </label>
  );
  return (
    <Gate data={data} error={error}>
      {draft ? (
        <Section title="Scoring" subtitle={`Version ${data.version}${data.created_at ? ` · saved ${laDate(data.created_at)}` : ""}. Rolling ${draft.window_days}-day window; active = a qualifying action in the last ${draft.active_window_days} days.`}>
          <div style={{ display: "grid", gap: 16 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>Weights (must add up to 100 · now {total})</div>
              <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>{WEIGHT_FIELDS.map((f) => box("weights", f))}</div>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>Full points at</div>
              <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>{CAP_FIELDS.map((f) => box("caps", f))}</div>
            </div>
            <label style={{ display: "grid", gap: 4, fontSize: 12, color: OWNER_COLORS.muted, maxWidth: 260 }}>Credit for joining someone else&apos;s plan (0–1)
              <input type="number" min="0" max="1" step="0.1" value={draft.joined_plan_weight} onChange={(e) => setDraft({ ...draft, joined_plan_weight: e.target.value === "" ? "" : Number(e.target.value) })} style={inputStyle} />
            </label>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>Categories (dining friends)</div>
              <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>{CLASS_FIELDS.map((f) => box("classification", f))}</div>
            </div>
            {msg ? <Banner>{msg}</Banner> : null}
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" onClick={save} disabled={total !== 100} style={{ ...smallButton, background: OWNER_COLORS.ink, color: "#fff", borderColor: OWNER_COLORS.ink, opacity: total === 100 ? 1 : 0.5 }}>Save new version</button>
              <button type="button" style={smallButton} onClick={() => setDraft(data.settings)}>Reset</button>
            </div>
          </div>
        </Section>
      ) : null}
    </Gate>
  );
}
