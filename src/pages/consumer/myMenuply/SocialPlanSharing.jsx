/**
 * Social Plans Phase B sharing controls (Andre approved 2026-10-28, menuply-mobile docs/15).
 *   CalendarWhoCard — who sees my calendar: All my Connects · Only some Connects · Just me (behind ⚙︎).
 *   WhoCanCome / PlanPanel — on a plan I host: Only people I invite · Let my Connects ask, Just me.
 *   PeerPlansSection — a Connect's plans I can act on (their page).
 * Plans are never shown to people you aren't connected with.
 */

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getPeerSocialCalendar,
  getSocialCalendarSettings,
  listConnections,
  saveSocialCalendarSettings,
  saveSocialPlanSharing,
} from "../../../lib/consumerApi.js";
import SocialPlanActionButton from "./SocialPlanActionButton.jsx";
import PlanTag from "./PlanTag.jsx";

// Plain words (Andre 2026-10-28, "think an Apple product").
const WHO = [
  ["connections", "All my Connects"],
  ["selected", "Only some Connects"],
  ["only_me", "Just me"],
];

function Chip({ label, on, onClick, testId }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick} style={{ ...styles.chip, ...(on ? styles.chipOn : null) }} data-testid={testId}>
      {label}
    </button>
  );
}

export function CalendarWhoCard() {
  const [settings, setSettings] = useState(null);
  const [connects, setConnects] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getSocialCalendarSettings()
      .then(setSettings)
      .catch(() => setSettings(null));
  }, []);

  useEffect(() => {
    if (settings?.calendar_visibility !== "selected" || connects) return;
    listConnections()
      .then((r) => setConnects(r.accepted || []))
      .catch(() => setConnects([]));
  }, [settings?.calendar_visibility, connects]);

  async function save(next) {
    const before = settings;
    setSettings(next);
    setError("");
    try {
      setSettings(await saveSocialCalendarSettings(next));
    } catch (err) {
      setSettings(before);
      setError(err.message || "Couldn’t save");
    }
  }

  if (!settings) return null;
  const allowed = settings.allowed_user_ids || [];
  return (
    <div style={styles.card} data-testid="calendar-who">
      <strong style={styles.heading}>Who sees my calendar</strong>
      <div style={styles.chips}>
        {WHO.map(([value, label]) => (
          <Chip
            key={value}
            label={label}
            on={settings.calendar_visibility === value}
            onClick={() => save({ ...settings, calendar_visibility: value })}
            testId={`calendar-who-${value}`}
          />
        ))}
      </div>
      {settings.calendar_visibility === "selected" && connects ? (
        <div style={styles.chips}>
          {connects.map((c) => {
            const id = Number(c.peer?.id);
            const on = allowed.includes(id);
            return (
              <Chip
                key={id}
                label={`${on ? "✓ " : ""}${c.peer?.display_name || "A diner"}`}
                on={on}
                onClick={() =>
                  save({ ...settings, allowed_user_ids: on ? allowed.filter((x) => x !== id) : [...allowed, id] })
                }
                testId={`calendar-who-peer-${id}`}
              />
            );
          })}
        </div>
      ) : null}
      <span style={styles.muted}>
        {settings.calendar_visibility === "only_me"
          ? "Nobody else sees your plans."
          : "Only your Connects, never anyone else."}
      </span>
      {error ? <span style={styles.error}>{error}</span> : null}
    </div>
  );
}

/**
 * Who can come — two choices (Andre 2026-10-28): only people I invite, or my Connects can ask
 * (I say yes or no to each one). Older "anyone can join" plans keep working; not offered for new ones.
 */
export function WhoCanCome({ value, onChange, testId }) {
  const current = value === "invite_only" || value === "invite" ? "invite" : value === "ask" ? "ask" : null;
  const option = (v, label, hint) => (
    <label key={v} style={styles.radioRow} data-testid={`${testId}-${v}`}>
      <input type="radio" name={testId} checked={current === v} onChange={() => onChange(v)} />
      <span style={{ display: "grid", gap: 1 }}>
        <span style={{ fontSize: 14, color: "#0f172a" }}>{label}</span>
        {hint ? <span style={styles.muted}>{hint}</span> : null}
      </span>
    </label>
  );
  return (
    <div style={{ display: "grid", gap: 6 }} data-testid={testId}>
      {option("invite", "Only people I invite", null)}
      {option("ask", "Let my Connects ask", "You’ll say yes or no to each one.")}
      {value === "open" ? <span style={styles.muted}>Right now any of your Connects can join this plan.</span> : null}
    </div>
  );
}

