import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import OwnerLayout, { EmptyState, OWNER_COLORS, PageCard, SectionTitle } from "./OwnerLayout.jsx";
import {
  getNutribotRun,
  getOwnerBot,
  runNutribotForRestaurant,
  runOwnerBotNow,
  searchMenuConsoleRestaurants,
  updateOwnerBotSchedule,
} from "../../lib/ownerApi.js";
import {
  DAY_NAMES,
  SCHEDULED_BOTS,
  STATUS_LABELS,
  STATUS_TONES,
  formatDateTime,
  formatDuration,
  formatTime12,
  runResultText,
  scheduleSummary,
  triggerLabel,
} from "./ownerBotFormat.js";

/**
 * Owner → Bots → Nutribot / Language Bot.
 *   - Status: last run, next run, running now
 *   - Run now
 *   - Schedule: paused / daily / weekly + time (Pacific)
 *   - Run history
 *   - Nutribot only: analyze one restaurant's whole menu right away
 */

const HOURS = Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, "0")}:00`);

const inputStyle = {
  boxSizing: "border-box",
  border: `1px solid ${OWNER_COLORS.line}`,
  borderRadius: 10,
  padding: "9px 12px",
  fontFamily: "inherit",
  fontSize: 14,
  background: "#fff",
};

function primaryButtonStyle({ busy = false, disabled = false } = {}) {
  return {
    border: "none",
    background: OWNER_COLORS.accent,
    color: "#fff",
    borderRadius: 10,
    padding: "10px 18px",
    fontWeight: 700,
    cursor: disabled ? "not-allowed" : busy ? "wait" : "pointer",
    opacity: disabled ? 0.45 : busy ? 0.7 : 1,
    whiteSpace: "nowrap",
  };
}

const secondaryButtonStyle = {
  border: `1px solid ${OWNER_COLORS.line}`,
  background: "#fff",
  borderRadius: 10,
  padding: "9px 16px",
  fontWeight: 700,
  cursor: "pointer",
};

const labelStyle = { display: "block", fontSize: 13, fontWeight: 700, marginBottom: 6, color: OWNER_COLORS.ink };
const mutedStyle = { color: OWNER_COLORS.muted, fontSize: 13 };

function StatusPill({ status }) {
  const tone = STATUS_TONES[status] || STATUS_TONES.completed_no_writes;
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        background: tone.bg,
        color: tone.fg,
        whiteSpace: "nowrap",
      }}
    >
      {STATUS_LABELS[status] || status}
    </span>
  );
}

function Stat({ label, children }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ ...mutedStyle, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4 }}>{label}</div>
      <div style={{ marginTop: 4, fontSize: 15, fontWeight: 700, color: OWNER_COLORS.ink }}>{children}</div>
    </div>
  );
}

function RunHistory({ botKey, runs, showRestaurant = false, emptyText }) {
  if (!runs?.length) return <EmptyState>{emptyText}</EmptyState>;
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ textAlign: "left", color: OWNER_COLORS.muted }}>
            <th style={{ padding: "8px 10px 8px 0" }}>Started</th>
            {showRestaurant ? <th style={{ padding: "8px 10px" }}>Restaurant</th> : null}
            <th style={{ padding: "8px 10px" }}>How</th>
            <th style={{ padding: "8px 10px" }}>Status</th>
            <th style={{ padding: "8px 10px" }}>Result</th>
            <th style={{ padding: "8px 0 8px 10px" }}>Took</th>
          </tr>
        </thead>
        <tbody>
          {runs.map((run) => (
            <tr key={run.id} style={{ borderTop: `1px solid ${OWNER_COLORS.line}`, verticalAlign: "top" }}>
              <td style={{ padding: "10px 10px 10px 0", whiteSpace: "nowrap" }}>{formatDateTime(run.started_at)}</td>
              {showRestaurant ? (
                <td style={{ padding: 10 }}>{run.restaurant_name || `#${run.restaurant_id}`}</td>
              ) : null}
              <td style={{ padding: 10, whiteSpace: "nowrap" }}>{triggerLabel(run.trigger)}</td>
              <td style={{ padding: 10 }}><StatusPill status={run.status} /></td>
              <td style={{ padding: 10 }}>
                {runResultText(botKey, run)}
                {run.error ? <div style={{ ...mutedStyle, color: "#b91c1c", marginTop: 2 }}>{run.error}</div> : null}
              </td>
              <td style={{ padding: "10px 0 10px 10px", whiteSpace: "nowrap", color: OWNER_COLORS.muted }}>
                {run.status === "running" ? "…" : formatDuration(run.started_at, run.finished_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ScheduleEditor({ bot, onSaved }) {
  const schedule = bot.schedule;
  const [mode, setMode] = useState(schedule.enabled ? schedule.frequency : "paused");
  const [day, setDay] = useState(schedule.day_of_week ?? 0);
  const [time, setTime] = useState(schedule.time_of_day || "12:00");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setMode(schedule.enabled ? schedule.frequency : "paused");
    setDay(schedule.day_of_week ?? 0);
    setTime(schedule.time_of_day || "12:00");
  }, [schedule.enabled, schedule.frequency, schedule.day_of_week, schedule.time_of_day]);

  const dirty =
    mode !== (schedule.enabled ? schedule.frequency : "paused") ||
    (mode === "weekly" && Number(day) !== Number(schedule.day_of_week)) ||
    (mode !== "paused" && time !== schedule.time_of_day);

  // Keep the owner's exact minute if it isn't on the hour (e.g. set via the API).
  const timeOptions = HOURS.includes(time) ? HOURS : [...HOURS, time].sort();

  async function save() {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const body =
        mode === "paused"
          ? { enabled: false }
          : { enabled: true, frequency: mode, time_of_day: time, ...(mode === "weekly" ? { day_of_week: Number(day) } : {}) };
      const next = await updateOwnerBotSchedule(bot.bot_key, body);
      setSaved(true);
      onSaved(next);
    } catch (err) {
      setError(err?.message || "Could not save the schedule");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
        <div>
          <label style={labelStyle} htmlFor={`${bot.bot_key}-mode`}>Runs</label>
          <select id={`${bot.bot_key}-mode`} style={inputStyle} value={mode} onChange={(e) => { setMode(e.target.value); setSaved(false); }}>
            <option value="weekly">Every week</option>
            <option value="daily">Every day</option>
            <option value="paused">Paused</option>
          </select>
        </div>
        {mode === "weekly" ? (
          <div>
            <label style={labelStyle} htmlFor={`${bot.bot_key}-day`}>On</label>
            <select id={`${bot.bot_key}-day`} style={inputStyle} value={day} onChange={(e) => { setDay(Number(e.target.value)); setSaved(false); }}>
              {DAY_NAMES.map((name, i) => <option key={name} value={i}>{name}</option>)}
            </select>
          </div>
        ) : null}
        {mode !== "paused" ? (
          <div>
            <label style={labelStyle} htmlFor={`${bot.bot_key}-time`}>At (Pacific)</label>
            <select id={`${bot.bot_key}-time`} style={inputStyle} value={time} onChange={(e) => { setTime(e.target.value); setSaved(false); }}>
              {timeOptions.map((t) => <option key={t} value={t}>{formatTime12(t)}</option>)}
            </select>
          </div>
        ) : null}
        <button type="button" onClick={save} disabled={!dirty || saving} style={primaryButtonStyle({ busy: saving, disabled: !dirty })}>
          {saving ? "Saving…" : "Save schedule"}
        </button>
      </div>
      <div style={{ ...mutedStyle, marginTop: 10 }}>
        {mode === "paused"
          ? "While paused, the bot only runs when you click Run now."
          : "Changes apply from the next scheduled time. A run already in progress is not affected."}
      </div>
      {saved && !dirty ? <div style={{ marginTop: 8, color: "#047857", fontSize: 13, fontWeight: 700 }}>Schedule saved.</div> : null}
      {error ? <div style={{ marginTop: 8, color: "#b91c1c", fontSize: 13 }}>{error}</div> : null}
    </div>
  );
}

