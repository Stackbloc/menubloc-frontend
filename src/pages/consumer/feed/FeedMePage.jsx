/**
 * ME tab — identity / account entry into existing My Menuply + account surfaces.
 */

import { Link } from "react-router-dom";
import { FEED_PRIMARY_NAV_HEIGHT } from "../../../components/consumer/feed/FeedPrimaryNav.jsx";
import { useConsumer } from "../../../context/ConsumerContext.jsx";
import { MY_MENUPLY_PROFILE_PATH } from "../../../lib/myMenuplyRoutes.js";

const CORE_LINKS = [
  {
    to: MY_MENUPLY_PROFILE_PATH,
    title: "My Menuply",
    blurb: "Profile, videos, photos, connections, Dining Crew",
    testId: "feed-me-my-menuply",
  },
  {
    to: "/clusters",
    title: "Clusters",
    blurb: "Stadiums, campuses, venues, and food places",
    testId: "feed-me-clusters",
  },
  {
    to: "/menu-capture",
    title: "Upload menu photos",
    blurb: "Photograph a menu and contribute media only",
    testId: "feed-me-menu-upload",
  },
  {
    to: "/account",
    title: "Account & settings",
    blurb: "Security, preferences, profile details",
    testId: "feed-me-account",
  },
  {
    to: "/account/find-diners",
    title: "Find diners",
    blurb: "Discover people through food",
    testId: "feed-me-find-diners",
  },
];

const GUEST_AUTH_LINKS = [
  {
    to: "/account/signup?next=%2Ffeed%2Fme",
    title: "Create account",
    blurb: "Free — claim videos, connect with friends, and post plans",
    testId: "feed-me-create-account",
  },
  {
    to: "/account/login?next=%2Ffeed%2Fme",
    title: "Sign in",
    blurb: "Accounts unlock identity and social features",
    testId: "feed-me-sign-in",
  },
];

export default function FeedMePage() {
  const { isAuthenticated } = useConsumer();
  const links = isAuthenticated ? CORE_LINKS : [...CORE_LINKS, ...GUEST_AUTH_LINKS];

  return (
    <div style={styles.page} data-testid="feed-me">
      <h1 style={styles.h1}>Me</h1>
      <p style={styles.lead}>Your identity and account — Connections and Dining Crew stay nested here.</p>
      <ul style={styles.list}>
        {links.map((row) => (
          <li key={row.to} style={styles.item}>
            <Link to={row.to} style={styles.link} data-testid={row.testId}>
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
