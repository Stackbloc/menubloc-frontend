/**
 * Guest Profile tab — TikTok-style discovery cards before sign-in.
 */

import { Link } from "react-router-dom";
import { FEED_GUEST_PROFILE_CARDS, FEED_SHELL_LOGIN_PATH } from "../../../lib/feedShellLinks.js";
import { FEED_PRIMARY_NAV_HEIGHT } from "./FeedPrimaryNav.jsx";

export default function FeedGuestProfileLanding() {
  return (
    <div style={styles.wrap} data-testid="feed-guest-profile-landing">
      <h1 style={styles.h1}>Your Menuply profile</h1>
      <p style={styles.lead}>
        Join to post videos, connect with friends, and plan where to eat. Anyone can browse; accounts unlock identity and social features.
      </p>
      <div style={styles.cards}>
        {FEED_GUEST_PROFILE_CARDS.map((card) => (
          <Link
            key={card.to}
            to={card.to}
            style={{
              ...styles.card,
              ...(card.primary ? styles.cardPrimary : null),
            }}
            data-testid={card.testId}
          >
            <span style={styles.cardTitle}>{card.title}</span>
            <span style={styles.cardBlurb}>{card.blurb}</span>
            {card.primary ? <span style={styles.cardCta}>Create account</span> : null}
          </Link>
        ))}
      </div>
      <p style={styles.signInLine}>
        Already have an account?{" "}
        <Link to={FEED_SHELL_LOGIN_PATH} style={styles.signInLink} data-testid="feed-guest-sign-in-link">
          Sign in
        </Link>
      </p>
    </div>
  );
}

const styles = {
  wrap: {
    minHeight: "100dvh",
    padding: `12px 16px calc(${FEED_PRIMARY_NAV_HEIGHT + 24}px + env(safe-area-inset-bottom))`,
    background: "#0b1210",
    color: "#e8f0ec",
  },
  h1: {
    margin: "8px 0 6px",
    fontSize: 26,
    fontWeight: 800,
  },
  lead: {
    margin: "0 0 18px",
    color: "rgba(232,240,236,0.72)",
    fontSize: 15,
    lineHeight: 1.5,
  },
  cards: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  card: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    padding: "16px",
    borderRadius: 14,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    textDecoration: "none",
    color: "inherit",
  },
  cardPrimary: {
    borderColor: "rgba(94, 234, 212, 0.35)",
    background: "rgba(16, 40, 32, 0.55)",
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: 800,
  },
  cardBlurb: {
    fontSize: 14,
    lineHeight: 1.45,
    color: "rgba(232,240,236,0.75)",
  },
  cardCta: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: 800,
    color: "#5eead4",
  },
  signInLine: {
    marginTop: 18,
    fontSize: 14,
    color: "rgba(232,240,236,0.72)",
  },
  signInLink: {
    color: "#5eead4",
    fontWeight: 800,
    textDecoration: "none",
  },
};
