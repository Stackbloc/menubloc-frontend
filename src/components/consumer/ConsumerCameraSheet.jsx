import { useEffect, useRef, useState } from "react";
import {
  countVideoInputDevices,
  formatCameraError,
  openCameraStreamWithFallback,
  photoFileFromVideoElement,
  stopMediaStream,
} from "../../lib/consumerCameraCapture.js";

/**
 * Full-screen mobile camera sheet — photo snap via getUserMedia.
 * Video uses NativeVideoCapture (OS camera), not this sheet.
 */
export default function ConsumerCameraSheet({
  open,
  onClose,
  facingMode = "environment",
  onCapture,
}) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [currentFacingMode, setCurrentFacingMode] = useState(facingMode);
  const [canFlipCamera, setCanFlipCamera] = useState(true);

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
  }, [open, facingMode]);

  useEffect(() => {
    if (!open) return undefined;

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
  }, [open, currentFacingMode]);

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

  function switchCamera() {
    if (busy) return;
    if (!canFlipCamera) {
      setError("This device only has one camera.");
      return;
    }
    setError("");
    setCurrentFacingMode((previous) =>
      previous === "environment" ? "user" : "environment"
    );
  }

  return (
    <div
      data-testid="consumer-camera-sheet"
      role="dialog"
      aria-modal="true"
      aria-label="Take photo"
      style={styles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div style={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <div style={styles.previewWrap}>
          <video
            ref={videoRef}
            style={styles.preview}
            playsInline
            muted
            autoPlay
            data-testid="consumer-camera-live"
          />

          {busy ? <div style={styles.loading}>Opening camera…</div> : null}

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
          <button
            type="button"
            style={styles.primary}
            disabled={busy || Boolean(error)}
            onClick={handleSnapPhoto}
          >
            Capture
          </button>
        </div>
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
    background: "linear-gradient(180deg, #22C55E 0%, #16A34A 100%)",
    color: "#0B0F0C",
    fontWeight: 800,
    fontSize: 14,
    cursor: "pointer",
  },
};
