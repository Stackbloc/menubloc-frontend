/**
 * Shape Month in Food API payload into a view model. Never invent stats.
 */

const DEFAULT_MEDIA_BASE = "https://menubloc-backend-production.up.railway.app";

const DRINK_RE = /\b(latte|coffee|espresso|cappuccino|matcha|tea|smoothie|juice|cola|soda|beer|wine|cocktail|coolatta|refresher)\b/i;
const COFFEE_RE = /\b(latte|coffee|espresso|cappuccino|americano|mocha)\b/i;

export function mediaUrl(raw) {
  const value = String(raw || "").trim();
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  return `${DEFAULT_MEDIA_BASE}${value.startsWith("/") ? value : `/${value}`}`;
}

function modeCount(values) {
  const map = new Map();
  for (const v of values) {
    const key = String(v || "").trim();
    if (!key) continue;
    map.set(key, (map.get(key) || 0) + 1);
  }
  let best = null;
  let bestN = 0;
  for (const [k, n] of map) {
    if (n > bestN) {
      best = k;
      bestN = n;
    }
  }
  return best;
}

function shiftYm(ym, delta) {
  const m = String(ym || "").match(/^(\d{4})-(\d{2})$/);
  if (!m) return ym;
  let year = Number(m[1]);
  let month = Number(m[2]) + delta;
  while (month < 1) {
    month += 12;
    year -= 1;
  }
  while (month > 12) {
    month -= 12;
    year += 1;
  }
  return `${year}-${String(month).padStart(2, "0")}`;
}

/**
 * @param {object} payload - API response from getMonthInFood
 */
