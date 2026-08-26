/**
 * Feed center X — pick I'm Eating or Wanna Eat, then record video (Feed shell only).
 */

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { LIVE_FEED_CHANNELS } from "../../../lib/liveFeedCategory.js";

const FEED_CREATE_CATEGORIES = LIVE_FEED_CHANNELS.filter((ch) =>
  ["ate", "want"].includes(ch.id)
);

export default function FeedVideoCreateSheet({ open, onClose, onPickCategory }) {
  useEffect(() => {
    if (!open) return undefined;
    function onKey(event) {
      if (event.key === "Escape") onClose?.();
    }
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      role="presentation"
      data-testid="feed-video-create-sheet"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
      style={styles.backdrop}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="feed-video-create-title"
        style={styles.sheet}
      >
        <div style={styles.head}>
          <h2 id="feed-video-create-title" style={styles.title}>
            Post video to Feed
          </h2>
          <button type="button" onClick={() => onClose?.()} aria-label="Close" style={styles.close}>
            Close
          </button>
        </div>
        <p style={styles.lead}>Record a short food video — plans and events stay on Eating / Events.</p>
        <ul style={styles.list}>
          {FEED_CREATE_CATEGORIES.map((row) => (
            <li key={row.id}>
              <button
                type="button"
                data-testid={`feed-video-create-${row.id}`}
                style={styles.action}
                onClick={() => onPickCategory?.(row.id)}
              >
                <span style={styles.actionTitle}>{row.label}</span>
                <span style={styles.actionDesc}>
                  {row.id === "ate"
                    ? "What you're eating right now"
                    : "A dish or craving you want"}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>,
    document.body
  );
}

const styles = {
  backdrop: {
    position: "fixed",
    inset: 0,
    zIndex: 350,
    background: "rgba(0,0,0,0.55)",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    padding: "16px 12px calc(var(--feed-primary-nav-h, 72px) + 12px)",
  },
  sheet: {
    width: "min(420px, 100%)",
    background: "#101512",
    color: "#fff",
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.12)",
    boxShadow: "0 18px 50px rgba(0,0,0,0.45)",
    padding: "16px 16px 10px",
    fontFamily: "Inter, Arial, sans-serif",
  },
  head: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  title: { margin: 0, fontSize: 18, fontWeight: 900, color: "#fff" },
  close: {
    border: 0,
    background: "transparent",
    color: "rgba(255,255,255,0.72)",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 13,
  },
  lead: { margin: "6px 0 12px", fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 1.4 },
  list: { listStyle: "none", margin: 0, padding: 0 },
  action: {
    width: "100%",
    textAlign: "left",
    border: 0,
    background: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    padding: "12px 14px",
    marginBottom: 8,
    cursor: "pointer",
    color: "inherit",
    fontFamily: "inherit",
  },
  actionTitle: { display: "block", fontSize: 16, fontWeight: 800, color: "#5eead4" },
  actionDesc: { display: "block", marginTop: 4, fontSize: 12, color: "rgba(255,255,255,0.62)" },
};
