/**
 * Public advertisement API helpers.
 * Frontend requests by inventory_key (or page_region) — never hardcodes venue names.
 */

import { apiGet } from "./api.js";

/**
 * @param {string} inventoryKey
 * @param {{ clusterSlug: string, limit?: number }} options
 */
export function getAdvertisements(inventoryKey, { clusterSlug, limit = 1 } = {}) {
  if (!inventoryKey || !clusterSlug) {
    return Promise.resolve({ ok: true, advertisements: [], advertisement: null });
  }
  const qs = new URLSearchParams({
    inventory_key: String(inventoryKey),
    cluster_slug: String(clusterSlug),
    limit: String(limit),
  });
  return apiGet(`/public/advertisements?${qs.toString()}`);
}

export function getAdvertisementByRegion(pageRegion, { clusterSlug, limit = 1 } = {}) {
  if (!pageRegion || !clusterSlug) {
    return Promise.resolve({ ok: true, advertisements: [], advertisement: null });
  }
  const qs = new URLSearchParams({
    page_region: String(pageRegion),
    cluster_slug: String(clusterSlug),
    limit: String(limit),
  });
  return apiGet(`/public/advertisements?${qs.toString()}`);
}

export function fetchClusterAdInventory(clusterSlug) {
  if (!clusterSlug) return Promise.resolve({ ok: true, inventory: [] });
  return apiGet(`/public/clusters/${encodeURIComponent(clusterSlug)}/ad-inventory`);
}
