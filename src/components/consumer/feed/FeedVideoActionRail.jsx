/**
 * Live Feed mobile right action rail — Connect · +Wish List · Invite · Like · Menu Browser.
 * "+Wish List" on every video: linked to a specific menu item → saves the dish; otherwise
 * saves the restaurant. Both land in the profile Wish List.
 * Share lives inside the Invite flow (shareData is forwarded there by the parent).
 * Desktop Feed keeps the prior Share & Invite + Menu Browser dock (not this rail).
 * Hide (do not gray-out) actions that do not apply.
 */

import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import InviteToEatIcon from "../../icons/InviteToEatIcon.jsx";
import BrowseMenusIcon from "../../icons/BrowseMenusIcon.jsx";
import ThumbsUpIcon from "../../icons/ThumbsUpIcon.jsx";
import { LIKE_ACCENT } from "../../../lib/likeButtonStyles.js";
import useRestaurantFollow from "../../../hooks/useRestaurantFollow.js";
import { useConsumer } from "../../../context/ConsumerContext.jsx";
import { createWantToEat } from "../../../lib/consumerApi.js";
import WannaGoPlateIcon from "../../icons/WannaGoPlateIcon.jsx";

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

/** One label for every video; short enough to stay on one line in the rail. */
const WISH_LIST_LABEL = "+Wish List";

/**
 * @param {object} props
 * @param {number} [props.bottomInset]
 * @param {boolean} [props.showConnect]
 * @param {boolean} [props.connectBusy]
 * @param {() => void} [props.onConnect]
 * @param {{ restaurant_id: string|number, restaurant_name?: string } | null} [props.restaurantRef]
 * @param {string|number|null} [props.menuItemId] video's linked menu item (saves the dish to Wish List)
 * @param {string|null} [props.menuItemName]
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
  menuItemId = null,
  menuItemName = null,
  showInvite = false,
  onInvite,
  showMenu = false,
  onMenu,
  followSource = "feed_video_rail",
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useConsumer();
  const [wannaBusy, setWannaBusy] = useState(false);
  const [wannaDone, setWannaDone] = useState(false);
  const [wannaError, setWannaError] = useState("");

  const restaurantId = restaurantRef?.restaurant_id;
  const restaurantName = String(restaurantRef?.restaurant_name || "").trim();
  const hasRestaurant = restaurantId != null && String(restaurantId).trim() !== "";
  const linkedMenuItemId =
    menuItemId != null && String(menuItemId).trim() !== "" ? menuItemId : null;
  const isDishVideo = linkedMenuItemId != null;
  const dishName = String(menuItemName || "").trim();
  const { followed, statusLoading, actionLoading, toggleFollow } = useRestaurantFollow(
    hasRestaurant ? restaurantId : null,
    { source: followSource, restaurantName }
  );

  useEffect(() => {
    setWannaDone(false);
    setWannaError("");
  }, [restaurantId, linkedMenuItemId]);

  const showWannaGo = hasRestaurant;
  const showLike = hasRestaurant;
  const anyVisible = showConnect || showWannaGo || showInvite || showLike || showMenu;
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
      if (isDishVideo) {
        const foodName = dishName || restaurantName || "Dish";
        try {
          await createWantToEat({
            food_name: foodName,
            restaurant_id: restaurantId,
            menu_item_id: linkedMenuItemId,
            intent_kind: "menu_item",
          });
        } catch (err) {
          // Stale link on the video: still save the dish by name at this restaurant.
          if (err?.payload?.code !== "menu_item_not_found") throw err;
          await createWantToEat({
            food_name: foodName,
            restaurant_id: restaurantId,
            intent_kind: "food_item",
          });
        }
      } else {
        await createWantToEat({
          food_name: restaurantName || "Restaurant",
          restaurant_id: restaurantId,
          intent_kind: "restaurant",
        });
      }
      setWannaDone(true);
    } catch (err) {
      setWannaError(err?.message || "Could not add to Wish List");
    } finally {
      setWannaBusy(false);
    }
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
            label={wannaDone ? "Added" : WISH_LIST_LABEL}
            ariaLabel={
              isDishVideo
                ? `Add ${dishName || "this dish"} to Wish List`
                : `Add ${restaurantName || "restaurant"} to Wish List`
            }
            disabled={wannaBusy || wannaDone}
            onClick={onWannaGoClick}
          >
            <WannaGoPlateIcon size={22} color="#fff" />
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
            label="Menu Browser"
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