export function buildMonthInFoodModel(payload = {}) {
  const diaryVisible = payload.diary_visible !== false;
  const diary = diaryVisible ? payload.diary || [] : [];
  const wants = payload.wants || [];
  const plans = payload.plans || [];
  const events = payload.events || [];
  const profileMedia = payload.profile_media || [];
  const isSelf = payload.is_self === true;
  const ym = payload.ym || "";
  const monthLabel = payload.month_label || ym;

  const mealsLogged = diary.length;
  const restaurantIds = new Set();
  const restaurantMap = new Map();
  let mediaMealCount = 0;
  const momentUrls = [];
  const foodNames = [];
  const drinkNames = [];
  const cuisineCounts = new Map();
  let coffeeCups = 0;

  for (const row of diary) {
    const name = row.food_name || row.item_name || "";
    if (name) foodNames.push(name);
    if (DRINK_RE.test(name)) drinkNames.push(name);
    if (COFFEE_RE.test(name)) coffeeCups += 1;

    if (row.restaurant_id) {
      restaurantIds.add(Number(row.restaurant_id));
      if (!restaurantMap.has(Number(row.restaurant_id))) {
        restaurantMap.set(Number(row.restaurant_id), {
          restaurant_id: Number(row.restaurant_id),
          name: row.restaurant_name || "Restaurant",
          place: [row.restaurant_city, row.restaurant_state].filter(Boolean).join(", "),
          image: mediaUrl(row.restaurant_logo_url || row.photo_url),
          slug: row.restaurant_slug || null,
        });
      }
    } else if (/homemade/i.test(String(row.comment || "")) || /homemade/i.test(name)) {
      restaurantIds.add("homemade");
    }

    const cuisine = String(row.cuisine || "").trim();
    if (cuisine) {
      cuisineCounts.set(cuisine, (cuisineCounts.get(cuisine) || 0) + 1);
    }

    const img = mediaUrl(row.photo_url || row.video_url);
    if (img || row.video_url) {
      mediaMealCount += 1;
      if (img) momentUrls.push({ key: `d-${row.id}`, url: img, label: name });
    }
  }

  for (const m of profileMedia) {
    if (m.media_kind === "photo" || !m.media_kind) {
      const url = mediaUrl(m.media_url);
      if (url) momentUrls.push({ key: `p-${m.id}`, url, label: "Moment" });
    }
  }

  const momentsShared = Number(payload.food_activity_count) || 0;
  const likesInMonth = Number(payload.likes_in_month) || 0;
  const newRestaurants = Number(payload.new_restaurants_count) || 0;

  const stats = [];
  if (diaryVisible) {
    stats.push({ id: "meals", label: "Meals Logged", value: mealsLogged, icon: "fork" });
    stats.push({ id: "restaurants", label: "Restaurants", value: restaurantIds.size, icon: "store" });
    stats.push({ id: "media", label: "Photos & Videos", value: mediaMealCount, icon: "camera" });
    if (momentsShared > 0) {
      stats.push({ id: "moments", label: "Moments Shared", value: momentsShared, icon: "people" });
    }
    if (likesInMonth > 0) {
      stats.push({ id: "favorites", label: "New Favorites", value: likesInMonth, icon: "flame" });
    }
  }

  const withMedia = diary
    .map((row) => ({
      key: `h-${row.id}`,
      label: row.food_name || row.item_name || "Meal",
      sublabel: row.restaurant_name || "",
      image: mediaUrl(row.photo_url),
      href: row.href || (row.menu_item_id ? `/menu-items/${row.menu_item_id}` : null),
    }))
    .filter((c) => c.image);
  const highlights = (withMedia.length ? withMedia : diary.slice(0, 3).map((row) => ({
    key: `h-${row.id}`,
    label: row.food_name || row.item_name || "Meal",
    sublabel: row.restaurant_name || "",
    image: mediaUrl(row.photo_url),
    href: row.href || null,
  }))).slice(0, 3);

  const visited = [...restaurantMap.values()].slice(0, 12);

  const momentsVisible = momentUrls.slice(0, 6);
  const momentsOverflow = Math.max(0, momentUrls.length - momentsVisible.length);

  let mood = null;
  if (mealsLogged >= 3) {
    const distinctCuisines = cuisineCounts.size;
    const moodLabel =
      distinctCuisines >= 3 ? "Adventurous" : distinctCuisines >= 2 ? "Curious" : "Comfort";
    mood = {
      label: moodLabel,
      mostLogged: modeCount(foodNames.filter((n) => !DRINK_RE.test(n))) || modeCount(foodNames),
      drinkOfChoice: modeCount(drinkNames),
      goToSpot: modeCount([...restaurantMap.values()].map((r) => r.place || r.name)),
    };
  }

  const cuisineTotal = [...cuisineCounts.values()].reduce((a, b) => a + b, 0);
  let cuisineSlices = [];
  if (cuisineTotal > 0 && cuisineCounts.size >= 2) {
    cuisineSlices = [...cuisineCounts.entries()]
      .map(([name, count]) => ({
        name,
        count,
        pct: Math.round((count / cuisineTotal) * 100),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  const miniStats = [];
  if (coffeeCups > 0) miniStats.push({ id: "coffee", label: "Cups", value: coffeeCups, hint: "coffee" });
  if (newRestaurants > 0) miniStats.push({ id: "new_r", label: "New Restaurants", value: newRestaurants });

  const heroImage =
    mediaUrl(diary.find((d) => d.photo_url)?.photo_url) ||
    mediaUrl(profileMedia.find((m) => m.media_url)?.media_url) ||
    null;

  const wantCards = wants.slice(0, 8).map((w) => ({
    key: `w-${w.id}`,
    food_name: w.food_name,
    restaurant_name: w.restaurant_name,
    photo_url: mediaUrl(w.photo_url),
    href: w.menu_item_id ? `/menu-items/${w.menu_item_id}` : null,
  }));

  return {
    ym,
    monthLabel,
    prevYm: shiftYm(ym, -1),
    nextYm: shiftYm(ym, 1),
    isSelf,
    diaryVisible,
    subject: payload.subject || null,
    tagline: "Great food. Good people. Unforgettable moments.",
    heroImage,
    stats,
    highlights,
    visited,
    moments: momentsVisible,
    momentsOverflow,
    mood,
    cuisineSlices,
    totalMeals: mealsLogged,
    miniStats,
    wants: wantCards,
    plans: plans.slice(0, 3),
    events: events.slice(0, 3),
    showEmptyHint: diaryVisible && mealsLogged === 0 && wants.length === 0,
  };
}

export { shiftYm };
