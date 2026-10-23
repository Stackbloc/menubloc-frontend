import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { uploadWhatIAteTodayPhoto } from "../../lib/consumerApi.js";
import { eatingMediaFromUpload } from "../../lib/eatingMediaUtils.js";
import { probeNativeVideoFile } from "../../lib/nativeVideoCapture.js";
import ConsumerCameraSheet from "../consumer/ConsumerCameraSheet.jsx";
import {
  createDishVideoComment,
  DISH_VIDEO_COMMENT_MAX_SECONDS,
} from "../../lib/dishVideoCommentsApi.js";

/**
 * Record or pick a short video about one dish (auto-tagged) and post it as a comment.
 * Record opens the shared ConsumerCameraSheet: laptop webcam records in the page and stops
 * at 25 s; phones open the OS camera, which can't be stopped from a web page, so longer
 * clips are refused right after they come back (same approach as cluster hall clips).
 */
export default function DishVideoCommentSheet({ open, onClose, menuItemId, menuItemName, restaurantId, onPosted }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [seconds, setSeconds] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(null);
  const [posted, setPosted] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);

  useEffect(() => () => previewUrl && URL.revokeObjectURL(previewUrl), [previewUrl]);
  if (!open) return null;

  function reset() {
    setFile(null);
    setSeconds(null);
    setPreviewUrl(null);
    setError("");
    setProgress(null);
    setPosted(false);
  }

  function close() {
    reset();
    onClose?.();
  }

  async function handlePick(event) {
    const picked = event.target.files?.[0];
    event.target.value = "";
    if (picked) await acceptVideo(picked, null);
  }

  async function acceptVideo(picked, recordedSeconds) {
    setError("");
    try {
      const probe = await probeNativeVideoFile(picked).catch((err) => {
        if (recordedSeconds > 0) return null;
        throw err;
      });
      let length = Number(probe?.duration);
      if ((!Number.isFinite(length) || length <= 0) && recordedSeconds > 0) length = recordedSeconds;
      if (!Number.isFinite(length) || length <= 0) {
        setError("We couldn't read that video. Try recording it again.");
        return;
      }
      if (length > DISH_VIDEO_COMMENT_MAX_SECONDS + 0.5) {
        setError(`Comments can be up to ${DISH_VIDEO_COMMENT_MAX_SECONDS} seconds (that one is ${Math.round(length)}s).`);
        return;
      }
      setFile(picked);
      setSeconds(Math.min(length, DISH_VIDEO_COMMENT_MAX_SECONDS));
      setPreviewUrl(URL.createObjectURL(picked));
    } catch (err) {
      setError(err?.message || "Choose a video file.");
    }
  }

  async function post() {
    if (!file || busy) return;
    setBusy(true);
    setError("");
    try {
      const upload = await uploadWhatIAteTodayPhoto(file, { onProgress: (p) => setProgress(p) });
      const { video_url: videoUrl } = eatingMediaFromUpload(upload);
      if (!videoUrl) throw new Error("The video didn't upload. Try again.");
      const res = await createDishVideoComment(menuItemId, { videoUrl, durationSeconds: seconds, restaurantId });
      setPosted(true);
      onPosted?.(res?.comment || null);
    } catch (err) {
      setError(err?.message || "Your comment didn't post. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const pct = progress && typeof progress === "object" ? progress.percent : typeof progress === "number" ? progress : null;

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label="Comment with a video" style={styles.backdrop} onClick={close}>
      <div style={styles.sheet} onClick={(e) => e.stopPropagation()} data-testid="dish-video-comment-sheet">
        <div style={styles.grip} />
        <div style={styles.title}>Comment on {menuItemName || "this dish"}</div>
        {posted ? (
          <>
            <div style={styles.body}>Your comment is posted on this dish.</div>
            <button type="button" style={styles.primary} onClick={close}>Done</button>
          </>
        ) : (
          <>
            <div style={styles.body}>A video up to {DISH_VIDEO_COMMENT_MAX_SECONDS} seconds. It shows on this dish.</div>
            {previewUrl ? (
              <video src={previewUrl} controls playsInline style={styles.preview} data-testid="dish-video-comment-preview" />
            ) : null}
            <input
              ref={inputRef}
              type="file"
              accept="video/*"
              style={{ display: "none" }}
              onChange={handlePick}
              data-testid="dish-video-comment-input"
            />
            {error ? <div role="alert" style={styles.error}>{error}</div> : null}
            {file ? (
              <>
                <button type="button" style={styles.primary} onClick={post} disabled={busy} data-testid="dish-video-comment-post">
                  {busy ? (pct != null ? `Posting… ${Math.round(pct)}%` : "Posting…") : "Post comment"}
                </button>
                <button type="button" style={styles.quiet} onClick={() => setCameraOpen(true)} disabled={busy}>
                  Record again
                </button>
              </>
            ) : (
              <>
                <button type="button" style={styles.primary} onClick={() => setCameraOpen(true)} data-testid="dish-video-comment-record">
                  Record a video
                </button>
                <button type="button" style={styles.quiet} onClick={() => inputRef.current?.click()} data-testid="dish-video-comment-choose">
                  Choose a video file
                </button>
              </>
            )}
            <ConsumerCameraSheet
              open={cameraOpen}
              onClose={() => setCameraOpen(false)}
              allowPhoto={false}
              allowVideo
              maxRecordSeconds={DISH_VIDEO_COMMENT_MAX_SECONDS}
              onCapture={(captured, meta) => acceptVideo(captured, meta?.recordedSeconds)}
            />
          </>
        )}
      </div>
    </div>,
    document.body
  );
}

const styles = {
  backdrop: { position: "fixed", inset: 0, zIndex: 2200, background: "var(--mp-scrim)", display: "flex", alignItems: "flex-end", justifyContent: "center" },
  sheet: {
    background: "var(--mp-surface)",
    borderRadius: "var(--mp-radius-lg) var(--mp-radius-lg) 0 0",
    padding: "var(--mp-space-4) var(--mp-space-4) calc(var(--mp-space-6) + env(safe-area-inset-bottom, 0px))",
    maxWidth: 480,
    width: "100%",
    boxShadow: "var(--mp-shadow-sheet)",
    display: "grid",
    gap: "var(--mp-space-3)",
    fontFamily: "var(--mp-font-sans)",
  },
  grip: { justifySelf: "center", width: 36, height: 4, borderRadius: 999, background: "var(--mp-border)" },
  title: { fontSize: 17, lineHeight: "22px", fontWeight: 600, color: "var(--mp-ink)" },
  body: { fontSize: 15, lineHeight: "21px", color: "var(--mp-ink-muted)" },
  error: { fontSize: 14, lineHeight: "20px", color: "var(--mp-danger)" },
  preview: { width: "100%", maxHeight: 320, borderRadius: "var(--mp-radius-md)", background: "#000" },
  primary: { border: "none", borderRadius: "var(--mp-radius-md)", background: "var(--mp-accent)", color: "var(--mp-on-accent)", padding: "12px 16px", fontSize: 15, fontWeight: 600, cursor: "pointer" },
  quiet: { border: "1px solid var(--mp-border)", borderRadius: "var(--mp-radius-md)", background: "var(--mp-surface)", color: "var(--mp-ink)", padding: "10px 16px", fontSize: 15, fontWeight: 600, cursor: "pointer" },
};
