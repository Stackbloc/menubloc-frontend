/**
 * Consumer in-app notification inbox (Phase 1).
 * Route: /account/notifications
 */

import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import StickyPageHeader from "../../components/StickyPageHeader.jsx";
import BottomNav from "../../components/BottomNav.jsx";
import { useConsumer } from "../../context/ConsumerContext.jsx";
import {
  listConsumerNotifications,
  markConsumerNotificationRead,
} from "../../lib/consumerApi.js";

export default function ConsumerNotificationsPage() {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useConsumer();
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const data = await listConsumerNotifications();
      setItems(data.notifications || []);
      setUnread(data.unread_count || 0);
    } catch (err) {
      setError(err.message || "Unable to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate(`/account/login?next=${encodeURIComponent("/account/notifications")}`, {
        replace: true,
      });
      return;
    }
    if (!authLoading && isAuthenticated) load();
  }, [authLoading, isAuthenticated, navigate, load]);

  async function onOpen(n) {
    try {
      if (!n.read_at) await markConsumerNotificationRead(n.id);
    } catch {
      // still navigate
    }
    if (n.href) navigate(n.href);
    else load();
  }

  return (
    <>
      <StickyPageHeader title="Notifications" />
      <div style={styles.page}>
        <p style={styles.muted}>
          {unread > 0 ? `${unread} unread` : "You're caught up."}
        </p>
        {error ? <p style={styles.error}>{error}</p> : null}
        {loading || authLoading ? (
          <p style={styles.muted}>Loading…</p>
        ) : items.length === 0 ? (
          <p style={styles.muted}>No notifications yet.</p>
        ) : (
          <ul style={styles.list}>
            {items.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  style={{
                    ...styles.item,
                    ...(n.read_at ? {} : styles.unread),
                  }}
                  onClick={() => onOpen(n)}
                >
                  <strong>{n.title}</strong>
                  {n.body ? <div style={styles.body}>{n.body}</div> : null}
                  <div style={styles.time}>
                    {n.created_at ? new Date(n.created_at).toLocaleString() : ""}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
        <p style={styles.back}>
          <Link to="/account/what-we-doing" style={styles.link}>
            What We Doing?
          </Link>
          {" · "}
          <Link to="/account" style={styles.link}>
            Account
          </Link>
        </p>
      </div>
      <BottomNav />
    </>
  );
}

const styles = {
  page: {
    maxWidth: 520,
    margin: "0 auto",
    padding: "16px 16px 96px",
    fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
  },
  muted: { color: "#64748b", fontSize: 14 },
  error: { color: "#b91c1c", fontWeight: 600 },
  list: { listStyle: "none", padding: 0, margin: "12px 0 0", display: "grid", gap: 8 },
  item: {
    width: "100%",
    textAlign: "left",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: 14,
    background: "#fff",
    cursor: "pointer",
  },
  unread: { borderColor: "#86efac", background: "#f0fdf4" },
  body: { marginTop: 4, color: "#475569", fontSize: 13 },
  time: { marginTop: 6, color: "#94a3b8", fontSize: 11 },
  back: { marginTop: 24, fontSize: 14 },
  link: { color: "#166534", fontWeight: 700, textDecoration: "none" },
};
