/**
 * Shape Month in Food API payload into a view model. Never invent stats.
 * Keeps vocabulary + rails in sync with My Menuply profile
 * (Wanna Eat / Take Me Out, Join Me plans, unified meal Where @home vs restaurant).
 */

import { restaurantPathFromRow } from "../../../lib/canonicalUrl.js";

const DEFAULT_MEDIA_BASE = "https://menubloc-backend-production.up.railway.app";

const DRINK_RE =
  /\b(latte|coffee|espresso|cappuccino|matcha|tea|smoothie|juice|cola|soda|beer|wine|cocktail|coolatta|refresher)\b/i;
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

function restaurantHref(row) {
  return restaurantPathFromRow(row) || (row?.restaurant_id ? `/restaurants/${row.restaurant_id}` : null);
}

export function isHomeMeal(row = {}) {
  if (row.is_home === true) return true;
  if (String(row.where_type || "").toLowerCase() === "home") return true;
  if (row.homemade_dish_id != null) return true;
  if (row.restaurant_id != null) return false;
  const blob = `${row.food_name || ""} ${row.comment || ""} ${row.homemade_dish_name || ""}`;
  return /\bhomemade\b|\b@home\b|\bat home\b/i.test(blob);
}

/** Group flat diary items into meal occasions (legacy null meal_id = singleton). */
export function groupDiaryMealsForModel(diary = []) {
  const list = Array.isArray(diary) ? diary : [];
  const byMeal = new Map();
  const meals = [];
  for (const entry of list) {
    const mid = entry?.meal_id != null ? Number(entry.meal_id) : null;
    if (mid && Number.isFinite(mid)) {
      if (!byMeal.has(mid)) {
        const meal = {
          id: mid,
          eaten_on: entry.eaten_on,
          meal_period: entry.meal_period || null,
          where_type: entry.where_type || null,
          is_home: isHomeMeal(entry),
          restaurant_id: entry.restaurant_id || null,
          items: [],
        };
        byMeal.set(mid, meal);
        meals.push(meal);
      }
      const meal = byMeal.get(mid);
      meal.items.push(entry);
      if (isHomeMeal(entry)) meal.is_home = true;
      continue;
    }
    meals.push({
      id: null,
      singleton_entry_id: entry.id,
      eaten_on: entry.eaten_on,
      meal_period: entry.meal_period || null,
      where_type: entry.where_type || null,
      is_home: isHomeMeal(entry),
      restaurant_id: entry.restaurant_id || null,
      items: [entry],
    });
  }
  return meals;
}

/** Pinned profile photos first (profile Top Highlights contract), then diary stills. */
function buildHighlights({ diary = [], profileMedia = [] }) {
  const cards = [];
  const usedImages = new Set();

  for (const m of profileMedia) {
    if (cards.length >= 3) break;
    if (m.is_highlight !== true) continue;
    if (m.media_kind && m.media_kind !== "photo") continue;
    const image = mediaUrl(m.media_url);
    if (!image || usedImages.has(image)) continue;
    cards.push({
      key: `ph-${m.id}`,
      label: "Profile photo",
      sublabel: "From your gallery",
      image,
      href: null,
      source: "profile_highlight",
    });
    usedImages.add(image);
  }

  const withMedia = diary
    .map((row) => ({
      key: `h-${row.id}`,
      label: row.food_name || row.item_name || row.homemade_dish_name || "Meal",
      sublabel: isHomeMeal(row) ? "@Home" : row.restaurant_name || "",
      image: mediaUrl(row.photo_url),
      href: row.href || (row.menu_item_id ? `/menu-items/${row.menu_item_id}` : null),
      source: "diary",
      is_home: isHomeMeal(row),
    }))
    .filter((c) => c.image);

  for (const card of withMedia) {
    if (cards.length >= 3) break;
    if (card.image && usedImages.has(card.image)) continue;
    cards.push(card);
    if (card.image) usedImages.add(card.image);
  }

  if (cards.length) return cards.slice(0, 3);

  return diary.slice(0, 3).map((row) => ({
    key: `h-${row.id}`,
    label: row.food_name || row.item_name || "Meal",
    sublabel: isHomeMeal(row) ? "@Home" : row.restaurant_name || "",
    image: mediaUrl(row.photo_url),
    href: row.href || null,
    source: "diary",
    is_home: isHomeMeal(row),
  }));
}

