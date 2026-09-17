/**
 * Current Vibe avatar badge + compact single-tap picker.
 * im_good = no emoji badge (Connect peers see nothing); owner gets a muted "+"
 * status-dot so Current Vibe is discoverable. Re-tap active chip → im_good.
 */

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  DEFAULT_CURRENT_VIBE,
  badgeToneStyles,
  getCurrentVibeEntry,
  resolveCurrentVibeCatalog,
  showsCurrentVibeBadge,
} from "../../../lib/currentVibeDisplay.js";

const badgeBtnBase = {
  position: "absolute",
  right: -2,
  bottom: -2,
  width: 30,
  height: 30,
  borderRadius: "50%",
  padding: 0,
  display: "grid",
  placeItems: "center",
  fontSize: 15,
  lineHeight: 1,
  cursor: "pointer",
  zIndex: 2,
};

export default function CurrentVibeAvatarControl({
  value = DEFAULT_CURRENT_VIBE,
  catalog = null,
  readOnly = false,
  busy = false,
  onChange,
  testIdPrefix = "current-vibe",
}) {
  const [open, setOpen] = useState(false);
  const [optimistic, setOptimistic] = useState(null);
  const [error, setError] = useState("");

  const effective = optimistic != null ? optimistic : value;
  const entries = resolveCurrentVibeCatalog(catalog);
  const entry = getCurrentVibeEntry(effective, entries);
  const showBadge = showsCurrentVibeBadge(effective);

  useEffect(() => {
    setOptimistic(null);
  }, [value]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function selectValue(nextRaw) {
    if (busy || readOnly || typeof onChange !== "function") return;
    const next =
      nextRaw === coerceOrSame(effective) ? DEFAULT_CURRENT_VIBE : String(nextRaw || DEFAULT_CURRENT_VIBE);
    const prev = coerceOrSame(effective);
    setError("");
    setOptimistic(next);
    setOpen(false);
    try {
      await onChange(next);
    } catch (err) {
      setOptimistic(prev);
      setError(err?.message || "Could not update vibe");
    }
  }

  function coerceOrSame(v) {
    return getCurrentVibeEntry(v, entries)?.value || DEFAULT_CURRENT_VIBE;
  }

  const picker = open
    ? createPortal(
        <div
          data-testid={`${testIdPrefix}-picker`}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 12000,
            background: "rgba(15, 23, 42, 0.45)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
          }}
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-label="Current vibe"
            style={{
              width: "100%",
              maxWidth: 480,
              maxHeight: "70vh",
              overflow: "auto",
              background: "#fff",
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              padding: "16px 16px calc(16px + env(safe-area-inset-bottom, 0px))",
              boxShadow: "0 -8px 28px rgba(15, 23, 42, 0.18)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <p
              style={{
                margin: "0 0 12px",
                fontSize: 15,
                fontWeight: 800,
                color: "#0f172a",
              }}
            >
              Current vibe
            </p>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
              }}
              data-testid={`${testIdPrefix}-chip-grid`}
            >
              {entries.map((opt) => {
                const active = coerceOrSame(effective) === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    data-testid={`${testIdPrefix}-chip-${opt.value}`}
                    disabled={busy}
                    aria-pressed={active}
                    onClick={() => selectValue(opt.value)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      borderRadius: 999,
                      padding: "8px 12px",
                      border: active ? "2px solid #166534" : "1px solid #e2e8f0",
                      background: active
                        ? opt.badgeTone === "muted"
                          ? "#f1f5f9"
                          : "#ecfdf3"
                        : "#fff",
                      color: "#0f172a",
                      fontSize: 13,
                      fontWeight: 650,
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
            <p style={{ margin: "12px 0 0", fontSize: 12, color: "#64748b" }}>
              Tap again to clear back to I&apos;m good. This is not a post.
            </p>
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <button
        type="button"
        data-testid={`${testIdPrefix}-badge`}
        data-vibe={coerceOrSame(effective)}
        aria-label={
          readOnly
            ? entry?.label
              ? `Current vibe: ${entry.label}`
              : "Current vibe"
            : showBadge
              ? `Change current vibe (${entry?.label || ""})`
              : "Set current vibe"
        }
        disabled={busy || (readOnly && !showBadge)}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          if (readOnly || busy) return;
          setOpen(true);
        }}
        style={{
          ...badgeBtnBase,
          ...(showBadge
            ? badgeToneStyles(entry?.badgeTone)
            : readOnly
              ? {
                  background: "transparent",
                  border: "none",
                  boxShadow: "none",
                  opacity: 0,
                  pointerEvents: "none",
                }
              : {
                  // Owner + im_good: muted "+" status-dot so Current Vibe is findable.
                  // Not a vibe value — absence of an emoji badge still means neutral.
                  background: "#f8fafc",
                  border: "2px dashed #94a3b8",
                  boxShadow: "0 1px 4px rgba(15, 23, 42, 0.12)",
                  color: "#64748b",
                  fontSize: 18,
                  fontWeight: 700,
                  opacity: 1,
                }),
          cursor: readOnly || busy ? "default" : "pointer",
          pointerEvents: readOnly && !showBadge ? "none" : "auto",
        }}
      >
        {showBadge ? (
          <span aria-hidden>{entry?.icon || ""}</span>
        ) : readOnly ? null : (
          <span aria-hidden data-testid={`${testIdPrefix}-set-affordance`}>
            +
          </span>
        )}
      </button>
      {error ? (
        <span data-testid={`${testIdPrefix}-error`} style={{ display: "none" }}>
          {error}
        </span>
      ) : null}
      {picker}
    </>
  );
}
