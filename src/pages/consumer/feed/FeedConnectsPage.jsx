/**
 * Connects, the app's Connects page (menuply-mobile src/app/connects/index.tsx; Andre 2026-10-30: its
 * own page, from the Connects pill on Profile). On top, what you can do with your Connects now
 * (ConnectsNowSection: requests to accept, asks to join, Right now, Coming up, Find Connects). Below,
 * everyone you're connected with and their vibe; tap one for their profile.
 * Route: /feed/connects (/account/connections redirects here).
 */

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DinerAvatar from "../../../components/social/DinerAvatar.jsx";
import { useConsumer } from "../../../context/ConsumerContext.jsx";
import { getCurrentVibeEntry } from "../../../lib/currentVibeDisplay.js";
import { listConnections } from "../../../lib/consumerApi.js";
import { FEED_SHELL_LOGIN_PATH } from "../../../lib/feedShellLinks.js";
import { useFeedShellDesktop } from "../../../lib/useFeedShellDesktop.js";
import ConnectsNowSection from "../myMenuply/ConnectsNowSection.jsx";

// App tokens (menuply-mobile src/theme/tokens.ts).
const C = {
  accent: "#0f7a24",
  text: "#111613",
  muted: "#5c665f",
  border: "#e1e6e1",
  surface: "#f5f7f4",
  background: "#ffffff",
  danger: "#b42318",
};

// The default vibe says nothing about them (app connects.ts QUIET_VIBES).
const QUIET_VIBES = new Set(["not_sure_today", "open_for_suggestions", "im_good"]);

function peerName(p) {
  const full = [p?.first_name, p?.last_name].filter(Boolean).join(" ").trim();
  return String(p?.display_name || "").trim() || full || "Menuply diner";
}

function vibeLine(p, now) {
  const value = String(p?.current_vibe || "").trim();
  const label = String(p?.current_vibe_meta?.label || getCurrentVibeEntry(value)?.label || "").trim();
  if (!value || !label || QUIET_VIBES.has(value)) return null;
  const ms = p?.current_vibe_meta?.expires_at ? new Date(p.current_vibe_meta.expires_at).getTime() - now : null;
  if (ms != null && ms <= 0) return null;
  if (ms == null || !Number.isFinite(ms)) return label;
  const mins = Math.ceil(ms / 60000);
  const h = Math.floor(mins / 60);
  return `${label} · ${h ? `${h} h ${mins % 60} m` : `${mins} m`} left`;
}

export default function FeedConnectsPage() {
  const { isAuthenticated, loading: authLoading } = useConsumer();
  const isDesktop = useFeedShellDesktop();
  const [lists, setLists] = useState(null);
  const [error, setError] = useState("");
  // Clock for vibes' time left, read when the list loads (render stays pure).
  const [now, setNow] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    let alive = true;
    listConnections()
      .then((l) => {
        if (!alive) return;
        setNow(Date.now());
        setLists({ accepted: l?.accepted || [], outgoing: l?.pending_outgoing || [] });
      })
      .catch((err) => alive && setError(err?.message || "Couldn’t load your Connects."));
    return () => {
      alive = false;
    };
  }, [isAuthenticated]);

  const accepted = [...(lists?.accepted || [])].sort((a, b) => peerName(a.peer).localeCompare(peerName(b.peer)));
  return (
    <div
      style={{
        ...styles.page,
        // Clear the fixed Feed mobile header, as the Profile does.
        paddingTop: isDesktop ? 16 : "max(56px, calc(env(safe-area-inset-top, 0px) + 52px))",
      }}
      data-testid="feed-connects-page"
    >
      <h1 style={styles.title}>Connects</h1>
      {authLoading ? (
        <p style={styles.muted}>Loading…</p>
      ) : !isAuthenticated ? (
        <p style={styles.muted}>
          <Link to={FEED_SHELL_LOGIN_PATH} style={styles.link}>
            Sign in
          </Link>{" "}
          to see your Connects.
        </p>
      ) : (
        <>
          <ConnectsNowSection onPage />
          {error ? (
            <p style={styles.error} role="alert">
              {error}
            </p>
          ) : !lists ? (
            <p style={styles.muted}>Loading…</p>
          ) : (
            <section style={styles.section} data-testid="connects-list">
              <h2 style={styles.heading}>Your Connects · {accepted.length}</h2>
              {accepted.length ? (
                accepted.map((c) => {
                  const line = vibeLine(c.peer, now);
                  return (
                    <Link key={c.id} to={`/account/connections/${encodeURIComponent(String(c.peer?.id))}`} style={styles.row} data-testid={`connect-${c.peer?.id}`}>
                      <DinerAvatar avatarUrl={c.peer?.avatar_url} avatarMotionUrl={c.peer?.avatar_motion_url} displayName={peerName(c.peer)} size={44} />
                      <span style={styles.rowText}>
                        <span style={styles.name}>{peerName(c.peer)}</span>
                        {line ? <span style={styles.vibe}>{line}</span> : null}
                      </span>
                      <span style={styles.muted}>›</span>
                    </Link>
                  );
                })
              ) : (
                <p style={styles.muted} data-testid="connects-empty">
                  No Connects yet. Share My Profile on your Profile so friends can connect.
                </p>
              )}
              {lists.outgoing.length ? <p style={styles.muted}>Sent and waiting: {lists.outgoing.map((c) => peerName(c.peer)).join(", ")}</p> : null}
            </section>
          )}
        </>
      )}
    </div>
  );
}

const styles = {
  page: {
    background: C.surface,
    minHeight: "100vh",
    maxWidth: 560,
    margin: "0 auto",
    padding: "16px 16px calc(var(--feed-primary-nav-h, 56px) + env(safe-area-inset-bottom, 0px) + 24px)",
    display: "flex",
    flexDirection: "column",
    gap: 16,
    boxSizing: "border-box",
    fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
    color: C.text,
  },
  title: { margin: 0, fontSize: 24, lineHeight: "30px", fontWeight: 700, color: C.text },
  section: { display: "flex", flexDirection: "column", gap: 8 },
  heading: { margin: 0, fontSize: 18, lineHeight: "24px", fontWeight: 700, color: C.text },
  row: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    background: C.background,
    borderRadius: 12,
    border: `1px solid ${C.border}`,
    padding: 12,
    color: C.text,
    textDecoration: "none",
  },
  rowText: { flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 },
  name: { fontSize: 16, fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  vibe: { fontSize: 13, color: C.accent },
  muted: { margin: 0, fontSize: 13, color: C.muted },
  link: { color: C.accent, fontWeight: 700 },
  error: { margin: 0, fontSize: 15, color: C.danger },
};
