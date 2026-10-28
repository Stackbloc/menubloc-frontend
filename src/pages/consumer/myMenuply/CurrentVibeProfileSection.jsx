/**
 * Current Vibe on the diner profile (Andre 2026-10-28, menuply-mobile docs/16): Not sure today
 * (every day starts here) · Open for lunch · Open for coffee · Open for dinner · Hungry ·
 * Eating @home · Me time (not available). Pick several, except Not sure today / Me time; For:
 * Today · Hours · Days · All week. Each tap saves. Lunch, coffee, dinner and hungry show to Connects.
 */

import { useEffect, useState } from "react";
import {
  DEFAULT_CURRENT_VIBE,
  OPT_OUT_CURRENT_VIBE,
  resolveCurrentVibeCatalog,
  toggleVibeSet,
  coerceCurrentVibe,
} from "../../../lib/currentVibeDisplay.js";

const labelStyle = {
  margin: "0 0 8px",
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  color: "#166534",
};

const chipBase = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  borderRadius: 999,
  padding: "9px 14px",
  fontSize: 14,
  fontWeight: 650,
  cursor: "pointer",
  lineHeight: 1.2,
};

const SPANS = [
  ["today", "Today"],
  ["hours", "Hours"],
  ["days", "Days"],
  ["week", "All week"],
];
const COUNTS = { hours: [1, 2, 3, 4, 6, 8, 12], days: [1, 2, 3, 4, 5, 6, 7] };
const untilOf = (span, n) => (span === "hours" ? { hours: n } : span === "days" ? { days: n } : span);

