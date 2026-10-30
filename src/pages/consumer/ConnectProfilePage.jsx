/**
 * A Connect's profile, the same as the app's Connect screen (menuply-mobile src/app/connects/[id].tsx;
 * the app wins, Andre 2026-10-30): photo, vibe right now, about, their plans, what they've been eating
 * and their Wish List. A dish opens its restaurant's menu. End connection / Block / Report sit at the
 * bottom, tucked away. Shown inside the Feed shell, so the header and tabs match the Profile.
 * Route: /account/connections/:peerId (?hub=1 keeps the older diner-hub page).
 * SelfConnectView is the same screen with your own data: Profile → Connect View (Andre 2026-10-30:
 * "use the app's profile screen only … simplicity rules").
 */

import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import FeedShellPage from "./feed/FeedShellPage.jsx";
import { useFeedShellDesktop } from "../../lib/useFeedShellDesktop.js";
import DinerAvatar from "../../components/social/DinerAvatar.jsx";
import { MY_MENUPLY_PROFILE_PATH } from "../../lib/myMenuplyRoutes.js";
import { restaurantMenuPathFromRow } from "../../lib/canonicalUrl.js";
import {
  blockDiner,
  listConnections,
  listConnectionsEating,
  listMyFoodActivity,
  listPeerWantToEat,
  listWantToEat,
  removeConnection,
  reportDinerAbuse,
} from "../../lib/consumerApi.js";
import { getCurrentVibeEntry } from "../../lib/currentVibeDisplay.js";
import { PeerPlansSection } from "./myMenuply/SocialPlanSharing.jsx";
import ConsumerConnectionPeerPage from "./ConsumerConnectionPeerPage.jsx";

// App tokens (menuply-mobile src/theme/tokens.ts).
const C = {
  accent: "#0f7a24",
  accentSoft: "#e8f5e3",
  text: "#111613",
  muted: "#5c665f",
  border: "#e1e6e1",
  surface: "#f5f7f4",
  background: "#ffffff",
  danger: "#b42318",
};

// The default vibe says nothing about them (app connects.ts QUIET_VIBES).
const QUIET_VIBES = new Set(["not_sure_today", "open_for_suggestions", "im_good"]);

const REPORT_REASONS = [
  ["harassment", "Harassment"],
  ["spam", "Spam"],
  ["impersonation", "Impersonation"],
  ["inappropriate", "Inappropriate"],
  ["other", "Other"],
];

function peerName(p) {
  const full = [p?.first_name, p?.last_name].filter(Boolean).join(" ").trim();
  return String(p?.display_name || "").trim() || full || "Menuply diner";
}

function liveVibe(p) {
  const value = String(p?.current_vibe || "").trim();
  const label = String(p?.current_vibe_meta?.label || getCurrentVibeEntry(value)?.label || "").trim();
  if (!value || !label || QUIET_VIBES.has(value)) return null;
  return { label, expiresAt: p?.current_vibe_meta?.expires_at || null };
}

/** "2 h 10 m" left, or null once it ran out. */
function timeLeft(expiresAt, now) {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - now;
  if (!Number.isFinite(ms) || ms <= 0) return null;
  const mins = Math.ceil(ms / 60000);
  const h = Math.floor(mins / 60);
  return h ? `${h} h ${mins % 60} m` : `${mins} m`;
}

