/**
 * Subscribe / unsubscribe to a destination cluster for food report feeds.
 */

import React, { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useConsumer } from "../../context/ConsumerContext.jsx";
import {
  getClusterSubscriptionStatus,
  subscribeToCluster,
  unsubscribeFromCluster,
} from "../../lib/consumerApi.js";

export default function ClusterSubscribeButton({ clusterId, clusterName = "" }) {
  const location = useLocation();
  const { isAuthenticated } = useConsumer();
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!clusterId || !isAuthenticated) {
      setSubscribed(false);
      return;
    }
    try {
      const data = await getClusterSubscriptionStatus(clusterId);
      setSubscribed(data.subscribed === true);
    } catch {
      setSubscribed(false);
    }
  }, [clusterId, isAuthenticated]);

  useEffect(() => {
    load();
  }, [load]);

  if (!clusterId) return null;

  async function toggle() {
    if (!isAuthenticated) return;
    setBusy(true);
    setError("");
    try {
      if (subscribed) {
        await unsubscribeFromCluster(clusterId);
        setSubscribed(false);
      } else {
        await subscribeToCluster(clusterId);
        setSubscribed(true);
      }
    } catch (err) {
      setError(err.message || "Unable to update subscription");
    } finally {
      setBusy(false);
    }
  }

  const loginNext = `${location.pathname}${location.search || ""}`;

  return (
    <div data-testid="cluster-subscribe" style={{ marginTop: 10 }}>
      {!isAuthenticated ? (
        <p style={styles.hint}>
          <Link to={`/account/login?next=${encodeURIComponent(loginNext)}`} style={styles.link}>
            Sign in
          </Link>{" "}
          to have Waiter monitor {clusterName || "this cluster"}. The public Cluster Feed above does
          not require following.
        </p>
      ) : (
        <button
          type="button"
          data-testid="cluster-subscribe-toggle"
          style={subscribed ? styles.secondary : styles.primary}
          disabled={busy}
          onClick={toggle}
        >
          {subscribed ? "Waiter is monitoring" : "Follow for Waiter"}
        </button>
      )}
      {isAuthenticated && !subscribed ? (
        <p style={styles.subhint}>
          Optional — anyone can still read the public Cluster Feed without following.
        </p>
      ) : null}
      {error ? (
        <p style={styles.error} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

const styles = {
  primary: {
    border: "none",
    borderRadius: 10,
    padding: "10px 14px",
    background: "linear-gradient(135deg, #16a34a, #15803d)",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
  },
  secondary: {
    border: "1px solid #15803d",
    borderRadius: 10,
    padding: "10px 14px",
    background: "#dcfce7",
    color: "#14532d",
    fontWeight: 700,
    cursor: "pointer",
  },
  hint: { margin: 0, fontSize: 13, color: "#64748b" },
  subhint: { margin: "6px 0 0", fontSize: 12, color: "#94a3b8", lineHeight: 1.4 },
  link: { color: "#0f766e", fontWeight: 600 },
  error: { margin: "6px 0 0", color: "#b91c1c", fontSize: 12, fontWeight: 700 },
};
