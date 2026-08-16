/**
 * Owner view: Personal Diner Card + QR (Phase 1).
 * Route: /account/diner-qr
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import StickyPageHeader from "../../components/StickyPageHeader.jsx";
import BottomNav from "../../components/BottomNav.jsx";
import ShareModal from "../../components/share/ShareModal.jsx";
import { useConsumer } from "../../context/ConsumerContext.jsx";
import {
  getMyDinerQr,
  updateDinerQrPrivacy,
  uploadDinerAvatar,
  resolveConsumerMediaUrl,
  CONSUMER_API_BASE,
} from "../../lib/consumerApi.js";
import { buildDinerQrShareData } from "../../lib/dinerQrShare.js";

function initialsFromName(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "M";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
}

export default function DinerQrPage() {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useConsumer();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [payload, setPayload] = useState(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      const data = await getMyDinerQr();
      setPayload(data);
    } catch (err) {
      setError(err.message || "Unable to load Diner QR");
      setPayload(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate(`/account/login?next=${encodeURIComponent("/account/diner-qr")}`, {
        replace: true,
      });
      return;
    }
    if (!authLoading && isAuthenticated) {
      load();
    }
  }, [authLoading, isAuthenticated, navigate, load]);

  const shareData = useMemo(() => {
    if (!payload?.qr) return null;
    return buildDinerQrShareData({
      scan_url: payload.qr.scan_url,
      token: payload.qr.token,
      display_name: payload.card?.display_name,
    });
  }, [payload]);

  const qrImageSrc = useMemo(() => {
    const token = payload?.qr?.token;
    if (!token) return "";
    // Same-origin /d/:token/image on menuply.com (Vercel rewrite). Loading the
    // Railway host directly is blanked by helmet Cross-Origin-Resource-Policy.
    const path = `/d/${encodeURIComponent(String(token))}/image`;
    if (import.meta.env.DEV) {
      return `${CONSUMER_API_BASE}${path}`;
    }
    return path;
  }, [payload]);

  const avatarSrc = useMemo(() => {
    const url = payload?.card?.avatar_url;
    return url ? resolveConsumerMediaUrl(url) : "";
  }, [payload]);

  async function togglePrivacy(field, value) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const data = await updateDinerQrPrivacy({ [field]: value });
      setPayload(data);
      setNotice("Privacy updated.");
    } catch (err) {
      setError(err.message || "Unable to update privacy");
    } finally {
      setBusy(false);
    }
  }

  async function onAvatarSelected(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const data = await uploadDinerAvatar(file);
      setPayload(data);
      setNotice("Profile photo updated.");
    } catch (err) {
      setError(err.message || "Unable to upload photo");
    } finally {
      setBusy(false);
    }
  }

  const displayName = payload?.card?.display_name || "Menuply diner";

  return (
    <>
      <StickyPageHeader title="My Diner QR" />
      <div style={styles.page}>
        <p style={styles.lead}>
          Your personal Menuply QR. Others can scan it to connect with you — without seeing
          your private location, crews, or activity.
        </p>

        {error ? <p style={styles.error}>{error}</p> : null}
        {notice ? <p style={styles.notice}>{notice}</p> : null}

        {loading || authLoading ? (
          <p style={styles.muted}>Loading your Diner Card…</p>
        ) : !payload?.qr ? (
          <p style={styles.muted}>Diner QR is unavailable. Verify your phone, then try again.</p>
        ) : (
          <>
            <article style={styles.card} aria-label="Diner Card">
              <div style={styles.brandRow}>
                <span style={styles.brandMark}>M</span>
                <span style={styles.brandName}>Menuply</span>
              </div>

              <div style={styles.identity}>
                {avatarSrc ? (
                  <img src={avatarSrc} alt="" style={styles.avatar} />
                ) : (
                  <div style={styles.avatarFallback} aria-hidden>
                    {initialsFromName(displayName)}
                  </div>
                )}
                <div>
                  <h1 style={styles.name}>{displayName}</h1>
                  {payload.card?.edu_verified && payload.privacy?.show_edu ? (
                    <p style={styles.edu}>{payload.card.edu_verification_badge}</p>
                  ) : null}
                </div>
              </div>

              <div style={styles.qrWrap}>
                {qrImageSrc ? (
                  <img
                    src={qrImageSrc}
                    alt="Personal Menuply QR code"
                    style={styles.qrImage}
                    width={280}
                    height={280}
                  />
                ) : null}
              </div>

              <p style={styles.cta}>Scan to connect on Menuply</p>
            </article>

            <div style={styles.actions}>
              <button
                type="button"
                style={styles.primaryBtn}
                disabled={!shareData}
                onClick={() => setShareOpen(true)}
              >
                Share My Menuply
              </button>
              <label style={styles.secondaryBtn}>
                {busy ? "Working…" : "Add or change photo"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: "none" }}
                  disabled={busy}
                  onChange={onAvatarSelected}
                />
              </label>
            </div>

            <section style={styles.privacy}>
              <h2 style={styles.h2}>What scanners can see</h2>
              <p style={styles.muted}>
                Your QR never includes location, restaurant, crews, conversations, or contacts.
              </p>
              <label style={styles.check}>
                <input
                  type="checkbox"
                  checked={payload.privacy?.show_avatar !== false}
                  disabled={busy}
                  onChange={(e) => togglePrivacy("show_avatar", e.target.checked)}
                />
                Show my profile photo
              </label>
              <label style={styles.check}>
                <input
                  type="checkbox"
                  checked={payload.privacy?.show_edu !== false}
                  disabled={busy}
                  onChange={(e) => togglePrivacy("show_edu", e.target.checked)}
                />
                Show school verification badge
              </label>
            </section>

            <p style={styles.back}>
              <Link to="/account" style={styles.link}>
                ← Account Settings
              </Link>
            </p>
          </>
        )}
      </div>

      {shareData ? (
        <ShareModal
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          shareData={shareData}
          variant="menu"
          modalTitle="Share My Menuply"
        />
      ) : null}
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
  lead: { color: "#475569", fontSize: 14, lineHeight: 1.45, marginBottom: 16 },
  muted: { color: "#64748b", fontSize: 14 },
  error: { color: "#b91c1c", fontSize: 14, fontWeight: 600 },
  notice: { color: "#166534", fontSize: 14, fontWeight: 600 },
  card: {
    background: "linear-gradient(165deg, #0f172a 0%, #14532d 55%, #166534 100%)",
    color: "#f8fafc",
    borderRadius: 20,
    padding: "22px 20px 28px",
    boxShadow: "0 18px 40px rgba(15, 23, 42, 0.28)",
  },
  brandRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 18 },
  brandMark: {
    width: 28,
    height: 28,
    borderRadius: 8,
    background: "#22c55e",
    color: "#052e16",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 900,
    fontSize: 14,
  },
  brandName: { fontWeight: 800, letterSpacing: 0.4, fontSize: 15 },
  identity: { display: "flex", alignItems: "center", gap: 14, marginBottom: 18 },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: "50%",
    objectFit: "cover",
    border: "2px solid rgba(248,250,252,0.45)",
  },
  avatarFallback: {
    width: 64,
    height: 64,
    borderRadius: "50%",
    background: "rgba(248,250,252,0.16)",
    border: "2px solid rgba(248,250,252,0.35)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    fontSize: 20,
  },
  name: { margin: 0, fontSize: 22, fontWeight: 800, lineHeight: 1.2 },
  edu: { margin: "4px 0 0", fontSize: 12, color: "#bbf7d0", fontWeight: 600 },
  qrWrap: {
    background: "#fff",
    borderRadius: 16,
    padding: 14,
    display: "flex",
    justifyContent: "center",
    marginBottom: 14,
  },
  qrImage: { width: "100%", maxWidth: 280, height: "auto", display: "block" },
  cta: {
    margin: 0,
    textAlign: "center",
    fontWeight: 700,
    fontSize: 15,
    letterSpacing: 0.2,
  },
  actions: { display: "grid", gap: 10, marginTop: 18 },
  primaryBtn: {
    border: "none",
    borderRadius: 12,
    background: "linear-gradient(90deg, #16a34a, #22c55e)",
    color: "#052e16",
    fontWeight: 800,
    fontSize: 15,
    padding: "12px 14px",
    cursor: "pointer",
  },
  secondaryBtn: {
    border: "1px solid #cbd5e1",
    borderRadius: 12,
    background: "#fff",
    color: "#0f172a",
    fontWeight: 700,
    fontSize: 14,
    padding: "12px 14px",
    cursor: "pointer",
    textAlign: "center",
  },
  privacy: {
    marginTop: 24,
    padding: 16,
    borderRadius: 14,
    border: "1px solid #e2e8f0",
    background: "#f8fafc",
  },
  h2: { margin: "0 0 8px", fontSize: 16, color: "#0f172a" },
  check: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginTop: 10,
    fontSize: 14,
    color: "#0f172a",
    fontWeight: 600,
  },
  back: { marginTop: 20 },
  link: { color: "#166534", fontWeight: 700, textDecoration: "none" },
};
