export function makeManualMenuId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function emptyManualMenuItem() {
  return { id: makeManualMenuId(), name: "", description: "", price: "" };
}

export function emptyManualMenuSection() {
  return { id: makeManualMenuId(), name: "", items: [emptyManualMenuItem()] };
}

export function parseManualMenuPrice(value) {
  const cleaned = String(value ?? "").replace(/[^0-9.]/g, "").trim();
  if (!cleaned) return null;
  const n = parseFloat(cleaned);
  if (!Number.isFinite(n) || n < 0) return null;
  return n.toFixed(2);
}

export function isManualMenuItemRowStarted({ name, description, priceRaw }) {
  return Boolean(
    String(name || "").trim()
    || String(description || "").trim()
    || String(priceRaw ?? "").trim()
  );
}

export function sectionsToManualMenuItems(sections) {
  const items = [];
  for (const section of sections) {
    const sectionName = String(section.name || "").trim();
    for (const item of section.items) {
      const name = String(item.name || "").trim();
      const price = parseManualMenuPrice(item.price);
      const description = String(item.description || "").trim();

      if (!isManualMenuItemRowStarted({ name, description, priceRaw: item.price })) {
        continue;
      }

      items.push({
        section: sectionName,
        name,
        description: description || null,
        price,
        _sectionId: section.id,
        _itemId: item.id,
      });
    }
  }
  return items;
}

export function validateManualMenuSections(sections) {
  const flat = sectionsToManualMenuItems(sections);
  const errors = [];

  if (!flat.length) {
    return { ok: false, errors: ["Add at least one menu item before submitting."], flat };
  }

  flat.forEach((item, index) => {
    const row = index + 1;
    if (!item.section) errors.push(`Item ${row}: section name is required.`);
    if (!item.name) errors.push(`Item ${row}: item name is required.`);
    if (item.price == null) errors.push(`Item ${row}: enter a valid price (example: 8.99).`);
  });

  return { ok: errors.length === 0, errors, flat };
}

/** Only additional items (index > 0) may be removed — keeps the first row stable. */
export function canRemoveManualMenuItem(itemIndex, itemCount) {
  return itemCount > 1 && itemIndex > 0;
}

/** Only additional sections (index > 0) may be removed — keeps the first section stable. */
export function canRemoveManualMenuSection(sectionIndex, sectionCount) {
  return sectionCount > 1 && sectionIndex > 0;
}

export function manualMenuDraftStorageKey(restaurantId) {
  return `menuply_manual_menu_draft_${restaurantId}`;
}

export function loadManualMenuDraft(restaurantId) {
  if (!restaurantId || typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(manualMenuDraftStorageKey(restaurantId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed?.sections) || !parsed.sections.length) return null;
    return parsed;
  } catch {
    return null;
  }
}
