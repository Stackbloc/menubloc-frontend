/**
 * Additive Waiter section: nearby food activity (info only).
 * Waiter provides information — it does not ask diners to post status,
 * report cluster conditions, or send them on weak cluster-directory errands.
 */

import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useConsumer } from "../context/ConsumerContext.jsx";
import { MY_MENUPLY_PROFILE_PATH } from "../lib/myMenuplyRoutes.js";
import {
  fetchClusterReportFeed,
  listConsumerNotifications,
} from "../lib/consumerApi.js";

function isUsefulInfoLink(item) {
  const href = String(item?.link || "").trim();
  if (!href) return false;
  // Restaurant / dish detail is useful. Venue directory / contribution CTAs are not.
  if (/\/clusters(\/|$)/i.test(href)) return false;
  if (/\/account\/cluster-subscriptions/i.test(href)) return false;
  if (/\/account\/diner[-_]status/i.test(href)) return false;
  if (/\/account\/im-eating/i.test(href)) return false;
  return true;
}

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
        Nearby food activity. What your connections are eating lives on{" "}
        <Link to={MY_MENUPLY_PROFILE_PATH} style={styles.link}>
          My Menuply
        </Link>
        .
      </p>
      {error ? <p style={styles.error}>{error}</p> : null}

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

          <h3 style={styles.h3}>Nearby food</h3>
          {!feed?.recommendations?.length ? (
            <p style={styles.muted}>No recent nearby food signals.</p>
          ) : (
            feed.recommendations.slice(0, 6).map((item, idx) => (
              <div key={`${item.type}-${item.cluster_id}-${idx}`} style={styles.card}>
                <div style={styles.kind}>{item.label || item.type}</div>
                <strong>{item.title}</strong>
                {item.detail ? <div style={styles.muted}>{item.detail}</div> : null}
                {item.cuisine && !String(item.title || "").includes(String(item.cuisine)) ? (
                  <div style={styles.muted}>{item.cuisine}</div>
                ) : null}
                {item.expense_level &&
                !String(item.title || "").includes(String(item.expense_level)) ? (
                  <div style={styles.muted}>{item.expense_level}</div>
                ) : null}
                {isUsefulInfoLink(item) ? (
                  <Link to={item.link} style={styles.link}>
                    {item.link_label && !/cluster/i.test(String(item.link_label))
                      ? item.link_label
                      : "View restaurant →"}
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
          to see notifications and nearby food updates.
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
