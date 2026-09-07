/**
 * Feed video share payloads — menuply.com locked deep links.
 */

import { normalizeConsumerShareUrl } from "../components/share/shareUtils.js";
import {
  appendMenuplyAccountInviteToShareText,
  invitePathFromShareUrl,
} from "./menuplyAccountInvite.js";
import { liveFeedPosterDisplayName } from "./liveFeedCategory.js";

export function feedClipQueryParam(clipId) {
  return String(clipId || "").trim();
}

export function feedClipSharePath(clipId) {
  const id = feedClipQueryParam(clipId);
  if (!id) return "";
  return `/feed?clip=${encodeURIComponent(id)}`;
}

export function feedClipShareUrl(clipId) {
  const path = feedClipSharePath(clipId);
  if (!path) return "";
  return normalizeConsumerShareUrl(path) || "";
}

/**
 * @param {{ id?: string, kind?: string, item_name?: string, food_name?: string, diner?: object, creator?: object }} item
 */
export function buildFeedVideoShareData(item) {
  const clipId = feedClipQueryParam(item?.id);
  const url = feedClipShareUrl(clipId);
  if (!url) return null;

  const poster = liveFeedPosterDisplayName(item) || "Someone on Menuply";
  const food = String(item?.item_name || item?.food_name || "").trim();
  const headline = food ? `${poster} on Menuply — ${food}` : `${poster} on Menuply`;
  const body = food
    ? `Watch ${poster}'s food video on Menuply${food ? `: ${food}` : ""}.`
    : `Watch ${poster}'s food video on Menuply.`;

  const text = appendMenuplyAccountInviteToShareText(`${body}\n${url}`.trim(), {
    nextPath: invitePathFromShareUrl(url),
  });

  return {
    title: headline,
    text,
    url,
  };
}

export function resolveFeedClipStartIndex(items, clipId) {
  const target = feedClipQueryParam(clipId);
  if (!target || !Array.isArray(items) || items.length === 0) return 0;
  const idx = items.findIndex((row) => feedClipQueryParam(row?.id) === target);
  return idx >= 0 ? idx : 0;
}

/** Feed Deals swipe deep link — /feed/deals?deal={dealId} */
export function feedDealQueryParam(dealId) {
  return String(dealId || "").trim();
}

export function feedDealSharePath(dealId) {
  const id = feedDealQueryParam(dealId);
  if (!id) return "";
  return `/feed/deals?deal=${encodeURIComponent(id)}`;
}

export function feedDealShareUrl(dealId) {
  const path = feedDealSharePath(dealId);
  if (!path) return "";
  return normalizeConsumerShareUrl(path) || "";
}

/**
 * @param {{ deal_id?: string, id?: string, title?: string, restaurant_name?: string }} item
 */
export function buildFeedDealShareData(item) {
  const dealId = feedDealQueryParam(item?.deal_id || item?.id);
  const url = feedDealShareUrl(dealId);
  if (!url) return null;
  const restaurant = String(item?.restaurant_name || "").trim();
  const title = String(item?.headline || item?.title || "Deal").trim() || "Deal";
  const headline = restaurant ? `${restaurant} — ${title}` : title;
  const body = restaurant
    ? `Check out this deal from ${restaurant} on Menuply: ${title}.`
    : `Check out this deal on Menuply: ${title}.`;
  const text = appendMenuplyAccountInviteToShareText(`${body}\n${url}`.trim(), {
    nextPath: invitePathFromShareUrl(url),
  });
  return { title: headline, text, url };
}

export function resolveFeedDealStartIndex(items, dealId) {
  const target = feedDealQueryParam(dealId);
  if (!target || !Array.isArray(items) || items.length === 0) return 0;
  const idx = items.findIndex(
    (row) => feedDealQueryParam(row?.deal_id || row?.id) === target
  );
  return idx >= 0 ? idx : 0;
}
