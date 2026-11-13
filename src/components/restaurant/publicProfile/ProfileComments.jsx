/**
 * Restaurant profile: Comments (Andre 2026-11-12) — claimed or unclaimed.
 * Feed comments people left on clips about this place or one of its dishes (the dish opens the menu
 * at that dish), then the place's own discussion thread (FoodComments, #food-comments) where diners
 * can comment on the restaurant or a dish.
 * The data comes from useRestaurantProfileComments (hooks/), which also returns my_items for the hero's "You Commented on this".
 */
import { Link } from "react-router-dom";
import { commentTimeAgo } from "../../../lib/feedComments.js";
import { appendMenuHighlightQuery } from "../../share/shareUtils.js";
import FoodComments from "../../comments/FoodComments.jsx";
import { PROFILE_INK, PROFILE_MUTED, profileReadableSurfaceStyle } from "./profilePrimitives.jsx";

function dishMenuHref(menuHref, itemId) {
  if (!menuHref || !itemId) return null;
  return appendMenuHighlightQuery(menuHref, { menuItemId: itemId });
}

function FeedCommentRow({ comment, menuHref }) {
  const dish = comment?.menu_item;
  const href = dish?.id ? dishMenuHref(menuHref, dish.id) : null;
  const replies = Number(comment?.reply_count) || 0;
  return (
    <article
      data-testid="profile-feed-comment"
      style={{ padding: "12px 14px", borderRadius: 12, border: "1px solid #e7e5e4", background: "#fff" }}
    >
      {dish?.name ? (
        <div data-testid="profile-feed-comment-dish" style={{ fontSize: 13, color: "#44403c", marginBottom: 6 }}>
          {href ? (
            <Link to={href} style={{ color: "#166534", fontWeight: 700 }}>
              {dish.name}
            </Link>
          ) : (
            <strong>{dish.name}</strong>
          )}
        </div>
      ) : null}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "baseline", fontSize: 13 }}>
        <strong style={{ color: PROFILE_INK }}>{comment?.author?.name || "A diner"}</strong>
        <span style={{ color: PROFILE_MUTED }}>{commentTimeAgo(comment?.created_at)} · on a clip</span>
      </div>
      <p style={{ margin: "6px 0 0", fontSize: 14, lineHeight: 1.45, color: PROFILE_INK, whiteSpace: "pre-wrap" }}>
        {comment?.body}
      </p>
      {replies > 0 ? (
        <div style={{ marginTop: 6, fontSize: 12, color: PROFILE_MUTED }}>
          {replies === 1 ? "1 reply" : `${replies} replies`}
        </div>
      ) : null}
    </article>
  );
}

export default function ProfileComments({
  restaurantId,
  restaurantSlug = null,
  restaurantCity = null,
  restaurantState = null,
  menuHref = null,
  menuPreviewItems = null,
  feedComments = [],
  isMobile = false,
}) {
  if (!restaurantId) return null;
  const list = Array.isArray(feedComments) ? feedComments : [];
  return (
    <section
      data-testid="profile-comments"
      data-profile-surface="card"
      aria-label="Comments"
      style={profileReadableSurfaceStyle({
        marginBottom: isMobile ? 20 : 28,
        padding: isMobile ? "14px 14px" : "16px 16px",
      })}
    >
      <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 0.4, color: PROFILE_INK, marginBottom: 12 }}>
        Comments
      </div>
      {list.length ? (
        <div data-testid="profile-feed-comments" style={{ display: "grid", gap: 10, marginBottom: 16 }}>
          {list.map((c) => (
            <FeedCommentRow key={c.id} comment={c} menuHref={menuHref} />
          ))}
        </div>
      ) : null}
      <FoodComments
        restaurantId={restaurantId}
        restaurantSlug={restaurantSlug}
        restaurantCity={restaurantCity}
        restaurantState={restaurantState}
        menuPreviewItems={menuPreviewItems}
        menuHref={menuHref}
        hideEmptyHint={list.length > 0}
        showFeaturedFirst
        hideTitle
        embedded
        compact={isMobile}
      />
    </section>
  );
}
