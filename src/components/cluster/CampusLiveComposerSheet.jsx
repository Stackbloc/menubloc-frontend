/**
 * Campus live composer (Phase 2) — same page, bottom sheet, no new route.
 * "Posting to <Cluster>", optional hall chip, one-tap Line/Food when a hall is picked,
 * 140-char text (counter only in the last 20), quick-fill chips, Post.
 * Guests can post. Video mode ships in Phase 3.
 */

import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { createClusterLivePost } from "../../lib/clusterApi.js";
import { getOrCreateGuestReporterKey } from "../../lib/guestReporterSession.js";
import { useConsumer } from "../../context/ConsumerContext.jsx";
import { CampusLiveQuickStatusRows } from "./CampusLiveUpdateSheet.jsx";

/** Reuses the existing dining-hall status copy (DinerStatusComposer HALL_OPS). */
const QUICK_FILL = ["Very crowded", "Seating available", "Station sold out", "Food available"];
const COUNTER_WINDOW = 20;

export default function CampusLiveComposerSheet({
  open,
  onClose,
  clusterSlug,
  placeLabel = "this cluster",
  venues = [],
  initialVenueId = null,
  maxChars = 140,
  onPosted = null,
  onLiveRefresh = null,
}) {
  const { isAuthenticated } = useConsumer();
  const [venueId, setVenueId] = useState(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return undefined;
    setVenueId(initialVenueId != null ? Number(initialVenueId) : null);
    setText("");
    setError("");
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, initialVenueId]);

  const selectedVenue = useMemo(
    () => venues.find((v) => Number(v.restaurant_id) === Number(venueId)) || null,
    [venues, venueId]
  );

  if (!open) return null;

  const length = [...text].length;
  const remaining = maxChars - length;
  const canPost = text.trim().length > 0 && remaining >= 0 && !busy;

  function appendQuickFill(phrase) {
    setText((prev) => {
      const base = prev.trim();
      const next = base ? `${base}. ${phrase}` : phrase;
      return [...next].slice(0, maxChars).join("");
    });
  }

  async function submit(e) {
    e.preventDefault();
    if (!canPost) return;
    setBusy(true);
    setError("");
    try {
      const res = await createClusterLivePost(clusterSlug, {
        body: text.trim(),
        restaurant_id: venueId || undefined,
        guest_key: isAuthenticated ? undefined : getOrCreateGuestReporterKey(),
      });
      if (onPosted) onPosted(res?.post || null);
    } catch (err) {
      setError(err?.message || "Could not post. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  // Portal to body so later page sections never paint over the sheet.
  return createPortal(
    <div
      data-testid="campus-live-composer"
      style={styles.backdrop}
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form style={styles.sheet} role="dialog" aria-label={`Posting to ${placeLabel}`} onSubmit={submit}>
        <div style={styles.handle} />
        <div style={styles.headerRow}>
          <strong style={styles.title}>Posting to {placeLabel}</strong>
          <button type="button" onClick={onClose} style={styles.close} aria-label="Close">
            ✕
          </button>
        </div>

        {venues.length ? (
          <div style={styles.hallRow} data-testid="campus-live-composer-halls">
            {venues.map((v) => {
              const selected = Number(v.restaurant_id) === Number(venueId);
              return (
                <button
                  key={v.restaurant_id}
                  type="button"
                  style={{ ...styles.chip, ...(selected ? styles.chipSelected : null) }}
                  onClick={() => setVenueId(selected ? null : Number(v.restaurant_id))}
                >
                  {v.name}
                </button>
              );
            })}
          </div>
        ) : null}

        {selectedVenue ? (
          <CampusLiveQuickStatusRows
            clusterSlug={clusterSlug}
            venue={{
              restaurant_id: Number(selectedVenue.restaurant_id),
              name: selectedVenue.name,
              viewer: selectedVenue.viewer || { line: null, food: null },
            }}
            onSaved={onLiveRefresh}
          />
        ) : null}

        <textarea
          data-testid="campus-live-composer-text"
          value={text}
          onChange={(e) => setText([...e.target.value].slice(0, maxChars).join(""))}
          rows={3}
          maxLength={maxChars}
          placeholder="What's it like right now?"
          style={styles.textarea}
        />
        <div style={styles.metaRow}>
          <div style={styles.quickRow}>
            {QUICK_FILL.map((phrase) => (
              <button
                key={phrase}
                type="button"
                style={styles.quickChip}
                onClick={() => appendQuickFill(phrase)}
              >
                {phrase}
              </button>
            ))}
          </div>
          {remaining <= COUNTER_WINDOW ? (
            <span style={styles.counter} data-testid="campus-live-composer-counter">
              {remaining}
            </span>
          ) : null}
        </div>

        {error ? <p style={styles.error}>{error}</p> : null}

        <button
          type="submit"
          data-testid="campus-live-composer-post"
          disabled={!canPost}
          style={{ ...styles.post, ...(canPost ? null : styles.postDisabled) }}
        >
          {busy ? "Posting…" : "Post"}
        </button>
      </form>
    </div>,
    document.body
  );
}

const styles = {
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.45)",
    // Above BottomNav (zIndex 200); matches MenuplyActionSheet.
    zIndex: 1400,
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
  },
  sheet: {
    width: "100%",
    maxWidth: 480,
    maxHeight: "88vh",
    overflowY: "auto",
    background: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: "10px 16px calc(20px + env(safe-area-inset-bottom, 0px))",
    boxShadow: "0 -8px 28px rgba(0,0,0,0.18)",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 999,
    background: "#d1d5db",
    margin: "0 auto 10px",
  },
  headerRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 },
  title: { fontSize: 16, color: "#111827" },
  close: {
    border: "none",
    background: "transparent",
    fontSize: 18,
    color: "#6b7280",
    cursor: "pointer",
    padding: 4,
  },
  hallRow: { display: "flex", flexWrap: "wrap", gap: 6, margin: "10px 0 4px" },
  chip: {
    border: "1px solid #d1d5db",
    background: "#fff",
    borderRadius: 999,
    padding: "6px 10px",
    fontSize: 13,
    fontWeight: 700,
    color: "#111827",
    cursor: "pointer",
  },
  chipSelected: { borderColor: "#059669", background: "#ecfdf5", color: "#065f46" },
  textarea: {
    width: "100%",
    boxSizing: "border-box",
    marginTop: 12,
    border: "1px solid #d1d5db",
    borderRadius: 12,
    padding: 10,
    fontSize: 15,
    fontFamily: "inherit",
    resize: "none",
  },
  metaRow: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginTop: 6 },
  quickRow: { display: "flex", flexWrap: "wrap", gap: 6 },
  quickChip: {
    border: "1px solid #e5e7eb",
    background: "#f9fafb",
    borderRadius: 999,
    padding: "4px 9px",
    fontSize: 12,
    fontWeight: 600,
    color: "#374151",
    cursor: "pointer",
  },
  counter: { fontSize: 12, fontWeight: 700, color: "#b45309", flex: "0 0 auto" },
  error: { margin: "8px 0 0", fontSize: 13, color: "#b91c1c" },
  post: {
    width: "100%",
    marginTop: 12,
    border: "none",
    borderRadius: 999,
    padding: "11px 14px",
    fontSize: 15,
    fontWeight: 800,
    color: "#fff",
    background: "#111827",
    cursor: "pointer",
  },
  postDisabled: { background: "#9ca3af", cursor: "not-allowed" },
};
