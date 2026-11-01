/**
 * Connects, the app's Connects page (menuply-mobile src/app/connects/index.tsx; Andre 2026-10-30: its
 * own page, from the Connects box on Profile). Top to bottom (Andre 2026-11-01: the Connects you
 * have matter more than pending ones):
 *   1. What you can do now (ConnectsNowSection): asks to join, Who's Available, Social Plans.
 *   2. Connect Summary (was Your Connects): everyone, color-coded by vibe (same colors as Who's
 *      Available) with Invite; everyone with nothing on underneath in "No activities planned".
 *   3. Pending Connects: requests to you (Accept / Decline) and from you (Cancel) + Find Connects.
 * Route: /feed/connects (/account/connections redirects here).
 */

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DinerAvatar from "../../../components/social/DinerAvatar.jsx";
import { useConsumer } from "../../../context/ConsumerContext.jsx";
import { getCurrentVibeEntry } from "../../../lib/currentVibeDisplay.js";
import { acceptConnection, declineConnection, listConnections, removeConnection } from "../../../lib/consumerApi.js";
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

// One color per vibe, same as Who's Available (app src/features/social/vibeColors.ts).
const VIBE_COLORS = {
  open_for_lunch: "#D97706",
  open_for_dinner: "#4F46E5",
  hungry: "#DC2626",
  coffee: "#92400E",
  join_me: "#16A34A",
};
// Only these say "come eat with me" (same as Who's Available); Me time, Eating at home… sit with
// No activities planned, their vibe shown in gray.
const ACTIVE_VIBES = new Set(["open_for_lunch", "open_for_dinner", "hungry", "coffee"]);

function vibeColor(p) {
  return VIBE_COLORS[String(p?.current_vibe || "").trim()] || C.accent;
}

