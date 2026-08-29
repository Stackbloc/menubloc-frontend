/**
 * Feed shell video posts — I'm Eating / Wanna Eat only; public when video attaches.
 */

import {
  createWantToEat,
  createWhatIAteToday,
  uploadWantToEatPhoto,
  uploadWhatIAteTodayPhoto,
  uploadEatingPlanMedia,
  updateWhatWeDoingSession,
  whatIAteTodayLocalDate,
} from "./consumerApi.js";
import { eatingMediaFromUpload, isVideoFile } from "./eatingMediaUtils.js";
import { defaultWhatIAteMealPeriod } from "./whatIAteTodayMealPeriod.js";
import { eatingFoodName, joinHomemadeComment } from "../pages/consumer/myMenuply/eatingPlaceLink.js";

export async function postFeedAteVideo({
  file,
  text = "",
  mealPeriod,
  homemade = false,
  restaurant = null,
  dish = null,
  isRecommend = false,
  feedPresentationKind = "ate",
}) {
  if (!file || !isVideoFile(file)) {
    throw new Error("Feed posts need a video");
  }
  const up = await uploadWhatIAteTodayPhoto(file);
  const { photo_url, video_url } = eatingMediaFromUpload(up);
  if (!video_url) throw new Error("Could not upload video");

  const restaurantId = homemade ? null : restaurant?.restaurant_id || dish?.restaurant_id || undefined;
  const menuItemId = homemade ? null : dish?.menu_item_id || undefined;
  const note = String(text || "").trim();
  const foodName = homemade
    ? note || "Homemade"
    : String(dish?.item_name || "").trim() ||
      String(restaurant?.restaurant_name || "").trim() ||
      note ||
      "Food";

  const data = await createWhatIAteToday({
    food_name: foodName,
    photo_url,
    video_url,
    eaten_on: whatIAteTodayLocalDate(),
    meal_period: mealPeriod || defaultWhatIAteMealPeriod(),
    restaurant_id: restaurantId,
    menu_item_id: menuItemId,
    is_recommend: Boolean(isRecommend && (restaurantId || menuItemId)),
    comment: homemade ? joinHomemadeComment(true, note) : note || undefined,
    market_discoverable: true,
    feed_presentation_kind:
      feedPresentationKind === "review" || feedPresentationKind === "reviews"
        ? "review"
        : "ate",
  });

  return data?.entry || data;
}

export async function postFeedReviewVideo(payload) {
  const menuItemId = payload?.dish?.menu_item_id;
  if (!menuItemId) {
    throw new Error("Reviews require a menu item");
  }
  return postFeedAteVideo({
    ...payload,
    homemade: false,
    feedPresentationKind: "review",
    isRecommend: false,
  });
}

export async function postFeedWantVideo({
  file,
  text = "",
  homemade = false,
  restaurant = null,
  dish = null,
}) {
  if (!file || !isVideoFile(file)) {
    throw new Error("Feed posts need a video");
  }
  const up = await uploadWantToEatPhoto(file);
  const { photo_url, video_url } = eatingMediaFromUpload(up);
  if (!video_url) throw new Error("Could not upload video");

  const restaurantId = homemade ? null : restaurant?.restaurant_id || dish?.restaurant_id || undefined;
  const menuItemId = homemade ? null : dish?.menu_item_id || undefined;
  const name =
    eatingFoodName({ text, dish, restaurant, homemade }) ||
    String(text || "").trim() ||
    "Wanna eat";

  const data = await createWantToEat({
    food_name: name,
    photo_url,
    video_url,
    market_discoverable: true,
    restaurant_id: restaurantId,
    menu_item_id: menuItemId,
    intent_kind: restaurantId || menuItemId ? undefined : "food_item",
    comment: homemade ? joinHomemadeComment(true, text) : undefined,
  });

  return data?.item || data;
}

export const FEED_VIDEO_POSTED_EVENT = "menuply:feed-video-posted";

export function notifyFeedVideoPosted() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(FEED_VIDEO_POSTED_EVENT));
}

export async function attachPlanVideo(tokenOrId, file) {
  if (!file || !isVideoFile(file)) {
    throw new Error("Plan Feed videos must be a video clip");
  }
  const up = await uploadEatingPlanMedia(file);
  const { photo_url, video_url } = eatingMediaFromUpload(up);
  if (!video_url) throw new Error("Could not upload plan video");
  return updateWhatWeDoingSession(tokenOrId, {
    video_url,
    photo_url: photo_url || null,
    market_discoverable: true,
  });
}
