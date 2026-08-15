/**
 * Public Cluster Feed — automatic "what's happening" for a Place/cluster.
 * Not Waiter. No subscription required. Authenticated or anonymous.
 */

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchClusterPublicFeed } from "../../lib/clusterApi.js";

export default function ClusterPublicFeed({ cluster }) {
  const [items, setItems] = useState([]);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  const slug = cluster?.slug;

  useEffect(() => {
    let cancelled = false;
    if (!slug) {
      setItems([]);
      setNotice("");
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    fetchClusterPublicFeed(slug, { hours: 72, limit: 24 })
      .then((data) => {
        if (cancelled) return;
        setItems(Array.isArray(data?.items) ? data.items : []);
        setNotice(data?.notice || "");
      })
      .catch(() => {
        if (!cancelled) {
          setItems([]);
          setNotice("Cluster feed temporarily unavailable.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (!slug) return null;

  return (
    <section
      id="cluster-feed"
      data-testid="cluster-public-feed"
      aria-label="Cluster Feed"
      style={styles.section}
    >
      <div style={styles.headerRow}>
        <div style={styles.sectionTitle}>Cluster Feed</div>
        <span style={styles.publicBadge} data-testid="cluster-feed-public-badge">
          Public
        </span>
      </div>
      <p style={styles.lead}>
        What&apos;s happening here — diner statuses, food photos, new places, and deals. Anyone can
        view this feed. Following a cluster only personalizes Waiter; it is not required to read the
        feed.
      </p>

      {loading ? <p style={styles.muted}>Loading feed…</p> : null}

      {!loading && items.length === 0 ? (
        <p style={styles.muted} data-testid="cluster-feed-empty">
          {notice || "No recent public food activity in this cluster yet."}
        </p>
      ) : null}

      {!loading && items.length > 0 ? (
        <ul style={styles.list} data-testid="cluster-feed-list">
          {items.map((item, index) => (
            <li
              key={`${item.type}-${item.link || item.title}-${index}`}
              data-testid="cluster-feed-item"
              data-feed-type={item.type || ""}
              style={styles.card}
            >
              {item.label ? <div style={styles.label}>{item.label}</div> : null}
              {item.link ? (
                <Link to={item.link} style={styles.titleLink}>
                  {item.title}
                </Link>
              ) : (
                <div style={styles.title}>{item.title}</div>
              )}
              {item.detail ? <p style={styles.detail}>{item.detail}</p> : null}
              {item.photo_url ? (
                <img
                  src={item.photo_url}
                  alt=""
                  loading="lazy"
                  style={styles.photo}
                />
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

const styles = {
  section: {
    marginBottom: 18,
    padding: "14px 0 4px",
    borderTop: "1px solid #e5e7eb",
  },
  headerRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 800,
    letterSpacing: 0.4,
    color: "#111827",
    textTransform: "uppercase",
  },
  publicBadge: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 0.3,
    textTransform: "uppercase",
    color: "#14532d",
    background: "#ecfdf5",
    border: "1px solid #a7f3d0",
    borderRadius: 999,
    padding: "2px 8px",
  },
  lead: {
    margin: "0 0 12px",
    fontSize: 14,
    color: "#374151",
    lineHeight: 1.45,
  },
  muted: { fontSize: 13, color: "#6b7280", margin: "0 0 8px" },
  list: { listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 10 },
  card: {
    margin: 0,
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: "#fff",
  },
  label: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.3,
    textTransform: "uppercase",
    color: "#0f766e",
    marginBottom: 4,
  },
  title: { fontSize: 15, fontWeight: 700, color: "#111827", lineHeight: 1.35 },
  titleLink: {
    fontSize: 15,
    fontWeight: 700,
    color: "#166534",
    textDecoration: "none",
    lineHeight: 1.35,
    display: "block",
  },
  detail: { margin: "4px 0 0", fontSize: 13, color: "#6b7280", lineHeight: 1.4 },
  photo: {
    marginTop: 8,
    maxWidth: "100%",
    maxHeight: 160,
    borderRadius: 8,
    objectFit: "cover",
  },
};
