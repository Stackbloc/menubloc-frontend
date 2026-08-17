/**
 * Public Cluster landing dashboard — a quick overview, not a dense report.
 * Clock → Today's Hotspots → Popular today → Who's eating here.
 * Campus dining and events mount on ClusterPage after this board.
 */

import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchClusterPublicFeed } from "../../lib/clusterApi.js";
import { listPublicClusterFoodActivity } from "../../lib/foodActivityApi.js";
import {
  listPublicClusterDinerStatuses,
  listPublicClusterDinerStatusSignals,
} from "../../lib/dinerStatusApi.js";
import { getTimezoneForUsState } from "../../lib/timeZoneUtils.js";
import { clusterPath } from "../../lib/clusterUrl.js";
import {
  buildHotspots,
  buildPopularItems,
  buildWhoIsEatingComments,
  formatClusterNowLine,
} from "../../lib/clusterDashboardModel.js";

function clusterDisplayName(cluster) {
  const name = String(cluster?.name || "").trim();
  if (name) return name;
  const slug = String(cluster?.slug || "").trim();
  if (!slug) return "this cluster";
  return slug.replace(/-/g, " ");
}

function ClusterNowClock({ timeZone }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);
  return (
    <p className="cluster-feed-heading" style={styles.clock} data-testid="cluster-dashboard-clock">
      {formatClusterNowLine(now, timeZone)}
    </p>
  );
}

function StatusLine({ status }) {
  const restHref =
    status?.restaurant_slug || status?.restaurant_id
      ? `/restaurants/${encodeURIComponent(String(status.restaurant_slug || status.restaurant_id))}`
      : null;
  const name = String(status?.display_name || "").trim() || "Someone";
  return (
    <li data-testid="cluster-who-comment" style={styles.row}>
      <div className="cluster-feed-item-title" style={styles.title}>
        {name}
      </div>
      <p style={styles.detail}>{status.display_line}</p>
      {restHref ? (
        <Link to={restHref} style={styles.inlineLink}>
          {status.restaurant_name || "See place"}
        </Link>
      ) : null}
    </li>
  );
}

