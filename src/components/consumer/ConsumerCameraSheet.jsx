import { useEffect, useId, useRef, useState } from "react";
import {
  capturePosterFromVideoElement,
  countVideoInputDevices,
  createCameraMediaRecorder,
  formatBytes,
  formatCameraError,
  MAX_RECORD_SECONDS,
  MIN_RECORDED_VIDEO_BYTES,
  openCameraStreamWithFallback,
  openVideoCaptureStreamWithFallback,
  photoFileFromVideoElement,
  preferDesktopInlineVideoRecord,
  stopMediaStream,
  validateRecordedVideoBlob,
} from "../../lib/consumerCameraCapture.js";
import {
  captureAttrForFacing,
  normalizeNativeVideoFile,
  preferNativeOsVideoCapture,
} from "../../lib/nativeVideoCapture.js";

/**
 * Full-screen camera sheet.
 * Photo → live getUserMedia snap (all devices).
 * Video on desktop (MacBook) → in-sheet MediaRecorder + webcam.
 * Video on phone/tablet → OS-native <label>+<input capture> (not button.click).
 *
 * Mode chips when allowVideo: Video | Photo (video first).
 */
export default function ConsumerCameraSheet({
  open,
  onClose,
  facingMode = "environment",
  onCapture,
  allowPhoto = true,
  allowVideo = false,
  /** Default video when allowVideo so Video|Photo opens on Video. */
  initialMode = "video",
}) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const recorderCleanupRef = useRef(() => {});
  const chunksRef = useRef([]);
  const mimeRef = useRef("video/webm");
  const recordStartedAtRef = useRef(0);
  const timerRef = useRef(null);
  const reviewUrlRef = useRef("");
  const nativeVideoInputId = useId();

  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [currentFacingMode, setCurrentFacingMode] = useState(facingMode);
  const [canFlipCamera, setCanFlipCamera] = useState(true);
  const [reviewFile, setReviewFile] = useState(null);
  const [reviewUrl, setReviewUrl] = useState("");
  const [reviewPoster, setReviewPoster] = useState("");
  const [mode, setMode] = useState(() =>
    !allowPhoto && allowVideo
      ? "video"
      : allowVideo
        ? initialMode === "photo"
          ? "photo"
          : "video"
        : "photo"
  );
  const [desktopInlineVideo] = useState(() => preferDesktopInlineVideoRecord());
  const [phoneNativeVideo] = useState(() => preferNativeOsVideoCapture());

  const photoMode = allowPhoto && (!allowVideo || mode === "photo");
  const inlineVideoMode = allowVideo && !photoMode && desktopInlineVideo && !phoneNativeVideo;
  const nativeVideoMode = allowVideo && !photoMode && !inlineVideoMode;
  const needsLivePreview = photoMode || inlineVideoMode;
  const reviewing = Boolean(reviewFile && reviewUrl);

  function clearReview() {
    if (reviewUrlRef.current) {
      URL.revokeObjectURL(reviewUrlRef.current);
      reviewUrlRef.current = "";
    }
    setReviewFile(null);
    setReviewUrl("");
    setReviewPoster("");
  }

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
    el.loop = false;
    el.play().catch(() => {});
  }

  function showBlobReview(url, posterDataUrl) {
    const el = videoRef.current;
    if (!el) return;
    try {
      el.pause();
    } catch {
      /* ignore */
    }
    el.removeAttribute("src");
    el.srcObject = null;
    el.load();
    el.poster = posterDataUrl || "";
    el.muted = true;
    el.defaultMuted = true;
    el.playsInline = true;
    el.setAttribute("playsinline", "true");
    el.setAttribute("webkit-playsinline", "true");
    // No native controls — Chrome's bar includes Download (file prompt).
    el.controls = false;
    el.loop = true;
    el.autoplay = true;
    el.src = url;
    el.load();
    el.play().catch(() => {});
  }

  useEffect(() => {
    if (!open) return;
    setCurrentFacingMode(facingMode);
    setMode(
      !allowPhoto && allowVideo
        ? "video"
        : allowVideo
          ? initialMode === "photo"
            ? "photo"
            : "video"
          : "photo"
    );
    setError("");
    setRecording(false);
    clearReview();
  }, [open, facingMode, allowPhoto, allowVideo, initialMode]);

  useEffect(() => {
    if (!open) return undefined;

    if (!needsLivePreview) {
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

    const openStream = inlineVideoMode
      ? openVideoCaptureStreamWithFallback
      : openCameraStreamWithFallback;

    openStream(currentFacingMode, previous)
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
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        try {
          recorderRef.current.onstop = null;
          recorderRef.current.stop();
        } catch {
          /* ignore */
        }
      }
      recorderRef.current = null;
      try {
        recorderCleanupRef.current?.();
      } catch {
        /* ignore */
      }
      stopMediaStream(streamRef.current);
      streamRef.current = null;
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.removeAttribute("src");
      }
    };
  }, [open, currentFacingMode, needsLivePreview, inlineVideoMode]);

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
    if (!reviewUrl || !reviewFile) return;
    showBlobReview(reviewUrl, reviewPoster);
  }, [reviewUrl, reviewFile, reviewPoster]);

  if (!open) return null;

  async function handleSnapPhoto() {
    if (busy || reviewing || !videoRef.current) return;
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

  function startRecording() {
    if (busy || recording || reviewing || !streamRef.current) return;
    setError("");
    chunksRef.current = [];
    try {
      const { recorder, mimeType, cleanup } = createCameraMediaRecorder(streamRef.current);
      mimeRef.current = mimeType;
      recorderRef.current = recorder;
      recorderCleanupRef.current = typeof cleanup === "function" ? cleanup : () => {};

      recorder.ondataavailable = (event) => {
        if (event.data?.size) chunksRef.current.push(event.data);
      };

      recorder.onerror = () => {
        setError("Recording failed. Try again.");
        setRecording(false);
        recorderRef.current = null;
        try {
          recorderCleanupRef.current?.();
        } catch {
          /* ignore */
        }
        recorderCleanupRef.current = () => {};
      };

      recorder.onstop = async () => {
        setBusy(true);
        try {
          const poster = capturePosterFromVideoElement(videoRef.current);
          const mime = mimeRef.current.split(";")[0] || "video/webm";
          const blob = new Blob(chunksRef.current, { type: mime });
          if (!chunksRef.current.length || blob.size < MIN_RECORDED_VIDEO_BYTES) {
            setError("No video was captured. Hold Record longer, then try again.");
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
          await validateRecordedVideoBlob(file, url);
          reviewUrlRef.current = url;
          setReviewPoster(poster || "");
          setReviewFile(file);
          setReviewUrl(url);
        } catch (err) {
          if (reviewUrlRef.current) {
            URL.revokeObjectURL(reviewUrlRef.current);
            reviewUrlRef.current = "";
          }
          setReviewFile(null);
          setReviewUrl("");
          setReviewPoster("");
          if (streamRef.current) attachLivePreview(streamRef.current);
          setError(formatCameraError(err));
        } finally {
          try {
            recorderCleanupRef.current?.();
          } catch {
            /* ignore */
          }
          recorderCleanupRef.current = () => {};
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
    if (!recorder || recorder.state === "inactive") return;
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
    if (streamRef.current) attachLivePreview(streamRef.current);
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
    if (busy || recording || reviewing) return;
    if (!needsLivePreview) return;
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
    if (!allowVideo || busy || recording || reviewing) return;
    if (next === "photo" && !allowPhoto) return;
    setError("");
    clearReview();
    setMode(next);
  }

  const elapsedLabel = `${Math.floor(elapsedSec / 60)}:${String(elapsedSec % 60).padStart(2, "0")}`;

  return (
    <div
      data-testid="consumer-camera-sheet"
      role="dialog"
      aria-modal="true"
      aria-label={photoMode ? "Take photo" : "Record video"}
      style={styles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget && !recording) abandonAndClose();
      }}
    >
      <div style={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <div
          style={{
            ...styles.previewWrap,
            ...(recording ? styles.previewWrapRecording : null),
          }}
        >
          {needsLivePreview || reviewing ? (
            <video
              ref={videoRef}
              style={styles.preview}
              playsInline
              muted
              autoPlay={!reviewing}
              controls={false}
              loop={reviewing}
              preload={reviewing ? "auto" : "metadata"}
              poster={reviewing ? reviewPoster || undefined : undefined}
              data-testid={reviewing ? "consumer-camera-review-video" : "consumer-camera-live"}
            />
          ) : (
            <div style={styles.videoIdle} data-testid="consumer-camera-video-idle" aria-hidden="true" />
          )}

          {busy && !recording && !reviewing ? (
            <div style={styles.loading}>
              {nativeVideoMode ? "Checking video…" : "Opening camera…"}
            </div>
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
            </div>
          ) : null}

          {reviewing ? (
            <div data-testid="consumer-camera-review-meta" style={styles.reviewMeta}>
              Review clip · {formatBytes(reviewFile.size)}
            </div>
          ) : null}

          {needsLivePreview && !reviewing ? (
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

          {allowVideo && allowPhoto && !reviewing ? (
            <div style={styles.modeRow} role="tablist" aria-label="Camera mode">
              <button
                type="button"
                role="tab"
                aria-selected={!photoMode}
                data-testid="consumer-camera-mode-video"
                disabled={busy || recording}
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
                disabled={busy || recording}
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
              ) : inlineVideoMode ? (
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
                    Record video
                  </button>
                )
              ) : (
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
            </>
          )}
        </div>

        {allowVideo && nativeVideoMode ? (
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
  previewWrap: {
    position: "relative",
    background: "#0f172a",
    aspectRatio: "3 / 4",
    maxHeight: "62vh",
  },
  previewWrapRecording: {
    outline: "3px solid #f87171",
    outlineOffset: -3,
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
  recBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 10px",
    borderRadius: 999,
    background: "rgba(0,0,0,0.65)",
    color: "#fff",
    fontWeight: 700,
    fontSize: 12,
  },
  recDot: {
    width: 10,
    height: 10,
    borderRadius: "50%",
    background: "#f87171",
    animation: "menuply-rec-pulse 1.2s ease-out infinite",
  },
  recLabel: { letterSpacing: 0.5 },
  recTimer: { fontVariantNumeric: "tabular-nums" },
  reviewMeta: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 56,
    textAlign: "center",
    color: "#fff",
    fontWeight: 700,
    fontSize: 12,
    textShadow: "0 1px 4px rgba(0,0,0,0.65)",
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
  stopBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    border: "none",
    background: "#dc2626",
    color: "#fff",
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
