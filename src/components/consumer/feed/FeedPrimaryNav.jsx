/**
 * Video-first consumer shell primary nav: FEED | EATING | EVENTS | ME.
 * Shell-scoped only — does not replace global BottomNav until cutover.
 */

import { NavLink } from "react-router-dom";

const TABS = [
  { to: "/feed", end: true, label: "Feed", testId: "feed-nav-feed" },
  { to: "/feed/eating", end: false, label: "Eating", testId: "feed-nav-eating" },
  { to: "/feed/events", end: false, label: "Events", testId: "feed-nav-events" },
  { to: "/feed/me", end: false, label: "Me", testId: "feed-nav-me" },
];

export const FEED_PRIMARY_NAV_HEIGHT = 56;

export default function FeedPrimaryNav() {
  return (
    <nav style={styles.nav} data-testid="feed-primary-nav" aria-label="Primary">
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
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
      ))}
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
    justifyContent: "space-around",
    background: "rgba(8, 12, 10, 0.92)",
    borderTop: "1px solid rgba(255,255,255,0.12)",
    backdropFilter: "blur(10px)",
  },
  tab: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textDecoration: "none",
    fontSize: 13,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    minHeight: FEED_PRIMARY_NAV_HEIGHT,
    touchAction: "manipulation",
  },
};
