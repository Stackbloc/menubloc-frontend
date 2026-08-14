/**
 * ============================================================
 * Path: menubloc-frontend/src/components/share/ShareModal.jsx
 * File: ShareModal.jsx
 * Date: 2026-04-03
 * Purpose:
 *   Mobile-first share modal for Menuply public pages.
 *
 *   Primary action: Copy Link (paste into any app).
 *   Also: SMS, Email, Facebook, X, WhatsApp, and optional device share.
 *   Supports:
 *   - variant="menu"
 *   - variant="dish"
 * ============================================================
 */

import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { buildShareLinks, copyText, normalizeConsumerShareUrl, trackShareEvent } from "./shareUtils.js";
import { trackMenuShare } from "../../lib/analytics.js";

const ACTION_KEYS = [
  { key: "copy", labelKey: "share.copyLink", fallback: "Copy Link" },
  { key: "sms", labelKey: "share.sms", fallback: "SMS/Text" },
  { key: "email", labelKey: "share.email", fallback: "Email" },
  { key: "facebook", labelKey: "share.facebook", fallback: "Facebook" },
  { key: "x", labelKey: "share.x", fallback: "X" },
  { key: "whatsapp", labelKey: "share.whatsapp", fallback: "WhatsApp" },
];

function resolveShareUrl(shareData) {
  return normalizeConsumerShareUrl(shareData?.url) || "";
}

function canUseNativeShare(shareData) {
  const url = resolveShareUrl(shareData);
  if (!url) return false;
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") return false;
  if (typeof navigator.canShare !== "function") return true;
  try {
    return navigator.canShare({
      title: shareData?.title,
      text: shareData?.text,
      url,
    });
  } catch {
    return true;
  }
}

function eventNameForAction(variant, action) {
  const prefix = variant === "dish" ? "dish_share" : "menu_share";
  switch (action) {
    case "copy":
      return `${prefix}_copy_link`;
    case "sms":
      return `${prefix}_sms`;
    case "email":
      return `${prefix}_email`;
    case "facebook":
      return `${prefix}_facebook`;
    case "x":
      return `${prefix}_x`;
    case "whatsapp":
      return `${prefix}_whatsapp`;
    case "native":
      return `${prefix}_native`;
    default:
      return "";
  }
}

