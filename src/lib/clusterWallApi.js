import { API_BASE, apiDelete, apiGet, apiPost } from "./api.js";

/** Cluster Wall API (backend src/routes/clusterWall.js). Reads work signed out. */

export function fetchClusterWall(clusterSlug, { week = null, cursor = null, limit = 40, signal } = {}) {
  const params = new URLSearchParams();
  if (week) params.set("week", week);
  if (cursor) params.set("cursor", cursor);
  if (limit) params.set("limit", String(limit));
  return apiGet(`/api/cluster-wall/clusters/${encodeURIComponent(clusterSlug)}?${params}`, { signal });
}

export function fetchClusterWallWeeks(clusterSlug, { signal } = {}) {
  return apiGet(`/api/cluster-wall/clusters/${encodeURIComponent(clusterSlug)}/weeks`, { signal });
}

export function fetchWallBlock(publicId, { signal } = {}) {
  return apiGet(`/api/cluster-wall/blocks/${encodeURIComponent(publicId)}`, { signal });
}

export function fetchMyWallBlocks({ signal } = {}) {
  return apiGet(`/api/cluster-wall/blocks/mine`, { signal });
}

export function createWallBlock(payload) {
  return apiPost(`/api/cluster-wall/blocks`, payload);
}

export function deleteWallBlock(publicId) {
  return apiDelete(`/api/cluster-wall/blocks/${encodeURIComponent(publicId)}`);
}

export function reportWallBlock(publicId, { reason, note } = {}) {
  return apiPost(`/api/cluster-wall/blocks/${encodeURIComponent(publicId)}/report`, { reason, note });
}

/** Absolute URL of a block's branded picture (share = 1080×1350). */
export function wallShareImageUrl(publicId, { download = false } = {}) {
  return `${API_BASE}/public/wall/${encodeURIComponent(publicId)}/share.png${download ? "?download=1" : ""}`;
}

/**
 * Clip upload: signed URL from the backend, then a direct PUT to storage with progress.
 * @returns {Promise<string>} storage_key to pass to createWallBlock as video_storage_key
 */
export async function uploadWallClip(file, { onProgress } = {}) {
  const grant = await apiPost(`/api/cluster-wall/video/sign`, {
    filename: file.name || "clip.mp4",
    content_type: file.type || "video/mp4",
    byte_size: file.size,
  });
  await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(grant.upload_method || "PUT", grant.signed_url);
    for (const [k, v] of Object.entries(grant.upload_headers || {})) xhr.setRequestHeader(k, v);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(e.loaded / e.total);
    };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error("Upload failed. Try again.")));
    xhr.onerror = () => reject(new Error("Upload failed. Check your connection."));
    xhr.send(file);
  });
  return grant.storage_key;
}

export const WALL_REPORT_REASONS = Object.freeze([
  { value: "hateful", label: "Rude or hateful" },
  { value: "nudity_violence", label: "Nudity or violence" },
  { value: "impersonation", label: "Pretends to be someone" },
  { value: "not_food_spam", label: "Spam" },
  { value: "other", label: "Something else" },
]);
