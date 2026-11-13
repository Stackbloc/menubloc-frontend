/**
 * My Vibe on Profile (web follows the app: AvailabilityCard, plan 41, Andre 2026-11-12/13).
 * Replaces the old "Your vibe" chips. Being findable is the passive baseline ("Available" is never
 * shown). Rows: Hungry now · Up for a meal or coffee (day + meal) · Eating at home (day + meal, then
 * Just me or who can ask, with a safety note first) · Pause. Active rows report "Open for X · Day",
 * each with Remove. Going to a restaurant is a plan, not a vibe: it lives on the Social Calendar.
 * Plain text links only: no oval pills, no green pills, no full-width buttons (Andre 2026-11-06/12).
 */
import { useCallback, useEffect, useState } from "react";
import {
  clearHungryNow,
  clearUpFor,
  createSocialPlan,
  deleteSocialPlan,
  getAvailability,
  listMyCircles,
  listMySocialPlans,
  postHungryNow,
  postUpFor,
  setAvailability,
} from "../../../lib/consumerApi.js";
import {
  atHomePlanBody,
  atHomePlans,
  availabilityLine,
  circlesFrom,
  dayLabel,
  homeLine,
  MEAL_KEYS,
  MEAL_NAMES,
  nextDays,
  parseAvailability,
  PAUSE_CHOICES,
  UP_FOR_KEYS,
  UP_FOR_NAMES,
  upForLine,
  ymd,
} from "../../../lib/myVibe.js";
import { discoverLabelOf } from "../../../lib/discoverLevels.js";
import { AppDiscoverabilityCard } from "./AppProfileCards.jsx";

const C = {
  accent: "#0f7a24",
  text: "#111613",
  muted: "#5c665f",
  border: "#e1e6e1",
  background: "#ffffff",
  hungry: "#b4441c",
  danger: "#b42318",
};

