/**
 * Small play control shown only when a row has video. Plays in the cluster floating player
 * (no navigation). Count badge when the row has more than one clip.
 */

import { useClusterVideos } from "./ClusterVideoContext.jsx";

export function PlayGlyph({ size = 12, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" aria-hidden="true" focusable="false">
      <path d="M3 1.6v8.8a.6.6 0 0 0 .92.5l6.9-4.4a.6.6 0 0 0 0-1L3.92 1.1A.6.6 0 0 0 3 1.6z" fill={color} />
    </svg>
  );
}

/**
 * @param {{
 *   videos: object[],
 *   trigger: "dish_icon" | "restaurant_icon",
 *   item?: object | null,
 *   label: string,
 *   variant?: "row" | "overlay",
 *   testId?: string,
 * }} props
 */
export default function ClusterVideoPlayButton({ videos, trigger, item = null, label, variant = "row", testId }) {
  const { openVideo, activeVideoKey } = useClusterVideos();
  if (!Array.isArray(videos) || videos.length === 0) return null;

  const playing = videos.some((v) => v.video_key === activeVideoKey);
  const count = videos.length;
  const style = variant === "overlay" ? styles.overlay : styles.row;

  return (
    <button
      type="button"
      data-testid={testId || "cluster-video-play"}
      data-video-count={count}
      data-playing={playing ? "1" : "0"}
      aria-label={count > 1 ? `${label} (${count} clips)` : label}
      title={label}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        openVideo(videos, { trigger, item });
      }}
      style={{ ...style, ...(playing ? styles.playing : null) }}
    >
      <PlayGlyph size={variant === "overlay" ? 11 : 12} />
      {variant === "overlay" ? <span style={styles.overlayText}>{count > 1 ? `${count} clips` : "Clip"}</span> : null}
      {variant === "row" && count > 1 ? <span style={styles.count}>{count}</span> : null}
    </button>
  );
}

const styles = {
  row: {
    position: "relative",
    flexShrink: 0,
    width: 30,
    height: 30,
    borderRadius: 999,
    border: "none",
    padding: 0,
    paddingLeft: 2,
    background: "#111827",
    color: "#ffffff",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    boxShadow: "0 1px 2px rgba(15, 23, 42, 0.18)",
    fontFamily: "inherit",
  },
  overlay: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    height: 28,
    padding: "0 10px 0 9px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.35)",
    background: "rgba(17, 24, 39, 0.82)",
    color: "#ffffff",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: 12,
    fontWeight: 700,
    lineHeight: 1,
    boxShadow: "0 2px 8px rgba(15, 23, 42, 0.25)",
  },
  overlayText: { letterSpacing: "0.01em" },
  playing: {
    background: "#dc2626",
  },
  count: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 15,
    height: 15,
    padding: "0 3px",
    boxSizing: "border-box",
    borderRadius: 999,
    background: "#ffffff",
    color: "#111827",
    border: "1px solid #111827",
    fontSize: 9,
    fontWeight: 800,
    lineHeight: "13px",
    textAlign: "center",
  },
};

/**
 * Sticky-bar entry point ("▶ 27 videos"): visible on the first screen and while scrolling,
 * plays the whole cluster reel in the floating player. Hidden when the cluster has no video.
 */
export function ClusterVideosPill() {
  const { index, openVideo } = useClusterVideos();
  const count = index.videos.length;
  if (count === 0) return null;
  return (
    <button
      type="button"
      data-testid="cluster-videos-pill"
      aria-label={`Play ${count} food ${count === 1 ? "clip" : "clips"} from this area`}
      onClick={() => openVideo(index.videos, { trigger: "header_pill" })}
      style={styles.pill}
    >
      <span style={styles.pillDot}>
        <PlayGlyph size={9} color="#fff" />
      </span>
      {count} {count === 1 ? "clip" : "clips"}
    </button>
  );
}

styles.pill = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  height: 34,
  padding: "0 12px 0 5px",
  borderRadius: 999,
  border: "1px solid #111827",
  background: "#ffffff",
  color: "#111827",
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "inherit",
  whiteSpace: "nowrap",
};
styles.pillDot = {
  width: 24,
  height: 24,
  borderRadius: 999,
  background: "#dc2626",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  paddingLeft: 2,
  boxSizing: "border-box",
};
