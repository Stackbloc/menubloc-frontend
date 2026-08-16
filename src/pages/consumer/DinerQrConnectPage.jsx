/**
 * Scanner landing for Personal Diner QR (Phase 1).
 * Route: /connect/d/:token
 * Invitation-style: "{Name} has invited you to connect" + how to connect.
 * Lunch / restaurant proposals use Meet Me Here → /invite/:token (separate).
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import StickyPageHeader from "../../components/StickyPageHeader.jsx";
import BottomNav from "../../components/BottomNav.jsx";
import { useConsumer } from "../../context/ConsumerContext.jsx";
import {
  connectViaDinerQr,
  fetchPublicDinerQr,
  getMyDinerQr,
  resolveConsumerMediaUrl,
} from "../../lib/consumerApi.js";
import { formatDinerInviteName } from "../../lib/dinerQrShare.js";

function initialsFromName(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "M";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
}

export default function DinerQrConnectPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading, consumer } = useConsumer();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [projection, setProjection] = useState(null);
  const [selfScan, setSelfScan] = useState(false);
  const [busy, setBusy] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  const load = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const data = await fetchPublicDinerQr(token);
      setProjection(data);

      if (isAuthenticated) {
        try {
          const mine = await getMyDinerQr();
          if (mine?.qr?.token && String(mine.qr.token).toLowerCase() === String(token).toLowerCase()) {
            setSelfScan(true);
          }
        } catch {
          // Ignore — scanner may still connect if not own QR.
        }
      }
    } catch (err) {
      setProjection(null);
      setError(err.message || "This Diner QR is unavailable");
    } finally {
      setLoading(false);
    }
  }, [token, isAuthenticated]);

  useEffect(() => {
    if (!token) {
      setError("Missing QR token");
      setLoading(false);
      return;
    }
    if (!authLoading) load();
  }, [token, authLoading, load]);

  const avatarSrc = useMemo(() => {
    const url = projection?.diner?.avatar_url;
    return url ? resolveConsumerMediaUrl(url) : "";
  }, [projection]);

  const rawName = projection?.diner?.display_name || "";
  const inviteName = formatDinerInviteName(rawName) || rawName.trim() || "A diner";
  const headline = `${inviteName} has invited you to connect on Menuply`;
  const loginNext = `/connect/d/${encodeURIComponent(String(token || ""))}`;

  async function handleConnect() {
    if (!isAuthenticated) {
      navigate(`/account/login?next=${encodeURIComponent(loginNext)}`);
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await connectViaDinerQr(token);
      setRequestSent(true);
      setNotice(
        `Connection request sent to ${inviteName}. They can accept it in Connections — then you can message and invite each other to eat.`
      );
    } catch (err) {
      if (err?.payload?.code === "self_scan") {
        setSelfScan(true);
        setNotice("This is your own Diner QR.");
      } else if (err?.payload?.code === "already_connected") {
        setNotice(`You are already connected with ${inviteName}.`);
      } else if (err?.payload?.code === "already_pending") {
        setNotice(`A Connection request to ${inviteName} is already pending.`);
      } else {
        setError(err.message || "Unable to connect");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <StickyPageHeader title="Connect on Menuply" />
      <div style={styles.page}>
        {loading || authLoading ? (
          <p style={styles.muted}>Loading…</p>
        ) : error && !projection ? (
          <p style={styles.error}>{error}</p>
        ) : (
          <>
            <section style={styles.card}>
              <p style={styles.eyebrow}>Connection invite</p>
              <div style={styles.identity}>
                {avatarSrc ? (
                  <img src={avatarSrc} alt="" style={styles.avatar} />
                ) : (
                  <div style={styles.avatarFallback} aria-hidden>
                    {initialsFromName(inviteName)}
                  </div>
                )}
                <div>
                  <h1 style={styles.headline}>{headline}</h1>
                  {projection?.diner?.edu_verified ? (
                    <p style={styles.edu}>{projection.diner.edu_verification_badge}</p>
                  ) : null}
                </div>
              </div>

              {selfScan ? (
                <p style={styles.blurb}>
                  This is your personal Diner QR. Share it so someone else can open this page and
                  send you a connection request.
                </p>
              ) : (
                <>
                  <p style={styles.blurb}>
                    Connecting lets you stay in touch on Menuply. It does not share your private
                    location, crews, or activity.
                  </p>
                  <ol style={styles.steps}>
                    <li>
                      {isAuthenticated
                        ? `Tap Connect with ${inviteName} below.`
                        : "Sign in or create a free diner account (takes a minute)."}
                    </li>
                    <li>
                      {isAuthenticated
                        ? `${inviteName} accepts your request in Connections.`
                        : `Then return here and tap Connect with ${inviteName}.`}
                    </li>
                    <li>
                      After you are connected, you can invite each other to eat (Invite to Eat /
                      Meet Me Here) for lunch or a restaurant plan.
                    </li>
                  </ol>
                </>
              )}
            </section>

            {error ? <p style={styles.error}>{error}</p> : null}
            {notice ? <p style={styles.notice}>{notice}</p> : null}

            {selfScan ? null : isAuthenticated ? (
              requestSent ? (
                <Link to="/account/connections" style={styles.primaryLink}>
                  Open Connections
                </Link>
              ) : (
                <button
                  type="button"
                  style={styles.primaryBtn}
                  disabled={busy}
                  onClick={handleConnect}
                >
                  {busy ? "Sending…" : `Connect with ${inviteName}`}
                </button>
              )
            ) : (
              <div style={styles.actions}>
                <Link
                  to={`/account/login?next=${encodeURIComponent(loginNext)}`}
                  style={styles.primaryLink}
                >
                  Sign in to connect
                </Link>
                <Link
                  to={`/account/signup?next=${encodeURIComponent(loginNext)}`}
                  style={styles.secondaryLink}
                >
                  Create a diner account
                </Link>
              </div>
            )}

            {isAuthenticated && !selfScan ? (
              <p style={styles.back}>
                <Link to="/account/connections" style={styles.link}>
                  Open Connections
                </Link>
                {consumer?.id ? (
                  <>
                    {" · "}
                    <Link to="/account/diner-qr" style={styles.link}>
                      My Diner QR
                    </Link>
                  </>
                ) : null}
              </p>
            ) : null}

            {!selfScan ? (
              <p style={styles.footnote}>
                Planning lunch at a restaurant? Ask {inviteName} to show a{" "}
                <strong>Meet Me Here</strong> QR — that opens an Invite to Eat with the place and
                time.
              </p>
            ) : null}
          </>
        )}
      </div>
      <BottomNav />
    </>
  );
}

const styles = {
  page: {
    maxWidth: 480,
    margin: "0 auto",
    padding: "16px 16px 96px",
    fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
  },
  muted: { color: "#64748b", fontSize: 14 },
  error: { color: "#b91c1c", fontSize: 14, fontWeight: 600 },
  notice: { color: "#166534", fontSize: 14, fontWeight: 600, marginTop: 12, lineHeight: 1.45 },
  card: {
    borderRadius: 16,
    border: "1px solid #e2e8f0",
    background: "#fff",
    padding: 18,
    marginBottom: 16,
  },
  eyebrow: {
    margin: "0 0 12px",
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: 0.6,
    color: "#16a34a",
    textTransform: "uppercase",
  },
  identity: { display: "flex", alignItems: "flex-start", gap: 14 },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: "50%",
    objectFit: "cover",
    border: "1px solid #e2e8f0",
    flexShrink: 0,
  },
  avatarFallback: {
    width: 64,
    height: 64,
    borderRadius: "50%",
    background: "#ecfdf5",
    color: "#14532d",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    fontSize: 20,
    flexShrink: 0,
  },
  headline: {
    margin: 0,
    fontSize: 20,
    fontWeight: 800,
    color: "#0f172a",
    lineHeight: 1.25,
  },
  edu: { margin: "6px 0 0", fontSize: 12, color: "#14532d", fontWeight: 600 },
  blurb: { margin: "14px 0 0", color: "#475569", fontSize: 14, lineHeight: 1.45 },
  steps: {
    margin: "12px 0 0",
    paddingLeft: 20,
    color: "#334155",
    fontSize: 14,
    lineHeight: 1.5,
    display: "grid",
    gap: 8,
  },
  primaryBtn: {
    width: "100%",
    border: "none",
    borderRadius: 12,
    background: "linear-gradient(90deg, #16a34a, #22c55e)",
    color: "#052e16",
    fontWeight: 800,
    fontSize: 15,
    padding: "12px 14px",
    cursor: "pointer",
  },
  actions: { display: "grid", gap: 10 },
  primaryLink: {
    display: "block",
    textAlign: "center",
    borderRadius: 12,
    background: "linear-gradient(90deg, #16a34a, #22c55e)",
    color: "#052e16",
    fontWeight: 800,
    fontSize: 15,
    padding: "12px 14px",
    textDecoration: "none",
  },
  secondaryLink: {
    display: "block",
    textAlign: "center",
    borderRadius: 12,
    border: "1px solid #cbd5e1",
    color: "#0f172a",
    fontWeight: 700,
    fontSize: 14,
    padding: "12px 14px",
    textDecoration: "none",
  },
  back: { marginTop: 18, fontSize: 14 },
  link: { color: "#166534", fontWeight: 700, textDecoration: "none" },
  footnote: {
    marginTop: 20,
    fontSize: 13,
    lineHeight: 1.45,
    color: "#64748b",
  },
};
