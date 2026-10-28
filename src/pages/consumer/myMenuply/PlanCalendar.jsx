/**
 * My Social Calendar (Andre 2026-10-28, same as the app): this week as a strip on My Menuply, a month
 * on /account/social-plans. Each plan is a dot in its tag color (Lunch green, Dinner blue, Event
 * purple …); click a day to see its plans.
 */

import { PLAN_TAG_COLORS, planTag, plansByDay, ymdOf } from "../../../lib/socialPlanTags.js";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const MAX_DOTS = 3;

function Dots({ plans }) {
  return (
    <span style={styles.dots} aria-hidden>
      {plans.slice(0, MAX_DOTS).map((p) => (
        <span key={p.key} style={{ ...styles.dot, background: PLAN_TAG_COLORS[planTag(p).tone].fg }} />
      ))}
    </span>
  );
}

function dayLabel(day, plans) {
  const when = new Date(`${day}T12:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  return plans.length ? `${when}, ${plans.length} ${plans.length === 1 ? "plan" : "plans"}` : when;
}

export function WeekStrip({ plans, today, selected = null, onSelect }) {
  const days = plansByDay(plans);
  const [y, m, d] = String(today).split("-").map(Number);
  return (
    <div style={styles.week} data-testid="calendar-week">
      {Array.from({ length: 7 }, (_, i) => {
        const date = new Date(y, m - 1, d + i);
        const day = ymdOf(date);
        const on = selected === day;
        const list = days.get(day) || [];
        return (
          <button
            key={day}
            type="button"
            aria-pressed={on}
            aria-label={dayLabel(day, list)}
            onClick={() => onSelect(day)}
            style={{ ...styles.weekDay, ...(on ? styles.on : null) }}
            data-testid={`calendar-week-${day}`}
          >
            <span style={{ ...styles.weekName, ...(on ? styles.onText : null) }}>
              {i === 0 ? "Today" : date.toLocaleDateString("en-US", { weekday: "short" })}
            </span>
            <strong style={{ ...styles.num, ...(on ? styles.onText : null) }}>{date.getDate()}</strong>
            <Dots plans={list} />
          </button>
        );
      })}
    </div>
  );
}

export function MonthGrid({ month, plans, today, selected, onSelect, onMonth }) {
  const days = plansByDay(plans);
  const [y, m] = String(month).split("-").map(Number);
  const first = new Date(y, m - 1, 1);
  const count = new Date(y, m, 0).getDate();
  const cells = [...Array(first.getDay()).fill(null), ...Array.from({ length: count }, (_, i) => ymdOf(new Date(y, m - 1, i + 1)))];
  while (cells.length % 7) cells.push(null);
  return (
    <div style={styles.month} data-testid="calendar-month">
      <div style={styles.monthHead}>
        <button type="button" aria-label="Previous month" onClick={() => onMonth(-1)} style={styles.arrow} data-testid="calendar-prev">
          ‹
        </button>
        <strong style={{ fontSize: 16 }} data-testid="calendar-month-title">
          {first.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </strong>
        <button type="button" aria-label="Next month" onClick={() => onMonth(1)} style={styles.arrow} data-testid="calendar-next">
          ›
        </button>
      </div>
      <div style={styles.grid}>
        {WEEKDAYS.map((w, i) => (
          <span key={`h${i}`} style={styles.head}>
            {w}
          </span>
        ))}
        {cells.map((day, i) =>
          day ? (
            <button
              key={day}
              type="button"
              aria-pressed={selected === day}
              aria-label={dayLabel(day, days.get(day) || [])}
              onClick={() => onSelect(day)}
              style={{ ...styles.cell, ...(selected === day ? styles.on : null) }}
              data-testid={`calendar-day-${day}`}
            >
              <span
                style={{
                  ...styles.cellNum,
                  ...(day === today ? styles.today : null),
                  ...(selected === day ? styles.onText : null),
                }}
              >
                {Number(day.slice(8))}
              </span>
              <Dots plans={days.get(day) || []} />
            </button>
          ) : (
            <span key={`e${i}`} />
          )
        )}
      </div>
    </div>
  );
}

const styles = {
  week: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 },
  weekDay: {
    display: "grid",
    justifyItems: "center",
    gap: 1,
    padding: "6px 0",
    borderRadius: 10,
    border: "none",
    background: "#f1f5f9",
    cursor: "pointer",
  },
  weekName: { fontSize: 11, color: "#64748b" },
  num: { fontSize: 15, color: "#0f172a" },
  on: { background: "#15803d" },
  onText: { color: "#fff" },
  dots: { display: "flex", gap: 2, height: 6, marginTop: 2 },
  dot: { width: 6, height: 6, borderRadius: 3, display: "inline-block" },
  month: { border: "1px solid #e2e8f0", borderRadius: 14, padding: 10, background: "#fff", marginTop: 12 },
  monthHead: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 6px 6px" },
  arrow: { border: "none", background: "none", fontSize: 24, color: "#15803d", cursor: "pointer", padding: "0 8px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 },
  head: { textAlign: "center", fontSize: 12, fontWeight: 700, color: "#64748b" },
  cell: {
    display: "grid",
    justifyItems: "center",
    padding: "6px 0",
    minHeight: 40,
    borderRadius: 10,
    border: "none",
    background: "none",
    cursor: "pointer",
  },
  cellNum: { fontSize: 14, color: "#0f172a" },
  today: { color: "#15803d", fontWeight: 800 },
};
