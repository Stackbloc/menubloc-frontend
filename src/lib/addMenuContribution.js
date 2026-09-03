import { isClaimedRestaurantProfile } from "./restaurantStatusLight.js";

/** Hover + aria copy for Add Menu icon (header rail and cards). */
export const ADD_MENU_HOVER_LABEL =
  "Add menu — use the camera at the top of the app to photograph the menu";

function normalizeEntityType(row) {
  return String(row?.restaurant_type || row?.entity_type || row?.category || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

export function isDiningHallEntity(row) {
  if (!row) return false;
  if (row.claimable === false && normalizeEntityType(row) === "dining_hall") return true;
  const entity = normalizeEntityType(row);
  return entity === "dining_hall" || entity === "dininghall";
}

export function isRestaurantAddMenuEntity(row) {
  if (!row) return false;
  if (isDiningHallEntity(row)) return false;
  return true;
}

export function hasUsableActiveMenu(row) {
  if (!row) return false;
  if (row.menu_ready === true) return true;
  if (row.menu_ready === false) return false;
  const preview = row.preview_items || row.preview_menu_items || row.menuPreviewItems;
  if (Array.isArray(preview) && preview.length > 0) return true;
  const publicCount = Number(row.public_menu_item_count);
  if (Number.isFinite(publicCount) && publicCount > 0) return true;
  // Public restaurant profiles set menu_item_count from payload menu_items but often
  // omit has_menu / menu_ready. Treat a positive count as a usable menu so View Menu
  // is not replaced by Add Menu (camera) for newly published unclaimed restaurants.
  const itemCount = Number(row.menu_item_count);
  if (Number.isFinite(itemCount) && itemCount > 0) return true;
  const menus = row.menus;
  if (Array.isArray(menus)) {
    for (const menu of menus) {
      const menuItems = Number(menu?.item_count);
      if (Number.isFinite(menuItems) && menuItems > 0) return true;
    }
  }
  return false;
}

export function isUnclaimedForAddMenu(row) {
  if (!row) return false;
  if (isClaimedRestaurantProfile(row.claim_status)) return false;
  const status = String(row.claim_status || "").trim().toLowerCase();
  if (status === "claim_pending") return false;
  return true;
}

export function canShowAddMenu(row) {
  if (!row) return false;
  const id = Number(row.restaurant_id || row.id);
  if (!Number.isFinite(id) || id <= 0) return false;
  if (!isRestaurantAddMenuEntity(row)) return false;
  if (!isUnclaimedForAddMenu(row)) return false;
  if (hasUsableActiveMenu(row)) return false;
  return true;
}

function compactQueryValue(value) {
  return String(value || "").trim().slice(0, 180);
}

export function buildAddMenuPath(row) {
  const id = Number(row?.restaurant_id || row?.id);
  if (!Number.isFinite(id) || id <= 0) return null;
  const params = new URLSearchParams();
  params.set("restaurant_id", String(id));
  const name = compactQueryValue(row.restaurant_name || row.name);
  const city = compactQueryValue(row.city);
  const state = compactQueryValue(row.state || row.region);
  const address = compactQueryValue(row.address_line1 || row.address);
  if (name) params.set("name", name);
  if (city) params.set("city", city);
  if (state) params.set("state", state);
  if (address) params.set("address", address);
  return `/menu-capture?${params.toString()}`;
}

export function buildAddMenuLoginPath(addMenuPath) {
  if (!addMenuPath || !addMenuPath.startsWith("/")) return "/account/login";
  return `/account/login?next=${encodeURIComponent(addMenuPath)}`;
}

export function restaurantFromAddMenuContext({
  profile = null,
  restaurantId = null,
  name = "",
  city = "",
  state = "",
  address = "",
  menuPreviewItems = [],
  menuItemCount = null,
} = {}) {
  const preview = Array.isArray(menuPreviewItems) ? menuPreviewItems : [];
  const countFromArg = Number(menuItemCount);
  const base = {
    ...(profile && typeof profile === "object" ? profile : {}),
    id: restaurantId || profile?.id || null,
    restaurant_id: restaurantId || profile?.id || profile?.restaurant_id || null,
    restaurant_name: name || profile?.restaurant_name || profile?.name || "",
    city: city || profile?.city || "",
    state: state || profile?.state || profile?.region || "",
    address_line1: address || profile?.address_line1 || "",
    preview_items: preview,
  };
  if (Number.isFinite(countFromArg) && countFromArg > 0) {
    base.menu_item_count = countFromArg;
  }
  return {
    ...base,
    // Prefer explicit preview, then profile counts (do not wait on async preview).
    menu_ready: preview.length > 0 ? true : hasUsableActiveMenu(base) ? true : profile?.menu_ready,
  };
}
