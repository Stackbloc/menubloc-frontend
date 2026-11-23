/**
 * 2026-11-22 (Andre: everything has to be approved by CK; "hold those too"): an owner upload held
 * for approval saves no dishes yet; it counts as received when dishes were found. Otherwise dishes
 * must have been imported.
 */
export function uploadHasDishes(result) {
  if (!result) return false;
  if (result.held_for_ck === true) return (Number(result.items_found) || 0) > 0;
  return (Number(result.inserted_items) || 0) + (Number(result.updated_items) || 0) > 0;
}
