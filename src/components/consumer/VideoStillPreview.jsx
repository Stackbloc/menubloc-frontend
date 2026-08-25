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
 * Play src never includes #t= fragments (those break some CDN/range plays).
 * Seek fragment is only used on a hidden decoder for poster capture.
 */
export default function VideoStillPreview({
  src,
  style,
  alt = "",
  playing = false,
  muted = true,
  onRequestPlay,
  notifyLiveFeed = true,
  testId = "video-still-preview",
}) {
  const videoRef = useRef(null);
  const [poster, setPoster] = useState("");
  const [failed, setFailed] = useState(false);
  const playSrc = stripMediaUrlFragment(src);

  useEffect(() => {
    setPoster("");
    setFailed(false);
  }, [playSrc]);

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
      if (p && typeof p.catch === "function") {
        p.catch(() => {
          if (!cancelled) setFailed(true);
        });
      }
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

  if (playing) {
    return (
      <div style={{ ...styles.wrap, ...(style || {}) }} data-testid={`${testId}-playing-wrap`}>
        <video
          ref={videoRef}
          src={playSrc}
          style={styles.fill}
          playsInline
          muted={muted}
          loop
          controls={false}
          preload="auto"
          poster={poster || undefined}
          data-testid={`${testId}-playing`}
          onError={() => setFailed(true)}
        />
        {failed ? (
          <div style={styles.unsupported} data-testid={`${testId}-unsupported`}>
            <span style={styles.unsupportedTitle}>Can&apos;t preview this format</span>
            <span style={styles.unsupportedHint}>Video was saved — playback needs a compatible codec</span>
            <a
              href={playSrc}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.download}
              onClick={(e) => e.stopPropagation()}
            >
              Open / download
            </a>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div style={{ ...styles.wrap, ...(style || {}) }} data-testid={testId}>
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
        onError={() => setFailed(true)}
      />
      {poster ? (
        <img src={poster} alt={alt} style={styles.fill} data-testid={`${testId}-poster`} />
      ) : (
        <div
          style={styles.fallback}
          data-testid={failed ? `${testId}-unsupported-still` : `${testId}-fallback`}
          aria-label={failed ? "Can't preview this format" : "Loading video preview"}
        >
          <span style={styles.playGlyph} aria-hidden="true">
            ▶
          </span>
          <span style={styles.fallbackLabel}>
            {failed ? "Can't preview this format" : "Video"}
          </span>
        </div>
      )}
      {!failed ? (
        <span style={styles.playBadge} aria-hidden="true">
          ▶
        </span>
      ) : null}
      {typeof onRequestPlay === "function" && !failed ? (
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
      {failed && typeof onRequestPlay === "function" ? (
        <button
          type="button"
          style={styles.hit}
          aria-label="Try play video"
          data-testid={`${testId}-play-anyway`}
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
  },
  hit: {
    position: "absolute",
    inset: 0,
    border: 0,
    background: "transparent",
    cursor: "pointer",
    padding: 0,
  },
  unsupported: {
    position: "absolute",
    inset: 0,
    display: "grid",
    placeItems: "center",
    alignContent: "center",
    gap: 8,
    padding: 16,
    background: "rgba(15, 23, 42, 0.92)",
    color: "#ecfdf5",
    textAlign: "center",
  },
  unsupportedTitle: {
    fontSize: 13,
    fontWeight: 700,
  },
  unsupportedHint: {
    fontSize: 11,
    opacity: 0.85,
    maxWidth: 220,
    lineHeight: 1.35,
  },
  download: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: 600,
    color: "#5eead4",
    textDecoration: "underline",
  },
};
