/**
 * Campus Dining — university Cluster section only.
 * Reuses restaurant profiles + What Diners Are Saying (food_activity).
 * Hidden when empty / non-university. No subscription gate.
 */

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import WhatDinersAreSaying from "../restaurant/WhatDinersAreSaying.jsx";
import { fetchClusterCampusDining } from "../../lib/clusterApi.js";

function isUniversityCluster(cluster) {
  return String(cluster?.type || cluster?.cluster_type || "")
    .trim()
    .toLowerCase() === "university";
}

export default function CampusDiningSection({ cluster }) {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);

  const slug = cluster?.slug;
  const university = isUniversityCluster(cluster);

  useEffect(() => {
    let cancelled = false;
    if (!university || !slug) {
      setLocations([]);
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    fetchClusterCampusDining(slug, { limit: 24 })
      .then((data) => {
        if (cancelled) return;
        setLocations(Array.isArray(data?.locations) ? data.locations : []);
      })
      .catch(() => {
        if (!cancelled) setLocations([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [university, slug]);

  if (!university) return null;
  if (!loading && locations.length === 0) return null;

  return (
    <section
      id="campus-dining"
      data-testid="campus-dining"
      aria-label="Campus Dining"
      style={styles.section}
    >
      <div style={styles.sectionTitle}>Campus Dining</div>
      <p style={styles.lead}>
        Where students eat on campus — diner comments and shared food activity, even without a
        full menu.
      </p>

      {loading ? <p style={styles.muted}>Loading campus dining…</p> : null}

      {!loading
        ? locations.map((loc) => (
            <article
              key={loc.restaurant_id}
              data-testid="campus-dining-location"
              style={styles.card}
            >
              <div style={styles.nameRow}>
                {loc.href ? (
                  <Link to={loc.href} style={styles.nameLink}>
                    {loc.name}
                  </Link>
                ) : (
                  <strong style={styles.name}>{loc.name}</strong>
                )}
              </div>
              {loc.short_description ? (
                <p style={styles.desc}>{loc.short_description}</p>
              ) : null}
              <WhatDinersAreSaying
                restaurantId={loc.restaurant_id}
                restaurantSlug={loc.slug}
                restaurantCity={loc.city}
                restaurantState={loc.state}
                compact
              />
            </article>
          ))
        : null}
    </section>
  );
}

const styles = {
  section: {
    marginBottom: 20,
    padding: "14px 0 4px",
    borderTop: "1px solid #e5e7eb",
    borderBottom: "1px solid #e5e7eb",
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 800,
    letterSpacing: 0.4,
    color: "#111827",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  lead: {
    margin: "0 0 12px",
    fontSize: 14,
    color: "#374151",
    lineHeight: 1.45,
  },
  muted: { fontSize: 13, color: "#6b7280", margin: "0 0 8px" },
  card: {
    marginBottom: 14,
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: "#fff",
  },
  nameRow: { marginBottom: 6 },
  name: { fontSize: 17, fontWeight: 800, color: "#111827" },
  nameLink: {
    fontSize: 17,
    fontWeight: 800,
    color: "#166534",
    textDecoration: "none",
  },
  desc: { margin: "0 0 8px", fontSize: 13, color: "#6b7280", lineHeight: 1.4 },
};
