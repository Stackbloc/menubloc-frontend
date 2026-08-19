/**
 * Compact diner-hub calendar: a side icon that opens the month grid.
 * Full month stays off the photo feed until tapped.
 */

import { useEffect } from "react";
import { createPortal } from "react-dom";
import WhatIAteTodayCalendar from "../../../components/consumer/WhatIAteTodayCalendar.jsx";

function formatChipDate(ymd) {
  const raw = String(ymd || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return "Date";
  const d = new Date(`${raw}T12:00:00`);
  if (Number.isNaN(d.getTime())) return "Date";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function CalendarGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden fill="none">
      <rect x="3" y="5" width="18" height="16" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 3v4M16 3v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function DinerCalendarTrigger({ selectedDate, onOpen }) {
  return (
    <button
      type="button"
      data-testid="diner-calendar-open"
      aria-label={`Open calendar, ${formatChipDate(selectedDate)}`}
      onClick={onOpen}
      style={styles.trigger}
    >
      <CalendarGlyph />
      <span>{formatChipDate(selectedDate)}</span>
    </button>
  );
}

export default function DinerCalendarSheet({
  open,
  onClose,
  selectedDate,
  onSelectDate,
  viewMonth,
  onViewMonthChange,
  dayCounts,
  testId = "eating-plans-calendar",
  minYmd = null,
  maxYmd = null,
}) {
  useEffect(() => {
    if (!open) return undefined;
    function onKey(event) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      role="presentation"
      data-testid="diner-calendar-sheet"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      style={styles.backdrop}
    >
      <div role="dialog" aria-modal="true" aria-label="Calendar" style={styles.sheet}>
        <div style={styles.head}>
          <p style={styles.title}>Pick a day</p>
          <button type="button" onClick={onClose} aria-label="Close calendar" style={styles.close}>
            Close
          </button>
        </div>
        <WhatIAteTodayCalendar
          testId={testId}
          selectedDate={selectedDate}
          onSelectDate={(ymd) => {
            onSelectDate(ymd);
            onClose();
          }}
          viewMonth={viewMonth}
          onViewMonthChange={onViewMonthChange}
          dayCounts={dayCounts}
          minYmd={minYmd}
          maxYmd={maxYmd}
        />
      </div>
    </div>,
    document.body
  );
}

const styles = {
  trigger: {
    appearance: "none",
    border: "1px solid #86efac",
    background: "#dcfce7",
    color: "#14532d",
    borderRadius: 999,
    minHeight: 32,
    padding: "0 10px",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    font: "inherit",
    fontSize: 12,
    fontWeight: 800,
    cursor: "pointer",
    flexShrink: 0,
  },
  backdrop: {
    position: "fixed",
    inset: 0,
    zIndex: 400,
    background: "rgba(15,23,42,0.45)",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    padding: "16px 12px calc(var(--bottom-nav-h, 72px) + 12px)",
  },
  sheet: {
    width: "min(420px, 100%)",
    background: "#fff",
    borderRadius: 18,
    boxShadow: "0 18px 50px rgba(0,0,0,0.22)",
    padding: "14px 14px 8px",
    fontFamily: "Inter, Arial, sans-serif",
  },
  head: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 8,
  },
  title: { margin: 0, fontSize: 16, fontWeight: 900, color: "#0B0F0C" },
  close: {
    border: 0,
    background: "transparent",
    color: "#667085",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 13,
  },
};
