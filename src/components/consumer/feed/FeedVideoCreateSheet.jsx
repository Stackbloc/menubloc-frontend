/**
 * Feed center X — categorized launcher (video post, My Menuply, share & account).
 */

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { LIVE_FEED_CHANNELS, LIVE_FEED_FULL_CATEGORY_LABELS } from "../../../lib/liveFeedCategory.js";

export const FEED_VIDEO_CATEGORY_IDS = ["ate", "want"];

const VIDEO_ITEMS = LIVE_FEED_CHANNELS.filter((ch) =>
  FEED_VIDEO_CATEGORY_IDS.includes(ch.id)
).map((ch) => ({
  id: ch.id,
  kind: "video",
  title: LIVE_FEED_FULL_CATEGORY_LABELS[ch.id] || ch.label,
  description:
    ch.id === "ate"
      ? "Record a short video of what you're eating now"
      : "Record a short video of a dish or craving you want",
  testId: `feed-video-create-${ch.id}`,
}));

/** Labeled sections — exported for contract tests. */
export const FEED_X_SECTIONS = [
  {
    id: "post-feed",
    title: "Post to Feed",
    defaultOpen: true,
    items: VIDEO_ITEMS,
  },
  {
    id: "diary",
    title: "Diary (photos & plans)",
    defaultOpen: true,
    items: [
      {
        id: "ate",
        kind: "diary",
        title: "I'm Eating",
        description: "Photo or video of what you're eating now",
        testId: "feed-x-diary-ate",
      },
      {
        id: "want",
        kind: "diary",
        title: "Wanna Eat",
        description: "Save a craving — restaurant and menu item optional",
        testId: "feed-x-diary-want",
      },
      {
        id: "plan",
        kind: "diary",
        title: "Eating Plan",
        description: "Schedule a future meal and Join Me",
        testId: "feed-x-diary-plan",
      },
    ],
  },
  {
    id: "my-menuply",
    title: "My Menuply",
    defaultOpen: true,
    items: [
      {
        id: "my-menuply-hub",
        kind: "navigate",
        to: "/my-menuply",
        title: "My Menuply",
        description: "Plans, calendar, Join Me, photos, and connections",
        testId: "feed-x-my-menuply",
        guestOk: true,
      },
    ],
  },
  {
    id: "share-account",
    title: "Share & account",
    defaultOpen: true,
    items: [
      {
        id: "share-my-menuply",
        kind: "share",
        title: "Share My Menuply",
        description: "Text friends your link to connect on Menuply",
        testId: "feed-x-share-my-menuply",
        guestOk: false,
        guestDescription: "Create a free account to get your personal Menuply link",
        guestTo: "/account/signup?next=%2Ffeed",
      },
      {
        id: "create-account",
        kind: "navigate",
        to: "/account/signup?next=%2Ffeed",
        title: "Create account",
        description: "Free — claim videos, connect with friends, and post plans",
        testId: "feed-x-create-account",
        guestOnly: true,
        guestOk: true,
      },
      {
        id: "sign-in",
        kind: "navigate",
        to: "/account/login?next=%2Ffeed",
        title: "Sign in",
        description: "Accounts unlock identity and social features",
        testId: "feed-x-sign-in",
        guestOnly: true,
        guestOk: true,
      },
      {
        id: "my-account",
        kind: "navigate",
        to: "/account",
        title: "Account & settings",
        description: "Security, preferences, and profile details",
        testId: "feed-x-account",
        authOnly: true,
        guestOk: false,
      },
    ],
  },
];

function SectionBlock({ section, open, onToggle, isAuthenticated, onVideo, onDiary, onNavigate, onShare }) {
  const items = section.items.filter((item) => {
    if (item.guestOnly && isAuthenticated) return false;
    if (item.authOnly && !isAuthenticated) return false;
    return true;
  });

  if (items.length === 0) return null;

  return (
    <section style={styles.section} data-testid={`feed-x-section-${section.id}`}>
      <button
        type="button"
        style={styles.sectionHead}
        aria-expanded={open}
        onClick={onToggle}
      >
        <span style={styles.sectionTitle}>{section.title}</span>
        <span style={styles.sectionChevron} aria-hidden>
          {open ? "−" : "+"}
        </span>
      </button>
      {open ? (
        <ul style={styles.list}>
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                data-testid={item.testId}
                style={styles.action}
                onClick={() => {
                  if (item.kind === "video") {
                    onVideo?.(item.id);
                    return;
                  }
                  if (item.kind === "diary") {
                    onDiary?.(item.id);
                    return;
                  }
                  if (item.kind === "share") {
                    onShare?.(item);
                    return;
                  }
                  if (item.kind === "navigate") {
                    onNavigate?.(item);
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
      ) : null}
    </section>
  );
}

export default function FeedVideoCreateSheet({
  open,
  onClose,
  onPickCategory,
  onPickDiary,
  onNavigate,
  onShareMyMenuply,
  isAuthenticated = false,
}) {
  const initialOpen = useMemo(
    () =>
      Object.fromEntries(
        FEED_X_SECTIONS.map((section) => [section.id, section.defaultOpen !== false])
      ),
    []
  );
  const [sectionOpen, setSectionOpen] = useState(initialOpen);

  useEffect(() => {
    if (!open) return undefined;
    setSectionOpen(initialOpen);
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
  }, [open, onClose, initialOpen]);

  if (!open || typeof document === "undefined") return null;

  function handleNavigate(item) {
    onClose?.();
    onNavigate?.(item);
  }

  function handleShare(item) {
    onClose?.();
    onShareMyMenuply?.(item);
  }

  function handleVideo(category) {
    onClose?.();
    onPickCategory?.(category);
  }

  function handleDiary(category) {
    onClose?.();
    onPickDiary?.(category);
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
            Menuply
          </h2>
          <button type="button" onClick={() => onClose?.()} aria-label="Close" style={styles.close}>
            Close
          </button>
        </div>
        <p style={styles.lead}>
          Post to the national Feed, open your personal hub, or share and manage your account.
        </p>
        {FEED_X_SECTIONS.map((section) => (
          <SectionBlock
            key={section.id}
            section={section}
            open={sectionOpen[section.id] !== false}
            isAuthenticated={isAuthenticated}
            onToggle={() =>
              setSectionOpen((prev) => ({ ...prev, [section.id]: !prev[section.id] }))
            }
            onVideo={handleVideo}
            onDiary={handleDiary}
            onNavigate={handleNavigate}
            onShare={handleShare}
          />
        ))}
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
  section: { marginBottom: 4 },
  sectionHead: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    border: 0,
    background: "rgba(94, 234, 212, 0.08)",
    borderRadius: 10,
    padding: "8px 10px",
    marginTop: 8,
    cursor: "pointer",
    textAlign: "left",
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: "0.04em",
    color: "#5eead4",
    textTransform: "uppercase",
  },
  sectionChevron: { fontSize: 16, fontWeight: 700, color: "rgba(255,255,255,0.5)", lineHeight: 1 },
  list: { listStyle: "none", margin: 0, padding: "0 0 4px" },
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
