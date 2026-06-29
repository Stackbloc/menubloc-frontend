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
