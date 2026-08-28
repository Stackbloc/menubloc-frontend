/**
 * Feed shell layout — Home · Connects · Menus | [X] | Deals · Search · Profile.
 */

import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import FeedPrimaryNav, { FEED_PRIMARY_NAV_HEIGHT } from "../../../components/consumer/feed/FeedPrimaryNav.jsx";
import FeedVideoCreateSheet from "../../../components/consumer/feed/FeedVideoCreateSheet.jsx";
import FeedVideoComposeOverlay from "../../../components/consumer/feed/FeedVideoComposeOverlay.jsx";
import { useConsumer } from "../../../context/ConsumerContext.jsx";

export { FEED_PRIMARY_NAV_HEIGHT };

export default function FeedShellPage({ children = null }) {
  const navigate = useNavigate();
  const { isAuthenticated } = useConsumer();
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const [composeCategory, setComposeCategory] = useState("");

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--feed-primary-nav-h",
      `${FEED_PRIMARY_NAV_HEIGHT}px`
    );
    return () => {
      document.documentElement.style.removeProperty("--feed-primary-nav-h");
    };
  }, []);

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
      <div style={styles.body}>{children != null ? children : <Outlet />}</div>
      <FeedPrimaryNav onCreateClick={openCreateSheet} createActive={createActive} />
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
  },
};