function RestaurantAnalyzer({ onFinished }) {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [run, setRun] = useState(null); // { log_id, total_items, status, totals, error }
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const pollRef = useRef(null);

  useEffect(() => () => clearTimeout(pollRef.current), []);

  async function handleSearch(e) {
    e?.preventDefault();
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    setError("");
    try {
      const data = await searchMenuConsoleRestaurants({ q, limit: 8 });
      setResults(data?.restaurants || []);
    } catch (err) {
      setError(err?.message || "Search failed");
    } finally {
      setSearching(false);
    }
  }

  function poll(logId) {
    clearTimeout(pollRef.current);
    pollRef.current = setTimeout(async () => {
      try {
        const data = await getNutribotRun(logId);
        setRun((cur) => ({ ...cur, ...data.run }));
        if (data.run.status === "running") poll(logId);
        else onFinished?.();
      } catch {
        poll(logId);
      }
    }, 2000);
  }

  async function analyze() {
    if (!restaurant) return;
    setBusy(true);
    setError("");
    setRun(null);
    try {
      const data = await runNutribotForRestaurant(restaurant.id);
      setRun({ log_id: data.log_id, status: "running", totals: { items: data.total_items, updated: 0 } });
      onFinished?.();
      poll(data.log_id);
    } catch (err) {
      if (err?.payload?.code === "already_running" && err.payload.log_id) {
        setRun({ log_id: err.payload.log_id, status: "running", totals: {} });
        poll(err.payload.log_id);
      } else {
        setError(err?.message || "Could not start the analysis");
      }
    } finally {
      setBusy(false);
    }
  }

  const running = run?.status === "running";

  return (
    <div>
      {restaurant ? (
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
          <div>
            <div style={{ fontWeight: 700 }}>{restaurant.name}</div>
            <div style={mutedStyle}>
              #{restaurant.id}
              {restaurant.city ? ` · ${restaurant.city}${restaurant.state ? `, ${restaurant.state}` : ""}` : ""}
            </div>
          </div>
          <button type="button" style={secondaryButtonStyle} disabled={running} onClick={() => { setRestaurant(null); setRun(null); setError(""); }}>
            Change
          </button>
          <button type="button" onClick={analyze} disabled={busy || running} style={primaryButtonStyle({ busy: busy || running })}>
            {running ? "Analyzing…" : busy ? "Starting…" : "Analyze menu now"}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSearch}>
          <label style={labelStyle} htmlFor="nutribot-restaurant-search">Restaurant</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input
              id="nutribot-restaurant-search"
              style={{ ...inputStyle, flex: "1 1 260px" }}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or #id"
            />
            <button type="submit" style={primaryButtonStyle({ busy: searching, disabled: !query.trim() })} disabled={!query.trim() || searching}>
              {searching ? "Searching…" : "Search"}
            </button>
          </div>
          {results ? (
            <div style={{ marginTop: 10, display: "grid", gap: 6 }}>
              {results.length === 0 ? (
                <div style={mutedStyle}>No restaurants found.</div>
              ) : (
                results.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => { setRestaurant(r); setResults(null); }}
                    style={{ ...secondaryButtonStyle, textAlign: "left", fontWeight: 400 }}
                  >
                    <span style={{ fontWeight: 700 }}>{r.name}</span>{" "}
                    <span style={mutedStyle}>
                      #{r.id}
                      {r.city ? ` · ${r.city}${r.state ? `, ${r.state}` : ""}` : ""}
                    </span>
                  </button>
                ))
              )}
            </div>
          ) : null}
        </form>
      )}

      {run ? (
        <div
          style={{
            marginTop: 8,
            padding: 14,
            borderRadius: 12,
            border: `1px solid ${OWNER_COLORS.line}`,
            background: "#fff",
            display: "flex",
            gap: 12,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <StatusPill status={run.status} />
          <span style={{ fontSize: 14 }}>
            {running
              ? `Analyzing ${run.totals?.items ?? ""} menu items…`
              : runResultText("nutribot", run) || "Done."}
          </span>
          {run.error ? <span style={{ color: "#b91c1c", fontSize: 13 }}>{run.error}</span> : null}
        </div>
      ) : null}
      {error ? <div style={{ marginTop: 8, color: "#b91c1c", fontSize: 13 }}>{error}</div> : null}
    </div>
  );
}

