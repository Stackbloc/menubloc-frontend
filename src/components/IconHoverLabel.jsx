import { useState } from "react";

/**
 * Wraps an icon button and reveals a short text label on hover — the same
 * affordance used by Follow / Share / Like on public menu pages.
 */
export default function IconHoverLabel({ label, children, style }) {
  const [hovered, setHovered] = useState(false);

  if (!label) return children;

  return (
    <span
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        ...style,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
      {hovered ? (
        <span
          role="tooltip"
          style={{
            position: "absolute",
            bottom: "calc(100% + 6px)",
            left: "50%",
            transform: "translateX(-50%)",
            padding: "4px 8px",
            borderRadius: 6,
            background: "#1D1D1F",
            color: "#FFFFFF",
            fontSize: 11,
            fontWeight: 600,
            whiteSpace: "nowrap",
            pointerEvents: "none",
            zIndex: 20,
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.14)",
            letterSpacing: "0.01em",
          }}
        >
          {label}
        </span>
      ) : null}
    </span>
  );
}
