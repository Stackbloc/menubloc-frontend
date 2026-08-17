import AddMenuAction from "./AddMenuAction.jsx";
import { canShowAddMenu } from "../lib/addMenuContribution.js";
import { profileReadableSurfaceStyle } from "./restaurant/publicProfile/profilePrimitives.jsx";

export default function AddMenuEmptyPlaceholder({
  restaurant = null,
  testId = "add-menu-empty-placeholder",
}) {
  if (!canShowAddMenu(restaurant)) return null;

  return (
    <div
      data-testid={testId}
      data-profile-surface="card"
      style={{
        ...profileReadableSurfaceStyle({
          marginBottom: 20,
          padding: "28px 18px",
        }),
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        gap: 10,
      }}
    >
      <AddMenuAction restaurant={restaurant} prominent testId="add-menu-empty-icon" />
    </div>
  );
}
