import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import BottomNav from "../components/BottomNav.jsx";
import { BrandLogo } from "../components/BrandLogo.jsx";
import ClusterDirectoryCard, { CLUSTER_DIRECTORY_GRID_STYLE } from "../components/cluster/ClusterDirectoryCard.jsx";
import { ClusterDirectoryBreadcrumb } from "../components/cluster/ClusterBreadcrumbs.jsx";
import { fetchClustersDirectory } from "../lib/clusterApi.js";
import { toConsumerErrorMessage } from "../lib/api.js";
import { clusterDirectoryPath, stateDisplayName, toCitySlug, toStateSlug } from "../lib/clusterUrl.js";

const TYPE_ACCENTS = {
  university: { border: "#8b5cf6", bg: "#f5f3ff" },
  airport: { border: "#0ea5e9", bg: "#ecfeff" },
  downtown: { border: "#f97316", bg: "#fff7ed" },
  entertainment_complex: { border: "#ec4899", bg: "#fdf2f8" },
  tourist_destination: { border: "#16a34a", bg: "#f0fdf4" },
  stadium: { border: "#2563eb", bg: "#eff6ff" },
  convention_district: { border: "#14b8a6", bg: "#f0fdfa" },
  historic_district: { border: "#a16207", bg: "#fefce8" },
  waterfront: { border: "#0891b2", bg: "#ecfeff" },
  casino: { border: "#b91c1c", bg: "#fef2f2" },
  theme_park: { border: "#7c3aed", bg: "#f5f3ff" },
  business_district: { border: "#4b5563", bg: "#f9fafb" },
};

function matchesCityDirectory(cluster, { stateSlug, citySlug }) {
  const clusterStateSlug = toStateSlug(cluster.state);
  const clusterCitySlug = toCitySlug(cluster.city);
  return clusterStateSlug === stateSlug && clusterCitySlug === citySlug;
}

export default function ClusterCityDirectoryPage() {
  const { stateSlug, citySlug } = useParams();
  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const stateCode = useMemo(() => {
    const match = clusters.find((cluster) => toStateSlug(cluster.state) === stateSlug);
    return match?.state || null;
  }, [clusters, stateSlug]);

  const cityLabel = useMemo(() => {
    const match = clusters.find((cluster) => matchesCityDirectory(cluster, { stateSlug, citySlug }));
    return match?.city || citySlug.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
  }, [clusters, stateSlug, citySlug]);

  const stateLabel = stateCode ? stateDisplayName(stateCode) : stateSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");

    fetchClustersDirectory({ limit: 300, signal: controller.signal })
      .then((json) => {
        const rows = Array.isArray(json.clusters) ? json.clusters : [];
        setClusters(rows.filter((cluster) => matchesCityDirectory(cluster, { stateSlug, citySlug })));
        setLoading(false);
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        setError(toConsumerErrorMessage(err, "Could not load clusters for this city."));
        setLoading(false);
      });

    return () => controller.abort();
  }, [stateSlug, citySlug]);

  useEffect(() => {
    document.title = `${cityLabel}, ${stateLabel} Restaurant Clusters | Menuply`;
  }, [cityLabel, stateLabel]);

  function renderClusterCard(cluster) {
    const type = String(cluster.type || "").toLowerCase();
    const accent = TYPE_ACCENTS[type] || { border: "#d1d5db", bg: "#f9fafb" };
    return <ClusterDirectoryCard key={cluster.slug} cluster={cluster} accent={accent} />;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
        padding: "1.25rem 1rem 5rem",
        width: "100%",
        boxSizing: "border-box",
        overflowX: "clip",
      }}
    >
      <div style={{ maxWidth: 1080, margin: "0 auto", width: "100%", minWidth: 0 }}>
        <header
          style={{
            border: "1px solid #dbe7df",
            background: "#ffffff",
            borderRadius: 18,
            padding: "1rem 1.1rem",
            marginBottom: "1rem",
            boxShadow: "0 8px 24px rgba(15,23,42,0.05)",
          }}
        >
          <BrandLogo height={36} radius={10} matchPageBackground={false} />
          <ClusterDirectoryBreadcrumb state={stateCode || stateSlug} city={cityLabel} />
          <h1 style={{ margin: "0.5rem 0 0.4rem", fontSize: "1.7rem", lineHeight: 1.2 }}>
            {cityLabel}, {stateLabel}
          </h1>
          <p style={{ margin: 0, color: "#475569", maxWidth: 760 }}>
            Restaurant clusters around {cityLabel} — campuses, entertainment districts, airports, and
            other destinations where people actually dine.
          </p>
        </header>

        {error ? <p style={{ color: "#b91c1c" }}>{error}</p> : null}

        <section
          style={{
            border: "1px solid #dbe7df",
            background: "#fff",
            borderRadius: 18,
            padding: "1rem 1.1rem",
          }}
        >
          {loading ? <p style={{ color: "#64748b" }}>Loading clusters…</p> : null}
          {!loading && clusters.length === 0 ? (
            <div style={{ display: "grid", gap: "0.75rem" }}>
              <p style={{ margin: 0, color: "#475569" }}>
                Menuply does not have public restaurant clusters in {cityLabel}, {stateLabel} yet.
              </p>
              <p style={{ margin: 0, color: "#64748b", fontSize: "0.95rem" }}>
                Browse the full directory or create a cluster for this area.
              </p>
              <Link to={clusterDirectoryPath()} style={{ color: "#1d4ed8", width: "fit-content" }}>
                View all clusters →
              </Link>
            </div>
          ) : null}
          {!loading && clusters.length > 0 ? (
            <div style={CLUSTER_DIRECTORY_GRID_STYLE}>{clusters.map(renderClusterCard)}</div>
          ) : null}
        </section>
      </div>
      <BottomNav />
    </div>
  );
}
