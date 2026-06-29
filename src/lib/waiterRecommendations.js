function restaurantNameFromDetail(detail) {
  const value = String(detail || "").trim();
  const separator = value.indexOf(" · ");
  return separator === -1 ? value : value.slice(0, separator).trim();
}

function restaurantSlugFromLink(link) {
  const match = String(link || "").match(/\/restaurants\/([^/?#]+)/);
  return match ? match[1] : null;
}

export function groupLikedRecommendations(rows) {
  const groups = [];
  const groupsByRestaurant = new Map();

  for (const row of rows) {
    const restaurantName = row.restaurant_name || restaurantNameFromDetail(row.detail);
    const restaurantKey = row.restaurant_id != null
      ? `id:${row.restaurant_id}`
      : `fallback:${restaurantSlugFromLink(row.link) || restaurantName}`;

    if (!groupsByRestaurant.has(restaurantKey)) {
      const group = { restaurantId: row.restaurant_id ?? null, restaurantName, items: [] };
      groupsByRestaurant.set(restaurantKey, group);
      groups.push(group);
    }
    groupsByRestaurant.get(restaurantKey).items.push(row);
  }

  return groups;
}

/** One Waiter card per "Recently added restaurant" label — lists all new restaurants inside. */
export function groupNewRestaurantRecommendations(rows) {
  const list = (Array.isArray(rows) ? rows : []).filter((row) => row?.type === "new_restaurant");
  if (!list.length) return null;
  return {
    label: list[0]?.label || "Recently added restaurant",
    restaurants: list,
  };
}

const DEFAULT_LABEL_TOPIC_TYPES = ["trending_dish", "meal_recommendation"];

/** One Waiter card per recommendation label (e.g. Popular nearby, lunch idea). */
export function groupLabeledRecommendationTopics(
  rows,
  types = DEFAULT_LABEL_TOPIC_TYPES
) {
  const typeSet = new Set(types);
  const topics = [];
  const seenLabels = new Set();

  for (const row of rows) {
    if (!typeSet.has(row?.type)) continue;
    const label = String(row?.label || "Recommendations").trim() || "Recommendations";
    if (seenLabels.has(label)) continue;
    seenLabels.add(label);
    topics.push({
      label,
      items: rows.filter(
        (candidate) =>
          typeSet.has(candidate?.type) &&
          (String(candidate?.label || "Recommendations").trim() || "Recommendations") === label
      ),
    });
  }

  return topics;
}
