/**
 * EATING tab — personal food life (wraps existing My Menuply eating destinations).
 * Photos / photo+audio stay here — not in Feed.
 */

import { Link } from "react-router-dom";
import { FEED_PRIMARY_NAV_HEIGHT } from "../../../components/consumer/feed/FeedPrimaryNav.jsx";

const LINKS = [
  {
    to: "/my-menuply?compose=ate",
    title: "What I'm Eating",
    blurb: "Record or post what you're eating now",
  },
  {
    to: "/my-menuply?compose=want",
    title: "What I Wanna Eat",
    blurb: "Save dishes you want — videos can appear on Feed",
  },
  {
    to: "/my-menuply?compose=plan",
    title: "My Eating Plans",
    blurb: "Plan meals and invite others",
  },
  {
    to: "/my-menuply",
    title: "Photos & meal board",
    blurb: "Photos and photo + audio live on your personal hub",
  },
  {
    to: "/account/im-eating",
    title: "I'm Eating At",
    blurb: "Report where you're dining",
  },
  {
    to: "/account/what-i-ate",
    title: "What I Ate",
    blurb: "Your eating diary",
  },
];

export default function FeedEatingPage() {
  return (
    <div style={styles.page} data-testid="feed-eating">
      <h1 style={styles.h1}>Eating</h1>
      <p style={styles.lead}>Your food life — videos, photos, plans. Feed stays video-only.</p>
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
