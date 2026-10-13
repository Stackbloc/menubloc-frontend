/**
 * Lightweight play/pause circle for Feed videos — lets viewers stop a clip to read the menu
 * being discussed. Deliberately faint so it does not compete with the video.
 */

/** Mini player (Menu Browser open): pausing also keeps the current menu on screen. */
export const PIP_PAUSE_TITLE = "Pause video / stay on current menu view";

export default function FeedVideoPlayPauseButton({ paused = false, onToggle, style = null, pauseTitle = null }) {
  return (
    <button
      type="button"
      data-testid="feed-video-play-pause"
      data-paused={paused ? "true" : "false"}
      aria-label={paused ? "Play video" : pauseTitle || "Pause video"}
      aria-pressed={paused}
      title={paused ? "Play" : pauseTitle || "Pause"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle?.();
      }}
      onPointerUp={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
      style={{ ...styles.btn, ...style }}
    >
      {paused ? (
        <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 4.5v15l13-7.5-13-7.5Z" fill="#fff" />
        </svg>
      ) : (
        <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true">
          <rect x="5.5" y="4" width="4.5" height="16" rx="1.2" fill="#fff" />
          <rect x="14" y="4" width="4.5" height="16" rx="1.2" fill="#fff" />
        </svg>
      )}
    </button>
  );
}

const styles = {
  btn: {
    position: "absolute",
    zIndex: 6,
    width: 34,
    height: 34,
    padding: 0,
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.32)",
    background: "rgba(0,0,0,0.22)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.85,
    cursor: "pointer",
    pointerEvents: "auto",
    WebkitTapHighlightColor: "transparent",
  },
};
