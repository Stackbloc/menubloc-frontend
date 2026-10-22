import { useState } from "react";
import LikeMenuItemButton from "../LikeMenuItemButton.jsx";
import InviteToEatButton from "../InviteToEatButton.jsx";
import DishVideoCommentButton from "../comments/DishVideoCommentButton.jsx";
import ShareButton from "../share/ShareButton.jsx";
import WishListMenuItemButton from "../WishListMenuItemButton.jsx";
import { buildDishShareData } from "../share/shareUtils.js";

/**
 * The dish's Wish List / Like record is the CK menu item (same as the restaurant menu and dish
 * page). Franchise rows carry it as ck_menu_item_id; a franchise row without one (cmi: or a
 * public.menu_items id) has no CK record, so Wish List and Like are left off rather than
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

/**
 * Cluster menu row actions — the same four as the Feed rail and every menu row, in the same
 * order: Wish List · Like · Invite · Share (Andre, 2026-10-20). The Feed's green order /
 * menu button is Feed-only; here the row itself opens the ordering menu. Taps never
 * reach the row.
 */
export default function ClusterDishActions({ item, counts = null }) {
  const [likeAdjust, setLikeAdjust] = useState(0);
  const ckId = resolveClusterDishCkId(item);
  const routeId = item?.menu_item_id ?? null;
  const restaurantId = item?.restaurant_id ?? null;
  const restaurantName = String(item?.restaurant_name || "").trim();
  const name = String(item?.name || "").trim();
  const likeCount = Math.max(0, (Number(counts?.likes) || 0) + likeAdjust);

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
        <WishListMenuItemButton
          menuItemId={ckId}
          menuItemName={name}
          restaurantId={restaurantId}
          restaurantName={restaurantName}
        />
      ) : null}
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
      {ckId ? (
        <DishVideoCommentButton
          menuItemId={ckId}
          menuItemName={name}
          restaurantId={restaurantId}
          tone="ghost"
          size="row"
        />
      ) : null}
      <InviteToEatButton
        restaurantId={restaurantId}
        restaurantName={restaurantName}
        menuItemId={ckId}
        menuItemName={name}
        tone="ghost"
        size="row"
      />
      {shareData ? (
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
    </span>
  );
}
