/**
 * One dining hall's Live clips (USC On campus list).
 *
 * A hall behaves like a menu item: clips posted here belong to this hall (no venue picker),
 * show only under it, and expire on the campus live window. Report hides a clip on its first
 * report (campus post report). Recording is flag-gated (VITE_ENABLE_HALL_CLIPS + backend
 * recording_enabled); upload reuses the diner Feed media upload unchanged, and guests confirm
 * the same consent as guest Feed videos.
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { createHallClip, fetchHallClips, reportClusterLivePost } from "../../lib/clusterApi.js";
import { uploadWhatIAteTodayPhoto } from "../../lib/consumerApi.js";
import { uploadGuestFeedVideoPhoto } from "../../lib/guestFeedVideoApi.js";
import { eatingMediaFromUpload } from "../../lib/eatingMediaUtils.js";
import { probeNativeVideoFile } from "../../lib/nativeVideoCapture.js";
import { buildGuestPublicationLegalPayload } from "../../lib/legalConsent.js";
import { getOrCreateGuestReporterKey } from "../../lib/guestReporterSession.js";
import { isHallClipsRecordingEnabled } from "../../lib/featureFlags.js";
import { useConsumer } from "../../context/ConsumerContext.jsx";
import GuestFeedVideoConsentGate from "../consumer/feed/GuestFeedVideoConsentGate.jsx";

export const HALL_CLIP_RECORDING_REMINDER = "Follow your campus recording rules. No faces, please.";
const DEFAULT_MAX_SECONDS = 15;
const DEFAULT_MAX_CHARS = 140;

/** "Newest clip 12 min ago" from an ISO time. */
export function formatNewestClipAgo(iso, nowMs = Date.now()) {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return null;
  const mins = Math.max(0, Math.floor((nowMs - t) / 60000));
  if (mins < 1) return "Newest clip just now";
  if (mins < 60) return `Newest clip ${mins} min ago`;
  const hours = Math.floor(mins / 60);
  return `Newest clip ${hours} hr${hours === 1 ? "" : "s"} ago`;
}

function ClipCard({ clip, reported, onReport }) {
  return (
    <article data-testid="hall-clip" style={styles.clip}>
      <video
        src={clip.video_url}
        controls
        playsInline
        muted
        preload="metadata"
        style={styles.video}
        aria-label={clip.body ? `Clip: ${clip.body}` : "Dining hall clip"}
      />
      {clip.body ? <p style={styles.caption}>{clip.body}</p> : null}
      <div style={styles.clipMeta}>
        <span>
          {clip.author?.label || "Guest"}
          {clip.age_label ? ` · ${clip.age_label}` : ""}
        </span>
        {clip.is_own ? null : (
          <button
            type="button"
            data-testid="hall-clip-report"
            style={styles.report}
            disabled={reported}
            onClick={() => onReport(clip)}
          >
            {reported ? "Reported" : "Report"}
          </button>
        )}
      </div>
    </article>
  );
}