export default function ShareModal({
  open,
  onClose,
  shareData,
  analyticsContext,
  variant = "menu",
  modalTitle,
}) {
  const { t } = useLanguage();
  const [copyState, setCopyState] = useState("idle");
  const resolvedTitle = modalTitle || t("share.title", "Share");
  const actions = ACTION_KEYS.map((a) => ({
    key: a.key,
    label: t(a.labelKey, a.fallback),
  }));
  const links = useMemo(() => buildShareLinks(shareData), [shareData]);
  const shareUrl = useMemo(() => resolveShareUrl(shareData), [shareData]);
  const nativeShareAvailable = canUseNativeShare(shareData);

  useEffect(() => {
    if (!open || typeof document === "undefined") return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event) {
      if (event.key === "Escape") onClose?.();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (copyState !== "success") return undefined;
    const timeout = window.setTimeout(() => setCopyState("idle"), 1600);
    return () => window.clearTimeout(timeout);
  }, [copyState]);

  if (!open) return null;

  async function handleCopy() {
    try {
      if (!shareUrl) {
        setCopyState("error");
        return;
      }
      const copied = await copyText(shareUrl);
      if (!copied) {
        setCopyState("error");
        return;
      }

      setCopyState("success");
      trackShareEvent(eventNameForAction(variant, "copy"), analyticsContext);
      if (variant === "menu") {
        trackMenuShare({
          restaurantId: analyticsContext?.restaurantId,
          restaurantName: analyticsContext?.restaurantName,
          menuId: analyticsContext?.menuId || analyticsContext?.restaurantId,
          shareMethod: "copy",
        });
      }
    } catch {
      setCopyState("error");
    }
  }

  async function handleNativeShare() {
    if (!nativeShareAvailable || !shareUrl) return;
    try {
      trackShareEvent(eventNameForAction(variant, "native"), analyticsContext);
      if (variant === "menu") {
        trackMenuShare({
          restaurantId: analyticsContext?.restaurantId,
          restaurantName: analyticsContext?.restaurantName,
          menuId: analyticsContext?.menuId || analyticsContext?.restaurantId,
          shareMethod: "native",
        });
      }
      await navigator.share({
        title: shareData?.title,
        text: shareData?.text,
        url: shareUrl,
      });
      onClose?.();
    } catch {
      // User cancelled or share failed — keep modal open for Copy Link.
    }
  }

  function handleChannelClick(action) {
    const eventName = eventNameForAction(variant, action);
    if (eventName) trackShareEvent(eventName, analyticsContext);
    if (variant === "menu") {
      trackMenuShare({
        restaurantId: analyticsContext?.restaurantId,
        restaurantName: analyticsContext?.restaurantName,
        menuId: analyticsContext?.menuId || analyticsContext?.restaurantId,
        shareMethod: action,
      });
    }
    onClose?.();
  }

  const isWide =
    typeof window !== "undefined" && window.matchMedia?.("(min-width: 640px)")?.matches;

  const overlayStyle = {
    position: "fixed",
    inset: 0,
    zIndex: 1200,
    background: "rgba(15, 23, 42, 0.52)",
    display: "flex",
    alignItems: isWide ? "center" : "flex-end",
    justifyContent: "center",
    padding: isWide ? 24 : 0,
  };

  const cardStyle = {
    width: "100%",
    maxWidth: 480,
    borderRadius: isWide ? 20 : "20px 20px 0 0",
    background: "#ffffff",
    border: "1px solid rgba(15, 23, 42, 0.08)",
    borderBottom: isWide ? "1px solid rgba(15, 23, 42, 0.08)" : "none",
    boxShadow: isWide
      ? "0 24px 64px rgba(15, 23, 42, 0.28)"
      : "0 -12px 40px rgba(15, 23, 42, 0.22)",
    padding: isWide
      ? "18px 18px 18px"
      : "10px 18px calc(18px + env(safe-area-inset-bottom, 0px))",
    boxSizing: "border-box",
  };

  const actionStyle = {
    width: "100%",
    minHeight: 44,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    border: "1px solid rgba(18, 34, 28, 0.12)",
    background: "#f8fafc",
    color: "#11211a",
    fontSize: 13,
    fontWeight: 800,
    textDecoration: "none",
    cursor: "pointer",
    boxSizing: "border-box",
    textAlign: "center",
    padding: "0 6px",
  };

  return createPortal(
    <div style={overlayStyle} onClick={() => onClose?.()} role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={resolvedTitle}
        style={cardStyle}
        onClick={(event) => event.stopPropagation()}
      >
        <div style={{ width: 36, height: 4, borderRadius: 999, background: "rgba(15,23,42,0.14)", margin: "0 auto 12px" }} />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: "#11211a" }}>{resolvedTitle}</div>
          <button
            type="button"
            aria-label={t("share.close", "Close")}
            onClick={() => onClose?.()}
            style={{
              width: 30,
              height: 30,
              borderRadius: 999,
              border: "1px solid rgba(18, 34, 28, 0.10)",
              background: "#fff",
              color: "#475467",
              fontSize: 16,
              fontWeight: 700,
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>

        <button
          type="button"
          data-testid="share-copy-link"
          onClick={handleCopy}
          style={{
            ...actionStyle,
            marginTop: 14,
            minHeight: 48,
            width: "100%",
            background: copyState === "success" ? "#ecfdf3" : "#11211a",
            color: copyState === "success" ? "#067647" : "#ffffff",
            border: copyState === "success" ? "1px solid #abefc6" : "1px solid #11211a",
          }}
        >
          {copyState === "success" ? t("share.copied", "Link copied") : t("share.copyLink", "Copy Link")}
        </button>

        <div style={{ marginTop: 10, fontSize: 12, color: "#667085", lineHeight: 1.4 }}>
          {t("share.copyHint", "Copy the link, then paste it into any app.")}
        </div>

        <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}>
          {actions
            .filter((action) => action.key !== "copy")
            .map((action) => (
              <a
                key={action.key}
                href={links[action.key]}
                target={action.key === "sms" || action.key === "email" ? undefined : "_blank"}
                rel={action.key === "sms" || action.key === "email" ? undefined : "noreferrer"}
                onClick={() => handleChannelClick(action.key)}
                style={actionStyle}
              >
                {action.label}
              </a>
            ))}
        </div>

        {nativeShareAvailable ? (
          <button
            type="button"
            data-testid="share-device"
            onClick={handleNativeShare}
            style={{ ...actionStyle, marginTop: 10, width: "100%" }}
          >
            {t("share.device", "Share via device…")}
          </button>
        ) : null}

        {copyState === "error" ? (
          <div style={{ marginTop: 10, fontSize: 12, color: "#b42318", fontWeight: 700 }}>
            Copy failed on this device.
          </div>
        ) : null}

        <div
          style={{
            marginTop: 12,
            fontSize: 11,
            color: "#98a2b3",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            userSelect: "all",
          }}
          title={shareUrl}
          data-testid="share-url-preview"
        >
          {shareUrl}
        </div>
      </div>
    </div>,
    document.body
  );
}
