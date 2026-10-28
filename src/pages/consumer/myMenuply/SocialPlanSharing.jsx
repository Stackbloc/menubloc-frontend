/**
 * Social Plans Phase B sharing controls (Andre approved 2026-10-28, menuply-mobile docs/15).
 *   CalendarWhoCard — who can see my Social Calendar: All my Connects · Selected Connects · Only me.
 *   PlanSharingControls — on a plan I host: my calendar setting / Only me, and Invite only · Ask · Open.
 *   PeerPlansSection — a Connect's plans I can act on (their page).
 * Plans are never shown to people you aren't connected with.
 */

import { useEffect, useState } from "react";
import {
  getPeerSocialCalendar,
  getSocialCalendarSettings,
  listConnections,
  saveSocialCalendarSettings,
  saveSocialPlanSharing,
} from "../../../lib/consumerApi.js";
import SocialPlanActionButton from "./SocialPlanActionButton.jsx";
import PlanTag from "./PlanTag.jsx";

const WHO = [
  ["connections", "All my Connects"],
  ["selected", "Selected Connects"],
  ["only_me", "Only me"],
];
const JOIN = [
  ["invite_only", "Invite only"],
  ["ask", "Ask to join"],
  ["open", "Open"],
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
      <strong style={styles.heading}>Who can see my calendar</strong>
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
          : "Your plans are never shown to people you aren’t connected with."}
      </span>
      {error ? <span style={styles.error}>{error}</span> : null}
    </div>
  );
}

export function PlanSharingControls({ plan, onSaved }) {
  const [error, setError] = useState("");
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

  return (
    <div style={styles.controls} data-testid={`plan-sharing-${plan.key}`}>
      <div style={styles.chips}>
        <Chip label="My calendar setting" on={plan.visibility !== "only_me"} onClick={() => save({ visibility: null })} testId={`plan-sharing-${plan.key}-calendar`} />
        <Chip label="Only me" on={plan.visibility === "only_me"} onClick={() => save({ visibility: "only_me" })} testId={`plan-sharing-${plan.key}-only-me`} />
      </div>
      <div style={styles.chips}>
        {JOIN.map(([value, label]) => (
          <Chip key={value} label={label} on={plan.join_mode === value} onClick={() => save({ join_mode: value })} testId={`plan-sharing-${plan.key}-${value}`} />
        ))}
      </div>
      {error ? <span style={styles.error}>{error}</span> : null}
    </div>
  );
}

export function PeerPlansSection({ peerId, name }) {
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    if (!peerId) return;
    getPeerSocialCalendar(peerId)
      .then((r) => setPlans(r.shared ? (r.plans || []).filter((p) => p.action !== "none") : []))
      .catch(() => setPlans([]));
  }, [peerId]);

  if (!plans.length) return null;
  return (
    <section style={styles.card} data-testid="peer-social-plans">
      <strong style={styles.heading}>{`${String(name || "Their").split(" ")[0]}’s plans`}</strong>
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
          <SocialPlanActionButton plan={p} testId={`peer-plan-${p.key}-action`} />
        </div>
      ))}
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
  controls: { display: "grid", gap: 6, padding: "6px 0 2px" },
  row: { display: "flex", alignItems: "center", gap: 10 },
  when: { fontSize: 12, fontWeight: 700, color: "#15803d" },
  muted: { fontSize: 13, color: "#64748b" },
  error: { fontSize: 13, color: "#b91c1c", fontWeight: 600 },
};
