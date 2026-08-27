/**
 * Feed shell layout — FEED | EATING | [X] | EVENTS | ME.
 * Parallel consumer entry; does not replace `/` until VITE_FEED_AS_HOME cutover.
 */

import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import FeedPrimaryNav, { FEED_PRIMARY_NAV_HEIGHT } from "../../../components/consumer/feed/FeedPrimaryNav.jsx";
import FeedVideoCreateSheet from "../../../components/consumer/feed/FeedVideoCreateSheet.jsx";
import FeedVideoComposeOverlay from "../../../components/consumer/feed/FeedVideoComposeOverlay.jsx";
import ShareModal from "../../../components/share/ShareModal.jsx";
import { useConsumer } from "../../../context/ConsumerContext.jsx";
import { getMyDinerQr } from "../../../lib/consumerApi.js";
import { buildDinerQrShareData } from "../../../lib/dinerQrShare.js";

export { FEED_PRIMARY_NAV_HEIGHT };

export default function FeedShellPage({ children = null }) {
  const navigate = useNavigate();
  const { isAuthenticated } = useConsumer();
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const [composeCategory, setComposeCategory] = useState("");
  const [shareOpen, setShareOpen] = useState(false);
  const [shareData, setShareData] = useState(null);
  const [shareError, setShareError] = useState("");

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
    setShareError("");
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

  function handleSheetNavigate(item) {
    const raw = String(item?.to || item?.guestTo || "/feed").trim();
    const path = raw.startsWith("/") ? raw : `/${raw}`;
    if (!item?.guestOk && !isAuthenticated) {
      navigate(`/account/login?next=${encodeURIComponent(path)}`);
      return;
    }
    navigate(path);
  }

  async function handleShareMyMenuply(item) {
    setShareError("");
    if (!isAuthenticated) {
      const guestPath = decodeURIComponent(String(item?.guestTo || "/account/signup?next=%2Ffeed"));
      navigate(guestPath.startsWith("/") ? guestPath : `/${guestPath}`);
      return;
    }
    try {
      const data = await getMyDinerQr();
      const payload = buildDinerQrShareData({
        scan_url: data?.qr?.scan_url,
        token: data?.qr?.token,
        display_name: data?.card?.display_name,
      });
      if (!payload) {
        setShareError("Share link is unavailable right now.");
        return;
      }
      setShareData(payload);
      setShareOpen(true);
    } catch (err) {
      setShareError(err.message || "Unable to load your Menuply share link.");
    }
  }

  const createActive = createSheetOpen || Boolean(composeCategory);

  return (
    <div style={styles.shell} data-testid="feed-shell">
      <div style={styles.body}>{children != null ? children : <Outlet />}</div>
      {shareError ? (
        <div style={styles.shareError} role="status">
          {shareError}
        </div>
      ) : null}
      <FeedPrimaryNav onCreateClick={openCreateSheet} createActive={createActive} />
      <FeedVideoCreateSheet
        open={createSheetOpen}
        onClose={closeCreateSheet}
        onPickCategory={handlePickCategory}
        onNavigate={handleSheetNavigate}
        onShareMyMenuply={handleShareMyMenuply}
        isAuthenticated={isAuthenticated}
      />
      <FeedVideoComposeOverlay
        open={Boolean(composeCategory)}
        category={composeCategory}
        onClose={closeCompose}
      />
      {shareData ? (
        <ShareModal
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          shareData={shareData}
          variant="menu"
          modalTitle="Share My Menuply"
        />
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
  },
  shareError: {
    position: "fixed",
    left: 12,
    right: 12,
    bottom: "calc(var(--feed-primary-nav-h, 72px) + env(safe-area-inset-bottom, 0px) + 8px)",
    zIndex: 60,
    padding: "10px 12px",
    borderRadius: 10,
    background: "rgba(127, 29, 29, 0.92)",
    color: "#fecaca",
    fontSize: 13,
    textAlign: "center",
  },
};
