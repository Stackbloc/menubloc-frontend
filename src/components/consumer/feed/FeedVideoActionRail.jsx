/**
 * Live Feed right action rail — Wish List · Fav · Invite · Share · Menu Browser, as in the app
 * (menuply-mobile FeedClip; app wins, Andre 2026-10-29): Menu Browser is a round button with a
 * yellow ring and the menu icon, labeled like the others (it replaced the green "Order this" pill).
 * "+Wish List": linked dish → saves the dish; otherwise saves the restaurant. Both land in
 * the profile Wish List.
 * Like is for dishes; a clip with no linked dish shows the restaurant Fav heart (My Favs).
 * Hide (do not gray-out) actions that do not apply.
 */

import { useState } from "react";
import InviteToEatIcon from "../../icons/InviteToEatIcon.jsx";
import FavHeartIcon from "../../icons/FavHeartIcon.jsx";
import WishListIcon from "../../icons/WishListIcon.jsx";
import ShareIcon from "../../share/ShareIcon.jsx";
import AppIcon from "../../icons/AppIcon.jsx";
import ShareModal from "../../share/ShareModal.jsx";
import { trackShareEvent } from "../../share/shareUtils.js";
import { FAV_ACCENT } from "../../../lib/likeButtonStyles.js";
import useRestaurantFollow from "../../../hooks/useRestaurantFollow.js";
import useMenuItemLike from "../../../hooks/useMenuItemLike.js";
import useWishListEntry from "../../../hooks/useWishListEntry.js";
import { WISH_LIST_ACCENT } from "../../WishListMenuItemButton.jsx";

/**
 * Rail icon + short label. `hint` is the full explanation ("Add this item to your Wish List")
 * shown to the left of the icon on mouse hover; it is also the accessible name.
 */
function RailButton({ testId, label, hint, disabled, onClick, children, pressed, circleStyle = null }) {
  const [hovered, setHovered] = useState(false);
  const explanation = hint || label;
  return (
    <button
      type="button"
      data-testid={testId}
      aria-label={explanation}
      aria-pressed={pressed}
      disabled={disabled}
      onPointerEnter={(e) => {
        if (e.pointerType === "mouse") setHovered(true);
      }}
      onPointerLeave={() => setHovered(false)}
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
      <span style={{ ...styles.iconCircle, ...circleStyle }}>{children}</span>
      <span style={styles.label}>{label}</span>
      {hovered ? (
        <span role="tooltip" data-testid={`${testId}-hint`} style={styles.hint}>
          {explanation}
        </span>
      ) : null}
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
      label={liked ? "My Fav" : "Fav"}
      hint={liked ? "In your Favs — tap to remove this dish" : "Fav this dish"}
      pressed={liked}
      disabled={loading || busy}
      onClick={toggle}
    >
      {/* One Fav for restaurants and dishes (Andre 2026-10-24): same heart as the restaurant Fav. */}
      <FavHeartIcon size={20} filled={liked} color={liked ? FAV_ACCENT : "#fff"} />
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
      hint={followed ? "In your Favorites — tap to remove this restaurant" : "Add this restaurant to your Favorites"}
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
            hint="Connect with the person in this clip"
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
            hint={
              wish.added
                ? `On your Wish List — tap to remove this ${isDishVideo ? "item" : "restaurant"}`
                : isDishVideo
                  ? "Add this item to your Wish List"
                  : "Add this restaurant to your Wish List"
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
            hint={isDishVideo ? "Invite a Connect to eat this" : "Invite a Connect to eat here"}
            onClick={onInvite}
          >
            <InviteToEatIcon size={20} color="#fff" />
          </RailButton>
        ) : null}

        {showShare ? (
          <RailButton
            testId="feed-rail-share"
            label="Share"
            hint="Share this clip"
            onClick={() => {
              trackShareEvent("menu_share_clicked", shareAnalyticsContext);
              setShare(true);
            }}
          >
            <ShareIcon size={20} stroke="#fff" />
          </RailButton>
        ) : null}

        {showMenu ? (
          <RailButton
            testId="feed-rail-menu"
            label="Menu Browser"
            hint={isDishVideo ? "Order this dish from the menu" : "See this restaurant's menu"}
            onClick={onMenu}
            circleStyle={styles.menuCircle}
          >
            <AppIcon name="menu" size={22} color="#fff" />
          </RailButton>
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
  /**
   * Fixed 64px column so the four icons sit exactly where the original four did
   * (Andre, 2026-10-20); the wider "Order this" pill hangs below the column.
   */
  rail: {
    position: "absolute",
    right: "max(10px, env(safe-area-inset-right))",
    zIndex: 5,
    width: 64,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 14,
    pointerEvents: "auto",
  },
  btn: {
    position: "relative",
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
  /** Menu Browser: the app's yellow-ringed circle. */
  menuCircle: {
    border: "2px solid #FACC15",
    background: "rgba(0,0,0,0.2)",
  },
  /** Hover explanation, opens to the left of the rail so it never covers the icons. */
  hint: {
    position: "absolute",
    right: "calc(100% + 10px)",
    top: 12,
    padding: "6px 10px",
    borderRadius: 8,
    background: "rgba(17,24,39,0.94)",
    color: "#fff",
    fontSize: 12,
    fontWeight: 600,
    lineHeight: 1.3,
    whiteSpace: "nowrap",
    pointerEvents: "none",
    boxShadow: "0 6px 18px rgba(0,0,0,0.35)",
    zIndex: 6,
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
