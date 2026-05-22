import { formatMoney as formatMoneyFromCents } from "../components/payments/paymentHelpers.js";

function toFiniteNumber(value) {
  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : null;
}

function toCentsFromDollars(value) {
  const normalized = toFiniteNumber(value);
  if (normalized == null) return null;
  return Math.round(normalized * 100);
}

function pickCents(item, keys) {
  for (const key of keys) {
    const value = toFiniteNumber(item?.[key]);
    if (value != null && value > 0) return Math.round(value);
  }
  return null;
}

function pickDollarPrice(item, keys) {
  for (const key of keys) {
    const cents = toCentsFromDollars(item?.[key]);
    if (cents != null && cents > 0) return cents;
  }
  return null;
}

export function getConsumerDisplayPrice(item) {
  const directCents = pickCents(item, [
    "menuply_display_price_cents",
    "consumer_display_price_cents",
    "display_price_cents",
    "price_with_required_fees_cents",
    "price_cents",
    "price_minor_units",
  ]);
  if (directCents != null) return directCents;

  const displayCents = pickDollarPrice(item, [
    "menuply_display_price",
    "consumer_display_price",
    "display_price",
    "price_with_required_fees",
    "price",
  ]);
  if (displayCents != null) return displayCents;

  return null;
}

export function getBaseMenuPrice(item) {
  const directCents = pickCents(item, [
    "restaurant_base_price_cents",
    "menu_price_cents",
    "base_price_cents",
    "price_cents",
    "price_minor_units",
  ]);
  if (directCents != null) return directCents;

  const baseCents = pickDollarPrice(item, [
    "restaurant_base_price",
    "menu_price",
    "base_price",
    "price",
  ]);
  if (baseCents != null) return baseCents;

  return null;
}

export function formatMoney(value) {
  return formatMoneyFromCents(value);
}

/**
 * Format a cents value for MENU ITEM display only.
 * Returns null (render nothing) for any value that is null, undefined, NaN, or <= 0.
 * Use this everywhere a menu item price is shown to a consumer.
 * Use formatMoney() (not this) for cart totals, order confirmations, and other
 * financial amounts where zero cents is a valid confirmed value.
 */
export function formatMenuItemPrice(cents) {
  if (cents == null || cents <= 0) return null;
  return formatMoneyFromCents(cents);
}

// TODO(pricing): Prefer backend-sent fields as they roll out broadly:
// - restaurant_base_price
// - menuply_display_price
// - menuply_service_component_internal
