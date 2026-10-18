/**
 * Cluster videos → lookups for the Food / Restaurants rows.
 *
 * GET /public/clusters/:slug/videos returns { videos, restaurants: { [restaurant_id]: video_key[] } }.
 * A dish row has a video when one of its restaurant's clips names that dish: same menu item id,
 * else the same normalized dish name. Chain stores list canonical menu ids that differ from the
 * id a clip was tagged with, so the name fallback is what finds them (same rule the Menu
 * Browser uses to pin "From the video").
 */

import { normalizeDishName } from "./menuPinnedItem.js";

function idKey(value) {
  if (value == null) return "";
  const s = String(value).trim();
  return s && s !== "0" ? s : "";
}

export function clusterVideoDishName(video) {
  const name = String(video?.item_name || "").trim();
  return name || null;
}

function dishNameOf(item) {
  return normalizeDishName(item?.name || item?.menu_item_name || item?.search_display_name || "");
}

function dishIdsOf(item) {
  return [item?.menu_item_id, item?.ck_menu_item_id, item?.id].map(idKey).filter(Boolean);
}

const EMPTY_INDEX = Object.freeze({
  videos: [],
  forRestaurant: () => [],
  forDish: () => [],
});

/**
 * @param {{ videos?: object[], restaurants?: Record<string, string[]> } | null} payload
 */
export function buildClusterVideoIndex(payload) {
  const videos = (Array.isArray(payload?.videos) ? payload.videos : []).filter(
    (v) => v?.video_key && String(v.video_url || "").trim()
  );
  if (videos.length === 0) return EMPTY_INDEX;

  const byKey = new Map(videos.map((v) => [v.video_key, v]));
  const byRestaurant = new Map();
  const map = payload?.restaurants && typeof payload.restaurants === "object" ? payload.restaurants : {};
  for (const [rid, keys] of Object.entries(map)) {
    const list = (Array.isArray(keys) ? keys : []).map((k) => byKey.get(k)).filter(Boolean);
    if (list.length) byRestaurant.set(idKey(rid), list);
  }
  // Older payloads without the map: fall back to each clip's own store.
  if (byRestaurant.size === 0) {
    for (const v of videos) {
      const rid = idKey(v.restaurant_id);
      if (!rid) continue;
      if (!byRestaurant.has(rid)) byRestaurant.set(rid, []);
      byRestaurant.get(rid).push(v);
    }
  }

  function forRestaurant(restaurantId) {
    return byRestaurant.get(idKey(restaurantId)) || [];
  }

  function forDish(item) {
    const pool = forRestaurant(item?.restaurant_id);
    if (pool.length === 0) return [];
    const ids = dishIdsOf(item);
    const name = dishNameOf(item);
    return pool.filter((v) => {
      const vid = idKey(v.menu_item_id);
      if (vid && ids.includes(vid)) return true;
      const vname = normalizeDishName(v.item_name);
      return Boolean(vname && name && vname === name);
    });
  }

  return { videos, forRestaurant, forDish };
}

/** Deal clips without a dish lead with the deal title ("$9 Pasta Tuesdays"). */
export function clusterVideoDealTitle(video) {
  if (String(video?.kind || "").toLowerCase() !== "deal") return null;
  const title = String(video?.title || "").trim();
  if (!title || title === String(video?.restaurant_name || "").trim()) return null;
  return title;
}
