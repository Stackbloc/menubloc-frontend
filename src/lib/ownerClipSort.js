/**
 * Clip Manager table sorting (Andre 2026-11-04): click a column header to sort the
 * loaded clips ascending, click again for descending. Blanks always sort last.
 */
import { formatOwnerVideoCreatorLabel } from "./ownerVideoCatalogLabels.js";

export function clipSettingsLabel(row) {
  const bits = [];
  if (row.play_muted === true) bits.push("Muted");
  if (row.food_form) bits.push(row.food_form);
  if (row.cuisine) bits.push(row.cuisine);
  if (row.manager_active === false) bits.push("Inactive");
  if (row.is_entertainment === true) bits.push("Entertainment");
  if (row.run_starts_at || row.run_ends_at) bits.push("Scheduled");
  return bits.join(" · ");
}

export const CLIP_SORTABLE_KEYS = [
  "asset_number",
  "video_id",
  "video_kind",
  "title",
  "restaurant_name",
  "menu_item_name",
  "cluster_name",
  "creator",
  "tagged",
  "settings",
  "created_at",
];

export function clipSortValue(row, key) {
  switch (key) {
    case "asset_number":
      return row.asset_number != null ? Number(row.asset_number) : null;
    case "video_id": {
      // ate:9 before ate:10 — kind first, then the number.
      const [k, n] = String(row.video_id || "").split(":");
      return row.video_id ? [k || "", Number(n) || 0] : null;
    }
    case "creator":
      return formatOwnerVideoCreatorLabel(row) || null;
    case "tagged":
      return row.is_tagged ? "Tagged" : "Needs metadata";
    case "settings":
      return clipSettingsLabel(row) || null;
    case "created_at": {
      const t = row.created_at ? Date.parse(row.created_at) : NaN;
      return Number.isFinite(t) ? t : null;
    }
    default: {
      const v = row[key];
      return v == null || String(v).trim() === "" ? null : String(v).trim();
    }
  }
}

function compareClipValues(a, b) {
  if (Array.isArray(a) && Array.isArray(b)) {
    return compareClipValues(a[0], b[0]) || compareClipValues(a[1], b[1]);
  }
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), undefined, { sensitivity: "base", numeric: true });
}

/** Sorts the loaded rows; blanks ("—") always go last in either direction. */
export function sortClipRows(rows, sort) {
  if (!sort?.key) return rows;
  const dir = sort.dir === "desc" ? -1 : 1;
  return rows
    .map((row, index) => ({ row, index, value: clipSortValue(row, sort.key) }))
    .sort((x, y) => {
      if (x.value == null && y.value == null) return x.index - y.index;
      if (x.value == null) return 1;
      if (y.value == null) return -1;
      return compareClipValues(x.value, y.value) * dir || x.index - y.index;
    })
    .map((entry) => entry.row);
}
