/** Legacy slugs → canonical public cluster slug (trademark-safe renames). */
export const CLUSTER_SLUG_ALIASES = Object.freeze({
  "coachella-2027": "indio-festival-grounds",
});

export const INDIO_FESTIVAL_GROUNDS_SLUG = "indio-festival-grounds";
export const LEGACY_COACHELLA_CLUSTER_SLUG = "coachella-2027";

export const INDIO_FESTIVAL_GROUNDS_CLUSTER_PATH =
  "/clusters/california/indio/indio-festival-grounds";

export const LEGACY_COACHELLA_CLUSTER_PATH =
  "/clusters/california/indio/coachella-2027";

export function resolveClusterSlug(slug) {
  const key = String(slug || "")
    .trim()
    .toLowerCase();
  if (!key) return key;
  return CLUSTER_SLUG_ALIASES[key] || key;
}

export function isLegacyClusterSlug(slug) {
  const key = String(slug || "")
    .trim()
    .toLowerCase();
  return Boolean(key && CLUSTER_SLUG_ALIASES[key]);
}
