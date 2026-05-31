function text(value) {
  return String(value || "").trim();
}

export function getMenuItemImageUrl(item) {
  return (
    text(item?.image_url) ||
    text(item?.photo_url) ||
    text(item?.image) ||
    text(item?.menu_item_image_url) ||
    ""
  );
}

export function getMenuSectionImageUrl(section) {
  const explicit =
    text(section?.image_url) ||
    text(section?.photo_url) ||
    text(section?.hero_image_url) ||
    text(section?.cover_image_url);
  if (explicit) return explicit;

  const items = Array.isArray(section?.items) ? section.items : [];
  return items.map(getMenuItemImageUrl).find(Boolean) || "";
}
