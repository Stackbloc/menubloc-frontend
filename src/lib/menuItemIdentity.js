function firstPresent(...values) {
  return values.find((value) => value !== undefined && value !== null && String(value).trim() !== "") ?? null;
}

export function normalizeMenuItemIdentity(item) {
  const row = item && typeof item === "object" ? item : {};
  const nestedItem = row.item && typeof row.item === "object" ? row.item : {};
  const restaurant = row.restaurant && typeof row.restaurant === "object" ? row.restaurant : {};
  const menu = row.menu && typeof row.menu === "object" ? row.menu : {};

  const safeLegacyId = row.menu_item_instance_id == null ? row.id : null;

  return {
    menuItemId: firstPresent(
      row.menu_item_id,
      row.item_id,
      row.menuItemId,
      row.canonical_menu_item_id,
      nestedItem.menu_item_id,
      nestedItem.item_id,
      nestedItem.id,
      safeLegacyId
    ),
    restaurantId: firstPresent(row.restaurant_id, row.restaurantId, restaurant.id),
    menuId: firstPresent(row.menu_id, row.menuId, menu.id),
    productKey: firstPresent(row.product_key, row.fingerprint, nestedItem.product_key, nestedItem.fingerprint),
  };
}

export function getNormalizedMenuItemId(item) {
  return normalizeMenuItemIdentity(item).menuItemId;
}

export function hasValidMenuItemIdentity(item) {
  const { menuItemId, restaurantId } = normalizeMenuItemIdentity(item);
  return menuItemId !== null && restaurantId !== null;
}
