/**
 * Video deals are structured deals (Andre, 2026-10-22): a deal video attaches only to complete
 * written terms. Mirrors the backend rule `validateVideoDealTerms` (dealWriteHelpers.js) so the
 * forms can explain what is missing before the server refuses the upload.
 */

const PRICED_DEAL_TYPES = new Set(["percent_off", "amount_off", "fixed_price"]);

/**
 * @param {{ dealType?: string, value?: number|string|null, itemCount?: number,
 *           startsAt?: string|null, expiresAt?: string|null }} terms
 *   `value` is the type's number: percent for % off, dollars for $ off / special price.
 * @returns {string|null} what is missing, or null when the terms are complete.
 */
export function videoDealTermsProblem({ dealType, value, itemCount = 0, startsAt, expiresAt } = {}) {
  if (!PRICED_DEAL_TYPES.has(dealType)) {
    return "Add the written deal first: choose % off, $ off, or a special price.";
  }
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0 || (dealType === "percent_off" && n > 100)) {
    return dealType === "percent_off"
      ? "Enter a percent off between 1 and 100."
      : "Enter the deal amount.";
  }
  if (!itemCount) return "Link the deal to at least one menu item.";
  if (!startsAt || !expiresAt) return "Set the deal's start and end dates.";
  return null;
}

/** Terms as saved on a deal row (cents in the database). */
export function videoDealTermsFromDeal(deal = {}) {
  const type = deal.deal_type;
  const value =
    type === "percent_off"
      ? deal.discount_percent
      : type === "amount_off"
        ? (deal.discount_amount_cents != null ? Number(deal.discount_amount_cents) / 100 : null)
        : type === "fixed_price"
          ? (deal.fixed_price_cents != null ? Number(deal.fixed_price_cents) / 100 : null)
          : null;
  const ids = [deal.menu_item_id, ...(Array.isArray(deal.applies_to_menu_item_ids) ? deal.applies_to_menu_item_ids : [])]
    .filter((id) => id != null && id !== "");
  return {
    dealType: type,
    value,
    itemCount: ids.length,
    startsAt: deal.starts_at || null,
    expiresAt: deal.expires_at || null,
  };
}

/** One-line summary shown beside the video, e.g. "20% off · Mar 1 – Mar 31". */
export function videoDealTermsSummary({ dealType, value, startsAt, expiresAt } = {}) {
  const n = Number(value);
  const amount =
    dealType === "percent_off"
      ? `${n}% off`
      : dealType === "amount_off"
        ? `$${n.toFixed(2)} off`
        : dealType === "fixed_price"
          ? `Special price $${n.toFixed(2)}`
          : "";
  const day = (v) => String(v || "").slice(0, 10);
  const dates = startsAt && expiresAt ? `${day(startsAt)} – ${day(expiresAt)}` : "";
  return [amount, dates].filter(Boolean).join(" · ");
}
