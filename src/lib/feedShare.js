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
