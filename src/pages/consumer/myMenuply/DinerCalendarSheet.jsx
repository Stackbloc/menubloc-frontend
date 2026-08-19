/**
 * Tap-to-open Eating calendar sheet — Apple-inspired presentation.
 */

import { useEffect } from "react";
import { createPortal } from "react-dom";
import EatingHubCalendar from "./EatingHubCalendar.jsx";
import { formatPlanBracketDate, ymdInMonth } from "./dinerHubFormat.js";

function formatChipDate(ymd) {
  const raw = String(ymd || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return "Calendar";
  const d = new Date(`${raw}T12:00:00`);
  if (Number.isNaN(d.getTime())) return "Calendar";
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function CalendarGlyph() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden fill="none">
      <rect x="3" y="5" width="18" height="16" rx="4" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 3v4M16 3v4M3 10h18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function DinerCalendarTrigger({ selectedDate, onOpen }) {
  return (
    <button
      type="button"
      data-testid="diner-calendar-open"
      aria-label={`Open eating calendar, ${formatChipDate(selectedDate)}`}
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
  dayMarkers = [],
  testId = "eating-calendar",
  title = "Eating",
  events = [],
  onSelectEvent,
  readOnly = false,
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

  const monthEvents = (events || []).filter((event) => ymdInMonth(event.ymd, viewMonth));

  return createPortal(
    <div
      role="presentation"
      data-testid="diner-calendar-sheet"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      style={styles.backdrop}
    >
      <div role="dialog" aria-modal="true" aria-label={title} style={styles.sheet}>
        <div style={styles.grabber} aria-hidden />
        <div style={styles.head}>
          <p style={styles.title}>{title}</p>
          <button type="button" onClick={onClose} aria-label="Close calendar" style={styles.close}>
            Done
          </button>
        </div>
        <EatingHubCalendar
          testId={`${testId}-grid`}
          selectedDate={selectedDate}
          onSelectDate={(ymd) => {
            onSelectDate(ymd);
            const dayEvents = (events || []).filter((event) => event.ymd === ymd);
            if (dayEvents.length === 1) {
              onSelectEvent?.(dayEvents[0]);
              onClose();
            } else if (dayEvents.length === 0) {
              onClose();
            }
          }}
          viewMonth={viewMonth}
          onViewMonthChange={onViewMonthChange}
          dayMarkers={dayMarkers}
          readOnly={readOnly}
        />
        {monthEvents.length > 0 ? (
          <div data-testid="calendar-events" style={styles.events}>
            <p style={styles.eventsLabel}>Plans this month</p>
            {monthEvents.map((event) => {
              const onDay = event.ymd === selectedDate;
              return (
                <button
                  key={event.key}
                  type="button"
                  data-testid="calendar-event"
                  onClick={() => {
                    onSelectEvent?.(event);
                    onClose();
                  }}
                  style={{
                    ...styles.eventBtn,
                    ...(onDay ? styles.eventBtnOnDay : null),
                  }}
                >
                  <span style={styles.eventDot} aria-hidden />
                  {event.label}
                  <span style={styles.eventDate}>{formatPlanBracketDate(event.ymd)}</span>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>,
    document.body
  );
}

const styles = {
  trigger: {
    appearance: "none",
    border: "1px solid rgba(60,60,67,0.18)",
    background: "rgba(120,120,128,0.08)",
    color: "#007AFF",
    borderRadius: 999,
    minHeight: 34,
    padding: "0 12px",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    font: "inherit",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    flexShrink: 0,
  },
  backdrop: {
    position: "fixed",
    inset: 0,
    zIndex: 400,
    background: "rgba(0,0,0,0.35)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px 16px calc(var(--bottom-nav-h, 72px) + 16px)",
  },
  sheet: {
    width: "min(390px, 100%)",
    background: "rgba(255,255,255,0.98)",
    borderRadius: 20,
    boxShadow: "0 24px 80px rgba(0,0,0,0.28)",
    padding: "8px 16px 16px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', Inter, sans-serif",
  },
  grabber: {
    width: 36,
    height: 5,
    borderRadius: 999,
    background: "rgba(60,60,67,0.22)",
    margin: "6px auto 10px",
  },
  head: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 4,
  },
  title: { margin: 0, fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", color: "#1C1C1E" },
  close: {
    border: 0,
    background: "transparent",
    color: "#007AFF",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: 17,
    padding: "4px 0",
  },
  events: {
    display: "grid",
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTop: "1px solid rgba(60,60,67,0.12)",
    maxHeight: 180,
    overflowY: "auto",
  },
  eventsLabel: {
    margin: "0 0 4px",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    color: "#8E8E93",
  },
  eventBtn: {
    appearance: "none",
    width: "100%",
    textAlign: "left",
    border: "none",
    background: "rgba(120,120,128,0.08)",
    borderRadius: 12,
    padding: "10px 12px",
    font: "inherit",
    fontWeight: 600,
    fontSize: 14,
    color: "#1C1C1E",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  eventBtnOnDay: {
    background: "rgba(0,122,255,0.12)",
    boxShadow: "inset 0 0 0 1px rgba(0,122,255,0.35)",
  },
  eventDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "#007AFF",
    flexShrink: 0,
  },
  eventDate: {
    marginLeft: "auto",
    fontSize: 12,
    fontWeight: 500,
    color: "#8E8E93",
  },
};
