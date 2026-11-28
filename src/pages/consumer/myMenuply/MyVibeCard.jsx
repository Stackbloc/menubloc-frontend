/**
 * My Availability on Profile (web follows the app: AvailabilityCard, plan 41, Andre 2026-11-12/13).
 * Plan 58 (Andre 2026-11-18): "Available" is passive (findable; never picked) and vibes are active.
 * One right-now vibe at a time (Hungry now · ✨ Feeling Social · your own words ≤ 80) for 2, 4 or 8
 * hours; "I’m up for:" A meal · Coffee · Happy Hour 🍸 (separate choices); Change + Remove on rows.
 * Replaces the old "Your vibe" chips. Being findable is the passive baseline ("Available" is never
 * shown). Rows: Hungry now · Up for a meal or coffee (day + meal) · Eating at home (day + meal, then
 * Just me or who can ask, with a safety note first) · Pause. Active rows report "Open for X · Day",
 * each with Remove. Going to a restaurant is a plan, not a vibe: it lives on the Social Calendar.
 * Hungry now asks "Hungry now for?" first (optional, Andre 2026-11-14): a food, a restaurant or a
 * dish, with name suggestions while typing; the server fixes misspellings. Skip = plain Hungry now.
 * Plain text links only: no oval pills, no green pills, no full-width buttons (Andre 2026-11-06/12).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import AskForReview from "../../../components/AskForReview.jsx";
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
  setRightNowVibe,
  suggestHungryFor,
} from "../../../lib/consumerApi.js";
import {
  atHomePlanBody,
  atHomePlans,
  availabilityLine,
  circlesFrom,
  CUSTOM_VIBE_MAX,
  TREAT_VIBES,
  dayLabel,
  DEFAULT_VIBE_HOURS,
  homeLine,
  MEAL_KEYS,
  MEAL_NAMES,
  nextDays,
  parseAvailability,
  PAUSE_CHOICES,
  UP_FOR_KEYS,
  UP_FOR_NAMES,
  UP_FOR_TYPES,
  upForLine,
  upForTypeOf,
  untilLabel,
  VIBE_HOURS,
  VIBE_KINDS,
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
  // 2026-11-23 (plan 73 PM1b): the custom vibe text CK blocked, for "Ask for review".
  const [blocked, setBlocked] = useState(null); // { code, text }
  const [now, setNow] = useState(() => Date.now());
  // One picker open at a time, inline under the rows: "vibe" | "hungry" | "upfor" | "home" | "pause" | null.
  const [panel, setPanel] = useState(null);
  const [vibeStart, setVibeStart] = useState(null);
  const [hungryHours, setHungryHours] = useState(DEFAULT_VIBE_HOURS);
  const [upForType, setUpForType] = useState("meal");
  const [changingUpFor, setChangingUpFor] = useState(null);
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
    setVibeStart(null);
    setChangingUpFor(null);
    setUpForType("meal");
    setDay(0);
    setHomeMeal(null);
    setHomeWho(null);
  }

  async function run(change, blockedText = null) {
    setBusy(true);
    setError("");
    setBlocked(null);
    try {
      await change();
      const { a, plans } = await loadAll();
      setState(a);
      if (plans) setHomes(plans);
      setNow(Date.now());
      closePanel();
    } catch (err) {
      setError(err?.message || "Something went wrong. Try again.");
      const code = err?.payload?.code || err?.code;
      if (blockedText && code) setBlocked({ code, text: blockedText });
    } finally {
      setBusy(false);
    }
  }

  const shownLevel = discover || level;
  const paused = !!state && !state.available;
  const custom = state?.activeVibe?.kind === "custom" ? state.activeVibe : null;
  const treat = state?.treatVibe ? TREAT_VIBES.find((t) => t.kind === state.treatVibe) : null;
  const active = !!state && (state.hungry || state.upFor.length > 0 || homes.length > 0 || state.feelingSocial || !!custom || !!treat);
  const days = nextDays(now);
  const today = ymd(new Date(now));
  const until = (kind) => (state?.activeVibe?.kind === kind ? untilLabel(state.activeVibe.until, now) : null);

  function openVibe(kind, text = "") {
    closePanel();
    setVibeStart({ kind, text });
    setPanel("vibe");
  }

  /** Hungry now goes on to "Hungry now for?"; the others are set here (one at a time). */
  function setVibe(choice) {
    if (choice.kind === "hungry") {
      setHungryHours(choice.hours);
      setVibeStart(null);
      setPanel("hungry");
      return;
    }
    void run(() => setRightNowVibe(choice), choice.kind === "custom" ? choice.text : null);
  }

  function openUpFor(u) {
    closePanel();
    setChangingUpFor(u);
    setUpForType(u ? upForTypeOf(u.window) : "meal");
    setDay(u ? Math.max(0, days.indexOf(u.date)) : 0);
    setPanel("upfor");
  }

  function pickUpFor(w) {
    const old = changingUpFor;
    const date = days[day];
    void run(async () => {
      if (old && !(old.date === date && old.window === w)) await clearUpFor(old.window, old.date === today ? null : old.date);
      await postUpFor(w, day === 0 ? null : date);
    });
  }

  return (
    <div style={st.card} data-testid="vibe-card">
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={st.eyebrow}>My Availability</h2>
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
                <Row
                  // 2026-11-19 (Andre): "Hungry Now - [food]".
                  label={state.hungryFor ? `Hungry Now - ${state.hungryFor}` : "Hungry now"}
                  until={until("hungry")}
                  color={C.hungry}
                  testId="my-vibe-hungry"
                  onChange={() => openVibe("hungry")}
                  onRemove={() => run(() => clearHungryNow())}
                  busy={busy}
                />
              ) : null}
              {state.feelingSocial ? (
                <Row
                  label="✨ Feeling Social"
                  until={until("feeling_social")}
                  testId="my-vibe-social"
                  onChange={() => openVibe("feeling_social")}
                  onRemove={() => run(() => setAvailability({ feeling_social: false }))}
                  busy={busy}
                />
              ) : null}
              {treat ? (
                <Row
                  label={treat.label}
                  until={until(treat.kind)}
                  testId={`my-vibe-${treat.kind}`}
                  onChange={() => openVibe(treat.kind)}
                  onRemove={() => run(() => setRightNowVibe({ kind: null }))}
                  busy={busy}
                />
              ) : null}
              {custom ? (
                <Row
                  label={`“${custom.label}”`}
                  until={until("custom")}
                  testId="my-vibe-custom"
                  onChange={() => openVibe("custom", custom.label)}
                  onRemove={() => run(() => setRightNowVibe({ kind: null }))}
                  busy={busy}
                />
              ) : null}
              {state.upFor.map((u) => (
                <Row
                  key={`${u.date}-${u.window}`}
                  label={upForLine(u, now)}
                  testId={`my-vibe-upfor-${u.date}-${u.window}`}
                  changeTestId={`my-vibe-upfor-change-${u.date}-${u.window}`}
                  onChange={() => openUpFor(u)}
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
              Available: people can find you. Pick a vibe below to show first.
            </p>
          )}

          <div style={st.choices}>
            {panel === "vibe" ? (
              <VibePicker
                start={vibeStart}
                replacing={state.activeVibe && state.activeVibe.kind !== vibeStart?.kind ? state.activeVibe.label : null}
                busy={busy}
                onCancel={closePanel}
                onSet={setVibe}
              />
            ) : null}
            {panel === "hungry" ? <HungryFor busy={busy} onSet={(food) => run(() => postHungryNow(food, hungryHours))} /> : null}
            {!state.hungry ? (
              <Choice label="Hungry now" action="Set ›" busy={busy} onClick={() => openVibe("hungry")} testId="my-vibe-set-hungry" />
            ) : null}
            <Choice
              label="I’m up for…"
              note="A meal, coffee or Happy Hour 🍸, today or later this week"
              action={panel === "upfor" ? "Close" : "Pick ›"}
              busy={busy}
              onClick={() => (panel === "upfor" ? closePanel() : openUpFor(null))}
              testId="my-vibe-set-upfor"
            />
            {panel === "upfor" ? (
              <div style={st.panel} data-testid="my-vibe-upfor-sheet">
                <p style={st.panelTitle}>{changingUpFor ? "Change what you’re up for" : "I’m up for:"}</p>
                <div role="radiogroup" style={st.radioRow}>
                  {UP_FOR_TYPES.map((t) => (
                    <Radio key={t.key} on={upForType === t.key} label={t.label} onClick={() => setUpForType(t.key)} testId={`my-vibe-upfor-type-${t.key}`} />
                  ))}
                </div>
                <DayStrip days={days} now={now} value={day} onChange={setDay} testPrefix="my-vibe-day" />
                {/* A meal lists the four meals; Coffee (mig 0430) and Happy Hour 🍸 (mig 0436) are one row each. */}
                {(upForType === "meal" ? UP_FOR_KEYS.filter((m) => upForTypeOf(m) === "meal") : [upForType]).map((m) => (
                  <Choice
                    key={m}
                    label={upForType === "meal" ? UP_FOR_NAMES[m] : `${UP_FOR_NAMES[m]} · ${dayLabel(days[day], now)}`}
                    action={upForType === "meal" ? "›" : "Set ›"}
                    busy={busy}
                    onClick={() => pickUpFor(m)}
                    testId={`my-vibe-meal-${m}`}
                  />
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
            {/* Feeling Social (mig 0445, 18+) and your own words (plan 58) sit with the other vibes. */}
            {!state.feelingSocial ? (
              <Choice label="✨ Feeling Social" note="Open to meeting new people" action="Turn on ›" busy={busy} onClick={() => openVibe("feeling_social")} testId="my-vibe-set-social" />
            ) : null}
            {/* 2026-11-28 (plan 79): 😋 Treat me · 🙌 My treat (18+). */}
            {TREAT_VIBES.filter((t) => t.kind !== treat?.kind).map((t) => (
              <Choice key={t.kind} label={t.label} note={t.note} action="Turn on ›" busy={busy} onClick={() => openVibe(t.kind)} testId={`my-vibe-set-${t.kind}`} />
            ))}
            <Choice
              label="Write your own vibe"
              note="Like “Down for late night tacos”"
              action="Write ›"
              busy={busy}
              onClick={() => openVibe("custom", custom?.label || "")}
              testId="my-vibe-set-custom"
            />
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
      {error && blocked ? <AskForReview surface="vibe" code={blocked.code} text={blocked.text} /> : null}

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

/** "Hungry now for?" — optional; suggestions fill the box; Skip or Done. */
function HungryFor({ busy, onSet }) {
  const [food, setFood] = useState("");
  const [picked, setPicked] = useState(null);
  const [matches, setMatches] = useState([]);
  const asked = useRef(0);
  const q = food.trim();
  useEffect(() => {
    if (q.length < 2 || q === picked) return undefined;
    const n = ++asked.current;
    const timer = setTimeout(() => {
      suggestHungryFor(q)
        .then((b) => n === asked.current && setMatches((Array.isArray(b?.suggestions) ? b.suggestions : []).filter((x) => typeof x?.name === "string" && x.name.trim())))
        .catch(() => n === asked.current && setMatches([]));
    }, 200);
    return () => clearTimeout(timer);
  }, [q, picked]);
  const shown = q.length >= 2 && q !== picked ? matches.slice(0, 5) : [];
  return (
    <div style={st.panel} data-testid="hungry-for-sheet">
      {/* 2026-11-19 (Andre): "Hungry Now - [food]", as few words as possible. */}
      <p style={st.panelTitle}>Hungry Now -</p>
      <p style={st.status}>Optional</p>
      <input
        value={food}
        onChange={(e) => {
          setFood(e.target.value);
          setPicked(null);
          if (e.target.value.trim().length < 2) setMatches([]);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSet(food);
        }}
        placeholder="Pizza, Thai, Chipotle…"
        maxLength={40}
        autoComplete="off"
        autoFocus
        aria-label="Hungry Now - food"
        style={st.input}
        data-testid="hungry-for-input"
      />
      {shown.length ? (
        <div data-testid="hungry-for-suggestions">
          {shown.map((m, i) => (
            <button
              key={`${m.kind}-${m.name}`}
              type="button"
              style={st.match}
              onClick={() => {
                setFood(m.name);
                setPicked(m.name);
                setMatches([]);
              }}
              data-testid={`hungry-for-suggestion-${i}`}
            >
              {m.name}
            </button>
          ))}
        </div>
      ) : null}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", minHeight: 40 }}>
        <button type="button" style={st.quiet} disabled={busy} onClick={() => onSet(null)} data-testid="hungry-for-skip">
          Skip
        </button>
        <button type="button" style={{ ...st.link, fontSize: 16, alignSelf: "center" }} disabled={busy} onClick={() => onSet(food)} data-testid="hungry-for-done">
          Done
        </button>
      </div>
    </div>
  );
}

function Row({ label, until = null, color = C.text, onChange, onRemove, busy, testId, changeTestId }) {
  return (
    <div style={st.row} data-testid={testId}>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ ...st.rowText, color, display: "block" }}>{label}</span>
        {until ? <span style={st.until}>{until}</span> : null}
      </span>
      {onChange ? (
        <button type="button" style={{ ...st.link, alignSelf: "center" }} disabled={busy} onClick={onChange} data-testid={changeTestId || `${testId}-change`}>
          Change
        </button>
      ) : null}
      <button type="button" style={{ ...st.link, alignSelf: "center" }} disabled={busy} onClick={onRemove} data-testid={`${testId}-remove`}>
        Remove
      </button>
    </div>
  );
}

function Choice({ label, note = null, action, onClick, busy, testId }) {
  return (
    <button type="button" style={st.choice} disabled={busy} onClick={onClick} data-testid={testId}>
      <span style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
        <span style={{ color: C.text, fontSize: 16 }}>{label}</span>
        {note ? <span style={{ color: C.muted, fontSize: 13 }}>{note}</span> : null}
      </span>
      <span style={{ color: C.accent, fontWeight: 700, fontSize: 14 }}>{action}</span>
    </button>
  );
}

/** A round radio mark (the same look as How discoverable are you?), never an oval pill. */
export function RadioMark({ on }) {
  return <span style={{ ...st.radio, ...(on ? st.radioOn : null) }}>{on ? <span style={st.radioDot} /> : null}</span>;
}

function Radio({ on, label, note = null, onClick, testId }) {
  return (
    <button type="button" role="radio" aria-checked={on} onClick={onClick} style={st.radioOption} data-testid={testId}>
      <RadioMark on={on} />
      <span style={{ display: "flex", flexDirection: "column", gap: 1, textAlign: "left" }}>
        <span style={{ fontSize: 16, color: C.text }}>{label}</span>
        {note ? <span style={{ fontSize: 13, color: C.muted }}>{note}</span> : null}
      </span>
    </button>
  );
}

/**
 * Your vibe right now (plan 58): one at a time — Hungry now, ✨ Feeling Social or your own words
 * (≤ 80) — for 2, 4 or 8 hours (4 to start). Ends by itself; setting one replaces the one you have.
 */
function VibePicker({ start, replacing, busy, onCancel, onSet }) {
  const [kind, setKind] = useState(start?.kind || "hungry");
  const [text, setText] = useState(start?.kind === "custom" ? start.text || "" : "");
  const [hours, setHours] = useState(DEFAULT_VIBE_HOURS);
  const clean = text.replace(/\s+/g, " ").trim();
  const ready = kind !== "custom" || (clean.length > 0 && [...clean].length <= CUSTOM_VIBE_MAX);
  return (
    <div style={st.panel} data-testid="right-now-vibe-sheet">
      <p style={st.panelTitle}>Your vibe right now</p>
      <div role="radiogroup">
        {VIBE_KINDS.map((k) => (
          <Radio key={k.kind} on={kind === k.kind} label={k.label} note={k.note} onClick={() => setKind(k.kind)} testId={`vibe-kind-${k.kind}`} />
        ))}
      </div>
      {kind === "custom" ? (
        <>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Down for late night tacos"
            maxLength={CUSTOM_VIBE_MAX}
            autoFocus
            aria-label="Your vibe"
            style={st.input}
            data-testid="vibe-custom-input"
          />
          <p style={{ ...st.muted, margin: 0, textAlign: "right" }} data-testid="vibe-custom-count">{`${[...text].length}/${CUSTOM_VIBE_MAX}`}</p>
        </>
      ) : null}
      <p style={st.forLabel}>For</p>
      <div role="radiogroup" style={st.radioRow}>
        {VIBE_HOURS.map((h) => (
          <Radio key={h} on={hours === h} label={`${h} hours`} onClick={() => setHours(h)} testId={`vibe-hours-${h}`} />
        ))}
      </div>
      <p style={st.status}>{replacing ? `Ends by itself. Replaces “${replacing}”.` : "Ends by itself. You can change or remove it anytime."}</p>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", minHeight: 40 }}>
        <button type="button" style={st.quiet} onClick={onCancel} data-testid="vibe-cancel">
          Cancel
        </button>
        <button
          type="button"
          style={{ ...st.link, fontSize: 16, alignSelf: "center", ...(!ready || busy ? { color: C.muted, cursor: "default" } : null) }}
          disabled={!ready || busy}
          onClick={() => onSet({ kind, hours, ...(kind === "custom" ? { text: clean } : {}) })}
          data-testid="vibe-set"
        >
          {kind === "hungry" ? "Next ›" : "Set ›"}
        </button>
      </div>
    </div>
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
  until: { display: "block", fontSize: 13, color: C.muted },
  radioRow: { display: "flex", flexWrap: "wrap", columnGap: 16 },
  radioOption: { display: "flex", alignItems: "center", gap: 10, minHeight: 44, padding: 0, border: "none", background: "transparent", cursor: "pointer", fontFamily: "inherit" },
  radio: { width: 20, height: 20, borderRadius: "50%", border: `2px solid ${C.muted}`, display: "inline-flex", alignItems: "center", justifyContent: "center", boxSizing: "border-box", flexShrink: 0 },
  radioOn: { borderColor: C.accent },
  radioDot: { width: 10, height: 10, borderRadius: "50%", background: C.accent },
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
  input: { width: "100%", boxSizing: "border-box", minHeight: 44, padding: "0 12px", fontSize: 16, fontFamily: "inherit", color: C.text, border: `1px solid ${C.border}`, borderRadius: 8, margin: "6px 0" },
  match: { display: "block", width: "100%", minHeight: 40, padding: 0, border: "none", borderTop: `1px solid ${C.border}`, background: "transparent", cursor: "pointer", fontFamily: "inherit", fontSize: 16, color: C.text, textAlign: "left" },
  who: { display: "flex", alignItems: "center", gap: 8, minHeight: 36, padding: "8px 0 0", border: "none", borderTop: `1px solid ${C.border}`, background: "transparent", cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 600 },
};
