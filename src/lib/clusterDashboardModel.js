/**
 * Cluster landing dashboard shaping — presentation only.
 * Dining halls are status/comment places, not menu-item sources.
 */

export const HOTSPOT_LIMIT = 10;
export const POPULAR_ITEM_LIMIT = 8;
export const COMMENT_LIMIT = 8;

export function isDiningHallRow(row) {
  return String(row?.restaurant_type || row?.entity_type || "")
    .trim()
    .toLowerCase() === "dining_hall";
}

function restKey(row) {
  const id = row?.restaurant_id;
  if (id != null && String(id).trim()) return `id:${id}`;
  const slug = String(row?.restaurant_slug || "").trim();
  if (slug) return `slug:${slug}`;
  const name = String(row?.restaurant_name || "").trim().toLowerCase();
  return name ? `name:${name}` : null;
}

function commentText(row) {
  const parts = [
    row?.display_line,
    row?.report_line,
    row?.comment,
    row?.detail,
    row?.people_shared_label,
  ]
    .map((v) => String(v || "").trim())
    .filter(Boolean);
  return parts[0] || "";
}

function fingerprint(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Up to 10 restaurants with one related comment. Excludes dining halls
 * (those belong under On campus).
 */
export function buildHotspots({ activityItems = [], statuses = [], signals = [] } = {}) {
  const map = new Map();

  function upsert(row, { comment, rank = 0 } = {}) {
    if (!row || isDiningHallRow(row)) return;
    const key = restKey(row);
    if (!key) return;
    const existing = map.get(key) || {
      restaurant_id: row.restaurant_id ?? null,
      restaurant_name: row.restaurant_name || "Restaurant",
      restaurant_slug: row.restaurant_slug || null,
      href:
        row.restaurant_slug || row.restaurant_id
          ? `/restaurants/${encodeURIComponent(String(row.restaurant_slug || row.restaurant_id))}`
          : null,
      comment: "",
      rank: 0,
    };
    const nextComment = comment || commentText(row);
    if (!existing.comment && nextComment) existing.comment = nextComment;
    if (row.restaurant_name) existing.restaurant_name = row.restaurant_name;
    if (row.restaurant_slug) existing.restaurant_slug = row.restaurant_slug;
    existing.rank = Math.max(existing.rank, Number(rank) || 0);
    map.set(key, existing);
  }

  for (const item of activityItems) {
    upsert(item, {
      comment: item.people_shared_label || commentText(item),
      rank: Number(item.people_shared_count) || 1,
    });
  }
  for (const sig of signals) {
    upsert(sig, { comment: sig.report_line || commentText(sig), rank: Number(sig.signal_count) || 1 });
  }
  for (const status of statuses) {
    upsert(status, { comment: status.display_line || commentText(status), rank: 1 });
  }

  const all = [...map.values()].sort((a, b) => b.rank - a.rank);
  return {
    items: all.slice(0, HOTSPOT_LIMIT),
    moreCount: Math.max(0, all.length - HOTSPOT_LIMIT),
  };
}

/**
 * Popular dishes today — not dining-hall SKUs.
 */
export function buildPopularItems(activityItems = []) {
  const seen = new Set();
  const items = [];
  for (const row of activityItems) {
    if (isDiningHallRow(row)) continue;
    if (row.share_kind === "place" || !row.menu_item_id) continue;
    const id = String(row.menu_item_id);
    if (seen.has(id)) continue;
    seen.add(id);
    items.push({
      menu_item_id: row.menu_item_id,
      item_name: row.item_name || "Menu item",
      restaurant_name: row.restaurant_name || null,
      restaurant_slug: row.restaurant_slug || null,
      people_shared_label: row.people_shared_label || null,
      href: `/menu-items/${encodeURIComponent(String(row.menu_item_id))}`,
    });
    if (items.length >= POPULAR_ITEM_LIMIT) break;
  }
  return items;
}

/**
 * Comments that are not the same line already shown on a hotspot.
 */
export function buildWhoIsEatingComments({ statuses = [], hotspotComments = [] } = {}) {
  const used = new Set(hotspotComments.map(fingerprint).filter(Boolean));
  const out = [];
  for (const status of statuses) {
    const line = status.display_line || commentText(status);
    const fp = fingerprint(line);
    if (!fp || used.has(fp)) continue;
    used.add(fp);
    out.push(status);
    if (out.length >= COMMENT_LIMIT) break;
  }
  return out;
}

export function splitEventsByLocalDay(events = [], now = new Date(), timeZone = null) {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: timeZone || undefined,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const todayKey = fmt.format(now);
  const today = [];
  const upcoming = [];
  for (const event of events) {
    const when = event?.starts_at || event?.date || event?.event_date;
    let key = null;
    if (when) {
      const d = new Date(when);
      if (!Number.isNaN(d.getTime())) key = fmt.format(d);
      else key = String(when).slice(0, 10);
    }
    if (key === todayKey) today.push(event);
    else upcoming.push(event);
  }
  return { today, upcoming };
}

export function formatClusterNowLine(date = new Date(), timeZone = null) {
  const opts = { timeZone: timeZone || undefined };
  const weekday = new Intl.DateTimeFormat("en-US", { weekday: "long", ...opts }).format(date);
  const datePart = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    ...opts,
  }).format(date);
  const timePart = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    ...opts,
  }).format(date);
  return `${weekday}, ${datePart} · ${timePart}`;
}
