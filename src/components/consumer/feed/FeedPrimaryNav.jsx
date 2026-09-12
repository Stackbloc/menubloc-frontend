/**
 * TikTok-style feed shell nav: Home · Waiter · Share My QR | [X] | Deals · Search · Profile.
 * Share My QR opens the diner QR share sheet. Menu Browser lives on the video rail/dock.
 * Mobile bottom bar only — desktop uses FeedDesktopRail from the same tab config.
 *
 * All tabs use the same button/navigate click path (not raw NavLink default). After Feed
 * home, body touch-action leftovers made <a> NavLinks look dead while Share My QR worked.
 */

import { useLocation, useNavigate } from "react-router-dom";
import MenuplyXMark from "../../MenuplyXMark.jsx";
import { FEED_LEFT_TABS, FEED_RIGHT_TABS } from "../../../lib/feedShellLinks.js";
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
  const active = tabIsActive(tab, location.pathname);

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
      aria-label={tab.openShareQr ? "Share My QR" : tab.label}
      aria-current={active && !tab.openShareQr ? "page" : undefined}
      onClick={go}
      style={{
        ...styles.tab,
        ...styles.tabButton,
        color: active && !tab.openShareQr ? "#5eead4" : "rgba(255,255,255,0.72)",
        fontWeight: active && !tab.openShareQr ? 800 : 600,
      }}
    >
      {tab.label}
    </button>
  );
}

export default function FeedPrimaryNav({
  onCreateClick,
  createActive = false,
  onShareQr,
}) {
  return (
    <nav
      style={styles.nav}
      data-testid="feed-primary-nav"
      aria-label="Primary"
      className="feed-primary-nav-mobile"
    >
      <div style={styles.side}>
        {FEED_LEFT_TABS.map((tab) => (
          <TabControl key={tab.testId} tab={tab} onShareQr={onShareQr} />
        ))}
      </div>
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
      <div style={styles.side}>
        {FEED_RIGHT_TABS.map((tab) => (
          <TabControl key={tab.testId} tab={tab} onShareQr={onShareQr} />
        ))}
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 0,
    // Above orphaned media overlays and Feed compose sheets (350–360).
    // Intentional camera sheet uses ~13000–15000 and must close on route change.
    zIndex: 400,
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
    flex: 1,
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
