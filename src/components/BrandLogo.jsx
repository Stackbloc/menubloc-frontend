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

export const MENUPLY_LOGO_SRC = "/menuplyofficialsmalllogo.png";

// X mark occupies ~230/1266px of the image width — clip the rest off
const X_MARK_RATIO = 230 / 1266;

export function BrandLogo({
  to = "/",
  width,
  height = 112,
  radius = 24,
  pageColor = "var(--gb-color-page)",
  matchPageBackground = true,
  wordmarkColor,
  imageStyle,
  linkStyle,
  ariaLabel = "Go to Menuply home",
  clickable = true,
}) {
  const xMarkW = Math.round(height * (X_MARK_RATIO * 1266 / 236));
  const fontSize = Math.round(height * 0.52);
  const gap = Math.round(height * 0.22);
  const resolvedWordmarkColor = wordmarkColor ?? (isDarkPageColor(pageColor) ? "#FFFFFF" : "#0B0F0C");

  const content = (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        height,
        gap,
        borderRadius: radius,
        background: matchPageBackground ? pageColor : "transparent",
        lineHeight: 1,
        ...(width ? { width, overflow: "hidden", justifyContent: "flex-start" } : {}),
      }}
    >
      <img
        src={MENUPLY_LOGO_SRC}
        alt=""
        style={{
          display: "block",
          height,
          width: xMarkW,
          objectFit: "cover",
          objectPosition: "left center",
          flexShrink: 0,
          ...imageStyle,
        }}
      />
      <span
        style={{
          fontSize,
          fontWeight: 800,
          color: resolvedWordmarkColor,
          letterSpacing: "-0.02em",
          fontFamily: "var(--gb-font-ui)",
          lineHeight: 1,
          whiteSpace: "nowrap",
        }}
      >
        Menuply
      </span>
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
