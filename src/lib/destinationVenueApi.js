import { apiGet, apiPost } from "./api.js";

/**
 * Public destination venue food inventory (Phase 4) + seat-delivery order requests (Phase 5).
 * Uses API_BASE from api.js — never same-origin /public paths alone.
 * Order requests do NOT use Stripe / create-payment-intent.
 */

export async function fetchDestinationVenueDirectory(
  { league = "nfl", signal } = {}
) {
  const params = new URLSearchParams();
  if (league) params.set("league", league);
  const qs = params.toString();
  return apiGet(`/public/destination-venues${qs ? `?${qs}` : ""}`, { signal });
}

export async function fetchDestinationVenue(slug, { signal } = {}) {
  return apiGet(`/public/destination-venues/${encodeURIComponent(slug)}`, { signal });
}

export async function fetchDestinationVenueInventory(slug, { signal } = {}) {
  return apiGet(
    `/public/destination-venues/${encodeURIComponent(slug)}/inventory`,
    { signal }
  );
}

export async function searchDestinationVenueMenuItems(
  slug,
  { q = "", vendor = null, limit = 50, signal } = {}
) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (vendor) params.set("vendor", vendor);
  if (limit != null) params.set("limit", String(limit));
  const qs = params.toString();
  return apiGet(
    `/public/destination-venues/${encodeURIComponent(slug)}/menu-items${qs ? `?${qs}` : ""}`,
    { signal }
  );
}

export async function fetchDestinationVenueVendor(slug, vendorSlug, { signal } = {}) {
  return apiGet(
    `/public/destination-venues/${encodeURIComponent(slug)}/vendors/${encodeURIComponent(vendorSlug)}`,
    { signal }
  );
}

export async function fetchDestinationVenueItemAvailability(
  slug,
  ckId,
  { signal } = {}
) {
  return apiGet(
    `/public/destination-venues/${encodeURIComponent(slug)}/menu-items/${encodeURIComponent(ckId)}/availability`,
    { signal }
  );
}

export function formatStadiumPrice(price, priceAvailable) {
  if (priceAvailable === false || price == null || price === "") {
    return null;
  }
  const n = Number(price);
  if (!Number.isFinite(n) || n < 0) return null;
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: n % 1 === 0 ? 0 : 2,
  });
}

/** Consumer copy for null/unknown price — never invent a number. */
export function stadiumPriceLabel(price, priceAvailable) {
  return formatStadiumPrice(price, priceAvailable) || "Price unavailable";
}

export async function fetchDestinationVenueDeliveryFee(slug, { signal } = {}) {
  return apiGet(
    `/public/destination-venues/${encodeURIComponent(slug)}/delivery-fee`,
    { signal }
  );
}

export async function createDestinationVenueOrderRequest(
  slug,
  body,
  { signal } = {}
) {
  return apiPost(
    `/public/destination-venues/${encodeURIComponent(slug)}/order-requests`,
    body,
    { signal }
  );
}

export async function fetchDestinationVenueOrderRequest(
  slug,
  publicOrderNumber,
  { signal } = {}
) {
  return apiGet(
    `/public/destination-venues/${encodeURIComponent(slug)}/order-requests/${encodeURIComponent(publicOrderNumber)}`,
    { signal }
  );
}

export function formatCents(cents) {
  if (cents == null || !Number.isFinite(Number(cents))) return null;
  return (Number(cents) / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}
