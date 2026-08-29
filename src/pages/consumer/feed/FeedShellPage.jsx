/**
 * Feed shell layout — Home · Connects · Menus | [X] | Deals · Search · Profile.
 * Mobile: bottom nav + top More header. Desktop: left rail + More panel.
 */

import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import FeedPrimaryNav, { FEED_PRIMARY_NAV_HEIGHT } from "../../../components/consumer/feed/FeedPrimaryNav.jsx";
import FeedDesktopRail, { FEED_DESKTOP_RAIL_WIDTH } from "../../../components/consumer/feed/FeedDesktopRail.jsx";
import FeedMobileHeader from "../../../components/consumer/feed/FeedMobileHeader.jsx";
import FeedMorePanel from "../../../components/consumer/feed/FeedMorePanel.jsx";
import FeedVideoCreateSheet from "../../../components/consumer/feed/FeedVideoCreateSheet.jsx";
import FeedVideoComposeOverlay from "../../../components/consumer/feed/FeedVideoComposeOverlay.jsx";
import { useConsumer } from "../../../context/ConsumerContext.jsx";
import { useFeedShellDesktop } from "../../../lib/useFeedShellDesktop.js";

export { FEED_PRIMARY_NAV_HEIGHT };

export default function FeedShellPage({ children = null }) {
  const navigate = useNavigate();
  const { isAuthenticated } = useConsumer();
  const isDesktop = useFeedShellDesktop();
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const [composeCategory, setComposeCategory] = useState("");
  const [moreOpen, setMoreOpen] = useState(false);

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
    if (!isAuthenticated) {
      navigate(`/account/login?next=${encodeURIComponent("/feed")}`);
      return;
    }
    setComposeCategory(category);
  }

  function closeCompose() {
    setComposeCategory("");
  }

  function handleShareMyMenuply(item) {
    if (!isAuthenticated) {
      const guestPath = decodeURIComponent(String(item?.guestTo || "/account/signup?next=%2Ffeed"));
      navigate(guestPath.startsWith("/") ? guestPath : `/${guestPath}`);
      return;
    }
    navigate(`/account/diner-qr?next=${encodeURIComponent("/feed")}`);
  }

  const createActive = createSheetOpen || Boolean(composeCategory);

  return (
    <div style={styles.shell} data-testid="feed-shell">
      {isDesktop ? (
        <FeedDesktopRail
          onCreateClick={openCreateSheet}
          createActive={createActive}
          onMoreClick={() => setMoreOpen(true)}
          isAuthenticated={isAuthenticated}
        />
      ) : (
        <FeedMobileHeader
          onMoreClick={() => setMoreOpen(true)}
          isAuthenticated={isAuthenticated}
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
        onShareMyMenuply={handleShareMyMenuply}
        isAuthenticated={isAuthenticated}
      />
      <FeedVideoComposeOverlay
        open={Boolean(composeCategory)}
        category={composeCategory}
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