function activeLine(p, now) {
  return ACTIVE_VIBES.has(String(p?.current_vibe || "").trim()) ? vibeLine(p, now) : null;
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
  const [cancelling, setCancelling] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    let alive = true;
    listConnections()
      .then((l) => {
        if (!alive) return;
        setNow(Date.now());
        setLists({ accepted: l?.accepted || [], incoming: l?.pending_incoming || [], outgoing: l?.pending_outgoing || [] });
      })
      .catch((err) => alive && setError(err?.message || "Couldn’t load your Connects."));
    return () => {
      alive = false;
    };
  }, [isAuthenticated]);

  // Whoever has something on first (Andre 2026-11-01), then by name.
  const accepted = [...(lists?.accepted || [])].sort(
    (a, b) => Number(Boolean(activeLine(b.peer, now))) - Number(Boolean(activeLine(a.peer, now))) || peerName(a.peer).localeCompare(peerName(b.peer))
  );
  // Who has something on, in their colors; then everyone else under "No activities planned".
  const active = accepted.filter((c) => activeLine(c.peer, now));
  const idle = accepted.filter((c) => !activeLine(c.peer, now));
  const availableCount = active.length;
  const personRow = (c) => {
    const line = activeLine(c.peer, now);
    const color = line ? vibeColor(c.peer) : null;
    const quiet = line ? null : vibeLine(c.peer, now);
    const href = `/account/connections/${encodeURIComponent(String(c.peer?.id))}`;
    const foods = (c.peer?.favorite_foods || []).map((f) => f?.label).filter(Boolean).slice(0, 2);
    return (
      <div
        key={c.id}
        style={{ ...styles.row, ...(color ? { borderLeftColor: color, background: `${color}0D` } : null) }}
        data-testid={`connect-${c.peer?.id}`}
      >
        <Link to={href} style={styles.rowLink}>
          <span style={{ ...styles.ring, borderColor: color || "transparent" }}>
            <DinerAvatar avatarUrl={c.peer?.avatar_url} avatarMotionUrl={c.peer?.avatar_motion_url} displayName={peerName(c.peer)} size={44} />
          </span>
          <span style={styles.rowText}>
            <span style={styles.name}>{peerName(c.peer)}</span>
            {line ? (
              <span style={{ ...styles.chip, color, background: `${color}1F` }} data-testid={`connect-${c.peer?.id}-line`}>
                <span style={{ ...styles.dot, background: color }} aria-hidden />
                {line}
              </span>
            ) : quiet ? (
              <span style={styles.muted} data-testid={`connect-${c.peer?.id}-line`}>
                {quiet}
              </span>
            ) : null}
            {foods.length ? <span style={styles.muted}>{`Loves ${foods.join(" · ")}`}</span> : null}
          </span>
        </Link>
        {line ? (
          // Invite opens their profile, which suggests places from both of your lists.
          <Link to={href} style={{ ...styles.invite, background: color }} aria-label={`Invite ${peerName(c.peer)}`} data-testid={`connect-${c.peer?.id}-invite`}>
            Invite
          </Link>
        ) : (
          <span style={styles.muted}>›</span>
        )}
      </div>
    );
  };
  const pendingCount = (lists?.incoming.length || 0) + (lists?.outgoing.length || 0);
  const settle = async (c, act, accept = false) => {
    setCancelling(c.id);
    try {
      await act(c.id);
      setLists((l) =>
        l
          ? {
              accepted: accept ? [...l.accepted, c] : l.accepted,
              incoming: l.incoming.filter((o) => o.id !== c.id),
              outgoing: l.outgoing.filter((o) => o.id !== c.id),
            }
          : l
      );
    } catch {
      /* stays in the list; they can try again */
    } finally {
      setCancelling(null);
    }
  };
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
            <>
              <section style={styles.card} data-testid="connects-list">
                <div style={styles.head}>
                  <h2 style={styles.heading}>Connect Summary · {accepted.length}</h2>
                  {availableCount ? <span style={styles.availableNote}>{`${availableCount} available`}</span> : null}
                </div>
                {accepted.length ? (
                  <>
                    {active.map(personRow)}
                    {idle.length ? (
                      <div style={styles.idle} data-testid="connects-idle">
                        <span style={styles.groupTitle}>{`No activities planned · ${idle.length}`}</span>
                        {idle.map(personRow)}
                      </div>
                    ) : null}
                  </>
                ) : (
                  <p style={styles.muted} data-testid="connects-empty">
                    No Connects yet. Share My Profile on your Profile so friends can connect.
                  </p>
                )}
              </section>

              {/* Pending Connects (Andre 2026-11-01): to you, from you, and Find Connects in one box. */}
              <section style={styles.card} data-testid="connects-pending">
                <div style={styles.head}>
                  <h2 style={styles.heading}>{`Pending Connects${pendingCount ? ` · ${pendingCount}` : ""}`}</h2>
                  <Link to="/account/find-diners" style={styles.find} data-testid="profile-find-diners">
                    Find Connects
                  </Link>
                </div>
                {lists.incoming.length ? <span style={styles.groupTitle}>Want to connect with you</span> : null}
                {lists.incoming.map((c) => (
                  <div key={c.id} style={styles.row} data-testid={`connects-request-${c.id}`}>
                    <Link to={`/diners/${encodeURIComponent(String(c.peer?.id))}`} style={styles.rowLink}>
                      <DinerAvatar avatarUrl={c.peer?.avatar_url} avatarMotionUrl={c.peer?.avatar_motion_url} displayName={peerName(c.peer)} size={40} />
                      <span style={styles.rowText}>
                        <span style={styles.name}>{peerName(c.peer)}</span>
                        <span style={styles.muted}>Wants to connect</span>
                      </span>
                    </Link>
                    <button type="button" style={styles.pill} disabled={cancelling === c.id} onClick={() => settle(c, declineConnection)} data-testid={`connects-request-${c.id}-decline`}>
                      Decline
                    </button>
                    <button type="button" style={styles.pillSolid} disabled={cancelling === c.id} onClick={() => settle(c, acceptConnection, true)} data-testid={`connects-request-${c.id}-accept`}>
                      Accept
                    </button>
                  </div>
                ))}
                {lists.outgoing.length ? <span style={styles.groupTitle}>Requests you sent</span> : null}
                {lists.outgoing.map((c) => (
                  <div key={c.id} style={styles.row} data-testid={`connect-sent-${c.peer?.id}`}>
                    <Link to={`/diners/${encodeURIComponent(String(c.peer?.id))}`} style={styles.rowLink}>
                      <DinerAvatar avatarUrl={c.peer?.avatar_url} avatarMotionUrl={c.peer?.avatar_motion_url} displayName={peerName(c.peer)} size={40} />
                      <span style={styles.rowText}>
                        <span style={styles.name}>{peerName(c.peer)}</span>
                        <span style={styles.muted}>Waiting for them to accept</span>
                      </span>
                    </Link>
                    <button
                      type="button"
                      style={styles.pill}
                      disabled={cancelling === c.id}
                      aria-label={`Cancel request to ${peerName(c.peer)}`}
                      onClick={() => settle(c, removeConnection)}
                    >
                      {cancelling === c.id ? "Cancelling…" : "Cancel"}
                    </button>
                  </div>
                ))}
                {pendingCount ? null : (
                  <p style={styles.muted} data-testid="connects-pending-none">
                    No pending connect requests. Find Connects to meet people who eat like you.
                  </p>
                )}
              </section>
            </>
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
  card: { display: "flex", flexDirection: "column", gap: 8, background: C.background, borderRadius: 16, padding: 16 },
  head: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 },
  availableNote: { fontSize: 13, fontWeight: 700, color: C.accent },
  idle: { display: "flex", flexDirection: "column", gap: 8, paddingTop: 4 },
  groupTitle: { fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.4, marginTop: 4 },
  ring: { display: "inline-flex", borderRadius: 999, border: "2px solid transparent", padding: 2, flexShrink: 0 },
  chip: { alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 5, borderRadius: 999, padding: "2px 8px", fontSize: 13, fontWeight: 700, maxWidth: "100%" },
  dot: { width: 7, height: 7, borderRadius: 4, flexShrink: 0 },
  invite: { flexShrink: 0, borderRadius: 999, padding: "6px 14px", color: "#fff", fontSize: 13, fontWeight: 700, textDecoration: "none" },
  find: { flexShrink: 0, borderRadius: 999, padding: "6px 14px", background: C.accent, color: "#fff", fontSize: 13, fontWeight: 700, textDecoration: "none" },
  pillSolid: { flexShrink: 0, borderRadius: 999, border: "none", background: C.accent, padding: "6px 14px", fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer" },
  heading: { margin: 0, fontSize: 18, lineHeight: "24px", fontWeight: 700, color: C.text },
  row: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    background: C.background,
    borderRadius: 12,
    border: `1px solid ${C.border}`,
    borderLeft: `4px solid ${C.border}`,
    padding: 12,
    color: C.text,
    textDecoration: "none",
  },
  rowLink: { flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 12, color: C.text, textDecoration: "none" },
  pill: { flexShrink: 0, borderRadius: 999, border: `1px solid ${C.border}`, background: "transparent", padding: "6px 14px", fontSize: 13, fontWeight: 700, color: C.text, cursor: "pointer" },
  rowText: { flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 },
  name: { fontSize: 16, fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  vibe: { fontSize: 13, color: C.accent },
  muted: { margin: 0, fontSize: 13, color: C.muted },
  link: { color: C.accent, fontWeight: 700 },
  error: { margin: 0, fontSize: 15, color: C.danger },
};
