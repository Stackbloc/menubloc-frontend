import React from "react";
import { Link } from "react-router-dom";
import {
  clusterCityPath,
  clusterDirectoryPath,
  clusterPath,
  stateDisplayName,
  toCitySlug,
  toStateSlug,
} from "../../lib/clusterUrl.js";

function CrumbList({ crumbs }) {
  return (
    <nav aria-label="Cluster breadcrumb">
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

export default function ClusterBreadcrumbs({ cluster }) {
  if (!cluster) return null;

  const stateSlug = toStateSlug(cluster.state);
  const citySlug = toCitySlug(cluster.city);
  const stateLabel = stateDisplayName(cluster.state);
  const clusterLabel = cluster.area_name || cluster.name;
  const cityPath = clusterCityPath({ state: cluster.state, city: cluster.city });

  const crumbs = [
    { label: "Clusters", to: clusterDirectoryPath() },
    { label: stateLabel, to: clusterDirectoryPath() },
    { label: cluster.city, to: cityPath },
    { label: clusterLabel, to: null },
  ];

  return <CrumbList crumbs={crumbs} />;
}

export function ClusterPageBreadcrumb({ cluster }) {
  if (!cluster) return null;
  return <ClusterBreadcrumbs cluster={cluster} />;
}

export function ClusterDirectoryBreadcrumb({ state, city }) {
  const stateSlug = toStateSlug(state);
  const stateLabel = stateDisplayName(state);
  const cityPath = city ? clusterCityPath({ state, city }) : null;

  const crumbs = [
    { label: "Clusters", to: clusterDirectoryPath() },
    { label: stateLabel, to: clusterDirectoryPath() },
    { label: city, to: cityPath },
  ];

  return <CrumbList crumbs={crumbs} />;
}

export function clusterBreadcrumbHref(cluster) {
  return (
    clusterPath({
      state: cluster.state,
      city: cluster.city,
      slug: cluster.slug,
    }) || null
  );
}
