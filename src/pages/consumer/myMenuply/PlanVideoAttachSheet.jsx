/**
 * Attach a teaser video to an existing eating plan (Feed discoverability).
 */

import { useState } from "react";
import MenuplyMediaPicker from "../../../components/social/MenuplyMediaPicker.jsx";
import { isVideoFile } from "../../../lib/eatingMediaUtils.js";
import { attachPlanVideo } from "../../../lib/feedVideoCompose.js";
import * as s from "./myMenuplyStyles.js";

export default function PlanVideoAttachSheet({ open, plan, onClose, onAttached }) {
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!open || !plan) return null;

  async function handleSubmit(event) {
    event.preventDefault();
    if (!file || !isVideoFile(file)) {
      setError("Choose or record a video first");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const token = plan.token || plan.id;
      await attachPlanVideo(token, file);
      setFile(null);
      onAttached?.();
      onClose?.();
    } catch (err) {
      setError(err?.message || "Unable to add plan video");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      role="presentation"
      style={styles.backdrop}
      data-testid="plan-video-attach-sheet"
      onClick={() => !busy && onClose?.()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Add plan video"
        style={styles.panel}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={styles.head}>
          <p style={styles.title}>Add plan video</p>
          <button type="button" style={styles.close} onClick={() => onClose?.()} aria-label="Close">
            ✕
          </button>
        </div>
        <p style={s.muted}>
          Record a short clip for this plan. It can appear on Feed — date and Join Me stay on the plan.
        </p>
        <form onSubmit={handleSubmit} style={styles.form}>
          <MenuplyMediaPicker
            file={file}
            onFile={setFile}
            onClear={() => setFile(null)}
            disabled={busy}
            allowPhoto={false}
            allowVideo
            source="camera"
            openOnMount
            testId="plan-video-attach-media"
            ariaLabel="Record plan video"
          />
          {error ? <p style={s.error}>{error}</p> : null}
          <button type="submit" style={s.primaryBtn} disabled={busy || !isVideoFile(file)}>
            {busy ? "Uploading…" : "Add to Feed"}
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
    zIndex: 1200,
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    padding: "16px 12px calc(var(--bottom-nav-h, 72px) + 12px)",
  },
  panel: {
    width: "min(420px, 100%)",
    background: "#fff",
    borderRadius: 18,
    padding: "16px 16px 14px",
    boxShadow: "0 18px 50px rgba(0,0,0,0.22)",
  },
  head: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 8,
  },
  title: { margin: 0, fontSize: 18, fontWeight: 900, color: "#0B0F0C" },
  close: {
    border: 0,
    background: "transparent",
    color: "#667085",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 16,
  },
  form: { display: "flex", flexDirection: "column", gap: 12 },
};
