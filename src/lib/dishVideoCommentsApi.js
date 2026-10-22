/**
 * Dish video comments (Andre, 2026-10-22): 25-second videos about one dish, shown only on the
 * dish. Separate from the text Food discussions (foodCommentsApi.js).
 */
import { apiGet, apiPost } from "./api.js";

export const DISH_VIDEO_COMMENT_MAX_SECONDS = 25;

export function listDishVideoComments(menuItemId, { limit } = {}) {
  const qs = limit ? `?limit=${encodeURIComponent(limit)}` : "";
  return apiGet(`/public/menu-items/${encodeURIComponent(menuItemId)}/video-comments${qs}`);
}

export function createDishVideoComment(menuItemId, { videoUrl, durationSeconds, restaurantId }) {
  return apiPost(`/api/consumer/menu-items/${encodeURIComponent(menuItemId)}/video-comments`, {
    video_url: videoUrl,
    duration_seconds: durationSeconds,
    restaurant_id: restaurantId ?? undefined,
  });
}
