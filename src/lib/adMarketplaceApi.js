/**
 * Advertising marketplace API (plan 22). Backend: /api/advertise.
 * The backend owns prices, holds and payment state; this file only asks.
 */

import { apiGet, apiPost } from "./api.js";

/** /advertise?step=… → the product sold on that step. */
export const STEP_PRODUCT = { deal: "deal_promo", billboards: "billboard", clip: "clip" };

export function fetchAdCatalog(cluster, { product } = {}) {
  const qs = new URLSearchParams({ cluster: String(cluster || "") });
  if (product) qs.set("product", product);
  return apiGet(`/api/advertise/catalog?${qs.toString()}`);
}

export function quoteAds({ cluster, items }) {
  return apiPost("/api/advertise/quote", { cluster, items });
}

export function startAdCheckout({ restaurantId, cluster, items, step, src, dealId }) {
  return apiPost("/api/advertise/checkout", {
    restaurant_id: restaurantId,
    cluster,
    items,
    step: step || undefined,
    src: src || undefined,
    deal_id: dealId || undefined,
  });
}

export function skipAdStep({ restaurantId, cluster, step }) {
  return apiPost("/api/advertise/skip", { restaurant_id: restaurantId, cluster, step });
}

export function verifyAdHandoff(token) {
  return apiPost("/api/advertise/handoff/verify", { handoff_token: token });
}

export function formatUsd(cents) {
  const n = Number(cents || 0) / 100;
  return n % 1 === 0
    ? `$${n.toLocaleString("en-US")}`
    : `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function termLabel(period, count = 1) {
  return count === 1 ? `1 ${period}` : `${count} ${period}s`;
}

export function priceLabel(price) {
  return `${formatUsd(price.price_cents)} / ${price.term_period}`;
}

/** The renewal behind a 2-day notice email link (the token is the key; no sign-in). */
export function fetchAdRenewal(token) {
  return apiPost("/api/advertise/renewal", { token });
}

export function setAdRenewal(token, autoRenew) {
  return apiPost("/api/advertise/renewal/set", { token, auto_renew: autoRenew === true });
}
