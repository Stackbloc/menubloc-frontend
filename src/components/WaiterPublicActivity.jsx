/**
 * Additive Waiter section: public/nearby food activity (former /activity tab).
 * Does not replace Waiter recommendation cards or connections eating on My Menuply.
 */

import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useConsumer } from "../context/ConsumerContext.jsx";
import { MY_MENUPLY_PROFILE_PATH } from "../lib/myMenuplyRoutes.js";
import {
  fetchClusterReportFeed,
  listConsumerNotifications,
} from "../lib/consumerApi.js";
import { clusterDirectoryPath } from "../lib/clusterUrl.js";

export default function WaiterPublicActivity() {
  const { isAuthenticated, loading: authLoading } = useConsumer();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [feed, setFeed] = useState(null);

  const load = useCallback(async () => {
    setError("");
    try {
      const [notes, report] = await Promise.all([
        listConsumerNotifications().catch(() => ({ notifications: [] })),
        fetchClusterReportFeed({ hours: 72 }).catch(() => null),
      ]);
      setNotifications(notes.notifications || []);
      setFeed(report);
    } catch (err) {
      setError(err.message || "Unable to load activity");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && isAuthenticated) load();
    if (!authLoading && !isAuthenticated) setLoading(false);
  }, [authLoading, isAuthenticated, load]);

  return (
    <section id="activity" data-testid="waiter-activity" style={styles.section} aria-labelledby="waiter-activity-heading">
      <h2 id="waiter-activity-heading" style={styles.h2}>
        What&apos;s happening
      </h2>
      <p style={styles.lead}>
        Broader public and nearby food activity. This is not what your connections are eating — that lives on{" "}
        <Link to={MY_MENUPLY_PROFILE_PATH} style={styles.link}>
          My Menuply
        </Link>
        .
      </p>
      {error ? <p style={styles.error}>{error}</p> : null}

      <p style={styles.muted}>Cluster feeds, diner status, and nearby I&apos;m Eating At.</p>
      <div style={styles.actions}>
        <Link to={clusterDirectoryPath()} style={styles.chip}>
          Clusters · What People Are Eating
        </Link>
        <Link to="/account/diner-status" style={styles.chip}>
          Diner Status
        </Link>
        <Link to="/account/im-eating" style={styles.chip}>
          I&apos;m Eating At
        </Link>
      </div>

      {isAuthenticated ? (
        <>
          <div style={styles.row}>
            <h3 style={styles.h3}>Your notifications</h3>
            <Link to="/account/notifications" style={styles.link}>
              Inbox
            </Link>
          </div>
          {loading ? <p style={styles.muted}>Loading…</p> : null}
          {!loading && notifications.length === 0 ? (
            <p style={styles.muted}>No notifications yet.</p>
          ) : (
            notifications.slice(0, 6).map((n) => (
              <Link key={n.id} to={n.href || "/account/notifications"} style={styles.card}>
                <strong>{n.title}</strong>
                {n.body ? <div style={styles.muted}>{n.body}</div> : null}
              </Link>
            ))
          )}

          <div style={styles.row}>
            <h3 style={styles.h3}>Nearby cluster food</h3>
            <Link to="/account/cluster-subscriptions" style={styles.link}>
              Manage
            </Link>
          </div>
          {!feed?.recommendations?.length ? (
            <p style={styles.muted}>No recent cluster food signals. Follow a cluster to personalize this.</p>
          ) : (
            feed.recommendations.slice(0, 6).map((item, idx) => (
              <div key={`${item.type}-${item.cluster_id}-${idx}`} style={styles.card}>
                <div style={styles.kind}>{item.label || item.type}</div>
                <strong>{item.title}</strong>
                {item.detail ? <div style={styles.muted}>{item.detail}</div> : null}
                {item.link ? (
                  <Link to={item.link} style={styles.link}>
                    {item.link_label || "Open"}
                  </Link>
                ) : null}
              </div>
            ))
          )}
        </>
      ) : (
        <p style={styles.muted}>
          <Link to="/account/login?next=/waiter#activity" style={styles.link}>
            Sign in
          </Link>{" "}
          for notifications. Anyone can still browse clusters and I&apos;m Eating At.
        </p>
      )}
    </section>
  );
}

const styles = {
  section: {
    marginTop: 22,
    borderRadius: 16,
    padding: "14px 15px",
    border: "1px solid rgba(134,239,172,0.14)",
    background: "linear-gradient(180deg, rgba(17,24,20,0.92), rgba(11,15,12,0.92))",
  },
  h2: {
    margin: "0 0 8px",
    fontSize: 15,
    fontWeight: 800,
    color: "#86EFAC",
    letterSpacing: "-0.01em",
  },
  h3: { margin: "14px 0 8px", fontSize: 13, fontWeight: 800, color: "#E5E7EB" },
  lead: { margin: "0 0 10px", fontSize: 13, color: "#CBD5E1", lineHeight: 1.45 },
  muted: { margin: "0 0 8px", fontSize: 12, color: "#9CA3AF", lineHeight: 1.4 },
  error: { color: "#FCA5A5", fontSize: 13 },
  link: { color: "#86EFAC", fontWeight: 700, textDecoration: "none", fontSize: 13 },
  row: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 },
  actions: { display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  chip: {
    display: "inline-flex",
    alignItems: "center",
    minHeight: 30,
    padding: "0 12px",
    borderRadius: 999,
    border: "1px solid rgba(134,239,172,0.22)",
    color: "#DCFCE7",
    fontWeight: 800,
    fontSize: 12,
    textDecoration: "none",
  },
  card: {
    display: "block",
    textDecoration: "none",
    color: "#E5E7EB",
    background: "rgba(11,15,12,0.65)",
    border: "1px solid rgba(134,239,172,0.12)",
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
  },
  kind: { fontSize: 11, fontWeight: 800, color: "#9CA3AF", textTransform: "uppercase" },
};
