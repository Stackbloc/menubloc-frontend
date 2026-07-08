import { Link } from "react-router-dom";
import { restaurantMenuPathFromRow, restaurantPathFromRow } from "../../lib/canonicalUrl.js";
import { isRestaurantMenuReady } from "../../lib/publicCardCounts.js";

function clusterMenuStatusLabel(restaurant) {
  const menuReady = isRestaurantMenuReady(restaurant);
  if (menuReady === true || restaurant?.menu_availability_state === "menu_available") {
    return { text: "Menu Available", tone: "#166534", background: "#dcfce7" };
  }
  return {
    text: "Menu Coming Soon",
    tone: "#92400e",
    background: "#fef3c7",
  };
}

export default function ClusterRestaurantListingCard({ restaurant }) {
  const name = restaurant?.restaurant_name || restaurant?.name || "Restaurant";
  const area = [restaurant?.address_line1, restaurant?.city, restaurant?.state]
    .filter(Boolean)
    .join(", ");
  const cuisine = restaurant?.cuisine || restaurant?.category || null;
  const menuReady = isRestaurantMenuReady(restaurant);
  const profileHref = restaurantPathFromRow(restaurant);
  const menuHref = restaurantMenuPathFromRow(restaurant);
  const status = clusterMenuStatusLabel(restaurant);
  const canLinkProfile = Boolean(profileHref);
  const canLinkMenu = menuReady === true && Boolean(menuHref);

  const cardBody = (
  <div
    style={{
      display: "grid",
      gap: "0.35rem",
      padding: "0.9rem 1rem",
      borderRadius: 12,
      border: "1px solid #e5e7eb",
      background: "#fff",
    }}
  >
    <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", alignItems: "flex-start" }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 600, color: "#111827" }}>{name}</div>
        {cuisine ? <div style={{ color: "#6b7280", fontSize: "0.9rem" }}>{cuisine}</div> : null}
        {area ? <div style={{ color: "#9ca3af", fontSize: "0.85rem", marginTop: "0.15rem" }}>{area}</div> : null}
      </div>
      <span
        style={{
          flexShrink: 0,
          fontSize: "0.75rem",
          fontWeight: 600,
          color: status.tone,
          background: status.background,
          borderRadius: 999,
          padding: "0.2rem 0.55rem",
          whiteSpace: "nowrap",
        }}
      >
        {status.text}
      </span>
    </div>
    <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", fontSize: "0.85rem" }}>
      {canLinkProfile ? (
        <Link to={profileHref} style={{ color: "#2563eb", textDecoration: "none" }}>
          View profile
        </Link>
      ) : null}
      {canLinkMenu ? (
        <Link to={menuHref} style={{ color: "#2563eb", textDecoration: "none" }}>
          View menu
        </Link>
      ) : null}
    </div>
  </div>
  );

  if (canLinkMenu) {
    return <Link to={menuHref} style={{ textDecoration: "none", color: "inherit" }}>{cardBody}</Link>;
  }
  if (canLinkProfile) {
    return <Link to={profileHref} style={{ textDecoration: "none", color: "inherit" }}>{cardBody}</Link>;
  }
  return cardBody;
}