export default function HallClipsSheet({
  open,
  onClose,
  clusterSlug,
  hall,
  recordingEnabled = false,
  limits = null,
  onPosted = null,
}) {
  const { isAuthenticated } = useConsumer();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reportedIds, setReportedIds] = useState(() => new Set());
  const [file, setFile] = useState(null);
  const [durationMs, setDurationMs] = useState(null);
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(null);
  const [error, setError] = useState("");
  const [consentOpen, setConsentOpen] = useState(false);
  const inputRef = useRef(null);

  const maxSeconds = Number(limits?.max_seconds) || DEFAULT_MAX_SECONDS;
  const maxChars = Number(limits?.max_chars) || DEFAULT_MAX_CHARS;
  const canRecord = isHallClipsRecordingEnabled() && recordingEnabled;
  const hallId = hall?.restaurant_id ?? null;

  const load = useCallback(() => {
    if (!clusterSlug || hallId == null) return Promise.resolve();
    setLoading(true);
    return fetchHallClips(clusterSlug, hallId, {
      guestKey: isAuthenticated ? null : getOrCreateGuestReporterKey(),
    })
      .then((res) => setData(res || null))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [clusterSlug, hallId, isAuthenticated]);

  useEffect(() => {
    if (!open) return;
    setError("");
    setFile(null);
    setDurationMs(null);
    setCaption("");
    load();
  }, [open, load]);

  if (!open || !hall || typeof document === "undefined") return null;

  const clips = Array.isArray(data?.clips) ? data.clips : [];

  async function handleReport(clip) {
    try {
      const res = await reportClusterLivePost(clusterSlug, clip.id, {
        guest_key: isAuthenticated ? undefined : getOrCreateGuestReporterKey(),
      });
      setReportedIds((prev) => new Set(prev).add(Number(clip.id)));
      if (res?.hidden) {
        load();
        onPosted?.();
      }
    } catch {
      /* best-effort; the sheet stays usable */
    }
  }

  async function handlePick(event) {
    const picked = event.target.files?.[0] || null;
    event.target.value = "";
    setError("");
    if (!picked) return;
    try {
      const probe = await probeNativeVideoFile(picked);
      const seconds = Number(probe?.duration);
      if (!Number.isFinite(seconds) || seconds <= 0) {
        setError("Could not read that clip. Try recording again.");
        return;
      }
      if (seconds > maxSeconds + 0.5) {
        setError(`Keep clips to ${maxSeconds} seconds (that one is ${Math.round(seconds)}s).`);
        return;
      }
      setFile(picked);
      setDurationMs(Math.round(seconds * 1000));
    } catch (err) {
      setError(err?.message || "Could not read that clip.");
    }
  }

  async function publish(consentPayload = null) {
    if (!file || busy) return;
    setBusy(true);
    setError("");
    setUploadPercent(0);
    const onProgress = (p) => {
      const pct = Number(p?.percent);
      if (Number.isFinite(pct)) setUploadPercent(Math.max(0, Math.min(100, Math.round(pct))));
    };
    try {
      const upload = isAuthenticated
        ? await uploadWhatIAteTodayPhoto(file, { onProgress })
        : await uploadGuestFeedVideoPhoto(file, { onProgress });
      const { video_url } = eatingMediaFromUpload(upload);
      if (!video_url) throw new Error("Could not upload the clip");
      await createHallClip(clusterSlug, hallId, {
        video_url,
        duration_ms: durationMs,
        body: caption.trim() || undefined,
        ...(isAuthenticated ? {} : { guest_key: getOrCreateGuestReporterKey(), ...(consentPayload || {}) }),
      });
      setConsentOpen(false);
      setFile(null);
      setDurationMs(null);
      setCaption("");
      await load();
      onPosted?.();
    } catch (err) {
      if (err?.code === "legal_consent_required" || err?.code === "legal_consent_version_mismatch") {
        setConsentOpen(true);
      } else {
        setError(err?.message || "Could not post the clip");
      }
    } finally {
      setBusy(false);
      setUploadPercent(null);
    }
  }

  function handlePost() {
    if (isAuthenticated) publish();
    else setConsentOpen(true);
  }

  return createPortal(
    <>
      <div
        role="presentation"
        style={styles.backdrop}
        onMouseDown={(e) => {
          if (e.target === e.currentTarget && !busy) onClose?.();
        }}
      >
        <div role="dialog" aria-modal="true" aria-label={`${hall.name} live clips`} style={styles.sheet} data-testid="hall-clips-sheet">
          <div style={styles.handle} />
          <div style={styles.headerRow}>
            <strong style={styles.title}>{hall.name} · Live clips</strong>
            <button type="button" aria-label="Close" style={styles.close} disabled={busy} onClick={() => onClose?.()}>
              ✕
            </button>
          </div>

          {canRecord ? (
            <div style={styles.recordBox} data-testid="hall-clip-record">
              <input
                ref={inputRef}
                type="file"
                accept="video/*"
                capture="environment"
                style={{ display: "none" }}
                onChange={handlePick}
                data-testid="hall-clip-input"
              />
              <button
                type="button"
                style={styles.recordButton}
                disabled={busy}
                onClick={() => inputRef.current?.click()}
              >
                {file ? "Record again" : "Record a clip"}
              </button>
              <p style={styles.reminder} data-testid="hall-clip-reminder">
                {HALL_CLIP_RECORDING_REMINDER}
              </p>
              <p style={styles.hint}>Up to {maxSeconds} seconds. Clips disappear after a day or two.</p>
              {file ? (
                <>
                  <textarea
                    value={caption}
                    maxLength={maxChars}
                    placeholder="Add a note (optional)"
                    rows={2}
                    onChange={(e) => setCaption(e.target.value)}
                    style={styles.textarea}
                    disabled={busy}
                  />
                  <button type="button" style={styles.post} disabled={busy} onClick={handlePost} data-testid="hall-clip-post">
                    {busy ? (uploadPercent != null ? `Posting… ${uploadPercent}%` : "Posting…") : `Post to ${hall.name}`}
                  </button>
                </>
              ) : null}
              {error ? (
                <p role="alert" style={styles.error}>
                  {error}
                </p>
              ) : null}
            </div>
          ) : null}

          {loading && !data ? <p style={styles.hint}>Loading clips…</p> : null}
          {!loading && clips.length === 0 ? (
            <p style={styles.empty} data-testid="hall-clips-empty">
              {canRecord ? "Be the first to post a clip." : "No clips yet. Live clips from this hall are coming soon."}
            </p>
          ) : null}
          <div style={{ display: "grid", gap: 12 }}>
            {clips.map((clip) => (
              <ClipCard
                key={clip.id}
                clip={clip}
                reported={reportedIds.has(Number(clip.id))}
                onReport={handleReport}
              />
            ))}
          </div>
        </div>
      </div>
      <GuestFeedVideoConsentGate
        open={consentOpen}
        busy={busy}
        onCancel={() => setConsentOpen(false)}
        onConfirm={() => publish(buildGuestPublicationLegalPayload())}
      />
    </>,
    document.body
  );
}

