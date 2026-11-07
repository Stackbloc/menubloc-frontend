/**
 * Owner → Bots → Nutribot → Unprocessed items → "Export spreadsheet".
 * Builds a CSV (opens in Excel / Google Sheets / Numbers) of the unprocessed items so they
 * can be handed to an AI for new dish-template suggestions. Pure helpers — no DOM here.
 */

export const UNPROCESSED_CSV_COLUMNS = [
  ["menu_item_id", "Menu item ID"],
  ["name", "Item name"],
  ["section", "Menu section"],
  ["description", "Description"],
  ["restaurant_name", "Restaurant"],
  ["restaurant_city", "City"],
  ["restaurant_state", "State"],
  ["reason", "Why not processed"],
  ["template_tried", "Template tried"],
  ["confidence", "Match confidence"],
  ["detail", "Matcher detail"],
  ["attempts", "Tries"],
  ["first_seen_at", "First seen"],
  ["last_attempted_at", "Last tried"],
];

function csvCell(value) {
  if (value == null) return "";
  let s = String(value).replace(/\r\n?/g, "\n");
  // Spreadsheet formula injection guard (names/descriptions come from scraped menus).
  if (/^[=+\-@\t]/.test(s)) s = `'${s}`;
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function unprocessedItemToRow(item, reasonLabels = {}) {
  const r = item?.restaurant || {};
  return {
    menu_item_id: item?.menu_item_id,
    name: item?.name,
    section: item?.section,
    description: item?.description,
    restaurant_name: r.name,
    restaurant_city: r.city,
    restaurant_state: r.state,
    reason: reasonLabels[item?.reason] || item?.reason,
    template_tried: item?.template_tried?.slug || (item?.template_tried?.id != null ? `#${item.template_tried.id}` : ""),
    confidence: item?.confidence,
    detail: item?.detail,
    attempts: item?.attempts,
    first_seen_at: item?.first_seen_at,
    last_attempted_at: item?.last_attempted_at,
  };
}

/** CSV text with a UTF-8 BOM so Excel shows accents (é, ñ) correctly. */
export function buildUnprocessedCsv(items, reasonLabels = {}) {
  const lines = [UNPROCESSED_CSV_COLUMNS.map(([, label]) => csvCell(label)).join(",")];
  for (const item of items || []) {
    const row = unprocessedItemToRow(item, reasonLabels);
    lines.push(UNPROCESSED_CSV_COLUMNS.map(([key]) => csvCell(row[key])).join(","));
  }
  return `﻿${lines.join("\r\n")}\r\n`;
}

export function unprocessedCsvFilename({ restaurantId = "", query = "", date = new Date() } = {}) {
  const day = date.toISOString().slice(0, 10);
  const parts = ["nutribot-unprocessed"];
  if (restaurantId) parts.push(`restaurant-${restaurantId}`);
  const q = String(query || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 30);
  if (q) parts.push(q);
  parts.push(day);
  return `${parts.join("_")}.csv`;
}