export default function OwnerScheduledBot({ botKey }) {
  const meta = SCHEDULED_BOTS[botKey];
  const [bot, setBot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(false);
  const [runMessage, setRunMessage] = useState("");
  const refreshRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const data = await getOwnerBot(botKey);
      setBot(data);
      setError("");
      return data;
    } catch (err) {
      setError(err?.message || "Could not load this bot");
      return null;
    } finally {
      setLoading(false);
    }
  }, [botKey]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  // While a run is going, refresh every 10 s so the status and history update on their own.
  useEffect(() => {
    clearTimeout(refreshRef.current);
    if (bot?.active_run) refreshRef.current = setTimeout(load, 10000);
    else setRunMessage((m) => (m.endsWith("while it runs.") ? "" : m));
    return () => clearTimeout(refreshRef.current);
  }, [bot, load]);

  async function handleRunNow() {
    setStarting(true);
    setRunMessage("");
    try {
      await runOwnerBotNow(botKey);
      setRunMessage(`${meta.name} started. This page updates on its own while it runs.`);
    } catch (err) {
      setRunMessage(err?.status === 409 ? `${meta.name} is already running.` : err?.message || "Could not start the bot");
    } finally {
      setStarting(false);
      load();
    }
  }

  const running = Boolean(bot?.active_run);
  const lastRun = bot?.runs?.[0] || bot?.last_run || null;

  return (
    <OwnerLayout
      title={meta.name}
      actions={<Link to="/owner/bots" style={{ ...secondaryButtonStyle, textDecoration: "none", color: OWNER_COLORS.ink }}>All bots</Link>}
    >
      <div style={{ display: "grid", gap: 20, gridTemplateColumns: "minmax(0, 1fr)" }}>
        {loading && !bot ? <EmptyState>Loading…</EmptyState> : null}
        {error ? <EmptyState><span style={{ color: "#b91c1c" }}>{error}</span></EmptyState> : null}

        {bot ? (
          <>
            <PageCard style={{ padding: 24 }}>
              <SectionTitle
                title="Status"
                subtitle={meta.blurb}
                action={
                  <button type="button" onClick={handleRunNow} disabled={running || starting} style={primaryButtonStyle({ busy: starting, disabled: running })}>
                    {running ? "Running…" : starting ? "Starting…" : "Run now"}
                  </button>
                }
              />
              <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
                <Stat label="Last run">
                  {lastRun ? formatDateTime(lastRun.started_at) : "Never"}
                  {lastRun ? (
                    <div style={{ marginTop: 6, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", fontWeight: 400 }}>
                      <StatusPill status={lastRun.status} />
                      <span style={mutedStyle}>{runResultText(botKey, lastRun)}</span>
                    </div>
                  ) : null}
                </Stat>
                <Stat label="Next run">
                  {running ? "Running now" : bot.next_run_at ? formatDateTime(bot.next_run_at) : "Not scheduled"}
                </Stat>
                <Stat label="Schedule">{scheduleSummary(bot.schedule)}</Stat>
              </div>
              {running ? (
                <div style={{ ...mutedStyle, marginTop: 14 }}>
                  Running since {formatDateTime(bot.active_run.started_at)} ({triggerLabel(bot.active_run.trigger)}).
                </div>
              ) : null}
              {!bot.automatic_runs_allowed ? (
                <div style={{ marginTop: 14, padding: 12, borderRadius: 10, background: "#fff7ed", color: "#9a3412", fontSize: 13 }}>
                  Automatic runs are switched off on the server, so the schedule below won&apos;t run until that switch is turned back on. Run now still works.
                </div>
              ) : null}
              {runMessage ? <div style={{ marginTop: 12, fontSize: 13, fontWeight: 700 }}>{runMessage}</div> : null}
            </PageCard>

            {botKey === "nutribot" ? (
              <PageCard style={{ padding: 24 }}>
                <SectionTitle
                  title="Analyze a restaurant now"
                  subtitle="Recalculates nutrition for every item on one restaurant's menu right away. Use it after a menu changes."
                />
                <RestaurantAnalyzer onFinished={load} />
              </PageCard>
            ) : null}

            <PageCard style={{ padding: 24 }}>
              <SectionTitle title="Schedule" subtitle="When the bot runs on its own. Times are Pacific." />
              <ScheduleEditor bot={bot} onSaved={(next) => setBot((cur) => ({ ...cur, ...next }))} />
            </PageCard>

            <PageCard style={{ padding: 24 }}>
              <SectionTitle title="Run history" subtitle="The 10 most recent full runs." />
              <RunHistory botKey={botKey} runs={bot.runs} emptyText="No runs yet." />
            </PageCard>

            {botKey === "nutribot" ? (
              <PageCard style={{ padding: 24 }}>
                <SectionTitle title="Restaurant analyses" subtitle="The 10 most recent single-restaurant runs." />
                <RunHistory botKey={botKey} runs={bot.restaurant_runs} showRestaurant emptyText="No restaurant analyses yet." />
              </PageCard>
            ) : null}
          </>
        ) : null}
      </div>
    </OwnerLayout>
  );
}
