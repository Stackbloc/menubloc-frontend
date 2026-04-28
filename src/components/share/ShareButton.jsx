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
import ShareModal from "./ShareModal.jsx";
import ShareIcon from "./ShareIcon.jsx";
import { trackShareEvent } from "./shareUtils.js";

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
    gap: compact ? 6 : 8,
    width: iconOnly ? (compact ? 34 : 40) : "auto",
    minWidth: iconOnly ? (compact ? 34 : 40) : "auto",
    minHeight: inline ? "auto" : iconOnly ? (compact ? 34 : 40) : compact ? 34 : 44,
    padding: inline ? 0 : iconOnly ? 0 : compact ? "0 13px" : "0 16px",
    borderRadius: 999,
    border: inline ? "none" : subtle ? "1px solid rgba(18, 34, 28, 0.1)" : "1px solid rgba(18, 34, 28, 0.14)",
    background: inline
      ? "transparent"
      : subtle
        ? "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(243,248,245,0.94) 100%)"
        : "linear-gradient(180deg, #ffffff 0%, #f5faf7 100%)",
    color: inline ? "#506153" : subtle ? "#1f4333" : "#11211a",
    fontSize: inline ? 13 : compact ? 12 : 14,
    fontWeight: inline ? 700 : compact ? 700 : 800,
    cursor: "pointer",
    boxShadow: inline ? "none" : subtle ? "0 8px 20px rgba(17, 33, 26, 0.08)" : "0 10px 24px rgba(17, 33, 26, 0.12)",
    whiteSpace: "nowrap",
    backdropFilter: subtle ? "blur(8px)" : "none",
    WebkitBackdropFilter: subtle ? "blur(8px)" : "none",
    lineHeight: 1,
  };

  async function handleClick(event) {
    if (stopPropagation) {
      event?.preventDefault?.();
      event?.stopPropagation?.();
    }

    trackShareEvent(getVariantEventName(normalizedVariant, "clicked"), analyticsContext);

    if (canUseNativeShare(shareData)) {
      try {
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
        <ShareIcon size={inline ? 13 : compact ? 14 : 16} />
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
