import { useEffect, useId, useRef, useState } from "react";
import {
  countVideoInputDevices,
  formatCameraError,
  openCameraStreamWithFallback,
  photoFileFromVideoElement,
  stopMediaStream,
} from "../../lib/consumerCameraCapture.js";
import {
  captureAttrForFacing,
  normalizeNativeVideoFile,
} from "../../lib/nativeVideoCapture.js";

/**
 * Full-screen mobile camera sheet.
 * Photo → live getUserMedia snap.
 * Video → OS-native recorder via <label> + <input capture> (not MediaRecorder,
 * and not button→input.click() — that opens a file picker on many phones).
 *
 * Mode chips order when allowVideo: Video | Photo (video first).
 */
export default function ConsumerCameraSheet({
  open,
  onClose,
  facingMode = "environment",
  onCapture,
  allowVideo = false,
  /** Default video when allowVideo so Video|Photo opens on Video. */
  initialMode = "video",
}) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const nativeVideoInputId = useId();

  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [currentFacingMode, setCurrentFacingMode] = useState(facingMode);
  const [canFlipCamera, setCanFlipCamera] = useState(true);
  const [mode, setMode] = useState(() =>
    allowVideo ? (initialMode === "photo" ? "photo" : "video") : "photo"
  );

  const photoMode = !allowVideo || mode === "photo";

  function attachLivePreview(stream) {
    const el = videoRef.current;
    if (!el || !stream) return;
    el.removeAttribute("src");
    el.srcObject = stream;
    el.muted = true;
    el.defaultMuted = true;
    el.playsInline = true;
    el.setAttribute("playsinline", "true");
    el.setAttribute("webkit-playsinline", "true");
    el.autoplay = true;
    el.controls = false;
    el.play().catch(() => {});
  }

  useEffect(() => {
    if (!open) return;
    setCurrentFacingMode(facingMode);
    setMode(allowVideo ? (initialMode === "photo" ? "photo" : "video") : "photo");
    setError("");
  }, [open, facingMode, allowVideo, initialMode]);

  useEffect(() => {
    if (!open) return undefined;

    // Free the camera so the OS recorder can claim it in video mode.
    if (!photoMode) {
      stopMediaStream(streamRef.current);
      streamRef.current = null;
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.removeAttribute("src");
      }
      return undefined;
    }

    let alive = true;

    setError("");
    setBusy(true);

    const previous = streamRef.current;
    streamRef.current = null;

    openCameraStreamWithFallback(currentFacingMode, previous)
      .then(async (stream) => {
        if (!alive) {
          stopMediaStream(stream);
          return;
        }

        streamRef.current = stream;
        attachLivePreview(stream);

        try {
          const count = await countVideoInputDevices();
          if (alive) setCanFlipCamera(count > 1);
        } catch {
          if (alive) setCanFlipCamera(true);
        }
      })
      .catch((err) => {
        if (alive) setError(formatCameraError(err));
      })
      .finally(() => {
        if (alive) setBusy(false);
      });

    return () => {
      alive = false;
      stopMediaStream(streamRef.current);
      streamRef.current = null;
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.removeAttribute("src");
      }
    };
  }, [open, currentFacingMode, photoMode]);

  if (!open) return null;

  async function handleSnapPhoto() {
    if (busy || !videoRef.current) return;

    setBusy(true);
    setError("");

    try {
      const file = await photoFileFromVideoElement(videoRef.current, "menuply-photo");
      onCapture?.(file);
      onClose?.();
    } catch (err) {
      setError(formatCameraError(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleNativeVideoPick(event) {
    const picked = event.target.files?.[0] || null;
    event.target.value = "";
    if (!picked) return;

    setBusy(true);
    setError("");
    try {
      const file = await normalizeNativeVideoFile(picked);
      onCapture?.(file);
      onClose?.();
    } catch (err) {
      setError(String(err?.message || "Could not use that video."));
    } finally {
      setBusy(false);
    }
  }

  function switchCamera() {
    if (busy || !photoMode) return;
    if (!canFlipCamera) {
      setError("This device only has one camera.");
      return;
    }
    setError("");
    setCurrentFacingMode((previous) =>
      previous === "environment" ? "user" : "environment"
    );
  }

  function selectMode(next) {
    if (!allowVideo || busy) return;
    setError("");
    setMode(next);
  }

  return (
    <div
      data-testid="consumer-camera-sheet"
      role="dialog"
      aria-modal="true"
      aria-label={photoMode ? "Take photo" : "Record video"}
      style={styles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div style={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <div style={styles.previewWrap}>
          {photoMode ? (
            <video
              ref={videoRef}
              style={styles.preview}
              playsInline
              muted
              autoPlay
              data-testid="consumer-camera-live"
            />
          ) : (
            <div style={styles.videoIdle} data-testid="consumer-camera-video-idle" aria-hidden="true" />
          )}

          {busy ? <div style={styles.loading}>{photoMode ? "Opening camera…" : "Checking video…"}</div> : null}

          {photoMode ? (
            <button
              type="button"
              aria-label="Switch camera"
              data-testid="consumer-camera-switch"
              disabled={busy || !canFlipCamera}
              onClick={switchCamera}
              style={{
                ...styles.switchCameraBtn,
                ...(canFlipCamera ? null : styles.switchCameraBtnDisabled),
              }}
            >
              ↻
            </button>
          ) : null}

          {allowVideo ? (
            <div style={styles.modeRow} role="tablist" aria-label="Camera mode">
              <button
                type="button"
                role="tab"
                aria-selected={!photoMode}
                data-testid="consumer-camera-mode-video"
                disabled={busy}
                onClick={() => selectMode("video")}
                style={{
                  ...styles.modeChip,
                  ...(!photoMode ? styles.modeChipActive : null),
                }}
              >
                Video
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={photoMode}
                data-testid="consumer-camera-mode-photo"
                disabled={busy}
                onClick={() => selectMode("photo")}
                style={{
                  ...styles.modeChip,
                  ...(photoMode ? styles.modeChipActive : null),
                }}
              >
                Photo
              </button>
            </div>
          ) : null}
        </div>

        {error ? (
          <div style={styles.errorWrap}>
            <p style={styles.error}>{error}</p>
          </div>
        ) : null}

        <div style={styles.actions}>
          <button type="button" style={styles.secondary} disabled={busy} onClick={() => onClose?.()}>
            Cancel
          </button>
          {photoMode ? (
            <button
              type="button"
              style={styles.primary}
              disabled={busy || Boolean(error)}
              onClick={handleSnapPhoto}
              data-testid="consumer-camera-capture"
            >
              Capture
            </button>
          ) : (
            /* Label → input: user gesture must hit the capture input or many phones open a file picker. */
            <label
              htmlFor={busy ? undefined : nativeVideoInputId}
              style={{
                ...styles.primary,
                ...styles.recordLabel,
                ...(busy ? styles.recordLabelBusy : null),
              }}
              data-testid="consumer-camera-record-native"
              aria-disabled={busy}
              onClick={(e) => {
                if (busy) e.preventDefault();
              }}
            >
              Record video
            </label>
          )}
        </div>

        {allowVideo ? (
          <input
            id={nativeVideoInputId}
            type="file"
            accept="video/*"
            capture={captureAttrForFacing(currentFacingMode)}
            style={styles.visuallyHiddenInput}
            disabled={busy}
            data-testid="consumer-camera-native-video-input"
            onChange={handleNativeVideoPick}
          />
        ) : null}
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 13000,
    background: "rgba(15, 23, 42, 0.72)",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    padding: 12,
  },
  sheet: {
    width: "100%",
    maxWidth: 480,
    background: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    boxShadow: "0 20px 50px rgba(0,0,0,0.28)",
  },
  previewWrap: {
    position: "relative",
    background: "#0f172a",
    aspectRatio: "3 / 4",
    maxHeight: "62vh",
  },
  preview: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
    background: "#0f172a",
  },
  videoIdle: {
    width: "100%",
    height: "100%",
    background: "linear-gradient(165deg, #080d09 0%, #0f172a 55%, #14532d 100%)",
  },
  loading: {
    position: "absolute",
    inset: 0,
    display: "grid",
    placeItems: "center",
    color: "#fff",
    fontWeight: 600,
    background: "rgba(15, 23, 42, 0.35)",
  },
  switchCameraBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 44,
    height: 44,
    borderRadius: "50%",
    border: "1px solid rgba(255,255,255,0.5)",
    background: "rgba(0,0,0,0.55)",
    color: "#fff",
    fontSize: 25,
    lineHeight: 1,
    fontWeight: 700,
    cursor: "pointer",
    display: "grid",
    placeItems: "center",
  },
  switchCameraBtnDisabled: {
    opacity: 0.35,
    cursor: "not-allowed",
  },
  modeRow: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    display: "flex",
    gap: 8,
    justifyContent: "center",
  },
  modeChip: {
    minWidth: 88,
    minHeight: 36,
    padding: "0 14px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.35)",
    background: "rgba(0,0,0,0.45)",
    color: "rgba(255,255,255,0.85)",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
  },
  modeChipActive: {
    background: "#1dd8a0",
    borderColor: "#1dd8a0",
    color: "#06120d",
  },
  errorWrap: {
    margin: "10px 14px 0",
  },
  error: {
    margin: 0,
    fontSize: 13,
    color: "#b91c1c",
    lineHeight: 1.45,
  },
  actions: {
    display: "flex",
    gap: 10,
    padding: 14,
  },
  secondary: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    border: "1.5px solid #d1d5db",
    background: "#fff",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
  },
  primary: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    border: "none",
    background: "linear-gradient(135deg, #1dd8a0, #12b981)",
    color: "#06120d",
    fontWeight: 800,
    fontSize: 14,
    cursor: "pointer",
  },
  recordLabel: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxSizing: "border-box",
  },
  recordLabelBusy: {
    opacity: 0.55,
    cursor: "not-allowed",
  },
  visuallyHiddenInput: {
    position: "absolute",
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: "hidden",
    clip: "rect(0, 0, 0, 0)",
    whiteSpace: "nowrap",
    border: 0,
  },
};
