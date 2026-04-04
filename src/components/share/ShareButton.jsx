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
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const normalizedVariant = variant === "dish" ? "dish" : "menu";
  const resolvedLabel = label || (normalizedVariant === "dish" ? "Share Dish" : "Share Menu");
  const resolvedModalTitle = modalTitle || resolvedLabel;

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
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          width: iconOnly ? 40 : "auto",
          minWidth: iconOnly ? 40 : "auto",
          minHeight: iconOnly ? 40 : 44,
          padding: iconOnly ? 0 : "0 16px",
          borderRadius: 999,
          border: "1px solid rgba(18, 34, 28, 0.14)",
          background: "#ffffff",
          color: "#11211a",
          fontSize: 14,
          fontWeight: 800,
          cursor: "pointer",
          boxShadow: "0 8px 22px rgba(15, 23, 42, 0.06)",
          whiteSpace: "nowrap",
        }}
      >
        <ShareIcon size={16} />
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
