import React from "react";
import {
  DEAL_HOUR_PRESETS,
  DEAL_WEEKDAYS,
  dealCopyMissingSchedule,
  formatDealSchedule,
  normalizeDealDays,
} from "../../lib/dealSchedule.js";

/**
 * Days of week + time of day for a deal (Andre 2026-11-04). Shared by Operator → Deals and
 * Restaurant Manager → Deals. Value: { days: number[], start: "HH:MM"|"", end: "HH:MM"|"" }.
 * Empty days = every day; empty start/end = all day.
 */

const DEFAULT_COLORS = { ink: "#111827", muted: "#6b7280", line: "#d1d5db", accent: "#0f766e", accentSoft: "#ecfdf5" };

function pill(active, colors, disabled) {
  return {
    padding: "6px 12px",
    borderRadius: 999,
    border: `1.5px solid ${active ? colors.accent : colors.line}`,
    background: active ? colors.accentSoft : "#fff",
    color: colors.ink,
    fontWeight: 600,
    fontSize: 13,
    cursor: disabled ? "not-allowed" : "pointer",
    minWidth: 40,
  };
}

export default function DealScheduleFields({ value, onChange, disabled = false, colors: colorsProp = null }) {
  const colors = { ...DEFAULT_COLORS, ...(colorsProp || {}) };
  const days = normalizeDealDays(value?.days);
  const start = value?.start || "";
  const end = value?.end || "";
  const hasHours = Boolean(start || end);
  const set = (patch) => onChange({ days, start, end, ...patch });

  function toggleDay(id) {
    const chosen = new Set(days);
    if (chosen.has(id)) chosen.delete(id);
    else chosen.add(id);
    set({ days: normalizeDealDays([...chosen]) });
  }

  const summary = formatDealSchedule({ days, start, end });
  const timeInput = {
    padding: "7px 10px",
    borderRadius: 8,
    border: `1px solid ${colors.line}`,
    fontSize: 14,
  };

  return (
    <div style={{ display: "grid", gap: 10 }} data-testid="deal-schedule-fields">
      <div style={{ display: "grid", gap: 6 }}>
        <span style={{ fontWeight: 700, fontSize: 13 }}>Days</span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }} role="group" aria-label="Days this deal runs">
          <button
            type="button"
            disabled={disabled}
            onClick={() => set({ days: [] })}
            style={pill(days.length === 0, colors, disabled)}
            aria-pressed={days.length === 0}
            data-testid="deal-schedule-every-day"
          >
            Every day
          </button>
          {DEAL_WEEKDAYS.map((d) => (
            <button
              key={d.id}
              type="button"
              disabled={disabled}
              onClick={() => toggleDay(d.id)}
              style={pill(days.includes(d.id), colors, disabled)}
              aria-pressed={days.includes(d.id)}
              data-testid={`deal-schedule-day-${d.id}`}
            >
              {d.short}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gap: 6 }}>
        <span style={{ fontWeight: 700, fontSize: 13 }}>Time of day</span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }} role="group" aria-label="Time of day">
          <button
            type="button"
            disabled={disabled}
            onClick={() => set({ start: "", end: "" })}
            style={pill(!hasHours, colors, disabled)}
            aria-pressed={!hasHours}
            data-testid="deal-schedule-all-day"
          >
            All day
          </button>
          {DEAL_HOUR_PRESETS.map((p) => {
            const active = start === p.start && end === p.end;
            return (
              <button
                key={p.id}
                type="button"
                disabled={disabled}
                onClick={() => set({ start: p.start, end: p.end })}
                style={pill(active, colors, disabled)}
                aria-pressed={active}
                data-testid={`deal-schedule-preset-${p.id}`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          <label style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 13 }}>
            From
            <input
              type="time"
              value={start}
              step={900}
              onChange={(e) => set({ start: e.target.value, end: end || "" })}
              style={timeInput}
              disabled={disabled}
              data-testid="deal-schedule-start"
            />
          </label>
          <label style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 13 }}>
            to
            <input
              type="time"
              value={end}
              step={900}
              onChange={(e) => set({ end: e.target.value })}
              style={timeInput}
              disabled={disabled}
              data-testid="deal-schedule-end"
            />
          </label>
        </div>
      </div>

      <span style={{ fontSize: 12, color: colors.muted }} data-testid="deal-schedule-summary">
        {summary
          ? `Runs ${summary}, between the start and end dates. The deal price only applies at these times.`
          : "Runs every day, all day, between the start and end dates."}
      </span>
    </div>
  );
}

/**
 * Terms copy helper under the description (Andre 2026-11-04): shows the terms line built from
 * the owner's choices. Empty description → it is used as the description on save. Own copy that
 * doesn't say the days/hours → a reminder with an "Add terms" button.
 */
export function DealTermsHelper({ description, termsText, schedule, onAdd, disabled = false, colors: colorsProp = null }) {
  const colors = { ...DEFAULT_COLORS, ...(colorsProp || {}) };
  if (!termsText) return null;
  const empty = !String(description || "").trim();
  const missing = dealCopyMissingSchedule(description, schedule);
  const alreadyIn = String(description || "").includes(termsText);
  const needsReminder = !empty && !alreadyIn && (missing.days || missing.hours);
  const what = [missing.days ? "days" : null, missing.hours ? "hours" : null].filter(Boolean).join(" and ");

  return (
    <div
      style={{
        display: "grid",
        gap: 6,
        padding: "8px 10px",
        borderRadius: 8,
        fontSize: 12,
        background: needsReminder ? "#fffbeb" : "#f8fafc",
        border: `1px solid ${needsReminder ? "#fcd34d" : colors.line}`,
      }}
      data-testid="deal-terms-helper"
    >
      {needsReminder ? (
        <strong style={{ color: "#92400e" }} data-testid="deal-terms-reminder">
          Your description doesn't say the {what} this deal runs. Diners should see the terms.
        </strong>
      ) : null}
      <span style={{ color: colors.ink }}>
        <span style={{ color: colors.muted }}>Terms: </span>
        <span data-testid="deal-terms-text">{termsText}</span>
      </span>
      {empty ? (
        <span style={{ color: colors.muted }}>Added as the description when you save, unless you write your own.</span>
      ) : alreadyIn ? null : (
        <button
          type="button"
          disabled={disabled}
          onClick={onAdd}
          style={{
            justifySelf: "start",
            padding: "5px 12px",
            borderRadius: 999,
            border: `1px solid ${colors.accent}`,
            background: "#fff",
            color: colors.accent,
            fontWeight: 700,
            fontSize: 12,
            cursor: "pointer",
          }}
          data-testid="deal-terms-add"
        >
          Add terms to description
        </button>
      )}
    </div>
  );
}
