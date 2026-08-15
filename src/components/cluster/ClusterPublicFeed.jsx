/**
 * Cluster food-intel board — overview of what's active across the whole cluster.
 * Reads like a status board (not a menu of venue links).
 * No subscription required.
 */

import React, { useEffect, useState } from "react";
import { fetchClusterPublicFeed } from "../../lib/clusterApi.js";

function clusterDisplayName(cluster) {
  const name = String(cluster?.name || "").trim();
  if (name) return name;
  const slug = String(cluster?.slug || "").trim();
  if (!slug) return "this cluster";
  return slug.replace(/-/g, " ");
}

export default function ClusterPublicFeed({ cluster }) {
  const [items, setItems] = useState([]);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  const slug = cluster?.slug;
  const placeName = clusterDisplayName(cluster);

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
          setNotice("");
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
      aria-label="Where is everyone eating today?"
      style={styles.section}
    >
      <div style={styles.sectionTitle}>Where is everyone eating today?</div>
      <p style={styles.lead} data-testid="cluster-feed-happening-now">
        Food intel across {placeName}
      </p>

      {loading ? <p style={styles.muted}>Loading…</p> : null}

      {!loading && items.length === 0 ? (
        <p style={styles.muted} data-testid="cluster-feed-empty">
          {notice && !/subscription|waiter|follow/i.test(notice)
            ? notice
            : "Quiet for now — check back later."}
        </p>
      ) : null}

      {!loading && items.length > 0 ? (
        <ol style={styles.list} data-testid="cluster-feed-list">
          {items.map((item, index) => (
            <li
              key={`${item.type}-${item.title}-${index}`}
              data-testid="cluster-feed-item"
              data-feed-type={item.type || ""}
              style={styles.row}
            >
              <span style={styles.rank} aria-hidden="true">
                {index + 1}
              </span>
              <div style={styles.body}>
                {item.label ? <div style={styles.label}>{item.label}</div> : null}
                <div style={styles.title}>{item.title}</div>
                {item.detail && !isMetaDetail(item.detail) ? (
                  <p style={styles.detail}>{item.detail}</p>
                ) : null}
                {item.photo_url ? (
                  <img
                    src={item.photo_url}
                    alt=""
                    loading="lazy"
                    style={styles.photo}
                  />
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}

/** Hide product/policy blurbs that are not real feed reporting. */
function isMetaDetail(detail) {
  const t = String(detail || "").toLowerCase();
  return (
    t.includes("not a sellable") ||
    t.includes("experience reports") ||
    t.includes("does not track") ||
    t.includes("subscription") ||
    t.includes("waiter")
  );
}

const styles = {
  section: {
    marginBottom: 18,
    padding: "14px 0 4px",
    borderTop: "1px solid #e5e7eb",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 800,
    letterSpacing: 0,
    color: "#111827",
    textTransform: "none",
    marginBottom: 4,
  },
  lead: {
    margin: "0 0 12px",
    fontSize: 14,
    fontWeight: 500,
    color: "#4b5563",
    lineHeight: 1.35,
  },
  muted: { fontSize: 13, color: "#6b7280", margin: "0 0 8px" },
  list: {
    listStyle: "none",
    margin: 0,
    padding: 0,
    display: "grid",
    gap: 0,
    borderTop: "1px solid #e5e7eb",
  },
  row: {
    margin: 0,
    padding: "10px 0",
    display: "grid",
    gridTemplateColumns: "28px 1fr",
    gap: 10,
    alignItems: "start",
    borderBottom: "1px solid #e5e7eb",
  },
  rank: {
    fontSize: 13,
    fontWeight: 700,
    color: "#9ca3af",
    lineHeight: "22px",
    textAlign: "right",
    fontVariantNumeric: "tabular-nums",
  },
  body: { minWidth: 0 },
  label: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.3,
    textTransform: "uppercase",
    color: "#0f766e",
    marginBottom: 2,
  },
  title: { fontSize: 15, fontWeight: 700, color: "#111827", lineHeight: 1.35 },
  detail: { margin: "3px 0 0", fontSize: 13, color: "#6b7280", lineHeight: 1.4 },
  photo: {
    marginTop: 8,
    maxWidth: "100%",
    maxHeight: 140,
    borderRadius: 8,
    objectFit: "cover",
  },
};
