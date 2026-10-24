/**
 * Pure helpers for the tap-to-order item sheet (Andre, 2026-10-23 — Square Online / Viztango feel):
 * quantity × (base + chosen options), per-group min/max rules, and the photo list.
 */
import { normalizeModifierGroups } from "./modifierModel.js";

export const MAX_ITEM_QUANTITY = 99;

export function clampQuantity(value) {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(n, MAX_ITEM_QUANTITY);
}

export function getSheetGroups(item) {
  return normalizeModifierGroups(item);
}

/** "Choose 1", "Choose up to 3", "Choose 2 to 4", "Choose 2" — what the diner must do in a group. */
export function describeGroupRule(group) {
  const min = Number(group?.minSelections || 0);
  const max = Number(group?.maxSelections || 0);
  if (max <= 0) return "";
  if (min > 0 && min === max) return `Choose ${min}`;
  if (min > 0) return `Choose ${min} to ${max}`;
  if (max === 1) return "Choose 1";
  return `Choose up to ${max}`;
}

/** Radio rows when exactly one option may be picked; checkboxes otherwise. */
export function isSingleChoiceGroup(group) {
  return Number(group?.maxSelections) === 1;
}

/**
 * Next selection for a group after tapping an option. Radios swap (required radios never
 * un-pick); checkboxes add until max, then ignore further adds.
 */
export function toggleGroupSelection(group, selectedIds, optionId) {
  const current = Array.isArray(selectedIds) ? selectedIds : [];
  const exists = current.includes(optionId);
  if (isSingleChoiceGroup(group)) {
    if (exists) return group.minSelections > 0 ? current : [];
    return [optionId];
  }
  if (exists) return current.filter((id) => id !== optionId);
  if (current.length >= group.maxSelections) return current;
  return [...current, optionId];
}

export function groupSelectionStatus(group, selectedIds) {
  const count = Array.isArray(selectedIds) ? selectedIds.length : 0;
  if (count < group.minSelections) return { ok: false, reason: "min", missing: group.minSelections - count };
  if (count > group.maxSelections) return { ok: false, reason: "max", extra: count - group.maxSelections };
  return { ok: true };
}

/** First group that still blocks "Add to order", or null. */
export function firstBlockingGroup(groups, selectedByGroup) {
  for (const group of groups || []) {
    if (!groupSelectionStatus(group, selectedByGroup?.[group.groupId]).ok) return group;
  }
  return null;
}

export function selectedModifiers(groups, selectedByGroup) {
  return (groups || []).flatMap((group) => {
    const ids = selectedByGroup?.[group.groupId] || [];
    return group.options.filter((option) => ids.includes(option.optionId));
  });
}

export function computeSheetTotalCents(basePriceCents, groups, selectedByGroup, quantity) {
  const base = Math.max(0, Math.round(Number(basePriceCents) || 0));
  const extras = selectedModifiers(groups, selectedByGroup).reduce(
    (sum, option) => sum + Math.max(0, Math.round(Number(option.priceDeltaCents) || 0)),
    0
  );
  return (base + extras) * clampQuantity(quantity);
}

export function formatCents(cents) {
  return `$${(Math.round(Number(cents) || 0) / 100).toFixed(2)}`;
}

function text(value) {
  return String(value || "").trim();
}

/** Primary photo first, then any extra photos the API sends (photo_urls / photos[]), de-duplicated. */
export function getItemPhotoUrls(item) {
  const urls = [
    text(item?.image_url) || text(item?.photo_url) || text(item?.image) || text(item?.menu_item_image_url),
  ];
  const extra = Array.isArray(item?.photo_urls) ? item.photo_urls : Array.isArray(item?.photos) ? item.photos : [];
  for (const entry of extra) {
    urls.push(typeof entry === "string" ? text(entry) : text(entry?.photo_url || entry?.url || entry?.image_url));
  }
  return [...new Set(urls.filter(Boolean))];
}
