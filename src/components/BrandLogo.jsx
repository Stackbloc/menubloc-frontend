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

export const MENUPLY_LOGO_SRC = "/menuply-logo-dark.png";

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
        background: matchPageBackground ? "transparent" : pageColor,
        lineHeight: 0,
      }}
    >
      <img
        src={MENUPLY_LOGO_SRC}
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
          color: "#667085",
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
