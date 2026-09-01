/**
 * Zero-account Feed video publish — ate / want / review-as-ate.
 * Uses api.js (Railway fallback) — never same-origin menuply.com HTML.
 */

import { apiPost, apiPostForm } from "./api.js";
import { getOrCreateGuestReporterKey } from "./guestReporterSession.js";

export async function uploadGuestFeedVideoPhoto(file) {
  const form = new FormData();
  form.append("photo", file);
  form.append("guest_key", getOrCreateGuestReporterKey());
  return apiPostForm("/public/feed-video/photo", form);
}

export async function createGuestFeedVideo(body = {}) {
  return apiPost("/public/feed-video", {
    ...body,
    guest_key: body.guest_key || getOrCreateGuestReporterKey(),
  });
}
