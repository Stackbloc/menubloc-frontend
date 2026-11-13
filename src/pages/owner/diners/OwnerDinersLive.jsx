import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { OWNER_COLORS, PageCard, SectionTitle } from "../OwnerLayout.jsx";
import { SimpleTable } from "../intelligence/intelligenceShared.jsx";
import { getOwnerDinerLive, getOwnerOnlineDiners } from "../../../lib/ownerApi.js";
import { dinerProfilePath } from "./dinerMetricDisplay.js";
import {
  DIRECTORY_SORT_OPTIONS,
  LIVE_RANGE_OPTIONS,
  LIVE_REFRESH_MS,
  PLATFORM_LABELS,
  compareText,
  formatDuration,
  hourLabel,
  platformList,
  showNumber,
  timeAgo,
} from "./liveDisplay.js";

/**
 * Diner Intelligence Stage 3 (plan 39): Live Activity + the online diner directory.
 * Platform owner only (the API refuses everyone else). Refreshes every 30 s while the tab is visible.
 * Online = a heartbeat in the last 2 minutes. Staff and seeded test diners are never counted.
 */

const GRID = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 };
const TONE = { up: "#1e3a8a", down: "#9f1239", flat: OWNER_COLORS.muted, none: OWNER_COLORS.muted };