export default function ClusterPublicFeed({ cluster }) {
  const [activityItems, setActivityItems] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [signals, setSignals] = useState([]);
  const [feedNotice, setFeedNotice] = useState("");
  const [loading, setLoading] = useState(false);

  const slug = cluster?.slug;
  const placeName = clusterDisplayName(cluster);
  const timeZone = getTimezoneForUsState(cluster?.state);
  const restaurantsHref = useMemo(() => {
    const path = clusterPath({
      state: cluster?.state,
      city: cluster?.city,
      slug: cluster?.slug,
    });
    return path ? `${path}?view=restaurants` : "?view=restaurants";
  }, [cluster?.state, cluster?.city, cluster?.slug]);

  const hotspots = useMemo(
    () => buildHotspots({ activityItems, statuses, signals }),
    [activityItems, statuses, signals]
  );
  const popular = useMemo(() => buildPopularItems(activityItems), [activityItems]);
  const comments = useMemo(
    () =>
      buildWhoIsEatingComments({
        statuses,
        hotspotComments: hotspots.items.map((h) => h.comment),
      }),
    [statuses, hotspots.items]
  );

  useEffect(() => {
    let cancelled = false;
    if (!slug && !cluster?.id) {
      setActivityItems([]);
      setStatuses([]);
      setSignals([]);
      setFeedNotice("");
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    Promise.all([
      slug ? fetchClusterPublicFeed(slug, { hours: 24, limit: 24 }) : Promise.resolve({}),
      cluster?.id
        ? listPublicClusterFoodActivity(cluster.id, { limit: 20, hours: 24 })
        : Promise.resolve({ items: [] }),
      cluster?.id
        ? listPublicClusterDinerStatuses(cluster.id, { limit: 16, hours: 24 })
        : Promise.resolve({ statuses: [] }),
      cluster?.id
        ? listPublicClusterDinerStatusSignals(cluster.id, { limit: 10, hours: 24 })
        : Promise.resolve({ signals: [] }),
    ])
      .then(([feed, activity, statusData, signalData]) => {
        if (cancelled) return;
        setActivityItems(Array.isArray(activity?.items) ? activity.items : []);
        setStatuses(Array.isArray(statusData?.statuses) ? statusData.statuses : []);
        setSignals(Array.isArray(signalData?.signals) ? signalData.signals : []);
        setFeedNotice(feed?.notice || "");
      })
      .catch(() => {
        if (!cancelled) {
          setActivityItems([]);
          setStatuses([]);
          setSignals([]);
          setFeedNotice("");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [slug, cluster?.id]);

  if (!slug) return null;

  const quiet =
    !loading &&
    hotspots.items.length === 0 &&
    popular.length === 0 &&
    comments.length === 0;

  return (
    <section
      id="cluster-feed"
      data-testid="cluster-public-feed"
      aria-label={`Today at ${placeName}`}
      style={styles.section}
    >
      <ClusterNowClock timeZone={timeZone} />
      <p style={styles.lead} data-testid="cluster-feed-happening-now">
        A quick look at {placeName} today
      </p>

      {loading ? <p style={styles.muted}>Loading…</p> : null}

      {quiet ? (
        <p style={styles.muted} data-testid="cluster-feed-empty">
          {feedNotice && !/subscription|waiter|follow/i.test(feedNotice)
            ? feedNotice
            : "Quiet so far today — check back when people post."}
        </p>
      ) : null}

      {!loading && hotspots.items.length > 0 ? (
        <div data-testid="cluster-feed-section" data-section="hotspots" style={styles.group}>
          <div className="cluster-feed-section-label" style={styles.groupLabel}>
            Today&apos;s Hotspots
          </div>
          <ul style={styles.list} data-testid="cluster-feed-list">
            {hotspots.items.map((spot) => (
              <li
                key={spot.href || spot.restaurant_name}
                data-testid="cluster-feed-item"
                style={styles.row}
              >
                <div className="cluster-feed-item-title" style={styles.title}>
                  {spot.href ? (
                    <Link to={spot.href} style={styles.nameLink}>
                      {spot.restaurant_name}
                    </Link>
                  ) : (
                    spot.restaurant_name
                  )}
                </div>
                {spot.comment ? <p style={styles.detail}>{spot.comment}</p> : null}
              </li>
            ))}
          </ul>
          {hotspots.moreCount > 0 ? (
            <Link to={restaurantsHref} style={styles.moreLink} data-testid="cluster-hotspots-more">
              See {hotspots.moreCount} more {hotspots.moreCount === 1 ? "place" : "places"}
            </Link>
          ) : null}
        </div>
      ) : null}

      {!loading && popular.length > 0 ? (
        <div data-testid="cluster-feed-section" data-section="popular" style={styles.group}>
          <div className="cluster-feed-section-label" style={styles.groupLabel}>
            Popular today
          </div>
          <ul style={styles.list}>
            {popular.map((item) => (
              <li key={item.menu_item_id} data-testid="cluster-popular-item" style={styles.row}>
                <div className="cluster-feed-item-title" style={styles.title}>
                  <Link to={item.href} style={styles.nameLink}>
                    {item.item_name}
                  </Link>
                </div>
                {item.restaurant_name ? (
                  <p style={styles.detail}>{item.restaurant_name}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {!loading && comments.length > 0 ? (
        <div data-testid="cluster-feed-section" data-section="who" style={styles.group}>
          <div className="cluster-feed-section-label" style={styles.groupLabel}>
            Who&apos;s eating here
          </div>
          <ul style={styles.list} data-testid="cluster-who-list">
            {comments.map((status) => (
              <StatusLine key={status.id || status.display_line} status={status} />
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

const styles = {
  section: {
    marginBottom: 18,
    padding: "10px 0 4px",
    borderTop: "1px solid #e5e7eb",
  },
  clock: {
    fontSize: 22,
    fontWeight: 800,
    letterSpacing: "-0.03em",
    color: "#111827",
    margin: "0 0 4px",
    lineHeight: 1.2,
  },
  lead: {
    margin: "0 0 16px",
    fontSize: 15,
    fontWeight: 500,
    color: "#4b5563",
    lineHeight: 1.35,
  },
  muted: { fontSize: 13, color: "#6b7280", margin: "0 0 8px" },
  group: { marginBottom: 16 },
  groupLabel: {
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: 0.4,
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
  title: { fontSize: 16, fontWeight: 700, color: "#111827", lineHeight: 1.35 },
  detail: { margin: "3px 0 0", fontSize: 14, color: "#374151", lineHeight: 1.4 },
  nameLink: { color: "#111827", textDecoration: "none", fontWeight: 700 },
  inlineLink: {
    display: "inline-block",
    marginTop: 4,
    fontSize: 13,
    fontWeight: 600,
    color: "#166534",
    textDecoration: "none",
  },
  moreLink: {
    display: "inline-block",
    marginTop: 10,
    fontSize: 14,
    fontWeight: 700,
    color: "#166534",
    textDecoration: "none",
  },
};
