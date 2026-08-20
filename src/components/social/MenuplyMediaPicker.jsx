/**
 * Camera icon → native device camera (capture). Photo vs video inferred from the file.
 * Library uploads go through Post about → Upload from library (source="library").
 * Menu/OCR uploads do not use this.
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
  /** "camera" = native capture; "library" = files/photos without capture */
  source = "camera",
  testId = "menuply-media-picker",
  ariaLabel = "Add photo or video",
  showPreview = true,
  iconStyle,
  renderTrigger = null,
  openOnMount = false,
}) {
  const [previewUrl, setPreviewUrl] = useState("");
  const inputRef = useRef(null);
  const useLibrary = source === "library";

  const accept = useMemo(
    () => buildAccept({ allowPhoto, allowVideo }),
    [allowPhoto, allowVideo]
  );

  function openNative() {
    if (disabled) return;
    inputRef.current?.click();
  }

  useEffect(() => {
    if (openOnMount && !disabled) openNative();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- open once on mount when requested
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
            <button type="button" style={previewStyles.link} disabled={disabled} onClick={openNative}>
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
        renderTrigger({ open: openNative, disabled })
      ) : (
        <button
          type="button"
          aria-label={ariaLabel}
          disabled={disabled}
          onClick={openNative}
          style={{ ...socialBtn.icon, ...iconStyle }}
          data-testid={`${testId}-trigger`}
        >
          <CameraIcon />
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        {...(useLibrary ? {} : { capture: captureAttr(facingMode) })}
        hidden
        disabled={disabled}
        data-testid={useLibrary ? `${testId}-library-input` : `${testId}-camera-input`}
        onChange={handlePick}
      />
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
