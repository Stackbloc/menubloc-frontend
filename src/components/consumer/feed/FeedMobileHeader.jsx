/**
 * Mobile Feed top bar — More menu entry (TikTok mobile hamburger pattern).
 */

import { Link } from "react-router-dom";
import { BrandLogo } from "../../BrandLogo.jsx";
import { FEED_SHELL_LOGIN_PATH } from "../../../lib/feedShellLinks.js";

export default function FeedMobileHeader({ onMoreClick, isAuthenticated = false }) {
  return (
    <header style={styles.header} data-testid="feed-mobile-header">
      <div style={styles.logoWrap}>
        <BrandLogo
        to="/feed"
        height={28}
        radius={7}
        matchPageBackground
        pageColor="#050705"
        wordmarkColor="#FFFFFF"
        ariaLabel="Menuply Feed home"
        />
      </div>
      <div style={styles.actions}>
        {!isAuthenticated ? (
          <Link to={FEED_SHELL_LOGIN_PATH} style={styles.loginChip} data-testid="feed-mobile-login">
            Log in
          </Link>
        ) : null}
        <button
          type="button"
          style={styles.moreBtn}
          data-testid="feed-more-open-mobile"
          aria-label="Open More menu"
          onClick={() => onMoreClick?.()}
        >
          ☰
        </button>
      </div>
    </header>
  );
}

const styles = {
  header: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 55,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "max(8px, env(safe-area-inset-top)) 12px 8px",
    background: "linear-gradient(180deg, rgba(5,7,5,0.92) 0%, rgba(5,7,5,0.45) 70%, transparent 100%)",
    pointerEvents: "none",
  },
  logoWrap: {
    pointerEvents: "auto",
  },
  actions: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    pointerEvents: "auto",
  },
  loginChip: {
    padding: "6px 12px",
    borderRadius: 999,
    background: "linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)",
    color: "#fff",
    fontWeight: 800,
    fontSize: 13,
    textDecoration: "none",
    boxShadow: "0 2px 8px rgba(46, 125, 50, 0.35)",
  },
  moreBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(8, 12, 10, 0.82)",
    color: "#fff",
    fontSize: 18,
    lineHeight: 1,
    cursor: "pointer",
    pointerEvents: "auto",
  },
};
