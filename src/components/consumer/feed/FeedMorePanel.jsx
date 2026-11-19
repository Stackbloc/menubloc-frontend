/**
 * Feed ☰ menu — mobile drawer + desktop panel. Same order as the app (Andre 2026-11-18): Profile card
 * and Events pinned on top, then accordions (Connects opens first), Terms · Privacy footer line.
 * Updated 2026-11-19: FeedMenuContent is the accordion on its own, so the desktop rail draws it
 * inline (no "More" pop-out); the Feed adds the app's location row under Events.
 */

import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useConsumer } from "../../../context/ConsumerContext.jsx";
import AppIcon from "../../icons/AppIcon.jsx";
import FeedMenuCaptureCameraIcon from "./FeedMenuCaptureCameraIcon.jsx";
import {
  FEED_DESKTOP_RAIL_WIDTH,
  FEED_MENU_CAPTURE_HINT,
  FEED_MORE_LEGAL,
  FEED_MORE_PINNED,
  resolveFeedMoreSections,
} from "../../../lib/feedShellLinks.js";
import { restoreDocumentScroll } from "../../../pages/consumer/myMenuply/pendingHighlightMedia.js";
import { feedHeaderLocationLabel } from "./FeedMobileHeader.jsx";

function FeedMoreLink({ link, onClose }) {
  const { pathname } = useLocation();
  const showMenuCaptureIcon = link.testId === "feed-more-add-menu";
  return (
    <Link
      to={link.withFrom ? `${link.to}?from=${encodeURIComponent(pathname)}` : link.to}
      style={showMenuCaptureIcon ? styles.linkWithIcon : styles.link}
      data-testid={link.testId}
      title={showMenuCaptureIcon ? FEED_MENU_CAPTURE_HINT : undefined}
      aria-label={showMenuCaptureIcon ? FEED_MENU_CAPTURE_HINT : undefined}
      onClick={onClose}
    >
      {showMenuCaptureIcon ? <FeedMenuCaptureCameraIcon size={18} color="#5eead4" /> : null}
      <span>
        {link.label}
        {link.note ? <span style={styles.note}>{link.note}</span> : null}
      </span>
    </Link>
  );
}

/** Feed only: the app's location row under Events (AppMenuButton showLocation, 2026-11-19). */
function FeedMenuLocationRow({ onClose }) {
  const place = feedHeaderLocationLabel(typeof window !== "undefined" ? window.localStorage : null);
  return (
    <Link
      to="/feed/search"
      style={styles.locRow}
      data-testid="feed-more-location"
      aria-label={`Location: ${place}. Change location`}
      onClick={onClose}
    >
      <AppIcon name="pin" size={18} color="#5eead4" />
      <span style={styles.locText}>{place}</span>
      <span style={styles.locChange}>Change</span>
    </Link>
  );
}

/**
 * The ☰ accordion itself (2026-11-19): drawn in the phone sheet and, on desktop, right inside the
 * left rail, so the website reads like the app's ☰ everywhere.
 */
