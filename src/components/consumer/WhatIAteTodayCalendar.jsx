/**
 * Month calendar + day navigation for What I Ate Today.
 */

import React, { useMemo } from "react";
import { whatIAteTodayLocalDate } from "../../lib/consumerApi.js";

function pad2(n) {
  return String(n).padStart(2, "0");
}

function toYmd(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function parseYmd(ymd) {
  const [y, m, d] = String(ymd || "").split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function monthBounds(viewMonth) {
  const start = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
  const end = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0);
  return { from: toYmd(start), to: toYmd(end) };
}

export function calendarRangeForMonth(viewMonth) {
  return monthBounds(viewMonth);
}

export function isYmdInViewMonth(ymd, viewMonth) {
  const d = parseYmd(ymd);
  if (!d || !viewMonth) return false;
  return d.getFullYear() === viewMonth.getFullYear() && d.getMonth() === viewMonth.getMonth();
}

/** Prefer today when it falls in viewMonth; otherwise first day of that month. */
export function defaultYmdForViewMonth(viewMonth, todayYmd = whatIAteTodayLocalDate()) {
  if (isYmdInViewMonth(todayYmd, viewMonth)) return todayYmd;
  return toYmd(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1));
}

export default function WhatIAteTodayCalendar({
  selectedDate: selectedDateProp,
  onSelectDate,
  viewMonth,
  onViewMonthChange,
  dayCounts = [],
  readOnly = false,
}) {
  const today = whatIAteTodayLocalDate();
  const selectedDate = selectedDateProp || today;
  const countMap = useMemo(() => {
    const map = new Map();
    for (const row of dayCounts) {
      if (row?.eaten_on) map.set(row.eaten_on, Number(row.entry_count) || 0);
    }
    return map;
  }, [dayCounts]);

  const monthLabel = viewMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const firstOfMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
  const startPad = firstOfMonth.getDay();
  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startPad; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    const d = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day);
    cells.push(toYmd(d));
  }

  function shiftMonth(delta) {
    onViewMonthChange(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + delta, 1));
  }

  return (
    <div data-testid="what-i-ate-today-calendar" style={styles.wrap}>
      <div style={styles.monthHead}>
        <button type="button" style={styles.navBtn} onClick={() => shiftMonth(-1)} aria-label="Previous month">
          ‹
        </button>
        <div style={styles.monthTitleWrap}>
          <p style={styles.monthTitle}>{monthLabel}</p>
          {selectedDate !== today ? (
            <button type="button" style={styles.todayBtn} onClick={() => onSelectDate(today)}>
              Today
            </button>
          ) : null}
        </div>
        <button type="button" style={styles.navBtn} onClick={() => shiftMonth(1)} aria-label="Next month">
          ›
        </button>
      </div>

      <div style={styles.weekHead}>
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label) => (
          <span key={label} style={styles.weekLabel}>
            {label}
          </span>
        ))}
      </div>
      <div style={styles.grid}>
        {cells.map((ymd, idx) => {
          if (!ymd) return <span key={`pad-${idx}`} style={styles.emptyCell} />;
          const count = countMap.get(ymd) || 0;
          const selected = ymd === selectedDate;
          const isToday = ymd === today;
          return (
            <button
              key={ymd}
              type="button"
              disabled={readOnly && count === 0}
              onClick={() => onSelectDate(ymd)}
              style={{
                ...styles.dayCell,
                ...(selected ? styles.dayCellSelected : null),
                ...(isToday ? styles.dayCellToday : null),
                ...(count > 0 ? styles.dayCellHasEntries : null),
              }}
              aria-pressed={selected}
              aria-label={`${ymd}${count ? `, ${count} entries` : ""}`}
            >
              <span>{Number(ymd.slice(-2))}</span>
              {count > 0 ? <span style={styles.dot} aria-hidden /> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  wrap: { margin: "0 0 14px" },
  todayBtn: {
    appearance: "none",
    border: "none",
    background: "transparent",
    color: "#15803d",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    marginTop: 4,
  },
  navBtn: {
    appearance: "none",
    border: "1px solid #d1d5db",
    background: "#fff",
    borderRadius: 10,
    width: 40,
    height: 40,
    fontSize: 20,
    lineHeight: 1,
    cursor: "pointer",
    color: "#0f172a",
  },
  monthHead: {
    display: "grid",
    gridTemplateColumns: "40px 1fr 40px",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  monthTitleWrap: { textAlign: "center" },
  monthTitle: { margin: 0, textAlign: "center", fontSize: 14, fontWeight: 800, color: "#334155" },
  weekHead: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: 4,
    marginBottom: 4,
  },
  weekLabel: { textAlign: "center", fontSize: 11, fontWeight: 700, color: "#94a3b8" },
  grid: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 },
  emptyCell: { minHeight: 40 },
  dayCell: {
    appearance: "none",
    border: "1px solid #e5e7eb",
    background: "#fff",
    borderRadius: 10,
    minHeight: 40,
    padding: "4px 0 6px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    fontSize: 13,
    fontWeight: 700,
    color: "#334155",
    cursor: "pointer",
  },
  dayCellSelected: {
    border: "2px solid #16a34a",
    background: "#f0fdf4",
    color: "#14532d",
  },
  dayCellToday: { boxShadow: "inset 0 0 0 1px #86efac" },
  dayCellHasEntries: { fontWeight: 800 },
  dot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#16a34a",
  },
};
