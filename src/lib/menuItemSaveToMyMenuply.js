/** Build signed-in save choice URL from a menu item detail context. */

export function buildMenuItemSaveChoicePath({ menuItemId, foodName, returnTo } = {}) {
  const qs = new URLSearchParams();
  const ckId = Number(menuItemId);
  if (Number.isFinite(ckId) && ckId > 0) qs.set("menu_item_id", String(ckId));
  const name = String(foodName || "").trim();
  if (name) qs.set("food_name", name);
  const next = String(returnTo || "").trim();
  if (next) qs.set("next", next);
  return `/account/menu-item/save?${qs.toString()}`;
}
