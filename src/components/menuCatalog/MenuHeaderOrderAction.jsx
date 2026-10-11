/**
 * Order icon for the restaurant header in the Feed's Menu Browser.
 * Green (Like-style) when the restaurant is taking online orders → opens its ordering menu.
 * Greyed otherwise, but still visible so the ordering vision is clear; tapping/hovering
 * explains why ("Online ordering not available" for unregistered restaurants, or the
 * restaurant's own closed message when it is registered but not open right now).
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LIKE_ACCENT, likeButtonVisualStyle } from "../../lib/likeButtonStyles.js";

export const ORDER_NOT_AVAILABLE_MESSAGE = "Online ordering not available";

function BagIcon({ size = 14, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 8h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8L5 8Z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <path d="M9 10V7a3 3 0 0 1 6 0v3" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function MenuHeaderOrderAction({ available = false, message = "", href = null, size = 28 }) {
  const navigate = useNavigate();
  const [showNote, setShowNote] = useState(false);
  const note = available ? "" : message || ORDER_NOT_AVAILABLE_MESSAGE;

  useEffect(() => {
    if (!showNote) return undefined;
    const timer = window.setTimeout(() => setShowNote(false), 2600);
    return () => window.clearTimeout(timer);
  }, [showNote]);

  function onClick(e) {
    e.preventDefault();
    e.stopPropagation();
    if (available && href) {
      navigate(href);
      return;
    }
    setShowNote(true);
  }

  return (
    <span style={{ position: "relative", display: "inline-flex" }}>
      <button
        type="button"
        data-testid="menu-header-order"
        data-order-available={available ? "true" : "false"}
        aria-label={available ? "Order online" : note}
        aria-disabled={!available}
        title={available ? "Order online" : note}
        onClick={onClick}
        style={{
          ...likeButtonVisualStyle({ selected: available, ghost: true }),
          width: size,
          height: size,
          ...(available ? null : { opacity: 0.45, cursor: "not-allowed", boxShadow: "none" }),
        }}
      >
        <BagIcon size={14} color={available ? LIKE_ACCENT : "#64748b"} />
      </button>
      {showNote ? (
        <span role="status" data-testid="menu-header-order-note" style={styles.note}>
          {note}
        </span>
      ) : null}
    </span>
  );
}

const styles = {
  note: {
    position: "absolute",
    top: "calc(100% + 6px)",
    right: 0,
    zIndex: 20,
    whiteSpace: "nowrap",
    padding: "6px 10px",
    borderRadius: 8,
    background: "rgba(15, 23, 42, 0.92)",
    color: "#fff",
    fontSize: 12,
    fontWeight: 700,
    boxShadow: "0 6px 16px rgba(0,0,0,0.25)",
    pointerEvents: "none",
  },
};
