import { Link } from "react-router-dom";
import LikeMenuItemButton from "../../../components/LikeMenuItemButton.jsx";
import ShareButton from "../../../components/share/ShareButton.jsx";
import {
  buildDishShareData,
  buildRestaurantShareData,
} from "../../../components/share/shareUtils.js";
import InviteToEatButton from "../../../components/InviteToEatButton.jsx";
import IconHoverLabel from "../../../components/IconHoverLabel.jsx";
import CommentBubbleIcon from "../../../components/icons/CommentBubbleIcon.jsx";
import { restaurantPathFromRow } from "../../../lib/canonicalUrl.js";
import { likeButtonVisualStyle } from "../../../lib/likeButtonStyles.js";
import * as s from "./myMenuplyStyles.js";

function resolveCommentHref(item) {
  const mid = Number(item?.menu_item_id);
  if (Number.isInteger(mid) && mid > 0) {
    return `/menu-items/${mid}#food-comments`;
  }
  const rest =
    restaurantPathFromRow(item) ||
    (item?.restaurant_id ? `/restaurants/${item.restaurant_id}` : null);
  return rest ? `${rest}#food-comments` : null;
}

function resolveSharePayload(item) {
  const label = item?.food_name || item?.item_name || item?.itemName || "Food";
  const place = item?.restaurant_name || item?.place_label || "";
  const mid = Number(item?.menu_item_id);
  if (Number.isInteger(mid) && mid > 0) {
    return {
      variant: "dish",
      shareData: buildDishShareData({
        restaurant: {
          name: place,
          slug: item.restaurant_slug,
          city: item.restaurant_city || item.city,
          state: item.restaurant_state || item.state,
        },
        menuItem: {
          id: mid,
          name: label,
          photo_url: item.photo_url,
        },
      }),
    };
  }
  if (item?.restaurant_id || item?.restaurant_slug) {
    return {
      variant: "menu",
      shareData: buildRestaurantShareData({
        restaurantName: place,
        restaurantSlug: item.restaurant_slug,
        restaurantId: item.restaurant_id,
        city: item.restaurant_city || item.city,
        state: item.restaurant_state || item.state,
      }),
    };
  }
  return null;
}

/**
 * Ghost icon row for eating cards: Like (dish), Comment, Share, Invite to Eat.
 */
export default function EatingSocialActions({ item, testId = "eating-social-actions" }) {
  if (!item) return null;

  const commentHref = resolveCommentHref(item);
  const sharePayload = resolveSharePayload(item);
  const label = item.food_name || item.item_name || item.itemName || "Food";
  const place = item.restaurant_name || item.place_label || "";
  const mid = Number(item.menu_item_id);
  const hasLike = Number.isInteger(mid) && mid > 0;
  const hasInvite = item.restaurant_id != null && String(item.restaurant_id).trim() !== "";

  if (!hasLike && !commentHref && !sharePayload && !hasInvite) return null;

  const dim = 32;

  return (
    <div style={s.socialActions} data-testid={testId} role="group" aria-label="Social actions">
      {hasLike ? <LikeMenuItemButton menuItemId={mid} tone="ghost" size="compact" /> : null}
      {commentHref ? (
        <IconHoverLabel label="Comment">
          <Link
            to={commentHref}
            aria-label="Comment on this dish"
            title="Comment"
            style={{
              ...likeButtonVisualStyle({ selected: false, inline: false, ghost: true, loading: false }),
              width: dim,
              height: dim,
              minWidth: dim,
              minHeight: dim,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <CommentBubbleIcon size={15} />
          </Link>
        </IconHoverLabel>
      ) : null}
      {sharePayload ? (
        <ShareButton
          shareData={sharePayload.shareData}
          variant={sharePayload.variant}
          iconOnly
          size="compact"
          tone="ghost"
          label="Share"
          stopPropagation
        />
      ) : null}
      {hasInvite ? (
        <InviteToEatButton
          restaurantId={item.restaurant_id}
          restaurantName={place}
          menuItemId={hasLike ? mid : null}
          menuItemName={hasLike ? label : null}
          tone="ghost"
          size="compact"
        />
      ) : null}
    </div>
  );
}
