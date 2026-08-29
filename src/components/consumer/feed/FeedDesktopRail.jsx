/**
 * TikTok desktop-style left rail — same Feed primary tabs + guest auth + More.
 */

import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { BrandLogo } from "../../BrandLogo.jsx";
import MenuplyXMark from "../../MenuplyXMark.jsx";
import FeedShopBasketButton from "./FeedShopBasketButton.jsx";
import {
  FEED_DESKTOP_RAIL_WIDTH,
  FEED_PRIMARY_TABS,
  FEED_SHELL_LOGIN_PATH,
  FEED_SHELL_SIGNUP_PATH,
} from "../../../lib/feedShellLinks.js";

function RailTab({ tab }) {
  const location = useLocation();
  const navigate = useNavigate();
  const alsoActive = tab.alsoActiveOn?.includes(location.pathname);

  if (tab.resetSearch) {
    return (
      <NavLink
        to={tab.to}
        end={tab.end}
        data-testid={`${tab.testId}-desktop`}
        onClick={(event) => {
          event.preventDefault();
          navigate(tab.to, { replace: true });
        }}
        style={({ isActive }) => ({
          ...styles.tab,
          ...(isActive || alsoActive ? styles.tabActive : null),
        })}
      >
        {tab.label}
      </NavLink>
    );
  }

  return (
    <NavLink
      to={tab.to}
      end={tab.end}
      data-testid={`${tab.testId}-desktop`}
      style={({ isActive }) => ({
        ...styles.tab,
        ...(isActive || alsoActive ? styles.tabActive : null),
      })}
    >
      {tab.label}
    </NavLink>
  );
}

export default function FeedDesktopRail({
  onCreateClick,
  createActive = false,
  onMoreClick,
  onShareMyMenuply,
  isAuthenticated = false,
  showShopBasket = false,
}) {
  return (
    <aside style={styles.rail} data-testid="feed-desktop-rail" aria-label="Feed navigation">
      <div style={styles.logoWrap}>
        <BrandLogo
          to="/feed"
          height={32}
          radius={8}
          matchPageBackground
          pageColor="#050705"
          wordmarkColor="#FFFFFF"
          ariaLabel="Menuply Feed home"
        />
      </div>

      <button
        type="button"
        style={styles.shareBtn}
        data-testid="feed-desktop-share-my-menuply"
        onClick={() => onShareMyMenuply?.()}
      >
        Share My Menuply
      </button>

      <nav style={styles.tabs} aria-label="Primary">
        {FEED_PRIMARY_TABS.map((tab) => (
          <RailTab key={tab.to} tab={tab} />
        ))}
      </nav>

      <button
        type="button"
        data-testid="feed-nav-create-x-desktop"
        aria-label="Open post menu"
        aria-haspopup="dialog"
        aria-expanded={createActive}
        onClick={() => onCreateClick?.()}
        style={{
          ...styles.createBtn,
          ...(createActive ? styles.createBtnActive : null),
        }}
      >
        <MenuplyXMark size={24} active={createActive} />
        <span style={styles.createLabel}>Post</span>
      </button>

      {!isAuthenticated ? (
        <div style={styles.authBlock} data-testid="feed-desktop-guest-auth">
          <Link to={FEED_SHELL_LOGIN_PATH} style={styles.loginBtn} data-testid="feed-desktop-login">
            Log in
          </Link>
          <Link to={FEED_SHELL_SIGNUP_PATH} style={styles.signupBtn} data-testid="feed-desktop-signup">
            Sign up
          </Link>
        </div>
      ) : null}

      <div style={styles.footer}>
        {showShopBasket ? (
          <div style={styles.shopBasketWrap} data-testid="feed-desktop-shop-basket">
            <FeedShopBasketButton variant="feedDark" />
            <span style={styles.shopBasketLabel}>Basket</span>
          </div>
        ) : null}
        <button
          type="button"
          style={styles.moreBtn}
          data-testid="feed-more-open-desktop"
          onClick={() => onMoreClick?.()}
        >
          More
        </button>
      </div>
    </aside>
  );
}

export { FEED_DESKTOP_RAIL_WIDTH };

const styles = {
  rail: {
    position: "fixed",
    top: 0,
    left: 0,
    bottom: 0,
    width: FEED_DESKTOP_RAIL_WIDTH,
    zIndex: 60,
    display: "flex",
    flexDirection: "column",
    padding: "16px 12px calc(12px + env(safe-area-inset-bottom))",
    background: "#050705",
    borderRight: "1px solid rgba(255,255,255,0.1)",
    boxSizing: "border-box",
  },
  logoWrap: {
    padding: "4px 8px 16px",
  },
  shareBtn: {
    display: "block",
    width: "100%",
    margin: "0 0 12px",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid rgba(94, 234, 212, 0.35)",
    background: "rgba(16, 40, 32, 0.85)",
    color: "#e8f0ec",
    fontWeight: 800,
    fontSize: 14,
    textAlign: "left",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  tabs: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    flex: 1,
    minHeight: 0,
  },
  tab: {
    display: "block",
    padding: "10px 12px",
    borderRadius: 10,
    textDecoration: "none",
    color: "rgba(255,255,255,0.78)",
    fontSize: 15,
    fontWeight: 650,
  },
  tabActive: {
    color: "#5eead4",
    fontWeight: 800,
    background: "rgba(94, 234, 212, 0.08)",
  },
  createBtn: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    margin: "8px 0 12px",
    padding: "10px 12px",
    borderRadius: 12,
    border: "2px solid rgba(94, 234, 212, 0.35)",
    background: "rgba(16, 40, 32, 0.85)",
    color: "#fff",
    cursor: "pointer",
    appearance: "none",
    fontFamily: "inherit",
    fontSize: 15,
    fontWeight: 700,
  },
  createBtnActive: {
    borderColor: "rgba(94, 234, 212, 0.75)",
    background: "rgba(16, 40, 32, 1)",
  },
  createLabel: {
    flex: 1,
    textAlign: "left",
  },
  authBlock: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    marginBottom: 12,
  },
  loginBtn: {
    display: "block",
    textAlign: "center",
    padding: "11px 14px",
    borderRadius: 999,
    background: "#ef4444",
    color: "#fff",
    fontWeight: 800,
    fontSize: 15,
    textDecoration: "none",
  },
  signupBtn: {
    display: "block",
    textAlign: "center",
    padding: "10px 14px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.18)",
    color: "#e8f0ec",
    fontWeight: 700,
    fontSize: 14,
    textDecoration: "none",
  },
  footer: {
    marginTop: "auto",
    paddingTop: 8,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  shopBasketWrap: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "4px 8px",
  },
  shopBasketLabel: {
    fontSize: 14,
    fontWeight: 700,
    color: "rgba(255,255,255,0.85)",
  },
  moreBtn: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.04)",
    color: "rgba(255,255,255,0.85)",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
    fontFamily: "inherit",
  },
};
