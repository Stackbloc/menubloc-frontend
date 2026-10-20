/**
 * Tiny "expand" badge in the corner of the Menu Browser's mini video player. Tapping the
 * player already returns to the full-screen Feed; this icon makes that discoverable.
 */

export default function FeedPipExpandButton({ onExpand }) {
  return (
    <button
      type="button"
      data-testid="feed-menu-browser-pip-expand"
      aria-label="Back to full-screen clip"
      title="Full screen"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onExpand?.();
      }}
      style={styles.btn}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"
          stroke="#fff"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

const styles = {
  btn: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 26,
    height: 26,
    padding: 0,
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.45)",
    background: "rgba(0,0,0,0.62)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    pointerEvents: "auto",
    WebkitTapHighlightColor: "transparent",
  },
};