const styles = {
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.45)",
    // Above BottomNav (200); below the guest consent gate (1300) so it can open on top.
    zIndex: 1250,
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
    maxHeight: "88vh",
    overflowY: "auto",
    boxSizing: "border-box",
    padding: "10px 16px calc(var(--bottom-nav-h, 72px) + 16px + env(safe-area-inset-bottom, 0px))",
    boxShadow: "0 -8px 28px rgba(0,0,0,0.18)",
  },
  handle: { width: 40, height: 4, borderRadius: 999, background: "#d1d5db", margin: "0 auto 10px" },
  headerRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 10 },
  title: { fontSize: 17, color: "#111827" },
  close: { border: "none", background: "transparent", fontSize: 18, color: "#6b7280", cursor: "pointer", padding: 4 },
  recordBox: {
    display: "grid",
    gap: 8,
    padding: 12,
    marginBottom: 14,
    borderRadius: 12,
    border: "1px solid #a7f3d0",
    background: "#f0fdf4",
  },
  recordButton: {
    border: "none",
    borderRadius: 999,
    padding: "10px 14px",
    background: "#b91c1c",
    color: "#fff",
    fontWeight: 800,
    fontSize: 15,
    cursor: "pointer",
  },
  reminder: { margin: 0, fontSize: 13, fontWeight: 700, color: "#7f1d1d" },
  hint: { margin: 0, fontSize: 12, color: "#6b7280" },
  textarea: {
    width: "100%",
    boxSizing: "border-box",
    borderRadius: 10,
    border: "1px solid #d1d5db",
    padding: 8,
    fontSize: 14,
    fontFamily: "inherit",
    resize: "vertical",
  },
  post: {
    border: "none",
    borderRadius: 999,
    padding: "10px 14px",
    background: "#166534",
    color: "#fff",
    fontWeight: 800,
    fontSize: 14,
    cursor: "pointer",
  },
  error: { margin: 0, fontSize: 13, color: "#b91c1c" },
  empty: { margin: "4px 0 12px", fontSize: 14, color: "#4b5563" },
  clip: { display: "grid", gap: 6 },
  video: { width: "100%", maxHeight: 420, borderRadius: 12, background: "#000", aspectRatio: "9 / 16", objectFit: "cover" },
  caption: { margin: 0, fontSize: 14, color: "#111827", overflowWrap: "anywhere" },
  clipMeta: { display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: "#6b7280" },
  report: {
    border: "none",
    background: "transparent",
    color: "#6b7280",
    fontSize: 12,
    fontWeight: 700,
    textDecoration: "underline",
    cursor: "pointer",
    padding: 2,
  },
};
