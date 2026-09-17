/**
 * Ambient Current Vibe avatar badge (display only).
 * Selection lives in CurrentVibeProfileSection under Favorite foods.
 * im_good = no badge. Non-neutral vibes show an emoji for Connect peers / self.
 */

import {
  DEFAULT_CURRENT_VIBE,
  badgeToneStyles,
  getCurrentVibeEntry,
  resolveCurrentVibeCatalog,
  showsCurrentVibeBadge,
} from "../../../lib/currentVibeDisplay.js";

const badgeBtnBase = {
  position: "absolute",
  right: -2,
  bottom: -2,
  width: 30,
  height: 30,
  borderRadius: "50%",
  padding: 0,
  display: "grid",
  placeItems: "center",
  fontSize: 15,
  lineHeight: 1,
  zIndex: 2,
  pointerEvents: "none",
};

export default function CurrentVibeAvatarControl({
  value = DEFAULT_CURRENT_VIBE,
  catalog = null,
  readOnly = false,
  busy = false,
  onChange,
  testIdPrefix = "current-vibe",
}) {
  // onChange / readOnly / busy kept for call-site compatibility; selection is profile section.
  void readOnly;
  void busy;
  void onChange;

  const entries = resolveCurrentVibeCatalog(catalog);
  const entry = getCurrentVibeEntry(value, entries);
  const showBadge = showsCurrentVibeBadge(value);
  if (!showBadge) return null;

  return (
    <span
      data-testid={`${testIdPrefix}-badge`}
      data-vibe={entry?.value || DEFAULT_CURRENT_VIBE}
      aria-label={entry?.label ? `Current vibe: ${entry.label}` : "Current vibe"}
      style={{
        ...badgeBtnBase,
        ...badgeToneStyles(entry?.badgeTone),
      }}
    >
      <span aria-hidden>{entry?.icon || ""}</span>
    </span>
  );
}
