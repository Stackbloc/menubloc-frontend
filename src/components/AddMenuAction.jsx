import { useNavigate } from "react-router-dom";
import { useConsumer } from "../context/ConsumerContext.jsx";
import IconHoverLabel from "./IconHoverLabel.jsx";
import AddMenuIcon from "./icons/AddMenuIcon.jsx";
import {
  ADD_MENU_HOVER_LABEL,
  buildAddMenuLoginPath,
  buildAddMenuPath,
  canShowAddMenu,
} from "../lib/addMenuContribution.js";
import { ghostIconStyle, MENU_ROW_ICON_SIZE } from "./restaurant/publicProfile/profilePrimitives.jsx";

export default function AddMenuAction({
  restaurant = null,
  dark = false,
  size = 14,
  testId = "add-menu-action",
}) {
  const navigate = useNavigate();
  const { isAuthenticated } = useConsumer();
  if (!canShowAddMenu(restaurant)) return null;

  const addMenuPath = buildAddMenuPath(restaurant);
  if (!addMenuPath) return null;

  function handleClick(event) {
    event.preventDefault();
    event.stopPropagation();
    if (!isAuthenticated) {
      navigate(buildAddMenuLoginPath(addMenuPath), {
        state: { redirectTo: addMenuPath },
      });
      return;
    }
    navigate(addMenuPath);
  }

  return (
    <IconHoverLabel label={ADD_MENU_HOVER_LABEL} wrap maxWidth={240}>
      <button
        type="button"
        data-testid={testId}
        aria-label={ADD_MENU_HOVER_LABEL}
        title={ADD_MENU_HOVER_LABEL}
        onClick={handleClick}
        style={{
          ...ghostIconStyle(dark),
          appearance: "none",
          width: MENU_ROW_ICON_SIZE,
          height: MENU_ROW_ICON_SIZE,
          minWidth: MENU_ROW_ICON_SIZE,
          minHeight: MENU_ROW_ICON_SIZE,
        }}
      >
        <AddMenuIcon size={size} color="currentColor" />
      </button>
    </IconHoverLabel>
  );
}
