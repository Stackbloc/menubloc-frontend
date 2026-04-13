function toInteger(value, fallback = 0) {
  const normalized = Number(value);
  return Number.isInteger(normalized) ? normalized : fallback;
}

function toPositiveInteger(value, fallback = 1) {
  const normalized = toInteger(value, fallback);
  return normalized > 0 ? normalized : fallback;
}

function normalizeTimestamp(value) {
  const numeric = Number(value);
  if (Number.isFinite(numeric) && numeric > 0) return numeric;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function normalizeModifier(modifier, index = 0) {
  const groupId = String(
    modifier?.groupId ??
      modifier?.group_id ??
      modifier?.modifierGroupId ??
      modifier?.modifier_group_id ??
      "default"
  ).trim();
  const optionId = String(
    modifier?.optionId ??
      modifier?.option_id ??
      modifier?.id ??
      `${groupId}-${index}`
  ).trim();
  const name = String(modifier?.name ?? modifier?.label ?? modifier?.title ?? "Selection").trim();
  const priceDeltaCents = toInteger(
    modifier?.priceDeltaCents ??
      modifier?.price_delta_cents ??
      modifier?.priceCents ??
      modifier?.price_cents ??
      0,
    0
  );

  return {
    groupId,
    optionId,
    name,
    priceDeltaCents,
  };
}

export function computeLineTotals(line) {
  const quantity = toPositiveInteger(line?.quantity, 1);
  const basePriceCents = toInteger(
    line?.basePriceCents ?? line?.base_price_cents ?? line?.priceCents ?? line?.price_cents,
    0
  );
  const originalBasePriceCents = toInteger(
    line?.originalBasePriceCents ??
      line?.original_base_price_cents ??
      line?.basePriceCents ??
      line?.base_price_cents ??
      line?.priceCents ??
      line?.price_cents,
    basePriceCents
  );
  const modifiers = Array.isArray(line?.modifiers) ? line.modifiers.map(normalizeModifier) : [];
  const modifierTotalCents = modifiers.reduce(
    (sum, modifier) => sum + toInteger(modifier?.priceDeltaCents, 0),
    0
  );
  const unitPriceCents = basePriceCents + modifierTotalCents;
  const lineTotalCents = unitPriceCents * quantity;

  return {
    ...line,
    quantity,
    basePriceCents,
    originalBasePriceCents,
    pricingType: String(line?.pricingType ?? line?.pricing_type ?? "").trim(),
    pricingLabel: String(line?.pricingLabel ?? line?.pricing_label ?? "").trim(),
    modifiers,
    unitPriceCents,
    lineTotalCents,
  };
}

export function normalizeCartLine(line) {
  return computeLineTotals({
    lineId:
      String(
        line?.lineId ??
          line?.line_id ??
          (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
            ? crypto.randomUUID()
            : `line-${Date.now()}-${Math.random().toString(36).slice(2)}`)
      ).trim(),
    restaurantId: toInteger(line?.restaurantId ?? line?.restaurant_id, 0),
    menuItemId: toInteger(line?.menuItemId ?? line?.menu_item_id, 0),
    name: String(line?.name ?? "").trim(),
    description: String(line?.description ?? "").trim(),
    quantity: toPositiveInteger(line?.quantity, 1),
    modifiers: Array.isArray(line?.modifiers) ? line.modifiers : [],
    specialInstructions: line?.specialInstructions ?? line?.special_instructions ?? null,
    basePriceCents: toInteger(
      line?.basePriceCents ?? line?.base_price_cents ?? line?.priceCents ?? line?.price_cents,
      0
    ),
    originalBasePriceCents: toInteger(
      line?.originalBasePriceCents ??
        line?.original_base_price_cents ??
        line?.basePriceCents ??
        line?.base_price_cents ??
        line?.priceCents ??
        line?.price_cents,
      0
    ),
    pricingType: String(line?.pricingType ?? line?.pricing_type ?? "").trim(),
    pricingLabel: String(line?.pricingLabel ?? line?.pricing_label ?? "").trim(),
  });
}

export function normalizeStoredCart(raw) {
  const restaurantSource = raw?.restaurant || (raw?.restaurant_id ? {
    restaurantId: raw.restaurant_id,
    restaurantName: raw.restaurant_name ?? raw.restaurantName ?? "",
    slug: raw.restaurant_slug ?? raw.slug ?? raw.restaurantSlug ?? null,
  } : null);
  const restaurant = restaurantSource
    ? {
        ...restaurantSource,
        restaurantId: toInteger(restaurantSource.restaurantId ?? restaurantSource.restaurant_id, 0),
        restaurantName: String(
          restaurantSource.restaurantName ?? restaurantSource.restaurant_name ?? ""
        ).trim(),
        slug: restaurantSource.slug ?? null,
      }
    : null;
  const rawItems = Array.isArray(raw?.items) ? raw.items : [];
  const items = rawItems
    .map(normalizeCartLine)
    .filter((item) => item.menuItemId > 0 && item.restaurantId > 0);
  const updatedAt = normalizeTimestamp(raw?.updatedAt ?? raw?.updated_at);

  if (!restaurant?.restaurantId || items.length === 0) {
    return {
      restaurant: null,
      items: [],
      updatedAt: null,
    };
  }

  const sameRestaurantItems = items.filter(
    (item) => Number(item.restaurantId) === Number(restaurant.restaurantId)
  );

  return {
    restaurant,
    items: sameRestaurantItems,
    updatedAt,
  };
}

export function buildModifierIdentity(modifiers = []) {
  return [...modifiers]
    .map((modifier) => normalizeModifier(modifier))
    .sort((a, b) => {
      const left = `${a.groupId}:${a.optionId}`;
      const right = `${b.groupId}:${b.optionId}`;
      return left.localeCompare(right);
    })
    .map((modifier) => `${modifier.groupId}:${modifier.optionId}`)
    .join("|");
}

export function buildLineIdentity(line) {
  return [
    toInteger(line?.menuItemId, 0),
    buildModifierIdentity(line?.modifiers),
    String(line?.specialInstructions ?? "").trim(),
  ].join("::");
}

export function createCartLine({ restaurant, item }) {
  const normalizedRestaurantId = toInteger(
    restaurant?.restaurantId ?? restaurant?.restaurant_id,
    0
  );
  const basePriceCents = toInteger(
    item?.basePriceCents ?? item?.base_price_cents ?? item?.priceCents ?? item?.price_cents,
    0
  );

  return normalizeCartLine({
    lineId:
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `line-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    restaurantId: normalizedRestaurantId,
    menuItemId: item?.menuItemId,
    name: item?.name,
    description: item?.description,
    basePriceCents,
    originalBasePriceCents: toInteger(
      item?.originalBasePriceCents ??
        item?.original_base_price_cents ??
        item?.basePriceCents ??
        item?.base_price_cents ??
        item?.priceCents ??
        item?.price_cents,
      basePriceCents
    ),
    pricingType: item?.pricingType ?? item?.pricing_type ?? "",
    pricingLabel: item?.pricingLabel ?? item?.pricing_label ?? "",
    quantity: item?.quantity,
    modifiers: item?.modifiers,
    specialInstructions: item?.specialInstructions ?? null,
  });
}

export function addItemToCart(cartState, payload) {
  const current = normalizeStoredCart(cartState);
  const nextRestaurant = payload?.restaurant
    ? {
        ...payload.restaurant,
        restaurantId: toInteger(payload.restaurant.restaurantId ?? payload.restaurant.restaurant_id, 0),
        restaurantName: String(
          payload.restaurant.restaurantName ?? payload.restaurant.restaurant_name ?? ""
        ).trim(),
      }
    : null;
  const nextLine = createCartLine(payload || {});

  if (!nextRestaurant?.restaurantId || !nextLine.menuItemId) {
    return {
      ok: false,
      cart: current,
      message: "Cart item is missing restaurant or menu item context.",
    };
  }

  if (
    current.restaurant?.restaurantId &&
    current.restaurant.restaurantId !== nextRestaurant.restaurantId
  ) {
    return {
      ok: false,
      code: "restaurant_conflict",
      cart: current,
      message: `Your cart already has items from ${current.restaurant.restaurantName}. Clear it before ordering from another restaurant.`,
    };
  }

  const nextIdentity = buildLineIdentity(nextLine);
  const existingIndex = current.items.findIndex((item) => buildLineIdentity(item) === nextIdentity);

  const items =
    existingIndex >= 0
      ? current.items.map((item, index) =>
          index === existingIndex
            ? computeLineTotals({ ...item, quantity: item.quantity + nextLine.quantity })
            : item
        )
      : [...current.items, nextLine];

  return {
    ok: true,
    cart: {
      restaurant: current.restaurant || nextRestaurant,
      items,
      updatedAt: Date.now(),
    },
    addedLine: existingIndex >= 0 ? items[existingIndex] : nextLine,
  };
}

export function updateCartLineQuantity(cartState, lineId, quantity) {
  const current = normalizeStoredCart(cartState);
  const normalizedLineId = String(lineId || "").trim();
  const nextItems = current.items
    .map((item) =>
      item.lineId === normalizedLineId
        ? computeLineTotals({ ...item, quantity: toInteger(quantity, item.quantity) })
        : item
    )
    .filter((item) => item.quantity > 0);

  return {
    restaurant: nextItems.length > 0 ? current.restaurant : null,
    items: nextItems,
    updatedAt: nextItems.length > 0 ? Date.now() : null,
  };
}

export function removeCartLine(cartState, lineId) {
  const current = normalizeStoredCart(cartState);
  const normalizedLineId = String(lineId || "").trim();
  const nextItems = current.items.filter((item) => item.lineId !== normalizedLineId);

  return {
    restaurant: nextItems.length > 0 ? current.restaurant : null,
    items: nextItems,
    updatedAt: nextItems.length > 0 ? Date.now() : null,
  };
}

export function getCartSummary(cartState) {
  const current = normalizeStoredCart(cartState);
  return {
    restaurant: current.restaurant,
    itemCount: current.items.reduce((sum, item) => sum + item.quantity, 0),
    subtotalCents: current.items.reduce((sum, item) => sum + item.lineTotalCents, 0),
  };
}

export function buildCheckoutItems(cartItems) {
  return (Array.isArray(cartItems) ? cartItems : [])
    .map((item) => normalizeCartLine(item))
    .filter((item) => item.menuItemId > 0 && item.quantity > 0)
    .map((item) => ({
      lineId: item.lineId,
      menuItemId: item.menuItemId,
      quantity: item.quantity,
      modifiers: item.modifiers.map((modifier) => ({
        groupId: modifier.groupId,
        optionId: modifier.optionId,
        name: modifier.name,
        priceDeltaCents: modifier.priceDeltaCents,
      })),
      specialInstructions: item.specialInstructions || undefined,
    }));
}