/** One of my plans, clicked on the calendar: Who can come, Just me, Invite people, See the plan. */
export function PlanPanel({ plan, onSaved, onPickTime }) {
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  if (!plan || plan.source === "venue_event") return null;

  async function save(change) {
    setError("");
    try {
      const r = await saveSocialPlanSharing(plan.source, plan.id, change);
      onSaved({ ...plan, visibility: r.visibility || null, join_mode: r.join_mode });
    } catch (err) {
      setError(err.message || "Couldn’t save");
    }
  }

  const link = plan.href ? `${window.location.origin}${plan.href}` : null;
  return (
    <div style={styles.controls} data-testid={`plan-panel-${plan.key}`}>
      {plan.time_open || !plan.date ? (
        <button type="button" onClick={onPickTime} style={styles.linkButton} data-testid={`plan-panel-${plan.key}-when`}>
          Pick a day & time ›
        </button>
      ) : null}
      <strong style={{ fontSize: 13, color: "#475569" }}>Who can come</strong>
      <WhoCanCome
        value={plan.join_mode}
        onChange={(v) => save({ join_mode: v === "invite" ? "invite_only" : "ask" })}
        testId={`plan-panel-${plan.key}-who`}
      />
      <label style={styles.radioRow} data-testid={`plan-panel-${plan.key}-just-me`}>
        <input type="checkbox" checked={plan.visibility === "only_me"} onChange={() => save({ visibility: plan.visibility === "only_me" ? null : "only_me" })} />
        <span style={{ display: "grid", gap: 1 }}>
          <span style={{ fontSize: 14, color: "#0f172a" }}>Just me</span>
          <span style={styles.muted}>Hide this plan from my calendar for others.</span>
        </span>
      </label>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        {link ? (
          <button
            type="button"
            onClick={async () => {
              try {
                if (navigator.share) await navigator.share({ title: plan.title, text: `${plan.title} — want to come?`, url: link });
                else {
                  await navigator.clipboard.writeText(link);
                  setCopied(true);
                }
              } catch {
                /* closed the share sheet */
              }
            }}
            style={styles.primary}
            data-testid={`plan-panel-${plan.key}-invite`}
          >
            {copied ? "Link copied" : "Invite people"}
          </button>
        ) : null}
        {plan.href ? (
          <Link to={plan.href} style={styles.linkButton}>
            See the plan ›
          </Link>
        ) : null}
      </div>
      {error ? <span style={styles.error}>{error}</span> : null}
    </div>
  );
}

export function PeerPlansSection({ peerId, name, title = null, previewPlans = null, note = null }) {
  const [loaded, setLoaded] = useState([]);
  const plans = previewPlans || loaded;
  const setPlans = setLoaded;

  useEffect(() => {
    if (!peerId) return;
    getPeerSocialCalendar(peerId)
      .then((r) => setPlans(r.shared ? (r.plans || []).filter((p) => p.action !== "none") : []))
      .catch(() => setPlans([]));
  }, [peerId]);

  if (!plans.length && !note) return null;
  return (
    <section style={styles.card} data-testid="peer-social-plans">
      <strong style={styles.heading}>{title || `${name || "Their"}’s Social Calendar`}</strong>
      {plans.map((p) => (
        <div key={p.key} style={styles.row} data-testid={`peer-plan-${p.key}`}>
          <div style={{ flex: 1, minWidth: 0, display: "grid", gap: 1 }}>
            <span style={styles.when}>
              <PlanTag plan={p} />
              {formatWhen(p)}
            </span>
            <strong style={{ fontSize: 15, color: "#0f172a" }}>{p.title}</strong>
            <span style={styles.muted}>
              {[p.place?.name && p.place.name !== p.title ? p.place.name : null, p.going_count > 1 ? `${p.going_count} going` : null]
                .filter(Boolean)
                .join(" · ")}
            </span>
          </div>
          {previewPlans ? (
            <span style={styles.previewAction}>{p.action === "join" ? "Join" : "Ask to Join"}</span>
          ) : (
            <SocialPlanActionButton plan={p} testId={`peer-plan-${p.key}-action`} />
          )}
        </div>
      ))}
      {note ? (
        <span style={styles.muted} data-testid="peer-plans-note">
          {note}
        </span>
      ) : null}
    </section>
  );
}

function formatWhen(p) {
  if (!p?.date) return "Day not set";
  const day = new Date(`${p.date}T12:00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  if (!p.time) return day;
  const [h, m] = p.time.split(":").map(Number);
  return `${day} · ${new Date(2000, 0, 1, h, m).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
}

const styles = {
  previewAction: { background: "#0f7a24", color: "#fff", borderRadius: 999, padding: "4px 12px", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" },
  card: { border: "1px solid #e2e8f0", borderRadius: 14, padding: 12, background: "#fff", display: "grid", gap: 8, marginTop: 12 },
  heading: { fontSize: 15, color: "#0f172a" },
  chips: { display: "flex", flexWrap: "wrap", gap: 6 },
  chip: {
    padding: "6px 12px",
    borderRadius: 999,
    border: "1px solid #cbd5e1",
    background: "#fff",
    color: "#0f172a",
    fontWeight: 600,
    fontSize: 13,
    cursor: "pointer",
  },
  chipOn: { background: "#15803d", borderColor: "#15803d", color: "#fff" },
  controls: { display: "grid", gap: 8, padding: "8px 2px 6px" },
  radioRow: { display: "flex", gap: 8, alignItems: "flex-start", cursor: "pointer" },
  primary: { padding: "8px 14px", borderRadius: 10, border: "none", background: "#0f172a", color: "#fff", fontWeight: 700, cursor: "pointer" },
  linkButton: { background: "none", border: "none", padding: 0, color: "#15803d", fontWeight: 700, fontSize: 13, cursor: "pointer", textDecoration: "none", justifySelf: "start" },
  row: { display: "flex", alignItems: "center", gap: 10 },
  when: { fontSize: 12, fontWeight: 700, color: "#15803d" },
  muted: { fontSize: 13, color: "#64748b" },
  error: { fontSize: 13, color: "#b91c1c", fontWeight: 600 },
};
