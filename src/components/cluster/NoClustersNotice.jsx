// Created 2026-11-20: "No Clusters in [City, ST] yet" notice with a Search link.
// Shown on /clusters when the diner's market has no Cluster, and on an empty city Cluster page.
import { useNavigate } from "react-router-dom";
import {
  NO_CLUSTERS_SEARCH_PATH,
  noClustersNoticeCopy,
  rememberSearchMarket,
} from "../../lib/clusterLocation.js";

export default function NoClustersNotice({ city, state, style }) {
  const navigate = useNavigate();
  const copy = noClustersNoticeCopy({ city, state });
  if (!copy) return null;

  function openSearch(event) {
    event.preventDefault();
    rememberSearchMarket({ city, state });
    navigate(NO_CLUSTERS_SEARCH_PATH);
  }

  return (
    <section
      data-testid="no-clusters-notice"
      aria-label={copy.title}
      style={{
        border: "1px solid #dbe7df",
        background: "#ffffff",
        borderRadius: 14,
        padding: "0.9rem 1rem",
        marginBottom: "1rem",
        display: "grid",
        gap: "0.6rem",
        justifyItems: "start",
        ...style,
      }}
    >
      <div>
        <h2 style={{ margin: 0, fontSize: "1.05rem", color: "#0B0F0C" }}>{copy.title}</h2>
        <p style={{ margin: "0.25rem 0 0", color: "#475569", fontSize: "0.95rem", lineHeight: 1.45 }}>
          {copy.body}
        </p>
      </div>
      <a
        href={NO_CLUSTERS_SEARCH_PATH}
        onClick={openSearch}
        data-testid="no-clusters-search"
        style={{
          display: "inline-flex",
          alignItems: "center",
          padding: "0.5rem 0.95rem",
          borderRadius: 10,
          background: "#0B0F0C",
          color: "#ffffff",
          fontWeight: 700,
          fontSize: "0.92rem",
          textDecoration: "none",
        }}
      >
        {copy.action}
      </a>
    </section>
  );
}