function useVisibleInterval(fn, ms, deps) {
  const saved = useRef(fn);
  saved.current = fn;
  useEffect(() => {
    const tick = () => {
      if (typeof document === "undefined" || document.visibilityState === "visible") saved.current();
    };
    const id = setInterval(tick, ms);
    const onVis = () => document.visibilityState === "visible" && saved.current();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

function Chip({ selected, onClick, children, testId }) {
  // Selected chip = dark fill + white text; never a green pill (Andre 2026-11-06).
  return (
    <button
      type="button"
      data-testid={testId}
      aria-pressed={selected}
      onClick={onClick}
      style={{
        padding: "7px 12px",
        borderRadius: 999,
        border: `1px solid ${selected ? OWNER_COLORS.ink : OWNER_COLORS.line}`,
        background: selected ? OWNER_COLORS.ink : "#fff",
        color: selected ? "#fff" : OWNER_COLORS.ink,
        fontSize: 13,
        fontWeight: 700,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function Stat({ label, value, sub, testId }) {
  return (
    <PageCard style={{ padding: 14 }}>
      <div data-testid={testId}>
        <div style={{ fontSize: 12, fontWeight: 700, color: OWNER_COLORS.muted }}>{label}</div>
        <div style={{ fontSize: 26, fontWeight: 800, color: OWNER_COLORS.ink, marginTop: 4 }}>{value}</div>
        {sub ? <div style={{ fontSize: 12, color: OWNER_COLORS.muted, marginTop: 4, lineHeight: 1.35 }}>{sub}</div> : null}
      </div>
    </PageCard>
  );
}

function CompareLine({ now, before, hasBefore, format }) {
  const c = compareText(now, before, { hasBefore, format });
  return <span style={{ color: TONE[c.tone] }}>{c.text}</span>;
}

/** 24 hour columns: bar = average diners online, tick = peak. */
function HourChart({ hours, tzLabel }) {
  const max = Math.max(1, ...hours.map((h) => h.peak_users || 0));
  return (
    <div data-testid="live-hour-chart">
      <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 120, borderBottom: `1px solid ${OWNER_COLORS.line}` }}>
        {hours.map((h) => {
          const avg = h.avg_users || 0;
          const peak = h.peak_users || 0;
          return (
            <div
              key={h.hour}
              title={`${hourLabel(h.hour)}: average ${showNumber(h.avg_users)}, peak ${showNumber(h.peak_users)}`}
              style={{ flex: 1, height: "100%", position: "relative", minWidth: 6 }}
            >
              {h.samples ? (
                <>
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: `${(avg / max) * 100}%`, background: OWNER_COLORS.ink, opacity: 0.8, borderRadius: "3px 3px 0 0", minHeight: avg ? 2 : 0 }} />
                  <div style={{ position: "absolute", left: 0, right: 0, bottom: `${(peak / max) * 100}%`, height: 2, background: OWNER_COLORS.muted }} />
                </>
              ) : null}
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: OWNER_COLORS.muted, marginTop: 4 }}>
        <span>12 AM</span>
        <span>6 AM</span>
        <span>12 PM</span>
        <span>6 PM</span>
        <span>11 PM</span>
      </div>
      <div style={{ fontSize: 12, color: OWNER_COLORS.muted, marginTop: 6 }}>
        Bars = average diners online in that hour; line = the peak. Hours are {tzLabel}.
      </div>
    </div>
  );
}

function DayPeaks({ days }) {
  if (!days.length) return <div style={{ fontSize: 13, color: OWNER_COLORS.muted }}>No days recorded in this range yet.</div>;
  const max = Math.max(1, ...days.map((d) => d.peak_users || 0));
  return (
    <div data-testid="live-day-peaks" style={{ display: "grid", gap: 6 }}>
      {days.map((d) => (
        <div key={d.day} style={{ display: "grid", gridTemplateColumns: "92px 1fr 64px", gap: 8, alignItems: "center", fontSize: 12 }}>
          <span style={{ color: OWNER_COLORS.muted }}>{d.day}</span>
          <div style={{ background: OWNER_COLORS.page, borderRadius: 4, height: 10 }}>
            <div style={{ width: `${((d.peak_users || 0) / max) * 100}%`, background: OWNER_COLORS.ink, height: "100%", borderRadius: 4 }} />
          </div>
          <span style={{ fontWeight: 700, color: OWNER_COLORS.ink }}>peak {showNumber(d.peak_users)}</span>
        </div>
      ))}
    </div>
  );
}

export function LiveActivitySection() {
  const [range, setRange] = useState("1d");
  const [clusterId, setClusterId] = useState(0);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const load = () =>
    getOwnerDinerLive({ range, cluster_id: clusterId || undefined })
      .then((payload) => {
        setData(payload);
        setError("");
      })
      .catch(() => setError("Live activity couldn't be loaded just now."));

  useEffect(() => {
    setData(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, clusterId]);
  useVisibleInterval(load, LIVE_REFRESH_MS, [range, clusterId]);

  const notTracked = data?.status === "not_instrumented";
  const now = data?.now;
  const history = data?.history;
  const sessions = data?.sessions;
  const compare = data?.compare;
  const tzLabel = data?.timezone_label || "Los Angeles time";
  const rangeLabel = (LIVE_RANGE_OPTIONS.find(([k]) => k === range) || [])[1];

  return (
    <div style={{ marginBottom: 24 }} data-testid="live-activity">
      <SectionTitle
        title="Live Activity"
        subtitle="Who is on Menuply right now and when diners are online. Online = the app or website was open in the last 2 minutes. Staff and test diners are left out; signed-out visitors are shown separately. Refreshes every 30 seconds."
      />
      <PageCard style={{ padding: 16, marginBottom: 12 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          {LIVE_RANGE_OPTIONS.map(([key, label]) => (
            <Chip key={key} testId={`live-range-${key}`} selected={range === key} onClick={() => setRange(key)}>
              {label}
            </Chip>
          ))}
          <label style={{ fontSize: 12, fontWeight: 700, color: OWNER_COLORS.muted, marginLeft: 8 }}>
            Where{" "}
            <select
              data-testid="live-cluster"
              value={clusterId}
              onChange={(e) => setClusterId(Number(e.target.value) || 0)}
              style={{ marginLeft: 6, padding: "6px 8px", borderRadius: 8, border: `1px solid ${OWNER_COLORS.line}`, fontSize: 13 }}
            >
              <option value={0}>All of Menuply</option>
              {(data?.clusters || []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        {data?.period ? (
          <div style={{ marginTop: 8, fontSize: 12, color: OWNER_COLORS.muted }}>
            {data.period.from} through {data.period.to} ({tzLabel}).{" "}
            {data.since ? `Recorded since ${new Date(data.since).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}.` : "Nothing recorded here yet."}
          </div>
        ) : null}
        {error ? <div style={{ marginTop: 8, color: "#9f1239", fontSize: 13 }}>{error}</div> : null}
        {notTracked ? <div style={{ marginTop: 8, fontSize: 13, color: OWNER_COLORS.muted }}>Not tracked yet: {data.reason}</div> : null}
      </PageCard>

      {now ? (
        <div style={GRID}>
          <Stat testId="live-now-users" label="Diners online now" value={showNumber(now.users)} sub={`${showNumber(now.sessions)} device${now.sessions === 1 ? "" : "s"}`} />
          <Stat testId="live-now-anon" label="Signed-out visitors now" value={showNumber(now.anon)} />
          {now.by_platform.map((p) => (
            <Stat
              key={p.platform}
              testId={`live-now-${p.platform}`}
              label={`${PLATFORM_LABELS[p.platform]} now`}
              value={showNumber(p.users)}
              sub={p.anon ? `+ ${showNumber(p.anon)} signed out` : null}
            />
          ))}
        </div>
      ) : !error && !notTracked ? (
        <div style={{ fontSize: 13, color: OWNER_COLORS.muted }}>Loading live activity…</div>
      ) : null}

      {now?.by_cluster?.length ? (
        <PageCard style={{ padding: 14, marginTop: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: OWNER_COLORS.muted, marginBottom: 6 }}>Online now by place</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, fontSize: 13 }} data-testid="live-now-clusters">
            {now.by_cluster.map((c) => (
              <span key={c.id}>
                <strong>{c.name}</strong> {showNumber(c.users)}
                {c.anon ? <span style={{ color: OWNER_COLORS.muted }}> + {showNumber(c.anon)} signed out</span> : null}
              </span>
            ))}
          </div>
        </PageCard>
      ) : null}

      {history ? (
        <>
          <div style={{ ...GRID, marginTop: 12 }}>
            <Stat
              testId="live-avg-users"
              label={`Average online (${rangeLabel})`}
              value={showNumber(history.avg_users)}
              sub={compare ? <CompareLine now={compare.avg_users.now} before={compare.avg_users.before} hasBefore={compare.previous_has_data} /> : null}
            />
            <Stat
              testId="live-peak-users"
              label={`Peak online (${rangeLabel})`}
              value={showNumber(history.peak_users)}
              sub={compare ? <CompareLine now={compare.peak_users.now} before={compare.peak_users.before} hasBefore={compare.previous_has_data} /> : null}
            />
            <Stat
              testId="live-sessions"
              label="Signed-in sessions"
              value={showNumber(sessions?.sessions)}
              sub={compare ? <CompareLine now={compare.sessions.now} before={compare.sessions.before} hasBefore={compare.sessions.before > 0} /> : null}
            />
            <Stat
              testId="live-session-length"
              label="Session length"
              value={formatDuration(sessions?.median_secs)}
              sub={
                <>
                  median · average {formatDuration(sessions?.avg_secs)}
                  {compare ? (
                    <>
                      <br />
                      <CompareLine now={compare.avg_secs.now} before={compare.avg_secs.before} hasBefore={compare.sessions.before > 0} format={formatDuration} />
                    </>
                  ) : null}
                </>
              }
            />
          </div>

          <PageCard style={{ padding: 16, marginTop: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: OWNER_COLORS.ink, marginBottom: 10 }}>Online by hour of day</div>
            <HourChart hours={history.hours} tzLabel={tzLabel} />
          </PageCard>

          <div style={{ ...GRID, marginTop: 12 }} data-testid="live-meals">
            {history.meals.map((m) => (
              <Stat key={m.key} testId={`live-meal-${m.key}`} label={m.label} value={showNumber(m.avg_users)} sub={`average online · peak ${showNumber(m.peak_users)}`} />
            ))}
          </div>
          <div style={{ fontSize: 12, color: OWNER_COLORS.muted, marginTop: 6 }}>
            Meal times match Today: breakfast 7–10 AM, lunch 11 AM–2 PM, dinner 5–9 PM, late night 9 PM–4 AM ({tzLabel}).
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12, marginTop: 12 }}>
            <PageCard style={{ padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: OWNER_COLORS.ink, marginBottom: 10 }}>Daily peak</div>
              <DayPeaks days={history.days} />
            </PageCard>
            <PageCard style={{ padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: OWNER_COLORS.ink, marginBottom: 10 }}>By platform ({rangeLabel})</div>
              <SimpleTable
                rows={history.by_platform.map((p) => ({ ...p, s: (sessions?.by_platform || []).find((x) => x.platform === p.platform) }))}
                columns={[
                  ["Platform", "platform", (r) => PLATFORM_LABELS[r.platform]],
                  ["Avg online", "avg_users", (r) => showNumber(r.avg_users)],
                  ["Peak", "peak_users", (r) => showNumber(r.peak_users)],
                  ["Sessions", "sessions", (r) => showNumber(r.s?.sessions)],
                  ["Median length", "median", (r) => formatDuration(r.s?.median_secs)],
                ]}
                emptyLabel="No platform data yet."
              />
            </PageCard>
          </div>
        </>
      ) : null}
    </div>
  );
}

export function OnlineDirectory() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [platform, setPlatform] = useState("");
  const [sort, setSort] = useState("last_seen");
  const [queryText, setQueryText] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(queryText.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [queryText]);

  const load = () =>
    getOwnerOnlineDiners({ page, page_size: 25, q: query || undefined, sort, platform: platform || undefined })
      .then((payload) => {
        setData(payload);
        setError("");
      })
      .catch(() => setError("Online diners couldn't be loaded just now."));

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, query, sort, platform]);
  useVisibleInterval(load, LIVE_REFRESH_MS, [page, query, sort, platform]);

  const rows = Array.isArray(data?.rows) ? data.rows : [];
  const paging = data?.paging;
  const nowMs = data?.generated_at ? new Date(data.generated_at).getTime() : Date.now();

  return (
    <div style={{ marginBottom: 24 }} data-testid="online-directory">
      <SectionTitle
        title="Online now"
        subtitle="Signed-in diners with Menuply open in the last 2 minutes, one row per diner however many devices. Last activity shows only the kind of thing they did, never what they wrote. Owner only."
      />
      <PageCard style={{ padding: 16 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          <Chip testId="online-platform-all" selected={!platform} onClick={() => { setPlatform(""); setPage(1); }}>
            All
          </Chip>
          {Object.entries(PLATFORM_LABELS).map(([key, label]) => (
            <Chip key={key} testId={`online-platform-${key}`} selected={platform === key} onClick={() => { setPlatform(key); setPage(1); }}>
              {label}
            </Chip>
          ))}
          <label style={{ fontSize: 12, fontWeight: 700, color: OWNER_COLORS.muted, marginLeft: 8 }}>
            Sort{" "}
            <select
              data-testid="online-sort"
              value={sort}
              onChange={(e) => { setSort(e.target.value); setPage(1); }}
              style={{ marginLeft: 6, padding: "6px 8px", borderRadius: 8, border: `1px solid ${OWNER_COLORS.line}`, fontSize: 13 }}
            >
              {DIRECTORY_SORT_OPTIONS.map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <input
            type="search"
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            placeholder="Name or email"
            data-testid="online-search"
            style={{ padding: "8px 10px", borderRadius: 10, border: `1px solid ${OWNER_COLORS.line}`, fontSize: 13, minWidth: 0, flex: "1 1 160px", maxWidth: 260 }}
          />
        </div>
        {error ? <div style={{ marginTop: 10, color: "#9f1239", fontSize: 13 }}>{error}</div> : null}
        {data?.status === "not_instrumented" ? (
          <div style={{ marginTop: 10, fontSize: 13, color: OWNER_COLORS.muted }}>Not tracked yet on this database.</div>
        ) : null}
        <div style={{ marginTop: 12 }} data-testid="online-table">
          <SimpleTable
            rows={rows}
            columns={[
              [
                "Diner",
                "name",
                (r) => (
                  <Link
                    to={dinerProfilePath(r.id)}
                    data-testid={`online-row-${r.id}`}
                    style={{ display: "inline-flex", alignItems: "center", gap: 8, color: OWNER_COLORS.ink, fontWeight: 700, textDecoration: "none" }}
                  >
                    {r.avatar_url ? (
                      <img src={r.avatar_url} alt="" width={28} height={28} style={{ borderRadius: "50%", objectFit: "cover" }} />
                    ) : (
                      <span style={{ width: 28, height: 28, borderRadius: "50%", background: OWNER_COLORS.page, display: "inline-block" }} />
                    )}
                    <span>
                      <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: OWNER_COLORS.ink, marginRight: 6 }} title="Online" />
                      {r.name || `Diner ${r.id}`}
                    </span>
                  </Link>
                ),
              ],
              ["Platform", "platforms", (r) => `${platformList(r.platforms)}${r.devices > 1 ? ` (${r.devices} devices)` : ""}`],
              ["Where", "cluster", (r) => r.cluster?.name || "—"],
              ["Last active", "last_seen_at", (r) => timeAgo(r.last_seen_at, nowMs)],
              ["Session", "session_secs", (r) => formatDuration(r.session_secs)],
              ["Connects", "connects", (r) => showNumber(r.connects)],
              ["Invites sent", "invites_sent", (r) => showNumber(r.invites_sent)],
              ["Invites accepted", "invites_accepted", (r) => showNumber(r.invites_accepted)],
              [
                "Last activity",
                "last_activity",
                (r) => (r.last_activity ? `${r.last_activity.label} · ${timeAgo(r.last_activity.at, nowMs)}` : "—"),
              ],
            ]}
            emptyLabel={data ? (query || platform ? "No online diners match." : "No signed-in diners online right now.") : "Loading…"}
          />
        </div>
        {paging && paging.matched > 0 ? (
          <div style={{ marginTop: 10, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", fontSize: 12, color: OWNER_COLORS.muted }}>
            <span>
              {paging.matched.toLocaleString("en-US")} online · page {paging.page} of {paging.pages}
            </span>
            <Chip testId="online-prev" selected={false} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Previous
            </Chip>
            <Chip testId="online-next" selected={false} onClick={() => setPage((p) => Math.min(paging.pages, p + 1))}>
              Next
            </Chip>
          </div>
        ) : null}
        <div style={{ marginTop: 8, fontSize: 12, color: OWNER_COLORS.muted }}>
          Invites sent = invites this diner made. Invites accepted = invites this diner said yes to.
        </div>
      </PageCard>
    </div>
  );
}
