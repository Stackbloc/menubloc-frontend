/**
 * Feed Menus — personal Yellow Browser deck (saved bookmarks + 48h recents).
 * v1: device localStorage; guest + signed-in.
 */

export const FEED_MENU_LIBRARY_KEY = "menuply.feedMenuLibrary.v1";
export const FEED_MENU_LIBRARY_CHANGED = "menuply:feed-menu-library-changed";
export const RECENT_TTL_MS = 48 * 60 * 60 * 1000;

export function restaurantRefFromFeedItem(item) {
  if (!item) return null;
  const ref = item.referenced_restaurant;
  const restaurantId = ref?.id ?? item.restaurant_id;
  if (restaurantId == null || restaurantId === "") return null;
  const slug = String(ref?.slug || item.restaurant_slug || "").trim();
  const name = String(ref?.name || item.restaurant_name || "").trim() || "Restaurant";
  return {
    restaurant_id: String(restaurantId),
    restaurant_name: name,
    slug,
    city: String(item.restaurant_city || ref?.city || item.city || "").trim(),
    state: String(item.restaurant_state || ref?.state || item.state || "").trim(),
  };
}

export function restaurantRefFromDealItem(item) {
  if (!item?.restaurant_id) return null;
  return {
    restaurant_id: String(item.restaurant_id),
    restaurant_name: String(item.restaurant_name || "").trim() || "Restaurant",
    slug: String(item.restaurant_slug || "").trim(),
    city: String(item.city || "").trim(),
    state: String(item.state || "").trim(),
  };
}

export function createEmptyLibrary() {
  return { version: 1, saved: [], recent: [] };
}

export function normalizeRestaurantRef(ref) {
  if (!ref?.restaurant_id) return null;
  return {
    restaurant_id: String(ref.restaurant_id),
    restaurant_name: String(ref.restaurant_name || "").trim() || "Restaurant",
    slug: String(ref.slug || ref.restaurant_slug || "").trim(),
    city: String(ref.city || "").trim(),
    state: String(ref.state || "").trim(),
  };
}

