/**
 * Create or edit a diner social event — Edit View + Add, or Multiplier compose=event.
 * Food is optional; general social events (concerts, birthdays, campus, etc.).
 * Join Me eligibility is per event instance (not a section-wide default).
 */

import { useEffect, useState } from "react";
import MenuplyMediaPicker from "../../../components/social/MenuplyMediaPicker.jsx";
import { whatIAteTodayLocalDate } from "../../../lib/consumerApi.js";
import JoinMeAudiencePicker from "./JoinMeAudiencePicker.jsx";
import {
  CLEAR_STUCK_MEDIA_CHROME_EVENT,
  restoreDocumentScroll,
} from "./pendingHighlightMedia.js";

function dateOnly(value) {
  const s = String(value || "").trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  return whatIAteTodayLocalDate();
}

function timeOnly(value) {
  const s = String(value || "").trim();
  if (!s) return "";
  // "08:00:00" or "08:00"
  const m = s.match(/^(\d{1,2}:\d{2})/);
  return m ? m[1].padStart(5, "0") : "";
}

export default function EventComposeSheet({
  open,
  onClose,
  busy = false,
  onSubmit,
  joinCandidates = [],
  /** Existing event → edit mode (per-instance Join Me like What's cookin' Add details). */
  initialEvent = null,
}) {
  const editingId = initialEvent?.id != null ? Number(initialEvent.id) : null;
  const isEdit = Number.isFinite(editingId) && editingId > 0;

  const [title, setTitle] = useState("");
  const [eventDate, setEventDate] = useState(() => whatIAteTodayLocalDate());
  const [startTime, setStartTime] = useState("");
  const [locationLabel, setLocationLabel] = useState("");
  const [description, setDescription] = useState("");
  const [joinMeOpen, setJoinMeOpen] = useState(false);
  const [joinAudience, setJoinAudience] = useState("connections");
  const [joinAllowedUserIds, setJoinAllowedUserIds] = useState([]);
  const [file, setFile] = useState(null);
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    if (!open) return;
    if (isEdit && initialEvent) {
      setTitle(String(initialEvent.title || ""));
      setEventDate(dateOnly(initialEvent.event_date));
      setStartTime(timeOnly(initialEvent.start_time));
      setLocationLabel(String(initialEvent.location_label || ""));
      setDescription(String(initialEvent.description || ""));
      const openJoin = Boolean(initialEvent.join_me_open);
      setJoinMeOpen(openJoin);
      const aud = String(initialEvent.join_audience || "").toLowerCase();
      setJoinAudience(aud === "selected" ? "selected" : "connections");
      setJoinAllowedUserIds(
        openJoin && aud === "selected"
          ? (initialEvent.join_allowed_user_ids || []).map((id) => Number(id)).filter(Boolean)
          : []
      );
    } else {
      setTitle("");
      setEventDate(whatIAteTodayLocalDate());
      setStartTime("");
      setLocationLabel("");
      setDescription("");
      setJoinMeOpen(false);
      setJoinAudience("connections");
      setJoinAllowedUserIds([]);
    }
    setFile(null);
    setLocalError("");
    // Prefill once when sheet opens (or switches create ↔ edit target).
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: editingId + open only
  }, [open, editingId]);

  useEffect(() => {
    if (!open) return undefined;
    function onForceClose() {
      if (!busy) onClose?.();
    }
    window.addEventListener(CLEAR_STUCK_MEDIA_CHROME_EVENT, onForceClose);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener(CLEAR_STUCK_MEDIA_CHROME_EVENT, onForceClose);
      restoreDocumentScroll();
    };
  }, [open, onClose, busy]);

  if (!open) return null;

  const joinSelectedBlocked =
    joinMeOpen && joinAudience === "selected" && joinAllowedUserIds.length === 0;

  async function handleSubmit(e) {
    e.preventDefault();
    const nextTitle = String(title || "").trim();
    if (!nextTitle || !eventDate) return;
    if (joinSelectedBlocked) {
      setLocalError("Select at least one person for Join Me");
      return;
    }
    setLocalError("");
    try {
      await onSubmit?.({
        eventId: isEdit ? editingId : null,
        title: nextTitle,
        eventDate,
        startTime: String(startTime || "").trim() || null,
        locationLabel: String(locationLabel || "").trim() || null,
        description: String(description || "").trim() || null,
        joinMeOpen,
        joinAudience: joinMeOpen ? joinAudience : "none",
        joinAllowedUserIds:
          joinMeOpen && joinAudience === "selected" ? joinAllowedUserIds : [],
        file,
      });
      setTitle("");
      setStartTime("");
      setLocationLabel("");
      setDescription("");
      setJoinMeOpen(false);
      setJoinAudience("connections");
      setJoinAllowedUserIds([]);
      setFile(null);
      onClose?.();
    } catch (err) {
      setLocalError(err?.message || (isEdit ? "Unable to update event" : "Unable to create event"));
    }
  }

  return (
    <div
      role="presentation"
      style={styles.backdrop}
      data-testid="event-compose-sheet"
      onClick={() => {
        if (!busy) onClose?.();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={isEdit ? "Edit event" : "My Events"}
        style={styles.panel}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={styles.head}>
          <p style={styles.title}>{isEdit ? "Edit event" : "My Events"}</p>
          <button
            type="button"
            style={styles.close}
            aria-label="Close"
            disabled={busy}
            onClick={() => onClose?.()}
          >
            ✕
          </button>
        </div>
        <p style={styles.lead}>
          {isEdit
            ? "Turn Join Me on or off for this event only — same as What’s cookin’ plans."
            : "Create an event. Turn on Join Me for this event only — pick who can see and join."}
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
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Event name"
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
              Time (optional)
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
            Location (optional)
            <input
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
          <div data-testid="event-compose-join-me">
            <JoinMeAudiencePicker
              joinable={joinMeOpen}
              onJoinableChange={(next) => {
                setJoinMeOpen(next);
                if (!next) {
                  setJoinAudience("connections");
                  setJoinAllowedUserIds([]);
                }
              }}
              audience={joinAudience === "selected" ? "selected" : "connections"}
              onAudienceChange={(next) => setJoinAudience(next)}
              selectedIds={joinAllowedUserIds}
              onSelectedIdsChange={(ids) => {
                setJoinAudience("selected");
                setJoinAllowedUserIds(ids);
              }}
              candidates={joinCandidates}
              showCapacity={false}
              disabled={busy}
            />
          </div>
          {localError ? (
            <p style={styles.error} data-testid="event-compose-error" role="alert">
              {localError}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={busy || !String(title).trim() || !eventDate || joinSelectedBlocked}
            style={styles.submit}
            data-testid="event-compose-submit"
          >
            {busy ? "…" : isEdit ? "Save event" : "Post to My Events"}
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
    color: "#475569",
  },
  input: {
    appearance: "none",
    border: "1px solid #e2e8f0",
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 15,
    font: "inherit",
    color: "#0f172a",
    background: "#fff",
  },
  submit: {
    appearance: "none",
    border: "none",
    borderRadius: 12,
    padding: "12px 16px",
    fontSize: 15,
    fontWeight: 800,
    color: "#fff",
    background: "linear-gradient(135deg, #16a34a, #15803d)",
    cursor: "pointer",
    marginTop: 4,
  },
  error: { margin: 0, fontSize: 13, color: "#b91c1c", fontWeight: 600 },
};
