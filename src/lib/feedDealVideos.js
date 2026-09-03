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
    discount_label: formatDealDiscountLabel(deal),
    feed_promoted: deal.feed_promoted === true,
    restaurant_href:
      restaurantPath({ slug, city, state }) ||
      (deal.restaurant_id ? `/restaurants/${encodeURIComponent(String(deal.restaurant_id))}` : null),
    deal_href: dealId ? `/deals/${dealId}` : "/deals",
  };
}

export function mapDealsToFeedVideoItems(deals) {
  return (Array.isArray(deals) ? deals : [])
    .map(mapDealRowToFeedVideoItem)
    .filter(Boolean);
}
