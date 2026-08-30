/**
 * Feed shell layout — Home · Connects · Menus | [X] | Deals · Search · Profile.
 * Mobile: bottom nav + top More header. Desktop: left rail + More panel.
 */

import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import ShareModal from "../../../components/share/ShareModal.jsx";
import { getMyDinerQr } from "../../../lib/consumerApi.js";
import { buildDinerQrShareData } from "../../../lib/dinerQrShare.js";
import { isFeedShopRoute } from "../../../lib/feedShellNavigation.js";
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
  const location = useLocation();
  const { isAuthenticated } = useConsumer();
  const isDesktop = useFeedShellDesktop();
  const showShopBasket = isFeedShopRoute(location.pathname);
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const [composeCategory, setComposeCategory] = useState("");
  const [composeMediaSource, setComposeMediaSource] = useState("camera");
  const [composeOpenLibrary, setComposeOpenLibrary] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [profileShareOpen, setProfileShareOpen] = useState(false);
  const [profileShareData, setProfileShareData] = useState(null);
  const [profileShareError, setProfileShareError] = useState("");

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

  async function handleShareMyMenuply(item) {
    if (!isAuthenticated) {
      const guestPath = decodeURIComponent(String(item?.guestTo || "/account/signup?next=%2Ffeed"));
      navigate(guestPath.startsWith("/") ? guestPath : `/${guestPath}`);
      return;
    }
    setProfileShareError("");
    try {
      const data = await getMyDinerQr();
      const shareData = buildDinerQrShareData({
        scan_url: data?.qr?.scan_url,
        token: data?.qr?.token,
        display_name: data?.card?.display_name,
      });
      if (!shareData?.url) throw new Error("Unable to create profile share link");
      setProfileShareData(shareData);
      setProfileShareOpen(true);
    } catch (err) {
      setProfileShareError(err?.message || "Unable to share profile");
      navigate(`/account/diner-qr?next=${encodeURIComponent("/feed")}`);
    }
  }

  const createActive = createSheetOpen || Boolean(composeCategory);

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
        isAuthenticated={isAuthenticated}
      />
      <FeedVideoComposeOverlay
        open={Boolean(composeCategory)}
        category={composeCategory}
        mediaSource={composeMediaSource}
        openLibraryOnMount={composeOpenLibrary}
        onClose={closeCompose}
      />
      {profileShareData ? (
        <ShareModal
          open={profileShareOpen}
          onClose={() => setProfileShareOpen(false)}
          modalTitle="Share My Menuply"
          shareData={profileShareData}
          analyticsContext={{ surface: "feed_shell_profile_share" }}
        />
      ) : null}
      {profileShareError ? (
        <p style={styles.shareError} role="status" data-testid="feed-profile-share-error">
          {profileShareError}
        </p>
      ) : null}
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
  shareError: {
    position: "fixed",
    left: 16,
    right: 16,
    bottom: 96,
    zIndex: 80,
    margin: 0,
    padding: "10px 12px",
    borderRadius: 10,
    background: "rgba(127,29,29,0.92)",
    color: "#fecaca",
    fontSize: 13,
    fontWeight: 700,
    textAlign: "center",
  },
};
