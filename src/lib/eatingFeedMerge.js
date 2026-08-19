/**
 * Dedupe My Menuply eating feed when food_activity is mirrored to what_i_ate_today.
 */

export function eatingFeedKey(row) {
  const restaurantId = row?.restaurant_id != null ? String(row.restaurant_id) : "";
  const menuItemId = row?.menu_item_id != null ? String(row.menu_item_id) : "";
  const photo = row?.photo_url != null ? String(row.photo_url) : "";
  const name = String(row.food_name || row.item_name || row.comment || "")
    .trim()
    .toLowerCase();
  return `${restaurantId}|${menuItemId}|${photo}|${name}`;
}

export function mergeEatingFeedForHub(diaryItems = [], activityItems = []) {
  const diaryKeys = new Set((diaryItems || []).map(eatingFeedKey));
  const dedupedActivity = (activityItems || []).filter((row) => !diaryKeys.has(eatingFeedKey(row)));
  return [...(diaryItems || []), ...dedupedActivity];
}
