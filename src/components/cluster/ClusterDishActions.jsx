import { useState } from "react";
import LikeMenuItemButton from "../LikeMenuItemButton.jsx";
import InviteToEatButton from "../InviteToEatButton.jsx";
import ShareButton from "../share/ShareButton.jsx";
import FoodCommentNavButton from "../FoodCommentNavButton.jsx";
import IconHoverLabel from "../IconHoverLabel.jsx";
import { buildDishShareData } from "../share/shareUtils.js";
import { likeButtonVisualStyle } from "../../lib/likeButtonStyles.js";

/**
 * The dish's Like / Comment record is the CK menu item (same as the restaurant menu and dish
 * page). Franchise rows carry it as ck_menu_item_id; a franchise row without one (cmi: or a
 * public.menu_items id) has no CK record, so Like and Comment are left off rather than
 * writing to an unrelated CK id.
 */
export function resolveClusterDishCkId(item) {
  const raw = item?.is_franchise_cluster_item ? item?.ck_menu_item_id : item?.menu_item_id;
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

const COUNT_STYLE = {
  fontSize: "0.75rem",
  fontWeight: 600,
  color: "#4b5563",
  fontVariantNumeric: "tabular-nums",
  lineHeight: 1,
};

function Count({ value, testId }) {
  if (!(value > 0)) return null;
  return (
    <span data-testid={testId} style={COUNT_STYLE}>
      {value}
    </span>
  );
}

function MoreDotsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <circle cx="5" cy="12" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="19" cy="12" r="2" />
    </svg>
  );
}

/**
 * Cluster menu row actions — the restaurant menu row's own Like, Invite, Share and Comment
 * controls. Like + Invite inline; the dots reveal Share + Comment inline. Taps never reach
 * the row (which opens the dish).
 */
export default function ClusterDishActions({ item, counts = null }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const [likeAdjust, setLikeAdjust] = useState(0);
  const ckId = resolveClusterDishCkId(item);
  const routeId = item?.menu_item_id ?? null;
  const restaurantId = item?.restaurant_id ?? null;
  const restaurantName = String(item?.restaurant_name || "").trim();
  const name = String(item?.name || "").trim();
  const likeCount = Math.max(0, (Number(counts?.likes) || 0) + likeAdjust);
  const commentCount = Number(counts?.comments) || 0;

  const shareData = routeId
    ? buildDishShareData({
        restaurant: {
          id: restaurantId,
          slug: item?.restaurant_slug || null,
          name: restaurantName,
          city: item?.city || null,
          state: item?.state || null,
        },
        menuItem: { ...item, id: routeId, name },
      })
    : null;

  const stop = (e) => e.stopPropagation();

  return (
    <span
      data-testid="cluster-dish-actions"
      onClick={stop}
      onKeyDown={stop}
      style={{ display: "inline-flex", alignItems: "center", gap: 4, flexShrink: 0, whiteSpace: "nowrap" }}
    >
      {ckId ? (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
          <LikeMenuItemButton
            menuItemId={ckId}
            tone="ghost"
            size="row"
            onLikedChange={(liked) => setLikeAdjust((n) => n + (liked ? 1 : -1))}
          />
          <Count value={likeCount} testId="cluster-dish-like-count" />
        </span>
      ) : null}
      <InviteToEatButton
        restaurantId={restaurantId}
        restaurantName={restaurantName}
        menuItemId={ckId}
        menuItemName={name}
        tone="ghost"
        size="row"
      />
      {moreOpen && shareData ? (
        <ShareButton
          variant="dish"
          iconOnly={true}
          tone="ghost"
          shareData={shareData}
          analyticsContext={{
            restaurantId,
            restaurantSlug: item?.restaurant_slug || null,
            menuItemId: routeId,
            menuItemName: name,
            pageType: "cluster_menu",
            shareTarget: "dish",
          }}
        />
      ) : null}
      {moreOpen && ckId ? (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
          <FoodCommentNavButton
            target="menu_item"
            menuItemId={ckId}
            restaurantId={restaurantId}
            restaurantName={restaurantName}
            menuItemName={name}
            tone="ghost"
            size="row"
          />
          <Count value={commentCount} testId="cluster-dish-comment-count" />
        </span>
      ) : null}
      {shareData || ckId ? (
        <IconHoverLabel label={moreOpen ? "Less" : "More"}>
          <button
            type="button"
            data-testid="cluster-dish-more"
            aria-label={moreOpen ? "Hide share and comment" : "Share or comment"}
            aria-expanded={moreOpen}
            title={moreOpen ? "Less" : "More"}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setMoreOpen((open) => !open);
            }}
            style={{
              ...likeButtonVisualStyle({ selected: moreOpen, ghost: true }),
              width: 28,
              height: 28,
              minWidth: 28,
              minHeight: 28,
            }}
          >
            <MoreDotsIcon />
          </button>
        </IconHoverLabel>
      ) : null}
    </span>
  );
}
