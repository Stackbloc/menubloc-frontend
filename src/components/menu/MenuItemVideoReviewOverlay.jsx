/**
 * Menu-item video review — reuses EatingCompose + postFeedReviewVideo.
 * Restaurant and CK menu item are inherited; the user is not asked to retag.
 * Does not modify the video upload pipeline.
 */
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useConsumer } from "../../context/ConsumerContext.jsx";
import { notifyFeedVideoPosted, postFeedReviewVideo } from "../../lib/feedVideoCompose.js";
import EatingComposeSheet from "../../pages/consumer/myMenuply/EatingComposeSheet.jsx";

export default function MenuItemVideoReviewOverlay({
  open,
  restaurantId = null,
  restaurantName = "",
  menuItemId = null,
  menuItemName = "",
  onClose,
}) {
  const { isAuthenticated } = useConsumer();
  const navigate = useNavigate();
  const location = useLocation();
  const [busy, setBusy] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || isAuthenticated) return undefined;
    const next = `${location.pathname}${location.search || ""}`;
    navigate(`/account/login?redirect=${encodeURIComponent(next || "/")}`);
    onClose?.();
    return undefined;
  }, [open, isAuthenticated, location.pathname, location.search, navigate, onClose]);

  if (!open || !isAuthenticated) return null;

  const restaurant = restaurantId
    ? {
        restaurant_id: restaurantId,
        restaurant_name: restaurantName || "Restaurant",
      }
    : null;
  const dish = menuItemId
    ? {
        menu_item_id: menuItemId,
        item_name: menuItemName || "Menu item",
        restaurant_id: restaurantId || null,
        restaurant_name: restaurantName || null,
      }
    : null;

  function onUploadProgress(p) {
    const pct = Number(p?.percent);
    if (Number.isFinite(pct)) setUploadPercent(Math.max(0, Math.min(100, Math.round(pct))));
  }

  async function handleSubmit(payload) {
    setBusy(true);
    setUploadPercent(0);
    setError("");
    try {
      await postFeedReviewVideo({
        ...payload,
        restaurant: payload.restaurant || restaurant,
        dish: payload.dish || dish,
        onUploadProgress,
      });
      notifyFeedVideoPosted();
      onClose?.();
    } catch (err) {
      setError(err?.message || "Unable to post video review");
      throw err;
    } finally {
      setBusy(false);
      setUploadPercent(null);
    }
  }

  return (
    <>
      <EatingComposeSheet
        open={open}
        onClose={() => {
          if (!busy) onClose?.();
        }}
        defaultCategory="reviews"
        feedMode
        identityLocked
        initialRestaurant={restaurant}
        initialDish={dish}
        busy={busy}
        uploadPercent={uploadPercent}
        onSubmit={handleSubmit}
      />
      {error ? (
        <p role="alert" data-testid="menu-item-video-review-error" style={styles.error}>
          {error}
        </p>
      ) : null}
    </>
  );
}

const styles = {
  error: {
    position: "fixed",
    left: 16,
    right: 16,
    bottom: "calc(var(--feed-primary-nav-h, 72px) + 16px)",
    zIndex: 1500,
    margin: 0,
    padding: "10px 12px",
    borderRadius: 10,
    background: "rgba(127,29,29,0.92)",
    color: "#fff",
    fontSize: 13,
    fontWeight: 600,
    textAlign: "center",
  },
};
