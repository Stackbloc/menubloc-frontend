// menubloc-frontend/src/pages/MenuItemProfile.jsx
import React, { useMemo } from "react";
import { Link, useParams } from "react-router-dom";

export default function MenuItemProfile() {
  const { restaurantId, menuItemId } = useParams();
  const rid = useMemo(() => String(restaurantId || "").trim(), [restaurantId]);
  const mid = useMemo(() => String(menuItemId || "").trim(), [menuItemId]);

  return (
    <div style={{ padding: 16, maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <h2 style={{ margin: 0 }}>
          Item #{mid} <span style={{ color: "#666", fontSize: 14 }}>(Restaurant #{rid})</span>
        </h2>

        <div style={{ display: "flex", gap: 12 }}>
          <Link to={`/r/${rid}`} style={{ fontWeight: 900, textDecoration: "underline", color: "#111" }}>
            Restaurant
          </Link>
          <Link to="/discover" style={{ fontWeight: 900, textDecoration: "underline", color: "#111" }}>
            Back to search
          </Link>
        </div>
      </div>

      <div style={{ marginTop: 16, padding: 14, borderRadius: 12, border: "1px solid #eee", background: "#fafafa" }}>
        This is a placeholder page. Next step is to add backend endpoint: <b>/public/menu-items/:id</b>.
      </div>
    </div>
  );
}
