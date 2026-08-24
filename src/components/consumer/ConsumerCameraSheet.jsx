import { useEffect, useRef, useState } from "react";
import {
  countVideoInputDevices,
  createCameraMediaRecorder,
  formatBytes,
  formatCameraError,
  MAX_RECORD_SECONDS,
  MIN_RECORDED_VIDEO_BYTES,
  openCameraStreamWithFallback,
  openVideoCaptureStreamWithFallback,
  photoFileFromVideoElement,
  stopMediaStream,
} from "../../lib/consumerCameraCapture.js";

/**
 * Full-screen mobile camera sheet — photo snap or short video record
 * via getUserMedia.
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
  const reviewVideoRef = useRef(null);
  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const mimeRef = useRef("video/webm");
  const recordStartedAtRef = useRef(0);
  const timerRef = useRef(null);
  const reviewUrlRef = useRef("");

  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [currentFacingMode, setCurrentFacingMode] = useState(facingMode);
  const [canFlipCamera, setCanFlipCamera] = useState(true);
  const [reviewFile, setReviewFile] = useState(null);
  const [reviewUrl, setReviewUrl] = useState("");

  function clearReview() {
    if (reviewUrlRef.current) {
      URL.revokeObjectURL(reviewUrlRef.current);
      reviewUrlRef.current = "";
    }
    setReviewFile(null);
    setReviewUrl("");
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
    setRecording(false);
    setElapsedSec(0);
    clearReview();
    chunksRef.current = [];

    const previous = streamRef.current;
    streamRef.current = null;

    // Video mode: smaller frames + video-only (no mic) so short clips upload
    // reliably. Audio in MediaRecorder often yields black clips on mobile.
    const openStream =
      mode === "video" ? openVideoCaptureStreamWithFallback : openCameraStreamWithFallback;
    openStream(currentFacingMode, previous)
      .then(async (stream) => {
        if (!alive) {
          stopMediaStream(stream);
          return;
        }

        streamRef.current = stream;

        const el = videoRef.current;
        if (el) {
          el.srcObject = stream;
          el.muted = true;
          el.playsInline = true;
          el.play().catch(() => {});
        }

        try {
          const count = await countVideoInputDevices();
          if (alive) setCanFlipCamera(count > 1);
        } catch {
          if (alive) setCanFlipCamera(true);
        }
      })
      .catch((err) => {
        if (alive) {
          setError(formatCameraError(err));
        }
      })
      .finally(() => {
        if (alive) {
          setBusy(false);
        }
      });

    return () => {
      alive = false;
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
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
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      if (reviewUrlRef.current) {
        URL.revokeObjectURL(reviewUrlRef.current);
        reviewUrlRef.current = "";
      }
    };
  }, [open, mode, currentFacingMode]);

  useEffect(() => {
    if (!recording) {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return undefined;
    }
    recordStartedAtRef.current = Date.now();
    setElapsedSec(0);
    timerRef.current = window.setInterval(() => {
      const sec = Math.floor((Date.now() - recordStartedAtRef.current) / 1000);
      setElapsedSec(sec);
      if (sec >= MAX_RECORD_SECONDS) {
        const recorder = recorderRef.current;
        if (recorder && recorder.state === "recording") {
          try {
            if (typeof recorder.requestData === "function") recorder.requestData();
          } catch {
            /* ignore */
          }
          try {
            recorder.stop();
          } catch {
            /* ignore */
          }
        }
      }
    }, 250);
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [recording]);

  useEffect(() => {
    const el = reviewVideoRef.current;
    if (!el || !reviewUrl) return undefined;
    const paintFrame = () => {
      try {
        if (el.duration && Number.isFinite(el.duration)) {
          el.currentTime = Math.min(0.1, el.duration * 0.05);
        }
      } catch {
        /* ignore seek errors */
      }
      el.play().catch(() => {});
    };
    el.addEventListener("loadeddata", paintFrame);
    el.addEventListener("loadedmetadata", paintFrame);
    return () => {
      el.removeEventListener("loadeddata", paintFrame);
      el.removeEventListener("loadedmetadata", paintFrame);
    };
  }, [reviewUrl]);

  if (!open) return null;

  async function handleSnapPhoto() {
    if (busy || reviewFile || !videoRef.current) return;

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
    if (busy || recording || reviewFile || !streamRef.current) {
      return;
    }

    setError("");
    chunksRef.current = [];

    try {
      const { recorder, mimeType } = createCameraMediaRecorder(streamRef.current);
      mimeRef.current = mimeType;
      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data?.size) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onerror = () => {
        setError("Recording failed. Try again or use Open phone camera.");
        setRecording(false);
        recorderRef.current = null;
      };

      recorder.onstop = () => {
        setBusy(true);
        try {
          const mime = mimeRef.current.split(";")[0] || "video/webm";
          const blob = new Blob(chunksRef.current, { type: mime });
          if (!chunksRef.current.length || blob.size < MIN_RECORDED_VIDEO_BYTES) {
            setError(
              "No video was captured. Hold Record longer, try again, or use Open phone camera."
            );
            setRecording(false);
            return;
          }

          const baseType = String(blob.type || mime || "video/webm")
            .split(";")[0]
            .trim()
            .toLowerCase();
          const ext = baseType.includes("mp4") ? "mp4" : "webm";
          const file = new File([blob], `menuply-video-${Date.now()}.${ext}`, {
            type: baseType.includes("mp4") ? "video/mp4" : "video/webm",
          });

          if (reviewUrlRef.current) URL.revokeObjectURL(reviewUrlRef.current);
          const url = URL.createObjectURL(file);
          reviewUrlRef.current = url;
          setReviewFile(file);
          setReviewUrl(url);
          if (videoRef.current) {
            videoRef.current.pause();
          }
        } catch (err) {
          setError(formatCameraError(err));
        } finally {
          setBusy(false);
          setRecording(false);
          recorderRef.current = null;
        }
      };

      recorder.start(250);
      setRecording(true);
    } catch (err) {
      setError(formatCameraError(err));
    }
  }

  function stopRecording() {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      return;
    }
    try {
      if (typeof recorder.requestData === "function" && recorder.state === "recording") {
        recorder.requestData();
      }
    } catch {
      /* ignore */
    }
    recorder.stop();
  }

  function useReviewedVideo() {
    if (!reviewFile) return;
    const file = reviewFile;
    clearReview();
    onCapture?.(file);
    onClose?.();
  }

  function retakeVideo() {
    clearReview();
    setError("");
    const el = videoRef.current;
    if (el && streamRef.current) {
      el.srcObject = streamRef.current;
      el.play().catch(() => {});
    }
  }

  function abandonAndClose() {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      try {
        recorderRef.current.onstop = null;
        recorderRef.current.stop();
      } catch {
        /* ignore */
      }
      recorderRef.current = null;
    }
    setRecording(false);
    clearReview();
    onClose?.();
  }

  function switchCamera() {
    if (busy || recording || reviewFile) return;
    if (!canFlipCamera) {
      setError("This device only has one camera.");
      return;
    }
    setError("");
    setCurrentFacingMode((previous) =>
      previous === "environment" ? "user" : "environment"
    );
  }

  const elapsedLabel = `${Math.floor(elapsedSec / 60)}:${String(elapsedSec % 60).padStart(2, "0")}`;
  const reviewing = Boolean(reviewFile && reviewUrl);

  return (
    <div
      data-testid="consumer-camera-sheet"
      role="dialog"
      aria-modal="true"
      aria-label={mode === "video" ? "Record video" : "Take photo"}
      style={styles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget && !recording) {
          abandonAndClose();
        }
      }}
    >
      <div style={styles.sheet} onClick={(e) => e.stopPropagation()}>
        {allowModeSwitch && !reviewing ? (
          <div style={styles.modeRow} role="tablist" aria-label="Capture mode">
            <button
              type="button"
              role="tab"
              aria-selected={mode === "photo"}
              data-testid="consumer-camera-mode-photo"
              disabled={recording}
              style={{
                ...styles.modeBtn,
                ...(mode === "photo" ? styles.modeBtnActive : null),
              }}
              onClick={() => onModeChange?.("photo")}
            >
              Photo
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "video"}
              data-testid="consumer-camera-mode-video"
              disabled={recording}
              style={{
                ...styles.modeBtn,
                ...(mode === "video" ? styles.modeBtnActive : null),
              }}
              onClick={() => onModeChange?.("video")}
            >
              Video
            </button>
          </div>
        ) : null}

        <div
          style={{
            ...styles.previewWrap,
            ...(recording ? styles.previewWrapRecording : null),
          }}
        >
          {reviewing ? (
            <video
              ref={reviewVideoRef}
              key={reviewUrl}
              src={reviewUrl}
              style={styles.preview}
              playsInline
              muted
              autoPlay
              controls
              loop
              preload="auto"
              data-testid="consumer-camera-review-video"
            />
          ) : (
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              style={styles.preview}
            />
          )}

          {busy && !recording && !reviewing ? (
            <div style={styles.loading}>Opening camera…</div>
          ) : null}

          {recording ? (
            <div
              data-testid="consumer-camera-recording-badge"
              style={styles.recBadge}
              aria-live="polite"
            >
              <span style={styles.recDot} aria-hidden />
              <span style={styles.recLabel}>REC</span>
              <span data-testid="consumer-camera-recording-timer" style={styles.recTimer}>
                {elapsedLabel}
              </span>
              <span style={styles.recMaxHint}>/{MAX_RECORD_SECONDS}s</span>
            </div>
          ) : null}

          {reviewing ? (
            <div data-testid="consumer-camera-review-meta" style={styles.reviewMeta}>
              Review clip · {formatBytes(reviewFile.size)}
            </div>
          ) : null}

          {!reviewing ? (
            <button
              type="button"
              aria-label="Switch camera"
              data-testid="consumer-camera-switch"
              disabled={busy || recording || !canFlipCamera}
              onClick={switchCamera}
              style={{
                ...styles.switchCameraBtn,
                ...(canFlipCamera ? null : styles.switchCameraBtnDisabled),
              }}
            >
              ↻
            </button>
          ) : null}
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
                  abandonAndClose();
                  onNativeFallback();
                }}
              >
                Open phone camera
              </button>
            ) : null}
          </div>
        ) : null}

        <div style={styles.actions}>
          {reviewing ? (
            <>
              <button
                type="button"
                style={styles.secondary}
                data-testid="consumer-camera-retake"
                onClick={retakeVideo}
              >
                Retake
              </button>
              <button
                type="button"
                style={styles.primary}
                data-testid="consumer-camera-use-video"
                onClick={useReviewedVideo}
              >
                Use video
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                style={styles.secondary}
                disabled={busy && !recording}
                onClick={abandonAndClose}
              >
                Cancel
              </button>

              {mode === "video" ? (
                recording ? (
                  <button
                    type="button"
                    style={styles.stopBtn}
                    data-testid="consumer-camera-stop"
                    disabled={busy}
                    onClick={stopRecording}
                  >
                    Stop
                  </button>
                ) : (
                  <button
                    type="button"
                    style={styles.primary}
                    data-testid="consumer-camera-record"
                    disabled={busy || Boolean(error)}
                    onClick={startRecording}
                  >
                    Record
                  </button>
                )
              ) : (
                <button
                  type="button"
                  style={styles.primary}
                  disabled={busy || Boolean(error)}
                  onClick={handleSnapPhoto}
                >
                  Capture
                </button>
              )}
            </>
          )}
        </div>
      </div>
      <style>{`
        @keyframes menuply-rec-pulse {
          0% { box-shadow: 0 0 0 0 rgba(248, 113, 113, 0.7); opacity: 1; }
          70% { box-shadow: 0 0 0 10px rgba(248, 113, 113, 0); opacity: 0.85; }
          100% { box-shadow: 0 0 0 0 rgba(248, 113, 113, 0); opacity: 1; }
        }
      `}</style>
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
  previewWrapRecording: {
    boxShadow: "inset 0 0 0 3px #ef4444",
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
  recBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 10px",
    borderRadius: 999,
    background: "rgba(127, 29, 29, 0.88)",
    color: "#fff",
    fontWeight: 800,
    fontSize: 12,
    letterSpacing: "0.04em",
  },
  recDot: {
    width: 10,
    height: 10,
    borderRadius: "50%",
    background: "#f87171",
    animation: "menuply-rec-pulse 1.1s ease-out infinite",
  },
  recLabel: {
    fontSize: 12,
  },
  recTimer: {
    fontVariantNumeric: "tabular-nums",
    fontWeight: 700,
    opacity: 0.95,
  },
  recMaxHint: {
    fontVariantNumeric: "tabular-nums",
    fontWeight: 600,
    opacity: 0.75,
  },
  reviewMeta: {
    position: "absolute",
    left: 12,
    bottom: 12,
    padding: "6px 10px",
    borderRadius: 999,
    background: "rgba(15, 23, 42, 0.78)",
    color: "#fff",
    fontSize: 12,
    fontWeight: 700,
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
  stopBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    border: "none",
    background: "linear-gradient(180deg, #f87171 0%, #dc2626 100%)",
    color: "#fff",
    fontWeight: 800,
    fontSize: 14,
    cursor: "pointer",
  },
};
