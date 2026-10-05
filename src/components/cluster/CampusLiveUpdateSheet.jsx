/**
 * One-tap Line / Food update sheet for On Campus venues.
 * Guests welcome (guest open reporting). Saves immediately.
 */

import React, { useEffect, useState } from "react";
import { postClusterCampusLiveReport } from "../../lib/clusterApi.js";
import { getOrCreateGuestReporterKey, readOptionalReporterCoords } from "../../lib/guestReporterSession.js";
import GuestContributeNextStep from "../foodActivity/GuestContributeNextStep.jsx";
import { useConsumer } from "../../context/ConsumerContext.jsx";

const LINE_OPTIONS = [
  { value: "none", label: "No line" },
  { value: "short", label: "Short line" },
  { value: "long", label: "Long line" },
];

const FOOD_OPTIONS = [
  { value: "good", label: "Good today" },
  { value: "okay", label: "Okay" },
  { value: "skip", label: "Skip it" },
];

/**
 * One-tap Line + Food rows for a venue. Each tap saves immediately; tapping the
 * selected value again clears it. Shared by the Update sheet and the composer.
 */
export function CampusLiveQuickStatusRows({ clusterSlug, venue, onSaved = null, onPosted = null }) {
  const { isAuthenticated } = useConsumer();
  const [busyKind, setBusyKind] = useState(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [selectedLine, setSelectedLine] = useState(null);
  const [selectedFood, setSelectedFood] = useState(null);

  useEffect(() => {
    setNotice("");
    setError("");
    setSelectedLine(venue?.viewer?.line?.value || null);
    setSelectedFood(venue?.viewer?.food?.value || null);
  }, [venue?.restaurant_id, venue?.viewer?.line?.value, venue?.viewer?.food?.value]);

  async function tap(kind, value) {
    if (!clusterSlug || !venue || busyKind) return;
    const current = kind === "line" ? selectedLine : selectedFood;
    const nextValue = current === value ? null : value;
    setBusyKind(kind);
    setError("");
    setNotice("");
    try {
      const coords = await readOptionalReporterCoords();
      const data = await postClusterCampusLiveReport(clusterSlug, {
        restaurant_id: venue.restaurant_id,
        kind,
        value: nextValue,
        guest_key: isAuthenticated ? undefined : getOrCreateGuestReporterKey(),
        lat: coords.lat,
        lng: coords.lng,
      });
      if (kind === "line") setSelectedLine(nextValue);
      else setSelectedFood(nextValue);
      setNotice(data?.notice || (data?.cleared ? "Cleared" : "Saved"));
      if (onPosted) onPosted();
      if (onSaved) onSaved(data?.live || null);
    } catch (err) {
      setError(err?.message || "Unable to save");
    } finally {
      setBusyKind(null);
    }
  }

  if (!venue) return null;

  return (
    <>
      <div style={styles.kindLabel}>Line</div>
      <div style={styles.chipRow} data-testid="campus-live-line-options">
        {LINE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            disabled={Boolean(busyKind)}
            onClick={() => tap("line", opt.value)}
            style={{
              ...styles.chip,
              ...(selectedLine === opt.value ? styles.chipSelected : null),
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div style={styles.kindLabel}>Food</div>
      <div style={styles.chipRow} data-testid="campus-live-food-options">
        {FOOD_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            disabled={Boolean(busyKind)}
            onClick={() => tap("food", opt.value)}
            style={{
              ...styles.chip,
              ...(selectedFood === opt.value ? styles.chipSelected : null),
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {notice ? (
        <p style={styles.notice} data-testid="campus-live-saved">
          {notice}
        </p>
      ) : null}
      {error ? <p style={styles.error}>{error}</p> : null}
    </>
  );
}

export default function CampusLiveUpdateSheet({
  open,
  onClose,
  clusterSlug,
  venue,
  onSaved = null,
}) {
  const { isAuthenticated } = useConsumer();
  const [posted, setPosted] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    setPosted(false);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, venue?.restaurant_id]);

  if (!open || !venue) return null;

  return (
    <div
      data-testid="campus-live-update-sheet"
      style={styles.backdrop}
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div style={styles.sheet} role="dialog" aria-label={`Update ${venue.name}`}>
        <div style={styles.handle} />
        <div style={styles.headerRow}>
          <strong style={styles.title}>{venue.name}</strong>
          <button type="button" onClick={onClose} style={styles.close} aria-label="Close">
            ✕
          </button>
        </div>
        <p style={styles.hint}>Tap to save. Tap again to clear.</p>

        <CampusLiveQuickStatusRows
          clusterSlug={clusterSlug}
          venue={venue}
          onSaved={onSaved}
          onPosted={() => setPosted(true)}
        />
        {posted && !isAuthenticated ? <GuestContributeNextStep /> : null}
      </div>
    </div>
  );
}

const styles = {
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.45)",
    zIndex: 80,
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
  },
  sheet: {
    width: "100%",
    maxWidth: 480,
    background: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: "10px 16px 28px",
    boxShadow: "0 -8px 28px rgba(0,0,0,0.18)",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 999,
    background: "#d1d5db",
    margin: "0 auto 10px",
  },
  headerRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  title: { fontSize: 17, color: "#111827" },
  close: {
    border: "none",
    background: "transparent",
    fontSize: 18,
    color: "#6b7280",
    cursor: "pointer",
    padding: 4,
  },
  hint: { margin: "6px 0 12px", fontSize: 13, color: "#6b7280" },
  kindLabel: {
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: 0.3,
    textTransform: "uppercase",
    color: "#0f766e",
    margin: "10px 0 6px",
  },
  chipRow: { display: "flex", flexWrap: "wrap", gap: 8 },
  chip: {
    border: "1px solid #d1d5db",
    background: "#fff",
    borderRadius: 999,
    padding: "8px 12px",
    fontSize: 14,
    fontWeight: 700,
    color: "#111827",
    cursor: "pointer",
  },
  chipSelected: {
    borderColor: "#059669",
    background: "#ecfdf5",
    color: "#065f46",
  },
  notice: { margin: "12px 0 0", fontSize: 14, fontWeight: 700, color: "#065f46" },
  error: { margin: "12px 0 0", fontSize: 14, color: "#b91c1c" },
};
