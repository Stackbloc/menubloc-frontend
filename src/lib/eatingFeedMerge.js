/**
 * Dedupe My Menuply eating feed when food_activity is mirrored to what_i_ate_today.
 */

export function eatingFeedKey(row) {
  const restaurantId = row?.restaurant_id != null ? String(row.restaurant_id) : "";
  const menuItemId = row?.menu_item_id != null ? String(row.menu_item_id) : "";
  const photo = row?.photo_url != null ? String(row.photo_url) : "";
  const video = row?.video_url != null ? String(row.video_url) : "";
  const name = String(row.food_name || row.item_name || row.comment || "")
    .trim()
    .toLowerCase();
  return `${restaurantId}|${menuItemId}|${photo}|${video}|${name}`;
}

export function mapDiaryEntriesForHub(entries = []) {
  return (entries || []).map((row) => ({
    ...row,
    id: `wia-${row.id}`,
    entry_id: row.id,
    food_name: row.item_name || row.food_name || "Food",
    kind: "what_i_ate",
  }));
}

export function mapFoodActivityForHub(activities = []) {
  return (activities || []).map((row) => ({
    ...row,
    id: String(row.id || "").startsWith("fa-") || String(row.id || "").startsWith("fa:")
      ? row.id
      : `fa-${row.source_id || row.id}`,
    food_name: row.food_name || row.item_name || row.comment || "Food",
    kind: row.kind || "im_eating",
  }));
}

export function mapConnectionsEatingForHub(items = [], peerId = null) {
  const scoped =
    peerId != null
      ? (items || []).filter((item) => Number(item.peer?.id) === Number(peerId))
      : items || [];
  return mapFoodActivityForHub(scoped);
}

export function mergeEatingFeedForHub(diaryItems = [], activityItems = []) {
  const diaryKeys = new Set((diaryItems || []).map(eatingFeedKey));
  const dedupedActivity = (activityItems || []).filter((row) => !diaryKeys.has(eatingFeedKey(row)));
  return [...(diaryItems || []), ...dedupedActivity];
}
