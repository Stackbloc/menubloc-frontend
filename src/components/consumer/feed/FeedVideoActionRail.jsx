/**
 * Live Feed right action rail — Wish List · Fav · Invite · Share · Menu, as in the app
 * (menuply-mobile FeedClip; app wins, Andre 2026-10-29): Menu Browser is a round button with a
 * yellow ring and the menu icon, labeled like the others (it replaced the green "Order this" pill).
 * "+Wish List": linked dish → saves the dish; otherwise saves the restaurant. Both land in
 * the profile Wish List.
 * Like is for dishes; a clip with no linked dish shows the restaurant Fav heart (My Favs).
 * Hide (do not gray-out) actions that do not apply.
 * Icons are the app's own drawings (AppIcon = MenuplyIcon), 22 px in an outlined circle, white
 * when on (filled), the same as the app's feed rail (Andre 2026-11-15).
 * 2026-11-22 (app dd4b302 + d36bd97, Andre 2026-11-21): Wall (red brick wall) and Clusters circles
 * under Share, only where the diner's city has them. The rail stays where it was, so the last circle
 * sits where Share used to sit and the circles above it move up.
 */

import { useLayoutEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppIcon from "../../icons/AppIcon.jsx";
import ShareModal from "../../share/ShareModal.jsx";
import { trackShareEvent } from "../../share/shareUtils.js";
import { commentCountLabel } from "../../../lib/feedComments.js";
import useRestaurantFollow from "../../../hooks/useRestaurantFollow.js";
import useMenuItemLike from "../../../hooks/useMenuItemLike.js";
import useWishListEntry from "../../../hooks/useWishListEntry.js";
import { WISH_LIST_ADD, WISH_LIST_ADDED } from "../../WishListMenuItemButton.jsx";

/**
 * 2026-11-22 (Andre: "Fav and mute are stacked onto one another"): on short screens (iPhone Safari
 * with its toolbars) the 7-circle rail reached the speaker button at the top right, so Fav sat on
 * it and +Wish List went off the top. The rail keeps its place at the bottom; when it would come
 * closer than this to the top, it shrinks evenly from its bottom edge until it fits under the speaker.
 */
const RAIL_MIN_TOP = 64;
const RAIL_MIN_SCALE = 0.6;

/** Top edge (px from the rail's positioned parent) the rail must stay under: the speaker's bottom + 10. */
function railTopLimit(rail) {
  const parent = rail.offsetParent;
  if (!parent) return RAIL_MIN_TOP;
  let limit = RAIL_MIN_TOP;
  const speaker = parent.querySelector('[data-testid$="sound-toggle"]');
  if (speaker && speaker.offsetParent === parent && speaker.offsetHeight > 0) {
    limit = Math.max(limit, speaker.offsetTop + speaker.offsetHeight + 10);
  }
  return limit;
}

/** Scale (≤ 1) that keeps the bottom-anchored rail under the speaker. transform doesn't change offset*. */
export function fitRailScale({ railBottomEdge, railHeight, topLimit }) {
  if (!(railHeight > 0)) return 1;
  const room = railBottomEdge - topLimit;
  if (room >= railHeight) return 1;
  return Math.max(RAIL_MIN_SCALE, Math.round((room / railHeight) * 1000) / 1000);
}

/**
 * Rail icon + short label. `hint` is the full explanation ("Add this item to your Wish List")
 * shown to the left of the icon on mouse hover; it is also the accessible name.
 */
function RailButton({ testId, label, hint, disabled, onClick, children, pressed, circleStyle = null, circleClassName = undefined }) {
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
      <span className={circleClassName} style={{ ...styles.iconCircle, ...circleStyle, width: "var(--mp-rail-circle, 48px)", height: "var(--mp-rail-circle, 48px)" }}>{children}</span>
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

/**
 * 2026-11-22: red brick wall, the app's RedBrickWall (menuply-mobile icons/RedBrickWall.tsx, Andre
 * 2026-11-21): brick red #B4442F, staggered rows.
 */
const BRICK_ROWS = [
  [[2, 9], [13, 9]],
  [[2, 4], [8, 8], [18, 4]],
  [[2, 9], [13, 9]],
  [[2, 4], [8, 8], [18, 4]],
];
export function RedBrickWallGlyph({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" data-testid="feed-rail-wall-bricks">
      {BRICK_ROWS.map((row, r) =>
        row.map(([x, w]) => <rect key={`${r}-${x}`} x={x} y={3 + r * 4.75} width={w} height={3.75} rx={0.6} fill="#B4442F" />)
      )}
    </svg>
  );
}

/**
 * Menu ring pulses yellow ↔ white (Andre 2026-11-04, as the app); its three lines and the word Menu
 * (the label span right after the circle) pulse with it in step. Still when motion is reduced.
 */
const MENU_PULSE_CSS = `
@keyframes mpMenuPulse { 0%, 100% { border-color: #FACC15; } 50% { border-color: #FFFFFF; } }
@keyframes mpMenuLines { 0%, 100% { stroke: #FACC15; } 50% { stroke: #FFFFFF; } }
@keyframes mpMenuLabel { 0%, 100% { color: #FACC15; } 50% { color: #FFFFFF; } }
.mp-menu-pulse { animation: mpMenuPulse 1.8s ease-in-out infinite; }
.mp-menu-pulse svg line { animation: mpMenuLines 1.8s ease-in-out infinite; }
.mp-menu-pulse + span { animation: mpMenuLabel 1.8s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) { .mp-menu-pulse, .mp-menu-pulse svg line, .mp-menu-pulse + span { animation: none; } }
`;

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
      <AppIcon name="fav" size={22} filled={liked} color="#fff" />
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
      <AppIcon name="fav" size={22} filled={followed} color="#fff" />
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
 * @param {number|null} [props.commentCount] Feed comments (mig 0423): a number = comments are on → Comment button
 * @param {() => void} [props.onComments] opens the comments sheet
 * @param {string|null} [props.wallHref] 2026-11-22: Wall circle under Share (hidden without it)
 * @param {string|null} [props.clustersHref] 2026-11-22: Clusters circle under Wall (hidden without it)
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
  commentCount = null,
  onComments,
  wallHref = null,
  clustersHref = null,
  /** Optional control above the buttons (Feed play/pause circle) — thumb-reachable. */
  topSlot = null,
}) {
  const [shareOpen, setShareOpen] = useState(false);
  const navigate = useNavigate();
  const railRef = useRef(null);
  const [railScale, setRailScale] = useState(1);

  useLayoutEffect(() => {
    const rail = railRef.current;
    if (!rail) return undefined;
    const measure = () => {
      const next = fitRailScale({
        railBottomEdge: rail.offsetTop + rail.offsetHeight,
        railHeight: rail.offsetHeight,
        topLimit: railTopLimit(rail),
      });
      setRailScale((prev) => (Math.abs(prev - next) < 0.005 ? prev : next));
    };
    measure();
    window.addEventListener("resize", measure);
    let ro = null;
    if (typeof ResizeObserver === "function") {
      ro = new ResizeObserver(measure);
      ro.observe(rail);
      if (rail.offsetParent) ro.observe(rail.offsetParent);
    }
    return () => {
      window.removeEventListener("resize", measure);
      ro?.disconnect();
    };
  });

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
  const showComments = typeof commentCount === "number" && typeof onComments === "function";
  const showWall = Boolean(wallHref);
  const showClusters = Boolean(clustersHref);
  const anyVisible =
    showConnect || showWannaGo || showInvite || showLike || showComments || showShare || showWall || showClusters || showMenu;
  if (!anyVisible) return null;

  function setShare(open) {
    setShareOpen(open);
    onShareOpenChange?.(open);
  }

  const inset = Math.max(0, Number(bottomInset) || 0);

  return (
    <>
      <style>{MENU_PULSE_CSS}</style>
      <div
        ref={railRef}
        data-testid="feed-video-action-rail"
        data-rail-scale={railScale}
        style={{
          ...styles.rail,
          // 2026-11-22: with Wall + Clusters the rail has 7 circles; it stays anchored where it was (the
          // last circle sits where Share sat), so circles and gaps shrink with the screen height to keep
          // +Wish List clear of the speaker button at the top right (375×812: 41 px; iPhone SE: 33 px).
          ...(showWall || showClusters ? styles.railCompact : null),
          // Raised so the rail sits well clear of the Report flag under it (Andre 2026-11-04): 124 px
          // on tall phones, less on short ones (iPhone SE) so +Wish List stays under the ☰ button.
          bottom: `calc(${inset}px + max(clamp(92px, 15vh, 124px), env(safe-area-inset-bottom) + 72px))`,
          // 2026-11-22: shrink from the bottom edge only when the rail would reach the speaker.
          ...(railScale < 1 ? { transform: `scale(${railScale})`, transformOrigin: "bottom center" } : null),
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
            hint={wish.added ? WISH_LIST_ADDED : WISH_LIST_ADD}
            pressed={wish.added}
            disabled={wish.busy}
            onClick={wish.toggle}
          >
            <AppIcon name="wishList" size={22} filled={wish.added} color="#fff" />
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
            <AppIcon name="invite" size={22} color="#fff" />
          </RailButton>
        ) : null}

        {showComments ? (
          <RailButton
            testId="feed-rail-comments"
            label={commentCountLabel(commentCount)}
            hint={commentCount > 0 ? `${commentCount} ${commentCount === 1 ? "comment" : "comments"}. Open comments` : "Comment on this clip"}
            onClick={onComments}
          >
            <AppIcon name="comment" size={22} color="#fff" />
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
            <AppIcon name="share" size={22} color="#fff" />
          </RailButton>
        ) : null}

        {/* 2026-11-22 (app dd4b302): Wall + Clusters under Share, only where the city has them. */}
        {showWall ? (
          <RailButton testId="feed-rail-wall" label="Wall" hint="Open the Wall" onClick={() => navigate(wallHref)}>
            <RedBrickWallGlyph size={24} />
          </RailButton>
        ) : null}

        {showClusters ? (
          <RailButton testId="feed-rail-clusters" label="Clusters" hint="Open Clusters" onClick={() => navigate(clustersHref)}>
            <AppIcon name="cluster" size={22} color="#fff" />
          </RailButton>
        ) : null}

        {showMenu ? (
          <RailButton
            testId="feed-rail-menu"
            label="Menu"
            hint={isDishVideo ? "Order this dish from the menu" : "See this restaurant's menu"}
            onClick={onMenu}
            circleStyle={styles.menuCircle}
            circleClassName="mp-menu-pulse"
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
    // Further in from the edge (Andre 2026-11-04; was 10 px).
    right: "max(20px, env(safe-area-inset-right))",
    zIndex: 5,
    width: 64,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "min(14px, 1.6vh)",
    pointerEvents: "auto",
  },
  /** 2026-11-22: 7-circle rail (Wall + Clusters). Sets the circle size used by RailButton. */
  railCompact: {
    gap: "min(8px, 0.8vh)",
    "--mp-rail-circle": "clamp(32px, 5vh, 48px)",
    "--mp-rail-label-gap": "2px",
    "--mp-rail-label-lh": 1,
  },
  btn: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "var(--mp-rail-label-gap, 4px)",
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
    // The app's outlined circle (menuply-mobile FeedClip styles.circle).
    background: "rgba(0,0,0,0.2)",
    border: "1.5px solid rgba(255,255,255,0.9)",
  },
  label: {
    fontSize: 12,
    fontWeight: 600,
    lineHeight: "var(--mp-rail-label-lh, 1.15)",
    textShadow: "0 1px 3px rgba(0,0,0,0.6)",
    maxWidth: 64,
    textAlign: "center",
  },
  /** Menu: the app's yellow-ringed circle (pulses, MENU_PULSE_CSS). */
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
