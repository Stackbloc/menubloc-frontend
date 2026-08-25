import { useEffect, useRef, useState } from "react";
import {
  capturePosterFromVideoElement,
  withVideoPreviewSeek,
} from "../../lib/consumerCameraCapture.js";
import {
  notifyMealVideoPlaying,
  notifyMealVideoStopped,
  stripMediaUrlFragment,
} from "../../lib/menuplyLiveFeedControl.js";

/**
 * Still frame until the user activates playback.
 * Play src never includes #t= fragments.
 * When the browser cannot decode a frame, show fallbackPoster (logo / billboard / item photo)
 * with a play badge — tap plays the video immediately (no download dialog).
 */
export default function VideoStillPreview({
  src,
  style,
  alt = "",
  playing = false,
  muted = true,
  onRequestPlay,
  notifyLiveFeed = true,
  /** Absolute image URL when video frame capture fails (menu photo / logo / billboard). */
  fallbackPoster = "",
  fallbackPosterFit = "cover",
  testId = "video-still-preview",
}) {
  const videoRef = useRef(null);
  const [poster, setPoster] = useState("");
  const [frameFailed, setFrameFailed] = useState(false);
  const playSrc = stripMediaUrlFragment(src);
  const fallback = String(fallbackPoster || "").trim();

  useEffect(() => {
    setPoster("");
    setFrameFailed(false);
  }, [playSrc, fallback]);

  useEffect(() => {
    if (!playing || !notifyLiveFeed) return undefined;
    notifyMealVideoPlaying();
    return () => notifyMealVideoStopped();
  }, [playing, notifyLiveFeed, playSrc]);

  useEffect(() => {
    if (!playing) return undefined;
    const el = videoRef.current;
    if (!el) return undefined;

    let cancelled = false;

    function tryPlay() {
      if (cancelled) return;
      const p = el.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    }

    function onReady() {
      tryPlay();
    }

    if (el.readyState >= 2) {
      tryPlay();
    } else {
      el.addEventListener("loadeddata", onReady);
      el.addEventListener("canplay", onReady);
    }

    return () => {
      cancelled = true;
      el.removeEventListener("loadeddata", onReady);
      el.removeEventListener("canplay", onReady);
      try {
        el.pause();
      } catch {
        /* ignore */
      }
    };
  }, [playing, playSrc]);

  function tryCapture(el) {
    if (!el || poster) return;
    const dataUrl = capturePosterFromVideoElement(el);
    if (dataUrl) setPoster(dataUrl);
  }

  function handleLoadedMeta(e) {
    const el = e.currentTarget;
    try {
      const dur = Number(el.duration);
      const seekTo =
        Number.isFinite(dur) && dur > 0 ? Math.min(0.12, Math.max(0.04, dur * 0.02)) : 0.1;
      if (el.currentTime < seekTo - 0.01) {
        el.currentTime = seekTo;
      } else {
        tryCapture(el);
      }
    } catch {
      tryCapture(el);
    }
  }

  if (!playSrc) return null;

  const stillSrc = poster || fallback;
  const stillFit = poster ? "cover" : fallbackPosterFit === "contain" ? "contain" : "cover";

  if (playing) {
    return (
      <div style={{ ...styles.wrap, ...(style || {}) }} data-testid={`${testId}-playing-wrap`}>
        {stillSrc ? (
          <img
            src={stillSrc}
            alt=""
            style={{
              ...styles.fill,
              objectFit: stillFit,
              position: "absolute",
              inset: 0,
              zIndex: 0,
            }}
            aria-hidden="true"
          />
        ) : null}
        <video
          ref={videoRef}
          src={playSrc}
          style={{ ...styles.fill, position: "relative", zIndex: 1 }}
          playsInline
          muted={muted}
          loop
          controls={false}
          preload="auto"
          poster={stillSrc || undefined}
          data-testid={`${testId}-playing`}
        />
      </div>
    );
  }

  return (
    <div style={{ ...styles.wrap, ...(style || {}) }} data-testid={testId}>
      {!poster ? (
        <video
          key={playSrc}
          src={withVideoPreviewSeek(playSrc)}
          style={styles.hiddenVideo}
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
          onLoadedMetadata={handleLoadedMeta}
          onLoadedData={(e) => tryCapture(e.currentTarget)}
          onSeeked={(e) => tryCapture(e.currentTarget)}
          onError={() => setFrameFailed(true)}
        />
      ) : null}
      {stillSrc ? (
        <img
          src={stillSrc}
          alt={alt}
          style={{
            ...styles.fill,
            objectFit: stillFit,
            ...(stillFit === "contain" ? styles.logoPad : null),
          }}
          data-testid={poster ? `${testId}-poster` : `${testId}-fallback-image`}
        />
      ) : (
        <div
          style={styles.fallback}
          data-testid={`${testId}-fallback`}
          aria-label={frameFailed ? "Video" : "Loading video preview"}
        >
          <span style={styles.playGlyph} aria-hidden="true">
            ▶
          </span>
          <span style={styles.fallbackLabel}>Video</span>
        </div>
      )}
      <span style={styles.playBadge} aria-hidden="true">
        ▶
      </span>
      {typeof onRequestPlay === "function" ? (
        <button
          type="button"
          style={styles.hit}
          aria-label="Play video"
          data-testid={`${testId}-play`}
          onClick={(e) => {
            e.stopPropagation();
            onRequestPlay();
          }}
        />
      ) : null}
    </div>
  );
}

const styles = {
  wrap: {
    position: "relative",
    width: "100%",
    height: "100%",
    overflow: "hidden",
    background: "#0f172a",
  },
  fill: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  logoPad: {
    padding: "12%",
    boxSizing: "border-box",
    background: "#fff",
  },
  hiddenVideo: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0,
    pointerEvents: "none",
    left: -9999,
    top: 0,
  },
  fallback: {
    width: "100%",
    height: "100%",
    display: "grid",
    placeItems: "center",
    alignContent: "center",
    gap: 6,
    background: "linear-gradient(165deg, #0f172a 0%, #14532d 100%)",
    color: "#ecfdf5",
    padding: 12,
    textAlign: "center",
  },
  playGlyph: {
    fontSize: 28,
    lineHeight: 1,
    opacity: 0.9,
  },
  fallbackLabel: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    opacity: 0.9,
    maxWidth: "90%",
  },
  playBadge: {
    position: "absolute",
    left: "50%",
    top: "42%",
    transform: "translate(-50%, -50%)",
    width: 44,
    height: 44,
    borderRadius: "50%",
    background: "rgba(0,0,0,0.55)",
    border: "1.5px solid rgba(255,255,255,0.75)",
    color: "#fff",
    display: "grid",
    placeItems: "center",
    fontSize: 16,
    paddingLeft: 3,
    pointerEvents: "none",
    zIndex: 2,
  },
  hit: {
    position: "absolute",
    inset: 0,
    border: 0,
    background: "transparent",
    cursor: "pointer",
    padding: 0,
    zIndex: 3,
  },
};
