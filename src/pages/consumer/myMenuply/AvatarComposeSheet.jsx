/**
 * About Me profile photo: native camera or library upload.
 */

import { useEffect } from "react";
import { createPortal } from "react-dom";
import MenuplyMediaPicker from "../../../components/social/MenuplyMediaPicker.jsx";

export default function AvatarComposeSheet({
  open,
  onClose,
  mediaSource = null,
  onMediaSourceChange,
  busy = false,
  onFile,
}) {
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

  if (!open || typeof document === "undefined") return null;

  const picking = mediaSource === "camera" || mediaSource === "library";

  return createPortal(
    <div
      role="presentation"
      data-testid="diner-avatar-compose-sheet"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
      style={styles.backdrop}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Change profile photo"
        style={styles.sheet}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={styles.head}>
          <p style={styles.title}>Profile photo</p>
          <button type="button" style={styles.close} onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <p style={styles.lead}>Choose a selfie or pick a photo from your library.</p>

        {picking ? (
          <div style={styles.pickerWrap}>
            <MenuplyMediaPicker
              key={mediaSource}
              onFile={(file) => {
                onFile?.(file);
              }}
              disabled={busy}
              facingMode="user"
              source={mediaSource === "library" ? "library" : "camera"}
              allowPhoto
              allowVideo={false}
              showPreview={false}
              openOnMount
              testId="diner-avatar-x-picker"
              ariaLabel={
                mediaSource === "library"
                  ? "Upload profile photo from library"
                  : "Take profile photo with camera"
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
                data-testid="diner-avatar-option-camera"
                onClick={() => onMediaSourceChange?.("camera")}
              >
                <span style={styles.actionTitle}>Take photo</span>
                <span style={styles.actionDesc}>Use your camera for a new selfie.</span>
              </button>
            </li>
            <li>
              <button
                type="button"
                style={styles.action}
                data-testid="diner-avatar-option-library"
                onClick={() => onMediaSourceChange?.("library")}
              >
                <span style={styles.actionTitle}>Upload from library</span>
                <span style={styles.actionDesc}>Choose an existing photo from your device.</span>
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
};