export function FeedMenuContent({ isAuthenticated = false, onClose, showLocation = false }) {
  const sections = resolveFeedMoreSections({ isAuthenticated });
  const { logout, consumer, profile } = useConsumer();
  const [expanded, setExpanded] = useState(isAuthenticated ? "connects" : "help");
  const name = isAuthenticated
    ? profile?.display_name ||
      [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
      consumer?.email ||
      "Your profile"
    : null;
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
      onClose?.();
      navigate("/", { replace: true });
    }
  }

  return (
    <>
      {/* Profile card: who you are, first. Signed out it is the way in. */}
      <Link
        to={isAuthenticated ? FEED_MORE_PINNED.profile.to : FEED_MORE_PINNED.profile.guestTo}
        style={styles.pinned}
        data-testid={FEED_MORE_PINNED.profile.testId}
        onClick={onClose}
      >
        <span style={styles.avatar}>
          <AppIcon name="profile" size={22} color="#5eead4" />
        </span>
        <span style={styles.pinnedText}>
          <span style={styles.pinnedTitle}>{name || "Sign in"}</span>
          <span style={styles.note}>{name ? "View profile" : "Sign in or create an account"}</span>
        </span>
        <span style={styles.chevron}>›</span>
      </Link>
      {/* Events: pinned under Profile so it stands out. */}
      <Link to={FEED_MORE_PINNED.events.to} style={styles.pinned} data-testid={FEED_MORE_PINNED.events.testId} onClick={onClose}>
        <span style={styles.eventsIcon}>
          <AppIcon name={FEED_MORE_PINNED.events.icon} size={20} color="#5eead4" />
        </span>
        <span style={styles.pinnedText}>
          <span style={styles.pinnedTitle}>{FEED_MORE_PINNED.events.label}</span>
          <span style={styles.note}>{FEED_MORE_PINNED.events.note}</span>
        </span>
        <span style={styles.chevron}>›</span>
      </Link>
      {showLocation ? <FeedMenuLocationRow onClose={onClose} /> : null}
      {sections.map((section) => {
        const isOpen = expanded === section.id;
        return (
          <section key={section.id} style={styles.section}>
            <button
              type="button"
              id={`feed-more-${section.id}`}
              style={styles.sectionHead}
              aria-expanded={isOpen}
              data-testid={`feed-more-section-${section.id}`}
              onClick={() => setExpanded(isOpen ? null : section.id)}
            >
              <span>{section.title}</span>
              <span style={styles.toggle}>{isOpen ? "−" : "+"}</span>
            </button>
            {isOpen ? (
              <ul style={styles.list} aria-labelledby={`feed-more-${section.id}`}>
                {section.links.map((link) => (
                  <li key={link.to} style={styles.item}>
                    <FeedMoreLink link={link} onClose={onClose} />
                  </li>
                ))}
                {/* Sign out: last row of Account & Settings, quiet red text. */}
                {section.signOut && isAuthenticated ? (
                  <li style={styles.item}>
                    <button
                      type="button"
                      style={styles.logoutBtn}
                      data-testid="feed-more-logout"
                      disabled={loggingOut}
                      onClick={handleLogout}
                    >
                      {loggingOut ? "Signing out…" : "Sign out"}
                    </button>
                  </li>
                ) : null}
              </ul>
            ) : null}
          </section>
        );
      })}
      <p style={styles.legal}>
        {FEED_MORE_LEGAL.map((link, i) => (
          <span key={link.to}>
            {i > 0 ? " · " : null}
            <Link to={link.to} style={styles.legalLink} data-testid={link.testId} onClick={onClose}>
              {link.label}
            </Link>
          </span>
        ))}
      </p>
    </>
  );
}

