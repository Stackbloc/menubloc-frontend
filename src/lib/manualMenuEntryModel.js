export const MANUAL_MENU_FIELD_PLACEHOLDERS = {
  sectionName: "Appetisers (for example)",
  itemName: "Mozzarella Sticks (for example)",
  price: "8.99 (for example)",
  description: "Fried mozzarella served with marinara (for example)",
};

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
  sections.forEach((section, sectionIndex) => {
    const sectionName = String(section.name || "").trim();
    section.items.forEach((item, itemIndexInSection) => {
      const name = String(item.name || "").trim();
      const price = parseManualMenuPrice(item.price);
      const description = String(item.description || "").trim();

      if (!isManualMenuItemRowStarted({ name, description, priceRaw: item.price })) {
        return;
      }

      items.push({
        section: sectionName,
        name,
        description: description || null,
        price,
        sectionIndex,
        itemIndexInSection,
        _sectionId: section.id,
        _itemId: item.id,
      });
    });
  });
  return items;
}

function formatItemLabel(item, sectionNumber) {
  if (item.name) return `"${item.name}" in Section ${sectionNumber}`;
  return `the item in Section ${sectionNumber}, row ${item.itemIndexInSection + 1}`;
}

export function validateManualMenuSections(sections) {
  const flat = sectionsToManualMenuItems(sections);
  const errors = [];
  const invalidSectionIds = new Set();

  if (!flat.length) {
    return {
      ok: false,
      errors: ["Add at least one menu item before submitting."],
      flat,
      invalidSectionIds: [],
    };
  }

  sections.forEach((section, sectionIndex) => {
    const sectionName = String(section.name || "").trim();
    const sectionNumber = sectionIndex + 1;
    const startedItems = flat.filter((item) => item._sectionId === section.id);
    if (!startedItems.length) return;

    if (!sectionName) {
      invalidSectionIds.add(section.id);
      const preview = startedItems
        .map((item) => item.name)
        .filter(Boolean)
        .slice(0, 2)
        .join(", ");
      errors.push(
        preview
          ? `Section ${sectionNumber}: add a section name for ${preview}${startedItems.length > 2 ? ", …" : ""}.`
          : `Section ${sectionNumber}: add a section name for the items below.`
      );
    }

    startedItems.forEach((item) => {
      const label = formatItemLabel(item, sectionNumber);
      if (!item.name) errors.push(`${label}: item name is required.`);
      if (item.price == null) errors.push(`${label}: enter a valid price (example: 8.99).`);
    });
  });

  return {
    ok: errors.length === 0,
    errors,
    flat,
    invalidSectionIds: [...invalidSectionIds],
  };
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