export default function CurrentVibeProfileSection({
  value = DEFAULT_CURRENT_VIBE,
  values = null,
  expiresAt = null,
  catalog = null,
  readOnly = false,
  busy = false,
  onChange = null,
  searchVibeAudience = "connects",
  onSearchVibeAudienceChange = null,
  testIdPrefix = "current-vibe-profile",
}) {
  const [optimistic, setOptimistic] = useState(null);
  const [error, setError] = useState("");
  const [span, setSpan] = useState("today");
  const [count, setCount] = useState(3);

  const entries = resolveCurrentVibeCatalog(catalog);
  const saved = Array.isArray(values) && values.length ? values.map(coerceCurrentVibe) : [coerceCurrentVibe(value)];
  const active = optimistic || saved;
  const unset = active.length === 1 && active[0] === DEFAULT_CURRENT_VIBE;

  useEffect(() => {
    setOptimistic(null);
  }, [value, values]);

  async function save(next, nextSpan = span, nextCount = count) {
    if (busy || readOnly || typeof onChange !== "function") return;
    const prev = active;
    setError("");
    setOptimistic(next);
    try {
      await onChange({ vibes: next, until: untilOf(nextSpan, nextCount) });
    } catch (err) {
      setOptimistic(prev);
      setError(err?.message || "Could not update vibe");
    }
  }

  function changeSpan(nextSpan, nextCount) {
    setSpan(nextSpan);
    setCount(nextCount);
    if (!unset) save(active, nextSpan, nextCount);
  }

  // Connect peers: nothing to show on Not sure today or Me time.
  if (readOnly && (unset || active[0] === OPT_OUT_CURRENT_VIBE)) {
    return null;
  }

  const labels = active.map((v) => entries.find((e) => e.value === v)).filter(Boolean);
  const until =
    !unset && expiresAt
      ? new Date(new Date(expiresAt).getTime() - 1000).toLocaleString("en-US", { weekday: "short", hour: "numeric", minute: "2-digit" })
      : null;

  return (
    <div
      style={{
        marginTop: 16,
        padding: "14px 14px 12px",
        borderRadius: 14,
        background: "#f0fdf4",
        border: "1px solid #bbf7d0",
      }}
      data-testid={testIdPrefix}
    >
      <p style={labelStyle} data-testid={`${testIdPrefix}-label`}>
        {unset && !readOnly ? "What’s your vibe today?" : "Current vibe"}
      </p>
      {readOnly ? (
        <p
          style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#14532d" }}
          data-testid={`${testIdPrefix}-readonly`}
        >
          {labels.map((e) => `${e.icon ? `${e.icon} ` : ""}${e.label}`).join(" · ")}
        </p>
      ) : (
        <>
          <div
            style={{ display: "flex", flexWrap: "wrap", gap: 8 }}
            data-testid={`${testIdPrefix}-chip-grid`}
            role="group"
            aria-label="Current vibe"
          >
            {entries.map((opt) => {
              const on = active.includes(opt.value);
              const isOptOut = opt.value === OPT_OUT_CURRENT_VIBE;
              return (
                <button
                  key={opt.value}
                  type="button"
                  data-testid={`${testIdPrefix}-chip-${opt.value}`}
                  title={opt.label}
                  disabled={busy}
                  aria-pressed={on}
                  onClick={() => save(toggleVibeSet(active, opt.value, entries))}
                  style={{
                    ...chipBase,
                    border: on ? (isOptOut ? "2px solid #64748b" : "2px solid #166534") : "1px solid #d1d5db",
                    background: on ? (isOptOut ? "#f8fafc" : "#ecfdf3") : "#fff",
                    color: "#0f172a",
                    cursor: busy ? "default" : "pointer",
                    opacity: busy ? 0.7 : 1,
                  }}
                >
                  {opt.icon ? <span aria-hidden>{opt.icon}</span> : null}
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", marginTop: 10 }} data-testid={`${testIdPrefix}-for`}>
            <span style={{ fontSize: 12, fontWeight: 800, color: "#475569" }}>For</span>
            {SPANS.map(([id, label]) => (
              <button
                key={id}
                type="button"
                aria-pressed={span === id}
                disabled={busy}
                onClick={() => changeSpan(id, id === "hours" ? 3 : id === "days" ? 2 : count)}
                data-testid={`${testIdPrefix}-for-${id}`}
                style={{ ...chipBase, padding: "5px 11px", fontSize: 13, border: span === id ? "2px solid #166534" : "1px solid #d1d5db", background: span === id ? "#ecfdf3" : "#fff" }}
              >
                {label}
              </button>
            ))}
          </div>
          {span === "hours" || span === "days" ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
              {COUNTS[span].map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-pressed={count === n}
                  disabled={busy}
                  onClick={() => changeSpan(span, n)}
                  data-testid={`${testIdPrefix}-for-${span}-${n}`}
                  style={{ ...chipBase, padding: "4px 10px", fontSize: 12, border: count === n ? "2px solid #166534" : "1px solid #d1d5db", background: count === n ? "#ecfdf3" : "#fff" }}
                >
                  {`${n} ${span === "hours" ? (n === 1 ? "hour" : "hours") : n === 1 ? "day" : "days"}`}
                </button>
              ))}
            </div>
          ) : null}
          {until ? (
            <p style={{ margin: "8px 0 0", fontSize: 13, fontWeight: 700, color: "#166534" }} data-testid={`${testIdPrefix}-until`}>
              Set until {until}
            </p>
          ) : null}
          <p
            style={{ margin: "10px 0 0", fontSize: 12, color: "#64748b", lineHeight: 1.4 }}
            data-testid={`${testIdPrefix}-hint`}
          >
            Pick what you&apos;re up for — several at once — and your Connects can invite you. Lunch
            shows 10:30 AM–3 PM and dinner 4–10 PM. Me time keeps you out of it. This is not a post.
          </p>
          {typeof onSearchVibeAudienceChange === "function" ? (
            <label
              style={{ display: "flex", gap: 8, alignItems: "flex-start", margin: "10px 0 0", fontSize: 13, color: "#334155", lineHeight: 1.4 }}
              data-testid={`${testIdPrefix}-search-audience`}
            >
              <input
                type="checkbox"
                checked={searchVibeAudience === "connects_of_connects"}
                disabled={busy}
                onChange={async (e) => {
                  setError("");
                  try {
                    await onSearchVibeAudienceChange(e.target.checked ? "connects_of_connects" : "connects");
                  } catch (err) {
                    setError(err?.message || "Could not update setting");
                  }
                }}
                data-testid={`${testIdPrefix}-search-audience-input`}
              />
              <span>
                Also show my vibe to Connects of my Connects in search (first name and initial only)
              </span>
            </label>
          ) : null}
        </>
      )}
      {error ? (
        <p style={{ margin: "8px 0 0", fontSize: 13, color: "#b42318" }} data-testid={`${testIdPrefix}-error`}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
