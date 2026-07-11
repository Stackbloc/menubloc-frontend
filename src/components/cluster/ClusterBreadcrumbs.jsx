import React from "react";
import { Link } from "react-router-dom";
import { clusterDirectoryPath, clusterPath, stateDisplayName, toCitySlug, toStateSlug } from "../../lib/clusterUrl.js";

export default function ClusterBreadcrumbs({ cluster }) {
  if (!cluster) return null;

  const stateSlug = toStateSlug(cluster.state);
  const citySlug = toCitySlug(cluster.city);
  const stateLabel = stateDisplayName(cluster.state);
  const clusterLabel = cluster.area_name || cluster.name;

  const crumbs = [
    { label: "Clusters", to: clusterDirectoryPath() },
    { label: stateLabel, to: `${clusterDirectoryPath()}?state=${encodeURIComponent(stateSlug)}` },
    {
      label: cluster.city,
      to: `${clusterDirectoryPath()}?state=${encodeURIComponent(stateSlug)}&city=${encodeURIComponent(citySlug)}`,
    },
    { label: clusterLabel, to: null },
  ];

  return (
    <nav aria-label="Cluster breadcrumb" style={{ marginBottom: "0.75rem" }}>
      <ol
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.35rem",
          listStyle: "none",
          margin: 0,
          padding: 0,
          color: "#6b7280",
          fontSize: "0.875rem",
        }}
      >
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <li key={`${crumb.label}-${index}`} style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
              {crumb.to && !isLast ? (
                <Link to={crumb.to} style={{ color: "#374151", textDecoration: "none" }}>
                  {crumb.label}
                </Link>
              ) : (
                <span
                  style={{
                    color: isLast ? "#111827" : "#6b7280",
                    fontWeight: isLast ? 600 : 400,
                    overflowWrap: "anywhere",
                  }}
                >
                  {crumb.label}
                </span>
              )}
              {!isLast ? <span aria-hidden="true">/</span> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function ClusterPageBreadcrumb({ cluster }) {
  if (!cluster) return null;
  return (
    <ClusterBreadcrumbs
      cluster={{
        ...cluster,
        name: cluster.name,
      }}
    />
  );
}
