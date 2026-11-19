/**
 * Desktop left rail, as the app (2026-11-19, Andre: "update the website feed to match the app,
 * including the accordion set up"): the app's tabs with the app's icons in the app's order
 * (Home · Post · Deals · Clusters · Profile; Today first when it is on), then the app's ☰ accordion
 * right in the rail (FeedMenuContent: Profile card, Events, location, Connects · Account & Settings ·
 * Help · Menuply, Terms · Privacy). Replaces the flat list + Add menu + Log in/Sign up + "More" pop-out;
 * sign-in is the Profile card, Add a menu is in Account & Settings. The cart shows by the logo when
 * the basket has items, as the app's CartButton beside ☰.
 */

import { useLocation, useNavigate } from "react-router-dom";
import { BrandLogo } from "../../BrandLogo.jsx";
import MenuplyXMark from "../../MenuplyXMark.jsx";
import AppIcon from "../../icons/AppIcon.jsx";
import FeedShopBasketButton from "./FeedShopBasketButton.jsx";
import { FeedMenuContent } from "./FeedMorePanel.jsx";
import { useOrderCart } from "../../../context/OrderCartContext.jsx";
import { FEED_DESKTOP_RAIL_WIDTH, resolveFeedTabs, visibleFeedTabs } from "../../../lib/feedShellLinks.js";
import { clearStuckMediaChrome } from "../../../pages/consumer/myMenuply/pendingHighlightMedia.js";
import useConsumerFeatureFlags from "../../../hooks/useConsumerFeatureFlags.js";

const ACCENT = "#5eead4";
const MUTED = "rgba(255,255,255,0.72)";

function RailTab({ tab, onShareQr }) {
  const location = useLocation();
  const navigate = useNavigate();
  const alsoActive = tab.alsoActiveOn?.includes(location.pathname);
  const pathActive =
    tab.end
      ? location.pathname === tab.to || location.pathname === `${tab.to}/`
      : location.pathname === tab.to || location.pathname.startsWith(`${tab.to}/`);
  const active = Boolean(alsoActive || pathActive);

  function go() {
    clearStuckMediaChrome();
    if (tab.openShareQr) {
      onShareQr?.();
      return;
    }
    navigate(tab.to, { replace: Boolean(tab.resetSearch) });
  }

  return (
    <button
      type="button"
      data-testid={`${tab.testId}-desktop`}
      aria-label={tab.openShareQr ? "Share My QR" : tab.label}
      aria-current={active && !tab.openShareQr ? "page" : undefined}
      onClick={go}
      style={{ ...styles.tab, ...(active && !tab.openShareQr ? styles.tabActive : null) }}
    >
      {tab.icon ? <AppIcon name={tab.icon} size={22} color={active ? ACCENT : MUTED} /> : null}
      <span>{tab.label}</span>
    </button>
  );
}

export default function FeedDesktopRail({ onCreateClick, createActive = false, onShareMyMenuply, isAuthenticated = false }) {
  // Signed in with Today on: Today · Feed · Post · Clusters · Profile, as the app's bar.
  const { todayHome } = useConsumerFeatureFlags();
  const { itemCount } = useOrderCart();
  const { pathname } = useLocation();
  const tabs = resolveFeedTabs({ isAuthenticated, todayHome });
  const leftTabs = visibleFeedTabs(tabs.left, { isAuthenticated, desktop: true });
  const rightTabs = visibleFeedTabs(tabs.right, { isAuthenticated, desktop: true });
  // The app shows the location row in ☰ on the Feed only.
  const onFeed = pathname === "/feed" || pathname === "/feed/" || pathname.startsWith("/feed/deals");
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
        {itemCount > 0 ? (
          <span data-testid="feed-desktop-shop-basket">
            <FeedShopBasketButton variant="feedDark" />
          </span>
        ) : null}
      </div>

      <nav style={styles.tabs} aria-label="Primary">
        {leftTabs.map((tab) => (
          <RailTab key={tab.testId} tab={tab} onShareQr={onShareMyMenuply} />
        ))}
        <button
          type="button"
          data-testid="feed-nav-create-x-desktop"
          aria-label="Post"
          aria-haspopup="dialog"
          aria-expanded={createActive}
          onClick={() => {
            clearStuckMediaChrome();
            onCreateClick?.();
          }}
          style={{ ...styles.tab, ...(createActive ? styles.tabActive : null) }}
        >
          <MenuplyXMark size={22} active={createActive} />
          <span>Post</span>
        </button>
        {rightTabs.map((tab) => (
          <RailTab key={tab.testId} tab={tab} onShareQr={onShareMyMenuply} />
        ))}
      </nav>

      {/* The app's ☰ accordion, open in the rail (no "More" button). */}
      <div style={styles.menu} data-testid="feed-desktop-menu">
        <FeedMenuContent isAuthenticated={isAuthenticated} showLocation={onFeed} />
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
    zIndex: 1300,
    display: "flex",
    flexDirection: "column",
    padding: "16px 10px 0",
    background: "#050705",
    color: "#e8f0ec",
    borderRight: "1px solid rgba(255,255,255,0.1)",
    boxSizing: "border-box",
  },
  logoWrap: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    padding: "4px 8px 12px",
  },
  tabs: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
    paddingBottom: 10,
    borderBottom: "1px solid rgba(255,255,255,0.1)",
  },
  tab: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    width: "100%",
    padding: "9px 12px",
    borderRadius: 10,
    border: "none",
    background: "transparent",
    color: MUTED,
    fontSize: 15,
    fontWeight: 650,
    fontFamily: "inherit",
    textAlign: "left",
    cursor: "pointer",
    appearance: "none",
    WebkitAppearance: "none",
  },
  tabActive: {
    color: ACCENT,
    fontWeight: 800,
    background: "rgba(94, 234, 212, 0.08)",
  },
  menu: {
    flex: 1,
    minHeight: 0,
    overflowY: "auto",
    padding: "4px 2px calc(12px + env(safe-area-inset-bottom))",
  },
};
