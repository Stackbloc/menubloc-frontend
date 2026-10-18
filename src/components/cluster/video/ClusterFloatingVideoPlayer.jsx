/**
 * Cluster floating player — same mini-player pattern as menus (MenuRestaurantContextualVideo):
 * fixed bottom-right, muted by default, tap video to pause/play, ‹ › between clips.
 * Adds a "From the video" footer: the dish (or restaurant) and an Order button that opens the
 * menu sheet with that dish pinned. In compact mode (menu sheet open) the footer is hidden —
 * the sheet already pins the dish.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { clusterVideoDealTitle, clusterVideoDishName } from "../../../lib/clusterVideoIndex.js";
import { clusterVideoSrc } from "../../../lib/clusterVideoMedia.js";
import { createWatchReporter, trackClusterVideoEvent } from "../../../lib/clusterVideoAnalytics.js";
import { PlayGlyph } from "./ClusterVideoPlayButton.jsx";

const SURFACE = "cluster_floating";

export default function ClusterFloatingVideoPlayer({ cluster, player, compact = false, onSetPosition, onClose, onOrder }) {
  const videoRef = useRef(null);
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);
  const reporter = useMemo(
    () => createWatchReporter({ surface: SURFACE, clusterId: cluster?.id }),
    [cluster?.id]
  );

  const { queue, position, trigger, item } = player;
  const clip = queue[position] || null;
  const src = clusterVideoSrc(clip);
  const forcedMute = clip?.play_muted === true;
  const effectiveMuted = forcedMute || muted;
  const dishName = (item && (item.name || item.menu_item_name)) || clusterVideoDishName(clip);
  const dealTitle = dishName ? null : clusterVideoDealTitle(clip);

  useEffect(() => () => reporter.stop(), [reporter]);

  // How the current clip started; the first onPlay reports it, later plays are resumes.
  const triggerRef = useRef(trigger);

  useEffect(() => {
    if (!clip || !src) return;
    reporter.start(clip);
    triggerRef.current = trigger;
    const el = videoRef.current;
    if (!el) return;
    el.currentTime = 0;
    el.muted = effectiveMuted;
    const p = el.play();
    if (p && typeof p.catch === "function") p.catch(() => setPaused(true));
    setPaused(false);
    // effectiveMuted intentionally excluded: toggling sound must not restart the clip.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clip?.video_key, player.openedAt]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = effectiveMuted;
  }, [effectiveMuted]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!clip || !src || typeof document === "undefined") return null;

  function close(e) {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    reporter.stop();
    onClose?.();
  }

  function togglePlay(e) {
    e?.preventDefault?.();
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) {
      const p = el.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    } else {
      el.pause();
    }
  }

  function step(delta) {
    return (e) => {
      e?.preventDefault?.();
      e?.stopPropagation?.();
      onSetPosition?.(position + delta, "next");
    };
  }

  function order(e) {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    trackClusterVideoEvent(clip, dishName ? "click_menu_item" : "click_restaurant", {
      surface: SURFACE,
      clusterId: cluster?.id,
      menuItemId: item?.menu_item_id ?? clip.menu_item_id,
    });
    onOrder?.(clip, item);
  }

  const hasPrev = position > 0;
  const hasNext = position < queue.length - 1;

  return createPortal(
    <div
      role="dialog"
      aria-label="Video player"
      data-testid="cluster-floating-video"
      data-video-key={clip.video_key}
      data-compact={compact ? "1" : "0"}
      style={{ ...styles.root, ...(compact ? styles.rootCompact : null) }}
    >
      <div style={{ ...styles.stage, ...(compact ? styles.stageCompact : null) }}>
        <video
          key={clip.video_key}
          ref={videoRef}
          src={src}
          poster={clip.thumbnail_url || undefined}
          style={styles.video}
          playsInline
          muted={effectiveMuted}
          loop={!hasNext}
          autoPlay
          preload="auto"
          controls={false}
          data-testid="cluster-floating-video-el"
          aria-label={paused ? "Play video" : "Pause video"}
          onClick={togglePlay}
          onPlay={() => {
            setPaused(false);
            trackClusterVideoEvent(clip, "play", {
              surface: SURFACE,
              trigger: triggerRef.current,
              clusterId: cluster?.id,
            });
            triggerRef.current = "resume";
          }}
          onPause={() => {
            setPaused(true);
            reporter.report();
          }}
          onTimeUpdate={(e) => reporter.sample(e.currentTarget)}
          onEnded={() => {
            reporter.report();
            if (hasNext) onSetPosition?.(position + 1, "next");
          }}
        />
        {paused ? (
          <button type="button" style={styles.bigPlay} aria-label="Play video" onClick={togglePlay}>
            <PlayGlyph size={18} color="#fff" />
          </button>
        ) : null}
        <button
          type="button"
          style={styles.close}
          data-testid="cluster-floating-video-close"
          aria-label="Close video"
          onClick={close}
        >
          ✕
        </button>
        <button
          type="button"
          style={styles.mute}
          data-testid="cluster-floating-video-mute"
          aria-label={forcedMute ? "This video plays without sound" : effectiveMuted ? "Turn sound on" : "Mute"}
          disabled={forcedMute}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!forcedMute) setMuted((m) => !m);
          }}
        >
          {effectiveMuted ? "🔇" : "🔊"}
        </button>
        {queue.length > 1 ? (
          <div style={styles.stepper}>
            <button type="button" style={styles.stepBtn} disabled={!hasPrev} aria-label="Previous video" onClick={step(-1)}>
              ‹
            </button>
            <span style={styles.stepCount}>
              {position + 1}/{queue.length}
            </span>
            <button type="button" style={styles.stepBtn} disabled={!hasNext} aria-label="Next video" onClick={step(1)}>
              ›
            </button>
          </div>
        ) : null}
      </div>
      {compact ? null : (
        <div style={styles.footer} data-testid="cluster-floating-video-dish">
          <span style={styles.eyebrow}>{dishName ? "From the video" : dealTitle ? "Deal" : "Video"}</span>
          <span style={styles.dish}>{dishName || dealTitle || clip.restaurant_name || "Restaurant"}</span>
          {(dishName || dealTitle) && clip.restaurant_name ? (
            <span style={styles.restaurant}>{clip.restaurant_name}</span>
          ) : null}
          <button
            type="button"
            style={styles.orderBtn}
            data-testid="cluster-floating-video-order"
            onClick={order}
          >
            {dishName ? "Order this" : "See menu"}
          </button>
        </div>
      )}
    </div>,
    document.body
  );
}

const styles = {
  root: {
    position: "fixed",
    right: "max(12px, env(safe-area-inset-right))",
    bottom: "calc(72px + env(safe-area-inset-bottom, 0px))",
    zIndex: 230,
    width: 176,
    borderRadius: 16,
    overflow: "hidden",
    background: "#0b1220",
    color: "#f8fafc",
    boxShadow: "0 14px 36px rgba(0, 0, 0, 0.45)",
    border: "1px solid rgba(255, 255, 255, 0.18)",
  },
  rootCompact: {
    width: 116,
    bottom: "calc(84px + env(safe-area-inset-bottom, 0px))",
  },
  stage: {
    position: "relative",
    width: "100%",
    height: 234,
    background: "#000",
  },
  stageCompact: { height: 168 },
  video: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
    cursor: "pointer",
    background: "#000",
  },
  bigPlay: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 48,
    height: 48,
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.5)",
    background: "rgba(0,0,0,0.55)",
    paddingLeft: 3,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  close: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.4)",
    background: "rgba(0,0,0,0.6)",
    color: "#fff",
    fontSize: 13,
    fontWeight: 800,
    lineHeight: 1,
    padding: 0,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  mute: {
    position: "absolute",
    left: 6,
    bottom: 6,
    width: 30,
    height: 30,
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.4)",
    background: "rgba(0,0,0,0.6)",
    color: "#fff",
    fontSize: 13,
    lineHeight: 1,
    padding: 0,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  stepper: {
    position: "absolute",
    right: 6,
    bottom: 6,
    display: "flex",
    alignItems: "center",
    gap: 2,
    borderRadius: 999,
    background: "rgba(0,0,0,0.6)",
    border: "1px solid rgba(255,255,255,0.3)",
    padding: "0 2px",
  },
  stepBtn: {
    width: 24,
    height: 28,
    border: "none",
    background: "transparent",
    color: "#fff",
    fontSize: 18,
    fontWeight: 700,
    lineHeight: 1,
    padding: 0,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  stepCount: { fontSize: 10, fontWeight: 700, minWidth: 22, textAlign: "center" },
  footer: {
    display: "grid",
    gap: 3,
    padding: "9px 10px 10px",
  },
  eyebrow: {
    fontSize: 9.5,
    fontWeight: 800,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#fbbf24",
  },
  dish: {
    fontSize: 13,
    fontWeight: 750,
    lineHeight: 1.25,
    color: "#fff",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    overflowWrap: "anywhere",
  },
  restaurant: {
    fontSize: 11,
    color: "#cbd5e1",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  orderBtn: {
    marginTop: 5,
    height: 32,
    borderRadius: 999,
    border: "none",
    background: "#16a34a",
    color: "#fff",
    fontSize: 13,
    fontWeight: 800,
    cursor: "pointer",
    fontFamily: "inherit",
  },
};
