import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import OwnerLayout, { EmptyState, OWNER_COLORS, PageCard, SectionTitle } from "./OwnerLayout.jsx";
import NutribotTemplatesPanel from "./NutribotTemplatesPanel.jsx";
import SeoBotReport from "./SeoBotReport.jsx";
import {
  acceptAddressBotCandidate,
  keepAddressBotCurrent,
  getAddressBotRun,
  getHoursBotRun,
  getNutribotRun,
  getOwnerBot,
  hoursBotReviewAction,
  runAddressBotForRestaurant,
  runHoursBotForRestaurant,
  runNutribotForRestaurant,
  runOwnerBotNow,
  searchMenuConsoleRestaurants,
  updateHoursBotCheckSchedule,
  updateOwnerBotSchedule,
} from "../../lib/ownerApi.js";
import {
  ADDRESS_OUTCOME_LABELS,
  ADDRESS_OUTCOME_STATUS,
  ADDRESS_SOURCE_LABELS,
  DAY_NAMES,
  HOURS_OUTCOME_LABELS,
  HOURS_OUTCOME_STATUS,
  HOURS_SOURCE_LABELS,
  SCHEDULED_BOTS,
  STATUS_LABELS,
  STATUS_TONES,
  formatDateTime,
  formatDuration,
  formatHoursSummary,
  formatTime12,
  hoursModeLabel,
  addressSourceUrl,
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
 *   - Nutribot only: analyze one restaurant's whole menu right away; unprocessed items,
 *     template assignment and dish templates (NutribotTemplatesPanel.jsx)
 *   - Hours Bot only: one restaurant now (Fill missing / Check existing), "What to check"
 *     (cluster, city, ZIP, near a spot, county, state, market, everywhere), review list for
 *     changed hours a person entered, Undo for automatic updates, Check existing schedule
 *     (plan 34), recent per-restaurant results, coverage of restaurants with menus
 *   - Address Bot only: same per-restaurant / market tools, LA street-address
 *     coverage, and a review list of matches the bot wasn't sure of
 *   - SEO Bot only: Search Console connection + traffic, "what to fix" from the
 *     latest run, pages checked (SeoBotReport.jsx)
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

function StatusPill({ status, label }) {
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
      {label || STATUS_LABELS[status] || status}
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

function RunHistory({ botKey, runs, showRestaurant = false, showScope = false, emptyText }) {
  if (!runs?.length) return <EmptyState>{emptyText}</EmptyState>;
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ textAlign: "left", color: OWNER_COLORS.muted }}>
            <th style={{ padding: "8px 10px 8px 0" }}>Started</th>
            {showRestaurant ? <th style={{ padding: "8px 10px" }}>Restaurant</th> : null}
            {showScope ? <th style={{ padding: "8px 10px" }}>Where</th> : null}
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
              {showScope ? <td style={{ padding: 10 }}>{run.scope_label || run.market || "All markets"}</td> : null}
              <td style={{ padding: 10, whiteSpace: "nowrap" }}>
                {triggerLabel(run.trigger)}
                {botKey === "hours_bot" && run.mode ? (
                  <div style={{ ...mutedStyle, fontSize: 12, marginTop: 2 }}>
                    {hoursModeLabel(run.mode)}
                    {run.use_google ? " · Google" : ""}
                  </div>
                ) : null}
              </td>
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

function ScheduleEditor({ bot, schedule: scheduleProp, idPrefix, saveFn, pausedText, onSaved }) {
  const schedule = scheduleProp || bot.schedule;
  const prefix = idPrefix || bot.bot_key;
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
      const next = saveFn ? await saveFn(body) : await updateOwnerBotSchedule(bot.bot_key, body);
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
          <label style={labelStyle} htmlFor={`${prefix}-mode`}>Runs</label>
          <select id={`${prefix}-mode`} style={inputStyle} value={mode} onChange={(e) => { setMode(e.target.value); setSaved(false); }}>
            <option value="weekly">Every week</option>
            <option value="daily">Every day</option>
            <option value="paused">Paused</option>
          </select>
        </div>
        {mode === "weekly" ? (
          <div>
            <label style={labelStyle} htmlFor={`${prefix}-day`}>On</label>
            <select id={`${prefix}-day`} style={inputStyle} value={day} onChange={(e) => { setDay(Number(e.target.value)); setSaved(false); }}>
              {DAY_NAMES.map((name, i) => <option key={name} value={i}>{name}</option>)}
            </select>
          </div>
        ) : null}
        {mode !== "paused" ? (
          <div>
            <label style={labelStyle} htmlFor={`${prefix}-time`}>At (Pacific)</label>
            <select id={`${prefix}-time`} style={inputStyle} value={time} onChange={(e) => { setTime(e.target.value); setSaved(false); }}>
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
          ? pausedText || "While paused, the bot only runs when you click Run now."
          : "Changes apply from the next scheduled time. A run already in progress is not affected."}
      </div>
      {saved && !dirty ? <div style={{ marginTop: 8, color: "#047857", fontSize: 13, fontWeight: 700 }}>Schedule saved.</div> : null}
      {error ? <div style={{ marginTop: 8, color: "#b91c1c", fontSize: 13 }}>{error}</div> : null}
    </div>
  );
}

const ANALYZER = {
  nutribot: {
    start: runNutribotForRestaurant,
    poll: getNutribotRun,
    button: "Analyze menu now",
    busyText: (run) => `Analyzing ${run.totals?.items ?? ""} menu items…`,
  },
  hours_bot: {
    start: runHoursBotForRestaurant,
    poll: getHoursBotRun,
    button: "Find hours now",
    busyText: () => "Looking for hours…",
  },
  address_bot: {
    start: runAddressBotForRestaurant,
    poll: getAddressBotRun,
    button: "Find address now",
    busyText: () => "Looking for the address…",
  },
};

function HoursResult({ check }) {
  if (!check) return null;
  return (
    <div style={{ display: "grid", gap: 4 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <StatusPill status={HOURS_OUTCOME_STATUS[check.outcome] || "completed_no_writes"} label={HOURS_OUTCOME_LABELS[check.outcome]} />
        {check.source ? (
          <span style={mutedStyle}>
            from{" "}
            {check.source_url ? (
              <a href={check.source_url} target="_blank" rel="noreferrer">{HOURS_SOURCE_LABELS[check.source] || check.source}</a>
            ) : (
              HOURS_SOURCE_LABELS[check.source] || check.source
            )}
          </span>
        ) : null}
      </div>
      {check.hours?.length ? (
        <div style={{ fontSize: 13 }}>
          {check.outcome === "needs_review" || check.outcome === "updated" ? <strong>Found: </strong> : null}
          {formatHoursSummary(check.hours)}
        </div>
      ) : null}
      {(check.outcome === "needs_review" || check.outcome === "updated") && check.current_hours?.length ? (
        <div style={{ fontSize: 13, color: OWNER_COLORS.muted }}>
          <strong>{check.outcome === "updated" ? "Was: " : "On profile: "}</strong>
          {formatHoursSummary(check.current_hours)}
        </div>
      ) : null}
      {check.outcome !== "saved" && check.notes?.length ? (
        <div style={{ ...mutedStyle, fontSize: 12 }}>{check.notes.join(" ")}</div>
      ) : null}
    </div>
  );
}

function candidatesOf(check) {
  return Array.isArray(check?.candidate?.candidates) ? check.candidate.candidates : [];
}

function AddressLine({ candidate }) {
  const url = addressSourceUrl(candidate);
  return (
    <span>
      {candidate.address_line1}
      {candidate.postal_code ? `, ${candidate.postal_code}` : ""}
      <span style={mutedStyle}>
        {candidate.distance_m != null ? ` · ${candidate.distance_m} m from the map pin` : ""}
        {candidate.source ? " · " : ""}
        {candidate.source ? (url ? <a href={url} target="_blank" rel="noreferrer">{ADDRESS_SOURCE_LABELS[candidate.source] || candidate.source}</a> : ADDRESS_SOURCE_LABELS[candidate.source] || candidate.source) : null}
      </span>
    </span>
  );
}

function AddressResult({ check }) {
  if (!check) return null;
  const candidates = candidatesOf(check);
  return (
    <div style={{ display: "grid", gap: 4 }}>
      <div><StatusPill status={ADDRESS_OUTCOME_STATUS[check.outcome] || "completed_no_writes"} label={ADDRESS_OUTCOME_LABELS[check.outcome]} /></div>
      {check.outcome === "saved" && candidates[0] ? <div style={{ fontSize: 13 }}><AddressLine candidate={candidates[0]} /></div> : null}
      {check.outcome === "kept_existing" && check.address_line1 ? <div style={{ fontSize: 13 }}>{check.address_line1}</div> : null}
      {check.outcome !== "saved" && check.notes?.length ? <div style={{ ...mutedStyle, fontSize: 12 }}>{check.notes.join(" ")}</div> : null}
    </div>
  );
}

function RestaurantAnalyzer({ botKey, onFinished, checkReady = false, googleAvailable = false }) {
  const cfg = ANALYZER[botKey];
  const [hoursMode, setHoursMode] = useState("fill");
  const [useGoogle, setUseGoogle] = useState(false);
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
        const data = await cfg.poll(logId);
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
      const data = await cfg.start(restaurant.id, botKey === "hours_bot" ? { mode: hoursMode, use_google: useGoogle } : undefined);
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
            {running ? "Working…" : busy ? "Starting…" : botKey === "hours_bot" && hoursMode === "check" ? "Check hours now" : cfg.button}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSearch}>
          <label style={labelStyle} htmlFor={`${botKey}-restaurant-search`}>Restaurant</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input
              id={`${botKey}-restaurant-search`}
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

      {botKey === "hours_bot" ? (
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center", marginTop: 12 }}>
          <ModeToggle value={hoursMode} onChange={setHoursMode} checkReady={checkReady} idPrefix="hours-restaurant" />
          {googleAvailable ? <GoogleToggle checked={useGoogle} onChange={setUseGoogle} /> : null}
        </div>
      ) : null}

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
          {running || (botKey !== "hours_bot" && botKey !== "address_bot") ? (
            <>
              <StatusPill status={run.status} />
              <span style={{ fontSize: 14 }}>
                {running ? cfg.busyText(run) : runResultText(botKey, run) || "Done."}
              </span>
            </>
          ) : botKey === "address_bot" ? (
            <AddressResult check={run.results?.[0]} />
          ) : (
            <HoursResult check={run.results?.[0]} />
          )}
          {run.error ? <span style={{ color: "#b91c1c", fontSize: 13 }}>{run.error}</span> : null}
        </div>
      ) : null}
      {error ? <div style={{ marginTop: 8, color: "#b91c1c", fontSize: 13 }}>{error}</div> : null}
    </div>
  );
}

