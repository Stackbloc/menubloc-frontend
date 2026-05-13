/**
 * ============================================================
 * Path: menubloc-frontend/src/components/share/ShareModal.jsx
 * File: ShareModal.jsx
 * Date: 2026-04-03
 * Purpose:
 *   Mobile-first fallback share modal for Grubbid public pages.
 *
 *   Provides share actions for:
 *   - Copy Link
 *   - SMS/Text
 *   - Email
 *   - Facebook
 *   - X
 *   - WhatsApp
 *
 *   Supports:
 *   - variant="menu"
 *   - variant="dish"
 * ============================================================
 */

import React, { useEffect, useMemo, useState } from "react";
import { buildShareLinks, copyText, trackShareEvent } from "./shareUtils.js";
import { trackMenuShare } from "../../lib/analytics.js";

const ACTIONS = [
  { key: "copy", label: "Copy Link" },
  { key: "sms", label: "SMS/Text" },
  { key: "email", label: "Email" },
  { key: "facebook", label: "Facebook" },
  { key: "x", label: "X" },
  { key: "whatsapp", label: "WhatsApp" },
];

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
  modalTitle = "Share Menu",
}) {
  const [copyState, setCopyState] = useState("idle");
  const links = useMemo(() => buildShareLinks(shareData), [shareData]);
  const entityLabel = variant === "dish" ? "dish" : "menu";

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
      const copied = await copyText(shareData?.url);
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

  const overlayStyle = {
    position: "fixed",
    inset: 0,
    zIndex: 1200,
    background: "rgba(15, 23, 42, 0.52)",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    padding: "16px 12px",
  };

  const cardStyle = {
    width: "100%",
    maxWidth: 440,
    borderRadius: 24,
    background: "#ffffff",
    border: "1px solid rgba(15, 23, 42, 0.08)",
    boxShadow: "0 28px 72px rgba(15, 23, 42, 0.28)",
    padding: "18px 16px 16px",
  };

  const actionStyle = {
    width: "100%",
    minHeight: 52,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    border: "1px solid rgba(18, 34, 28, 0.12)",
    background: "#f8fafc",
    color: "#11211a",
    fontSize: 14,
    fontWeight: 800,
    textDecoration: "none",
    cursor: "pointer",
    boxSizing: "border-box",
  };

  return (
    <div style={overlayStyle} onClick={() => onClose?.()} role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={modalTitle}
        style={cardStyle}
        onClick={(event) => event.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 900, color: "#11211a" }}>{modalTitle}</div>
            <div style={{ marginTop: 4, fontSize: 13, color: "#667085", lineHeight: 1.45 }}>
              {`Share the canonical Menuply ${entityLabel} link.`}
            </div>
          </div>
          <button
            type="button"
            aria-label="Close share options"
            onClick={() => onClose?.()}
            style={{
              width: 38,
              height: 38,
              borderRadius: 999,
              border: "1px solid rgba(18, 34, 28, 0.10)",
              background: "#fff",
              color: "#475467",
              fontSize: 18,
              fontWeight: 700,
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>

        <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
          {ACTIONS.map((action) => {
            if (action.key === "copy") {
              return (
                <button
                  key={action.key}
                  type="button"
                  onClick={handleCopy}
                  style={actionStyle}
                >
                  {copyState === "success" ? "Copied" : action.label}
                </button>
              );
            }

            return (
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
            );
          })}
        </div>

        {copyState === "error" ? (
          <div style={{ marginTop: 10, fontSize: 12, color: "#b42318", fontWeight: 700 }}>
            Copy failed on this device.
          </div>
        ) : null}

        <div style={{ marginTop: 14, fontSize: 12, color: "#98a2b3", lineHeight: 1.45, wordBreak: "break-all" }}>
          {shareData?.url}
        </div>
      </div>
    </div>
  );
}
