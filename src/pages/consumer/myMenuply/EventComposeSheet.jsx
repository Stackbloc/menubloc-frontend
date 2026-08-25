/**
 * Create a diner social event — opened from bottom-nav X.
 * Food is optional; general social events (concerts, birthdays, campus, etc.).
 */

import { useState } from "react";
import MenuplyMediaPicker from "../../../components/social/MenuplyMediaPicker.jsx";
import { whatIAteTodayLocalDate } from "../../../lib/consumerApi.js";

export default function EventComposeSheet({
  open,
  onClose,
  busy = false,
  onSubmit,
}) {
  const [title, setTitle] = useState("");
  const [eventDate, setEventDate] = useState(() => whatIAteTodayLocalDate());
  const [startTime, setStartTime] = useState("");
  const [locationLabel, setLocationLabel] = useState("");
  const [description, setDescription] = useState("");
  const [joinMeOpen, setJoinMeOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [localError, setLocalError] = useState("");

  if (!open) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    const nextTitle = String(title || "").trim();
    if (!nextTitle || !eventDate) return;
    setLocalError("");
    try {
      await onSubmit?.({
        title: nextTitle,
        eventDate,
        startTime: String(startTime || "").trim() || null,
        locationLabel: String(locationLabel || "").trim() || null,
        description: String(description || "").trim() || null,
        joinMeOpen,
        file,
      });
      setTitle("");
      setStartTime("");
      setLocationLabel("");
      setDescription("");
      setJoinMeOpen(false);
      setFile(null);
      onClose?.();
    } catch (err) {
      setLocalError(err?.message || "Unable to create event");
    }
  }

  return (
    <div
      role="presentation"
      style={styles.backdrop}
      data-testid="event-compose-sheet"
      onClick={() => onClose?.()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="My Events"
        style={styles.panel}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={styles.head}>
          <p style={styles.title}>My Events</p>
          <button type="button" style={styles.close} onClick={() => onClose?.()} aria-label="Close">
            ✕
          </button>
        </div>
        <p style={styles.lead}>
          Any social event — dinner, concert, game, birthday, study session. Food is optional.
        </p>
        <form onSubmit={handleSubmit} style={styles.form} data-testid="event-compose-form">
          <MenuplyMediaPicker
            file={file}
            onFile={setFile}
            onClear={() => setFile(null)}
            disabled={busy}
            facingMode="environment"
            source="camera"
            allowPhoto
            allowVideo
            testId="event-compose-media"
            ariaLabel="Add photo or video"
          />
          <label style={styles.label}>
            Title
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. USC football, Beach day, Birthday dinner"
              disabled={busy}
              maxLength={160}
              required
              style={styles.input}
              data-testid="event-compose-title"
            />
          </label>
          <div style={styles.row}>
            <label style={styles.label}>
              Date
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                disabled={busy}
                required
                style={styles.input}
                data-testid="event-compose-date"
              />
            </label>
            <label style={styles.label}>
              Time
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                disabled={busy}
                style={styles.input}
                data-testid="event-compose-time"
              />
            </label>
          </div>
          <label style={styles.label}>
            Location
            <input
              type="text"
              value={locationLabel}
              onChange={(e) => setLocationLabel(e.target.value)}
              placeholder="Place or address (optional)"
              disabled={busy}
              maxLength={200}
              style={styles.input}
              data-testid="event-compose-location"
            />
          </label>
          <label style={styles.label}>
            Description
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this event about? (optional)"
              disabled={busy}
              maxLength={1000}
              rows={3}
              style={{ ...styles.input, minHeight: 72, resize: "vertical" }}
              data-testid="event-compose-description"
            />
          </label>
          <label style={styles.checkRow} data-testid="event-compose-join-me">
            <input
              type="checkbox"
              checked={joinMeOpen}
              onChange={(e) => setJoinMeOpen(e.target.checked)}
              disabled={busy}
            />
            <span>
              <strong>Open Join Me</strong> — anyone with the link can accept
            </span>
          </label>
          {localError ? (
            <p style={styles.error} data-testid="event-compose-error" role="alert">
              {localError}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={busy || !String(title).trim() || !eventDate}
            style={styles.submit}
            data-testid="event-compose-submit"
          >
            {busy ? "…" : "Post to My Events"}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.48)",
    zIndex: 1100,
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    padding: "0 12px calc(var(--bottom-nav-h, 72px) + 12px)",
  },
  panel: {
    width: "100%",
    maxWidth: 480,
    background: "#fff",
    borderRadius: "20px 20px 14px 14px",
    padding: "16px 16px 20px",
    boxShadow: "0 -12px 40px rgba(15, 23, 42, 0.18)",
    maxHeight: "min(88vh, 720px)",
    overflowY: "auto",
  },
  head: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  title: { margin: 0, fontSize: 18, fontWeight: 800, color: "#0f172a" },
  close: {
    appearance: "none",
    border: "none",
    background: "rgba(120,120,128,0.12)",
    width: 32,
    height: 32,
    borderRadius: "50%",
    fontSize: 16,
    cursor: "pointer",
  },
  lead: { margin: "0 0 14px", fontSize: 13, color: "#64748b", lineHeight: 1.45 },
  form: { display: "flex", flexDirection: "column", gap: 12 },
  row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  label: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    fontSize: 12,
    fontWeight: 700,
    color: "#475467",
  },
  input: {
    minHeight: 44,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    fontSize: 15,
    fontFamily: "inherit",
    color: "#0f172a",
    background: "#fff",
    boxSizing: "border-box",
    fontWeight: 500,
  },
  submit: {
    appearance: "none",
    minHeight: 44,
    border: "none",
    borderRadius: 999,
    background: "linear-gradient(180deg, #22C55E 0%, #16A34A 100%)",
    color: "#0B0F0C",
    fontWeight: 800,
    fontSize: 15,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  checkRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    fontSize: 13,
    color: "#334155",
    lineHeight: 1.45,
    cursor: "pointer",
  },
  error: {
    margin: 0,
    fontSize: 13,
    fontWeight: 700,
    color: "#B42318",
    lineHeight: 1.4,
  },
};
