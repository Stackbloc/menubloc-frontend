/**
 * Compact menu preview rail — small right-side panel, not a full menu dump.
 */
import { Link } from "react-router-dom";
import { canShowOrderAction, PROFILE_GREEN, PROFILE_INK, PROFILE_MUTED } from "./profilePrimitives.jsx";

const MAX_ITEMS = 5;

function selectPreviewItems(items) {
  const out = [];
  const seen = new Set();
  for (const item of Array.isArray(items) ? items : []) {
    const name = String(item?.name || "").trim();
    if (!name || seen.has(name.toLowerCase())) continue;
    seen.add(name.toLowerCase());
    const price = String(item?.display_price || item?.price || "").trim();
    out.push({
      id: item?.id ?? item?.menu_item_id ?? `${name}-${out.length}`,
      name,
      price: price && price !== "0" && price !== "0.00" ? price : "",
    });
    if (out.length >= MAX_ITEMS) break;
  }
  return out;
}

export default function ProfileMenuHighlights({
  items = [],
  menuHref = null,
  profile = null,
  isMobile = false,
  compact = true,
}) {
  const rows = selectPreviewItems(items);
  if (!rows.length) return null;

  const showOrder = canShowOrderAction(profile, menuHref);

  return (
    <aside
      data-testid="profile-menu-highlights"
      aria-label="Menu preview"
      style={{
        marginBottom: isMobile ? 20 : 0,
        padding: compact ? (isMobile ? "14px 14px" : "16px 16px") : "22px 22px",
        borderRadius: 16,
        background: "#fff",
        border: "1px solid #e7e5e4",
        boxShadow: "0 8px 28px rgba(28, 25, 23, 0.04)",
        minWidth: 0,
        maxWidth: isMobile ? "100%" : 280,
        width: isMobile ? "100%" : undefined,
        alignSelf: "start",
        position: isMobile ? "static" : "sticky",
        top: isMobile ? undefined : 88,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: 0.8,
          textTransform: "uppercase",
          color: PROFILE_GREEN,
          marginBottom: 10,
        }}
      >
        Menu preview
      </div>

      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {rows.map((item) => (
          <li
            key={String(item.id)}
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 10,
              padding: "7px 0",
              borderBottom: "1px solid #f5f5f4",
              alignItems: "baseline",
            }}
          >
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: PROFILE_INK,
                lineHeight: 1.35,
                wordBreak: "break-word",
                minWidth: 0,
              }}
            >
              {item.name}
            </span>
            {item.price ? (
              <span style={{ fontSize: 12, color: "#57534e", flexShrink: 0 }}>{item.price}</span>
            ) : null}
          </li>
        ))}
      </ul>

      {menuHref ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
          <Link
            to={menuHref}
            data-testid="profile-view-full-menu"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 40,
              padding: "0 14px",
              borderRadius: 10,
              background: PROFILE_GREEN,
              color: "#fff",
              textDecoration: "none",
              fontSize: 13,
              fontWeight: 800,
            }}
          >
            View Full Menu
          </Link>
          {showOrder ? (
            <Link
              to={menuHref}
              data-testid="profile-order-online"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 40,
                padding: "0 14px",
                borderRadius: 10,
                border: "1px solid #d6d3d1",
                background: "#fff",
                color: PROFILE_INK,
                textDecoration: "none",
                fontSize: 13,
                fontWeight: 800,
              }}
            >
              Order Online
            </Link>
          ) : null}
        </div>
      ) : null}
    </aside>
  );
}