// ── Hours Bot (plan 34): mode, Google, "What to check", review, undo ──────────

function ModeToggle({ value, onChange, checkReady, idPrefix }) {
  const options = [
    { key: "fill", label: "Fill missing" },
    { key: "check", label: "Check existing", disabled: !checkReady },
  ];
  return (
    <div role="radiogroup" aria-label="What Hours Bot does" style={{ display: "inline-flex", border: `1px solid ${OWNER_COLORS.line}`, borderRadius: 10, overflow: "hidden" }}>
      {options.map((o) => {
        const active = value === o.key;
        return (
          <button
            key={o.key}
            id={`${idPrefix}-mode-${o.key}`}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={o.disabled}
            title={o.disabled ? "Needs migration 0420" : undefined}
            onClick={() => onChange(o.key)}
            style={{
              border: "none",
              padding: "8px 14px",
              fontWeight: 700,
              fontSize: 13,
              background: active ? OWNER_COLORS.ink : "#fff",
              color: active ? "#fff" : OWNER_COLORS.ink,
              cursor: o.disabled ? "not-allowed" : "pointer",
              opacity: o.disabled ? 0.45 : 1,
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function GoogleToggle({ checked, onChange }) {
  return (
    <label style={{ display: "inline-flex", gap: 8, alignItems: "center", fontSize: 13, cursor: "pointer" }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      Also use Google Places <span style={mutedStyle}>(paid, only when free sources find nothing)</span>
    </label>
  );
}

const SCOPE_KINDS = [
  { key: "cluster", label: "A cluster", v2: true },
  { key: "city", label: "A city", v2: true },
  { key: "zip", label: "A ZIP code", v2: true },
  { key: "radius", label: "Around a spot", v2: true },
  { key: "county", label: "A county", v2: true },
  { key: "state", label: "A state", v2: true },
  { key: "market", label: "A market" },
  { key: "all", label: "Everywhere" },
];

const AREA_LIMITS = [25, 50, 100, 200, 500, 1000];
const RADIUS_MILES = [0.5, 1, 2, 5, 10, 25];

function HoursScopeRunner({ bot, running, onStarted }) {
  const ready = Boolean(bot.scopes_ready);
  const clusters = bot.clusters || [];
  const markets = bot.markets || [];
  const [kind, setKind] = useState(ready ? "cluster" : "market");
  const [mode, setMode] = useState("fill");
  const [useGoogle, setUseGoogle] = useState(false);
  const [clusterId, setClusterId] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("CA");
  const [zip, setZip] = useState("");
  const [county, setCounty] = useState("");
  const [spot, setSpot] = useState("");
  const [miles, setMiles] = useState(1);
  const [marketKey, setMarketKey] = useState("");
  const [limit, setLimit] = useState(200);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const spots = clusters.filter((c) => c.center);
  const st = state.trim().toUpperCase();

  function buildScope() {
    if (kind === "cluster") return clusterId ? { type: "cluster", cluster_id: clusterId === "all" ? "all" : Number(clusterId) } : null;
    if (kind === "market") {
      const m = markets.find((x) => `${x.name}|${x.state}` === marketKey);
      return m ? { type: "market", market: { name: m.name, state: m.state } } : null;
    }
    if (kind === "all") return { type: "all" };
    if (kind === "city") return city.trim() && st.length === 2 ? { type: "area", area: { kind: "city", city: city.trim(), state: st } } : null;
    if (kind === "zip") return /^\d{5}$/.test(zip.trim()) ? { type: "area", area: { kind: "zip", zip: zip.trim() } } : null;
    if (kind === "state") return st.length === 2 ? { type: "area", area: { kind: "state", state: st } } : null;
    if (kind === "county") return county.trim() && st.length === 2 ? { type: "area", area: { kind: "county", name: county.trim(), state: st } } : null;
    if (kind === "radius") {
      const c = spots.find((x) => String(x.id) === spot);
      return c ? { type: "area", area: { kind: "radius", lat: c.center.lat, lng: c.center.lng, miles, label: c.name } } : null;
    }
    return null;
  }

  const scope = buildScope();
  const usesLimit = kind !== "cluster";

  async function start() {
    if (!scope) return;
    setBusy(true);
    setMessage("");
    try {
      const body = { scope, mode, use_google: useGoogle };
      if (usesLimit) body.limit = limit;
      const data = await runOwnerBotNow("hours_bot", body);
      const where = data.scope_label || "this area";
      setMessage(
        data.total_restaurants
          ? `Started: ${mode === "check" ? "checking" : "looking up"} ${data.total_restaurants} restaurants in ${where}. Results appear below as it goes.`
          : data.resumed
            ? "Picked up the run that was already under way."
            : `Started for ${where}. Results appear below as it goes.`
      );
      onStarted?.();
    } catch (err) {
      setMessage(err?.status === 409 ? "Hours Bot is already running. Try again when it finishes." : err?.message || "Could not start the run");
    } finally {
      setBusy(false);
    }
  }

  const stateInput = (
    <div>
      <label style={labelStyle} htmlFor="hours-scope-state">State</label>
      <input id="hours-scope-state" style={{ ...inputStyle, width: 70 }} maxLength={2} value={state} onChange={(e) => setState(e.target.value.toUpperCase())} placeholder="CA" />
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
        <div>
          <label style={labelStyle} htmlFor="hours-scope-kind">What to check</label>
          <select id="hours-scope-kind" style={inputStyle} value={kind} onChange={(e) => { setKind(e.target.value); setMessage(""); }}>
            {SCOPE_KINDS.map((k) => (
              <option key={k.key} value={k.key} disabled={k.v2 && !ready}>{k.label}</option>
            ))}
          </select>
        </div>

        {kind === "cluster" ? (
          <div style={{ flex: "1 1 240px", minWidth: 0 }}>
            <label style={labelStyle} htmlFor="hours-scope-cluster">Cluster</label>
            <select id="hours-scope-cluster" style={{ ...inputStyle, width: "100%" }} value={clusterId} onChange={(e) => setClusterId(e.target.value)}>
              <option value="">Choose a cluster…</option>
              <option value="all">Every cluster</option>
              {clusters.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.restaurants})</option>)}
            </select>
          </div>
        ) : null}

        {kind === "city" ? (
          <>
            <div style={{ flex: "1 1 200px", minWidth: 0 }}>
              <label style={labelStyle} htmlFor="hours-scope-city">City</label>
              <input id="hours-scope-city" style={{ ...inputStyle, width: "100%" }} value={city} onChange={(e) => setCity(e.target.value)} placeholder="Los Angeles" />
            </div>
            {stateInput}
          </>
        ) : null}

        {kind === "zip" ? (
          <div>
            <label style={labelStyle} htmlFor="hours-scope-zip">ZIP code</label>
            <input id="hours-scope-zip" style={{ ...inputStyle, width: 110 }} inputMode="numeric" maxLength={5} value={zip} onChange={(e) => setZip(e.target.value.replace(/\D/g, ""))} placeholder="90007" />
          </div>
        ) : null}

        {kind === "county" ? (
          <>
            <div style={{ flex: "1 1 200px", minWidth: 0 }}>
              <label style={labelStyle} htmlFor="hours-scope-county">County</label>
              <input id="hours-scope-county" style={{ ...inputStyle, width: "100%" }} value={county} onChange={(e) => setCounty(e.target.value)} placeholder="Orange County" />
            </div>
            {stateInput}
          </>
        ) : null}

        {kind === "state" ? stateInput : null}

        {kind === "radius" ? (
          <>
            <div>
              <label style={labelStyle} htmlFor="hours-scope-miles">Within</label>
              <select id="hours-scope-miles" style={inputStyle} value={miles} onChange={(e) => setMiles(Number(e.target.value))}>
                {RADIUS_MILES.map((m) => <option key={m} value={m}>{m} mi</option>)}
              </select>
            </div>
            <div style={{ flex: "1 1 220px", minWidth: 0 }}>
              <label style={labelStyle} htmlFor="hours-scope-spot">of</label>
              <select id="hours-scope-spot" style={{ ...inputStyle, width: "100%" }} value={spot} onChange={(e) => setSpot(e.target.value)}>
                <option value="">Choose a spot…</option>
                {spots.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </>
        ) : null}

        {kind === "market" ? (
          <div style={{ flex: "1 1 240px", minWidth: 0 }}>
            <label style={labelStyle} htmlFor="hours-scope-market">Market</label>
            <select id="hours-scope-market" style={{ ...inputStyle, width: "100%" }} value={marketKey} onChange={(e) => setMarketKey(e.target.value)}>
              <option value="">Choose a market…</option>
              {markets.map((m) => <option key={`${m.name}|${m.state}`} value={`${m.name}|${m.state}`}>{m.name}</option>)}
            </select>
          </div>
        ) : null}

        {usesLimit ? (
          <div>
            <label style={labelStyle} htmlFor="hours-scope-limit">Up to</label>
            <select id="hours-scope-limit" style={inputStyle} value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
              {AREA_LIMITS.map((n) => <option key={n} value={n}>{n} restaurants</option>)}
            </select>
          </div>
        ) : null}
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center", marginTop: 14 }}>
        <ModeToggle value={mode} onChange={setMode} checkReady={ready} idPrefix="hours-scope" />
        {bot.google_places_configured ? <GoogleToggle checked={useGoogle} onChange={setUseGoogle} /> : null}
        <button type="button" onClick={start} disabled={!scope || busy || running} style={primaryButtonStyle({ busy, disabled: !scope || running })}>
          {busy ? "Starting…" : mode === "check" ? "Check hours" : "Find hours"}
        </button>
      </div>

      <div style={{ ...mutedStyle, marginTop: 10 }}>
        {mode === "check"
          ? "Compares the hours on each profile with what the restaurant shows now. Hours Bot updates hours it found itself; hours a person entered, or on claimed restaurants, go to Needs review."
          : "Looks up restaurants that have no hours yet, those with menus first. Saved hours pages are tried first."}
        {kind === "cluster" ? " Clusters check every restaurant, even ones checked recently." : " Restaurants checked in the last 30 days are skipped."}
        {!ready ? " Clusters, areas and Check existing turn on once migration 0420 is applied." : ""}
      </div>
      {message ? <div style={{ marginTop: 10, fontSize: 13, fontWeight: 700 }}>{message}</div> : null}
    </div>
  );
}

function HoursRestaurantLink({ check }) {
  return (
    <div>
      <a href={`/restaurants/${check.restaurant_id}`} target="_blank" rel="noreferrer" style={{ fontWeight: 700, color: OWNER_COLORS.ink }}>
        {check.restaurant_name}
      </a>
      <span style={mutedStyle}> #{check.restaurant_id}{check.city ? ` · ${check.city}${check.state ? `, ${check.state}` : ""}` : ""}</span>
    </div>
  );
}

function useHoursAction(onChanged) {
  const [busyKey, setBusyKey] = useState("");
  const [error, setError] = useState("");
  async function act(restaurantId, action) {
    setBusyKey(`${restaurantId}:${action}`);
    setError("");
    try {
      await hoursBotReviewAction(restaurantId, action);
      onChanged?.();
    } catch (err) {
      setError(err?.message || "Could not do that");
    } finally {
      setBusyKey("");
    }
  }
  return { busyKey, error, act };
}

function HoursReviewQueue({ checks, onChanged }) {
  const { busyKey, error, act } = useHoursAction(onChanged);
  if (!checks?.length) return <EmptyState>Nothing to review.</EmptyState>;
  const smallButton = { ...secondaryButtonStyle, padding: "5px 12px" };
  return (
    <div style={{ display: "grid", gap: 12 }}>
      {error ? <div style={{ color: "#b91c1c", fontSize: 13 }}>{error}</div> : null}
      {checks.map((c) => (
        <div key={c.restaurant_id} style={{ borderTop: `1px solid ${OWNER_COLORS.line}`, paddingTop: 12, display: "grid", gap: 6 }}>
          <HoursRestaurantLink check={c} />
          <div style={{ fontSize: 13 }}>
            <strong>On profile:</strong> {c.current_hours?.length ? formatHoursSummary(c.current_hours) : "No hours"}
          </div>
          <div style={{ fontSize: 13 }}>
            <strong>Found:</strong> {formatHoursSummary(c.hours)}
            {c.source ? (
              <span style={mutedStyle}>
                {" · "}
                {c.source_url ? (
                  <a href={c.source_url} target="_blank" rel="noreferrer">{HOURS_SOURCE_LABELS[c.source] || c.source}</a>
                ) : (
                  HOURS_SOURCE_LABELS[c.source] || c.source
                )}
              </span>
            ) : null}
          </div>
          {c.notes?.length ? <div style={{ ...mutedStyle, fontSize: 12 }}>{c.notes.join(" ")}</div> : null}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" style={smallButton} disabled={Boolean(busyKey)} onClick={() => act(c.restaurant_id, "apply")}>
              {busyKey === `${c.restaurant_id}:apply` ? "Saving…" : "Use found hours"}
            </button>
            <button type="button" style={smallButton} disabled={Boolean(busyKey)} onClick={() => act(c.restaurant_id, "keep")}>
              {busyKey === `${c.restaurant_id}:keep` ? "Saving…" : "Keep current"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function HoursUndoList({ checks, onChanged }) {
  const { busyKey, error, act } = useHoursAction(onChanged);
  if (!checks?.length) return <EmptyState>No recent changes.</EmptyState>;
  return (
    <div style={{ display: "grid", gap: 12 }}>
      {error ? <div style={{ color: "#b91c1c", fontSize: 13 }}>{error}</div> : null}
      {checks.map((c) => (
        <div key={c.restaurant_id} style={{ borderTop: `1px solid ${OWNER_COLORS.line}`, paddingTop: 12, display: "flex", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 300px", minWidth: 0, display: "grid", gap: 4 }}>
            <HoursRestaurantLink check={c} />
            <div style={{ fontSize: 13 }}><strong>Now:</strong> {formatHoursSummary(c.hours)}</div>
            {c.current_hours?.length ? (
              <div style={{ fontSize: 13, color: OWNER_COLORS.muted }}><strong>Was:</strong> {formatHoursSummary(c.current_hours)}</div>
            ) : null}
            <div style={{ ...mutedStyle, fontSize: 12 }}>
              {c.review_action === "applied" ? "You chose the found hours" : "Updated automatically"} · {formatDateTime(c.written_at)}
            </div>
          </div>
          <button
            type="button"
            style={{ ...secondaryButtonStyle, padding: "5px 12px" }}
            disabled={Boolean(busyKey)}
            onClick={() => act(c.restaurant_id, "undo")}
          >
            {busyKey === `${c.restaurant_id}:undo` ? "Undoing…" : "Undo"}
          </button>
        </div>
      ))}
    </div>
  );
}

const ADDRESS_BATCH_SIZES = [25, 50, 100, 300];

function AddressMarketRunner({ markets, running, onStarted }) {
  const list = markets || [];
  const [marketKey, setMarketKey] = useState(list.find((m) => m.scheduled)?.key || "");
  const [limit, setLimit] = useState(100);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const market = list.find((m) => m.key === marketKey);

  async function start() {
    if (!market) return;
    setBusy(true);
    setMessage("");
    try {
      const data = await runOwnerBotNow("address_bot", { market: market.key, limit });
      setMessage(
        data.total_restaurants
          ? `Started: checking ${data.total_restaurants} restaurants in ${market.name}, about one a second. Results appear below as it goes.`
          : `Nothing to do in ${market.name} — every restaurant there has an address or was checked in the last 30 days.`
      );
      onStarted?.();
    } catch (err) {
      setMessage(err?.status === 409 ? "Address Bot is already running. Try again when it finishes." : err?.message || "Could not start the run");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
        <div style={{ flex: "1 1 240px", minWidth: 0 }}>
          <label style={labelStyle} htmlFor="address-bot-market">Market</label>
          <select id="address-bot-market" style={{ ...inputStyle, width: "100%" }} value={marketKey} onChange={(e) => setMarketKey(e.target.value)}>
            <option value="">Choose a market…</option>
            <optgroup label="On the schedule">
              {list.filter((m) => m.scheduled).map((m) => <option key={m.key} value={m.key}>{m.name}</option>)}
            </optgroup>
            <optgroup label="Later (run by hand only)">
              {list.filter((m) => !m.scheduled).map((m) => <option key={m.key} value={m.key}>{m.name}</option>)}
            </optgroup>
          </select>
        </div>
        <div>
          <label style={labelStyle} htmlFor="address-bot-limit">Up to</label>
          <select id="address-bot-limit" style={inputStyle} value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
            {ADDRESS_BATCH_SIZES.map((n) => <option key={n} value={n}>{n} restaurants</option>)}
          </select>
        </div>
        <button type="button" onClick={start} disabled={!market || busy || running} style={primaryButtonStyle({ busy, disabled: !market || running })}>
          {busy ? "Starting…" : "Run for this market"}
        </button>
      </div>
      <div style={{ ...mutedStyle, marginTop: 10 }}>
        Checks restaurants in this market that have no street address yet, those with menus and chain stores first.
        The nightly schedule only covers the markets marked &ldquo;On the schedule&rdquo;.
      </div>
      {message ? <div style={{ marginTop: 10, fontSize: 13, fontWeight: 700 }}>{message}</div> : null}
    </div>
  );
}

function AddressReviewQueue({ checks, onChanged }) {
  const [busyKey, setBusyKey] = useState("");
  const [error, setError] = useState("");
  if (!checks?.length) return <EmptyState>Nothing to review.</EmptyState>;

  async function accept(restaurantId, index) {
    setBusyKey(`${restaurantId}:${index}`);
    setError("");
    try {
      await acceptAddressBotCandidate(restaurantId, index);
      onChanged?.();
    } catch (err) {
      setError(err?.message || "Could not save that address");
    } finally {
      setBusyKey("");
    }
  }

  async function keepCurrent(restaurantId) {
    setBusyKey(`${restaurantId}:keep`);
    setError("");
    try {
      await keepAddressBotCurrent(restaurantId);
      onChanged?.();
    } catch (err) {
      setError(err?.message || "Could not keep that address");
    } finally {
      setBusyKey("");
    }
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {error ? <div style={{ color: "#b91c1c", fontSize: 13 }}>{error}</div> : null}
      {checks.map((c) => (
        <div key={c.restaurant_id} style={{ borderTop: `1px solid ${OWNER_COLORS.line}`, paddingTop: 12 }}>
          <a href={`/restaurants/${c.restaurant_id}`} target="_blank" rel="noreferrer" style={{ fontWeight: 700, color: OWNER_COLORS.ink }}>
            {c.restaurant_name}
          </a>
          <span style={mutedStyle}> #{c.restaurant_id}{c.city ? ` · ${c.city}${c.state ? `, ${c.state}` : ""}` : ""}</span>
          {c.notes?.length ? <div style={{ ...mutedStyle, fontSize: 12, marginTop: 2 }}>{c.notes.join(" ")}</div> : null}
          {c.candidate?.verify ? (
            <div style={{ fontSize: 13, marginTop: 6 }}>
              <strong>On file:</strong> {c.address_line1 || "No address"}{" "}
              <button
                type="button"
                style={{ ...secondaryButtonStyle, padding: "5px 12px", marginLeft: 6 }}
                disabled={Boolean(busyKey)}
                onClick={() => keepCurrent(c.restaurant_id)}
              >
                {busyKey === `${c.restaurant_id}:keep` ? "Saving…" : c.address_line1 ? "Keep current" : "Skip"}
              </button>
            </div>
          ) : null}
          <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
            {candidatesOf(c).map((cand, i) => (
              <div key={`${cand.address_line1}-${i}`} style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", fontSize: 13 }}>
                <button
                  type="button"
                  style={{ ...secondaryButtonStyle, padding: "5px 12px" }}
                  disabled={Boolean(busyKey)}
                  onClick={() => accept(c.restaurant_id, i)}
                >
                  {busyKey === `${c.restaurant_id}:${i}` ? "Saving…" : "Use this"}
                </button>
                <AddressLine candidate={cand} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function AddressRecentChecks({ checks }) {
  if (!checks?.length) return <EmptyState>No restaurants checked yet.</EmptyState>;
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ textAlign: "left", color: OWNER_COLORS.muted }}>
            <th style={{ padding: "8px 10px 8px 0" }}>Restaurant</th>
            <th style={{ padding: "8px 10px" }}>Result</th>
            <th style={{ padding: "8px 0 8px 10px" }}>Checked</th>
          </tr>
        </thead>
        <tbody>
          {checks.map((c) => (
            <tr key={c.restaurant_id} style={{ borderTop: `1px solid ${OWNER_COLORS.line}`, verticalAlign: "top" }}>
              <td style={{ padding: "10px 10px 10px 0" }}>
                <a href={`/restaurants/${c.restaurant_id}`} target="_blank" rel="noreferrer" style={{ fontWeight: 700, color: OWNER_COLORS.ink }}>
                  {c.restaurant_name}
                </a>
                <div style={mutedStyle}>#{c.restaurant_id}{c.city ? ` · ${c.city}${c.state ? `, ${c.state}` : ""}` : ""}</div>
              </td>
              <td style={{ padding: 10 }}><AddressResult check={c} /></td>
              <td style={{ padding: "10px 0 10px 10px", whiteSpace: "nowrap", color: OWNER_COLORS.muted }}>{formatDateTime(c.last_checked_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RecentChecks({ checks }) {
  if (!checks?.length) return <EmptyState>No restaurants checked yet.</EmptyState>;
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ textAlign: "left", color: OWNER_COLORS.muted }}>
            <th style={{ padding: "8px 10px 8px 0" }}>Restaurant</th>
            <th style={{ padding: "8px 10px" }}>Result</th>
            <th style={{ padding: "8px 0 8px 10px" }}>Checked</th>
          </tr>
        </thead>
        <tbody>
          {checks.map((c) => (
            <tr key={c.restaurant_id} style={{ borderTop: `1px solid ${OWNER_COLORS.line}`, verticalAlign: "top" }}>
              <td style={{ padding: "10px 10px 10px 0" }}>
                <a href={`/restaurants/${c.restaurant_id}`} target="_blank" rel="noreferrer" style={{ fontWeight: 700, color: OWNER_COLORS.ink }}>
                  {c.restaurant_name}
                </a>
                <div style={mutedStyle}>#{c.restaurant_id}{c.city ? ` · ${c.city}${c.state ? `, ${c.state}` : ""}` : ""}</div>
              </td>
              <td style={{ padding: 10 }}><HoursResult check={c} /></td>
              <td style={{ padding: "10px 0 10px 10px", whiteSpace: "nowrap", color: OWNER_COLORS.muted }}>{formatDateTime(c.last_checked_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
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
  // Failed refreshes in a row; each one schedules another try (e.g. while the backend restarts).
  const [failedLoads, setFailedLoads] = useState(0);
  const refreshRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const data = await getOwnerBot(botKey);
      setBot(data);
      setError("");
      setFailedLoads(0);
      return data;
    } catch (err) {
      setError(err?.message || "Could not load this bot");
      setFailedLoads((n) => n + 1);
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
  // A failed refresh (backend restarting, network blip) keeps trying instead of stopping.
  useEffect(() => {
    clearTimeout(refreshRef.current);
    if (bot?.active_run) refreshRef.current = setTimeout(load, 10000);
    else setRunMessage((m) => (m.endsWith("while it runs.") ? "" : m));
    return () => clearTimeout(refreshRef.current);
  }, [bot, load, failedLoads]);

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
        {error && bot?.active_run ? (
          <EmptyState><span style={{ color: OWNER_COLORS.muted }}>Lost connection to the server — trying again…</span></EmptyState>
        ) : error ? (
          <EmptyState><span style={{ color: "#b91c1c" }}>{error}</span></EmptyState>
        ) : null}

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
                {bot.coverage ? (
                  <Stat label="Restaurants with menus that have hours">
                    {bot.coverage.ck_with_hours.toLocaleString()} of {bot.coverage.ck_restaurants.toLocaleString()}
                  </Stat>
                ) : null}
                {(bot.address_coverage || []).map((c) => (
                  <Stat key={c.key} label={`${c.market}: restaurants with a street address`}>
                    {c.with_street.toLocaleString()} of {c.restaurants.toLocaleString()}
                    <div style={{ ...mutedStyle, fontWeight: 400, marginTop: 4 }}>
                      Chain stores: {c.chain_with_street.toLocaleString()} of {c.chain_stores.toLocaleString()}
                    </div>
                  </Stat>
                ))}
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
              {bot.migrated === false ? (
                <div style={{ marginTop: 14, padding: 12, borderRadius: 10, background: "#fff7ed", color: "#9a3412", fontSize: 13 }}>
                  {meta.name}&apos;s database tables aren&apos;t set up yet ({botKey === "seo_bot" ? "migration 0397" : "migration 0355"}), so it can&apos;t run. Nothing else is affected.
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
                <RestaurantAnalyzer botKey="nutribot" onFinished={load} />
              </PageCard>
            ) : null}

            {botKey === "nutribot" ? <NutribotTemplatesPanel /> : null}

            {botKey === "seo_bot" ? <SeoBotReport bot={bot} /> : null}

            {botKey === "hours_bot" ? (
              <>
                {bot.review_queue?.length ? (
                  <PageCard style={{ padding: 24 }}>
                    <SectionTitle
                      title="Needs review"
                      subtitle="Hours Bot found different hours than the ones a person entered (or the restaurant is claimed), so it didn't change them. Pick which to keep."
                    />
                    <HoursReviewQueue checks={bot.review_queue} onChanged={load} />
                  </PageCard>
                ) : null}
                <PageCard style={{ padding: 24 }}>
                  <SectionTitle
                    title="Check one restaurant"
                    subtitle="Fill missing adds hours when a restaurant has none. Check existing compares the hours on its profile with what the restaurant shows now."
                  />
                  <RestaurantAnalyzer
                    botKey="hours_bot"
                    onFinished={load}
                    checkReady={Boolean(bot.scopes_ready)}
                    googleAvailable={Boolean(bot.google_places_configured)}
                  />
                </PageCard>
                <PageCard style={{ padding: 24 }}>
                  <SectionTitle title="Check an area" subtitle="A cluster, city, ZIP code, the area around a spot, a county, a state or a market." />
                  <HoursScopeRunner bot={bot} running={running} onStarted={load} />
                </PageCard>
              </>
            ) : null}

            {botKey === "address_bot" ? (
              <>
                <PageCard style={{ padding: 24 }}>
                  <SectionTitle
                    title="Needs review"
                    subtitle="Matches Address Bot wasn't sure enough to publish: several possible addresses, or a match too far from the map pin. Pick the right one, or leave it."
                  />
                  <AddressReviewQueue checks={bot.review_queue} onChanged={load} />
                </PageCard>
                <PageCard style={{ padding: 24 }}>
                  <SectionTitle
                    title="Find the address for a restaurant"
                    subtitle="Looks up one restaurant right away. Addresses already on a profile are never changed."
                  />
                  <RestaurantAnalyzer botKey="address_bot" onFinished={load} />
                </PageCard>
                <PageCard style={{ padding: 24 }}>
                  <SectionTitle title="Run for a market" subtitle="Fill in street addresses for one market now." />
                  <AddressMarketRunner markets={bot.markets} running={running} onStarted={load} />
                </PageCard>
              </>
            ) : null}

            <PageCard style={{ padding: 24 }}>
              <SectionTitle
                title={botKey === "hours_bot" ? "Schedule: fill missing" : "Schedule"}
                subtitle={botKey === "hours_bot" ? "When Hours Bot looks for hours restaurants don't have yet. Times are Pacific." : "When the bot runs on its own. Times are Pacific."}
              />
              <ScheduleEditor bot={bot} onSaved={(next) => setBot((cur) => ({ ...cur, ...next }))} />
            </PageCard>

            {botKey === "hours_bot" && bot.check_schedule ? (
              <PageCard style={{ padding: 24 }}>
                <SectionTitle
                  title="Schedule: check existing"
                  subtitle={`Re-checks the hours of every cluster restaurant. Hours Bot updates hours it found itself; anything a person entered goes to Needs review. Times are Pacific.${bot.check_schedule.next_run_at ? ` Next: ${formatDateTime(bot.check_schedule.next_run_at)}.` : ""}`}
                />
                <ScheduleEditor
                  bot={bot}
                  schedule={bot.check_schedule}
                  idPrefix="hours-bot-check"
                  pausedText="While paused, hours are only re-checked when you run Check existing yourself."
                  saveFn={async (body) => (await updateHoursBotCheckSchedule(body)).check_schedule}
                  onSaved={(next) => setBot((cur) => ({ ...cur, check_schedule: next }))}
                />
                {bot.check_schedule.env_disabled ? (
                  <div style={{ marginTop: 10, padding: 12, borderRadius: 10, background: "#fff7ed", color: "#9a3412", fontSize: 13 }}>
                    Scheduled checks are switched off on the server (HOURS_BOT_CHECK_SCHEDULED_ENABLED), so this won&apos;t run on its own until that&apos;s turned back on.
                  </div>
                ) : null}
              </PageCard>
            ) : null}

            {botKey === "hours_bot" && bot.undoable?.length ? (
              <PageCard style={{ padding: 24 }}>
                <SectionTitle title="Recent hours changes" subtitle="Hours Bot replaced these restaurants' hours. Undo puts the old hours back." />
                <HoursUndoList checks={bot.undoable} onChanged={load} />
              </PageCard>
            ) : null}

            <PageCard style={{ padding: 24 }}>
              <SectionTitle title="Run history" subtitle="The 10 most recent full runs." />
              <RunHistory botKey={botKey} runs={bot.runs} showScope={botKey === "hours_bot" || botKey === "address_bot"} emptyText="No runs yet." />
            </PageCard>

            {botKey === "hours_bot" ? (
              <PageCard style={{ padding: 24 }}>
                <SectionTitle title="Recent results" subtitle="The last 25 restaurants Hours Bot checked. Sources are tried free first: OpenStreetMap, the restaurant's website, then Google." />
                <RecentChecks checks={bot.recent_checks} />
              </PageCard>
            ) : null}

            {botKey === "address_bot" ? (
              <PageCard style={{ padding: 24 }}>
                <SectionTitle
                  title="Recent results"
                  subtitle="The last 25 restaurants Address Bot checked. OpenStreetMap is tried first (free), then Google when it's set up. Map data © OpenStreetMap contributors."
                />
                <AddressRecentChecks checks={bot.recent_checks} />
              </PageCard>
            ) : null}

            {botKey === "nutribot" || botKey === "hours_bot" || botKey === "address_bot" ? (
              <PageCard style={{ padding: 24 }}>
                <SectionTitle title={botKey === "nutribot" ? "Restaurant analyses" : "Single-restaurant lookups"} subtitle="The 10 most recent single-restaurant runs." />
                <RunHistory botKey={botKey} runs={bot.restaurant_runs} showRestaurant emptyText="No restaurant analyses yet." />
              </PageCard>
            ) : null}
          </>
        ) : null}
      </div>
    </OwnerLayout>
  );
}
