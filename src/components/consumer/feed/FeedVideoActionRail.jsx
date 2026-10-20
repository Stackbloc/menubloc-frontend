/**
 * Live Feed right action rail — Wish List · Like · Invite · Share, then the clip's
 * "Order this" / "See menu" button (Andre, 2026-10-20 — same four actions as menu rows;
 * the green button is the cluster clip player's and replaces the Menu Browser icon).
 * "+Wish List": linked dish → saves the dish; otherwise saves the restaurant. Both land in
 * the profile Wish List.
 * Like is for dishes; a clip with no linked dish shows the restaurant Fav heart (My Favs).
 * Hide (do not gray-out) actions that do not apply.
 */

import { useState } from "react";
import InviteToEatIcon from "../../icons/InviteToEatIcon.jsx";
import ThumbsUpIcon from "../../icons/ThumbsUpIcon.jsx";
import FavHeartIcon from "../../icons/FavHeartIcon.jsx";
import WishListIcon from "../../icons/WishListIcon.jsx";
import ShareIcon from "../../share/ShareIcon.jsx";
import ShareModal from "../../share/ShareModal.jsx";
import { trackShareEvent } from "../../share/shareUtils.js";
import { FAV_ACCENT, LIKE_ACCENT } from "../../../lib/likeButtonStyles.js";
import useRestaurantFollow from "../../../hooks/useRestaurantFollow.js";
import useMenuItemLike from "../../../hooks/useMenuItemLike.js";
import useWishListEntry from "../../../hooks/useWishListEntry.js";
import { WISH_LIST_ACCENT } from "../../WishListMenuItemButton.jsx";

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

function DishLikeButton({ menuItemId }) {
  const { liked, loading, busy, toggle } = useMenuItemLike(menuItemId);
  return (
    <RailButton
      testId="feed-rail-like"
      label={liked ? "Liked" : "Like"}
      ariaLabel={liked ? "Unlike this dish" : "Like this dish"}
      pressed={liked}
      disabled={loading || busy}
      onClick={toggle}
    >
      <ThumbsUpIcon size={20} filled={liked} color={liked ? LIKE_ACCENT : "#fff"} />
    </RailButton>
  );
}

function RestaurantFavButton({ restaurantId, restaurantName, followSource }) {
  const { followed, statusLoading, actionLoading, toggleFollow } = useRestaurantFollow(restaurantId, {
    source: followSource,
    restaurantName,
  });
  return (
    <RailButton
      testId="feed-rail-fav"
      label={followed ? "My Fav" : "Fav"}
      ariaLabel={followed ? "Remove restaurant from My Favs" : "Add restaurant to My Favs"}
      pressed={followed}
      disabled={statusLoading || actionLoading}
      onClick={toggleFollow}
    >
      <FavHeartIcon size={20} filled={followed} color={followed ? FAV_ACCENT : "#fff"} />
    </RailButton>
  );
}

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
 * @param {() => void} [props.onMenu] opens the Menu Browser (dish highlighted when linked)
 * @param {object|null} [props.shareData] clip share payload; Share hides without it
 * @param {object} [props.shareAnalyticsContext]
 * @param {(open: boolean) => void} [props.onShareOpenChange] lets the parent pause the clip
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
  shareData = null,
  shareAnalyticsContext = null,
  onShareOpenChange,
  followSource = "feed_video_rail",
  /** Optional control above the buttons (Feed play/pause circle) — thumb-reachable. */
  topSlot = null,
}) {
  const [shareOpen, setShareOpen] = useState(false);

  const restaurantId = restaurantRef?.restaurant_id;
  const restaurantName = String(restaurantRef?.restaurant_name || "").trim();
  const hasRestaurant = restaurantId != null && String(restaurantId).trim() !== "";
  const linkedMenuItemId =
    menuItemId != null && String(menuItemId).trim() !== "" ? menuItemId : null;
  const isDishVideo = linkedMenuItemId != null;
  const dishName = String(menuItemName || "").trim();
  const wish = useWishListEntry({
    menuItemId: linkedMenuItemId,
    menuItemName: dishName,
    restaurantId: hasRestaurant ? restaurantId : null,
    restaurantName,
  });

  const showWannaGo = hasRestaurant;
  const showLike = hasRestaurant;
  const showShare = Boolean(shareData);
  const anyVisible = showConnect || showWannaGo || showInvite || showLike || showShare || showMenu;
  if (!anyVisible) return null;

  function setShare(open) {
    setShareOpen(open);
    onShareOpenChange?.(open);
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
        {topSlot}
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
            label={wish.added ? "Added" : WISH_LIST_LABEL}
            ariaLabel={
              wish.added
                ? `Remove ${isDishVideo ? dishName || "this dish" : restaurantName || "restaurant"} from Wish List`
                : isDishVideo
                  ? `Add ${dishName || "this dish"} to Wish List`
                  : `Add ${restaurantName || "restaurant"} to Wish List`
            }
            pressed={wish.added}
            disabled={wish.busy}
            onClick={wish.toggle}
          >
            <WishListIcon size={22} filled={wish.added} color={wish.added ? WISH_LIST_ACCENT : "#fff"} />
          </RailButton>
        ) : null}

        {showLike && isDishVideo ? <DishLikeButton menuItemId={linkedMenuItemId} /> : null}
        {showLike && !isDishVideo ? (
          <RestaurantFavButton
            restaurantId={restaurantId}
            restaurantName={restaurantName}
            followSource={followSource}
          />
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

        {showShare ? (
          <RailButton
            testId="feed-rail-share"
            label="Share"
            ariaLabel="Share this clip"
            onClick={() => {
              trackShareEvent("menu_share_clicked", shareAnalyticsContext);
              setShare(true);
            }}
          >
            <ShareIcon size={20} stroke="#fff" />
          </RailButton>
        ) : null}

        {showMenu ? (
          <button
            type="button"
            data-testid="feed-rail-menu"
            style={styles.orderBtn}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onMenu?.(e);
            }}
          >
            {isDishVideo ? "Order this" : "See menu"}
          </button>
        ) : null}

        {wish.error ? (
          <p style={styles.railError} data-testid="feed-rail-wanna-go-error">
            {wish.error}
          </p>
        ) : null}
      </div>
      {showShare ? (
        <ShareModal
          open={shareOpen}
          onClose={() => setShare(false)}
          shareData={shareData}
          analyticsContext={shareAnalyticsContext}
          modalTitle="Share clip"
          variant="menu"
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
  /** Same green pill as the cluster clip player's "Order this" / "See menu". */
  orderBtn: {
    marginTop: 2,
    height: 32,
    padding: "0 12px",
    borderRadius: 999,
    border: "none",
    background: "#16a34a",
    color: "#fff",
    fontSize: 13,
    fontWeight: 800,
    whiteSpace: "nowrap",
    cursor: "pointer",
    fontFamily: "inherit",
    boxShadow: "0 4px 14px rgba(0,0,0,0.35)",
    WebkitTapHighlightColor: "transparent",
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
