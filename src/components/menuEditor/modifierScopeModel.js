/**
 * Owner Menu Editor — modifier group scope (Andre, 2026-10-23: "is this on one salad or all
 * salads?"). A group applies to:
 *   { type: "item" }                       this item only (also every legacy group)
 *   { type: "section", section: "Salads" } every item in that section, incl. ones added later
 *   { type: "items" } + item_ids           items the owner picked
 * BE contract: GET/PUT/DELETE /api/owner/menu-console/restaurants/:rid/menus/:mid/modifier-groups.
 */
import { fromEditorGroups } from "./MenuItemModifiersEditor.jsx";

const TYPES = new Set(["item", "section", "items"]);

function sectionKey(value) {
  return String(value || "").trim().toLowerCase();
}

export function normalizeScope(raw) {
  const type = String(raw?.type || "").trim().toLowerCase();
  if (type === "section" && String(raw?.section || "").trim()) {
    return { type: "section", section: String(raw.section).trim() };
  }
  if (type === "items") return { type: "items" };
  return { type: "item" };
}

export function isSharedScope(scope) {
  return TYPES.has(scope?.type) && scope.type !== "item";
}

/** Items the group will be on after saving (for the "On N items" line). */
export function scopeItems(group, { itemId, menuItems = [] }) {
  const scope = normalizeScope(group?.applies_to);
  if (scope.type === "section") {
    return menuItems.filter((it) => sectionKey(it.section) === sectionKey(scope.section));
  }
  if (scope.type === "items") {
    const ids = new Set([Number(itemId), ...(group?.item_ids || []).map(Number)]);
    return menuItems.filter((it) => ids.has(Number(it.id)));
  }
  return menuItems.filter((it) => Number(it.id) === Number(itemId));
}

export function describeScope(group, ctx) {
  const scope = normalizeScope(group?.applies_to);
  const count = scopeItems(group, ctx).length;
  const items = `${count} ${count === 1 ? "item" : "items"}`;
  if (scope.type === "section") return `Every item in ${scope.section} (${items})`;
  if (scope.type === "items") return `Selected items (${items})`;
  return "This item only";
}

/**
 * Editor groups for one item + the menu-wide listing → each group knows its saved scope
 * (origin) and, for picked-items groups, which items it is on.
 */
export function attachScopeFromIndex(editorGroups, index, itemId) {
  const entries = Array.isArray(index?.groups) ? index.groups : [];
  return (editorGroups || []).map((group) => {
    const entry =
      entries.find((e) => e.key === `shared:${group.id}`) ||
      entries.find((e) => e.key === `item:${itemId}:${group.id}`);
    const scope = normalizeScope(entry?.applies_to || group.applies_to);
    const onIds = (entry?.items || []).map((it) => Number(it.id));
    return {
      ...group,
      applies_to: scope,
      item_ids: scope.type === "items" ? onIds : [],
      origin: { ...scope, item_ids: onIds.length ? onIds : [Number(itemId)] },
      remove: null,
    };
  });
}

/**
 * Save plan for one item's edited groups:
 *   itemGroups  → PUT …/items/:itemId/modifier-groups (what this item keeps)
 *   scopeCalls  → PUT …/modifier-groups/:groupId (sync every shared or formerly shared group)
 *   deleteIds   → DELETE …/modifier-groups/:groupId (shared group deleted everywhere)
 */
export function planItemModifierSave(groups, { itemId, itemSection }) {
  const itemGroups = [];
  const scopeCalls = [];
  const deleteIds = [];
  for (const group of groups || []) {
    const origin = group.origin || { type: "item", item_ids: [Number(itemId)] };
    const wasShared = isSharedScope(origin);
    if (group.remove) {
      if (!wasShared) continue;
      const remaining = (origin.item_ids || []).map(Number).filter((id) => id !== Number(itemId));
      if (group.remove === "all" || remaining.length === 0) {
        deleteIds.push(group.id);
      } else {
        const [serialized] = fromEditorGroups([{ ...group, remove: null, applies_to: { type: "items" } }]);
        if (serialized) {
          scopeCalls.push({ groupId: group.id, body: { group: serialized, applies_to: { type: "items" }, item_ids: remaining } });
        }
      }
      continue;
    }
    const scope = normalizeScope(group.applies_to);
    const [serialized] = fromEditorGroups([{ ...group, applies_to: scope }]);
    if (!serialized) continue;
    const onThisItem = scope.type !== "section" || sectionKey(scope.section) === sectionKey(itemSection);
    if (onThisItem) itemGroups.push(serialized);
    if (isSharedScope(scope) || wasShared) {
      const body = { group: serialized, applies_to: scope };
      if (scope.type === "items") {
        body.item_ids = [...new Set([Number(itemId), ...(group.item_ids || []).map(Number)])];
      } else if (scope.type === "item") {
        body.item_ids = [Number(itemId)];
      }
      scopeCalls.push({ groupId: group.id, body });
    }
  }
  return { itemGroups, scopeCalls, deleteIds };
}
