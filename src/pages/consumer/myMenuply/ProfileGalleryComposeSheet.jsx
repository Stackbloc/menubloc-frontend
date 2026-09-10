/**
 * X → Profile gallery: choose native camera or library upload,
 * then capture into the About profile gallery.
 * Photos may optionally be pinned to My Highlights (max 3).
 */

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import MenuplyMediaPicker from "../../../components/social/MenuplyMediaPicker.jsx";

function isPhotoFile(file) {
  const type = String(file?.type || "").toLowerCase();
  if (type.startsWith("image/")) return true;
  if (type.startsWith("video/")) return false;
  const name = String(file?.name || "").toLowerCase();
  return /\.(jpe?g|png|gif|webp|heic|heif)$/i.test(name);
}

export default function ProfileGalleryComposeSheet({
  open,
  onClose,
  mediaSource = null,
  onMediaSourceChange,
  busy = false,
  onFile,
  highlightCount = 0,
  maxHighlights = 3,
  preferHighlight = false,
}) {
  const [pendingFile, setPendingFile] = useState(null);
  const [addToHighlights, setAddToHighlights] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");

  const pendingIsPhoto = useMemo(
    () => (pendingFile ? isPhotoFile(pendingFile) : false),
    [pendingFile]
  );
  const highlightsFull = Number(highlightCount) >= Number(maxHighlights);

  useEffect(() => {
    if (!open) {
      setPendingFile(null);
      setAddToHighlights(false);
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return "";
      });
    }
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    function onKey(event) {
      if (event.key === "Escape") onClose?.();
    }
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!pendingFile) {
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return "";
      });
      return undefined;
    }
    const url = URL.createObjectURL(pendingFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [pendingFile]);

  if (!open || typeof document === "undefined") return null;

  const picking = mediaSource === "camera" || mediaSource === "library";

  function handlePickedFile(file) {
    if (!file) return;
    if (isPhotoFile(file)) {
      setPendingFile(file);
      setAddToHighlights(Boolean(preferHighlight) && !highlightsFull);
      return;
    }
    // Videos go straight to gallery — My Highlights are photos only.
    onFile?.(file, { is_highlight: false });
  }

  function confirmPending() {
    if (!pendingFile) return;
    const pin = pendingIsPhoto && addToHighlights && !highlightsFull;
    onFile?.(pendingFile, { is_highlight: pin });
    setPendingFile(null);
    setAddToHighlights(false);
  }

  const sheetTitle = preferHighlight ? "My Highlights" : "Profile gallery";
  const sheetLead = preferHighlight
    ? "Add a photo of a food experience that is about you — Thanksgiving, a meal you prepared, a moment worth sharing. Up to three photos."
    : "Add a photo or short video about you — not your eating diary.";

  return createPortal(
    <div
      role="presentation"
      data-testid="profile-gallery-compose-sheet"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
      style={styles.backdrop}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={sheetTitle}
        style={styles.sheet}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={styles.head}>
          <p style={styles.title}>{sheetTitle}</p>
          <button type="button" style={styles.close} onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <p style={styles.lead}>{sheetLead}</p>

        {pendingFile ? (
          <div style={styles.confirm} data-testid="profile-gallery-highlight-confirm">
            {previewUrl && pendingIsPhoto ? (
              <img src={previewUrl} alt="" style={styles.preview} />
            ) : null}
            <label style={styles.checkRow}>
              <input
                type="checkbox"
                checked={addToHighlights}
                disabled={!pendingIsPhoto || highlightsFull || busy}
                onChange={(e) => setAddToHighlights(e.target.checked)}
                data-testid="profile-gallery-add-to-highlights"
              />
              <span>
                Add to My Highlights
                <span style={styles.checkHint}>
                  {highlightsFull
                    ? ` · ${maxHighlights} highlights already set`
                    : ` · photos only · up to ${maxHighlights}`}
                </span>
              </span>
            </label>
            <div style={styles.confirmActions}>
              <button
                type="button"
                style={styles.secondary}
                disabled={busy}
                onClick={() => {
                  setPendingFile(null);
                  setAddToHighlights(false);
                }}
              >
                Back
              </button>
              <button
                type="button"
                style={styles.primary}
                disabled={busy}
                data-testid="profile-gallery-confirm-upload"
                onClick={confirmPending}
              >
                {busy ? "Uploading…" : "Upload"}
              </button>
            </div>
          </div>
        ) : picking ? (
          <div style={styles.pickerWrap}>
            <MenuplyMediaPicker
              key={mediaSource}
              onFile={handlePickedFile}
              disabled={busy}
              facingMode="user"
              source={mediaSource === "library" ? "library" : "camera"}
              allowPhoto
              allowVideo={!preferHighlight}
              showPreview={false}
              openOnMount
              testId="profile-gallery-x-picker"
              ariaLabel={
                preferHighlight
                  ? mediaSource === "library"
                    ? "Upload a My Highlights photo from library"
                    : "Take a My Highlights photo with camera"
                  : mediaSource === "library"
                    ? "Upload profile gallery photo or video from library"
                    : "Take profile gallery photo or video with camera"
              }
            />
            <button
              type="button"
              style={styles.back}
              onClick={() => onMediaSourceChange?.(null)}
            >
              Choose a different option
            </button>
          </div>
        ) : (
          <ul style={styles.list}>
            <li>
              <button
                type="button"
                style={styles.action}
                data-testid="profile-gallery-option-camera"
                onClick={() => onMediaSourceChange?.("camera")}
              >
                <span style={styles.actionTitle}>Native camera</span>
                <span style={styles.actionDesc}>
                  {preferHighlight
                    ? "Take a highlight photo with your camera."
                    : "Take a photo or video with your camera."}
                </span>
              </button>
            </li>
            <li>
              <button
                type="button"
                style={styles.action}
                data-testid="profile-gallery-option-library"
                onClick={() => onMediaSourceChange?.("library")}
              >
                <span style={styles.actionTitle}>Upload from library</span>
                <span style={styles.actionDesc}>
                  {preferHighlight
                    ? "Choose an existing photo from your device."
                    : "Choose an existing photo or video from your device."}
                </span>
              </button>
            </li>
          </ul>
        )}
      </div>
    </div>,
    document.body
  );
}

