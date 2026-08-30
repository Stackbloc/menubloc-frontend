/**
 * Feed center X — record video by category, upload library media, or quick invites (LDL/LDD/LHC/MMH).
 */

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { LIVE_FEED_CHANNELS, LIVE_FEED_FULL_CATEGORY_LABELS } from "../../../lib/liveFeedCategory.js";
import { FEED_CONTENT_KINDS } from "../../../lib/feedContentKinds.js";
import { INVITE_COPY_SEEDS, INVITE_MESSAGE_SEED_CODES } from "../../../lib/eatInviteShareCopy.js";

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

export const FEED_QUICK_INVITE_ITEMS = INVITE_MESSAGE_SEED_CODES.map((code) => {
  const seed = INVITE_COPY_SEEDS[code];
  return {
    id: `quick-invite-${code.toLowerCase()}`,
    kind: "quick-invite",
    seedCode: code,
    title: `${seed.emoji} ${code} — ${seed.verbPhrase}`,
    description:
      code === "MMH"
        ? "Share a meet-up link — they can RSVP without a Menuply account"
        : `Share a ${seed.meal} invite — they can RSVP without a Menuply account`,
    testId: `feed-quick-invite-${code.toLowerCase()}`,
    guestOk: false,
    guestDescription: "Sign in to send quick invites",
    guestTo: "/account/login?next=%2Ffeed",
  };
});

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

export const FEED_SHARE_MY_MENUPLY_ITEM = {
  id: "share-my-menuply",
  kind: "share-menuply",
  title: "Share My Menuply",
  description: "Show your QR in person or share your connect link",
  testId: "feed-x-share-my-menuply",
  guestOk: false,
  guestDescription: "Create a free account to share your Menuply",
  guestTo: "/account/signup?next=%2Ffeed",
};

/** Flat X menu — exported for contract tests. */
export const FEED_X_ITEMS = [
  ...VIDEO_ITEMS,
  ...FEED_QUICK_INVITE_ITEMS,
  FEED_SHARE_MY_MENUPLY_ITEM,
  FEED_UPLOAD_MEDIA_ITEM,
];

function SectionTitle({ children }) {
  return <h3 style={styles.sectionTitle}>{children}</h3>;
}

function ActionButton({ item, isAuthenticated, onVideo, onUploadStart, onUploadCategory, onQuickInvite, onShareMyMenuply }) {
  return (
    <li key={item.id}>
      <button
        type="button"
        data-testid={item.testId}
        style={styles.action}
        onClick={() => {
          if (item.kind === "video") {
            onVideo(item.id);
            return;
          }
          if (item.kind === "upload") {
            onUploadStart(item);
            return;
          }
          if (item.kind === "upload-category") {
            onUploadCategory(item.id);
            return;
          }
          if (item.kind === "quick-invite") {
            onQuickInvite(item);
            return;
          }
          if (item.kind === "share-menuply") {
            onShareMyMenuply(item);
          }
        }}
      >
        <span style={styles.actionTitle}>{item.title}</span>
        <span style={styles.actionDesc}>
          {!isAuthenticated && item.guestDescription ? item.guestDescription : item.description}
        </span>
      </button>
    </li>
  );
}

export default function FeedVideoCreateSheet({
  open,
  onClose,
  onPickCategory,
  onPickUploadCategory,
  onPickQuickInvite,
  onShareMyMenuply,
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

  function handleQuickInvite(item) {
    onClose?.();
    if (!isAuthenticated) {
      onPickQuickInvite?.(null, { guestTo: item.guestTo });
      return;
    }
    onPickQuickInvite?.(item.seedCode);
  }

  function handleShareMyMenuply(item) {
    onClose?.();
    if (!isAuthenticated) {
      onShareMyMenuply?.(null, { guestTo: item.guestTo });
      return;
    }
    onShareMyMenuply?.();
  }

  const title = uploadStep ? "Upload media" : "Create";
  const lead = uploadStep ? "What is this video for?" : null;

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
        {uploadStep ? (
          <ul style={styles.list}>
            {UPLOAD_CATEGORY_ITEMS.map((item) => (
              <ActionButton
                key={item.id}
                item={item}
                isAuthenticated={isAuthenticated}
                onVideo={handleVideo}
                onUploadStart={handleUploadStart}
                onUploadCategory={handleUploadCategory}
                onQuickInvite={handleQuickInvite}
                onShareMyMenuply={handleShareMyMenuply}
              />
            ))}
          </ul>
        ) : (
          <>
            <section data-testid="feed-x-section-post-to-feed" style={styles.section}>
              <SectionTitle>Post to Feed</SectionTitle>
              <ul style={styles.list}>
                {VIDEO_ITEMS.map((item) => (
                  <ActionButton
                    key={item.id}
                    item={item}
                    isAuthenticated={isAuthenticated}
                    onVideo={handleVideo}
                    onUploadStart={handleUploadStart}
                    onUploadCategory={handleUploadCategory}
                    onQuickInvite={handleQuickInvite}
                    onShareMyMenuply={handleShareMyMenuply}
                  />
                ))}
              </ul>
            </section>
            <section data-testid="feed-x-section-share-menuply" style={styles.section}>
              <SectionTitle>My Menuply</SectionTitle>
              <ul style={styles.list}>
                <ActionButton
                  item={FEED_SHARE_MY_MENUPLY_ITEM}
                  isAuthenticated={isAuthenticated}
                  onVideo={handleVideo}
                  onUploadStart={handleUploadStart}
                  onUploadCategory={handleUploadCategory}
                  onQuickInvite={handleQuickInvite}
                  onShareMyMenuply={handleShareMyMenuply}
                />
              </ul>
            </section>
            <section data-testid="feed-x-section-quick-invites" style={styles.section}>
              <SectionTitle>Quick Invites</SectionTitle>
              <p style={styles.sectionLead}>
                Share by text or Copy Link. Friends not on Menuply can still open the link and RSVP.
              </p>
              <ul style={styles.list}>
                {FEED_QUICK_INVITE_ITEMS.map((item) => (
                  <ActionButton
                    key={item.id}
                    item={item}
                    isAuthenticated={isAuthenticated}
                    onVideo={handleVideo}
                    onUploadStart={handleUploadStart}
                    onUploadCategory={handleUploadCategory}
                    onQuickInvite={handleQuickInvite}
                    onShareMyMenuply={handleShareMyMenuply}
                  />
                ))}
              </ul>
            </section>
            <ul style={styles.list} aria-label="Post to Feed">
              <ActionButton
                item={FEED_UPLOAD_MEDIA_ITEM}
                isAuthenticated={isAuthenticated}
                onVideo={handleVideo}
                onUploadStart={handleUploadStart}
                onUploadCategory={handleUploadCategory}
                onQuickInvite={handleQuickInvite}
                onShareMyMenuply={handleShareMyMenuply}
              />
            </ul>
          </>
        )}
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
    maxHeight: "min(82vh, 640px)",
    overflowY: "auto",
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
  section: { marginTop: 4 },
  sectionTitle: {
    margin: "8px 0 0",
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "rgba(94, 234, 212, 0.85)",
  },
  sectionLead: {
    margin: "4px 0 0",
    fontSize: 12,
    lineHeight: 1.4,
    color: "rgba(255,255,255,0.55)",
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
