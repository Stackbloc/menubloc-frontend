/**
 * Feed shell layout — Home · Waiter · Share My QR | [X] | Deals · Search · Profile.
 * Share My QR opens diner QR sheet. Menu Browser is on the video rail/dock.
 * Mobile: bottom nav + top More header. Desktop: left rail + More panel.
 */

import { useEffect, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { isFeedShopRoute } from "../../../lib/feedShellNavigation.js";
import FeedPrimaryNav, { FEED_PRIMARY_NAV_HEIGHT } from "../../../components/consumer/feed/FeedPrimaryNav.jsx";
import FeedDesktopRail, { FEED_DESKTOP_RAIL_WIDTH } from "../../../components/consumer/feed/FeedDesktopRail.jsx";
import FeedMobileHeader from "../../../components/consumer/feed/FeedMobileHeader.jsx";
import FeedMorePanel from "../../../components/consumer/feed/FeedMorePanel.jsx";
import FeedVideoCreateSheet from "../../../components/consumer/feed/FeedVideoCreateSheet.jsx";
import FeedShareMyMenuplySheet from "../../../components/consumer/feed/FeedShareMyMenuplySheet.jsx";
import FeedVideoComposeOverlay from "../../../components/consumer/feed/FeedVideoComposeOverlay.jsx";
import { useConsumer } from "../../../context/ConsumerContext.jsx";
import { useFeedShellDesktop } from "../../../lib/useFeedShellDesktop.js";
import { clearStuckMediaChrome, CLEAR_STUCK_MEDIA_CHROME_EVENT } from "../myMenuply/pendingHighlightMedia.js";
import {
  buildProfileViewSearchParams,
  readConnectViewFromWindow,
} from "./profileViewMode.js";

export { FEED_PRIMARY_NAV_HEIGHT };

function isOwnFeedProfilePath(pathname) {
  return /^\/feed\/profile\/?$/.test(String(pathname || ""));
}

export default function FeedShellPage({ children = null }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [, setSearchParams] = useSearchParams();
  const { isAuthenticated } = useConsumer();
  const isDesktop = useFeedShellDesktop();
  const showShopBasket = isFeedShopRoute(location.pathname);
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const [composeCategory, setComposeCategory] = useState("");
  const [composeMediaSource, setComposeMediaSource] = useState("camera");
  const [composeOpenLibrary, setComposeOpenLibrary] = useState(false);
  const [composeInitialWhere, setComposeInitialWhere] = useState(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [shareMenuplyOpen, setShareMenuplyOpen] = useState(false);
  /** Prevent CLEAR_STUCK listener from immediately undoing openCreate / open QR. */
  const openingShellOverlayRef = useRef(null);

  // Shell-owned UI state — do not trust location.search alone (can lag the address bar).
  const [previewAsConnect, setPreviewAsConnect] = useState(() => readConnectViewFromWindow());
  const previewAsConnectRef = useRef(previewAsConnect);
  previewAsConnectRef.current = previewAsConnect;
  const showProfileViewToggle = isAuthenticated && isOwnFeedProfilePath(location.pathname);

  function closeShellOverlays(except = null) {
    if (except !== "create") setCreateSheetOpen(false);
    setComposeCategory("");
    setComposeMediaSource("camera");
    setComposeOpenLibrary(false);
    setComposeInitialWhere(null);
    setMoreOpen(false);
    if (except !== "share") setShareMenuplyOpen(false);
  }

  // Browser back/forward only — never re-derive from stale React Router search after toggle.
  useEffect(() => {
    function onPopState() {
      const next = readConnectViewFromWindow();
      previewAsConnectRef.current = next;
      setPreviewAsConnect(next);
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  function toggleProfileView() {
    clearStuckMediaChrome();
    const next = !previewAsConnectRef.current;
    previewAsConnectRef.current = next;
    setPreviewAsConnect(next);
    setSearchParams(buildProfileViewSearchParams(next), { replace: true });
  }

  const profileViewOutlet = {
    previewAsConnect,
    toggleProfileView,
  };

  // Always clear orphaned camera/compose leftovers when entering a feed route.
  useEffect(() => {
    clearStuckMediaChrome();
  }, [location.pathname]);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--feed-primary-nav-h",
      `${isDesktop ? 0 : FEED_PRIMARY_NAV_HEIGHT}px`
    );
    document.documentElement.style.setProperty(
      "--feed-desktop-rail-w",
      `${isDesktop ? FEED_DESKTOP_RAIL_WIDTH : 0}px`
    );
    return () => {
      document.documentElement.style.removeProperty("--feed-primary-nav-h");
      document.documentElement.style.removeProperty("--feed-desktop-rail-w");
    };
  }, [isDesktop]);

  // Close Multiplier / compose / More / QR on route change.
  useEffect(() => {
    closeShellOverlays();
  }, [location.pathname]);

  // Same-route nav taps (e.g. Profile while Multiplier open) do not change pathname —
  // still close Multiplier/compose when clearStuckMediaChrome fires from the nav.
  useEffect(() => {
    function onClearStuck() {
      closeShellOverlays(openingShellOverlayRef.current);
    }
    window.addEventListener(CLEAR_STUCK_MEDIA_CHROME_EVENT, onClearStuck);
    return () => window.removeEventListener(CLEAR_STUCK_MEDIA_CHROME_EVENT, onClearStuck);
  }, []);

  function openCreateSheet() {
    openingShellOverlayRef.current = "create";
    clearStuckMediaChrome();
    setCreateSheetOpen(true);
    openingShellOverlayRef.current = null;
  }

  function closeCreateSheet() {
    setCreateSheetOpen(false);
  }

  function handlePickCategory(category, options = {}) {
    closeCreateSheet();
    if (String(category) === "cooking" && !isAuthenticated) {
      navigate(`/account/login?next=${encodeURIComponent("/feed")}`);
      return;
    }
    setComposeMediaSource("camera");
    setComposeOpenLibrary(false);
    setComposeInitialWhere(options?.initialWhereType || null);
    setComposeCategory(category);
  }

  function handlePickUploadCategory(category, options = {}) {
    closeCreateSheet();
    if (!category) {
      const guestPath = decodeURIComponent(String(options?.guestTo || "/account/signup?next=%2Ffeed"));
      navigate(guestPath.startsWith("/") ? guestPath : `/${guestPath}`);
      return;
    }
    if (!isAuthenticated) {
      navigate(`/account/login?next=${encodeURIComponent("/feed")}`);
      return;
    }
    setComposeMediaSource("library");
    setComposeOpenLibrary(true);
    setComposeInitialWhere(options?.initialWhereType || null);
    setComposeCategory(category);
  }

  function handlePickQuickInvite(seedCode, options = {}) {
    closeCreateSheet();
    if (!seedCode) {
      const guestPath = decodeURIComponent(String(options?.guestTo || "/account/login?next=%2Ffeed"));
      navigate(guestPath.startsWith("/") ? guestPath : `/${guestPath}`);
      return;
    }
    if (!isAuthenticated) {
      navigate(`/account/login?next=${encodeURIComponent("/feed")}`);
      return;
    }
    const params = new URLSearchParams({ seed_code: String(seedCode), quick_invite: "1" });
    navigate(`/account/invite-to-eat?${params.toString()}`);
  }

  function closeCompose() {
    setComposeCategory("");
    setComposeMediaSource("camera");
    setComposeOpenLibrary(false);
    setComposeInitialWhere(null);
  }

  function handleShareMyMenuply(options = {}) {
    if (!isAuthenticated) {
      const guestPath = decodeURIComponent(String(options?.guestTo || "/account/signup?next=%2Ffeed"));
      navigate(guestPath.startsWith("/") ? guestPath : `/${guestPath}`);
      return;
    }
    openingShellOverlayRef.current = "share";
    clearStuckMediaChrome();
    setShareMenuplyOpen(true);
    openingShellOverlayRef.current = null;
  }

  const createActive = createSheetOpen || Boolean(composeCategory) || shareMenuplyOpen;

  return (
    <div style={styles.shell} data-testid="feed-shell">
      {isDesktop ? (
        <FeedDesktopRail
          onCreateClick={openCreateSheet}
          createActive={createActive}
          onMoreClick={() => setMoreOpen(true)}
          onShareMyMenuply={() =>
            handleShareMyMenuply({
              guestTo: "/account/signup?next=%2Ffeed",
            })
          }
          isAuthenticated={isAuthenticated}
          showShopBasket={showShopBasket}
        />
      ) : (
        <FeedMobileHeader
          onMoreClick={() => setMoreOpen(true)}
          isAuthenticated={isAuthenticated}
          showShopBasket={showShopBasket}
          profileViewToggle={
            showProfileViewToggle
              ? { previewAsConnect, onToggle: toggleProfileView }
              : null
          }
        />
      )}

      <div
        style={{
          ...styles.body,
          marginLeft: isDesktop ? FEED_DESKTOP_RAIL_WIDTH : 0,
        }}
      >
        {children != null ? children : <Outlet context={profileViewOutlet} />}
      </div>

      {!isDesktop ? (
        <FeedPrimaryNav
          onCreateClick={openCreateSheet}
          createActive={createActive}
          onShareQr={() =>
            handleShareMyMenuply({
              guestTo: "/account/signup?next=%2Ffeed",
            })
          }
        />
      ) : null}

      <FeedMorePanel
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        isAuthenticated={isAuthenticated}
        isDesktop={isDesktop}
      />

      <FeedVideoCreateSheet
        open={createSheetOpen}
        onClose={closeCreateSheet}
        onPickCategory={handlePickCategory}
        onPickUploadCategory={handlePickUploadCategory}
        onPickQuickInvite={handlePickQuickInvite}
        onShareMyMenuply={handleShareMyMenuply}
        isAuthenticated={isAuthenticated}
      />
      <FeedShareMyMenuplySheet open={shareMenuplyOpen} onClose={() => setShareMenuplyOpen(false)} />
      <FeedVideoComposeOverlay
        open={Boolean(composeCategory)}
        category={composeCategory}
        mediaSource={composeMediaSource}
        openLibraryOnMount={composeOpenLibrary}
        initialWhereType={composeInitialWhere}
        onClose={closeCompose}
      />
    </div>
  );
}

const styles = {
  shell: {
    minHeight: "100dvh",
    background: "#050705",
    color: "#fff",
    position: "relative",
  },
  body: {
    minHeight: "100dvh",
    position: "relative",
    transition: "margin-left 0.15s ease",
  },
};
