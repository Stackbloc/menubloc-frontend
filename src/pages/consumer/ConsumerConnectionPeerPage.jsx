/**
 * One Connection — not a public diner profile / not a Friend page.
 * Route: /account/connections/:peerId
 */

import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import StickyPageHeader from "../../components/StickyPageHeader.jsx";
import BottomNav from "../../components/BottomNav.jsx";
import { useConsumer } from "../../context/ConsumerContext.jsx";
import { listConnections } from "../../lib/consumerApi.js";

export default function ConsumerConnectionPeerPage() {
  const navigate = useNavigate();
  const { peerId: peerIdParam } = useParams();
  const peerId = Number(peerIdParam);
  const { isAuthenticated, loading: authLoading } = useConsumer();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [connection, setConnection] = useState(null);

  const load = useCallback(async () => {
    setError("");
    try {
      const data = await listConnections("accepted");
      const match = (data.accepted || []).find((c) => Number(c.peer?.id) === peerId);
      setConnection(match || null);
    } catch (err) {
      setError(err.message || "Unable to load Connection");
    } finally {
      setLoading(false);
    }
  }, [peerId]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate(
        `/account/login?next=${encodeURIComponent(`/account/connections/${peerIdParam || ""}`)}`,
        { replace: true }
      );
      return;
    }
    if (!authLoading && isAuthenticated) load();
  }, [authLoading, isAuthenticated, navigate, load, peerIdParam]);

  const peer = connection?.peer;
  const name = peer?.display_name || (peer?.id ? `Member #${peer.id}` : "Connection");

  return (
    <>
      <StickyPageHeader title={name} />
      <div style={styles.page}>
        {error ? <p style={styles.error}>{error}</p> : null}
        {loading ? (
          <p style={styles.muted}>Loading…</p>
        ) : !connection ? (
          <p style={styles.muted}>This person is not one of your Connections.</p>
        ) : (
          <section style={styles.card}>
            <p style={styles.name}>{name}</p>
            {peer?.edu_verified ? (
              <p style={styles.badge}>{peer.edu_verification_badge || ".edu verified"}</p>
            ) : null}
            <p style={styles.muted}>
              People you interact with through Menuply meals and invitations — not a Friend list.
            </p>
            <div style={styles.actions}>
              <Link to={`/account/what-we-doing?with=${encodeURIComponent(String(peer.id))}`} style={styles.primaryBtn}>
                Start a plan
              </Link>
              <Link
                to={`/account/connections/${encodeURIComponent(String(peer.id))}/what-i-ate`}
                style={styles.secondaryBtn}
              >
                What I Ate Today
              </Link>
              <Link to="/account/connections" style={styles.secondaryBtn}>
                All Connections
              </Link>
            </div>
          </section>
        )}
        <p style={{ marginTop: 24 }}>
          <Link to="/account?tab=social" style={styles.link}>
            Back to Social
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
    maxWidth: 640,
    margin: "0 auto",
  },
  muted: { fontSize: 13, color: "#64748b", margin: "0 0 8px", lineHeight: 1.45 },
  error: { color: "#b91c1c", fontWeight: 700, fontSize: 13 },
  card: {
    padding: "16px 14px",
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
  },
  name: { fontSize: 20, fontWeight: 800, color: "#0f172a", margin: "0 0 6px" },
  badge: { fontSize: 12, color: "#14532d", fontWeight: 600, margin: "0 0 10px" },
  actions: { display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 },
  primaryBtn: {
    display: "inline-block",
    borderRadius: 10,
    padding: "10px 14px",
    background: "linear-gradient(135deg, #16a34a, #15803d)",
    color: "#fff",
    fontWeight: 700,
    textDecoration: "none",
  },
  secondaryBtn: {
    display: "inline-block",
    border: "1px solid #cbd5e1",
    borderRadius: 10,
    padding: "10px 14px",
    background: "#fff",
    color: "#334155",
    fontWeight: 600,
    textDecoration: "none",
  },
  link: { color: "#0f766e", fontWeight: 600, textDecoration: "none" },
};
