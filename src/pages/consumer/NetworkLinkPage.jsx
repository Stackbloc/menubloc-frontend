/**
 * /n/:code — a network's recruitment link (Owner Analytics atomic networks, mig 0410).
 * Remembers the link through sign-up or sign-in and credits it once. It does not make anyone a
 * member, and creates no connection, invite or follow.
 */

import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useConsumer } from "../../context/ConsumerContext.jsx";
import { getNetworkLink } from "../../lib/consumerApi.js";
import { clusterPath } from "../../lib/clusterUrl.js";
import { attachPendingNetworkLink, isNetworkLinkCode, savePendingNetworkLink } from "../../lib/pendingNetworkLink.js";

export default function NetworkLinkPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useConsumer();
  const [link, setLink] = useState(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let live = true;
    if (!isNetworkLinkCode(code)) { setMissing(true); return undefined; }
    getNetworkLink(code)
      .then((res) => {
        if (!live) return;
        setLink(res);
        savePendingNetworkLink(code);
      })
      .catch(() => live && setMissing(true));
    return () => { live = false; };
  }, [code]);

  const home = link ? clusterPath(link.cluster) || "/" : "/";

  useEffect(() => {
    if (!link || authLoading || !isAuthenticated) return;
    attachPendingNetworkLink().finally(() => navigate(home, { replace: true }));
  }, [link, authLoading, isAuthenticated, home, navigate]);

  if (missing) {
    return (
      <main style={styles.page}>
        <h1 style={styles.h1}>This link isn't active</h1>
        <p style={styles.p}>It may have been replaced. You can still use Menuply.</p>
        <Link to="/" style={styles.pill}>Open Menuply</Link>
      </main>
    );
  }
  if (!link || (isAuthenticated && !authLoading)) {
    return <main style={styles.page}><p style={styles.p}>Opening Menuply…</p></main>;
  }
  const next = encodeURIComponent(home);
  return (
    <main style={styles.page}>
      <div style={styles.kicker}>Menuply @ {link.cluster.name}</div>
      <h1 style={styles.h1}>Find food near campus</h1>
      <p style={styles.p}>Shared by {link.network.name}. Menus, prices and who's eating, all in one place.</p>
      <div style={styles.row}>
        <Link to={`/account/signup?next=${next}`} style={styles.pill}>Sign up free</Link>
        <Link to={`/account/login?next=${next}`} style={styles.pillGhost}>Sign in</Link>
      </div>
      <Link to={home} style={styles.skip}>Look around first</Link>
    </main>
  );
}

const styles = {
  page: { maxWidth: 480, margin: "0 auto", padding: "48px 16px", fontFamily: "inherit", color: "#111827", textAlign: "center" },
  kicker: { fontSize: 13, fontWeight: 700, color: "#6B7280", letterSpacing: 0.2, marginBottom: 8 },
  h1: { fontSize: 26, fontWeight: 800, margin: "0 0 10px" },
  p: { fontSize: 15, lineHeight: 1.5, color: "#374151", margin: "0 0 20px" },
  row: { display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginBottom: 16 },
  pill: { display: "inline-block", padding: "10px 20px", borderRadius: 999, background: "#111827", color: "#fff", fontWeight: 700, fontSize: 15, textDecoration: "none" },
  pillGhost: { display: "inline-block", padding: "10px 20px", borderRadius: 999, border: "1px solid #D1D5DB", color: "#111827", fontWeight: 700, fontSize: 15, textDecoration: "none", background: "#fff" },
  skip: { fontSize: 14, color: "#6B7280" },
};
