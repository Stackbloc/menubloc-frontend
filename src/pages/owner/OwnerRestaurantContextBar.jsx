import React from "react";
import { OWNER_COLORS } from "./OwnerLayout.jsx";
import MenuplyRestaurantIdBadge from "../../components/restaurant/MenuplyRestaurantIdBadge.jsx";

/**
 * Shared restaurant identity chip for Menu Manager post-selection screens.
 * Shows: name · street address · city/state/zip · Menuply ID / #id.
 */
export default function OwnerRestaurantContextBar({
  name,
  id,
  menuplyPublicId = "",
  city,
  state,
  addressLine1,
  postalCode,
  style,
  children = null,
}) {
  const displayName = String(name || "").trim() || "Unknown";
  const streetProvided = addressLine1 !== undefined && addressLine1 !== null;
  const street = String(addressLine1 || "").trim();
  const cityState = [city, state].filter(Boolean).join(", ");
  const zip = String(postalCode || "").trim();
  const location = cityState && zip ? `${cityState} ${zip}` : cityState || zip || "";
  const publicId = String(menuplyPublicId || "").trim();
  const idNum = Number(id);
  const hasId = Number.isFinite(idNum) && idNum > 0;
  const metaParts = [];
  // Only when caller supplies addressLine1 (Menu Manager select/load): show street or explicit missing.
  if (streetProvided) metaParts.push(street || "No address on file");
  if (location) metaParts.push(location);
  if (!publicId && hasId) metaParts.push(`#${idNum}`);

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
          <div
            style={{
              fontSize: 12,
              color: streetProvided && !street ? "#b45309" : OWNER_COLORS.muted,
              marginTop: 4,
              fontWeight: streetProvided && !street ? 600 : 400,
            }}
          >
            {metaParts.join(" · ")}
          </div>
        ) : null}
      </div>
      {children}
    </div>
  );
}
