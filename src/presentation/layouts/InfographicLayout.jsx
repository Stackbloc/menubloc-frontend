import React from "react";
import { PRESENTATION_THEME } from "../theme.js";

/** Centered infographic / diagram slide. */
export default function InfographicLayout({
  headline,
  children,
  background = PRESENTATION_THEME.white,
  ink = PRESENTATION_THEME.ink,
  style,
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background,
        color: ink,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "clamp(24px, 5vw, 64px)",
        boxSizing: "border-box",
        textAlign: "center",
        gap: 28,
        ...style,
      }}
    >
      {headline ? (
        <h1
          style={{
            margin: 0,
            fontSize: "clamp(26px, 4.2vw, 48px)",
            lineHeight: 1.1,
            fontWeight: 900,
            letterSpacing: "-0.02em",
            textTransform: "uppercase",
            maxWidth: 920,
          }}
        >
          {headline}
        </h1>
      ) : null}
      <div style={{ width: "100%", maxWidth: 980 }}>{children}</div>
    </div>
  );
}
