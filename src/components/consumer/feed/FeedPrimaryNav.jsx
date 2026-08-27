/**
 * Video-first consumer shell primary nav: FEED | EATING | [X] | EVENTS | ME.
 * Center X opens categorized Feed actions (post video, My Menuply, share & account).
 */

import { NavLink } from "react-router-dom";
import MenuplyXMark from "../../MenuplyXMark.jsx";

const LEFT_TABS = [
  { to: "/feed", end: true, label: "Feed", testId: "feed-nav-feed" },
  { to: "/feed/eating", end: false, label: "Eating", testId: "feed-nav-eating" },
];

const RIGHT_TABS = [
  { to: "/feed/events", end: false, label: "Events", testId: "feed-nav-events" },
  { to: "/feed/me", end: false, label: "Me", testId: "feed-nav-me" },
];

export const FEED_PRIMARY_NAV_HEIGHT = 64;

function TabLink({ tab }) {
  return (
    <NavLink
      to={tab.to}
      end={tab.end}
      data-testid={tab.testId}
      style={({ isActive }) => ({
        ...styles.tab,
        color: isActive ? "#5eead4" : "rgba(255,255,255,0.72)",
        fontWeight: isActive ? 800 : 600,
      })}
    >
      {tab.label}
    </NavLink>
  );
}

export default function FeedPrimaryNav({ onCreateClick, createActive = false }) {
  return (
    <nav
      style={styles.nav}
      data-testid="feed-primary-nav"
      aria-label="Primary"
    >
      <div style={styles.side}>
        {LEFT_TABS.map((tab) => (
          <TabLink key={tab.to} tab={tab} />
        ))}
      </div>
      <button
        type="button"
        data-testid="feed-nav-create-x"
        aria-label="Open Menuply menu"
        aria-haspopup="dialog"
        aria-expanded={createActive}
        onClick={() => onCreateClick?.()}
        style={styles.createBtn}
      >
        <MenuplyXMark size={28} active={createActive} />
      </button>
      <div style={styles.side}>
        {RIGHT_TABS.map((tab) => (
          <TabLink key={tab.to} tab={tab} />
        ))}
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
    height: `calc(${FEED_PRIMARY_NAV_HEIGHT}px + env(safe-area-inset-bottom, 0px))`,
    paddingBottom: "env(safe-area-inset-bottom, 0px)",
    display: "flex",
    alignItems: "stretch",
    justifyContent: "space-between",
    gap: 4,
    paddingLeft: 4,
    paddingRight: 4,
    background: "rgba(8, 12, 10, 0.92)",
    borderTop: "1px solid rgba(255,255,255,0.12)",
    backdropFilter: "blur(10px)",
  },
  side: {
    flex: 1,
    display: "flex",
    alignItems: "stretch",
    minWidth: 0,
  },
  tab: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textDecoration: "none",
    fontSize: 12,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    minHeight: FEED_PRIMARY_NAV_HEIGHT,
    touchAction: "manipulation",
    textAlign: "center",
  },
  createBtn: {
    flex: "0 0 auto",
    alignSelf: "center",
    width: 52,
    height: 52,
    marginTop: -10,
    borderRadius: 16,
    border: "2px solid rgba(94, 234, 212, 0.45)",
    background: "rgba(16, 40, 32, 0.95)",
    boxShadow: "0 4px 16px rgba(0,0,0,0.35)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    padding: 0,
    appearance: "none",
    WebkitAppearance: "none",
  },
};
