/**
 * Pure helpers for Menu Worksheet (shared FE + mirrored in backend tests).
 */

export function normalizeSectionKey(name) {
  return String(name || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export function deriveSectionList(names) {
  const seen = new Map();
  for (const raw of names || []) {
    const trimmed = String(raw || "").trim().replace(/\s+/g, " ");
    if (!trimmed) continue;
    const key = normalizeSectionKey(trimmed);
    if (!seen.has(key)) seen.set(key, trimmed);
  }
  return Array.from(seen.values()).sort((a, b) => a.localeCompare(b));
}

export function resolveSectionCanonical(name, existingList) {
  const trimmed = String(name || "").trim().replace(/\s+/g, " ");
  if (!trimmed) return null;
  const key = normalizeSectionKey(trimmed);
  const hit = (existingList || []).find((s) => normalizeSectionKey(s) === key);
  return hit || trimmed;
}

function toMoney(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100) / 100;
}

function roundMoney(n) {
  return Math.round(Number(n) * 100) / 100;
}

/** Bulk scope → which price field %/$ ops mutate. */
export const BULK_PRICE_FIELDS = {
  all: "menuply_price",
  row_a: "price_a",
  row_b: "price_b",
  row_c: "price_c",
};

export function resolveBulkPriceField(scope) {
  return BULK_PRICE_FIELDS[scope] || BULK_PRICE_FIELDS.all;
}

/**
 * @param {object[]} rows
 * @param {{ mode: string, amount?: number, priceField?: string, rowIds?: number[]|null }} op
 *   priceField: menuply_price | price_a | price_b | price_c (default menuply_price)
 *   Copy modes always write menuply_price and ignore priceField.
 */
export function applyBulkPriceOp(rows, op) {
  const mode = String(op?.mode || "");
  const amount = Number(op?.amount);
  const idSet =
    Array.isArray(op?.rowIds) && op.rowIds.length > 0
      ? new Set(op.rowIds.map(Number))
      : null;
  const priceField =
    op?.priceField === "price_a" ||
    op?.priceField === "price_b" ||
    op?.priceField === "price_c" ||
    op?.priceField === "menuply_price"
      ? op.priceField
      : "menuply_price";

  const target = (row) => {
    if (!idSet) return true;
    return idSet.has(Number(row.id ?? row.client_id));
  };

  return (rows || []).map((row) => {
    if (!target(row)) return { ...row };
    const next = { ...row };
    const current = toMoney(next[priceField]);

    if (mode === "increase_pct" && Number.isFinite(amount)) {
      if (current != null) next[priceField] = roundMoney(current * (1 + amount / 100));
    } else if (mode === "decrease_pct" && Number.isFinite(amount)) {
      if (current != null) next[priceField] = roundMoney(current * (1 - amount / 100));
    } else if (mode === "increase_dollar" && Number.isFinite(amount)) {
      if (current != null) next[priceField] = roundMoney(current + amount);
      else next[priceField] = roundMoney(amount);
    } else if (mode === "decrease_dollar" && Number.isFinite(amount)) {
      if (current != null) next[priceField] = roundMoney(current - amount);
    } else if (mode === "copy_a_to_menuply") {
      next.menuply_price = toMoney(next.price_a);
    } else if (mode === "copy_b_to_menuply") {
      next.menuply_price = toMoney(next.price_b);
    } else if (mode === "copy_c_to_menuply") {
      next.menuply_price = toMoney(next.price_c);
    }
    return next;
  });
}

/**
 * Compare baseline vs current Menuply prices; flag moves greater than threshold (default 40%).
 * @returns {{ item_name: string, direction: 'increase'|'decrease', pct: number }[]}
 */
export function detectLargeMenuplyPriceChanges(baselineRows, currentRows, threshold = 0.4) {
  const baseById = new Map(
    (baselineRows || []).map((r) => [Number(r.id ?? r.client_id), r])
  );
  const out = [];
  for (const row of currentRows || []) {
    const id = Number(row.id ?? row.client_id);
    const base = baseById.get(id);
    if (!base) continue;
    const oldP = toMoney(base.menuply_price);
    const newP = toMoney(row.menuply_price);
    if (oldP == null || oldP === 0 || newP == null) continue;
    const pct = Math.abs(newP - oldP) / Math.abs(oldP);
    if (pct <= threshold) continue;
    out.push({
      item_name: String(row.item_name || "Menu item").trim() || "Menu item",
      direction: newP > oldP ? "increase" : "decrease",
      pct: Math.round(pct * 100),
    });
  }
  return out;
}

export function formatLargePriceChangeWarning(change) {
  const dir =
    change.direction === "increase"
      ? "increase greater than 40%"
      : "decrease greater than 40%";
  return `Warning ${change.item_name} price ${dir} confirm.`;
}

export const WORKSHEET_PUBLISH_FIELDS = [
  "item_name",
  "section_name",
  "description",
  "menuply_price",
];

export const WORKSHEET_PRIVATE_PRICE_FIELDS = ["price_a", "price_b", "price_c"];

/** Auto flags derived from current field values — must match backend menuWorksheetService. */
const AUTO_WARNING_FLAGS = new Set(["uncertain_price", "empty_description", "empty_name"]);

/**
 * Recompute worksheet row warning flags from current field values.
 * Clears stale empty_description / empty_name / uncertain_price when fields are filled.
 */
export function buildWorksheetWarningFlags(item) {
  const flags = [];
  const price = item?.price ?? item?.menuply_price;
  if (price == null || price === "" || !Number.isFinite(Number(price))) {
    flags.push("uncertain_price");
  }
  if (!String(item?.description || "").trim()) {
    flags.push("empty_description");
  }
  if (!String(item?.item_name || item?.name || "").trim()) {
    flags.push("empty_name");
  }
  if (Array.isArray(item?.warning_flags)) {
    for (const f of item.warning_flags) {
      if (!f || AUTO_WARNING_FLAGS.has(f) || flags.includes(f)) continue;
      flags.push(f);
    }
  }
  return flags;
}

export function priceAltLabelsStorageKey(restaurantId, menuId) {
  return `menuply.worksheet.priceAlt.${Number(restaurantId) || 0}.${Number(menuId) || 0}`;
}

export function normalizePriceAltLabels(raw) {
  const src =
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? raw
      : typeof raw === "string"
        ? (() => {
            try {
              return JSON.parse(raw || "{}");
            } catch {
              return {};
            }
          })()
        : {};
  return {
    price_a: String(src.price_a || "").trim().slice(0, 80),
    price_b: String(src.price_b || "").trim().slice(0, 80),
    price_c: String(src.price_c || "").trim().slice(0, 80),
  };
}

export function priceAltLabelsHaveValues(labels) {
  const n = normalizePriceAltLabels(labels);
  return Boolean(n.price_a || n.price_b || n.price_c);
}

/**
 * Prefer server labels when present; otherwise fall back to device localStorage
 * (one-time migration path until the next Save Worksheet).
 */
export function resolvePriceAltLabels(serverLabels, localLabels) {
  const server = normalizePriceAltLabels(serverLabels);
  if (priceAltLabelsHaveValues(server)) return server;
  return normalizePriceAltLabels(localLabels);
}

export function readPriceAltLabels(restaurantId, menuId) {
  try {
    const raw = localStorage.getItem(priceAltLabelsStorageKey(restaurantId, menuId));
    if (!raw) return { price_a: "", price_b: "", price_c: "" };
    return normalizePriceAltLabels(JSON.parse(raw));
  } catch {
    return { price_a: "", price_b: "", price_c: "" };
  }
}

export function writePriceAltLabels(restaurantId, menuId, labels) {
  try {
    localStorage.setItem(
      priceAltLabelsStorageKey(restaurantId, menuId),
      JSON.stringify(normalizePriceAltLabels(labels))
    );
  } catch {
    // ignore quota / private mode
  }
}
