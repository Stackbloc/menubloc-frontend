/**
 * A dish's live deal (Andre 2026-11-04): wherever a dish price shows, a dish with a live deal
 * shows the deal icon, the deal price and a highlighted row. The server sends it as
 * `active_deal` on menu items, search matches and cluster Food by type dishes
 * (backend src/lib/activeMenuItemDeals.js). When the deal ends the server stops sending it;
 * `liveItemDeal` also hides it once `expires_at` passes on a page left open.
 * Same rules as the app's src/lib/itemDeal.ts.
 */

const toInt = (v) => {
  const n = typeof v === "string" ? Number(v) : v;
  return typeof n === "number" && Number.isFinite(n) ? Math.round(n) : null;
};

/** The item's live deal, or null. */
export function liveItemDeal(item, now = Date.now()) {
  const raw = item?.active_deal;
  if (!raw || typeof raw !== "object" || raw.deal_id == null) return null;
  if (raw.expires_at) {
    const t = Date.parse(raw.expires_at);
    if (!Number.isNaN(t) && t <= now) return null;
  }
  return {
    dealId: String(raw.deal_id),
    label: raw.label ? String(raw.label) : null,
    regularCents: toInt(raw.regular_price_cents),
    dealCents: toInt(raw.deal_price_cents),
    expiresAt: raw.expires_at || null,
  };
}

/** Deal prices lose the cents on whole dollars: $9, $9.50. */
export function formatDealCents(cents) {
  const n = toInt(cents);
  if (n == null) return null;
  return n % 100 === 0 ? `$${n / 100}` : `$${(n / 100).toFixed(2)}`;
}

/** What the price slot shows: the deal price, else the label ("20% off"). */
export function dealPriceText(deal) {
  return formatDealCents(deal?.dealCents) ?? deal?.label ?? null;
}

/** The regular price to strike through, only when it's really higher than the deal price. */
export function dealWasText(deal, regularDisplay) {
  if (!deal || deal.dealCents == null || deal.regularCents == null || deal.regularCents <= deal.dealCents) return null;
  return regularDisplay || `$${(deal.regularCents / 100).toFixed(2)}`;
}

/** Row highlight for a dish with a live deal; translucent so it reads on light and dark menus. */
export const DEAL_ROW_HIGHLIGHT = Object.freeze({
  background: "rgba(143, 212, 15, 0.14)",
  boxShadow: "inset 4px 0 0 #8fd40f, 0 0 0 1px rgba(143, 212, 15, 0.55)",
});
