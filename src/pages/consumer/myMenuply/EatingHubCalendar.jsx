/**
 * Unified Eating hub calendar — Apple-inspired month grid with past/future markers.
 */

import { useMemo } from "react";
import { whatIAteTodayLocalDate } from "../../../lib/consumerApi.js";

function pad2(n) {
  return String(n).padStart(2, "0");
}

function toYmd(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

const WEEK = ["S", "M", "T", "W", "T", "F", "S"];

export default function EatingHubCalendar({
  selectedDate: selectedDateProp,
  onSelectDate,
  viewMonth,
  onViewMonthChange,
  dayMarkers = [],
  readOnly = false,
  lookbackStart = null,
  testId = "eating-calendar-grid",
}) {
  const today = whatIAteTodayLocalDate();
  const selectedDate = selectedDateProp || today;

  const markerMap = useMemo(() => {
    const map = new Map();
    for (const row of dayMarkers) {
      if (row?.ymd) map.set(row.ymd, row);
    }
    return map;
  }, [dayMarkers]);

  const monthLabel = viewMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const firstOfMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
  const startPad = firstOfMonth.getDay();
  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startPad; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(toYmd(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day)));
  }

  function canShiftMonth(delta) {
    if (delta > 0 || !lookbackStart) return true;
    const next = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + delta, 1);
    const lastOfNext = toYmd(new Date(next.getFullYear(), next.getMonth() + 1, 0));
    return lastOfNext >= lookbackStart;
  }

  function shiftMonth(delta) {
    if (!canShiftMonth(delta)) return;
    onViewMonthChange(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + delta, 1));
  }

  return (
    <div data-testid={testId} style={styles.wrap}>
      <div style={styles.monthRow}>
        <button
          type="button"
          style={{ ...styles.navBtn, ...(!canShiftMonth(-1) ? styles.navBtnDisabled : null) }}
          onClick={() => shiftMonth(-1)}
          disabled={!canShiftMonth(-1)}
          aria-label="Previous month"
        >
          ‹
        </button>
        <div style={styles.monthCenter}>
          <p style={styles.monthTitle}>{monthLabel}</p>
          {selectedDate !== today ? (
            <button type="button" style={styles.todayLink} onClick={() => onSelectDate(today)}>
              Today
            </button>
          ) : null}
        </div>
        <button type="button" style={styles.navBtn} onClick={() => shiftMonth(1)} aria-label="Next month">
          ›
        </button>
      </div>

      <div style={styles.legend} aria-hidden>
        <span style={styles.legendItem}>
          <span style={{ ...styles.legendDot, background: "#34C759" }} />
          Ate
        </span>
        <span style={styles.legendItem}>
          <span style={{ ...styles.legendDot, background: "#007AFF" }} />
          Planned
        </span>
      </div>

      <div style={styles.weekHead}>
        {WEEK.map((label, idx) => (
          <span key={`${label}-${idx}`} style={styles.weekLabel}>
            {label}
          </span>
        ))}
      </div>

      <div style={styles.grid}>
        {cells.map((ymd, idx) => {
          if (!ymd) return <span key={`pad-${idx}`} style={styles.pad} />;
          const markers = markerMap.get(ymd);
          const pastCount = Number(markers?.past_count) || 0;
          const futureCount = Number(markers?.future_count) || 0;
          const hasMarkers = pastCount > 0 || futureCount > 0;
          const selected = ymd === selectedDate;
          const isToday = ymd === today;
          const beforeLookback = Boolean(lookbackStart && ymd < lookbackStart);

          const ariaParts = [ymd];
          if (pastCount) ariaParts.push(`${pastCount} ate`);
          if (futureCount) ariaParts.push(`${futureCount} planned`);

          return (
            <button
              key={ymd}
              type="button"
              disabled={beforeLookback || (readOnly && !hasMarkers)}
              onClick={() => onSelectDate(ymd)}
              style={{ ...styles.dayBtn, ...(beforeLookback ? styles.dayBtnDisabled : null) }}
              aria-pressed={selected}
              aria-label={ariaParts.join(", ")}
            >
              <span
                style={{
                  ...styles.dayBubble,
                  ...(selected ? styles.dayBubbleSelected : null),
                  ...(isToday && !selected ? styles.dayBubbleToday : null),
                }}
              >
                {Number(ymd.slice(-2))}
              </span>
              <span style={styles.markerRow}>
                {pastCount > 0 ? <span style={{ ...styles.marker, background: "#34C759" }} /> : null}
                {futureCount > 0 ? <span style={{ ...styles.marker, background: "#007AFF" }} /> : null}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  wrap: {
    margin: "4px 0 0",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', Inter, sans-serif",
  },
  monthRow: {
    display: "grid",
    gridTemplateColumns: "36px 1fr 36px",
    alignItems: "center",
    marginBottom: 12,
  },
  navBtn: {
    appearance: "none",
    border: "none",
    background: "rgba(120,120,128,0.12)",
    borderRadius: "50%",
    width: 32,
    height: 32,
    fontSize: 22,
    lineHeight: 1,
    color: "#3C3C43",
    cursor: "pointer",
    display: "grid",
    placeItems: "center",
  },
  navBtnDisabled: { opacity: 0.35, cursor: "default" },
  dayBtnDisabled: { opacity: 0.35, cursor: "default" },
  monthCenter: { textAlign: "center" },
  monthTitle: {
    margin: 0,
    fontSize: 17,
    fontWeight: 600,
    letterSpacing: "-0.02em",
    color: "#1C1C1E",
  },
  todayLink: {
    appearance: "none",
    border: "none",
    background: "transparent",
    color: "#007AFF",
    fontSize: 13,
    fontWeight: 600,
    marginTop: 2,
    cursor: "pointer",
    padding: 0,
  },
  legend: {
    display: "flex",
    justifyContent: "center",
    gap: 16,
    marginBottom: 10,
    fontSize: 11,
    fontWeight: 600,
    color: "#8E8E93",
    letterSpacing: "0.02em",
    textTransform: "uppercase",
  },
  legendItem: { display: "inline-flex", alignItems: "center", gap: 5 },
  legendDot: { width: 6, height: 6, borderRadius: "50%", display: "inline-block" },
  weekHead: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    marginBottom: 4,
  },
  weekLabel: {
    textAlign: "center",
    fontSize: 11,
    fontWeight: 600,
    color: "#8E8E93",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    rowGap: 2,
  },
  pad: { minHeight: 44 },
  dayBtn: {
    appearance: "none",
    border: "none",
    background: "transparent",
    minHeight: 44,
    padding: "2px 0 0",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 3,
    cursor: "pointer",
    font: "inherit",
  },
  dayBubble: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    display: "grid",
    placeItems: "center",
    fontSize: 15,
    fontWeight: 500,
    color: "#1C1C1E",
    lineHeight: 1,
  },
  dayBubbleSelected: {
    background: "#007AFF",
    color: "#fff",
    fontWeight: 600,
  },
  dayBubbleToday: {
    color: "#007AFF",
    fontWeight: 700,
  },
  markerRow: {
    display: "flex",
    gap: 3,
    minHeight: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  marker: {
    width: 5,
    height: 5,
    borderRadius: "50%",
  },
};
