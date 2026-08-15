/**
 * Manage followed places + personalized food updates from their public Cluster Feeds.
 */

import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import StickyPageHeader from "../../components/StickyPageHeader.jsx";
import BottomNav from "../../components/BottomNav.jsx";
import { useConsumer } from "../../context/ConsumerContext.jsx";
import {
  listMyClusterSubscriptions,
  unsubscribeFromCluster,
  fetchClusterReportFeed,
} from "../../lib/consumerApi.js";
import { clusterDirectoryPath } from "../../lib/clusterUrl.js";

export default function ClusterSubscriptionsPage() {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useConsumer();
  const [subs, setSubs] = useState([]);
  const [feed, setFeed] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const [s, f] = await Promise.all([
        listMyClusterSubscriptions(),
        fetchClusterReportFeed({ hours: 72 }),
      ]);
      setSubs(s.subscriptions || []);
      setFeed(f);
    } catch (err) {
      setError(err.message || "Unable to load cluster subscriptions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate(`/account/login?next=${encodeURIComponent("/account/cluster-subscriptions")}`, {
        replace: true,
      });
      return;
    }
    if (!authLoading && isAuthenticated) {
      load();
    }
  }, [authLoading, isAuthenticated, navigate, load]);

  async function handleUnfollow(clusterId) {
    setBusy(true);
    setError("");
    try {
      await unsubscribeFromCluster(clusterId);
      await load();
    } catch (err) {
      setError(err.message || "Unable to unfollow");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <StickyPageHeader title="Followed places" />
      <div style={styles.page}>
        <p style={styles.lead}>
          Places you follow for personalized food updates. Each place still has a public Cluster Feed
          anyone can open.
        </p>
        {error ? <p style={styles.error}>{error}</p> : null}

        <section style={styles.section}>
          <h2 style={styles.h2}>Your clusters</h2>
          {loading ? <p style={styles.muted}>Loading…</p> : null}
          {!loading && subs.length === 0 ? (
            <p style={styles.muted}>
              No clusters yet. Open a cluster page and tap Follow cluster.{" "}
              <Link to="/clusters" style={styles.link}>
                Browse clusters
              </Link>
            </p>
          ) : (
            <ul style={styles.list}>
              {subs.map((s) => {
                const c = s.cluster || {};
                const href = c.slug ? `/clusters/${c.slug}` : clusterDirectoryPath();
                return (
                  <li key={s.cluster_id} style={styles.card}>
                    <div>
                      <Link to={href} style={styles.link}>
                        <strong>{c.name || `Cluster #${s.cluster_id}`}</strong>
                      </Link>
                      <div style={styles.muted}>
                        {[c.city, c.state].filter(Boolean).join(", ")}
                      </div>
                    </div>
                    <button
                      type="button"
                      style={styles.secondaryBtn}
                      disabled={busy}
                      onClick={() => handleUnfollow(s.cluster_id)}
                    >
                      Unfollow
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section style={styles.section}>
          <h2 style={styles.h2}>Food report</h2>
          <p style={styles.muted}>
            Hierarchy: you → selected clusters → restaurants/food → activity.
          </p>
          {!feed?.recommendations?.length ? (
            <p style={styles.muted}>No recent cluster food signals yet.</p>
          ) : (
            <ul style={styles.list}>
              {feed.recommendations.map((item, idx) => (
                <li
                  key={`${item.type}-${item.cluster_id}-${idx}`}
                  style={styles.card}
                  data-testid="cluster-report-item"
                >
                  <div>
                    <div style={styles.kind}>{item.label || item.type}</div>
                    <strong>{item.title}</strong>
                    {item.detail ? <div style={styles.muted}>{item.detail}</div> : null}
                    {item.cluster_name ? (
                      <div style={styles.muted}>{item.cluster_name}</div>
                    ) : null}
                  </div>
                  {item.link ? (
                    <Link to={item.link} style={styles.link}>
                      {item.link_label || "Open"}
                    </Link>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>

        <p style={{ marginTop: 24 }}>
          <Link to="/account" style={styles.link}>
            Account
          </Link>
          {" · "}
          <Link to="/clusters" style={styles.link}>
            Browse clusters
          </Link>
        </p>
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
    maxWidth: 720,
    margin: "0 auto",
  },
  lead: { fontSize: 14, color: "#334155", lineHeight: 1.5 },
  muted: { fontSize: 13, color: "#64748b" },
  error: { color: "#b91c1c", fontWeight: 700, fontSize: 13 },
  section: { marginTop: 20 },
  h2: { fontSize: 16, margin: "0 0 10px", color: "#0f172a" },
  list: { listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 },
  card: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
    padding: "12px 14px",
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
  },
  kind: {
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    color: "#166534",
    marginBottom: 2,
  },
  secondaryBtn: {
    border: "1px solid #cbd5e1",
    borderRadius: 10,
    padding: "8px 12px",
    background: "#fff",
    cursor: "pointer",
  },
  link: { color: "#0f766e", fontWeight: 600, textDecoration: "none" },
};
