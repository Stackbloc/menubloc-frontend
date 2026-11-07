import { useCallback, useEffect, useRef, useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import BrickWall from "../components/clusterWall/BrickWall.jsx";
import { ClusterWallProvider, ClusterWallStandalone } from "../components/clusterWall/ClusterWall.jsx";
import useEngagementPage from "../hooks/useEngagementPage.js";
import { trackEngagement } from "../lib/engagementTracking.js";
import "../components/clusterWall/clusterWall.css";

// Short names for titles ("USC Wall"), same as the backend's CLUSTER_SHORT_LABELS.
const WALL_LABELS = Object.freeze({ usc: "USC" });

// How someone got here (location.state.wallEntry) → wall_open subtype. No state = direct
// (typed URL, QR code, social link, refresh).
const ENTRIES = new Set(["direct", "menuply", "shared_post"]);

/**
 * menuply.com/clusters/walls/:wallSlug — the full Wall, straight away (2026-11-06), drawn as one
 * continuous brick wall (BrickWall). "← Back to Menuply" only when a Menuply screen sent the visitor
 * here with state { fromMenuply: true }. Before mig 0398 the backend has no stored layout and the
 * previous Wall shows instead.
 */
export default function ClusterWallPage() {
  const { wallSlug = "" } = useParams();
  const location = useLocation();
  const slug = wallSlug.toLowerCase();
  // Lowercase canonical URL (/clusters/Walls/USC → /clusters/walls/usc).
  const canonical = `/clusters/walls/${slug}`;
  if (location.pathname.replace(/\/+$/, "") !== canonical) {
    return <Navigate to={`${canonical}${location.search}`} replace state={location.state} />;
  }
  return <WallPageBody slug={slug} label={WALL_LABELS[slug] || slug.toUpperCase()} />;
}

function WallPageBody({ slug, label }) {
  const navigate = useNavigate();
  const location = useLocation();
  const rootRef = useRef(null);
  const [clusterId, setClusterId] = useState(null);
  const fromMenuply = location.state?.fromMenuply === true && location.key !== "default";
  const entry = ENTRIES.has(location.state?.wallEntry) ? location.state.wallEntry : fromMenuply ? "menuply" : "direct";
  const onCluster = useCallback((c) => setClusterId(c?.id || null), []);

  useEffect(() => {
    document.title = `${label} Wall | Menuply`;
  }, [label]);

  useEngagementPage(rootRef, { pageType: "wall", ready: Boolean(clusterId), clusterId });

  // One wall_open per visit, after its page view.
  const opened = useRef(false);
  useEffect(() => {
    if (!clusterId || opened.current) return;
    opened.current = true;
    const t = setTimeout(() => trackEngagement("wall_open", { subtype: entry }), 0);
    return () => clearTimeout(t);
  }, [clusterId, entry]);

  const legacy = (
    <ClusterWallProvider clusterSlug={slug} clusterLabel={label} standalone showHouse>
      <main style={{ maxWidth: 1080, margin: "0 auto", padding: "0.75rem 10px 4rem", boxSizing: "border-box" }}>
        <p style={{ margin: "0 0 10px", font: "700 13px/1.2 system-ui", color: "#6b7280" }}>
          <Link to="/" style={{ color: "#111827", font: "700 18px/1 Georgia, serif", textDecoration: "none" }}>Menuply</Link>
          {` · ${label} Wall`}
        </p>
        <ClusterWallStandalone onBack={fromMenuply ? () => navigate(-1) : null} />
      </main>
    </ClusterWallProvider>
  );

  return (
    <div ref={rootRef} data-testid="cluster-wall-page">
      <BrickWall
        clusterSlug={slug}
        clusterLabel={label}
        onBack={fromMenuply ? () => navigate(-1) : null}
        onCluster={onCluster}
        legacy={legacy}
      />
    </div>
  );
}
