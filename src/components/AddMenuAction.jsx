import { useNavigate } from "react-router-dom";
import { useConsumer } from "../context/ConsumerContext.jsx";
import IconHoverLabel from "./IconHoverLabel.jsx";
import AddMenuIcon from "./icons/AddMenuIcon.jsx";
import {
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
  prominent = false,
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

  const buttonStyle = prominent
    ? {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 72,
        height: 72,
        padding: 0,
        borderRadius: "50%",
        border: "1.5px solid #d6d3d1",
        background: "#fff",
        color: "#0f172a",
        cursor: "pointer",
        appearance: "none",
        lineHeight: 0,
        boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
      }
    : {
        ...ghostIconStyle(dark),
        appearance: "none",
        width: MENU_ROW_ICON_SIZE,
        height: MENU_ROW_ICON_SIZE,
        minWidth: MENU_ROW_ICON_SIZE,
        minHeight: MENU_ROW_ICON_SIZE,
      };

  return (
    <IconHoverLabel label="Add Menu">
      <button
        type="button"
        data-testid={testId}
        aria-label="Add Menu"
        title="Add Menu"
        onClick={handleClick}
        style={buttonStyle}
      >
        <AddMenuIcon size={prominent ? 28 : size} color="currentColor" />
      </button>
    </IconHoverLabel>
  );
}
