/**
 * Feed shell layout — Home · Connects · Menu Browser | [X] | Deals · Search · Profile.
 * Menu Browser opens Feed PiP (same as yellow video icon).
 * Mobile: bottom nav + top More header. Desktop: left rail + More panel.
 */

import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
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

export { FEED_PRIMARY_NAV_HEIGHT };

export default function FeedShellPage({ children = null }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useConsumer();
  const isDesktop = useFeedShellDesktop();
  const showShopBasket = isFeedShopRoute(location.pathname);
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const [composeCategory, setComposeCategory] = useState("");
  const [composeMediaSource, setComposeMediaSource] = useState("camera");
  const [composeOpenLibrary, setComposeOpenLibrary] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [shareMenuplyOpen, setShareMenuplyOpen] = useState(false);

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

  function openCreateSheet() {
    setCreateSheetOpen(true);
  }

  function closeCreateSheet() {
    setCreateSheetOpen(false);
  }

  function handlePickCategory(category) {
    closeCreateSheet();
    if (String(category) === "cooking" && !isAuthenticated) {
      navigate(`/account/login?next=${encodeURIComponent("/feed")}`);
      return;
    }
    setComposeMediaSource("camera");
    setComposeOpenLibrary(false);
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
  }

  function handleShareMyMenuply(options = {}) {
    if (!isAuthenticated) {
      const guestPath = decodeURIComponent(String(options?.guestTo || "/account/signup?next=%2Ffeed"));
      navigate(guestPath.startsWith("/") ? guestPath : `/${guestPath}`);
      return;
    }
    setShareMenuplyOpen(true);
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
        />
      )}

      <div
        style={{
          ...styles.body,
          marginLeft: isDesktop ? FEED_DESKTOP_RAIL_WIDTH : 0,
        }}
      >
        {children != null ? children : <Outlet />}
      </div>

      {!isDesktop ? (
        <FeedPrimaryNav onCreateClick={openCreateSheet} createActive={createActive} />
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
  },
  body: {
    minHeight: "100dvh",
    transition: "margin-left 0.15s ease",
  },
};
