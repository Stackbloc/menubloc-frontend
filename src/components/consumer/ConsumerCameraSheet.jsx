import { useEffect, useRef, useState } from "react";
import {
  formatCameraError,
  openCameraStreamWithFallback,
  openVideoStreamWithFallback,
  photoFileFromVideoElement,
  pickRecorderMimeType,
  stopMediaStream,
} from "../../lib/consumerCameraCapture.js";

/**
 * Full-screen mobile camera sheet — photo snap or short video record via getUserMedia.
 */
export default function ConsumerCameraSheet({
  open,
  onClose,
  mode = "photo",
  facingMode = "environment",
  onCapture,
  onNativeFallback,
  allowModeSwitch = false,
  onModeChange,
}) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    let alive = true;
    setError("");
    setBusy(true);
    setRecording(false);
    chunksRef.current = [];

    const openStream = mode === "video" ? openVideoStreamWithFallback : openCameraStreamWithFallback;
    openStream(facingMode)
      .then((stream) => {
        if (!alive) {
          stopMediaStream(stream);
          return;
        }
        streamRef.current = stream;
        const el = videoRef.current;
        if (el) {
          el.srcObject = stream;
          el.play().catch(() => {});
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
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        try {
          recorderRef.current.stop();
        } catch {
          /* ignore */
        }
      }
      recorderRef.current = null;
      stopMediaStream(streamRef.current);
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, [open, mode, facingMode]);

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

  function startRecording() {
    if (busy || recording || !streamRef.current) return;
    const mime = pickRecorderMimeType();
    if (!mime) {
      setError("Video recording is not supported in this browser. Use Open phone camera below.");
      return;
    }
    setError("");
    chunksRef.current = [];
    try {
      const recorder = new MediaRecorder(streamRef.current, { mimeType: mime });
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data?.size) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        setBusy(true);
        try {
          const blob = new Blob(chunksRef.current, { type: mime.split(";")[0] || "video/webm" });
          const ext = blob.type.includes("mp4") ? "mp4" : "webm";
          const file = new File([blob], `menuply-video-${Date.now()}.${ext}`, { type: blob.type });
          onCapture?.(file);
          onClose?.();
        } catch (err) {
          setError(formatCameraError(err));
        } finally {
          setBusy(false);
          setRecording(false);
        }
      };
      recorder.start();
      setRecording(true);
    } catch (err) {
      setError(formatCameraError(err));
    }
  }

  function stopRecording() {
    if (!recorderRef.current || recorderRef.current.state === "inactive") return;
    recorderRef.current.stop();
  }

  return (
    <div
      data-testid="consumer-camera-sheet"
      role="dialog"
      aria-modal="true"
      aria-label={mode === "video" ? "Record video" : "Take photo"}
      style={styles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div style={styles.sheet} onClick={(e) => e.stopPropagation()}>
        {allowModeSwitch ? (
          <div style={styles.modeRow} role="tablist" aria-label="Capture mode">
            <button
              type="button"
              role="tab"
              aria-selected={mode === "photo"}
              data-testid="consumer-camera-mode-photo"
              style={{ ...styles.modeBtn, ...(mode === "photo" ? styles.modeBtnActive : null) }}
              onClick={() => onModeChange?.("photo")}
            >
              Photo
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "video"}
              data-testid="consumer-camera-mode-video"
              style={{ ...styles.modeBtn, ...(mode === "video" ? styles.modeBtnActive : null) }}
              onClick={() => onModeChange?.("video")}
            >
              Video
            </button>
          </div>
        ) : null}
        <div style={styles.previewWrap}>
          <video ref={videoRef} playsInline muted autoPlay style={styles.preview} />
          {busy && !recording ? <div style={styles.loading}>Opening camera…</div> : null}
        </div>
        {error ? (
          <div style={styles.errorWrap}>
            <p style={styles.error}>{error}</p>
            {onNativeFallback ? (
              <button
                type="button"
                style={styles.fallbackBtn}
                data-testid="consumer-camera-native-fallback"
                onClick={() => {
                  onClose?.();
                  onNativeFallback();
                }}
              >
                Open phone camera
              </button>
            ) : null}
          </div>
        ) : null}
        <div style={styles.actions}>
          <button type="button" style={styles.secondary} disabled={busy} onClick={() => onClose?.()}>
            Cancel
          </button>
          {mode === "video" ? (
            recording ? (
              <button type="button" style={styles.primary} disabled={busy} onClick={stopRecording}>
                Stop
              </button>
            ) : (
              <button type="button" style={styles.primary} disabled={busy || Boolean(error)} onClick={startRecording}>
                Record
              </button>
            )
          ) : (
            <button type="button" style={styles.primary} disabled={busy || Boolean(error)} onClick={handleSnapPhoto}>
              Capture
            </button>
          )}
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
  modeRow: {
    display: "flex",
    gap: 8,
    padding: "12px 14px 0",
  },
  modeBtn: {
    flex: 1,
    minHeight: 36,
    borderRadius: 999,
    border: "1.5px solid #d1d5db",
    background: "#fff",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    color: "#334155",
  },
  modeBtnActive: {
    borderColor: "#16A34A",
    background: "rgba(34, 197, 94, 0.12)",
    color: "#14532d",
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
  errorWrap: {
    margin: "10px 14px 0",
  },
  error: {
    margin: 0,
    fontSize: 13,
    color: "#b91c1c",
    lineHeight: 1.45,
  },
  fallbackBtn: {
    marginTop: 10,
    width: "100%",
    minHeight: 40,
    borderRadius: 10,
    border: "1.5px solid #d1d5db",
    background: "#fff",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
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
