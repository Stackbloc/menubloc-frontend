export const MENU_ITEM_IDENTITY_CONTRACT = "MenuItemIdentityContract";

const CMI_ROUTE_RE = /^cmi:(\d+)$/i;

const present = (value) => value !== undefined && value !== null && String(value).trim() !== "";

/**
 * Accepts CK numeric IDs or franchise canonical `cmi:{chain_menu_item_id}` route IDs.
 * Mirrors menubloc-backend franchiseCanonicalRouteResolver.parseMenuItemRouteId.
 */
export function parseMenuItemRouteId(raw) {
  if (raw == null || raw === "") return null;
  const text = String(raw).trim();
  const cmiMatch = CMI_ROUTE_RE.exec(text);
  if (cmiMatch) {
    const chainMenuItemId = Number(cmiMatch[1]);
    if (!Number.isInteger(chainMenuItemId) || chainMenuItemId <= 0) return null;
    return {
      kind: "cmi",
      routeId: `cmi:${chainMenuItemId}`,
      chainMenuItemId,
    };
  }
  const numericId = Number(text);
  if (Number.isInteger(numericId) && numericId > 0) {
    return {
      kind: "ck",
      routeId: String(numericId),
      numericId,
    };
  }
  return null;
}

export function isValidMenuItemRouteId(raw) {
  return parseMenuItemRouteId(raw) != null;
}

export function normalizeMenuItemIdentity(item) {
  const row = item && typeof item === "object" ? item : {};
  const restaurant = row.restaurant && typeof row.restaurant === "object" ? row.restaurant : {};
  const menu = row.menu && typeof row.menu === "object" ? row.menu : {};
  return {
    menuItemId: present(row.menu_item_id) ? row.menu_item_id : null,
    restaurantId: present(row.restaurant_id) ? row.restaurant_id : (present(restaurant.id) ? restaurant.id : null),
    menuId: present(row.menu_id) ? row.menu_id : (present(menu.id) ? menu.id : null),
    productKey: present(row.product_key) ? row.product_key : null,
    menuItemInstanceId: present(row.menu_item_instance_id) ? row.menu_item_instance_id : null,
  };
}

export function getNormalizedMenuItemId(item) {
  return normalizeMenuItemIdentity(item).menuItemId;
}

export function hasValidMenuItemIdentity(item) {
  const { menuItemId, restaurantId } = normalizeMenuItemIdentity(item);
  return present(menuItemId) && present(restaurantId);
}

export function requireMenuItemIdentity(item, { menuContext = false } = {}) {
  const identity = normalizeMenuItemIdentity(item);
  const errors = [];
  if (!present(identity.menuItemId)) errors.push("menu_item_id is required");
  if (!present(identity.restaurantId)) errors.push("restaurant_id is required");
  if (menuContext && !present(identity.menuId)) errors.push("menu_id is required when menu context exists");
  if (present(identity.menuItemInstanceId) && String(identity.menuItemInstanceId) === String(identity.menuItemId)) {
    errors.push("menu_item_instance_id cannot be canonical identity");
  }
  if (errors.length) throw new Error(`${MENU_ITEM_IDENTITY_CONTRACT} violation: ${errors.join("; ")}`);
  return identity;
}
