/**
 * EVENTS tab — one destination for diner + venue/public events (existing routes).
 */

import { Link } from "react-router-dom";
import { FEED_PRIMARY_NAV_HEIGHT } from "../../../components/consumer/feed/FeedPrimaryNav.jsx";

const LINKS = [
  {
    to: "/events",
    title: "Browse events",
    blurb: "Venue and public events",
  },
  {
    to: "/my-menuply?compose=event",
    title: "Create a social event",
    blurb: "Host Join Me / dining plans as events",
  },
  {
    to: "/my-menuply",
    title: "My events on My Menuply",
    blurb: "Calendar and invitations on your hub",
  },
  {
    to: "/clusters/stadiums/nfl",
    title: "Stadium venues",
    blurb: "NFL stadium destination venues",
  },
];

export default function FeedEventsPage() {
  return (
    <div style={styles.page} data-testid="feed-events">
      <h1 style={styles.h1}>Events</h1>
      <p style={styles.lead}>Everything happening — Join Me, plans, venue events, and more.</p>
      <ul style={styles.list}>
        {LINKS.map((row) => (
          <li key={row.to} style={styles.item}>
            <Link to={row.to} style={styles.link}>
              <span style={styles.title}>{row.title}</span>
              <span style={styles.blurb}>{row.blurb}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100dvh",
    padding: `20px 20px calc(${FEED_PRIMARY_NAV_HEIGHT + 28}px + env(safe-area-inset-bottom))`,
    background: "#0b1210",
    color: "#e8f0ec",
  },
  h1: { margin: "8px 0 6px", fontSize: 28, fontWeight: 800 },
  lead: { margin: "0 0 20px", color: "rgba(232,240,236,0.72)", fontSize: 15, lineHeight: 1.45 },
  list: { listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 },
  item: { margin: 0 },
  link: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    padding: "14px 16px",
    borderRadius: 12,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    textDecoration: "none",
    color: "inherit",
  },
  title: { fontSize: 16, fontWeight: 750, color: "#5eead4" },
  blurb: { fontSize: 13, color: "rgba(232,240,236,0.65)", lineHeight: 1.4 },
};
