/**
 * Phase 5 — one-vendor stadium seat-delivery cart (sessionStorage).
 * Isolated from restaurant OrderCart / Stripe checkout.
 */

const PREFIX = "menuply_stadium_order_cart_v1:";

function key(slug) {
  return `${PREFIX}${String(slug || "").toLowerCase()}`;
}

export function loadStadiumCart(slug) {
  try {
    const raw = sessionStorage.getItem(key(slug));
    if (!raw) return emptyCart(slug);
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.venue_slug !== slug) return emptyCart(slug);
    return {
      venue_slug: slug,
      vendor_id: parsed.vendor_id ?? null,
      vendor_slug: parsed.vendor_slug ?? null,
      vendor_name: parsed.vendor_name ?? null,
      vendor_location_id: parsed.vendor_location_id ?? null,
      items: Array.isArray(parsed.items) ? parsed.items : [],
    };
  } catch {
    return emptyCart(slug);
  }
}

function emptyCart(slug) {
  return {
    venue_slug: slug,
    vendor_id: null,
    vendor_slug: null,
    vendor_name: null,
    vendor_location_id: null,
    items: [],
  };
}

export function saveStadiumCart(slug, cart) {
  sessionStorage.setItem(key(slug), JSON.stringify(cart));
  return cart;
}

export function clearStadiumCart(slug) {
  sessionStorage.removeItem(key(slug));
  return emptyCart(slug);
}

/**
 * Add item — enforces one vendor per cart.
 * Returns { ok, cart, error? }
 */
export function addStadiumCartItem(slug, { item, vendor, quantity = 1 }) {
  const cart = loadStadiumCart(slug);
  const qty = Math.min(99, Math.max(1, Number(quantity) || 1));
  const vendorId = vendor.vendor_id ?? vendor.id;
  if (cart.vendor_id != null && String(cart.vendor_id) !== String(vendorId)) {
    return {
      ok: false,
      error: "Cart is limited to one vendor. Clear the cart to order from another vendor.",
      cart,
    };
  }
  const ckId = item.ck_menu_item_id;
  const existing = cart.items.find((i) => String(i.ck_menu_item_id) === String(ckId));
  let items;
  if (existing) {
    items = cart.items.map((i) =>
      String(i.ck_menu_item_id) === String(ckId)
        ? { ...i, quantity: Math.min(99, i.quantity + qty) }
        : i
    );
  } else {
    items = [
      ...cart.items,
      {
        ck_menu_item_id: ckId,
        item_name: item.item_name,
        description: item.description || null,
        quantity: qty,
        price: item.price ?? null,
        price_available: item.price_available === true,
        locations: item.locations || [],
        locations_available: item.locations_available === true,
      },
    ];
  }
  const next = saveStadiumCart(slug, {
    venue_slug: slug,
    vendor_id: vendorId,
    vendor_slug: vendor.vendor_slug || vendor.slug,
    vendor_name: vendor.vendor_name || vendor.name,
    vendor_location_id: cart.vendor_location_id,
    items,
  });
  return { ok: true, cart: next };
}

export function updateStadiumCartQuantity(slug, ckMenuItemId, quantity) {
  const cart = loadStadiumCart(slug);
  const qty = Number(quantity);
  let items = cart.items;
  if (!Number.isFinite(qty) || qty <= 0) {
    items = items.filter((i) => String(i.ck_menu_item_id) !== String(ckMenuItemId));
  } else {
    items = items.map((i) =>
      String(i.ck_menu_item_id) === String(ckMenuItemId)
        ? { ...i, quantity: Math.min(99, qty) }
        : i
    );
  }
  return saveStadiumCart(slug, { ...cart, items });
}

export function removeStadiumCartItem(slug, ckMenuItemId) {
  return updateStadiumCartQuantity(slug, ckMenuItemId, 0);
}

export function setStadiumCartLocation(slug, vendorLocationId) {
  const cart = loadStadiumCart(slug);
  return saveStadiumCart(slug, {
    ...cart,
    vendor_location_id: vendorLocationId,
  });
}

export function stadiumCartItemCount(cart) {
  return (cart?.items || []).reduce((n, i) => n + (Number(i.quantity) || 0), 0);
}
