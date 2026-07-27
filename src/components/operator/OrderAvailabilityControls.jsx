/**
 * Shared pause / temporary-close controls for operator Home + Tablet.
 * Uses existing PATCH /orders/availability (pause_minutes / close_preset / closed_until).
 */
import React, { useEffect, useRef, useState } from "react";

export const PAUSE_DURATION_OPTIONS = [
  { label: "10 min", minutes: 10 },
  { label: "15 min", minutes: 15 },
  { label: "30 min", minutes: 30 },
  { label: "45 min", minutes: 45 },
  { label: "60 min", minutes: 60 },
  { label: "Custom end…", minutes: null, custom: "datetime" },
];

export const CLOSE_DURATION_OPTIONS = [
  { label: "1 hour", minutes: 60 },
  { label: "2 hours", minutes: 120 },
  { label: "4 hours", minutes: 240 },
  { label: "Rest of today", preset: "rest_of_today" },
  { label: "Until tomorrow", preset: "until_tomorrow" },
  { label: "Custom end…", custom: "datetime" },
];

export function formatResumeLabel(iso, timeZone) {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  try {
    return new Intl.DateTimeFormat(undefined, {
      timeZone: timeZone || undefined,
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  } catch {
    return date.toLocaleString();
  }
}

export function describeOperatorAvailability(availability, now = new Date()) {
  const status = String(availability?.order_acceptance_status || "accepting_orders").toLowerCase();
  const operational = availability?.operational || null;
  const timeZone = availability?.timezone || undefined;

  if (status === "paused") {
    const resume = formatResumeLabel(availability?.order_pause_expires_at, timeZone);
    return {
      tone: "paused",
      label: "Orders Paused",
      detail: resume ? `Resumes ${resume}` : availability?.order_acceptance_note || "Paused until you resume",
    };
  }
  if (status === "closed") {
    const resume = formatResumeLabel(availability?.order_closed_expires_at, timeZone);
    return {
      tone: "closed",
      label: "Temporarily Closed",
      detail: resume ? `Reopens ${resume}` : availability?.order_acceptance_note || "Closed until you reopen",
    };
  }
  if (operational?.availability_status === "outside_hours" || operational?.reason_code === "outside_store_hours") {
    const resume = formatResumeLabel(operational?.resume_at || operational?.hours?.next_open_at, timeZone);
    return {
      tone: "hours",
      label: "Closed — Store Hours",
      detail: resume ? `Opens ${resume}` : "Outside configured store hours",
    };
  }
  if (operational?.available === false && operational?.reason_code === "ordering_disabled") {
    return {
      tone: "disabled",
      label: "Ordering Disabled",
      detail: operational?.message || "Online ordering is unavailable",
    };
  }

  const closesHint = operational?.hours?.today_label;
  return {
    tone: "accepting",
    label: "Accepting Orders",
    detail: closesHint ? `Hours today: ${closesHint}` : null,
  };
}

const menuStyle = {
  position: "absolute",
  right: 0,
  top: "calc(100% + 6px)",
  zIndex: 200,
  background: "#fff",
  border: "1px solid #e4e9f0",
  borderRadius: 10,
  boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
  minWidth: 210,
  overflow: "hidden",
};

const itemStyle = {
  display: "block",
  width: "100%",
  padding: "11px 16px",
  background: "none",
  border: "none",
  borderTop: "1px solid #f0f4f8",
  cursor: "pointer",
  textAlign: "left",
  fontFamily: "inherit",
  fontSize: 13,
  fontWeight: 600,
  color: "#0f1720",
};

function DurationMenu({ options, busy, onSelectMinutes, onSelectPreset, onSelectUntil, onClose }) {
  const ref = useRef(null);
  const [customOpen, setCustomOpen] = useState(false);
  const [customValue, setCustomValue] = useState("");

  useEffect(() => {
    function onDoc(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose?.();
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [onClose]);

  return (
    <div ref={ref} style={menuStyle}>
      {options.map((opt) => (
        <button
          key={opt.label}
          type="button"
          disabled={busy}
          style={itemStyle}
          onClick={() => {
            if (opt.custom === "datetime") {
              setCustomOpen(true);
              return;
            }
            if (opt.preset) onSelectPreset?.(opt.preset);
            else if (opt.minutes != null) onSelectMinutes?.(opt.minutes);
          }}
        >
          {opt.label}
          {opt.custom === "datetime" && customOpen && (
            <div style={{ marginTop: 8 }} onClick={(e) => e.stopPropagation()}>
              <input
                type="datetime-local"
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  borderRadius: 6,
                  border: "1px solid #e4e9f0",
                  fontSize: 12,
                  fontFamily: "inherit",
                }}
              />
              <button
                type="button"
                disabled={!customValue || busy}
                onClick={() => {
                  const local = new Date(customValue);
                  if (!Number.isNaN(local.getTime())) onSelectUntil?.(local.toISOString());
                }}
                style={{
                  marginTop: 6,
                  width: "100%",
                  padding: "6px 10px",
                  borderRadius: 6,
                  border: "none",
                  background: "#1F4E3D",
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Confirm
              </button>
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

/**
 * Compact control row: Resume (when paused/closed) + Pause + Close dropdowns.
 */
export default function OrderAvailabilityControls({
  availability,
  busy = false,
  onPause,
  onCloseStore,
  onResume,
  hoursHref = "/operator/hours",
  navigate,
  compact = false,
}) {
  const [pauseOpen, setPauseOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const desc = describeOperatorAvailability(availability);
  const status = String(availability?.order_acceptance_status || "accepting_orders").toLowerCase();
  const isBlocked = status === "paused" || status === "closed";
  const isOutsideHours = desc.tone === "hours";

  const toneStyles = {
    accepting: { bg: "#ecfdf3", border: "#86efac", color: "#166534", dot: "#22c55e" },
    paused: { bg: "#fffbeb", border: "#fcd34d", color: "#92400e", dot: "#f59e0b" },
    closed: { bg: "#fef2f2", border: "#fecaca", color: "#b91c1c", dot: "#ef4444" },
    hours: { bg: "#f8fafc", border: "#cbd5e1", color: "#334155", dot: "#64748b" },
    disabled: { bg: "#f1f5f9", border: "#cbd5e1", color: "#475569", dot: "#94a3b8" },
  }[desc.tone] || { bg: "#ecfdf3", border: "#86efac", color: "#166534", dot: "#22c55e" };

  const ghostBtn = {
    padding: compact ? "8px 12px" : "8px 14px",
    fontSize: 13,
    fontWeight: 700,
    borderRadius: 8,
    border: "1.5px solid #e4e9f0",
    background: "#fff",
    color: "#0f1720",
    cursor: "pointer",
    fontFamily: "inherit",
  };
  const primaryBtn = {
    ...ghostBtn,
    border: "none",
    background: "#1F4E3D",
    color: "#fff",
  };

  return (
    <div
      style={{
        background: toneStyles.bg,
        border: `1px solid ${toneStyles.border}`,
        borderRadius: 14,
        padding: compact ? "12px 14px" : "16px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
        <span
          style={{
            width: 11,
            height: 11,
            borderRadius: "50%",
            background: toneStyles.dot,
            display: "inline-block",
            flexShrink: 0,
          }}
        />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: toneStyles.color }}>{desc.label}</div>
          {desc.detail && (
            <div style={{ fontSize: 12, color: toneStyles.color, opacity: 0.85, marginTop: 2 }}>
              {desc.detail}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        {(isBlocked || isOutsideHours) && (
          <button type="button" disabled={busy || isOutsideHours} onClick={onResume} style={primaryBtn}>
            {busy ? "…" : isOutsideHours ? "Opens on schedule" : status === "closed" ? "Reopen" : "Resume Orders"}
          </button>
        )}

        {!isBlocked && (
          <>
            <div style={{ position: "relative" }}>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setPauseOpen((v) => !v);
                  setCloseOpen(false);
                }}
                style={ghostBtn}
              >
                Pause ▾
              </button>
              {pauseOpen && (
                <DurationMenu
                  options={PAUSE_DURATION_OPTIONS}
                  busy={busy}
                  onClose={() => setPauseOpen(false)}
                  onSelectMinutes={(minutes) => {
                    setPauseOpen(false);
                    onPause?.({ pause_minutes: minutes });
                  }}
                  onSelectUntil={(iso) => {
                    setPauseOpen(false);
                    onPause?.({ pause_until: iso });
                  }}
                />
              )}
            </div>

            <div style={{ position: "relative" }}>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setCloseOpen((v) => !v);
                  setPauseOpen(false);
                }}
                style={ghostBtn}
              >
                Close ▾
              </button>
              {closeOpen && (
                <DurationMenu
                  options={CLOSE_DURATION_OPTIONS}
                  busy={busy}
                  onClose={() => setCloseOpen(false)}
                  onSelectMinutes={(minutes) => {
                    setCloseOpen(false);
                    onCloseStore?.({ close_minutes: minutes });
                  }}
                  onSelectPreset={(preset) => {
                    setCloseOpen(false);
                    onCloseStore?.({ close_preset: preset });
                  }}
                  onSelectUntil={(iso) => {
                    setCloseOpen(false);
                    onCloseStore?.({ closed_until: iso });
                  }}
                />
              )}
            </div>
          </>
        )}

        {typeof navigate === "function" && (
          <button type="button" style={ghostBtn} onClick={() => navigate(hoursHref)}>
            Store Hours
          </button>
        )}
      </div>
    </div>
  );
}
