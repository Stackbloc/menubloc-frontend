/**
 * Prominent Current Vibe control on the diner profile (under Favorite foods).
 * Default Open for suggestions is search-eligible with Connects.
 * I'm Good is the explicit opt-out (search-invisible for suggestions/invites).
 */

import { useEffect, useState } from "react";
import {
  DEFAULT_CURRENT_VIBE,
  OPT_OUT_CURRENT_VIBE,
  getCurrentVibeEntry,
  resolveCurrentVibeCatalog,
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

export default function CurrentVibeProfileSection({
  value = DEFAULT_CURRENT_VIBE,
  catalog = null,
  readOnly = false,
  busy = false,
  onChange = null,
  testIdPrefix = "current-vibe-profile",
}) {
  const [optimistic, setOptimistic] = useState(null);
  const [error, setError] = useState("");

  const entries = resolveCurrentVibeCatalog(catalog);
  const effective = optimistic != null ? optimistic : value;
  const entry = getCurrentVibeEntry(effective, entries);
  const activeValue = entry?.value || DEFAULT_CURRENT_VIBE;

  useEffect(() => {
    setOptimistic(null);
  }, [value]);

  async function selectValue(nextRaw) {
    if (busy || readOnly || typeof onChange !== "function") return;
    const next = String(nextRaw || DEFAULT_CURRENT_VIBE);
    // Re-tap active default → I'm Good (opt out of search suggestions).
    // Re-tap any other active vibe → back to Open for suggestions.
    const resolved =
      next === activeValue
        ? activeValue === DEFAULT_CURRENT_VIBE
          ? OPT_OUT_CURRENT_VIBE
          : DEFAULT_CURRENT_VIBE
        : next;
    const prev = activeValue;
    setError("");
    setOptimistic(resolved);
    try {
      await onChange(resolved);
    } catch (err) {
      setOptimistic(prev);
      setError(err?.message || "Could not update vibe");
    }
  }

  // Connect peers: hide only when opted out (I'm Good).
  if (readOnly && activeValue === OPT_OUT_CURRENT_VIBE) {
    return null;
  }

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
        Current vibe
      </p>
      {readOnly ? (
        <p
          style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#14532d" }}
          data-testid={`${testIdPrefix}-readonly`}
        >
          {entry?.icon ? <span aria-hidden>{entry.icon} </span> : null}
          {entry?.label || "I'm good"}
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
              const active = activeValue === opt.value;
              const isOptOut = opt.value === OPT_OUT_CURRENT_VIBE;
              return (
                <button
                  key={opt.value}
                  type="button"
                  data-testid={`${testIdPrefix}-chip-${opt.value}`}
                  disabled={busy}
                  aria-pressed={active}
                  onClick={() => selectValue(opt.value)}
                  style={{
                    ...chipBase,
                    border: active
                      ? isOptOut
                        ? "2px solid #64748b"
                        : "2px solid #166534"
                      : "1px solid #d1d5db",
                    background: active
                      ? isOptOut
                        ? "#f8fafc"
                        : opt.badgeTone === "muted"
                          ? "#f1f5f9"
                          : "#ecfdf3"
                      : "#fff",
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
          <p
            style={{ margin: "10px 0 0", fontSize: 12, color: "#64748b", lineHeight: 1.4 }}
            data-testid={`${testIdPrefix}-hint`}
          >
            Default is Open for suggestions — Connects can see you in search when it fits.
            Tap I&apos;m good to stay out of suggestion and invitation surfaces. This is not a
            post.
          </p>
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
