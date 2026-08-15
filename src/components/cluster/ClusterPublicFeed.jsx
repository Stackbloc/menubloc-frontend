/**
 * Public Cluster Feed — "What's happening with food here?"
 * Food-intel overview board from diner activity + Menuply data.
 * No subscription required. Not a venue-menu directory. No external events.
 */

import React, { useEffect, useMemo, useState } from "react";
import { fetchClusterPublicFeed } from "../../lib/clusterApi.js";

function clusterDisplayName(cluster) {
  const name = String(cluster?.name || "").trim();
  if (name) return name;
  const slug = String(cluster?.slug || "").trim();
  if (!slug) return "this cluster";
  return slug.replace(/-/g, " ");
}

const SECTION_ORDER = [
  "dining_conditions",
  "food_buzz",
  "where_diners",
  "recent_food",
  "new",
  "diner_crew",
];

function groupBySection(items) {
  const map = new Map();
  for (const item of items) {
    const key = item.section || "food_buzz";
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  }
  const groups = [];
  for (const key of SECTION_ORDER) {
    const list = map.get(key);
    if (list?.length) {
      groups.push({
        key,
        label: list[0].section_label || key,
        items: list,
      });
    }
  }
  for (const [key, list] of map.entries()) {
    if (!SECTION_ORDER.includes(key) && list.length) {
      groups.push({
        key,
        label: list[0].section_label || key,
        items: list,
      });
    }
  }
  return groups;
}

export default function ClusterPublicFeed({ cluster }) {
  const [items, setItems] = useState([]);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  const slug = cluster?.slug;
  const placeName = clusterDisplayName(cluster);
  const groups = useMemo(() => groupBySection(items), [items]);

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
      aria-label="What's happening with food here?"
      style={styles.section}
    >
      <div className="cluster-feed-heading" style={styles.sectionTitle}>
        What&apos;s happening with food here?
      </div>
      <p style={styles.lead} data-testid="cluster-feed-happening-now">
        Food activity across {placeName} — from Menuply diners and Menuply data
      </p>

      {loading ? <p style={styles.muted}>Loading…</p> : null}

      {!loading && items.length === 0 ? (
        <p style={styles.muted} data-testid="cluster-feed-empty">
          {notice && !/subscription|waiter|follow/i.test(notice)
            ? notice
            : "Quiet for now — check back when diners post."}
        </p>
      ) : null}

      {!loading && groups.length > 0 ? (
        <div data-testid="cluster-feed-list">
          {groups.map((group) => (
            <div
              key={group.key}
              data-testid="cluster-feed-section"
              data-section={group.key}
              style={styles.group}
            >
              <div className="cluster-feed-section-label" style={styles.groupLabel}>
                {group.label}
              </div>
              <ul style={styles.list}>
                {group.items.map((item, index) => (
                  <li
                    key={`${item.type}-${item.title}-${index}`}
                    data-testid="cluster-feed-item"
                    data-feed-type={item.type || ""}
                    style={styles.row}
                  >
                    <div className="cluster-feed-item-title" style={styles.title}>
                      {item.title}
                    </div>
                    {item.detail && !isMetaDetail(item.detail) ? (
                      <p style={styles.detail}>{item.detail}</p>
                    ) : null}
                    {item.reported_ago ? (
                      <p style={styles.ago} data-testid="cluster-feed-reported-ago">
                        {item.reported_ago}
                      </p>
                    ) : null}
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
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

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
    margin: "0 0 14px",
    fontSize: 14,
    fontWeight: 500,
    color: "#4b5563",
    lineHeight: 1.35,
  },
  muted: { fontSize: 13, color: "#6b7280", margin: "0 0 8px" },
  group: { marginBottom: 14 },
  groupLabel: {
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: 0.35,
    textTransform: "uppercase",
    color: "#0f766e",
    marginBottom: 6,
  },
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
    borderBottom: "1px solid #e5e7eb",
  },
  title: { fontSize: 15, fontWeight: 700, color: "#111827", lineHeight: 1.35 },
  detail: { margin: "3px 0 0", fontSize: 14, color: "#374151", lineHeight: 1.4 },
  ago: { margin: "3px 0 0", fontSize: 12, color: "#6b7280", lineHeight: 1.35 },
  photo: {
    marginTop: 8,
    maxWidth: "100%",
    maxHeight: 140,
    borderRadius: 8,
    objectFit: "cover",
  },
};
