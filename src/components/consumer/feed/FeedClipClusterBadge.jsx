import { Link } from "react-router-dom";

/**
 * Top-right chip on a Feed clip whose restaurant belongs to a cluster in the viewer's
 * Explore clusters (e.g. "USC Cluster"); links to that cluster (Andre, 2026-10-20).
 * Mobile sits below the Feed header (logo / Log in / menu), which overlays the clip.
 */
export default function FeedClipClusterBadge({ cluster, desktop = false }) {
  if (!cluster?.href || !cluster?.label) return null;
  return (
    <Link
      to={cluster.href}
      data-testid="feed-clip-cluster-badge"
      aria-label={`Open the ${cluster.label}`}
      title={`See everything at the ${cluster.label}`}
      onClick={(e) => e.stopPropagation()}
      style={{
        ...styles.badge,
        top: desktop
          ? "max(16px, env(safe-area-inset-top))"
          : "calc(max(16px, env(safe-area-inset-top)) + 56px)",
      }}
    >
      <span aria-hidden="true" style={styles.dot} />
      {cluster.label}
    </Link>
  );
}

const styles = {
  badge: {
    position: "absolute",
    right: "max(12px, env(safe-area-inset-right))",
    zIndex: 5,
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    maxWidth: "60%",
    padding: "7px 12px",
    borderRadius: 999,
    background: "rgba(0,0,0,0.55)",
    border: "1px solid rgba(255,255,255,0.35)",
    color: "#fff",
    fontSize: 13,
    fontWeight: 700,
    lineHeight: 1.1,
    textDecoration: "none",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    boxShadow: "0 4px 14px rgba(0,0,0,0.35)",
    backdropFilter: "blur(6px)",
    WebkitBackdropFilter: "blur(6px)",
    pointerEvents: "auto",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    background: "#16a34a",
    flexShrink: 0,
  },
};
