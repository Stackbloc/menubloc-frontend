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

export function applyBulkPriceOp(rows, op) {
  const mode = String(op?.mode || "");
  const amount = Number(op?.amount);
  const idSet =
    Array.isArray(op?.rowIds) && op.rowIds.length > 0
      ? new Set(op.rowIds.map(Number))
      : null;

  const target = (row) => {
    if (!idSet) return true;
    return idSet.has(Number(row.id ?? row.client_id));
  };

  return (rows || []).map((row) => {
    if (!target(row)) return { ...row };
    const next = { ...row };
    const mp = toMoney(next.menuply_price);

    if (mode === "increase_pct" && Number.isFinite(amount)) {
      if (mp != null) next.menuply_price = roundMoney(mp * (1 + amount / 100));
    } else if (mode === "decrease_pct" && Number.isFinite(amount)) {
      if (mp != null) next.menuply_price = roundMoney(mp * (1 - amount / 100));
    } else if (mode === "increase_dollar" && Number.isFinite(amount)) {
      if (mp != null) next.menuply_price = roundMoney(mp + amount);
      else next.menuply_price = roundMoney(amount);
    } else if (mode === "decrease_dollar" && Number.isFinite(amount)) {
      if (mp != null) next.menuply_price = roundMoney(mp - amount);
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

export const WORKSHEET_PUBLISH_FIELDS = [
  "item_name",
  "section_name",
  "description",
  "menuply_price",
];

export const WORKSHEET_PRIVATE_PRICE_FIELDS = ["price_a", "price_b", "price_c"];
