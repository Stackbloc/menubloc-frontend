/**
 * The owner's manual Hours form: "Set several days at once" + one row per day
 * (Open · 24 hrs · opens · closes). Shared by Owner Profile Manager and the mini Hours window
 * (/owner/hours-mini) so both are the same form. The parent owns `hours` and saves it.
 *
 * hours: [{ day_of_week 0=Sun..6, day_name, opens_at 'HH:MM', closes_at, is_closed, label }]
 */
import HoursBulkSet from "./HoursBulkSet.jsx";
import { applyHoursToDays, isOpen24, setOpen24 } from "../../lib/weeklyHours.js";

export const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** All days closed (the form's starting point). */
export function emptyWeek() {
  return Array.from({ length: 7 }, (_, i) => ({
    day_of_week: i,
    day_name: DAY_NAMES[i],
    opens_at: "09:00",
    closes_at: "21:00",
    is_closed: true,
    label: null,
  }));
}

/** Saved / read rows → the form's 7 days (days not given stay closed). */
export function weekFromRows(rows) {
  const list = Array.isArray(rows) ? rows : [];
  return emptyWeek().map((day) => {
    const row = list.find((s) => Number(s.day_of_week) === day.day_of_week);
    if (!row) return day;
    return {
      day_of_week: day.day_of_week,
      day_name: day.day_name,
      opens_at: row.opens_at ? String(row.opens_at).slice(0, 5) : "09:00",
      closes_at: row.closes_at ? String(row.closes_at).slice(0, 5) : "21:00",
      is_closed: row.is_closed === true || (!row.opens_at && row.is_closed !== false),
      label: row.label || null,
    };
  });
}

/** The form's days → the owner PUT /hours schedule body. */
export function scheduleForSave(hours) {
  return hours.map((d) => ({
    day_of_week: d.day_of_week,
    opens_at: d.is_closed ? null : d.opens_at,
    closes_at: d.is_closed ? null : d.closes_at,
    is_closed: Boolean(d.is_closed),
    label: d.label || null,
  }));
}

export default function WeeklyHoursForm({ hours, setHours, accent, inputStyle }) {
  return (
    <>
      <HoursBulkSet
        accent={accent}
        inputStyle={inputStyle}
        onApply={(days, setting) => setHours((prev) => applyHoursToDays(prev, days, setting))}
      />
      <div style={{ display: "grid", gap: 8 }}>
        {hours.map((day, idx) => {
          const allDay = isOpen24(day);
          const setRow = (row) => {
            const next = [...hours];
            next[idx] = row;
            setHours(next);
          };
          return (
          <div
            key={day.day_of_week}
            data-testid="owner-hours-row"
            style={{
              display: "grid",
              gridTemplateColumns: "100px 70px 80px 1fr 1fr",
              gap: 8,
              alignItems: "center",
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600 }}>{day.day_name}</div>
            <label style={{ fontSize: 12, display: "flex", gap: 6, alignItems: "center" }}>
              <input
                type="checkbox"
                checked={!day.is_closed}
                onChange={(e) => setRow({ ...day, is_closed: !e.target.checked })}
              />
              Open
            </label>
            <label style={{ fontSize: 12, display: "flex", gap: 6, alignItems: "center", opacity: day.is_closed ? 0.4 : 1 }}>
              <input
                type="checkbox"
                data-testid="owner-hours-24"
                disabled={day.is_closed}
                checked={allDay}
                onChange={(e) => setRow(setOpen24(day, e.target.checked))}
              />
              24 hrs
            </label>
            <input
              type="time"
              disabled={day.is_closed || allDay}
              value={day.opens_at || "09:00"}
              onChange={(e) => setRow({ ...day, opens_at: e.target.value })}
              style={inputStyle}
            />
            <input
              type="time"
              disabled={day.is_closed || allDay}
              value={day.closes_at || "21:00"}
              onChange={(e) => setRow({ ...day, closes_at: e.target.value })}
              style={inputStyle}
            />
          </div>
          );
        })}
      </div>
    </>
  );
}