function entryTimestamp(entry) {
  const raw = entry?.last_opened_at || entry?.bookmarked_at || 0;
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

export function purgeExpiredRecent(lib, now = Date.now()) {
  const base = lib && typeof lib === "object" ? lib : createEmptyLibrary();
  const recent = (Array.isArray(base.recent) ? base.recent : []).filter((row) => {
    const expires = Number(row?.expires_at);
    return Number.isFinite(expires) && expires > now;
  });
  return { ...base, saved: Array.isArray(base.saved) ? base.saved : [], recent };
}

export function buildFeedMenuDeck(lib, now = Date.now()) {
  const cleaned = purgeExpiredRecent(lib, now);
  const savedIds = new Set(
    cleaned.saved.map((row) => String(row.restaurant_id)).filter(Boolean)
  );

  const saved = [...cleaned.saved]
    .sort((a, b) => entryTimestamp(b) - entryTimestamp(a))
    .map((row) => ({
      ...row,
      tier: "saved",
    }));

  const recent = cleaned.recent
    .filter((row) => row?.restaurant_id && !savedIds.has(String(row.restaurant_id)))
    .sort((a, b) => entryTimestamp(b) - entryTimestamp(a))
    .map((row) => ({
      ...row,
      tier: "recent",
    }));

  return [...saved, ...recent];
}

function upsertSaved(lib, ref, now) {
  const id = String(ref.restaurant_id);
  const existing = lib.saved.find((row) => String(row.restaurant_id) === id);
  const next = {
    restaurant_id: id,
    restaurant_name: ref.restaurant_name,
    slug: ref.slug || "",
    city: ref.city || "",
    state: ref.state || "",
    bookmarked_at: existing?.bookmarked_at || now,
    last_opened_at: existing?.last_opened_at || now,
  };
  return {
    ...lib,
    saved: [next, ...lib.saved.filter((row) => String(row.restaurant_id) !== id)],
  };
}

export function applyBookmarkToggle(lib, ref, now = Date.now()) {
  const normalized = normalizeRestaurantRef(ref);
  if (!normalized) return { library: lib || createEmptyLibrary(), bookmarked: false };

  const cleaned = purgeExpiredRecent(lib || createEmptyLibrary(), now);
  const id = normalized.restaurant_id;
  const exists = cleaned.saved.some((row) => String(row.restaurant_id) === id);
  if (exists) {
    return {
      library: {
        ...cleaned,
        saved: cleaned.saved.filter((row) => String(row.restaurant_id) !== id),
      },
      bookmarked: false,
    };
  }
  return {
    library: upsertSaved(cleaned, normalized, now),
    bookmarked: true,
  };
}

export function applyRecordOpen(lib, ref, now = Date.now()) {
  const normalized = normalizeRestaurantRef(ref);
  if (!normalized) return lib || createEmptyLibrary();

  const cleaned = purgeExpiredRecent(lib || createEmptyLibrary(), now);
  const id = normalized.restaurant_id;
  const savedIdx = cleaned.saved.findIndex((row) => String(row.restaurant_id) === id);
  if (savedIdx >= 0) {
    const saved = [...cleaned.saved];
    saved[savedIdx] = {
      ...saved[savedIdx],
      ...normalized,
      last_opened_at: now,
    };
    return { ...cleaned, saved };
  }

  const recentRow = {
    ...normalized,
    last_opened_at: now,
    expires_at: now + RECENT_TTL_MS,
  };
  const recent = [
    recentRow,
    ...cleaned.recent.filter((row) => String(row.restaurant_id) !== id),
  ];
  return { ...cleaned, recent };
}

export function applyRemoveSaved(lib, restaurantId) {
  const base = lib && typeof lib === "object" ? lib : createEmptyLibrary();
  const id = String(restaurantId || "").trim();
  const saved = Array.isArray(base.saved) ? base.saved : [];
  const recent = Array.isArray(base.recent) ? base.recent : [];
  if (!id) return { ...base, saved, recent };
  return {
    ...base,
    saved: saved.filter((row) => String(row.restaurant_id) !== id),
    recent,
  };
}

export function isRestaurantBookmarked(lib, restaurantId) {
  const id = String(restaurantId || "").trim();
  if (!id) return false;
  return (lib?.saved || []).some((row) => String(row.restaurant_id) === id);
}

function readStorage(storage) {
  if (!storage) return createEmptyLibrary();
  try {
    const raw = storage.getItem(FEED_MENU_LIBRARY_KEY);
    if (!raw) return createEmptyLibrary();
    const parsed = JSON.parse(raw);
    return purgeExpiredRecent(parsed);
  } catch {
    return createEmptyLibrary();
  }
}

function writeStorage(storage, lib) {
  if (!storage) return;
  storage.setItem(FEED_MENU_LIBRARY_KEY, JSON.stringify(purgeExpiredRecent(lib)));
}

function notifyChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(FEED_MENU_LIBRARY_CHANGED));
}

export function readFeedMenuLibrary(storage = typeof window !== "undefined" ? window.localStorage : null) {
  return readStorage(storage);
}

export function writeFeedMenuLibrary(lib, storage = typeof window !== "undefined" ? window.localStorage : null) {
  writeStorage(storage, lib);
  notifyChange();
}

export function getFeedMenuDeck(storage = typeof window !== "undefined" ? window.localStorage : null) {
  return buildFeedMenuDeck(readFeedMenuLibrary(storage));
}

export function toggleFeedMenuBookmark(ref, storage = typeof window !== "undefined" ? window.localStorage : null) {
  const { library, bookmarked } = applyBookmarkToggle(readFeedMenuLibrary(storage), ref);
  writeFeedMenuLibrary(library, storage);
  return bookmarked;
}

export function recordFeedMenuOpen(ref, storage = typeof window !== "undefined" ? window.localStorage : null) {
  const library = applyRecordOpen(readFeedMenuLibrary(storage), ref);
  writeFeedMenuLibrary(library, storage);
}

export function removeFeedMenuSaved(restaurantId, storage = typeof window !== "undefined" ? window.localStorage : null) {
  const library = applyRemoveSaved(readFeedMenuLibrary(storage), restaurantId);
  writeFeedMenuLibrary(library, storage);
}

export function isFeedMenuBookmarked(
  restaurantId,
  storage = typeof window !== "undefined" ? window.localStorage : null
) {
  return isRestaurantBookmarked(readFeedMenuLibrary(storage), restaurantId);
}
