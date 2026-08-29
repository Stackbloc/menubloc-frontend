/**
 * Connections foundation — people you interact with on Menuply.
 * Not Friends / not a stranger directory / not restaurant Following.
 */

import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import StickyPageHeader from "../../components/StickyPageHeader.jsx";
import BottomNav from "../../components/BottomNav.jsx";
import { useConsumer } from "../../context/ConsumerContext.jsx";
import {
  listConnections,
  acceptConnection,
  declineConnection,
  removeConnection,
  requestConnection,
} from "../../lib/consumerApi.js";
import { formatDinerPeerLabel } from "../../lib/dinerPublicIdentity.js";

function PeerLine({ peer }) {
  if (!peer) return null;
  return (
    <div>
      <div style={{ fontWeight: 700, color: "#0f172a" }}>
        {formatDinerPeerLabel(peer)}
      </div>
      {peer.edu_verified ? (
        <div style={{ fontSize: 12, color: "#14532d", marginTop: 2, fontWeight: 600 }}>
          {peer.edu_verification_badge}
        </div>
      ) : null}
    </div>
  );
}

export default function ConsumerConnections({ embedInFeedShell = false }) {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useConsumer();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [accepted, setAccepted] = useState([]);
  const [pendingIncoming, setPendingIncoming] = useState([]);
  const [pendingOutgoing, setPendingOutgoing] = useState([]);
  const [recipientId, setRecipientId] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setError("");
    try {
      const data = await listConnections();
      setAccepted(data.accepted || []);
      setPendingIncoming(data.pending_incoming || []);
      setPendingOutgoing(data.pending_outgoing || []);
    } catch (err) {
      setError(err.message || "Unable to load Connections");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/account/login", { replace: true });
      return;
    }
    if (!authLoading && isAuthenticated) {
      load();
    }
  }, [authLoading, isAuthenticated, navigate, load]);

  async function withBusy(id, fn) {
    setBusyId(id);
    setNotice("");
    setError("");
    try {
      await fn();
      await load();
    } catch (err) {
      setError(err.message || "Connection action failed");
    } finally {
      setBusyId(null);
    }
  }

  async function handleRequest(e) {
    e.preventDefault();
    const id = Number(String(recipientId).trim());
    if (!Number.isFinite(id) || id <= 0) {
      setError("Enter a valid Menuply member id from a shared meal or invitation.");
      return;
    }
    await withBusy("request", async () => {
      await requestConnection({
        recipient_user_id: id,
        source: "explicit",
      });
      setRecipientId("");
      setNotice("Connection request sent.");
    });
  }

  return (
    <>
      {!embedInFeedShell ? <StickyPageHeader title="Connections" /> : null}
      <div
        style={{
          ...styles.page,
          padding: embedInFeedShell
            ? `16px 16px calc(var(--feed-primary-nav-h, 56px) + env(safe-area-inset-bottom, 0px) + 16px)`
            : styles.page.padding,
        }}
        data-testid={embedInFeedShell ? "feed-connects-page" : undefined}
      >
        <p style={styles.lead}>
          Connections are people you interact with through Menuply food activity —
          invitations, meals, and conversations. This is not a Friend list or stranger
          directory.{" "}
          <Link to="/account/find-diners" style={styles.inlineLink}>
            Find diners
          </Link>{" "}
          to send a connection request.
        </p>

        {error ? <p style={styles.error}>{error}</p> : null}
        {notice ? <p style={styles.notice}>{notice}</p> : null}

        {loading ? (
          <p style={styles.muted}>Loading…</p>
        ) : (
          <>
            <section style={styles.section}>
              <h2 style={styles.h2}>Pending requests</h2>
              {pendingIncoming.length === 0 ? (
                <p style={styles.muted}>No incoming Connection requests.</p>
              ) : (
                <ul style={styles.list}>
                  {pendingIncoming.map((c) => (
                    <li key={c.id} style={styles.card}>
                      <PeerLine peer={c.peer} />
                      <div style={styles.actions}>
                        <button
                          type="button"
                          style={styles.primaryBtn}
                          disabled={busyId === c.id}
                          onClick={() => withBusy(c.id, () => acceptConnection(c.id))}
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          style={styles.secondaryBtn}
                          disabled={busyId === c.id}
                          onClick={() => withBusy(c.id, () => declineConnection(c.id))}
                        >
                          Decline
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {pendingOutgoing.length > 0 ? (
                <div style={{ marginTop: 16 }}>
                  <h3 style={styles.h3}>Sent</h3>
                  <ul style={styles.list}>
                    {pendingOutgoing.map((c) => (
                      <li key={c.id} style={styles.card}>
                        <PeerLine peer={c.peer} />
                        <button
                          type="button"
                          style={styles.secondaryBtn}
                          disabled={busyId === c.id}
                          onClick={() => withBusy(c.id, () => removeConnection(c.id))}
                        >
                          Cancel
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </section>

            <section style={styles.section}>
              <h2 style={styles.h2}>Your Connections</h2>
              {accepted.length === 0 ? (
                <p style={styles.muted}>No Connections yet.</p>
              ) : (
                <ul style={styles.list}>
                  {accepted.map((c) => (
                    <li key={c.id} style={styles.card}>
                      <Link
                        to={c.peer?.id ? `/account/connections/${encodeURIComponent(String(c.peer.id))}` : "/account/connections"}
                        style={styles.peerLink}
                      >
                        <PeerLine peer={c.peer} />
                      </Link>
                      <button
                        type="button"
                        style={styles.secondaryBtn}
                        disabled={busyId === c.id}
                        onClick={() => withBusy(c.id, () => removeConnection(c.id))}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section style={styles.section}>
              <h2 style={styles.h2}>Request a Connection</h2>
              <p style={styles.muted}>
                Use a member id from a shared invitation or meal context, or{" "}
                <Link to="/account/find-diners">Find Diners</Link> when someone has chosen to be
                discoverable.
              </p>
              <form onSubmit={handleRequest} style={styles.form}>
                <input
                  type="text"
                  inputMode="numeric"
                  value={recipientId}
                  onChange={(e) => setRecipientId(e.target.value)}
                  placeholder="Member id"
                  style={styles.input}
                  aria-label="Member id"
                />
                <button
                  type="submit"
                  style={styles.primaryBtn}
                  disabled={busyId === "request"}
                >
                  {busyId === "request" ? "Sending…" : "Send request"}
                </button>
              </form>
            </section>
          </>
        )}

        {!embedInFeedShell ? (
          <p style={{ marginTop: 24 }}>
            <Link to="/account" style={styles.link}>
              Back to account
            </Link>
          </p>
        ) : null}
      </div>
      {!embedInFeedShell ? <BottomNav /> : null}
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
  lead: { fontSize: 14, color: "#334155", lineHeight: 1.5, margin: "0 0 16px" },
  inlineLink: { color: "#15803d", fontWeight: 700, textDecoration: "underline" },
  muted: { fontSize: 13, color: "#64748b", margin: "0 0 8px" },
  error: { color: "#b91c1c", fontWeight: 700, fontSize: 13 },
  notice: { color: "#14532d", fontWeight: 700, fontSize: 13 },
  section: { marginTop: 20 },
  h2: { fontSize: 16, margin: "0 0 10px", color: "#0f172a" },
  h3: { fontSize: 14, margin: "0 0 8px", color: "#334155" },
  list: { listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 },
  card: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: "12px 14px",
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
  },
  actions: { display: "flex", gap: 8, flexShrink: 0 },
  form: { display: "flex", gap: 8, flexWrap: "wrap" },
  input: {
    flex: "1 1 160px",
    border: "1px solid #cbd5e1",
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 14,
  },
  primaryBtn: {
    border: "none",
    borderRadius: 10,
    padding: "10px 14px",
    background: "linear-gradient(135deg, #16a34a, #15803d)",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
  },
  secondaryBtn: {
    border: "1px solid #cbd5e1",
    borderRadius: 10,
    padding: "10px 14px",
    background: "#fff",
    color: "#334155",
    fontWeight: 600,
    cursor: "pointer",
  },
  link: { color: "#0f766e", fontWeight: 600, textDecoration: "none" },
  peerLink: { color: "inherit", textDecoration: "none", flex: "1 1 auto", minWidth: 0 },
};
