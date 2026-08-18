/**
 * Activity — broader public/nearby food happening.
 * Connection eat/plan sections stay on My Menuply; this page is public happening.
 */

import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import StickyPageHeader from "../components/StickyPageHeader.jsx";
import BottomNav from "../components/BottomNav.jsx";
import { useConsumer } from "../context/ConsumerContext.jsx";
import {
  fetchClusterReportFeed,
  listConsumerNotifications,
} from "../lib/consumerApi.js";
import { clusterDirectoryPath } from "../lib/clusterUrl.js";

export default function ActivityPage() {
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
    <>
      <StickyPageHeader title="Activity" />
      <div style={styles.page} data-testid="activity-page">
        <p style={styles.kicker}>What's happening</p>
        <h1 style={styles.h1}>Activity</h1>
        <p style={styles.lead}>
          Broader public and nearby food activity. This is not what your connections are eating —
          that lives on{" "}
          <Link to="/my-menuply" style={styles.link}>
            My Menuply
          </Link>
          .
        </p>
        {error ? <p style={styles.error}>{error}</p> : null}

        <section style={styles.section}>
          <h2 style={styles.h2}>Public food activity</h2>
          <p style={styles.muted}>Cluster feeds, diner status, and nearby I'm Eating At.</p>
          <div style={styles.actions}>
            <Link to={clusterDirectoryPath()} style={styles.chip}>
              Clusters · What People Are Eating
            </Link>
            <Link to="/account/diner-status" style={styles.chip}>
              Diner Status
            </Link>
            <Link to="/account/im-eating" style={styles.chip}>
              I'm Eating At
            </Link>
          </div>
        </section>

        {isAuthenticated ? (
          <>
            <section style={styles.section}>
              <div style={styles.row}>
                <h2 style={styles.h2}>Your notifications</h2>
                <Link to="/account/notifications" style={styles.link}>
                  Inbox
                </Link>
              </div>
              {loading ? <p style={styles.muted}>Loading…</p> : null}
              {!loading && notifications.length === 0 ? (
                <p style={styles.muted}>No notifications yet.</p>
              ) : (
                notifications.slice(0, 8).map((n) => (
                  <Link key={n.id} to={n.href || "/account/notifications"} style={styles.card}>
                    <strong>{n.title}</strong>
                    {n.body ? <div style={styles.muted}>{n.body}</div> : null}
                  </Link>
                ))
              )}
            </section>

            <section style={styles.section}>
              <div style={styles.row}>
                <h2 style={styles.h2}>Nearby cluster food</h2>
                <Link to="/account/cluster-subscriptions" style={styles.link}>
                  Manage
                </Link>
              </div>
              {!feed?.recommendations?.length ? (
                <p style={styles.muted}>No recent cluster food signals. Follow a cluster to personalize this.</p>
              ) : (
                feed.recommendations.slice(0, 8).map((item, idx) => (
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
            </section>
          </>
        ) : (
          <p style={styles.muted}>
            <Link to="/account/login?next=/activity" style={styles.link}>
              Sign in
            </Link>{" "}
            for notifications. Anyone can still browse clusters and I'm Eating At.
          </p>
        )}
      </div>
      <BottomNav />
    </>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "var(--gb-color-page, #f8fafc)",
    fontFamily: "Inter, Arial, sans-serif",
    padding: "16px 16px calc(var(--bottom-nav-h, 72px) + 16px)",
    maxWidth: 576,
    margin: "0 auto",
    boxSizing: "border-box",
  },
  kicker: {
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: 0.9,
    textTransform: "uppercase",
    color: "#9CA3AF",
    margin: 0,
  },
  h1: { margin: "4px 0 8px", fontSize: 26, fontWeight: 950, letterSpacing: "-0.03em" },
  lead: { margin: "0 0 20px", fontSize: 14, color: "#667085", lineHeight: 1.45 },
  section: { margin: "0 0 24px" },
  h2: { margin: "0 0 8px", fontSize: 17, fontWeight: 900 },
  muted: { margin: "0 0 8px", fontSize: 13, color: "#94A3B8" },
  error: { color: "#B42318", fontSize: 13 },
  link: { color: "#0f766e", fontWeight: 700, textDecoration: "none", fontSize: 13 },
  row: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 },
  actions: { display: "flex", flexWrap: "wrap", gap: 8 },
  chip: {
    display: "inline-flex",
    alignItems: "center",
    minHeight: 32,
    padding: "0 12px",
    borderRadius: 999,
    border: "1px solid #d0d5dd",
    color: "#1F4E3D",
    fontWeight: 800,
    fontSize: 12,
    textDecoration: "none",
  },
  card: {
    display: "block",
    textDecoration: "none",
    color: "inherit",
    background: "#fff",
    border: "1px solid #e4e7ec",
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
  },
  kind: { fontSize: 11, fontWeight: 800, color: "#9CA3AF", textTransform: "uppercase" },
};
