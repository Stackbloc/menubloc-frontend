/**
 * TikTok-style feed shell nav: Home · Waiter · Share My QR | [X] | Deals · Search · Profile.
 * Waiter and Share My QR are signed-in only (authOnly); guests see Home | [X] | Deals · Search · Profile.
 * Share My QR opens the diner QR share sheet. Menu Browser lives on the video rail/dock.
 * Mobile bottom bar only — desktop uses FeedDesktopRail from the same tab config.
 *
 * Portaled to document.body so a playing Feed reel (or leftover compositing layer) cannot
 * sit above the tabs after Feed → Profile. Share My QR opens a sheet in-place; other tabs
 * navigate — both must receive the same hit-testing.
 */

import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import MenuplyXMark from "../../MenuplyXMark.jsx";
import { FEED_LEFT_TABS, FEED_RIGHT_TABS, visibleFeedTabs } from "../../../lib/feedShellLinks.js";
import { useConsumer } from "../../../context/ConsumerContext.jsx";
import { useOrderCart } from "../../../context/OrderCartContext.jsx";
import { clearStuckMediaChrome } from "../../../pages/consumer/myMenuply/pendingHighlightMedia.js";

export const FEED_PRIMARY_NAV_HEIGHT = 56;

function tabIsActive(tab, pathname) {
  if (tab.alsoActiveOn?.includes(pathname)) return true;
  if (tab.end) {
    return pathname === tab.to || pathname === `${tab.to}/`;
  }
  return pathname === tab.to || pathname.startsWith(`${tab.to}/`);
}

function TabControl({ tab, onShareQr }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { itemCount, openCart } = useOrderCart();
  const active = !tab.openCart && tabIsActive(tab, location.pathname);
  const basketBadge = tab.openCart && itemCount > 0 ? (itemCount > 9 ? "9+" : String(itemCount)) : null;

  function go() {
    clearStuckMediaChrome();
    if (tab.openCart) {
      openCart();
      return;
    }
    if (tab.openShareQr) {
      onShareQr?.();
      return;
    }
    navigate(tab.to, { replace: Boolean(tab.resetSearch) });
  }

  return (
    <button
      type="button"
      data-testid={tab.testId}
      aria-label={
        tab.openShareQr ? "Share My QR" : basketBadge ? `Basket with ${itemCount} items` : tab.label
      }
      aria-current={active && !tab.openShareQr ? "page" : undefined}
      onClick={go}
      style={{
        ...styles.tab,
        ...styles.tabButton,
        color: active && !tab.openShareQr ? "#5eead4" : "rgba(255,255,255,0.72)",
        fontWeight: active && !tab.openShareQr ? 800 : 600,
      }}
    >
      {tab.mobileIcon ? (
        <span aria-hidden="true" style={styles.tabIcon}>{tab.mobileIcon}</span>
      ) : (
        tab.label
      )}
      {basketBadge ? (
        <span aria-hidden="true" style={styles.tabBadge}>{basketBadge}</span>
      ) : null}
    </button>
  );
}

export default function FeedPrimaryNav({
  onCreateClick,
  createActive = false,
  onShareQr,
}) {
  const { isAuthenticated } = useConsumer();
  const leftTabs = visibleFeedTabs(FEED_LEFT_TABS, { isAuthenticated });
  const rightTabs = visibleFeedTabs(FEED_RIGHT_TABS, { isAuthenticated });
  const nav = (
    <nav
      style={styles.nav}
      data-testid="feed-primary-nav"
      aria-label="Primary"
      className="feed-primary-nav-mobile"
    >
      {/* Each side grows by its tab count so every tab gets the same width (even spacing
          when guests see 1 tab left of X and 3 on the right). */}
      <div style={{ ...styles.side, flexGrow: Math.max(1, leftTabs.length) }}>
        {leftTabs.map((tab) => (
          <TabControl key={tab.testId} tab={tab} onShareQr={onShareQr} />
        ))}
      </div>
      <div style={styles.createSlot}>
      <button
        type="button"
        data-testid="feed-nav-create-x"
        aria-label="Open Multiplier/Post menu"
        aria-haspopup="dialog"
        aria-expanded={createActive}
        onClick={() => {
          clearStuckMediaChrome();
          onCreateClick?.();
        }}
        style={styles.createBtn}
      >
        <MenuplyXMark size={26} active={createActive} />
      </button>
      </div>
      <div style={{ ...styles.side, flexGrow: Math.max(1, rightTabs.length) }}>
        {rightTabs.map((tab) => (
          <TabControl key={tab.testId} tab={tab} onShareQr={onShareQr} />
        ))}
      </div>
    </nav>
  );

  if (typeof document === "undefined") return nav;
  // Body portal: survives Feed-home stacking / iOS video layers after Profile.
  return createPortal(nav, document.body);
}

const styles = {
  nav: {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 0,
    // Above ShareModal (1200) and stuck compose (~350–360) so primary taps can
    // dismiss overlays via clearStuckMediaChrome. Camera sheets (~13000) still win.
    zIndex: 1300,
    height: `calc(${FEED_PRIMARY_NAV_HEIGHT}px + env(safe-area-inset-bottom, 0px))`,
    paddingBottom: "env(safe-area-inset-bottom, 0px)",
    display: "flex",
    alignItems: "stretch",
    justifyContent: "space-between",
    gap: 2,
    paddingLeft: 2,
    paddingRight: 2,
    background: "rgba(8, 12, 10, 0.94)",
    borderTop: "1px solid rgba(255,255,255,0.12)",
    backdropFilter: "blur(10px)",
  },
  side: {
    flex: "1 1 0",
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
    fontSize: 10,
    letterSpacing: "0.02em",
    textTransform: "uppercase",
    minHeight: FEED_PRIMARY_NAV_HEIGHT,
    touchAction: "manipulation",
    textAlign: "center",
    lineHeight: 1.1,
    padding: "0 2px",
  },
  tabButton: {
    border: "none",
    background: "transparent",
    cursor: "pointer",
    appearance: "none",
    WebkitAppearance: "none",
    color: "inherit",
    fontFamily: "inherit",
    width: "100%",
  },
  /** X gets the same-width slot as a tab so all items spread evenly. */
  tabBadge: {
    marginLeft: 3,
    minWidth: 15,
    height: 15,
    padding: "0 4px",
    borderRadius: 999,
    background: "#dc2626",
    color: "#fff",
    fontSize: 9,
    fontWeight: 800,
    lineHeight: "15px",
    textAlign: "center",
    boxSizing: "border-box",
  },
  tabIcon: {
    fontSize: 22,
    lineHeight: 1,
    // Lift to line up with the raised X button.
    transform: "translateY(-5px)",
  },
  createSlot: {
    flex: "1 1 0",
    minWidth: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  createBtn: {
    flex: "0 0 auto",
    alignSelf: "center",
    width: 48,
    height: 48,
    marginTop: -8,
    borderRadius: 14,
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
