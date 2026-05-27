/**
 * ============================================================
 * Path: menubloc-frontend/src/components/share/ShareButton.jsx
 * File: ShareButton.jsx
 * Date: 2026-04-03
 * Purpose:
 *   Reusable share trigger for Grubbid public pages.
 *
 *   Behavior:
 *   - tracks share button clicks
 *   - tries navigator.share first when supported
 *   - falls back to ShareModal when unavailable or rejected
 *   - supports menu and dish variants
 * ============================================================
 */

import React, { useState } from "react";
import { useLanguage } from "../../context/LanguageContext.jsx";
import ShareModal from "./ShareModal.jsx";
import ShareIcon from "./ShareIcon.jsx";
import { trackShareEvent } from "./shareUtils.js";
import { trackMenuShare } from "../../lib/analytics.js";

function canUseNativeShare(shareData) {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") return false;
  if (typeof navigator.canShare !== "function") return true;

  try {
    return navigator.canShare({
      title: shareData?.title,
      text: shareData?.text,
      url: shareData?.url,
    });
  } catch {
    return true;
  }
}

function getVariantEventName(variant, suffix) {
  const normalizedVariant = variant === "dish" ? "dish" : "menu";
  return `${normalizedVariant}_share_${suffix}`;
}

export default function ShareButton({
  shareData,
  analyticsContext,
  variant = "menu",
  label,
  modalTitle,
  iconOnly = false,
  stopPropagation = false,
  size = "default",
  tone = "default",
}) {
  const { t } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const normalizedVariant = variant === "dish" ? "dish" : "menu";
  const resolvedLabel = label || (normalizedVariant === "dish" ? "Share Dish" : "Share Menu");
  const resolvedModalTitle = modalTitle || resolvedLabel;
  const compact = size === "compact";
  const subtle = tone === "subtle";
  const inline = tone === "inline";

  const buttonStyles = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: iconOnly ? 0 : compact ? 6 : 8,
    width: iconOnly ? (compact ? 36 : 40) : "auto",
    minWidth: iconOnly ? (compact ? 36 : 40) : "auto",
    minHeight: inline ? "auto" : iconOnly ? (compact ? 36 : 40) : compact ? 34 : 44,
    padding: inline ? 0 : iconOnly ? 0 : compact ? "0 13px" : "0 16px",
    borderRadius: iconOnly ? "50%" : 999,
    border: inline
      ? "none"
      : iconOnly
        ? "1px solid rgba(15, 23, 42, 0.10)"
        : subtle
          ? "1px solid rgba(18, 34, 28, 0.1)"
          : "1px solid rgba(18, 34, 28, 0.14)",
    background: inline
      ? "transparent"
      : iconOnly
        ? "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(241,245,249,0.96) 100%)"
        : subtle
          ? "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(243,248,245,0.94) 100%)"
          : "linear-gradient(180deg, #ffffff 0%, #f5faf7 100%)",
    color: inline ? "#506153" : iconOnly ? "#0f172a" : subtle ? "#1f4333" : "#11211a",
    fontSize: inline ? 13 : compact ? 12 : 14,
    fontWeight: inline ? 700 : compact ? 700 : 800,
    cursor: "pointer",
    boxShadow: inline
      ? "none"
      : iconOnly
        ? "0 8px 18px rgba(15, 23, 42, 0.10)"
        : subtle
          ? "0 8px 20px rgba(17, 33, 26, 0.08)"
          : "0 10px 24px rgba(17, 33, 26, 0.12)",
    position: iconOnly ? "relative" : "static",
    whiteSpace: "nowrap",
    backdropFilter: subtle ? "blur(8px)" : "none",
    WebkitBackdropFilter: subtle ? "blur(8px)" : "none",
    lineHeight: 1,
    transition: "transform 120ms ease, box-shadow 120ms ease, border-color 120ms ease, background 120ms ease",
    overflow: "hidden",
  };

  async function handleClick(event) {
    if (stopPropagation) {
      event?.preventDefault?.();
      event?.stopPropagation?.();
    }

    trackShareEvent(getVariantEventName(normalizedVariant, "clicked"), analyticsContext);

    if (canUseNativeShare(shareData)) {
      try {
        if (normalizedVariant === "menu") {
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
          url: shareData?.url,
        });
        trackShareEvent(getVariantEventName(normalizedVariant, "native_success"), analyticsContext);
        return;
      } catch {
        setIsModalOpen(true);
        return;
      }
    }

    setIsModalOpen(true);
  }

  return (
    <>
      <button
        type="button"
        aria-label={resolvedLabel}
        onClick={handleClick}
        style={buttonStyles}
      >
        <ShareIcon size={inline ? 13 : iconOnly ? 15 : compact ? 14 : 16} />
        {iconOnly ? (
          <span style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0, 0, 0, 0)", whiteSpace: "nowrap", border: 0 }}>
            {resolvedLabel}
          </span>
        ) : resolvedLabel}
      </button>

      <ShareModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        shareData={shareData}
        analyticsContext={analyticsContext}
        modalTitle={resolvedModalTitle}
        variant={normalizedVariant}
      />
    </>
  );
}
