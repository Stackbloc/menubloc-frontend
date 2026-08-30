/**
 * Feed center X — record video by category, or upload library media by category.
 */

import { useEffect, useState } from "react";
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

const UPLOAD_CATEGORY_ITEMS = VIDEO_ITEMS.map((item) => ({
  ...item,
  kind: "upload-category",
  description:
    item.id === FEED_CONTENT_KINDS.ATE
      ? "Upload a video of what you're eating now"
      : item.id === FEED_CONTENT_KINDS.REVIEWS
        ? "Upload a video review of a specific menu item"
        : "Upload a video of a dish or craving you want",
  testId: `feed-upload-media-${item.id}`,
}));

export const FEED_UPLOAD_MEDIA_ITEM = {
  id: "upload-media",
  kind: "upload",
  title: "Upload media",
  description: "Choose a video from your library, then pick what it's for",
  testId: "feed-x-upload-media",
  guestOk: false,
  guestDescription: "Create a free account to upload food videos",
  guestTo: "/account/signup?next=%2Ffeed",
};

/** Flat X menu — exported for contract tests. */
export const FEED_X_ITEMS = [...VIDEO_ITEMS, FEED_UPLOAD_MEDIA_ITEM];

export default function FeedVideoCreateSheet({
  open,
  onClose,
  onPickCategory,
  onPickUploadCategory,
  isAuthenticated = false,
}) {
  const [uploadStep, setUploadStep] = useState(false);

  useEffect(() => {
    if (!open) {
      setUploadStep(false);
      return undefined;
    }
    function onKey(event) {
      if (event.key === "Escape") {
        if (uploadStep) {
          setUploadStep(false);
          return;
        }
        onClose?.();
      }
    }
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose, uploadStep]);

  if (!open || typeof document === "undefined") return null;

  function handleVideo(category) {
    onClose?.();
    onPickCategory?.(category);
  }

  function handleUploadStart(item) {
    if (!isAuthenticated) {
      onClose?.();
      onPickUploadCategory?.(null, { guestTo: item.guestTo });
      return;
    }
    setUploadStep(true);
  }

  function handleUploadCategory(category) {
    onClose?.();
    setUploadStep(false);
    onPickUploadCategory?.(category);
  }

  const items = uploadStep ? UPLOAD_CATEGORY_ITEMS : FEED_X_ITEMS;
  const title = uploadStep ? "Upload media" : "Post to Feed";
  const lead = uploadStep
    ? "What is this video for?"
    : null;

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
        data-upload-step={uploadStep ? "category" : "main"}
      >
        <div style={styles.head}>
          {uploadStep ? (
            <button
              type="button"
              onClick={() => setUploadStep(false)}
              style={styles.back}
              data-testid="feed-upload-media-back"
            >
              Back
            </button>
          ) : (
            <span style={styles.headSpacer} aria-hidden />
          )}
          <h2 id="feed-video-create-title" style={styles.title}>
            {title}
          </h2>
          <button type="button" onClick={() => onClose?.()} aria-label="Close" style={styles.close}>
            Close
          </button>
        </div>
        {lead ? <p style={styles.lead}>{lead}</p> : null}
        <ul style={styles.list}>
          {items.map((item) => (
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
                  if (item.kind === "upload") {
                    handleUploadStart(item);
                    return;
                  }
                  if (item.kind === "upload-category") {
                    handleUploadCategory(item.id);
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
    display: "grid",
    gridTemplateColumns: "auto 1fr auto",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  headSpacer: { width: 44 },
  title: { margin: 0, fontSize: 18, fontWeight: 900, color: "#fff", textAlign: "center" },
  back: {
    border: 0,
    background: "transparent",
    color: "#5eead4",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 13,
    padding: 0,
  },
  close: {
    border: 0,
    background: "transparent",
    color: "rgba(255,255,255,0.72)",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 13,
  },
  lead: {
    margin: "0 0 8px",
    fontSize: 13,
    color: "rgba(255,255,255,0.62)",
    textAlign: "center",
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