const styles = {
  backdrop: {
    position: "fixed",
    inset: 0,
    zIndex: 1100,
    background: "rgba(15, 23, 42, 0.48)",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    padding: "0 12px calc(var(--bottom-nav-h, 72px) + 12px)",
  },
  sheet: {
    width: "100%",
    maxWidth: 480,
    background: "#fff",
    borderRadius: "20px 20px 14px 14px",
    padding: "16px 16px 20px",
    boxShadow: "0 -12px 40px rgba(15, 23, 42, 0.18)",
  },
  head: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  title: { margin: 0, fontSize: 17, fontWeight: 800, color: "#0f172a" },
  close: {
    appearance: "none",
    border: "none",
    background: "transparent",
    fontSize: 18,
    color: "#64748b",
    cursor: "pointer",
    padding: 4,
  },
  lead: { margin: "8px 0 12px", fontSize: 13, color: "#64748b", lineHeight: 1.4 },
  list: { listStyle: "none", margin: 0, padding: 0 },
  action: {
    width: "100%",
    textAlign: "left",
    border: 0,
    background: "transparent",
    padding: "12px 4px",
    borderTop: "1px solid #f2f4f7",
    cursor: "pointer",
    font: "inherit",
  },
  actionTitle: { display: "block", fontSize: 15, fontWeight: 800, color: "#1F4E3D" },
  actionDesc: { display: "block", marginTop: 2, fontSize: 12, color: "#667085" },
  pickerWrap: { display: "grid", gap: 12, paddingTop: 4 },
  back: {
    appearance: "none",
    border: "none",
    background: "transparent",
    color: "#64748b",
    fontSize: 13,
    fontWeight: 600,
    textDecoration: "underline",
    cursor: "pointer",
    padding: 0,
    font: "inherit",
    textAlign: "left",
  },
  confirm: { display: "grid", gap: 12 },
  preview: {
    width: "100%",
    maxHeight: 220,
    objectFit: "cover",
    borderRadius: 12,
    background: "#f1f5f9",
  },
  checkRow: {
    display: "flex",
    gap: 8,
    alignItems: "flex-start",
    fontSize: 14,
    fontWeight: 650,
    color: "#0f172a",
    cursor: "pointer",
  },
  checkHint: {
    display: "block",
    marginTop: 2,
    fontSize: 12,
    fontWeight: 500,
    color: "#64748b",
  },
  confirmActions: { display: "flex", gap: 8, justifyContent: "flex-end" },
  secondary: {
    appearance: "none",
    border: "1px solid #e2e8f0",
    background: "#fff",
    borderRadius: 10,
    padding: "10px 14px",
    fontSize: 13,
    fontWeight: 700,
    color: "#475569",
    cursor: "pointer",
  },
  primary: {
    appearance: "none",
    border: "none",
    background: "#1F4E3D",
    color: "#fff",
    borderRadius: 10,
    padding: "10px 14px",
    fontSize: 13,
    fontWeight: 750,
    cursor: "pointer",
  },
};
