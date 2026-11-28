/**
 * Feed Deals video reel — maps GET /deals rows to swipe items.
 * Contract for restaurant deal video upload (see docs/handoffs).
 */

import { restaurantPath } from "./canonicalUrlCore.js";
import { formatDealMealPeriodLabels, formatMealTimeDealCaption, normalizeDealMealPeriodList } from "./dealMealPeriods.js";

/** $9 for whole dollars, $9.50 otherwise. */
export function formatDealDollars(cents) {
  const n = Number(cents);
  return n % 100 === 0 ? `$${n / 100}` : `$${(n / 100).toFixed(2)}`;
}

export function formatDealDiscountLabel(deal) {
  if (!deal) return "";
  if (deal.deal_type === "percent_off" && deal.discount_percent != null) {
    return `${deal.discount_percent}% off`;
  }
  if (deal.deal_type === "amount_off" && deal.discount_amount_cents != null) {
    return `${formatDealDollars(deal.discount_amount_cents)} off`;
  }
  if (deal.deal_type === "fixed_price" && deal.fixed_price_cents != null) {
    return formatDealDollars(deal.fixed_price_cents);
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
    // Thumbnail as currently saved on the deal (SEO fields can change after upload).
    photo_url: String(deal.photo_url || "").trim() || null,
    title,
    meal_time_caption: mealTimeCaption,
    headline: mealTimeCaption || title,
    description: String(deal.description || "").trim(),
    // Days/hours the deal runs, e.g. "Mon–Fri · 11 AM–2 PM" (null = any time).
    schedule_label: deal.schedule_label ? String(deal.schedule_label) : null,
    restaurant_name: String(deal.restaurant_name || "").trim() || "Restaurant",
    restaurant_id: deal.restaurant_id || null,
    restaurant_slug: slug,
    city,
    state,
    meal_periods: mealPeriods,
    // "All day" would contradict set hours ("11 AM–2 PM"), so it's dropped when there are hours.
    meal_period_labels:
      !mealPeriods.length && deal.valid_start_time ? [] : formatDealMealPeriodLabels(mealPeriods),
    menu_item_name: String(deal.menu_item_name || "").trim(),
    menu_item_id: deal.menu_item_id != null ? deal.menu_item_id : null,
    // Menu items the deal applies to (same terms on each), in order; first = menu_item_id.
    eligible_item_names: (Array.isArray(deal.eligible_items) ? deal.eligible_items : [])
      .map((i) => String(i?.name || "").trim())
      .filter(Boolean),
    // Up to three dishes the deal video features → pinned under "From the video".
    menu_items: (Array.isArray(deal.eligible_items) ? deal.eligible_items : [])
      .map((i) => ({ id: i?.id ?? null, name: String(i?.name || "").trim() || null }))
      .filter((i) => i.id != null || i.name)
      .slice(0, 3),
    discount_label: formatDealDiscountLabel(deal),
    feed_promoted: deal.feed_promoted === true,
    // Video Manager "play muted": DealVideoSwipe forces mute + locks the sound toggle.
    play_muted: deal.play_muted === true,
    restaurant_href:
      restaurantPath({ slug, city, state }) ||
      (deal.restaurant_id ? `/restaurants/${encodeURIComponent(String(deal.restaurant_id))}` : null),
    deal_href: dealId ? `/deals/${dealId}` : "/feed/deals",
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

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "Reported Nov 27" (local date). */
export function reportedOnLabel(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `Reported ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

/**
 * Diner deal report (plan 78, Andre 2026-11-27): "informational use only", never a deal. Same reel item
 * shape with no deal id, no discount, no deal link, never Sponsored; shown with "User Reported" +
 * "Subject to restaurant confirmation" + the date. A restaurant not on Menuply shows its typed name, no link.
 */
export function mapDealReportToFeedVideoItem(row) {
  const videoUrl = String(row?.video_url || "").trim();
  if (!videoUrl || row?.informational !== true || row?.deal_report_id == null) return null;
  const listed = row.restaurant_listed === true;
  const slug = row.restaurant_slug || null;
  const city = row.city || null;
  const state = row.state || null;
  const dish = String(row.dish_name || "").trim();
  return {
    id: `report:${row.deal_report_id}`,
    deal_id: null,
    deal_report_id: row.deal_report_id,
    is_deal_report: true,
    clip_id: row.clip_id,
    reported_by: row.reported_by ?? null,
    report_label: row.label || "User Reported",
    report_disclaimer: row.disclaimer || "Subject to restaurant confirmation",
    reported_on: reportedOnLabel(row.reported_at),
    reported_at: row.reported_at || null,
    video_url: videoUrl,
    photo_url: String(row.photo_url || "").trim() || null,
    title: dish || "Deal report",
    meal_time_caption: null,
    headline: dish || "Deal report",
    description: String(row.description || "").trim(),
    schedule_label: null,
    restaurant_name: String(row.restaurant_name || "").trim() || "Restaurant",
    restaurant_id: listed ? row.restaurant_id : null,
    restaurant_slug: listed ? slug : null,
    city,
    state,
    meal_periods: [],
    meal_period_labels: [],
    menu_item_name: dish,
    menu_item_id: row.dish_listed === true ? row.menu_item_id : null,
    eligible_item_names: [],
    menu_items: row.dish_listed === true && row.menu_item_id != null ? [{ id: row.menu_item_id, name: dish || null }] : [],
    discount_label: "",
    feed_promoted: false,
    play_muted: false,
    poster_name: row.reporter_name || null,
    restaurant_href: listed
      ? restaurantPath({ slug, city, state }) || (row.restaurant_id ? `/restaurants/${encodeURIComponent(String(row.restaurant_id))}` : null)
      : null,
    deal_href: null,
  };
}

export function mapDealsToFeedVideoItems(deals, dealReports = []) {
  const items = (Array.isArray(deals) ? deals : [])
    .map(mapDealRowToFeedVideoItem)
    .filter(Boolean);
  const reports = (Array.isArray(dealReports) ? dealReports : [])
    .map(mapDealReportToFeedVideoItem)
    .filter(Boolean);
  return reports.length ? [...items, ...reports] : items;
}
