import React from "react";
import { PRESENTATION_THEME } from "../theme.js";
import BrandMark from "../components/BrandMark.jsx";

/** Centered black title / impact slide. */
export default function TitleLayout({
  children,
  showBrand = true,
  brandHeight = 80,
  footer,
  style,
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: PRESENTATION_THEME.black,
        color: PRESENTATION_THEME.white,
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "clamp(24px, 6vw, 72px)",
        boxSizing: "border-box",
        textAlign: "center",
        gap: 28,
        ...style,
      }}
    >
      {showBrand ? <BrandMark height={brandHeight} /> : null}
      <div style={{ maxWidth: 960, width: "100%" }}>{children}</div>
      {footer ? (
        <div
          style={{
            position: "absolute",
            bottom: "clamp(28px, 6vh, 56px)",
            left: 0,
            right: 0,
            textAlign: "center",
          }}
        >
          {footer}
        </div>
      ) : null}
    </div>
  );
}
