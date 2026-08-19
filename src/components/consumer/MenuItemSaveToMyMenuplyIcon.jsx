/**
 * Signed-in "+" icon — opens save choice (what I ate vs what I want to eat).
 */

import { Link, useLocation } from "react-router-dom";
import { useConsumer } from "../../context/ConsumerContext.jsx";
import IconHoverLabel from "../IconHoverLabel.jsx";
import { MENU_ROW_ICON_SIZE } from "../menu-templates/menuPresentationUtils.js";
import { buildMenuItemSaveChoicePath } from "../../lib/menuItemSaveToMyMenuply.js";

const GHOST_ICON_SIZE = 14;

const ghostIconStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: MENU_ROW_ICON_SIZE,
  height: MENU_ROW_ICON_SIZE,
  minWidth: MENU_ROW_ICON_SIZE,
  minHeight: MENU_ROW_ICON_SIZE,
  padding: 0,
  borderRadius: "50%",
  border: "1px solid rgba(55,65,81,0.22)",
  background: "rgba(255,255,255,0.96)",
  color: "#0f172a",
  flexShrink: 0,
  boxShadow: "0 2px 8px rgba(15, 23, 42, 0.12)",
  textDecoration: "none",
  cursor: "pointer",
  lineHeight: 0,
  verticalAlign: "middle",
};

export default function MenuItemSaveToMyMenuplyIcon({
  menuItemId,
  foodName,
  returnTo = "",
  testId = "menu-item-save-to-my-menuply",
}) {
  const location = useLocation();
  const { isAuthenticated } = useConsumer();

  if (!isAuthenticated) return null;

  const ckId = Number(menuItemId);
  const hasCkId = Number.isFinite(ckId) && ckId > 0;
  const name = String(foodName || "").trim();
  if (!name && !hasCkId) return null;

  const next = returnTo || `${location.pathname}${location.search || ""}`;
  const href = buildMenuItemSaveChoicePath({
    menuItemId: hasCkId ? ckId : undefined,
    foodName: name,
    returnTo: next,
  });

  return (
    <IconHoverLabel label="Save to My Menuply">
      <Link
        to={href}
        data-testid={testId}
        aria-label="Save to My Menuply"
        title="Save to My Menuply"
        style={ghostIconStyle}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: GHOST_ICON_SIZE + 2,
            lineHeight: 1,
            fontWeight: 800,
          }}
          aria-hidden="true"
        >
          +
        </span>
      </Link>
    </IconHoverLabel>
  );
}
