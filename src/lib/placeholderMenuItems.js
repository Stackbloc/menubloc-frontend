export function placeholderMenuItemLabel(item) {
  if (!item) return "";
  if (typeof item === "string") return String(item).trim();
  if (typeof item === "object") return String(item.name || "").trim();
  return "";
}

export function placeholderMenuItemDescription(item) {
  if (!item || typeof item !== "object") return "";
  return String(item.description || "").trim();
}