/** "5 m ago", "3 h ago", "2 d ago" (app connects.ts ago). */
function ago(iso, now) {
  if (!iso) return null;
  const ms = now - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return null;
  const m = Math.floor(ms / 60000);
  if (m < 60) return `${Math.max(m, 1)} m ago`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h} h ago` : `${Math.floor(h / 24)} d ago`;
}

export default function ConnectProfilePage() {
  const [searchParams] = useSearchParams();
  if (searchParams.get("hub") === "1") return <ConsumerConnectionPeerPage />;
  return <ConnectProfile />;
}

function ConnectProfile() {
  const { peerId: rawPeerId } = useParams();
  const peerId = Number(rawPeerId);
  const navigate = useNavigate();
  const isDesktop = useFeedShellDesktop();
  const [connection, setConnection] = useState(null);
  const [eating, setEating] = useState(null);
  const [wishes, setWishes] = useState(null);
  const [error, setError] = useState("");
  // Clock for the vibe's time left and "ago", read when the Connect loads (render stays pure).
  const [now, setNow] = useState(0);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("harassment");
  const [reportDetails, setReportDetails] = useState("");

  useEffect(() => {
    if (!Number.isFinite(peerId) || peerId <= 0) {
      setError("This Connect could not be found.");
      return undefined;
    }
    let alive = true;
    listConnections()
      .then((l) => {
        if (!alive) return;
        const c = (l?.accepted || []).find((x) => Number(x?.peer?.id) === peerId);
        setNow(Date.now());
        if (c) setConnection(c);
        else setError("You’re not connected with this diner.");
      })
      .catch((err) => alive && setError(err?.message || "Couldn’t load this Connect."));
    listConnectionsEating(12, peerId)
      .then((r) => alive && setEating(Array.isArray(r?.items) ? r.items : []))
      .catch(() => alive && setEating([]));
    listPeerWantToEat(peerId)
      .then((r) => alive && setWishes(Array.isArray(r?.items) ? r.items : []))
      .catch(() => alive && setWishes([]));
    return () => {
      alive = false;
    };
  }, [peerId]);

  const peer = connection?.peer || null;
  const name = peer ? peerName(peer) : "Connect";

  async function endConnection() {
    if (!connection?.id || !window.confirm(`End your connection with ${name}?`)) return;
    setBusy(true);
    try {
      await removeConnection(connection.id);
      navigate(MY_MENUPLY_PROFILE_PATH, { replace: true });
    } catch (err) {
      setError(err?.message || "Couldn’t end the connection.");
      setBusy(false);
    }
  }

  async function block() {
    if (!window.confirm(`Block ${name}? You won’t see each other in Menuply and they can’t connect with you.`)) return;
    setBusy(true);
    try {
      await blockDiner(peerId);
      navigate(MY_MENUPLY_PROFILE_PATH, { replace: true });
    } catch (err) {
      setError(err?.message || "Couldn’t block this diner.");
      setBusy(false);
    }
  }

  async function report(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await reportDinerAbuse(peerId, { reason: reportReason, details: reportDetails.trim() || undefined });
      setReportOpen(false);
      setReportDetails("");
      setNotice("Thanks. Your report went to Menuply.");
    } catch (err) {
      setError(err?.message || "Couldn’t send the report.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <FeedShellPage>
      <div
        style={{
          ...styles.page,
          // Clear the fixed Feed mobile header (logo + Edit View + menu), as the Profile does.
          paddingTop: isDesktop ? 16 : "max(56px, calc(env(safe-area-inset-top, 0px) + 52px))",
        }}
        data-testid="connect-profile"
      >
        <Link to={MY_MENUPLY_PROFILE_PATH} style={styles.back}>
          ‹ Profile
        </Link>
        {error ? (
          <p style={styles.error} role="alert">
            {error}
          </p>
        ) : !peer ? (
          <p style={styles.muted}>Loading…</p>
        ) : (
          <>
            <ConnectScreenBody peer={peer} name={name} eating={eating} wishes={wishes} now={now} peerId={peerId} />

            {notice ? <p style={styles.notice}>{notice}</p> : null}
            <div style={styles.safety} data-testid="connect-profile-safety">
              <button type="button" style={styles.quiet} disabled={busy} onClick={endConnection}>
                End connection
              </button>
              <span style={styles.dot}>·</span>
              <button type="button" style={styles.quiet} disabled={busy} onClick={block}>
                Block
              </button>
              <span style={styles.dot}>·</span>
              <button type="button" style={styles.quiet} disabled={busy} onClick={() => setReportOpen((v) => !v)}>
                Report
              </button>
            </div>
            {reportOpen ? (
              <form onSubmit={report} style={styles.report} data-testid="connect-profile-report">
                <select value={reportReason} onChange={(e) => setReportReason(e.target.value)} style={styles.input}>
                  {REPORT_REASONS.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <textarea
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value.slice(0, 2000))}
                  rows={3}
                  placeholder="Anything else? (optional)"
                  style={styles.input}
                />
                <button type="submit" style={{ ...styles.pill, border: "none", cursor: "pointer" }} disabled={busy}>
                  Send report
                </button>
              </form>
            ) : null}
          </>
        )}
      </div>
    </FeedShellPage>
  );
}

/** The app's Connect screen body: header, plans, Eating lately, Wish List. `self` = Connect View. */
export function ConnectScreenBody({ peer, name, eating, wishes, now, peerId = null, self = false }) {
  const first = name.split(" ")[0];
  const vibe = liveVibe(peer);
  const left = vibe ? timeLeft(vibe.expiresAt, now) : null;
  const school = peer?.edu_verified === true ? peer.edu_verification_badge || null : null;
  return (
    <>
      <section style={styles.head}>
        <DinerAvatar avatarUrl={peer.avatar_url} avatarMotionUrl={peer.avatar_motion_url} displayName={name} size={88} />
        <h1 style={styles.title}>{name}</h1>
        {school ? <p style={styles.muted}>{school}</p> : null}
        <p style={styles.vibe} data-testid="connect-profile-vibe">
          {vibe ? `${vibe.label}${left ? ` · ${left} left` : ""}` : "No vibe set right now"}
        </p>
        {peer.diner_about ? <p style={styles.about}>{peer.diner_about}</p> : null}
        {/* A live vibe is a reason to eat together now (Andre 2026-10-28). */}
        {vibe && left && !self ? (
          <Link to="/account/invite-to-eat" style={styles.pill} data-testid="connect-profile-invite">
            {`Invite ${first} to eat`}
          </Link>
        ) : null}
      </section>

      {self ? null : <PeerPlansSection peerId={peerId} name={name} />}

      <section style={styles.section} data-testid="connect-profile-eating">
        <h2 style={styles.heading}>Eating lately</h2>
        {eating == null ? <p style={styles.muted}>Loading…</p> : null}
        {eating?.length === 0 ? <p style={styles.muted}>Nothing in the last few days.</p> : null}
        {(eating || []).map((e) => (
          <DishRow
            key={e.id}
            food={e.food_name || "Food"}
            line={[e.restaurant_name, ago(e.created_at, now)].filter(Boolean).join(" · ")}
            comment={e.comment && e.comment !== e.food_name ? e.comment : null}
            to={e.restaurant_id ? restaurantMenuPathFromRow(e) : null}
            testId={`connect-eating-${e.id}`}
          />
        ))}
      </section>

      <section style={styles.section} data-testid="connect-profile-wishlist">
        <h2 style={styles.heading}>Wish List</h2>
        {wishes == null ? <p style={styles.muted}>Loading…</p> : null}
        {wishes?.length === 0 ? <p style={styles.muted}>Nothing on it yet.</p> : null}
        {(wishes || []).map((w) => (
          <DishRow
            key={w.id}
            food={w.item_name || w.food_name || "Food"}
            line={w.restaurant_name || ""}
            to={w.restaurant_id ? restaurantMenuPathFromRow(w) : null}
            testId={`connect-wish-${w.id}`}
          />
        ))}
      </section>
    </>
  );
}

/** Your own profile as your Connects see it (Profile → Connect View). Signed-in only. */
export function SelfConnectView({ profile, displayName, avatarUrl }) {
  const [eating, setEating] = useState(null);
  const [wishes, setWishes] = useState(null);
  const [now, setNow] = useState(0);

  useEffect(() => {
    let alive = true;
    // What Connects see: posts shared with Connects or everyone from the last 14 days
    // (backend connectionsFoodLifeService LOOKBACK_DAYS).
    listMyFoodActivity(30)
      .then((r) => {
        if (!alive) return;
        const t = Date.now();
        setNow(t);
        const recent = (r?.activities || []).filter(
          (a) =>
            a.status !== "removed" &&
            a.visibility !== "private" &&
            t - new Date(a.created_at).getTime() <= 14 * 24 * 3600 * 1000
        );
        setEating(recent.slice(0, 12).map((a) => ({ ...a, food_name: a.item_name || a.comment || "Food" })));
      })
      .catch(() => alive && setEating([]));
    listWantToEat()
      .then((r) => alive && setWishes(Array.isArray(r?.items) ? r.items : []))
      .catch(() => alive && setWishes([]));
    return () => {
      alive = false;
    };
  }, []);

  const peer = { ...(profile || {}), display_name: displayName, avatar_url: avatarUrl || profile?.avatar_url || null };
  return (
    <div style={{ ...styles.page, minHeight: 0, padding: 0 }} data-testid="self-connect-view">
      <p style={{ ...styles.muted, textAlign: "center" }}>This is how your Connects see you.</p>
      <ConnectScreenBody peer={peer} name={displayName || "You"} eating={eating} wishes={wishes} now={now} self />
    </div>
  );
}

function DishRow({ food, line, comment = null, to, testId }) {
  const body = (
    <>
      <span style={styles.rowText}>
        <strong style={styles.food}>{food}</strong>
        {line ? <span style={styles.muted}>{line}</span> : null}
        {comment ? <span style={styles.comment}>“{comment}”</span> : null}
      </span>
      {to ? <span style={styles.link}>Menu ›</span> : null}
    </>
  );
  return to ? (
    <Link to={to} style={{ ...styles.row, textDecoration: "none" }} data-testid={testId}>
      {body}
    </Link>
  ) : (
    <div style={styles.row} data-testid={testId}>
      {body}
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
    gap: 24,
    boxSizing: "border-box",
    fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
    color: C.text,
  },
  back: { alignSelf: "flex-start", marginBottom: -12, fontSize: 14, fontWeight: 700, color: C.accent, textDecoration: "none" },
  head: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    background: C.background,
    borderRadius: 16,
    padding: 24,
    textAlign: "center",
  },
  title: { margin: "8px 0 0", fontSize: 24, lineHeight: "30px", fontWeight: 700, color: C.text },
  vibe: { margin: 0, fontSize: 16, fontWeight: 700, color: C.accent },
  about: { margin: 0, fontSize: 16, lineHeight: "22px", color: C.text },
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
  },
  rowText: { flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 },
  food: { fontSize: 16, fontWeight: 700, color: C.text },
  comment: { fontSize: 13, color: C.text, fontStyle: "italic" },
  muted: { margin: 0, fontSize: 13, color: C.muted },
  link: { fontSize: 13, fontWeight: 700, color: C.accent, whiteSpace: "nowrap" },
  error: { margin: 0, fontSize: 16, color: C.danger },
  notice: { margin: 0, fontSize: 14, fontWeight: 600, color: C.accent },
  pill: {
    marginTop: 8,
    display: "inline-block",
    background: C.accent,
    color: "#fff",
    borderRadius: 999,
    padding: "8px 16px",
    fontSize: 14,
    fontWeight: 700,
    textDecoration: "none",
  },
  safety: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, flexWrap: "wrap" },
  quiet: {
    border: "none",
    background: "transparent",
    padding: 0,
    fontSize: 13,
    color: C.muted,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  dot: { color: C.muted, fontSize: 13 },
  report: { display: "grid", gap: 8, justifyItems: "start" },
  input: { width: "100%", boxSizing: "border-box", padding: 10, borderRadius: 8, border: `1px solid ${C.border}`, fontFamily: "inherit" },
};
