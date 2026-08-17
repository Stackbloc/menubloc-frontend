/**
 * Connection peer food diary — read-only when they opted in to share.
 */

import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import StickyPageHeader from "../../components/StickyPageHeader.jsx";
import BottomNav from "../../components/BottomNav.jsx";
import WhatIAteTodaySection from "../../components/consumer/WhatIAteTodaySection.jsx";
import { useConsumer } from "../../context/ConsumerContext.jsx";
import { listConnections } from "../../lib/consumerApi.js";

export default function ConnectionPeerWhatIAtePage() {
  const navigate = useNavigate();
  const { peerId: peerIdParam } = useParams();
  const peerId = Number(peerIdParam);
  const { isAuthenticated, loading: authLoading } = useConsumer();
  const [loading, setLoading] = useState(true);
  const [connection, setConnection] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await listConnections("accepted");
      const match = (data.accepted || []).find((c) => Number(c.peer?.id) === peerId);
      setConnection(match || null);
    } catch {
      setConnection(null);
    } finally {
      setLoading(false);
    }
  }, [peerId]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate(
        `/account/login?next=${encodeURIComponent(`/account/connections/${peerIdParam || ""}/what-i-ate`)}`,
        { replace: true }
      );
      return;
    }
    if (!authLoading && isAuthenticated) load();
  }, [authLoading, isAuthenticated, navigate, load, peerIdParam]);

  const name =
    connection?.peer?.display_name ||
    (connection?.peer?.id ? `Member #${connection.peer.id}` : "Connection");

  return (
    <>
      <StickyPageHeader title={`${name} — What I Ate`} />
      <div style={styles.page} data-testid="what-i-ate-today-peer-page">
        {loading ? (
          <p style={styles.muted}>Loading…</p>
        ) : !connection?.peer?.id ? (
          <p style={styles.muted}>This person is not one of your Connections.</p>
        ) : (
          <WhatIAteTodaySection
            mode="viewer"
            peerUserId={connection.peer.id}
            layout="page"
            last
          />
        )}
        <p style={styles.back}>
          <Link
            to={`/account/connections/${encodeURIComponent(String(peerIdParam || ""))}`}
            style={styles.link}
          >
            Back to Connection
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
    maxWidth: 960,
    margin: "0 auto",
    boxSizing: "border-box",
  },
  muted: { fontSize: 14, color: "#64748b", margin: 0 },
  back: { marginTop: 24 },
  link: { color: "#0f766e", fontWeight: 600, textDecoration: "none" },
};