export default function MyVibeCard({ discover = null, onDiscover }) {
  const [state, setState] = useState(null);
  const [homes, setHomes] = useState([]);
  const [circles, setCircles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => Date.now());
  // One picker open at a time, inline under the rows: "upfor" | "home" | "pause" | null.
  const [panel, setPanel] = useState(null);
  const [day, setDay] = useState(0);
  const [homeMeal, setHomeMeal] = useState(null);
  const [homeWho, setHomeWho] = useState(null);
  const [discoverOpen, setDiscoverOpen] = useState(false);
  const [level, setLevel] = useState(discover);

  const loadAll = useCallback(async () => {
    const [a, plans, circ] = await Promise.all([
      getAvailability().then(parseAvailability),
      listMySocialPlans("upcoming").then(atHomePlans).catch(() => null),
      listMyCircles().then(circlesFrom).catch(() => null),
    ]);
    return { a, plans, circ };
  }, []);

  useEffect(() => {
    let alive = true;
    loadAll()
      .then(({ a, plans, circ }) => {
        if (!alive) return;
        setState(a);
        if (plans) setHomes(plans);
        if (circ) setCircles(circ);
      })
      .catch((err) => alive && setError(err?.message || "Couldn’t load your vibe."));
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [loadAll]);

  function closePanel() {
    setPanel(null);
    setDay(0);
    setHomeMeal(null);
    setHomeWho(null);
  }

  async function run(change) {
    setBusy(true);
    setError("");
    try {
      await change();
      const { a, plans } = await loadAll();
      setState(a);
      if (plans) setHomes(plans);
      setNow(Date.now());
      closePanel();
    } catch (err) {
      setError(err?.message || "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const shownLevel = discover || level;
  const paused = !!state && !state.available;
  const active = !!state && (state.hungry || state.upFor.length > 0 || homes.length > 0);
  const days = nextDays(now);
  const today = ymd(new Date(now));

  return (
    <div style={st.card} data-testid="vibe-card">
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={st.eyebrow}>My Vibe</h2>
          {paused ? (
            <p style={st.title} data-testid="availability-current">
              {availabilityLine(state, now)}
            </p>
          ) : null}
        </div>
        {busy ? <span style={st.muted}>Saving…</span> : null}
      </div>

      {shownLevel === "hidden" ? (
        <p style={st.status} data-testid="availability-status">
          You’re Hidden: nobody sees you in food search.
        </p>
      ) : paused ? (
        <p style={st.status} data-testid="availability-status">
          Your Connects don’t see a vibe and you’re not in food search. It switches back on by itself.
        </p>
      ) : null}
      {!state && !error ? <p style={st.status}>Loading…</p> : null}

      {state && paused ? (
        <button type="button" style={st.link} disabled={busy} onClick={() => run(() => setAvailability({ pause: "resume" }))} data-testid="availability-resume">
          Turn back on
        </button>
      ) : null}

      {state && !paused ? (
        <>
          {active ? (
            <div data-testid="my-vibe-active">
              {state.hungry ? (
                <Row label="Hungry now" color={C.hungry} testId="my-vibe-hungry" onRemove={() => run(() => clearHungryNow())} busy={busy} />
              ) : null}
              {state.upFor.map((u) => (
                <Row
                  key={`${u.date}-${u.window}`}
                  label={upForLine(u, now)}
                  testId={`my-vibe-upfor-${u.date}-${u.window}`}
                  onRemove={() => run(() => clearUpFor(u.window, u.date === today ? null : u.date))}
                  busy={busy}
                />
              ))}
              {homes.map((p) => (
                <Row key={p.key} label={homeLine(p, now, circles)} testId={`my-vibe-home-${p.id}`} onRemove={() => run(() => deleteSocialPlan(p.source, p.id))} busy={busy} />
              ))}
            </div>
          ) : (
            <p style={st.status} data-testid="my-vibe-none">
              No vibe right now.
            </p>
          )}

          <div style={st.choices}>
            {!state.hungry ? (
              <Choice label="Hungry now" action="Set ›" busy={busy} onClick={() => run(() => postHungryNow())} testId="my-vibe-set-hungry" />
            ) : null}
            <Choice label="Up for a meal or coffee" action={panel === "upfor" ? "Close" : "Pick ›"} busy={busy} onClick={() => (panel === "upfor" ? closePanel() : (closePanel(), setPanel("upfor")))} testId="my-vibe-set-upfor" />
            {panel === "upfor" ? (
              <div style={st.panel} data-testid="my-vibe-upfor-sheet">
                <p style={st.panelTitle}>Up for what?</p>
                <DayStrip days={days} now={now} value={day} onChange={setDay} testPrefix="my-vibe-day" />
                {/* The four meals plus coffee (Andre 2026-11-13, mig 0430). */}
                {UP_FOR_KEYS.map((m) => (
                  <Choice key={m} label={UP_FOR_NAMES[m]} action="›" busy={busy} onClick={() => run(() => postUpFor(m, day === 0 ? null : days[day]))} testId={`my-vibe-meal-${m}`} />
                ))}
              </div>
            ) : null}
            <Choice label="Eating at home" action={panel === "home" ? "Close" : "Pick ›"} busy={busy} onClick={() => (panel === "home" ? closePanel() : (closePanel(), setPanel("home")))} testId="my-vibe-set-home" />
            {panel === "home" ? (
              <div style={st.panel} data-testid="my-vibe-home-sheet">
                {!homeMeal ? (
                  <>
                    <p style={st.panelTitle}>Eating at home</p>
                    <DayStrip days={days} now={now} value={day} onChange={setDay} testPrefix="my-vibe-home-day" />
                    {MEAL_KEYS.map((m) => (
                      <Choice key={m} label={MEAL_NAMES[m]} action="›" busy={busy} onClick={() => setHomeMeal(m)} testId={`my-vibe-home-meal-${m}`} />
                    ))}
                  </>
                ) : !homeWho ? (
                  <>
                    <p style={st.panelTitle}>Who can ask to join?</p>
                    <p style={st.status}>
                      {MEAL_NAMES[homeMeal]} · {dayLabel(days[day], now)}
                    </p>
                    <Choice
                      label="Just me"
                      action="›"
                      busy={busy}
                      onClick={() => run(() => createSocialPlan(atHomePlanBody({ date: days[day], meal: homeMeal, who: "just_me" })))}
                      testId="my-vibe-home-who-just-me"
                    />
                    {[{ circleId: null, label: "My Connects" }, ...circles.map((c) => ({ circleId: c.id, label: c.name }))].map((w) => (
                      <Choice key={w.circleId ?? "connects"} label={w.label} action="›" busy={busy} onClick={() => setHomeWho(w)} testId={`my-vibe-home-who-${w.circleId ?? "connects"}`} />
                    ))}
                    <button type="button" style={st.quiet} onClick={() => setHomeMeal(null)} data-testid="my-vibe-home-back">
                      Back
                    </button>
                  </>
                ) : (
                  <>
                    <p style={st.panelTitle}>Before you open your home</p>
                    <p style={st.body} data-testid="my-vibe-home-warning">
                      {homeWho.label} can ask to join you at home. Only say yes to people you know and trust, and share your address only after you say yes. Nobody sees where you live until then.
                    </p>
                    <Choice
                      label="OK, let them ask"
                      action="›"
                      busy={busy}
                      onClick={() => run(() => createSocialPlan(atHomePlanBody({ date: days[day], meal: homeMeal, who: "ask", circleId: homeWho.circleId })))}
                      testId="my-vibe-home-confirm"
                    />
                    <button type="button" style={st.quiet} onClick={() => setHomeWho(null)} data-testid="my-vibe-home-who-back">
                      Back
                    </button>
                  </>
                )}
              </div>
            ) : null}
            {panel === "pause" ? (
              <div style={st.panel} data-testid="availability-pause-list">
                <p style={st.forLabel}>Pause for</p>
                {PAUSE_CHOICES.map((c) => (
                  <button key={c.key} type="button" style={{ ...st.link, display: "block", minHeight: 36 }} disabled={busy} onClick={() => run(() => setAvailability({ pause: c.key }))} data-testid={`availability-pause-${c.key}`}>
                    {c.label}
                  </button>
                ))}
                <button type="button" style={st.quiet} onClick={closePanel} data-testid="availability-pause-cancel">
                  Cancel
                </button>
              </div>
            ) : (
              <Choice label="Pause" action="›" busy={busy} onClick={() => (closePanel(), setPanel("pause"))} testId="availability-pause" />
            )}
          </div>
        </>
      ) : null}

      {error ? (
        <p style={st.error} role="alert" data-testid="availability-error">
          {error}
        </p>
      ) : null}

      <button type="button" aria-expanded={discoverOpen} onClick={() => setDiscoverOpen((v) => !v)} style={st.who} data-testid="vibe-who-sees">
        <span style={{ flex: 1, textAlign: "left", color: C.muted }}>Who can find you</span>
        <span style={{ color: C.accent }}>{`${discoverLabelOf(shownLevel)} ${discoverOpen ? "⌃" : "›"}`}</span>
      </button>
      {discoverOpen ? (
        <AppDiscoverabilityCard
          startOpen
          onChange={(l) => {
            setLevel(l);
            onDiscover?.(l);
          }}
        />
      ) : null}
    </div>
  );
}

function Row({ label, color = C.text, onRemove, busy, testId }) {
  return (
    <div style={st.row} data-testid={testId}>
      <span style={{ ...st.rowText, color }}>{label}</span>
      <button type="button" style={{ ...st.link, alignSelf: "center" }} disabled={busy} onClick={onRemove} data-testid={`${testId}-remove`}>
        Remove
      </button>
    </div>
  );
}

function Choice({ label, action, onClick, busy, testId }) {
  return (
    <button type="button" style={st.choice} disabled={busy} onClick={onClick} data-testid={testId}>
      <span style={{ color: C.text, fontSize: 16 }}>{label}</span>
      <span style={{ color: C.accent, fontWeight: 700, fontSize: 14 }}>{action}</span>
    </button>
  );
}

/** Today · Tomorrow · Sat …: plain words, the picked day underlined (no pills). */
function DayStrip({ days, now, value, onChange, testPrefix }) {
  return (
    <div style={st.dayRow}>
      {days.map((d, i) => (
        <button
          key={d}
          type="button"
          aria-pressed={i === value}
          onClick={() => onChange(i)}
          style={{ ...st.day, ...(i === value ? st.dayOn : null) }}
          data-testid={`${testPrefix}-${i}`}
        >
          {dayLabel(d, now)}
        </button>
      ))}
    </div>
  );
}

const st = {
  card: { background: C.background, borderRadius: 12, border: `1px solid ${C.border}`, padding: 16, display: "flex", flexDirection: "column", gap: 8, boxSizing: "border-box" },
  eyebrow: { margin: 0, fontSize: 12, lineHeight: "16px", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: C.accent },
  title: { margin: "2px 0 0", fontSize: 16, fontWeight: 700, color: C.text },
  status: { margin: 0, fontSize: 14, color: C.muted },
  muted: { fontSize: 13, color: C.muted },
  body: { margin: 0, fontSize: 15, lineHeight: "21px", color: C.text },
  row: { display: "flex", alignItems: "center", gap: 8, minHeight: 36 },
  rowText: { flex: 1, minWidth: 0, fontSize: 16, fontWeight: 700 },
  choices: { borderTop: `1px solid ${C.border}`, paddingTop: 4 },
  choice: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    minHeight: 44,
    padding: 0,
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontFamily: "inherit",
    textAlign: "left",
  },
  panel: { padding: "4px 0 8px 12px", borderLeft: `2px solid ${C.border}`, marginBottom: 4 },
  panelTitle: { margin: "4px 0", fontSize: 17, fontWeight: 700, color: C.text },
  forLabel: { margin: "4px 0", fontSize: 13, fontWeight: 700, color: C.muted },
  dayRow: { display: "flex", flexWrap: "wrap", columnGap: 16, rowGap: 4, paddingBottom: 4 },
  day: { minHeight: 36, padding: 0, border: "none", background: "transparent", cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 600, color: C.muted },
  dayOn: { color: C.text, fontWeight: 700, textDecoration: "underline" },
  link: { alignSelf: "flex-start", border: "none", background: "transparent", padding: 0, fontSize: 14, fontWeight: 700, color: C.accent, cursor: "pointer", fontFamily: "inherit", textAlign: "left" },
  quiet: { border: "none", background: "transparent", padding: "6px 0", fontSize: 14, fontWeight: 600, color: C.muted, cursor: "pointer", fontFamily: "inherit" },
  error: { margin: 0, fontSize: 14, color: C.danger },
  who: { display: "flex", alignItems: "center", gap: 8, minHeight: 36, padding: "8px 0 0", border: "none", borderTop: `1px solid ${C.border}`, background: "transparent", cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 600 },
};
