/**
 * A plan that says "Day not set" / "You pick a time" opens this instead of the restaurant
 * (Andre 2026-10-28). My own plan: sets its day and time. An invite to me: replies Going with the
 * day and time I picked. "See the plan ›" still opens it.
 */

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { saveSocialPlanSharing } from "../../../lib/consumerApi.js";
import { respondToEatInvitation } from "../../../lib/eatInvitationsApi.js";
import { dayChoices, timeChoices } from "../../../lib/socialPlanTags.js";

export default function PickPlanTime({ plan, onSaved }) {
  const days = useMemo(() => dayChoices(), []);
  const times = useMemo(() => timeChoices(), []);
  const [date, setDate] = useState(null);
  const [time, setTime] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const mine = plan.is_organizer === true;
  const needsTime = plan.source !== "eating_plan";
  const ready = Boolean(date && (!needsTime || time));

  async function save() {
    setBusy(true);
    setError("");
    try {
      if (mine) {
        const r = await saveSocialPlanSharing(plan.source, plan.id, { date, time: needsTime ? time : null });
        onSaved({ ...plan, date: r.date || date, time: r.time || time, time_open: false });
      } else {
        await respondToEatInvitation(plan.id, "accepted", { proposedDate: date, proposedTime: time });
        onSaved({ ...plan, date, time, my_status: "going", time_open: false });
      }
    } catch (err) {
      setError(err.message || "Couldn’t save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={styles.box} data-testid={`pick-time-${plan.key}`}>
      <strong style={{ fontSize: 14 }}>{mine ? "When is it?" : "When works for you?"}</strong>
      <div style={styles.chips}>
        {days.map((d) => (
          <Chip key={d.date} label={d.label} on={date === d.date} onClick={() => setDate(d.date)} testId={`pick-day-${d.date}`} />
        ))}
      </div>
      {needsTime ? (
        <div style={styles.chips}>
          {times.map((t) => (
            <Chip key={t.time} label={t.label} on={time === t.time} onClick={() => setTime(t.time)} testId={`pick-time-${t.time}`} />
          ))}
        </div>
      ) : null}
      {error ? <span style={{ color: "#b91c1c", fontSize: 13, fontWeight: 600 }}>{error}</span> : null}
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <button type="button" disabled={!ready || busy} onClick={save} style={{ ...styles.save, opacity: !ready || busy ? 0.5 : 1 }} data-testid="pick-time-save">
          {busy ? "…" : mine ? "Set the time" : "I’m going then"}
        </button>
        {plan.href ? (
          <Link to={plan.href} style={{ fontSize: 13, fontWeight: 700, color: "#15803d" }}>
            See the plan ›
          </Link>
        ) : null}
      </div>
    </div>
  );
}

function Chip({ label, on, onClick, testId }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick} data-testid={testId} style={{ ...styles.chip, ...(on ? styles.chipOn : null) }}>
      {label}
    </button>
  );
}

const styles = {
  box: { display: "grid", gap: 8, padding: "8px 2px 4px" },
  chips: { display: "flex", flexWrap: "wrap", gap: 6 },
  chip: { padding: "5px 11px", borderRadius: 999, border: "1px solid #cbd5e1", background: "#fff", color: "#0f172a", fontWeight: 600, fontSize: 13, cursor: "pointer" },
  chipOn: { background: "#15803d", borderColor: "#15803d", color: "#fff" },
  save: { padding: "9px 16px", borderRadius: 10, border: "none", background: "#0f172a", color: "#fff", fontWeight: 700, cursor: "pointer" },
};
