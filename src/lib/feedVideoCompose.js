/**
 * Feed shell video posts — I'm Eating / Wanna Eat only; public when video attaches.
 */

import {
  createWantToEat,
  createWhatIAteMeal,
  uploadWantToEatPhoto,
  uploadWhatIAteTodayPhoto,
  uploadEatingPlanMedia,
  updateWhatWeDoingSession,
  whatIAteTodayLocalDate,
} from "./consumerApi.js";
import { createGuestFeedVideo, uploadGuestFeedVideoPhoto } from "./guestFeedVideoApi.js";
import { eatingMediaFromUpload, isVideoFile } from "./eatingMediaUtils.js";
import { defaultWhatIAteMealPeriod } from "./whatIAteTodayMealPeriod.js";
import { createHomemadeDish } from "./homemadeDishApi.js";
import { buildGuestPublicationLegalPayload } from "./legalConsent.js";
import { eatingFoodName, joinHomemadeComment } from "./eatingPlaceLink.js";

export async function postFeedAteVideo({
  file,
  text = "",
  mealPeriod,
  homemade = false,
  restaurant = null,
  dish = null,
  isRecommend = false,
  feedPresentationKind = "ate",
  items = null,
  whereType = null,
  onUploadProgress,
}) {
  void feedPresentationKind;
  if (!file || !isVideoFile(file)) {
    throw new Error("Feed posts need a video");
  }
  const up = await uploadWhatIAteTodayPhoto(file, { onProgress: onUploadProgress });
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

  const resolvedWhere =
    whereType === "home" || whereType === "restaurant"
      ? whereType
      : homemade
        ? "home"
        : restaurantId
          ? "restaurant"
          : "home";

  const mealItems =
    Array.isArray(items) && items.length > 0
      ? items
          .map((item, index) => ({
            food_name: String(item.food_name || item.foodName || "").trim(),
            menu_item_id: item.menu_item_id ?? item.menuItemId ?? (index === 0 ? menuItemId : null),
            restaurant_id:
              item.restaurant_id ?? item.restaurantId ?? (index === 0 ? restaurantId : null),
            is_recommend:
              index === 0 ? Boolean(isRecommend && (restaurantId || menuItemId)) : false,
            market_discoverable: true,
          }))
          .filter((item) => item.food_name)
      : [
          {
            food_name: foodName,
            menu_item_id: menuItemId,
            restaurant_id: restaurantId,
            is_recommend: Boolean(isRecommend && (restaurantId || menuItemId)),
            market_discoverable: true,
          },
        ];

  if (!mealItems.length) {
    throw new Error("Add at least one food item");
  }

  const data = await createWhatIAteMeal({
    where_type: resolvedWhere,
    restaurant_id: resolvedWhere === "restaurant" ? restaurantId : null,
    meal_period: mealPeriod || defaultWhatIAteMealPeriod(),
    eaten_on: whatIAteTodayLocalDate(),
    eaten_at: new Date().toISOString(),
    photo_url,
    video_url,
    comment: homemade || resolvedWhere === "home" ? joinHomemadeComment(true, note) : note || undefined,
    items: mealItems,
  });

  return data?.entry || data?.items?.[0] || data;
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
  onUploadProgress,
}) {
  if (!file || !isVideoFile(file)) {
    throw new Error("Feed posts need a video");
  }
  const up = await uploadWantToEatPhoto(file, { onProgress: onUploadProgress });
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

export async function postFeedCookingVideo({ file, text = "", onUploadProgress }) {
  if (!file || !isVideoFile(file)) {
    throw new Error("Feed posts need a video");
  }
  const up = await uploadWhatIAteTodayPhoto(file, { onProgress: onUploadProgress });
  const { photo_url, video_url } = eatingMediaFromUpload(up);
  if (!video_url) throw new Error("Could not upload video");

  const name = String(text || "").trim() || "What's Cooking @home";
  const created = await createHomemadeDish({
    name,
    description: String(text || "").trim() || null,
    photo_url: photo_url || null,
    video_url,
    visibility: "public",
    market_discoverable: true,
  });
  return created?.dish || created;
}

async function uploadGuestFeedMedia(file, onUploadProgress) {
  const up = await uploadGuestFeedVideoPhoto(file, { onProgress: onUploadProgress });
  return eatingMediaFromUpload(up);
}

export async function postGuestFeedAteVideo(payload, { legalConsent, onUploadProgress } = {}) {
  if (!payload?.file || !isVideoFile(payload.file)) {
    throw new Error("Feed posts need a video");
  }
  const { photo_url, video_url } = await uploadGuestFeedMedia(
    payload.file,
    onUploadProgress || payload.onUploadProgress
  );
  if (!video_url) throw new Error("Could not upload video");

  const homemade = Boolean(payload.homemade);
  const restaurantId = homemade ? null : payload.restaurant?.restaurant_id || payload.dish?.restaurant_id;
  const menuItemId = homemade ? null : payload.dish?.menu_item_id;
  const note = String(payload.text || "").trim();
  const foodName = homemade
    ? note || "Homemade"
    : String(payload.dish?.item_name || "").trim() ||
      String(payload.restaurant?.restaurant_name || "").trim() ||
      note ||
      "Food";

  return createGuestFeedVideo({
    kind: "ate",
    ...buildGuestPublicationLegalPayload(),
    ...(legalConsent || {}),
    food_name: foodName,
    photo_url,
    video_url,
    eaten_on: whatIAteTodayLocalDate(),
    meal_period: payload.mealPeriod || defaultWhatIAteMealPeriod(),
    restaurant_id: restaurantId || undefined,
    menu_item_id: menuItemId || undefined,
    comment: homemade ? joinHomemadeComment(true, note) : note || undefined,
    is_recommend: Boolean(payload.isRecommend && (restaurantId || menuItemId)),
  });
}

export async function postGuestFeedReviewVideo(payload, options = {}) {
  const menuItemId = payload?.dish?.menu_item_id;
  if (!menuItemId) {
    throw new Error("Reviews require a menu item");
  }
  return postGuestFeedAteVideo(
    {
      ...payload,
      homemade: false,
      isRecommend: false,
    },
    options
  );
}

export async function postGuestFeedWantVideo(payload, { legalConsent, onUploadProgress } = {}) {
  if (!payload?.file || !isVideoFile(payload.file)) {
    throw new Error("Feed posts need a video");
  }
  const { photo_url, video_url } = await uploadGuestFeedMedia(
    payload.file,
    onUploadProgress || payload.onUploadProgress
  );
  if (!video_url) throw new Error("Could not upload video");

  const homemade = Boolean(payload.homemade);
  const restaurantId = homemade ? null : payload.restaurant?.restaurant_id || payload.dish?.restaurant_id;
  const menuItemId = homemade ? null : payload.dish?.menu_item_id;
  const name =
    eatingFoodName({
      text: payload.text,
      dish: payload.dish,
      restaurant: payload.restaurant,
      homemade,
    }) ||
    String(payload.text || "").trim() ||
    "Wanna eat";

  return createGuestFeedVideo({
    kind: "want",
    ...buildGuestPublicationLegalPayload(),
    ...(legalConsent || {}),
    food_name: name,
    photo_url,
    video_url,
    restaurant_id: restaurantId || undefined,
    menu_item_id: menuItemId || undefined,
    comment: homemade ? joinHomemadeComment(true, payload.text) : undefined,
  });
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
