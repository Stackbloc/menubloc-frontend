/**
 * Live Feed mobile right action rail — Connect · Wanna go · Share · Invite · Like · Menu.
 * Desktop Feed keeps the prior Share & Invite + Menu Browser dock (not this rail).
 * Hide (do not gray-out) actions that do not apply.
 */

import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ShareModal from "../../share/ShareModal.jsx";
import ShareIcon from "../../share/ShareIcon.jsx";
import { trackShareEvent } from "../../share/shareUtils.js";
import InviteToEatIcon from "../../icons/InviteToEatIcon.jsx";
import BrowseMenusIcon from "../../icons/BrowseMenusIcon.jsx";
import ThumbsUpIcon from "../../icons/ThumbsUpIcon.jsx";
import { LIKE_ACCENT } from "../../../lib/likeButtonStyles.js";
import useRestaurantFollow from "../../../hooks/useRestaurantFollow.js";
import { useConsumer } from "../../../context/ConsumerContext.jsx";
import { createWantToEat } from "../../../lib/consumerApi.js";

function RailButton({ testId, label, ariaLabel, disabled, onClick, children, pressed }) {
  return (
    <button
      type="button"
      data-testid={testId}
      aria-label={ariaLabel || label}
      aria-pressed={pressed}
      disabled={disabled}
      title={label}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick?.(e);
      }}
      style={{
        ...styles.btn,
        ...(disabled ? styles.btnDisabled : null),
      }}
    >
      <span style={styles.iconCircle}>{children}</span>
      <span style={styles.label}>{label}</span>
    </button>
  );
}

function ConnectGlyph({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" stroke="#fff" strokeWidth="2" />
      <path
        d="M5 19.5c1.2-3.2 3.4-4.8 7-4.8s5.8 1.6 7 4.8"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M18 7v4M16 9h4" stroke="#5eead4" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function WannaGoGlyph({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 21s-6.5-5.2-6.5-10.2A6.5 6.5 0 0 1 12 4.3a6.5 6.5 0 0 1 6.5 6.5C18.5 15.8 12 21 12 21z"
        stroke="#fff"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10.8" r="2.2" stroke="#fff" strokeWidth="2" />
    </svg>
  );
}

/**
 * @param {object} props
 * @param {number} [props.bottomInset]
 * @param {boolean} [props.showConnect]
 * @param {boolean} [props.connectBusy]
 * @param {() => void} [props.onConnect]
 * @param {{ restaurant_id: string|number, restaurant_name?: string } | null} [props.restaurantRef]
 * @param {object | null} [props.shareData]
 * @param {object} [props.shareAnalyticsContext]
 * @param {boolean} [props.showInvite]
 * @param {() => void} [props.onInvite]
 * @param {boolean} [props.showMenu]
 * @param {() => void} [props.onMenu]
 * @param {string} [props.followSource]
 */
