/**
 * Circle invite link (plan 38, Andre 2026-11-12): menuply.com/invite/circle/<code>.
 * "An invite-only group for plans and events. A Circle can include your Connects and people
 * you're not connected to." The code rides inside the link, so nobody types it: see the circle,
 * tap Join (sign in first if needed; you come straight back here). The app opens this same link.
 */
import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import StickyPageHeader from "../../components/StickyPageHeader.jsx";
import BottomNav from "../../components/BottomNav.jsx";
import { useConsumer } from "../../context/ConsumerContext.jsx";
import { getCircleLinkPreview, joinCircleByLink } from "../../lib/consumerApi.js";
import { withConsumerAuthNext } from "../../lib/consumerAuthNext.js";

export function circleInvitePath(code) {
  return `/invite/circle/${encodeURIComponent(String(code || ""))}`;
}

export default function CircleInviteLinkPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useConsumer();
  const [circle, setCircle] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [joined, setJoined] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Load after the sign-in check, so the server can say if I'm already in.
  useEffect(() => {
    if (authLoading || !code) return undefined;
    let alive = true;
    getCircleLinkPreview(code)
      .then((data) => {
        if (!alive) return;
        setCircle(data?.circle || null);
        if (data?.circle?.already) setJoined(true);
        if (!data?.circle) setLoadError("This invite link doesn't work any more.");
      })
      .catch((err) => alive && setLoadError(err.message || "This invite link doesn't work any more."));
    return () => {
      alive = false;
    };
  }, [authLoading, code]);

  async function join() {
    if (!isAuthenticated) {
      navigate(withConsumerAuthNext("/account/login", circleInvitePath(code)));
      return;
    }
    setBusy(true);
    setError("");
    try {
      await joinCircleByLink(code);
      setJoined(true);
    } catch (err) {
      setError(err.message || "Couldn't join. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const members = Number(circle?.member_count) || 0;

  return (
    <>
      <StickyPageHeader title="Circle invite" />
      <div style={styles.page} data-testid="circle-invite-link-page">
        {!circle && !loadError ? <p style={styles.muted}>Loading…</p> : null}
        {loadError ? <p style={styles.muted}>{loadError}</p> : null}
        {circle ? (
          <section style={styles.card}>
            <p style={styles.kicker}>
              {circle.owner_name ? `${circle.owner_name} invited you to a circle` : "You're invited to a circle"}
            </p>
            <h1 style={styles.name}>{circle.name}</h1>
            <p style={styles.muted}>
              {members} {members === 1 ? "member" : "members"}
            </p>
            <p style={styles.body}>
              A Circle is an invite-only group for plans and events. Members see the plans shared with it and can join them.
            </p>
            {joined ? (
              <>
                <p style={styles.done} data-testid="circle-invite-joined">
                  You&apos;re in {circle.name}.
                </p>
                <Link to="/account/social-plans" style={styles.link}>
                  See plans ›
                </Link>
              </>
            ) : (
              <button type="button" style={styles.pill} disabled={busy} onClick={join} data-testid="circle-invite-join">
                {busy ? "Joining…" : isAuthenticated ? `Join ${circle.name}` : "Sign in to join"}
              </button>
            )}
            {error ? <p style={styles.error}>{error}</p> : null}
          </section>
        ) : null}
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
    maxWidth: 560,
    margin: "0 auto",
    boxSizing: "border-box",
  },
  card: {
    display: "grid",
    gap: 8,
    padding: "16px",
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 14,
  },
  kicker: { margin: 0, fontSize: 12, fontWeight: 700, color: "#64748b" },
  name: { margin: 0, fontSize: 22, fontWeight: 750, color: "#0f172a" },
  muted: { margin: 0, fontSize: 13, color: "#64748b" },
  body: { margin: 0, fontSize: 15, color: "#334155", lineHeight: 1.45 },
  done: { margin: "4px 0 0", fontSize: 15, fontWeight: 700, color: "#0f172a" },
  link: { fontSize: 15, fontWeight: 650, color: "#2563eb", textDecoration: "none" },
  // Compact outline pill (no full-width buttons, no green pills).
  pill: {
    justifySelf: "start",
    marginTop: 4,
    padding: "8px 16px",
    borderRadius: 999,
    border: "1px solid #2563eb",
    background: "#fff",
    color: "#2563eb",
    fontSize: 15,
    fontWeight: 650,
    cursor: "pointer",
  },
  error: { margin: 0, color: "#b91c1c", fontWeight: 700, fontSize: 13 },
};
