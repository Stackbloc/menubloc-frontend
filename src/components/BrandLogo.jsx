/**
 * ============================================================
 * File: BrandLogo.jsx
 * Path: menubloc-frontend/src/components/BrandLogo.jsx
 * Date: 2026-04-03
 * Purpose:
 *   Shared Menuply brand logo / lockup for consistent use across
 *   discovery, auth, nav, and onboarding pages.
 * ============================================================
 */

import React from "react";
import { Link } from "react-router-dom";

const MENUPLY_LOGO_SCALE = 1.12;

function isDarkPageColor(value) {
  const color = String(value || "").trim().toLowerCase();
  if (!color) return false;
  if (color === "#0b0f0c" || color === "#0b0f0cff" || color === "#101010") return true;
  if (color.startsWith("#0") || color.startsWith("#1") || color.startsWith("#2")) return true;
  if (color.includes("black") || color.includes("charcoal") || color.includes("slate") || color.includes("night")) return true;
  return false;
}

export const MENUPLY_LOGO_SRC = "/menuply-logo.png";
export const MENUPLY_LOGO_DARK_SRC = "/menuply-logo-dark.png";

export function BrandLogo({
  to = "/",
  width = 180,
  height = 112,
  radius = 24,
  pageColor = "#f7f6f1",
  matchPageBackground = true,
  imageStyle,
  linkStyle,
  ariaLabel = "Go to Menuply home",
  clickable = true,
}) {
  const content = (
    <span
      style={{
        display: "inline-flex",
        width,
        height,
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: radius,
        background: matchPageBackground ? pageColor : "transparent",
        lineHeight: 0,
      }}
    >
      <img
        src={isDarkPageColor(pageColor) ? MENUPLY_LOGO_SRC : MENUPLY_LOGO_DARK_SRC}
        alt="Menuply"
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          objectFit: "contain",
          objectPosition: "center",
          ...imageStyle,
        }}
      />
    </span>
  );

  if (!clickable) return content;

  return (
    <Link
      to={to}
      aria-label={ariaLabel}
      style={{
        display: "inline-flex",
        textDecoration: "none",
        cursor: "pointer",
        ...linkStyle,
      }}
    >
      {content}
    </Link>
  );
}

export function BrandLockup({
  subtitle = null,
  subtitleStyle,
  wrapperStyle,
  logoProps,
  to = "/",
  ariaLabel = "Go to Menuply home",
}) {
  const inferredDarkPage = isDarkPageColor(logoProps?.pageColor);
  const resolvedSubtitleColor = inferredDarkPage ? "rgba(248,244,234,0.74)" : "#667085";

  return (
    <Link
      to={to}
      aria-label={ariaLabel}
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        textDecoration: "none",
        cursor: "pointer",
        ...wrapperStyle,
      }}
    >
      <BrandLogo {...logoProps} clickable={false} />
      {subtitle ? (
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: resolvedSubtitleColor,
            letterSpacing: 1.4,
            textTransform: "uppercase",
            marginTop: 0,
            textAlign: "center",
            ...subtitleStyle,
        }}
        >
          {subtitle}
        </div>
      ) : null}
    </Link>
  );
}
