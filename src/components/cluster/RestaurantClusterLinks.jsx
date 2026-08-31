import React from "react";
import { Link } from "react-router-dom";
import {
  clusterMembershipAction,
  clusterMembershipHeading,
  clusterPath,
  clusterVerificationBadge,
} from "../../lib/clusterUrl.js";
import { resolveClusterSlug } from "../../lib/clusterSlugAliases.js";
import { resolveClusterDisplayName } from "../../lib/clusterSeoContent.js";

export default function RestaurantClusterLinks({ clusters, linkColor = "#1d4ed8" }) {
  if (!Array.isArray(clusters) || clusters.length === 0) return null;

  return (
    <div style={{ display: "grid", gap: 10, marginTop: 4 }}>
      {clusters.map((cluster) => {
        const href = clusterPath({
          state: cluster.state,
          city: cluster.city,
          slug: resolveClusterSlug(cluster.slug),
        });
        if (!href) return null;

        const label = resolveClusterDisplayName(cluster);
        const heading = clusterMembershipHeading(cluster.type);

        return (
          <div key={cluster.slug || cluster.id} style={{ display: "grid", gap: 4 }}>
            <div style={{ fontSize: 13, color: "inherit", opacity: 0.85 }}>
              {heading}:
            </div>
            <div style={{ fontWeight: 600 }}>{label}</div>
            <div style={{ fontSize: 12, opacity: 0.85 }}>
              {clusterVerificationBadge(cluster.verification_level)}
            </div>
            <Link
              to={href}
              style={{
                color: linkColor,
                textDecoration: "none",
                fontWeight: 500,
                fontSize: 13,
                width: "fit-content",
              }}
            >
              {clusterMembershipAction(cluster.type)}
            </Link>
          </div>
        );
      })}
    </div>
  );
}
