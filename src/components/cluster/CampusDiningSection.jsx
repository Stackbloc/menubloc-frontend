/**
 * Campus Dining — university Cluster section only.
 * Place list (halls + campus spots) + Phase 1 Line/Food indicators.
 * Comments live on the cluster dashboard. No dining-hall menu analysis.
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchClusterCampusDining,
  fetchClusterCampusLive,
} from "../../lib/clusterApi.js";
import { getOrCreateGuestReporterKey } from "../../lib/guestReporterSession.js";
import { useConsumer } from "../../context/ConsumerContext.jsx";
import CampusLiveGlanceBar from "./CampusLiveGlanceBar.jsx";
import CampusLiveUpdateSheet from "./CampusLiveUpdateSheet.jsx";

function isUniversityCluster(cluster) {
  return String(cluster?.type || cluster?.cluster_type || "")
    .trim()
    .toLowerCase() === "university";
}

function StatusChip({ label, muted = false }) {
  return (
    <span
      data-testid={muted ? "campus-live-chip-empty" : "campus-live-chip"}
      style={{
        ...styles.chip,
        ...(muted ? styles.chipMuted : null),
      }}
    >
      {label}
    </span>
  );
}

export default function CampusDiningSection({ cluster, showGlance = true }) {
  const { isAuthenticated } = useConsumer();
  const [locations, setLocations] = useState([]);
  const [live, setLive] = useState(null);
  const [loading, setLoading] = useState(false);
  const [liveLoading, setLiveLoading] = useState(false);
  const [updateVenueId, setUpdateVenueId] = useState(null);

  const slug = cluster?.slug;
  const university = isUniversityCluster(cluster);

  const loadLive = useCallback(() => {
    if (!university || !slug) {
      setLive(null);
      return Promise.resolve(null);
    }
    setLiveLoading(true);
    const guestKey = isAuthenticated ? null : getOrCreateGuestReporterKey();
    return fetchClusterCampusLive(slug, { guestKey })
      .then((data) => {
        setLive(data || null);
        return data;
      })
      .catch(() => {
        setLive(null);
        return null;
      })
      .finally(() => setLiveLoading(false));
  }, [university, slug, isAuthenticated]);

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

  useEffect(() => {
    let cancelled = false;
    loadLive().then(() => {
      if (cancelled) return;
    });
    const id = setInterval(() => {
      loadLive();
    }, 45000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [loadLive]);

  const venueById = useMemo(() => {
    const map = new Map();
    for (const v of live?.venues || []) {
      map.set(Number(v.restaurant_id), v);
    }
    return map;
  }, [live]);

  const updateVenue = updateVenueId != null ? venueById.get(Number(updateVenueId)) : null;
  const updateLocation =
    updateVenueId != null
      ? locations.find((l) => Number(l.restaurant_id) === Number(updateVenueId))
      : null;

  function scrollToVenue(restaurantId) {
    const el = document.querySelector(
      `[data-campus-venue-id="${Number(restaurantId)}"]`
    );
    if (el?.scrollIntoView) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  if (!university) return null;
  if (!loading && locations.length === 0) return null;

  return (
    <section
      id="campus-dining"
      data-testid="campus-dining"
      aria-label="On campus"
      style={styles.section}
    >
      <div className="cluster-feed-section-label" style={styles.sectionTitle}>
        On campus
      </div>
      <p style={styles.lead}>
        Dining halls and campus spots — tap a name for what&apos;s going on there.
      </p>

      {showGlance ? (
        <CampusLiveGlanceBar
          glance={live?.glance}
          loading={liveLoading && !live}
          onSelectVenue={scrollToVenue}
        />
      ) : null}

      {loading ? <p style={styles.muted}>Loading campus dining…</p> : null}

      {!loading
        ? locations.map((loc) => {
            const status = venueById.get(Number(loc.restaurant_id));
            const line = status?.line;
            const food = status?.food;
            const age = status?.age_label;
            return (
              <article
                key={loc.restaurant_id}
                data-testid="campus-dining-location"
                data-campus-venue-id={loc.restaurant_id}
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
                  {loc.entity_label ||
                  String(loc.entity_type || loc.restaurant_type || "").toLowerCase() ===
                    "dining_hall" ? (
                    <span style={styles.entityBadge} data-testid="campus-dining-entity-type">
                      {loc.entity_label || "Dining Hall"}
                    </span>
                  ) : null}
                  <button
                    type="button"
                    data-testid="campus-live-update-link"
                    style={styles.updateLink}
                    onClick={() => setUpdateVenueId(loc.restaurant_id)}
                  >
                    Update
                  </button>
                </div>
                <div style={styles.chipRow} data-testid="campus-live-status-row">
                  {line ? (
                    <StatusChip label={`Line · ${line.label}`} />
                  ) : (
                    <StatusChip label="No recent reports" muted />
                  )}
                  {food ? <StatusChip label={`Food · ${food.label}`} /> : null}
                  {age && (line || food) ? (
                    <span style={styles.age} data-testid="campus-live-age">
                      {age}
                    </span>
                  ) : null}
                </div>
                {loc.short_description ? (
                  <p style={styles.desc}>{loc.short_description}</p>
                ) : null}
              </article>
            );
          })
        : null}

      <CampusLiveUpdateSheet
        open={updateVenueId != null}
        onClose={() => setUpdateVenueId(null)}
        clusterSlug={slug}
        venue={
          updateVenue || updateLocation
            ? {
                restaurant_id: Number(updateVenueId),
                name: updateVenue?.name || updateLocation?.name || "Campus spot",
                viewer: updateVenue?.viewer || { line: null, food: null },
              }
            : null
        }
        onSaved={(nextLive) => {
          if (nextLive) setLive(nextLive);
          else loadLive();
        }}
      />
    </section>
  );
}

const styles = {
  section: {
    marginBottom: 20,
    padding: "14px 0 4px",
    borderTop: "1px solid #e5e7eb",
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: 0.4,
    color: "#0f766e",
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
    marginBottom: 10,
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: "#fff",
  },
  nameRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
  },
  name: { fontSize: 16, fontWeight: 800, color: "#111827" },
  nameLink: {
    fontSize: 16,
    fontWeight: 800,
    color: "#166534",
    textDecoration: "none",
  },
  entityBadge: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.3,
    textTransform: "uppercase",
    color: "#14532d",
    background: "#ecfdf5",
    border: "1px solid #a7f3d0",
    borderRadius: 999,
    padding: "2px 8px",
  },
  updateLink: {
    marginLeft: "auto",
    border: "none",
    background: "transparent",
    color: "#0f766e",
    fontWeight: 800,
    fontSize: 13,
    cursor: "pointer",
    padding: "2px 0",
    textDecoration: "underline",
  },
  chipRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
    alignItems: "center",
    marginTop: 8,
  },
  chip: {
    fontSize: 12,
    fontWeight: 700,
    color: "#065f46",
    background: "#ecfdf5",
    border: "1px solid #a7f3d0",
    borderRadius: 999,
    padding: "3px 9px",
  },
  chipMuted: {
    color: "#6b7280",
    background: "#f3f4f6",
    border: "1px solid #e5e7eb",
  },
  age: { fontSize: 12, fontWeight: 600, color: "#6b7280" },
  desc: { margin: "6px 0 0", fontSize: 13, color: "#6b7280", lineHeight: 1.4 },
};
