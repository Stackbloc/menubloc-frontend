/**
 * Group hub diary rows into meal occasions (legacy null meal_id = singleton).
 * Output order is chronological by eaten_at (late night before breakfast when clocks say so).
 */

function eatenAtMs(row) {
  const raw = row?.eaten_at;
  if (raw == null || raw === "") return Number.POSITIVE_INFINITY;
  const ms = new Date(raw).getTime();
  return Number.isFinite(ms) ? ms : Number.POSITIVE_INFINITY;
}

export function compareHubMealsByEatenAt(a, b) {
  const da = eatenAtMs(a);
  const db = eatenAtMs(b);
  if (da !== db) return da - db;
  return 0;
}

export function groupHubAteMeals(entries = []) {
  const list = Array.isArray(entries) ? entries : [];
  const byMeal = new Map();
  const meals = [];
  for (const entry of list) {
    const mid = entry?.meal_id != null ? Number(entry.meal_id) : null;
    if (mid && Number.isFinite(mid)) {
      if (!byMeal.has(mid)) {
        const meal = {
          id: `meal-${mid}`,
          meal_id: mid,
          eaten_on: entry.eaten_on,
          eaten_at: entry.eaten_at || null,
          meal_period: entry.meal_period || null,
          where_type: entry.where_type || null,
          restaurant_id: entry.restaurant_id || null,
          restaurant_name: entry.restaurant_name || null,
          restaurant_slug: entry.restaurant_slug || null,
          restaurant_city: entry.restaurant_city || entry.city || null,
          restaurant_state: entry.restaurant_state || entry.state || null,
          restaurant_logo_url: entry.restaurant_logo_url || null,
          restaurant_billboard_image_url: entry.restaurant_billboard_image_url || null,
          chain_id: entry.chain_id || entry.restaurant_chain_id || null,
          homemade: Boolean(entry.homemade),
          photo_url: entry.photo_url || entry.item_photo_url || null,
          video_url: entry.video_url || null,
          items: [],
        };
        byMeal.set(mid, meal);
        meals.push(meal);
      }
      const meal = byMeal.get(mid);
      meal.items.push(entry);
      if (entry.homemade) meal.homemade = true;
      if (!meal.photo_url && (entry.photo_url || entry.item_photo_url)) {
        meal.photo_url = entry.photo_url || entry.item_photo_url;
      }
      if (!meal.video_url && entry.video_url) meal.video_url = entry.video_url;
      continue;
    }
    meals.push({
      id: entry.id || `singleton-${entry.entry_id || entry.id}`,
      meal_id: null,
      singleton_entry_id: entry.entry_id || entry.id,
      eaten_on: entry.eaten_on,
      eaten_at: entry.eaten_at || null,
      meal_period: entry.meal_period || null,
      where_type: entry.where_type || null,
      restaurant_id: entry.restaurant_id || null,
      restaurant_name: entry.restaurant_name || null,
      restaurant_slug: entry.restaurant_slug || null,
      restaurant_city: entry.restaurant_city || entry.city || null,
      restaurant_state: entry.restaurant_state || entry.state || null,
      restaurant_logo_url: entry.restaurant_logo_url || null,
      restaurant_billboard_image_url: entry.restaurant_billboard_image_url || null,
      chain_id: entry.chain_id || entry.restaurant_chain_id || null,
      homemade: Boolean(entry.homemade),
      photo_url: entry.photo_url || entry.item_photo_url || null,
      video_url: entry.video_url || null,
      menu_item_id: entry.menu_item_id || null,
      items: [entry],
      // preserve delete/select target for single-item meals
      entry_id: entry.entry_id || entry.id,
      food_name: entry.food_name || entry.item_name,
    });
  }
  const shaped = meals.map((meal) => {
    const names = meal.items
      .map((item) => item.food_name || item.item_name)
      .filter(Boolean);
    // Prefer earliest item clock on a multi-item meal.
    const earliest = meal.items.reduce((best, item) => {
      if (!best) return item;
      return eatenAtMs(item) < eatenAtMs(best) ? item : best;
    }, null);
    return {
      ...meal,
      eaten_at: earliest?.eaten_at || meal.eaten_at || null,
      food_name: names.join(" · ") || meal.food_name || "Food",
      menu_item_id:
        meal.items.length === 1
          ? meal.items[0].menu_item_id || meal.menu_item_id || null
          : null,
      // primary item for delete/select when multi-item
      entry_id: meal.items[0]?.entry_id || meal.items[0]?.id || meal.entry_id,
      primaryItem: meal.items[0] || null,
    };
  });
  return shaped
    .map((meal, index) => ({ meal, index }))
    .sort((a, b) => {
      const byTime = compareHubMealsByEatenAt(a.meal, b.meal);
      return byTime !== 0 ? byTime : a.index - b.index;
    })
    .map(({ meal }) => meal);
}
