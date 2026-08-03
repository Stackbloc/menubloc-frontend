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
 *   - opens ShareModal (Copy Link + channels) so users can paste into any app
 *   - ShareModal may offer native device share as an optional action
 *   - supports menu and dish variants
 * ============================================================
 */

import React, { useState } from "react";
import { useLanguage } from "../../context/LanguageContext.jsx";
import ShareModal from "./ShareModal.jsx";
import ShareIcon from "./ShareIcon.jsx";
import IconHoverLabel from "../IconHoverLabel.jsx";
import { trackShareEvent } from "./shareUtils.js";

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
  const hoverLabel = iconOnly
    ? (label || (normalizedVariant === "dish" ? "Share" : "Share"))
    : resolvedLabel;
  const compact = size === "compact";
  const subtle = tone === "subtle";
  const ghost = tone === "ghost";
  const inline = tone === "inline";

  const buttonStyles = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: iconOnly ? 0 : compact ? 6 : 8,
    width: iconOnly ? (ghost ? 28 : compact ? 32 : 36) : "auto",
    minWidth: iconOnly ? (ghost ? 28 : compact ? 32 : 36) : "auto",
    height: inline ? "auto" : iconOnly ? (ghost ? 28 : compact ? 32 : 36) : "auto",
    minHeight: inline ? "auto" : iconOnly ? (ghost ? 28 : compact ? 32 : 36) : compact ? 34 : 44,
    padding: inline ? 0 : iconOnly ? 0 : compact ? "0 13px" : "0 16px",
    borderRadius: iconOnly ? "50%" : 999,
    border: inline
      ? "none"
      : ghost
        ? iconOnly
          ? "1px solid rgba(55, 65, 81, 0.28)"
          : "1px solid rgba(55, 65, 81, 0.22)"
        : iconOnly
          ? "1px solid rgba(15, 23, 42, 0.16)"
          : subtle
            ? "1px solid rgba(17, 33, 26, 0.18)"
            : "1px solid rgba(18, 34, 28, 0.2)",
    background: inline
      ? "transparent"
      : ghost
        ? iconOnly
          ? "rgba(255, 255, 255, 0.96)"
          : "rgba(255, 255, 255, 0.92)"
        : iconOnly
          ? "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(241,245,249,0.96) 100%)"
          : subtle
            ? "linear-gradient(180deg, rgba(255,255,255,0.99) 0%, rgba(243,248,245,0.97) 100%)"
            : "linear-gradient(180deg, #ffffff 0%, #f5faf7 100%)",
    color: inline ? "#111827" : ghost ? "#111827" : iconOnly ? "#0f172a" : subtle ? "#11211a" : "#11211a",
    fontSize: inline ? 13 : compact ? 12 : 14,
    fontWeight: inline ? 800 : compact ? 800 : 800,
    cursor: "pointer",
    boxShadow: inline
      ? "none"
      : ghost
        ? iconOnly
          ? "0 2px 8px rgba(15, 23, 42, 0.12)"
          : "0 4px 12px rgba(15, 23, 42, 0.10)"
        : iconOnly
          ? "0 8px 18px rgba(15, 23, 42, 0.12)"
          : subtle
            ? "0 6px 16px rgba(17, 33, 26, 0.10)"
            : "0 10px 24px rgba(17, 33, 26, 0.12)",
    position: iconOnly ? "relative" : "static",
    whiteSpace: "nowrap",
    backdropFilter: subtle ? "blur(8px)" : "none",
    WebkitBackdropFilter: subtle ? "blur(8px)" : "none",
    lineHeight: 1,
    transition: "transform 120ms ease, box-shadow 120ms ease, border-color 120ms ease, background 120ms ease",
    overflow: "hidden",
  };

  function handleClick(event) {
    if (stopPropagation) {
      event?.preventDefault?.();
      event?.stopPropagation?.();
    }

    trackShareEvent(getVariantEventName(normalizedVariant, "clicked"), analyticsContext);
    // Always open the in-app share sheet (Copy Link + channels). Desktop OS share
    // sheets are limited to a few apps; Copy Link lets users paste into any app.
    setIsModalOpen(true);
  }

  return (
    <>
      <IconHoverLabel label={iconOnly ? hoverLabel : null}>
        <button
          type="button"
          aria-label={resolvedLabel}
          title={iconOnly ? hoverLabel : undefined}
          onClick={handleClick}
          style={buttonStyles}
          data-testid="share-button"
        >
          <ShareIcon size={inline ? 14 : iconOnly ? (ghost ? 14 : compact ? 15 : 16) : compact ? 15 : 16} />
          {iconOnly ? (
            <span style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0, 0, 0, 0)", whiteSpace: "nowrap", border: 0 }}>
              {resolvedLabel}
            </span>
          ) : resolvedLabel}
        </button>
      </IconHoverLabel>

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
