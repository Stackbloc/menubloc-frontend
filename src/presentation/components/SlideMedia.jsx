import React from "react";
import { PRESENTATION_THEME } from "../theme.js";

/**
 * Unified media slot for slides — image, SVG, or future video embeds.
 */
export default function SlideMedia({
  src,
  alt = "",
  type = "image",
  fit = "cover",
  style,
  className,
  children,
  placeholderLabel,
}) {
  const base = {
    width: "100%",
    height: "100%",
    objectFit: fit,
    display: "block",
    ...style,
  };

  if (children) {
    return (
      <div className={className} style={{ width: "100%", height: "100%", ...style }}>
        {children}
      </div>
    );
  }

  if (!src) {
    return (
      <div
        className={className}
        style={{
          width: "100%",
          height: "100%",
          background: `linear-gradient(145deg, #111 0%, #1a1a1a 50%, #0d1a12 100%)`,
          border: `1px solid rgba(34, 197, 94, 0.25)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: PRESENTATION_THEME.inkOnDarkMuted,
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          boxSizing: "border-box",
          ...style,
        }}
        aria-hidden={!placeholderLabel}
        role={placeholderLabel ? "img" : undefined}
        aria-label={placeholderLabel || undefined}
      >
        {placeholderLabel || "Media"}
      </div>
    );
  }

  if (type === "video") {
    return (
      <video
        className={className}
        src={src}
        style={base}
        controls={false}
        playsInline
        muted
        loop
        autoPlay
        aria-label={alt || undefined}
      />
    );
  }

  return <img className={className} src={src} alt={alt} style={base} />;
}
