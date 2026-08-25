/**
 * Fullscreen vertical See Who's Eating reel.
 * Screen name tap → Connection request (notify) when signed in; guests → login.
 * Dish links use CK menu_item_id → /menu-items/:id.
 */

import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { requestConnection } from "../../../lib/consumerApi.js";
import {
  MENUPY_CLOSE_LIVE_FEED_FULLSCREEN,
  stripMediaUrlFragment,
} from "../../../lib/menuplyLiveFeedControl.js";

export default function SeeWhosEatingFullscreen({
  items = [],
  startIndex = 0,
  isAuthenticated = false,
  viewerUserId = null,
  onClose,
}) {
  const navigate = useNavigate();
  const [index, setIndex] = useState(startIndex);
  const [connectBusy, setConnectBusy] = useState(false);
  const [connectNotice, setConnectNotice] = useState("");
  const [connectError, setConnectError] = useState("");
  const videoRef = useRef(null);
  const item = items[index] || null;

  useEffect(() => {
    setIndex(Math.min(Math.max(0, startIndex), Math.max(0, items.length - 1)));
  }, [startIndex, items.length]);

  useEffect(() => {
    setConnectNotice("");
    setConnectError("");
  }, [index, item?.id]);

  useEffect(() => {
    function onForcedClose() {
      onClose?.();
    }
    window.addEventListener(MENUPY_CLOSE_LIVE_FEED_FULLSCREEN, onForcedClose);
    return () => window.removeEventListener(MENUPY_CLOSE_LIVE_FEED_FULLSCREEN, onForcedClose);
  }, [onClose]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return undefined;
    el.currentTime = 0;
    const onReady = () => {
      const p = el.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    };
    if (el.readyState >= 2) onReady();
    else {
      el.addEventListener("loadeddata", onReady);
      el.addEventListener("canplay", onReady);
    }
    return () => {
      el.removeEventListener("loadeddata", onReady);
      el.removeEventListener("canplay", onReady);
    };
  }, [index, item?.id]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose?.();
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        setIndex((i) => Math.min(i + 1, items.length - 1));
      }
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        setIndex((i) => Math.max(i - 1, 0));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [items.length, onClose]);

  async function onScreenNameClick(e) {
    e.preventDefault();
    e.stopPropagation();
    const peerId = item?.diner?.id != null ? Number(item.diner.id) : null;
    if (!peerId) return;

    if (!isAuthenticated) {
      navigate(
        `/account/login?next=${encodeURIComponent("/my-menuply")}`
      );
      return;
    }

    if (viewerUserId != null && Number(viewerUserId) === peerId) {
      setConnectNotice("That's you.");
      return;
    }

    setConnectBusy(true);
    setConnectError("");
    setConnectNotice("");
    try {
      const data = await requestConnection({
        recipient_user_id: peerId,
        source: "see_whos_eating",
        source_ref: item?.id != null ? `what_i_ate:${item.id}` : null,
      });
      const status = data?.connection?.status;
      if (status === "accepted") {
        setConnectNotice("You're now Connects.");
      } else {
        setConnectNotice("Connect request sent — they'll get a notification.");
      }
    } catch (err) {
      const code = err?.payload?.code || err?.code;
      if (code === "already_connected") {
        setConnectNotice("You're already Connects.");
      } else if (code === "already_pending") {
        setConnectNotice("Connect request already pending.");
      } else {
        setConnectError(err?.message || "Unable to send Connect request");
      }
    } finally {
      setConnectBusy(false);
    }
  }

  if (!item) return null;

  const dishHref =
    item.menu_item_href ||
    (item.menu_item_id ? `/menu-items/${item.menu_item_id}` : null);
  const restaurantHref = item.restaurant_slug
    ? `/r/${encodeURIComponent(item.restaurant_slug)}`
    : null;
  const screenName = item.diner?.display_name || "A diner";

  return (
    <div
      style={styles.overlay}
      data-testid="see-whos-eating-fullscreen"
      role="dialog"
      aria-modal="true"
    >
      <button type="button" style={styles.close} onClick={onClose} aria-label="Close">
        ×
      </button>
      <video
        key={item.id}
        ref={videoRef}
        src={stripMediaUrlFragment(item.video_url)}
        style={styles.video}
        playsInline
        muted
        loop
        autoPlay
        controls={false}
        preload="auto"
        onClick={() => {
          setIndex((i) => (i + 1 < items.length ? i + 1 : i));
        }}
      />
      <div style={styles.meta}>
        <button
          type="button"
          style={styles.screenNameBtn}
          data-testid="see-whos-eating-screen-name"
          disabled={connectBusy}
          onClick={onScreenNameClick}
        >
          {screenName}
        </button>
        {connectNotice ? <p style={styles.notice}>{connectNotice}</p> : null}
        {connectError ? <p style={styles.error}>{connectError}</p> : null}
        {item.is_recommend ? <p style={styles.recommend}>Recommend</p> : null}
        {restaurantHref ? (
          <Link
            to={restaurantHref}
            style={styles.link}
            onClick={(e) => e.stopPropagation()}
          >
            {item.restaurant_name || "Restaurant"}
          </Link>
        ) : item.restaurant_name ? (
          <p style={styles.place}>{item.restaurant_name}</p>
        ) : null}
        {dishHref ? (
          <Link to={dishHref} style={styles.dish} onClick={(e) => e.stopPropagation()}>
            {item.item_name || item.food_name || "Dish"}
          </Link>
        ) : (
          <p style={styles.place}>{item.item_name || item.food_name || ""}</p>
        )}
        <p style={styles.hint}>
          {index + 1} / {items.length} · tap video for next · tap name to Connect
        </p>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 10050,
    background: "#000",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  close: {
    position: "absolute",
    top: 12,
    right: 14,
    zIndex: 2,
    width: 40,
    height: 40,
    border: "none",
    borderRadius: 20,
    background: "rgba(0,0,0,0.45)",
    color: "#fff",
    fontSize: 28,
    lineHeight: 1,
    cursor: "pointer",
  },
  video: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    background: "#000",
  },
  meta: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 28,
    color: "#fff",
    textShadow: "0 1px 4px rgba(0,0,0,0.65)",
    pointerEvents: "auto",
  },
  screenNameBtn: {
    display: "inline-block",
    margin: "0 0 4px",
    padding: 0,
    border: "none",
    background: "transparent",
    color: "#fff",
    fontSize: 17,
    fontWeight: 800,
    cursor: "pointer",
    textDecoration: "underline",
    textUnderlineOffset: 3,
  },
  notice: { margin: "0 0 6px", fontSize: 13, color: "#bbf7d0", fontWeight: 600 },
  error: { margin: "0 0 6px", fontSize: 13, color: "#fecaca", fontWeight: 600 },
  recommend: {
    margin: "0 0 6px",
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "#bbf7d0",
  },
  link: {
    display: "block",
    color: "#fff",
    fontWeight: 700,
    marginBottom: 4,
    textDecoration: "underline",
  },
  dish: {
    display: "block",
    color: "#ecfdf5",
    fontWeight: 600,
    marginBottom: 6,
    textDecoration: "underline",
  },
  place: { margin: "0 0 4px", fontSize: 14, fontWeight: 600 },
  hint: { margin: 0, fontSize: 12, opacity: 0.75 },
};
