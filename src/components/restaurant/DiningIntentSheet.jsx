/**
 * Create / edit explicit restaurant dining intent (I want to go).
 */

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { captureEvent } from "../../services/posthog.js";
import {
  createRestaurantDiningIntent,
  removeRestaurantDiningIntent,
} from "../../lib/consumerApi.js";

const INTENT_OPTIONS = [
  { id: "want_to_go", label: "Want to go" },
  { id: "planning_to_go", label: "Planning to go" },
  { id: "looking_for_company", label: "Looking for company" },
];

const TIME_WINDOWS = [
  { id: "", label: "Any time" },
  { id: "morning", label: "Morning" },
  { id: "afternoon", label: "Afternoon" },
  { id: "evening", label: "Evening" },
  { id: "late_night", label: "Late night" },
];

export default function DiningIntentSheet({
  open,
  onClose,
  restaurantId,
  restaurantName = "",
  existingIntent = null,
  onSaved,
}) {
  const [intentType, setIntentType] = useState("want_to_go");
  const [intentDate, setIntentDate] = useState("");
  const [timeWindow, setTimeWindow] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setIntentType(existingIntent?.intent_type || "want_to_go");
    setIntentDate(existingIntent?.intent_date || "");
    setTimeWindow(existingIntent?.time_window || "");
    setError("");
  }, [open, existingIntent]);

  if (!open) return null;

  async function handleSave(e) {
    e.preventDefault();
    if (!restaurantId || busy) return;
    setBusy(true);
    setError("");
    try {
      const data = await createRestaurantDiningIntent({
        restaurant_id: restaurantId,
        intent_type: intentType,
        intent_date: intentDate || undefined,
        time_window: timeWindow || undefined,
      });
      captureEvent("dining_intent_created", {
        restaurant_id: restaurantId,
        intent_type: intentType,
        source_surface: "restaurant_profile",
      });
      onSaved?.(data?.intent || null);
      onClose?.();
    } catch (err) {
      setError(err?.message || "Unable to save");
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove() {
    if (!existingIntent?.id || busy) return;
    setBusy(true);
    setError("");
    try {
      await removeRestaurantDiningIntent(existingIntent.id);
      captureEvent("dining_intent_removed", {
        restaurant_id: restaurantId,
        intent_id: existingIntent.id,
        source_surface: "restaurant_profile",
      });
      onSaved?.(null);
      onClose?.();
    } catch (err) {
      setError(err?.message || "Unable to remove");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={styles.backdrop} role="presentation" onClick={() => onClose?.()}>
      <div
        style={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dining-intent-sheet-title"
        data-testid="dining-intent-sheet"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="dining-intent-sheet-title" style={styles.title}>
          I want to go
        </h2>
        <p style={styles.lead}>
          {restaurantName
            ? `Let others know you want to eat at ${restaurantName}.`
            : "Share that you want to eat here — only when you choose."}
        </p>

        <form onSubmit={handleSave} style={styles.form}>
          <fieldset style={styles.fieldset}>
            <legend style={styles.legend}>How are you thinking about it?</legend>
            {INTENT_OPTIONS.map((opt) => (
              <label key={opt.id} style={styles.radioRow}>
                <input
                  type="radio"
                  name="intent_type"
                  value={opt.id}
                  checked={intentType === opt.id}
                  onChange={() => setIntentType(opt.id)}
                  data-testid={`dining-intent-type-${opt.id}`}
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </fieldset>

          <label style={styles.label}>
            Date <span style={styles.optional}>(optional)</span>
            <input
              type="date"
              value={intentDate}
              onChange={(e) => setIntentDate(e.target.value)}
              data-testid="dining-intent-date"
              style={styles.input}
            />
          </label>

          <label style={styles.label}>
            Time <span style={styles.optional}>(optional)</span>
            <select
              value={timeWindow}
              onChange={(e) => setTimeWindow(e.target.value)}
              data-testid="dining-intent-time-window"
              style={styles.input}
            >
              {TIME_WINDOWS.map((tw) => (
                <option key={tw.id || "any"} value={tw.id}>
                  {tw.label}
                </option>
              ))}
            </select>
          </label>

          {error ? (
            <p style={styles.error} role="alert">
              {error}
            </p>
          ) : null}

          <div style={styles.actions}>
            <button type="submit" style={styles.primary} disabled={busy} data-testid="dining-intent-save">
              {busy ? "Saving…" : existingIntent ? "Update" : "Save"}
            </button>
            {existingIntent ? (
              <button
                type="button"
                style={styles.danger}
                disabled={busy}
                onClick={handleRemove}
                data-testid="dining-intent-remove"
              >
                Remove
              </button>
            ) : null}
            <button type="button" style={styles.secondary} onClick={() => onClose?.()}>
              Cancel
            </button>
          </div>
        </form>

        <p style={styles.note}>
          Browsing or searching does not add you to this list.{" "}
          <Link to="/account/profile" style={styles.link}>
            Profile settings
          </Link>{" "}
          control who can see your dining intent.
        </p>
      </div>
    </div>
  );
}

const styles = {
  backdrop: {
    position: "fixed",
    inset: 0,
    zIndex: 120000,
    background: "rgba(0,0,0,0.55)",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    padding: "16px",
    boxSizing: "border-box",
  },
  sheet: {
    width: "min(480px, 100%)",
    maxHeight: "90dvh",
    overflow: "auto",
    background: "#fff",
    borderRadius: "16px 16px 12px 12px",
    padding: "20px 18px 24px",
    color: "#1c1917",
    boxShadow: "0 16px 48px rgba(0,0,0,0.25)",
  },
  title: { margin: "0 0 6px", fontSize: 22, fontWeight: 800 },
  lead: { margin: "0 0 16px", fontSize: 14, lineHeight: 1.45, color: "#57534e" },
  form: { display: "grid", gap: 14 },
  fieldset: { border: "none", margin: 0, padding: 0 },
  legend: { fontSize: 13, fontWeight: 800, marginBottom: 8 },
  radioRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 14,
    marginBottom: 6,
    cursor: "pointer",
  },
  label: { display: "grid", gap: 6, fontSize: 13, fontWeight: 700 },
  optional: { fontWeight: 500, color: "#78716c" },
  input: {
    width: "100%",
    boxSizing: "border-box",
    borderRadius: 10,
    border: "1px solid #d6d3d1",
    padding: "10px 12px",
    fontSize: 14,
    fontFamily: "inherit",
  },
  actions: { display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 },
  primary: {
    padding: "10px 16px",
    borderRadius: 999,
    border: "none",
    background: "linear-gradient(180deg, #22C55E 0%, #16A34A 100%)",
    color: "#fff",
    fontWeight: 800,
    fontSize: 14,
    cursor: "pointer",
  },
  secondary: {
    padding: "10px 16px",
    borderRadius: 999,
    border: "1px solid #d6d3d1",
    background: "#fff",
    color: "#44403c",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
  },
  danger: {
    padding: "10px 16px",
    borderRadius: 999,
    border: "1px solid #fecaca",
    background: "#fef2f2",
    color: "#b91c1c",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
  },
  error: { margin: 0, color: "#b91c1c", fontSize: 13, fontWeight: 600 },
  note: { margin: "14px 0 0", fontSize: 12, lineHeight: 1.45, color: "#78716c" },
  link: { color: "#1F4E3D", fontWeight: 700 },
};
