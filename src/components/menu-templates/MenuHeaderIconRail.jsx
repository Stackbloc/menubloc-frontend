import { MENU_ROW_ICON_GAP } from "./menuPresentationUtils.js";

/** Like + Share sit immediately after the restaurant name — not aligned to item-row columns. */
export default function MenuHeaderNameWithActions({ nameSlot, onActionsClick, actions }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "nowrap", minWidth: 0 }}>
      <div style={{ minWidth: 0, flexShrink: 1 }}>{nameSlot}</div>
      <div
        onClick={onActionsClick}
        style={{ display: "flex", alignItems: "center", gap: MENU_ROW_ICON_GAP, flexShrink: 0 }}
      >
        {actions}
      </div>
    </div>
  );
}
