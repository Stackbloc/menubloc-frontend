/**
 * Feed More menu — mobile drawer + desktop panel (TikTok-style overflow).
 */

import { useEffect } from "react";
import { Link } from "react-router-dom";
import FeedMenuCaptureCameraIcon from "./FeedMenuCaptureCameraIcon.jsx";
import { FEED_DESKTOP_RAIL_WIDTH, FEED_MENU_CAPTURE_HINT, resolveFeedMoreSections } from "../../../lib/feedShellLinks.js";

function FeedMoreLink({ link, onClose }) {
  const showMenuCaptureIcon = link.testId === "feed-more-add-menu";
  return (
    <Link
      to={link.to}
      style={showMenuCaptureIcon ? styles.linkWithIcon : styles.link}
      data-testid={link.testId}
      title={showMenuCaptureIcon ? FEED_MENU_CAPTURE_HINT : undefined}
      aria-label={showMenuCaptureIcon ? FEED_MENU_CAPTURE_HINT : undefined}
      onClick={onClose}
    >
      {showMenuCaptureIcon ? <FeedMenuCaptureCameraIcon size={18} color="#5eead4" /> : null}
      {link.label}
    </Link>
  );
}

export default function FeedMorePanel({ open, onClose, isAuthenticated = false, isDesktop = false }) {
  const sections = resolveFeedMoreSections({ isAuthenticated });

  useEffect(() => {
    if (!open) return undefined;
    function onKeyDown(event) {
      if (event.key === "Escape") onClose?.();
    }
    document.addEventListener("keydown", onKeyDown);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prev;
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
        aria-label="More"
        onClick={(event) => event.stopPropagation()}
      >
        <div style={styles.head}>
          <h2 style={styles.title}>More</h2>
          <button type="button" style={styles.closeBtn} onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div style={styles.body}>
          {sections.map((section) => (
            <section key={section.id} style={styles.section} aria-labelledby={`feed-more-${section.id}`}>
              <h3 id={`feed-more-${section.id}`} style={styles.sectionTitle}>
                {section.title}
              </h3>
              {Array.isArray(section.groups) && section.groups.length > 0
                ? section.groups.map((group) => (
                    <div key={group.title} style={styles.group}>
                      <h4 style={styles.groupTitle}>{group.title}</h4>
                      <ul style={styles.list}>
                        {group.links.map((link) => (
                          <li key={link.to} style={styles.item}>
                            <FeedMoreLink link={link} onClose={onClose} />
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))
                : (
                    <ul style={styles.list}>
                      {(section.links || []).map((link) => (
                        <li key={link.to} style={styles.item}>
                          <FeedMoreLink link={link} onClose={onClose} />
                        </li>
                      ))}
                    </ul>
                  )}
            </section>
          ))}
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
    justifyContent: "space-between",
    padding: "16px 18px 12px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
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
  section: {
    margin: "8px 0 12px",
  },
  sectionTitle: {
    margin: "0 0 6px",
    padding: "0 6px",
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "rgba(232,240,236,0.55)",
  },
  group: {
    marginBottom: 4,
  },
  groupTitle: {
    margin: "0 0 4px",
    padding: "0 10px",
    fontSize: 13,
    fontWeight: 700,
    color: "rgba(232,240,236,0.82)",
  },
  list: {
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  item: {
    margin: 0,
  },
  link: {
    display: "block",
    padding: "12px 10px",
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
    padding: "12px 10px",
    borderRadius: 10,
    textDecoration: "none",
    color: "#e8f0ec",
    fontSize: 15,
    fontWeight: 650,
  },
};
