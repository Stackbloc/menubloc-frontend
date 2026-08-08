import React from "react";
import { OWNER_COLORS } from "./OwnerLayout.jsx";
import MenuplyRestaurantIdBadge from "../../components/restaurant/MenuplyRestaurantIdBadge.jsx";

/**
 * Shared restaurant identity chip for Menu Manager post-selection screens.
 * Shows: name · Menuply ID · city, state (omits missing parts).
 * Numeric #id remains available as a secondary admin hint when public id is absent.
 */
export default function OwnerRestaurantContextBar({
  name,
  id,
  menuplyPublicId = "",
  city,
  state,
  style,
  children = null,
}) {
  const displayName = String(name || "").trim() || "Unknown";
  const location = [city, state].filter(Boolean).join(", ");
  const publicId = String(menuplyPublicId || "").trim();
  const idNum = Number(id);
  const hasId = Number.isFinite(idNum) && idNum > 0;
  const metaParts = [];
  if (!publicId && hasId) metaParts.push(`#${idNum}`);
  if (location) metaParts.push(location);

  return (
    <div
      data-testid="owner-restaurant-context-bar"
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        alignItems: "center",
        flexWrap: "wrap",
        padding: "12px 14px",
        borderRadius: 10,
        background: "#f0fdf4",
        border: "1px solid #bbf7d0",
        ...style,
      }}
    >
      <div>
        <div style={{ fontWeight: 700, fontSize: 14, color: "#15803d" }}>{displayName}</div>
        {publicId ? (
          <div style={{ marginTop: 8 }}>
            <MenuplyRestaurantIdBadge menuplyPublicId={publicId} compact />
          </div>
        ) : null}
        {metaParts.length > 0 ? (
          <div style={{ fontSize: 12, color: OWNER_COLORS.muted, marginTop: 4 }}>
            {metaParts.join(" · ")}
          </div>
        ) : null}
      </div>
      {children}
    </div>
  );
}