export default function FeedMorePanel({ open, onClose, isAuthenticated = false, isDesktop = false, showLocation = false }) {
  useEffect(() => {
    if (!open) return undefined;
    function onKeyDown(event) {
      if (event.key === "Escape") onClose?.();
    }
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      restoreDocumentScroll();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div style={styles.backdrop} data-testid="feed-more-panel" role="presentation" onClick={onClose}>
      <div
        style={{
          ...styles.panel,
          ...(isDesktop ? styles.panelDesktop : styles.panelMobile),
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        onClick={(event) => event.stopPropagation()}
      >
        {/* The app's ☰ sheet has no title, only the menu (2026-11-19); × stays for the web. */}
        <div style={styles.head}>
          <button type="button" style={styles.closeBtn} onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div style={isDesktop ? styles.body : { ...styles.body, ...styles.bodyMobile }}>
          <FeedMenuContent isAuthenticated={isAuthenticated} onClose={onClose} showLocation={showLocation} />
        </div>
      </div>
    </div>
  );
}

const styles = {
  backdrop: {
    position: "fixed",
    inset: 0,
    zIndex: 120,
    background: "rgba(0,0,0,0.55)",
    backdropFilter: "blur(4px)",
  },
  panel: {
    background: "#0f1412",
    color: "#e8f0ec",
    border: "1px solid rgba(255,255,255,0.12)",
    boxShadow: "0 16px 48px rgba(0,0,0,0.45)",
    display: "flex",
    flexDirection: "column",
    maxHeight: "100dvh",
  },
  panelMobile: {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: "16px 16px 0 0",
    maxHeight: "min(88dvh, 720px)",
  },
  panelDesktop: {
    position: "fixed",
    top: 0,
    left: FEED_DESKTOP_RAIL_WIDTH,
    bottom: 0,
    width: 320,
    borderRadius: 0,
    borderRight: "1px solid rgba(255,255,255,0.12)",
  },
  head: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    padding: "12px 14px 4px",
  },
  title: {
    margin: 0,
    fontSize: 18,
    fontWeight: 800,
  },
  closeBtn: {
    appearance: "none",
    border: "none",
    background: "rgba(255,255,255,0.08)",
    color: "#fff",
    width: 36,
    height: 36,
    borderRadius: 999,
    fontSize: 22,
    lineHeight: 1,
    cursor: "pointer",
  },
  body: {
    overflowY: "auto",
    padding: "8px 12px calc(16px + env(safe-area-inset-bottom))",
  },
  // Mobile sheet sits behind the fixed bottom nav — keep the last items (Log out) reachable.
  bodyMobile: {
    paddingBottom:
      "calc(16px + env(safe-area-inset-bottom) + var(--feed-primary-nav-h, 0px) + var(--bottom-nav-h, 0px))",
  },
  section: {
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },
  sectionHead: {
    appearance: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    padding: "14px 10px",
    border: "none",
    background: "transparent",
    color: "#e8f0ec",
    fontSize: 16,
    fontWeight: 800,
    fontFamily: "inherit",
    cursor: "pointer",
    textAlign: "left",
  },
  toggle: { color: "rgba(232,240,236,0.55)", fontSize: 18, fontWeight: 700 },
  pinned: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 10px",
    textDecoration: "none",
    color: "#e8f0ec",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    border: "1px solid rgba(255,255,255,0.18)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  eventsIcon: { width: 44, display: "flex", justifyContent: "center", flexShrink: 0 },
  pinnedText: { display: "flex", flexDirection: "column", flex: 1, minWidth: 0 },
  pinnedTitle: { fontSize: 16, fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  chevron: { color: "rgba(232,240,236,0.55)", fontSize: 20 },
  note: { display: "block", fontSize: 12, fontWeight: 500, color: "rgba(232,240,236,0.6)", marginTop: 2 },
  locRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 10px",
    textDecoration: "none",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },
  locText: { flex: 1, minWidth: 0, color: "#e8f0ec", fontSize: 15, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  locChange: { color: "#5eead4", fontSize: 14, fontWeight: 700 },
  legal: { margin: "14px 0 4px", textAlign: "center", fontSize: 12, color: "rgba(232,240,236,0.55)" },
  legalLink: { color: "rgba(232,240,236,0.7)", textDecoration: "none" },
  list: {
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  item: {
    margin: 0,
  },
  logoutBtn: {
    display: "block",
    width: "100%",
    textAlign: "left",
    padding: "12px 10px 12px 22px",
    borderRadius: 10,
    border: "none",
    background: "transparent",
    color: "#fca5a5",
    fontSize: 15,
    fontWeight: 650,
    fontFamily: "inherit",
    cursor: "pointer",
  },
  link: {
    display: "block",
    padding: "11px 10px 11px 22px",
    borderRadius: 10,
    textDecoration: "none",
    color: "#e8f0ec",
    fontSize: 15,
    fontWeight: 650,
  },
  linkWithIcon: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "11px 10px 11px 22px",
    borderRadius: 10,
    textDecoration: "none",
    color: "#e8f0ec",
    fontSize: 15,
    fontWeight: 650,
  },
};
