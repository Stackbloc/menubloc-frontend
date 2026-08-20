/**
 * Camera icon → Camera or Upload from library (no Menuply Photo vs Video sheet).
 * Photo vs video is inferred from the returned file. Menu/OCR uploads do not use this.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { isVideoFile } from "../../lib/eatingMediaUtils.js";
import { socialBtn } from "../../lib/socialDesignTokens.js";

function buildAccept({ allowPhoto, allowVideo }) {
  if (allowPhoto && allowVideo) return "image/*,video/*";
  if (allowVideo) return "video/*";
  return "image/*";
}

function captureAttr(facingMode) {
  if (facingMode === "user") return "user";
  return "environment";
}

export default function MenuplyMediaPicker({
  onFile,
  file = null,
  onClear,
  disabled = false,
  facingMode = "environment",
  allowPhoto = true,
  allowVideo = true,
  testId = "menuply-media-picker",
  ariaLabel = "Add photo or video",
  showPreview = true,
  iconStyle,
  renderTrigger = null,
  openOnMount = false,
}) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const cameraInputRef = useRef(null);
  const libraryInputRef = useRef(null);

  const accept = useMemo(
    () => buildAccept({ allowPhoto, allowVideo }),
    [allowPhoto, allowVideo]
  );

  function openSourceSheet() {
    if (disabled) return;
    setSheetOpen(true);
  }

  function openCamera() {
    setSheetOpen(false);
    cameraInputRef.current?.click();
  }

  function openLibrary() {
    setSheetOpen(false);
    libraryInputRef.current?.click();
  }

  useEffect(() => {
    if (openOnMount && !disabled) setSheetOpen(true);
  }, [openOnMount, disabled]);

  useEffect(() => {
    if (!file) {
      setPreviewUrl("");
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function handlePick(event) {
    const picked = event.target.files?.[0] || null;
    event.target.value = "";
    setSheetOpen(false);
    if (picked) onFile?.(picked);
  }

  const isVideo = isVideoFile(file);

  return (
    <div data-testid={testId} style={{ display: "inline-flex", flexDirection: "column", gap: 8 }}>
      {showPreview && file && previewUrl ? (
        <div style={previewStyles.wrap} data-testid={`${testId}-preview`}>
          {isVideo ? (
            <video src={previewUrl} style={previewStyles.media} controls playsInline preload="metadata" />
          ) : (
            <img src={previewUrl} alt="" style={previewStyles.media} />
          )}
          <div style={previewStyles.actions}>
            <button type="button" style={previewStyles.link} disabled={disabled} onClick={openSourceSheet}>
              Replace
            </button>
            <button
              type="button"
              style={previewStyles.link}
              disabled={disabled}
              onClick={() => onClear?.()}
            >
              Remove
            </button>
          </div>
        </div>
      ) : renderTrigger ? (
        renderTrigger({ open: openSourceSheet, disabled })
      ) : (
        <button
          type="button"
          aria-label={ariaLabel}
          disabled={disabled}
          onClick={openSourceSheet}
          style={{ ...socialBtn.icon, ...iconStyle }}
          data-testid={`${testId}-trigger`}
        >
          <CameraIcon />
        </button>
      )}

      <input
        ref={cameraInputRef}
        type="file"
        accept={accept}
        capture={captureAttr(facingMode)}
        hidden
        disabled={disabled}
        data-testid={`${testId}-camera-input`}
        onChange={handlePick}
      />
      <input
        ref={libraryInputRef}
        type="file"
        accept={accept}
        hidden
        disabled={disabled}
        data-testid={`${testId}-library-input`}
        onChange={handlePick}
      />

      {sheetOpen ? (
        <div
          role="presentation"
          style={sheetStyles.backdrop}
          onClick={() => setSheetOpen(false)}
          data-testid={`${testId}-sheet`}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Add media"
            style={sheetStyles.panel}
            onClick={(e) => e.stopPropagation()}
          >
            <p style={sheetStyles.title}>Add media</p>
            <button
              type="button"
              style={sheetStyles.option}
              disabled={disabled}
              data-testid={`${testId}-option-camera`}
              onClick={openCamera}
            >
              Camera
            </button>
            <button
              type="button"
              style={sheetStyles.option}
              disabled={disabled}
              data-testid={`${testId}-option-library`}
              onClick={openLibrary}
            >
              Upload from library
            </button>
            <button type="button" style={sheetStyles.cancel} onClick={() => setSheetOpen(false)}>
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CameraIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9 4h6l1.5 2H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2.5L9 4Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="13" r="3.5" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

const previewStyles = {
  wrap: { display: "flex", flexDirection: "column", gap: 8, maxWidth: "100%" },
  media: {
    width: "100%",
    maxWidth: 320,
    height: 180,
    objectFit: "cover",
    borderRadius: 12,
    background: "#f1f5f9",
    display: "block",
  },
  actions: { display: "flex", gap: 12 },
  link: {
    appearance: "none",
    border: "none",
    background: "transparent",
    color: "#64748b",
    fontSize: 13,
    fontWeight: 600,
    textDecoration: "underline",
    cursor: "pointer",
    padding: 0,
    fontFamily: "inherit",
  },
};

const sheetStyles = {
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.45)",
    zIndex: 1200,
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    padding: "0 12px calc(var(--bottom-nav-h, 72px) + 12px)",
  },
  panel: {
    width: "100%",
    maxWidth: 420,
    background: "#fff",
    borderRadius: "16px 16px 12px 12px",
    padding: "12px 12px 8px",
    boxShadow: "0 -8px 32px rgba(15, 23, 42, 0.12)",
  },
  title: {
    margin: "4px 8px 10px",
    fontSize: 13,
    fontWeight: 700,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  option: {
    appearance: "none",
    width: "100%",
    textAlign: "left",
    border: "none",
    background: "transparent",
    padding: "14px 12px",
    fontSize: 16,
    fontWeight: 600,
    color: "#0f172a",
    borderRadius: 10,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  cancel: {
    appearance: "none",
    width: "100%",
    marginTop: 4,
    padding: "14px 12px",
    border: "none",
    background: "#f8fafc",
    borderRadius: 10,
    fontSize: 16,
    fontWeight: 700,
    color: "#64748b",
    cursor: "pointer",
    fontFamily: "inherit",
  },
};
