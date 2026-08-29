/**
 * Feed center X — video post actions + Share My Menuply.
 */

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { LIVE_FEED_CHANNELS, LIVE_FEED_FULL_CATEGORY_LABELS } from "../../../lib/liveFeedCategory.js";
import { FEED_CONTENT_KINDS } from "../../../lib/feedContentKinds.js";

export const FEED_VIDEO_CATEGORY_IDS = [
  FEED_CONTENT_KINDS.ATE,
  FEED_CONTENT_KINDS.WANT,
  FEED_CONTENT_KINDS.REVIEWS,
];

const X_CATEGORY_TITLES = {
  [FEED_CONTENT_KINDS.ATE]: LIVE_FEED_FULL_CATEGORY_LABELS.ate,
  [FEED_CONTENT_KINDS.WANT]: LIVE_FEED_FULL_CATEGORY_LABELS.want,
  [FEED_CONTENT_KINDS.REVIEWS]: "Food Review",
};

const VIDEO_ITEMS = LIVE_FEED_CHANNELS.filter((ch) =>
  FEED_VIDEO_CATEGORY_IDS.includes(ch.id)
).map((ch) => ({
  id: ch.id,
  kind: "video",
  title: X_CATEGORY_TITLES[ch.id] || LIVE_FEED_FULL_CATEGORY_LABELS[ch.id] || ch.label,
  description:
    ch.id === FEED_CONTENT_KINDS.ATE
      ? "Record a short video of what you're eating now"
      : ch.id === FEED_CONTENT_KINDS.REVIEWS
        ? "Record a video review of a specific menu item"
        : "Record a short video of a dish or craving you want",
  testId: `feed-video-create-${ch.id}`,
}));

/** Flat X menu — exported for contract tests. */
export const FEED_X_ITEMS = [
  ...VIDEO_ITEMS,
  {
    id: "share-my-menuply",
    kind: "share",
    title: "Share My Menuply",
    description: "Show your personal QR code — scan to connect on Menuply",
    testId: "feed-x-share-my-menuply",
    guestOk: false,
    guestDescription: "Create a free account to get your personal Menuply link",
    guestTo: "/account/signup?next=%2Ffeed",
  },
];

export default function FeedVideoCreateSheet({
  open,
  onClose,
  onPickCategory,
  onShareMyMenuply,
  isAuthenticated = false,
}) {
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

  function handleShare(item) {
    onClose?.();
    onShareMyMenuply?.(item);
  }

  function handleVideo(category) {
    onClose?.();
    onPickCategory?.(category);
  }

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
            Post to Feed
          </h2>
          <button type="button" onClick={() => onClose?.()} aria-label="Close" style={styles.close}>
            Close
          </button>
        </div>
        <ul style={styles.list}>
          {FEED_X_ITEMS.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                data-testid={item.testId}
                style={styles.action}
                onClick={() => {
                  if (item.kind === "video") {
                    handleVideo(item.id);
                    return;
                  }
                  if (item.kind === "share") {
                    handleShare(item);
                  }
                }}
              >
                <span style={styles.actionTitle}>{item.title}</span>
                <span style={styles.actionDesc}>
                  {!isAuthenticated && item.guestDescription
                    ? item.guestDescription
                    : item.description}
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
    marginBottom: 8,
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
  list: { listStyle: "none", margin: 0, padding: 0 },
  action: {
    width: "100%",
    textAlign: "left",
    border: 0,
    background: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    padding: "12px 14px",
    marginTop: 8,
    cursor: "pointer",
    color: "inherit",
    fontFamily: "inherit",
  },
  actionTitle: { display: "block", fontSize: 16, fontWeight: 800, color: "#e8f0ec" },
  actionDesc: { display: "block", marginTop: 4, fontSize: 12, color: "rgba(255,255,255,0.62)" },
};
