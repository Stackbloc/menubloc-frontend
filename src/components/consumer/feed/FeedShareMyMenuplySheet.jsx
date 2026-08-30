/**
 * Feed — Share My Menuply: QR first for in-person, Share link on demand.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import ShareModal from "../../share/ShareModal.jsx";
import { getMyDinerQr, resolveConsumerMediaUrl, CONSUMER_API_BASE } from "../../../lib/consumerApi.js";
import { buildDinerQrShareData } from "../../../lib/dinerQrShare.js";

function initialsFromName(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "M";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
}

export default function FeedShareMyMenuplySheet({ open, onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [payload, setPayload] = useState(null);
  const [shareOpen, setShareOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getMyDinerQr();
      setPayload(data);
    } catch (err) {
      setError(err?.message || "Unable to load your Diner QR");
      setPayload(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) {
      setShareOpen(false);
      return undefined;
    }
    load();
    function onKey(event) {
      if (event.key === "Escape") {
        if (shareOpen) {
          setShareOpen(false);
          return;
        }
        onClose?.();
      }
    }
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose, load, shareOpen]);

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

  if (!open || typeof document === "undefined") return null;

  const displayName = payload?.card?.display_name || "Diner";

  return createPortal(
    <>
      <div
        role="presentation"
        data-testid="feed-share-my-menuply-sheet"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget && !shareOpen) onClose?.();
        }}
        style={styles.backdrop}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="feed-share-my-menuply-title"
          style={styles.sheet}
        >
          <div style={styles.head}>
            <span style={styles.headSpacer} aria-hidden />
            <h2 id="feed-share-my-menuply-title" style={styles.title}>
              Share My Menuply
            </h2>
            <button type="button" onClick={() => onClose?.()} aria-label="Close" style={styles.close}>
              Close
            </button>
          </div>

          <p style={styles.lead}>
            Show this QR in person so someone can scan to connect. When you&apos;re not together, use{" "}
            <strong style={styles.leadStrong}>Share link</strong>.
          </p>

          {error ? (
            <p style={styles.error} role="alert">
              {error}
            </p>
          ) : null}

          {loading ? <p style={styles.muted}>Loading your Diner QR…</p> : null}

          {!loading && payload?.qr ? (
            <>
              <div style={styles.identity}>
                {avatarSrc ? (
                  <img src={avatarSrc} alt="" style={styles.avatar} />
                ) : (
                  <div style={styles.avatarFallback} aria-hidden>
                    {initialsFromName(displayName)}
                  </div>
                )}
                <div style={styles.identityText}>
                  <div style={styles.name}>{displayName}</div>
                  <div style={styles.sub}>Scan to connect on Menuply</div>
                </div>
              </div>

              <div style={styles.qrFrame} data-testid="feed-share-my-menuply-qr">
                {qrImageSrc ? (
                  <img src={qrImageSrc} alt="Personal Menuply QR code" style={styles.qrImage} />
                ) : null}
              </div>

              <div style={styles.actions}>
                <button
                  type="button"
                  style={styles.primaryBtn}
                  disabled={!shareData}
                  data-testid="feed-share-my-menuply-link"
                  onClick={() => setShareOpen(true)}
                >
                  Share link
                </button>
                <Link
                  to="/account/diner-qr?next=%2Ffeed"
                  style={styles.secondaryLink}
                  data-testid="feed-share-my-menuply-settings"
                  onClick={() => onClose?.()}
                >
                  Diner QR settings
                </Link>
              </div>
            </>
          ) : null}

          {!loading && !payload?.qr && !error ? (
            <p style={styles.muted}>Diner QR is unavailable. Verify your phone, then try again.</p>
          ) : null}
        </div>
      </div>

      {shareData ? (
        <ShareModal
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          modalTitle="Share My Menuply"
          shareData={shareData}
          analyticsContext={{ surface: "feed_share_my_menuply_sheet" }}
        />
      ) : null}
    </>,
    document.body
  );
}

const styles = {
  backdrop: {
    position: "fixed",
    inset: 0,
    zIndex: 360,
    background: "rgba(0,0,0,0.55)",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    padding: "16px 12px calc(var(--feed-primary-nav-h, 72px) + 12px)",
  },
  sheet: {
    width: "min(420px, 100%)",
    background: "#101512",
    color: "#fff",
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.12)",
    boxShadow: "0 18px 50px rgba(0,0,0,0.45)",
    padding: "16px 16px 18px",
    fontFamily: "Inter, Arial, sans-serif",
    maxHeight: "min(88vh, 720px)",
    overflowY: "auto",
  },
  head: {
    display: "grid",
    gridTemplateColumns: "auto 1fr auto",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  headSpacer: { width: 44 },
  title: { margin: 0, fontSize: 18, fontWeight: 900, color: "#fff", textAlign: "center" },
  close: {
    border: 0,
    background: "transparent",
    color: "rgba(255,255,255,0.72)",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 13,
  },
  lead: {
    margin: "0 0 14px",
    fontSize: 13,
    lineHeight: 1.45,
    color: "rgba(255,255,255,0.68)",
    textAlign: "center",
  },
  leadStrong: { color: "#e8f0ec", fontWeight: 800 },
  muted: { margin: "8px 0", fontSize: 13, color: "rgba(255,255,255,0.55)", textAlign: "center" },
  error: {
    margin: "0 0 10px",
    fontSize: 13,
    fontWeight: 700,
    color: "#fecaca",
    textAlign: "center",
  },
  identity: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
    padding: "0 4px",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: "50%",
    objectFit: "cover",
    border: "2px solid rgba(94, 234, 212, 0.55)",
    flexShrink: 0,
  },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: "50%",
    background: "rgba(94, 234, 212, 0.12)",
    border: "2px solid rgba(94, 234, 212, 0.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    fontSize: 16,
    color: "#5eead4",
    flexShrink: 0,
  },
  identityText: { minWidth: 0 },
  name: { fontSize: 16, fontWeight: 800, color: "#e8f0ec" },
  sub: { fontSize: 12, color: "rgba(255,255,255,0.55)", marginTop: 2 },
  qrFrame: {
    width: "100%",
    maxWidth: 280,
    margin: "0 auto 16px",
    border: "2px solid rgba(94, 234, 212, 0.45)",
    borderRadius: 12,
    padding: 10,
    background: "#fff",
    boxSizing: "border-box",
  },
  qrImage: { width: "100%", height: "auto", display: "block" },
  actions: {
    display: "grid",
    gap: 10,
    justifyItems: "center",
  },
  primaryBtn: {
    width: "100%",
    border: "none",
    borderRadius: 12,
    background: "linear-gradient(180deg, #22C55E 0%, #16A34A 100%)",
    color: "#fff",
    fontWeight: 800,
    fontSize: 15,
    padding: "12px 14px",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  secondaryLink: {
    color: "#5eead4",
    fontWeight: 700,
    fontSize: 13,
    textDecoration: "none",
  },
};
