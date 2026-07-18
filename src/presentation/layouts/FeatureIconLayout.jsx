import React from "react";
import { PRESENTATION_THEME } from "../theme.js";

/** Large green icon + feature label. */
export default function FeatureIconLayout({
  icon,
  title,
  subtitle,
  background = PRESENTATION_THEME.white,
  style,
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "clamp(24px, 5vw, 64px)",
        boxSizing: "border-box",
        gap: 28,
        ...style,
      }}
    >
      <div
        style={{
          width: "clamp(120px, 18vw, 168px)",
          height: "clamp(120px, 18vw, 168px)",
          borderRadius: "50%",
          background: PRESENTATION_THEME.accent,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: PRESENTATION_THEME.black,
          boxShadow: "0 18px 48px rgba(34, 197, 94, 0.28)",
        }}
      >
        {icon}
      </div>
      {title ? (
        <h1
          style={{
            margin: 0,
            fontSize: "clamp(28px, 4.4vw, 52px)",
            fontWeight: 900,
            letterSpacing: "-0.02em",
            textTransform: "uppercase",
            color: PRESENTATION_THEME.ink,
            textAlign: "center",
          }}
        >
          {title}
        </h1>
      ) : null}
      {subtitle ? (
        <p
          style={{
            margin: 0,
            fontSize: "clamp(15px, 1.8vw, 20px)",
            color: PRESENTATION_THEME.inkMuted,
            fontWeight: 600,
            textAlign: "center",
            maxWidth: 480,
          }}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
