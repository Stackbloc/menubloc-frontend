/**
 * Menu Browser transient notice pill. It used to flash "Tap a menu item to add it to your basket ·
 * Hold to remove" on every menu load; since 2026-10-16 that lives only in the static "Order here"
 * chip. Still used for "We cannot detect your location" and short in-menu notes (removed, can't order).
 */

import { useEffect, useState } from "react";

export const TAP_TO_ORDER_HINT = "Tap a menu item to add it to your basket · Hold to remove";
export const TAP_TO_ORDER_HINT_MS = 4000;

function BagIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 8h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8L5 8Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M9 10V7a3 3 0 0 1 6 0v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function MenuTapToOrderHint({ message = TAP_TO_ORDER_HINT, tone = "order", durationMs = TAP_TO_ORDER_HINT_MS }) {
  const [phase, setPhase] = useState("in");

  useEffect(() => {
    const fade = window.setTimeout(() => setPhase("out"), Math.max(0, durationMs - 400));
    const hide = window.setTimeout(() => setPhase("gone"), durationMs);
    return () => {
      window.clearTimeout(fade);
      window.clearTimeout(hide);
    };
  }, [durationMs]);

  if (phase === "gone" || !message) return null;
  const order = tone === "order";
  return (
    <div style={styles.wrap} aria-hidden={phase === "out"}>
      <div
        role="status"
        data-testid="menu-tap-to-order-hint"
        style={{
          ...styles.pill,
          background: order ? "rgba(21, 128, 61, 0.94)" : "rgba(15, 23, 42, 0.9)",
          opacity: phase === "out" ? 0 : 1,
        }}
      >
        {order ? <BagIcon /> : null}
        <span>{message}</span>
      </div>
    </div>
  );
}

const styles = {
  wrap: {
    position: "absolute",
    top: 52,
    left: 12,
    right: 12,
    zIndex: 40,
    display: "flex",
    justifyContent: "center",
    pointerEvents: "none",
  },
  pill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    maxWidth: "100%",
    padding: "9px 14px",
    borderRadius: 999,
    color: "#fff",
    fontSize: 13,
    fontWeight: 700,
    lineHeight: 1.3,
    textAlign: "center",
    boxShadow: "0 8px 22px rgba(0,0,0,0.25)",
    transition: "opacity 400ms ease",
  },
};
