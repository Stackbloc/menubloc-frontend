/**
 * Discoverable diner profile — basic public identity for non-connections.
 * Connect / End (soft) / Block (hard) / Report. No plans, events, or Join Me.
 * Route: /account/diners/:userId
 */

import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import StickyPageHeader from "../../components/StickyPageHeader.jsx";
import BottomNav from "../../components/BottomNav.jsx";
import { useConsumer } from "../../context/ConsumerContext.jsx";
import {
  acceptConnection,
  blockDiner,
  declineConnection,
  getDiscoverableDiner,
  removeConnection,
  reportDinerAbuse,
  requestConnection,
  resolveConsumerMediaUrl,
} from "../../lib/consumerApi.js";
import { formatDinerPeerLabel } from "../../lib/dinerPublicIdentity.js";

const ABUSE_REASONS = [
  { value: "harassment", label: "Harassment" },
  { value: "spam", label: "Spam" },
  { value: "impersonation", label: "Impersonation" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "other", label: "Other" },
];

function backTarget(from) {
  if (from === "incoming" || from === "social") return "/account?tab=social";
  if (from === "find-diners") return "/account/find-diners";
  return "/account/find-diners";
}

export default function DiscoverableDinerProfilePage() {
  const navigate = useNavigate();
  const { userId: userIdParam } = useParams();
  const [searchParams] = useSearchParams();
  const from = searchParams.get("from") || "find-diners";
  const dinerId = Number(userIdParam);
  const { isAuthenticated, loading: authLoading } = useConsumer();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [payload, setPayload] = useState(null);
  const [busy, setBusy] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("harassment");
  const [reportDetails, setReportDetails] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const data = await getDiscoverableDiner(dinerId);
      setPayload(data);
    } catch (err) {
      setPayload(null);
      setError(err.message || "Unable to load profile");
    } finally {
      setLoading(false);
    }
  }, [dinerId]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate(
        `/account/login?next=${encodeURIComponent(`/account/diners/${userIdParam || ""}?from=${from}`)}`,
        { replace: true }
      );
      return;
    }
    if (!authLoading && isAuthenticated) {
      if (!Number.isFinite(dinerId) || dinerId <= 0) {
        setError("Invalid profile");
        setLoading(false);
        return;
      }
      load();
    }
  }, [authLoading, isAuthenticated, navigate, load, dinerId, userIdParam, from]);

  useEffect(() => {
    if (!payload?.diner) return;
    if (payload.diner.connection_status === "accepted") {
      navigate(`/account/connections/${encodeURIComponent(String(dinerId))}`, { replace: true });
    }
  }, [payload, dinerId, navigate]);

  async function runAction(action) {
    if (!payload?.diner) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const diner = payload.diner;
      if (action === "connect") {
        await requestConnection({ recipient_user_id: diner.id, source: "explicit" });
        setNotice("Connection request sent.");
      } else if (action === "accept") {
        await acceptConnection(diner.connection_id);
        navigate(`/account/connections/${encodeURIComponent(String(diner.id))}`, { replace: true });
        return;
      } else if (action === "decline") {
        await declineConnection(diner.connection_id);
        setNotice("Request declined.");
      } else if (action === "cancel_request" || action === "end_connection") {
        await removeConnection(diner.connection_id);
        setNotice(action === "end_connection" ? "Connection ended." : "Request canceled.");
      } else if (action === "block") {
        const ok = window.confirm(
          "Block this diner? They will not appear in Find Diners for you (and you won’t appear for them), and Connect will be blocked both ways."
        );
        if (!ok) return;
        await blockDiner(diner.id);
        setNotice("Diner blocked.");
        navigate(backTarget(from), { replace: true });
        return;
      }
      await load();
    } catch (err) {
      setError(err.message || "Action failed");
    } finally {
      setBusy(false);
    }
  }

  async function submitReport(e) {
    e.preventDefault();
    if (!payload?.diner) return;
    setBusy(true);
    setError("");
    try {
      await reportDinerAbuse(payload.diner.id, {
        reason: reportReason,
        details: reportDetails.trim() || undefined,
      });
      setReportOpen(false);
      setReportDetails("");
      setNotice("Report submitted to Menuply.");
    } catch (err) {
      setError(err.message || "Unable to submit report");
    } finally {
      setBusy(false);
    }
  }

  const diner = payload?.diner;
  const actions = payload?.allowed_actions;
  const name = formatDinerPeerLabel(diner) || "Diner";
  const backTo = backTarget(from);

  return (
    <div style={styles.page} data-testid="discoverable-diner-profile">
      <StickyPageHeader title={loading ? "Profile" : name} backTo={backTo} />
      <main style={styles.main}>
        {error ? <p style={styles.error}>{error}</p> : null}
        {notice ? <p style={styles.notice}>{notice}</p> : null}
        {loading ? <p style={styles.muted}>Loading…</p> : null}

        {!loading && diner ? (
          <>
            <div style={styles.hero}>
              {diner.avatar_url ? (
                <img
                  src={resolveConsumerMediaUrl(diner.avatar_url) || diner.avatar_url}
                  alt=""
                  style={styles.avatar}
                />
              ) : (
                <div style={styles.avatarFallback}>{(name || "?").slice(0, 1).toUpperCase()}</div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <h1 style={styles.name}>{name}</h1>
                {diner.location_label ? (
                  <p style={styles.meta}>📍 {diner.location_label}</p>
                ) : null}
                {diner.edu_verification_badge ? (
                  <p style={styles.meta}>{diner.edu_verification_badge}</p>
                ) : null}
              </div>
            </div>

            {diner.diner_about ? <p style={styles.about}>{diner.diner_about}</p> : null}

            <p style={styles.lead}>
              Basic profile only until you Connect. Use Connect to request, or Block / Report if
              needed.
            </p>

            <div style={styles.actions} data-testid="discoverable-actions">
              {actions?.accept ? (
                <button type="button" style={styles.primaryBtn} disabled={busy} onClick={() => runAction("accept")}>
                  Accept
                </button>
              ) : null}
              {actions?.decline ? (
                <button type="button" style={styles.secondaryBtn} disabled={busy} onClick={() => runAction("decline")}>
                  Decline
                </button>
              ) : null}
              {actions?.connect ? (
                <button type="button" style={styles.primaryBtn} disabled={busy} onClick={() => runAction("connect")}>
                  Connect
                </button>
              ) : null}
              {actions?.cancel_request ? (
                <button
                  type="button"
                  style={styles.secondaryBtn}
                  disabled={busy}
                  onClick={() => runAction("cancel_request")}
                >
                  Cancel request
                </button>
              ) : null}
              {actions?.end_connection ? (
                <button
                  type="button"
                  style={styles.secondaryBtn}
                  disabled={busy}
                  onClick={() => runAction("end_connection")}
                >
                  End connection
                </button>
              ) : null}
              {actions?.block ? (
                <button type="button" style={styles.dangerBtn} disabled={busy} onClick={() => runAction("block")}>
                  Block
                </button>
              ) : null}
              {actions?.report ? (
                <button
                  type="button"
                  style={styles.secondaryBtn}
                  disabled={busy}
                  onClick={() => setReportOpen((v) => !v)}
                >
                  Report abuse
                </button>
              ) : null}
            </div>

            {reportOpen ? (
              <form onSubmit={submitReport} style={styles.reportBox} data-testid="abuse-report-form">
                <h2 style={styles.sectionTitle}>Report to Menuply</h2>
                <label style={styles.label}>
                  Reason
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    style={styles.select}
                  >
                    {ABUSE_REASONS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label style={styles.label}>
                  Details (optional)
                  <textarea
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value.slice(0, 2000))}
                    rows={3}
                    style={styles.textarea}
                  />
                </label>
                <button type="submit" style={styles.primaryBtn} disabled={busy}>
                  {busy ? "Sending…" : "Submit report"}
                </button>
              </form>
            ) : null}
          </>
        ) : null}
      </main>
      <BottomNav />
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#f8fafc", paddingBottom: 88 },
  main: { maxWidth: 720, margin: "0 auto", padding: "12px 16px 24px" },
  hero: { display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 12 },
  avatar: { width: 72, height: 72, borderRadius: "50%", objectFit: "cover" },
  avatarFallback: {
    width: 72,
    height: 72,
    borderRadius: "50%",
    background: "#dcfce7",
    color: "#166534",
    display: "grid",
    placeItems: "center",
    fontWeight: 800,
    fontSize: 28,
  },
  name: { margin: 0, fontSize: 22, fontWeight: 800, color: "#0f172a" },
  meta: { margin: "4px 0 0", fontSize: 14, color: "#475569" },
  about: { margin: "0 0 12px", fontSize: 15, color: "#334155", lineHeight: 1.5 },
  lead: { margin: "0 0 14px", fontSize: 14, color: "#64748b", lineHeight: 1.5 },
  actions: { display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  primaryBtn: {
    padding: "10px 14px",
    borderRadius: 10,
    border: "none",
    background: "linear-gradient(135deg, #16a34a, #15803d)",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 14,
  },
  secondaryBtn: {
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid #cbd5e1",
    background: "#fff",
    color: "#0f172a",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 14,
  },
  dangerBtn: {
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid #fecaca",
    background: "#fff",
    color: "#b91c1c",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 14,
  },
  error: { color: "#b91c1c", fontSize: 14 },
  notice: { color: "#166534", fontSize: 14 },
  muted: { color: "#64748b", fontSize: 14 },
  sectionTitle: { margin: "0 0 8px", fontSize: 16, fontWeight: 800, color: "#0f172a" },
  reportBox: {
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    border: "1px solid #e2e8f0",
    background: "#fff",
    display: "grid",
    gap: 10,
  },
  label: { display: "grid", gap: 4, fontSize: 13, fontWeight: 700, color: "#334155" },
  select: { padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14 },
  textarea: { padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, resize: "vertical" },
};