/**
 * @param {object} payload - API response from getMonthInFood
 */
export function buildMonthInFoodModel(payload = {}) {
  const diaryVisible = payload.diary_visible !== false;
  const diary = diaryVisible ? payload.diary || [] : [];
  const mealsFromApi = diaryVisible && Array.isArray(payload.meals) ? payload.meals : null;
  const mealOccasions = mealsFromApi || groupDiaryMealsForModel(diary);
  const wants = payload.wants || [];
  const diningIntents = payload.dining_intents || [];
  const plans = payload.plans || [];
  const events = payload.events || [];
  const profileMedia = payload.profile_media || [];
  const isSelf = payload.is_self === true;
  const ym = payload.ym || "";
  const monthLabel = payload.month_label || ym;
  const takeMeOutOpen =
    payload.take_me_out_open === true ||
    (payload.invite_me_out_audience != null &&
      String(payload.invite_me_out_audience || "none").toLowerCase() !== "none");
  const plansJoinDefault = false;
  const eventsJoinDefault = false;
  const crewsJoinDefault = Boolean(payload.diner_social_defaults?.crews_join_me?.open);

  const mealsLogged = Number.isFinite(Number(payload.meals_count))
    ? Number(payload.meals_count)
    : mealOccasions.length;
  const restaurantIds = new Set();
  const restaurantMap = new Map();
  const homeMeals = [];
  let mediaMealCount = 0;
  const momentUrls = [];
  const foodNames = [];
  const drinkNames = [];
  const cuisineCounts = new Map();
  let coffeeCups = 0;
  let snackOtherCount = 0;

  for (const meal of mealOccasions) {
    const items = Array.isArray(meal.items) && meal.items.length ? meal.items : [meal];
    const home = meal.is_home === true || items.some((row) => isHomeMeal(row));
    const period = String(meal.meal_period || items[0]?.meal_period || "").toLowerCase();
    if (period === "snack" || period === "other") snackOtherCount += 1;

    if (home) {
      const names = items
        .map((row) => row.food_name || row.item_name || row.homemade_dish_name || "")
        .filter(Boolean);
      const first = items[0] || {};
      homeMeals.push({
        key: `home-${meal.id || first.id || names.join("-")}`,
        food_name: names.join(" · ") || "Home meal",
        portion_amount: first.portion_amount ?? null,
        portion_unit: first.portion_unit || null,
        meal_period: meal.meal_period || first.meal_period || null,
        photo_url: mediaUrl(
          items.find((r) => r.photo_url || r.item_photo_url)?.photo_url ||
            items.find((r) => r.item_photo_url)?.item_photo_url
        ),
        href: first.href || null,
        eaten_on: meal.eaten_on || first.eaten_on || null,
      });
    } else if (meal.restaurant_id || items.some((r) => r.restaurant_id)) {
      const restRow = items.find((r) => r.restaurant_id) || meal;
      restaurantIds.add(Number(restRow.restaurant_id));
      if (!restaurantMap.has(Number(restRow.restaurant_id))) {
        restaurantMap.set(Number(restRow.restaurant_id), {
          restaurant_id: Number(restRow.restaurant_id),
          name: restRow.restaurant_name || "Restaurant",
          place: [restRow.restaurant_city, restRow.restaurant_state].filter(Boolean).join(", "),
          image: mediaUrl(restRow.restaurant_logo_url || restRow.photo_url || restRow.item_photo_url),
          slug: restRow.restaurant_slug || null,
        });
      }
    }

    for (const row of items) {
      const name = row.food_name || row.item_name || row.homemade_dish_name || "";
      if (name) foodNames.push(name);
      if (DRINK_RE.test(name)) drinkNames.push(name);
      if (COFFEE_RE.test(name)) coffeeCups += 1;
      const cuisine = String(row.cuisine || "").trim();
      if (cuisine) {
        cuisineCounts.set(cuisine, (cuisineCounts.get(cuisine) || 0) + 1);
      }
      const img = mediaUrl(row.photo_url || row.item_photo_url);
      if (img || row.video_url) {
        mediaMealCount += 1;
        if (img) momentUrls.push({ key: `d-${row.id}`, url: img, label: name });
      }
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
  const homemadeDishesCount = Number(payload.homemade_dishes_count) || 0;
  const homeMealsCount = Number.isFinite(Number(payload.home_meals_count))
    ? Number(payload.home_meals_count)
    : mealOccasions.filter((m) => m.is_home === true || (m.items || []).some((r) => isHomeMeal(r)))
        .length;
  const restaurantDishesCount = Number.isFinite(Number(payload.restaurant_dishes_count))
    ? Number(payload.restaurant_dishes_count)
    : mealOccasions.filter(
        (m) =>
          !(m.is_home === true || (m.items || []).some((r) => isHomeMeal(r))) &&
          (m.restaurant_id != null || (m.items || []).some((r) => r.restaurant_id != null))
      ).length;

  const stats = [];
  if (diaryVisible) {
    const dishesCount = restaurantDishesCount + homemadeDishesCount;
    stats.push({ id: "meals", label: "Meals Logged", value: mealsLogged, icon: "fork" });
    stats.push({ id: "dishes", label: "Dishes", value: dishesCount, icon: "dishes" });
    stats.push({ id: "restaurants", label: "Restaurants", value: restaurantIds.size, icon: "store" });
    if (homeMealsCount > 0) {
      stats.push({ id: "home", label: "@Home Meals", value: homeMealsCount, icon: "home" });
    }
    stats.push({ id: "media", label: "Photos & Videos", value: mediaMealCount, icon: "camera" });
    if (momentsShared > 0) {
      stats.push({ id: "moments", label: "Moments Shared", value: momentsShared, icon: "people" });
    }
    if (likesInMonth > 0) {
      stats.push({ id: "favorites", label: "New Favorites", value: likesInMonth, icon: "flame" });
    }
  }

  const highlights = diaryVisible ? buildHighlights({ diary, profileMedia }) : [];
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
  if (homeMealsCount > 0) miniStats.push({ id: "home_m", label: "@Home", value: homeMealsCount });
  if (snackOtherCount > 0) {
    miniStats.push({ id: "snack_other", label: "Snacks & Other", value: snackOtherCount });
  }

  const pinnedHero = profileMedia.find((m) => m.is_highlight && m.media_url);
  const heroImage =
    mediaUrl(pinnedHero?.media_url) ||
    mediaUrl(diary.find((d) => d.photo_url)?.photo_url) ||
    mediaUrl(profileMedia.find((m) => m.media_url)?.media_url) ||
    null;

  const intentCards = diningIntents.slice(0, 8).map((w) => ({
    key: `di-${w.id}`,
    kind: "dining_intent",
    food_name: w.food_name || w.restaurant_name || "Wanna Go!",
    restaurant_name: [w.city, w.state].filter(Boolean).join(", ") || null,
    photo_url: mediaUrl(w.photo_url),
    badge: w.badge || "Wanna Go!",
    href: restaurantHref(w),
  }));
  const wantBudget = Math.max(0, 8 - intentCards.length);
  const wantCards = wants.slice(0, wantBudget).map((w) => ({
    key: `w-${w.id}`,
    kind: "want",
    food_name: w.food_name,
    restaurant_name: w.restaurant_name,
    photo_url: mediaUrl(w.photo_url),
    badge: null,
    href: w.menu_item_id ? `/menu-items/${w.menu_item_id}` : null,
  }));
  const cravingCards = [...intentCards, ...wantCards];

  const planCards = plans.slice(0, 3).map((p) => ({
    ...p,
    joinable: p.joinable === true,
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
    homeMeals: homeMeals.slice(0, 8),
    moments: momentsVisible,
    momentsOverflow,
    mood,
    cuisineSlices,
    totalMeals: mealsLogged,
    homemadeDishesCount,
    homeMealsCount,
    restaurantDishesCount: Number.isFinite(restaurantDishesCount) ? restaurantDishesCount : null,
    miniStats,
    wants: cravingCards,
    plans: planCards,
    events: events.slice(0, 3),
    takeMeOutOpen: Boolean(takeMeOutOpen),
    plansJoinDefault,
    eventsJoinDefault,
    crewsJoinDefault,
    showEmptyHint:
      diaryVisible && mealsLogged === 0 && wants.length === 0 && diningIntents.length === 0,
  };
}

export { shiftYm };
