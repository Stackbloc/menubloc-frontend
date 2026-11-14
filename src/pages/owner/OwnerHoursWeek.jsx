import React from "react";
import { OWNER_COLORS } from "./OwnerLayout.jsx";
import { WEEK_ORDER, isOpen24, setOpen24 } from "../../lib/weeklyHours.js";

/** Weekly hours editor for Restaurant Management (single and bulk edits). One row per day. */

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function fullWeek(rows) {
  const byDay = new Map((rows || []).map((r) => [Number(r.day_of_week), r]));
  return Array.from({ length: 7 }, (_, d) => {
    const r = byDay.get(d);
    if (!r) return { day_of_week: d, opens_at: "09:00", closes_at: "21:00", is_closed: true, label: null };
    return {
      day_of_week: d,
      opens_at: r.opens_at ? String(r.opens_at).slice(0, 5) : "09:00",
      closes_at: r.closes_at ? String(r.closes_at).slice(0, 5) : "21:00",
      is_closed: r.is_closed === true,
      label: r.label || null,
    };
  });
}

export const hoursKey = (rows) =>
  rows.map((r) => (r.is_closed ? `${r.day_of_week}:closed` : `${r.day_of_week}:${r.opens_at}-${r.closes_at}:${r.label || ""}`)).join("|");

/** What the server stores: closed days carry no times. */
export const hoursForSave = (rows) =>
  rows.map((d) => ({ ...d, opens_at: d.is_closed ? null : d.opens_at, closes_at: d.is_closed ? null : d.closes_at }));

export function hoursSummary(rows) {
  const open = (rows || []).filter((r) => !r.is_closed);
  if (!open.length) return "Closed all week";
  return WEEK_ORDER.map((d) => {
    const r = (rows || []).find((x) => Number(x.day_of_week) === d);
    const name = DAY_NAMES[d].slice(0, 3);
    if (!r || r.is_closed) return `${name} closed`;
    if (isOpen24(r)) return `${name} 24 hrs`;
    return `${name} ${String(r.opens_at).slice(0, 5)}–${String(r.closes_at).slice(0, 5)}`;
  }).join(", ");
}

export default function OwnerHoursWeek({ hours, onChange }) {
  const setDay = (d, row) => onChange(hours.map((x) => (x.day_of_week === d ? row : x)));
  function copyMondayToWeekdays() {
    const mon = hours.find((x) => x.day_of_week === 1);
    onChange(hours.map((x) => ([2, 3, 4, 5].includes(x.day_of_week) ? { ...mon, day_of_week: x.day_of_week } : x)));
  }
  return (
    <div style={{ display: "grid", gap: 6 }}>
      {WEEK_ORDER.map((d) => {
        const day = hours.find((x) => x.day_of_week === d);
        const allDay = isOpen24(day);
        return (
          <div key={d} style={{ display: "grid", gridTemplateColumns: "84px 62px 72px 1fr 1fr", gap: 6, alignItems: "center", textTransform: "none", letterSpacing: 0 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: OWNER_COLORS.ink }}>{DAY_NAMES[d]}</span>
            <label style={check}>
              <input type="checkbox" checked={!day.is_closed} onChange={(e) => setDay(d, { ...day, is_closed: !e.target.checked })} />
              Open
            </label>
            <label style={{ ...check, opacity: day.is_closed ? 0.4 : 1 }}>
              <input type="checkbox" disabled={day.is_closed} checked={allDay} onChange={(e) => setDay(d, setOpen24(day, e.target.checked))} />
              24 hrs
            </label>
            <input type="time" style={input} disabled={day.is_closed || allDay} value={day.opens_at} onChange={(e) => setDay(d, { ...day, opens_at: e.target.value })} />
            <input type="time" style={input} disabled={day.is_closed || allDay} value={day.closes_at} onChange={(e) => setDay(d, { ...day, closes_at: e.target.value })} />
          </div>
        );
      })}
      <div>
        <button type="button" style={linkBtn} onClick={copyMondayToWeekdays}>Copy Monday to Tue–Fri</button>
      </div>
    </div>
  );
}

const input = { padding: "7px 8px", borderRadius: 10, border: `1px solid ${OWNER_COLORS.line}`, background: "#fff", fontSize: 13, width: "100%", boxSizing: "border-box" };
const check = { display: "flex", gap: 6, whiteSpace: "nowrap", alignItems: "center", fontSize: 13, fontWeight: 400, color: OWNER_COLORS.ink, textTransform: "none", letterSpacing: 0, cursor: "pointer" };
const linkBtn = { padding: 0, border: "none", background: "none", color: OWNER_COLORS.accent, fontWeight: 700, cursor: "pointer", fontSize: 12 };
