/**
 * Menu Browser opened from a Feed video: find the video's dish in the loaded menu so it can
 * be pinned under the restaurant header. Match by canonical menu_item_id first, then by
 * exact (normalized) dish name. No match → null (menu opens normally, no pinned card).
 */

import { getNormalizedMenuItemId } from "./menuItemIdentity.js";

export function normalizeDishName(raw) {
  return String(raw ?? "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[®™©]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function present(value) {
  return value != null && String(value).trim() !== "";
}

/**
 * @param {Array<{ items?: object[] }>} sections
 * @param {{ menuItemId?: string|number|null, menuItemName?: string|null }} subject
 * @returns {{ item: object, sectionIndex: number, itemIndex: number } | null}
 */
export function findPinnedMenuItem(sections, { menuItemId = null, menuItemName = null } = {}) {
  const list = Array.isArray(sections) ? sections : [];
  if (present(menuItemId)) {
    const target = String(menuItemId).trim();
    for (let s = 0; s < list.length; s += 1) {
      const items = Array.isArray(list[s]?.items) ? list[s].items : [];
      for (let i = 0; i < items.length; i += 1) {
        const id = getNormalizedMenuItemId(items[i]);
        if (present(id) && String(id).trim() === target) {
          return { item: items[i], sectionIndex: s, itemIndex: i };
        }
      }
    }
  }
  const wanted = normalizeDishName(menuItemName);
  if (!wanted) return null;
  for (let s = 0; s < list.length; s += 1) {
    const items = Array.isArray(list[s]?.items) ? list[s].items : [];
    for (let i = 0; i < items.length; i += 1) {
      if (normalizeDishName(items[i]?.name) === wanted) {
        return { item: items[i], sectionIndex: s, itemIndex: i };
      }
    }
  }
  return null;
}

/** Same sections with the pinned row removed (empty sections dropped) so it is not listed twice. */
export function withoutPinnedMenuItem(sections, match) {
  if (!match) return sections;
  const list = Array.isArray(sections) ? sections : [];
  const out = [];
  list.forEach((section, s) => {
    if (s !== match.sectionIndex) {
      out.push(section);
      return;
    }
    const items = (Array.isArray(section?.items) ? section.items : []).filter(
      (_, i) => i !== match.itemIndex
    );
    if (items.length > 0) out.push({ ...section, items });
  });
  return out;
}

/**
 * Up to three dishes from a video (feed `menu_items` / deal `eligible_items`), each matched by
 * id then exact name; duplicates and misses are skipped. Order follows the video's dish order.
 * @param {Array<{ items?: object[] }>} sections
 * @param {Array<{ id?: string|number|null, name?: string|null }>} subjects
 */
export function findPinnedMenuItems(sections, subjects = [], max = 3) {
  const out = [];
  const seen = new Set();
  for (const subject of Array.isArray(subjects) ? subjects : []) {
    if (out.length >= max) break;
    const match = findPinnedMenuItem(sections, {
      menuItemId: subject?.id ?? null,
      menuItemName: subject?.name ?? null,
    });
    if (!match) continue;
    const key = `${match.sectionIndex}:${match.itemIndex}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(match);
  }
  return out;
}

/** Sections without any of the pinned rows (emptied sections dropped). */
export function withoutPinnedMenuItems(sections, matches) {
  const list = Array.isArray(matches) ? matches : [];
  if (!list.length) return sections;
  const drop = new Set(list.map((m) => `${m.sectionIndex}:${m.itemIndex}`));
  const out = [];
  (Array.isArray(sections) ? sections : []).forEach((section, s) => {
    const items = (Array.isArray(section?.items) ? section.items : []).filter(
      (_, i) => !drop.has(`${s}:${i}`)
    );
    if (items.length > 0) out.push(items.length === (section?.items || []).length ? section : { ...section, items });
  });
  return out;
}