export default function FeedVideoActionRail({
  bottomInset = 0,
  showConnect = false,
  connectBusy = false,
  onConnect,
  restaurantRef = null,
  shareData = null,
  shareAnalyticsContext = null,
  showInvite = false,
  onInvite,
  showMenu = false,
  onMenu,
  followSource = "feed_video_rail",
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useConsumer();
  const [shareOpen, setShareOpen] = useState(false);
  const [wannaBusy, setWannaBusy] = useState(false);
  const [wannaDone, setWannaDone] = useState(false);
  const [wannaError, setWannaError] = useState("");

  const restaurantId = restaurantRef?.restaurant_id;
  const restaurantName = String(restaurantRef?.restaurant_name || "").trim();
  const hasRestaurant = restaurantId != null && String(restaurantId).trim() !== "";
  const { followed, statusLoading, actionLoading, toggleFollow } = useRestaurantFollow(
    hasRestaurant ? restaurantId : null,
    { source: followSource, restaurantName }
  );

  useEffect(() => {
    setWannaDone(false);
    setWannaError("");
    setShareOpen(false);
  }, [restaurantId]);

  const showWannaGo = hasRestaurant;
  const showLike = hasRestaurant;
  const showShare = Boolean(shareData?.url);
  const anyVisible =
    showConnect || showWannaGo || showShare || showInvite || showLike || showMenu;
  if (!anyVisible) return null;

  async function onWannaGoClick() {
    setWannaError("");
    if (!hasRestaurant) return;
    if (!isAuthenticated) {
      const next = `${location.pathname}${location.search || ""}`;
      navigate(`/account/login?next=${encodeURIComponent(next)}`);
      return;
    }
    if (wannaBusy || wannaDone) return;
    setWannaBusy(true);
    try {
      const name = restaurantName || "Restaurant";
      await createWantToEat({
        food_name: name,
        restaurant_id: restaurantId,
        intent_kind: "restaurant",
      });
      setWannaDone(true);
    } catch (err) {
      setWannaError(err?.message || "Could not save Wanna go");
    } finally {
      setWannaBusy(false);
    }
  }

  function onShareClick() {
    if (!shareData?.url) return;
    trackShareEvent("menu_share_clicked", shareAnalyticsContext || { surface: "feed_video_rail" });
    setShareOpen(true);
  }

  const inset = Math.max(0, Number(bottomInset) || 0);

  return (
    <>
      <div
        data-testid="feed-video-action-rail"
        style={{
          ...styles.rail,
          bottom: `calc(${inset}px + max(88px, env(safe-area-inset-bottom) + 72px))`,
        }}
      >
        {showConnect ? (
          <RailButton
            testId="feed-rail-connect"
            label="Connect"
            ariaLabel="Connect with person in video"
            disabled={connectBusy}
            onClick={onConnect}
          >
            <ConnectGlyph />
          </RailButton>
        ) : null}

        {showWannaGo ? (
          <RailButton
            testId="feed-rail-wanna-go"
            label={wannaDone ? "Saved" : "Wanna go"}
            ariaLabel="Add restaurant to Wanna go"
            disabled={wannaBusy || wannaDone}
            onClick={onWannaGoClick}
          >
            <WannaGoGlyph />
          </RailButton>
        ) : null}

        {showShare ? (
          <RailButton
            testId="feed-rail-share"
            label="Share"
            ariaLabel="Share video"
            onClick={onShareClick}
          >
            <ShareIcon size={20} stroke="#fff" />
          </RailButton>
        ) : null}

        {showInvite ? (
          <RailButton
            testId="feed-rail-invite"
            label="Invite"
            ariaLabel="Invite to Eat at this restaurant"
            onClick={onInvite}
          >
            <InviteToEatIcon size={20} color="#fff" />
          </RailButton>
        ) : null}

        {showLike ? (
          <RailButton
            testId="feed-rail-like"
            label={followed ? "Liked" : "Like"}
            ariaLabel={followed ? "Unlike restaurant" : "Like restaurant"}
            pressed={followed}
            disabled={statusLoading || actionLoading}
            onClick={toggleFollow}
          >
            <ThumbsUpIcon
              size={20}
              filled={followed}
              color={followed ? LIKE_ACCENT : "#fff"}
            />
          </RailButton>
        ) : null}

        {showMenu ? (
          <RailButton
            testId="feed-rail-menu"
            label="Menu"
            ariaLabel="Menu Browser"
            onClick={onMenu}
          >
            <BrowseMenusIcon size={22} title="" />
          </RailButton>
        ) : null}

        {wannaError ? (
          <p style={styles.railError} data-testid="feed-rail-wanna-go-error">
            {wannaError}
          </p>
        ) : null}
      </div>

      {shareData ? (
        <ShareModal
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          shareData={shareData}
          modalTitle="Share video"
          analyticsContext={shareAnalyticsContext || { surface: "feed_video_rail" }}
        />
      ) : null}
    </>
  );
}

const styles = {
  rail: {
    position: "absolute",
    right: "max(10px, env(safe-area-inset-right))",
    zIndex: 5,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 14,
    pointerEvents: "auto",
  },
  btn: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    border: "none",
    background: "transparent",
    padding: 0,
    cursor: "pointer",
    color: "#fff",
    fontFamily: "inherit",
    WebkitTapHighlightColor: "transparent",
  },
  btnDisabled: {
    opacity: 0.55,
    cursor: "default",
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(0,0,0,0.45)",
    border: "1px solid rgba(255,255,255,0.28)",
    boxShadow: "0 4px 14px rgba(0,0,0,0.35)",
  },
  label: {
    fontSize: 11,
    fontWeight: 700,
    lineHeight: 1.15,
    textShadow: "0 1px 3px rgba(0,0,0,0.75)",
    maxWidth: 64,
    textAlign: "center",
  },
  railError: {
    margin: 0,
    maxWidth: 72,
    fontSize: 10,
    fontWeight: 700,
    color: "#fecaca",
    textAlign: "center",
    textShadow: "0 1px 2px rgba(0,0,0,0.8)",
  },
};
