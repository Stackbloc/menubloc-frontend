/**
 * Owner view: Personal Diner Card + QR (Phase 1).
 * Route: /account/diner-qr
 * Card chrome matches Menuply promo QR format (X + MENUPLY + framed QR + CTA pill).
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
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

const MENUPLY_X_SRC = "/menuply-qr-logo-x.svg";

function initialsFromName(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "M";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
}

function ScanPhoneIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden fill="none">
      <rect x="8" y="3" width="8" height="18" rx="1.5" stroke="#fff" strokeWidth="1.8" />
      <path
        d="M4.5 8.5c-.9.9-.9 2.1 0 3M19.5 8.5c.9.9.9 2.1 0 3M3 6c-1.5 1.5-1.5 3.5 0 5M21 6c1.5 1.5 1.5 3.5 0 5"
        stroke="#fff"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function DinerQrPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
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

  useEffect(() => {
    if (!shareData) return;
    if (searchParams.get("share") !== "1") return;
    setShareOpen(true);
    const next = new URLSearchParams(searchParams);
    next.delete("share");
    setSearchParams(next, { replace: true });
  }, [shareData, searchParams, setSearchParams]);

  const qrImageSrc = useMemo(() => {
    const token = payload?.qr?.token;
    if (!token) return "";
    // Same-origin /d/:token/image on menuply.com (Vercel rewrite).
    const path = `/d/${encodeURIComponent(String(token))}/image`;
    const bust = [
      payload?.privacy?.show_avatar === false ? "0" : "1",
      payload?.card?.avatar_url || "",
      payload?.card?.display_name || "",
    ].join("|");
    const withV = `${path}?v=${encodeURIComponent(bust)}`;
    if (import.meta.env.DEV) {
      return `${CONSUMER_API_BASE}${withV}`;
    }
    return withV;
  }, [payload]);

  const showAvatar = payload?.privacy?.show_avatar !== false;
  const avatarSrc = useMemo(() => {
    if (!showAvatar) return "";
    const url = payload?.card?.avatar_url;
    return url ? resolveConsumerMediaUrl(url) : "";
  }, [payload, showAvatar]);

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

  const displayName = payload?.card?.display_name || "Diner";
  const showEdu = payload?.card?.edu_verified && payload?.privacy?.show_edu;
  const nextPath = String(searchParams.get("next") || "").trim();
  const backPath = nextPath.startsWith("/") ? nextPath : "/account";
  const backLabel = nextPath === "/feed" ? "← Back to Feed" : "← Account Settings";

  return (
    <>
      <StickyPageHeader title="My Diner QR" />
      <div style={styles.page}>
        <p style={styles.lead}>
          Share this QR or link to invite someone to connect with you on Menuply. Whoever opens it
          sees your connection invitation — not your location, crews, or activity.
        </p>

        {error ? <p style={styles.error}>{error}</p> : null}
        {notice ? <p style={styles.notice}>{notice}</p> : null}

        {loading || authLoading ? (
          <p style={styles.muted}>Loading your Diner Card…</p>
        ) : !payload?.qr ? (
          <p style={styles.muted}>Diner QR is unavailable. Verify your phone, then try again.</p>
        ) : (
          <>
            <div style={styles.stage} aria-label="Diner Card preview">
              <article style={styles.card} aria-label="Diner Card">
                <div style={styles.brandBlock}>
                  <img src={MENUPLY_X_SRC} alt="" style={styles.brandX} width={56} height={56} />
                  <div style={styles.brandWord}>MENUPLY</div>
                  <p style={styles.tagline}>
                    One menu — <span style={styles.taglineAccent}>multiplied by thousands.</span>
                  </p>
                </div>

                <div style={styles.identity}>
                  {avatarSrc ? (
                    <img src={avatarSrc} alt="" style={styles.avatar} />
                  ) : (
                    <div style={styles.avatarFallback} aria-hidden>
                      {initialsFromName(displayName)}
                    </div>
                  )}
                  <div style={styles.identityText}>
                    <h1 style={styles.screenName}>{displayName}</h1>
                    {showEdu ? (
                      <p style={styles.edu}>{payload.card.edu_verification_badge}</p>
                    ) : null}
                  </div>
                </div>

                <div style={styles.qrFrame}>
                  {qrImageSrc ? (
                    <img
                      src={qrImageSrc}
                      alt="Personal Menuply QR code"
                      style={styles.qrImage}
                      width={240}
                      height={240}
                    />
                  ) : null}
                </div>

                <div style={styles.ctaPill} role="presentation">
                  <ScanPhoneIcon />
                  <span>SCAN TO CONNECT ON MENUPLY</span>
                </div>

                <div style={styles.footerRule}>
                  <span style={styles.footerLine} />
                  <span style={styles.footerLabel}>CONNECT</span>
                  <span style={styles.footerLine} />
                </div>
              </article>
            </div>

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
                {busy ? "Working…" : "Add or change selfie"}
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
                Show my profile photo on this card
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
              <Link to={backPath} style={styles.link}>
                {backLabel}
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

const GREEN = "#2db825";
const GREEN_DEEP = "#1a7a1e";
const INK = "#0B0F0C";
const STAGE = "#5c6b3a";

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
  stage: {
    background: STAGE,
    borderRadius: 24,
    padding: "22px 16px 26px",
    display: "flex",
    justifyContent: "center",
  },
  card: {
    width: "100%",
    maxWidth: 340,
    background: "#f3f3f1",
    color: INK,
    borderRadius: 22,
    padding: "22px 18px 20px",
    boxShadow: "0 18px 40px rgba(15, 23, 42, 0.22)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  brandBlock: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    marginBottom: 14,
  },
  brandX: {
    width: 56,
    height: 56,
    display: "block",
    marginBottom: 6,
  },
  brandWord: {
    fontSize: 28,
    fontWeight: 900,
    letterSpacing: "0.04em",
    lineHeight: 1,
    color: INK,
  },
  tagline: {
    margin: "8px 0 0",
    fontSize: 13,
    fontWeight: 600,
    color: INK,
    lineHeight: 1.35,
  },
  taglineAccent: {
    textDecoration: "underline",
    textDecorationColor: GREEN,
    textDecorationThickness: 3,
    textUnderlineOffset: 3,
  },
  identity: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    width: "100%",
    marginBottom: 14,
    padding: "0 4px",
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: "50%",
    objectFit: "cover",
    border: `2px solid ${GREEN}`,
    flexShrink: 0,
    background: "#fff",
  },
  avatarFallback: {
    width: 56,
    height: 56,
    borderRadius: "50%",
    background: "#e8efe3",
    border: `2px solid ${GREEN}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    fontSize: 18,
    color: GREEN_DEEP,
    flexShrink: 0,
  },
  identityText: { minWidth: 0, flex: 1 },
  screenName: {
    margin: 0,
    fontSize: 18,
    fontWeight: 800,
    lineHeight: 1.2,
    color: INK,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  edu: { margin: "3px 0 0", fontSize: 12, color: GREEN_DEEP, fontWeight: 700 },
  qrFrame: {
    width: "100%",
    maxWidth: 248,
    border: `3px solid ${GREEN_DEEP}`,
    borderRadius: 8,
    padding: 8,
    background: "#fff",
    boxSizing: "border-box",
    marginBottom: 16,
  },
  qrImage: { width: "100%", height: "auto", display: "block" },
  ctaPill: {
    width: "100%",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    background: `linear-gradient(180deg, ${GREEN} 0%, ${GREEN_DEEP} 100%)`,
    color: "#fff",
    fontWeight: 800,
    fontSize: 12,
    letterSpacing: "0.04em",
    borderRadius: 999,
    padding: "12px 14px",
    textAlign: "center",
    boxSizing: "border-box",
  },
  footerRule: {
    marginTop: 14,
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  footerLine: {
    flex: 1,
    height: 2,
    background: GREEN,
    borderRadius: 2,
  },
  footerLabel: {
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: "0.12em",
    color: GREEN,
  },
  actions: { display: "grid", gap: 10, marginTop: 18 },
  primaryBtn: {
    border: "none",
    borderRadius: 12,
    background: `linear-gradient(90deg, ${GREEN_DEEP}, ${GREEN})`,
    color: "#fff",
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
