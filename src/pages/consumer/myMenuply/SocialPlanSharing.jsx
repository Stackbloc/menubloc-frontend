/**
 * Social Plans Phase B sharing controls (Andre approved 2026-10-28, menuply-mobile docs/15).
 *   CalendarWhoCard — who sees my calendar: All my Connects · Only some Connects · Just me (behind ⚙︎).
 *   WhoCanCome / PlanPanel — on a plan I host, one choice: Only people I invite · Let my Connects ask · Just me.
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
 * Who can come — one radio group (Andre 2026-10-28; "Just me" joined the group 2026-11-10 so it can't
 * be ticked next to another choice): only people I invite, my Connects can ask (I say yes or no to
 * each one), or Just me (plan panel only: only I see it, nobody can join). Older "anyone can join"
 * plans keep working; not offered for new ones.
 */
export function WhoCanCome({ value, onChange, testId, justMe }) {
  const current = justMe
    ? "just_me"
    : value === "invite_only" || value === "invite"
      ? "invite"
      : value === "ask"
        ? "ask"
        : null;
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
      {justMe !== undefined ? option("just_me", "Just me", "Only you see it. Nobody can join.") : null}
      {value === "open" && !justMe ? <span style={styles.muted}>Right now any of your Connects can join this plan.</span> : null}
    </div>
  );
}

/** Why a save failed (2026-11-10): "gone" (404 plan_not_found), "open_invite" (409), else null. */
function planProblem(err) {
  const code = err?.payload?.code;
  if (code === "open_invite") return "open_invite";
  if (code === "plan_not_found" || err?.status === 404) return "gone";
  return null;
}

/**
 * One of my plans, clicked on the calendar: Who can come (one choice), Invite people, See the plan.
 * If the plan is gone it says so and only offers Remove from calendar (2026-11-10 "Plan not found").
 */
export function PlanPanel({ plan, onSaved, onPickTime, onRemove }) {
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [problem, setProblem] = useState(null);
  if (!plan || plan.source === "venue_event") return null;

  async function save(change) {
    setError("");
    try {
      const r = await saveSocialPlanSharing(plan.source, plan.id, change);
      onSaved({ ...plan, visibility: r.visibility || null, join_mode: r.join_mode });
    } catch (err) {
      const p = planProblem(err);
      if (p) setProblem(p);
      else setError(err.message || "Couldn’t save");
    }
  }

  // One choice, one save: Just me = only me + nobody joins; the others share it again.
  const choose = (v) =>
    save(v === "just_me" ? { visibility: "only_me", join_mode: "invite_only" } : { visibility: null, join_mode: v === "invite" ? "invite_only" : "ask" });

  if (problem) {
    return (
      <div style={styles.controls} data-testid={`plan-panel-${plan.key}-${problem}`}>
        {problem === "open_invite" ? (
          <>
            <span style={{ fontSize: 14, color: "#0f172a" }}>This is an Open Invite. Change it on its own page.</span>
            <Link to={`/invite/${encodeURIComponent(plan.id)}`} style={styles.primary}>
              Open the invite
            </Link>
          </>
        ) : (
          <>
            <span style={{ fontSize: 14, color: "#0f172a" }}>This plan was cancelled or removed.</span>
            <button type="button" onClick={() => onRemove?.()} style={styles.primary} data-testid={`plan-panel-${plan.key}-remove`}>
              Remove from calendar
            </button>
          </>
        )}
      </div>
    );
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
      <WhoCanCome value={plan.join_mode} justMe={plan.visibility === "only_me"} onChange={choose} testId={`plan-panel-${plan.key}-who`} />
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        {link && plan.visibility !== "only_me" ? (
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

/** `onPlans`: told what a Connect's calendar shows once it loads (the empty-profile check). */
export function PeerPlansSection({ peerId, name, title = null, previewPlans = null, note = null, onPlans = null }) {
  const [loaded, setLoaded] = useState([]);
  // They share it with me: an empty shared calendar says "No plans yet." (Andre 2026-11-06).
  const [shared, setShared] = useState(false);
  const plans = previewPlans || loaded;
  const setPlans = setLoaded;

  useEffect(() => {
    if (!peerId) return;
    getPeerSocialCalendar(peerId)
      .then((r) => {
        const shown = r.shared ? (r.plans || []).filter((p) => p.action !== "none") : [];
        setShared(r.shared === true);
        setPlans(shown);
        onPlans?.(shown);
      })
      .catch(() => {
        setPlans([]);
        onPlans?.([]);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onPlans is a state setter
  }, [peerId]);

  if (!plans.length && !note && !(peerId && shared)) return null;
  return (
    <section style={styles.card} data-testid="peer-social-plans">
      <strong style={styles.heading}>{title || `${name || "Their"}’s Social Calendar`}</strong>
      {!plans.length && !note ? (
        <span style={styles.muted} data-testid="peer-social-plans-empty">
          No plans yet.
        </span>
      ) : null}
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
  previewAction: { background: "transparent", color: "#0f7a24", borderRadius: 999, padding: "4px 12px", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" },
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
  chipOn: { background: "#111613", borderColor: "#111613", color: "#fff" },
  controls: { display: "grid", gap: 8, padding: "8px 2px 6px" },
  radioRow: { display: "flex", gap: 8, alignItems: "flex-start", cursor: "pointer" },
  primary: { padding: "8px 14px", borderRadius: 10, border: "none", background: "#0f172a", color: "#fff", fontWeight: 700, cursor: "pointer" },
  linkButton: { background: "none", border: "none", padding: 0, color: "#15803d", fontWeight: 700, fontSize: 13, cursor: "pointer", textDecoration: "none", justifySelf: "start" },
  row: { display: "flex", alignItems: "center", gap: 10 },
  when: { fontSize: 12, fontWeight: 700, color: "#15803d" },
  muted: { fontSize: 13, color: "#64748b" },
  error: { fontSize: 13, color: "#b91c1c", fontWeight: 600 },
};
