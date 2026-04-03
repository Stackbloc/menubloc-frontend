/**
 * ============================================================
 * File: BrandLogo.jsx
 * Path: menubloc-frontend/src/components/BrandLogo.jsx
 * Date: 2026-04-03
 * Purpose:
 *   Shared Grubbid brand logo / lockup for consistent use across
 *   discovery, auth, nav, and onboarding pages.
 * ============================================================
 */

import React from "react";
import { Link } from "react-router-dom";

export function BrandLogo({
  to = "/",
  width = 180,
  height = 112,
  radius = 24,
  pageColor = "#f7f6f1",
  imageStyle,
  linkStyle,
  ariaLabel = "Go to Grubbid home",
}) {
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
      <span
        style={{
          display: "inline-flex",
          width,
          height,
          overflow: "hidden",
          borderRadius: radius,
          background: pageColor,
          lineHeight: 0,
        }}
      >
        <img
          src="/grubbid-logo-plain.jpg"
          alt="Grubbid"
          style={{
            display: "block",
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
            filter: "saturate(0.92) contrast(0.96)",
            ...imageStyle,
          }}
        />
      </span>
    </Link>
  );
}

export function BrandLockup({
  subtitle = null,
  subtitleStyle,
  wrapperStyle,
  logoProps,
}) {
  return (
    <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", ...wrapperStyle }}>
      <BrandLogo {...logoProps} />
      {subtitle ? (
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: "#667085",
            letterSpacing: 1.4,
            textTransform: "uppercase",
            marginTop: 6,
            textAlign: "center",
            ...subtitleStyle,
          }}
        >
          {subtitle}
        </div>
      ) : null}
    </div>
  );
}
