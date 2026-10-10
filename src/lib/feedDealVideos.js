/**
 * Feed Deals video reel — maps GET /deals rows to swipe items.
 * Contract for restaurant deal video upload (see docs/handoffs).
 */

import { restaurantPath } from "./canonicalUrlCore.js";
import { formatDealMealPeriodLabels, formatMealTimeDealCaption, normalizeDealMealPeriodList } from "./dealMealPeriods.js";

export function formatDealDiscountLabel(deal) {
  if (!deal) return "";
  if (deal.deal_type === "percent_off" && deal.discount_percent != null) {
    return `${deal.discount_percent}% off`;
  }
  if (deal.deal_type === "amount_off" && deal.discount_amount_cents != null) {
    return `$${(Number(deal.discount_amount_cents) / 100).toFixed(2)} off`;
  }
  if (deal.deal_type === "fixed_price" && deal.fixed_price_cents != null) {
    return `$${(Number(deal.fixed_price_cents) / 100).toFixed(2)}`;
  }
  if (deal.discount_value) return String(deal.discount_value);
  return "";
}

/** Active deal row with non-empty video_url → Feed swipe item. */
export function mapDealRowToFeedVideoItem(deal) {
  const videoUrl = String(deal?.video_url || "").trim();
  if (!videoUrl) return null;
  const dealId = deal.deal_id || deal.id;
  const slug = deal.restaurant_slug || null;
  const city = deal.city || deal.restaurant_city || null;
  const state = deal.state || deal.restaurant_state || null;
  const mealPeriods = normalizeDealMealPeriodList(deal.meal_periods);
  const showMealTimeCaption = deal.show_meal_time_caption === true;
  const mealTimeCaption =
    showMealTimeCaption && mealPeriods.length
      ? formatMealTimeDealCaption(mealPeriods)
      : null;
  const title = String(deal.title || "").trim() || "Deal";
  return {
    id: String(dealId),
    deal_id: dealId,
    video_url: videoUrl,
    title,
    meal_time_caption: mealTimeCaption,
    headline: mealTimeCaption || title,
    description: String(deal.description || "").trim(),
    restaurant_name: String(deal.restaurant_name || "").trim() || "Restaurant",
    restaurant_id: deal.restaurant_id || null,
    restaurant_slug: slug,
    city,
    state,
    meal_periods: mealPeriods,
    meal_period_labels: formatDealMealPeriodLabels(mealPeriods),
    menu_item_name: String(deal.menu_item_name || "").trim(),
    menu_item_id: deal.menu_item_id != null ? deal.menu_item_id : null,
    // Menu items the deal applies to (same terms on each), in order; first = menu_item_id.
    eligible_item_names: (Array.isArray(deal.eligible_items) ? deal.eligible_items : [])
      .map((i) => String(i?.name || "").trim())
      .filter(Boolean),
    discount_label: formatDealDiscountLabel(deal),
    feed_promoted: deal.feed_promoted === true,
    // Video Manager "play muted": DealVideoSwipe forces mute + locks the sound toggle.
    play_muted: deal.play_muted === true,
    restaurant_href:
      restaurantPath({ slug, city, state }) ||
      (deal.restaurant_id ? `/restaurants/${encodeURIComponent(String(deal.restaurant_id))}` : null),
    deal_href: dealId ? `/deals/${dealId}` : "/deals",
  };
}

/**
 * Meal time SORTS deal videos, never hides them (Andre, 2026-10-09):
 * deals tagged with `mealPeriod` first, then all-day deals, then deals for other meals.
 * Random order within each group. "all" (or none) = plain random.
 */
export function orderDealVideosForMeal(items, mealPeriod, shuffle = shuffleList) {
  const list = Array.isArray(items) ? items : [];
  if (!mealPeriod || mealPeriod === "all") return shuffle(list);
  const groups = [[], [], []];
  for (const item of list) {
    const periods = Array.isArray(item?.meal_periods) ? item.meal_periods : [];
    groups[periods.includes(mealPeriod) ? 0 : periods.length === 0 ? 1 : 2].push(item);
  }
  return groups.flatMap((g) => shuffle(g));
}

function shuffleList(list) {
  const next = [...list];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

export function mapDealsToFeedVideoItems(deals) {
  return (Array.isArray(deals) ? deals : [])
    .map(mapDealRowToFeedVideoItem)
    .filter(Boolean);
}
