/**
 * Feed shell bottom bar, the app's tab bar (menuply-mobile app/(tabs)/_layout.tsx; app wins, Andre
 * 2026-10-29): Home · Post (X) · Deals · Search · Profile. White bar with a top border; inactive tabs
 * ink-muted; the active tab's icon sits in a 52×30 accent-soft pill, icon and label accent, label bold.
 * Post keeps the two-tone X. The basket opens from the cart button beside ☰ (FeedMobileHeader).
 * Mobile bottom bar only — desktop uses FeedDesktopRail from the same tab config.
 *
 * Portaled to document.body so a playing Feed reel (or leftover compositing layer) cannot
 * sit above the tabs after Feed → Profile.
 */
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import MenuplyXMark from "../../MenuplyXMark.jsx";
import { FEED_LEFT_TABS, FEED_RIGHT_TABS, visibleFeedTabs } from "../../../lib/feedShellLinks.js";
import { useConsumer } from "../../../context/ConsumerContext.jsx";
import AppIcon from "../../icons/AppIcon.jsx";
import { clearStuckMediaChrome } from "../../../pages/consumer/myMenuply/pendingHighlightMedia.js";

export const FEED_PRIMARY_NAV_HEIGHT = 64;

const ACCENT = "#0f7a24";
const ACCENT_SOFT = "#e8f5e3";
const INK_MUTED = "#5c665f";

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
  const active = !tab.openShareQr && tabIsActive(tab, location.pathname);

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
      data-testid={tab.testId}
      aria-label={tab.label}
      aria-current={active ? "page" : undefined}
      onClick={go}
      style={{ ...styles.tab, ...styles.tabButton }}
    >
      <span aria-hidden="true" style={{ ...styles.iconWrap, ...(active ? styles.iconWrapOn : null) }}>
        <AppIcon name={tab.icon} size={24} color={active ? ACCENT : INK_MUTED} />
      </span>
      <span style={{ ...styles.label, ...(active ? styles.labelOn : null) }}>{tab.label}</span>
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
        aria-label="Post"
        aria-haspopup="dialog"
        aria-expanded={createActive}
        onClick={() => {
          clearStuckMediaChrome();
          onCreateClick?.();
        }}
        style={{ ...styles.tab, ...styles.tabButton }}
      >
        <span aria-hidden="true" style={{ ...styles.iconWrap, ...(createActive ? styles.iconWrapOn : null) }}>
          <MenuplyXMark size={24} active={createActive} />
        </span>
        <span style={{ ...styles.label, ...(createActive ? styles.labelOn : null) }}>Post</span>
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
    paddingLeft: 8,
    paddingRight: 8,
    background: "#ffffff",
    borderTop: "1px solid #e1e6e1",
    boxSizing: "border-box",
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
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    minHeight: FEED_PRIMARY_NAV_HEIGHT,
    touchAction: "manipulation",
    padding: "6px 0 4px",
  },
  tabButton: {
    border: "none",
    background: "transparent",
    cursor: "pointer",
    appearance: "none",
    WebkitAppearance: "none",
    fontFamily: "inherit",
    width: "100%",
  },
  iconWrap: {
    width: 52,
    height: 30,
    borderRadius: 15,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapOn: { background: ACCENT_SOFT },
  label: { fontSize: 12, lineHeight: "16px", fontWeight: 600, color: INK_MUTED, whiteSpace: "nowrap" },
  labelOn: { fontWeight: 700, color: ACCENT },
  /** Post gets the same-width slot as a tab so all items spread evenly. */
  createSlot: {
    flex: "1 1 0",
    minWidth: 0,
    display: "flex",
    alignItems: "stretch",
    justifyContent: "center",
  },
};
