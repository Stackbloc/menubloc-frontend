/**
 * Highlight / partial menu for the public restaurant profile.
 *
 * Read-only quick reference only:
 * - No basket / add-to-order
 * - No Waiter
 * - Does not mount CatalogMenuRenderer
 * - Does not fetch the full enriched menu endpoint
 *
 * Data source: GET /public/restaurants/:id/menu-preview
 */
import { Link } from "react-router-dom";

const MAX_ITEMS = 8;

/**
 * Normalize preview API items (or a pre-shaped list) for display.
 * @param {object[]} items
 * @param {number} [limit=8]
 */
function selectMenuPreviewItems(items, limit = MAX_ITEMS) {
  const rows = Array.isArray(items) ? items : [];
  const out = [];
  for (const item of rows) {
    const name = String(item?.name || item?.item_name || "").trim();
    if (!name) continue;
    const price = String(
      item?.display_price || item?.price || ""
    ).trim();
    out.push({
      id: item?.id ?? item?.menu_item_id ?? `${name}-${out.length}`,
      name,
      price: price && price !== "0" && price !== "0.00" ? price : "",
      section: String(item?.section || item?.section_name || "").trim(),
    });
    if (out.length >= limit) break;
  }
  return out;
}

export default function RestaurantProfileMenuPreview({
  items = [],
  menuHref,
  search = "",
  viewMenuLabel = "View Full Menu",
  isMobile = false,
  heading = "Menu highlights",
}) {
  const previewItems = selectMenuPreviewItems(items, MAX_ITEMS);
  if (!previewItems.length || !menuHref) return null;

  const sections = [];
  const bySection = new Map();
  for (const item of previewItems) {
    const key = item.section || "";
    if (!bySection.has(key)) {
      bySection.set(key, []);
      sections.push(key);
    }
    bySection.get(key).push(item);
  }

  return (
    <aside
      aria-label="Menu highlights"
      style={{
        borderRadius: 18,
        border: "1px solid #e4e9f0",
        background: "#ffffff",
        boxShadow: "0 10px 30px rgba(15,23,42,0.06)",
        padding: isMobile ? 16 : 18,
        alignSelf: "start",
        width: "100%",
        minWidth: 0,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: 0.9,
          textTransform: "uppercase",
          color: "#64748b",
          marginBottom: 4,
        }}
      >
        {heading}
      </div>
      <p
        style={{
          margin: "0 0 12px",
          fontSize: 12,
          lineHeight: 1.45,
          color: "#64748b",
        }}
      >
        A partial look at the menu — open the full menu to browse everything.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {sections.map((section) => (
          <div key={section || "__none"}>
            {section ? (
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#334155",
                  marginBottom: 8,
                }}
              >
                {section}
              </div>
            ) : null}
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {bySection.get(section).map((item) => (
                <li
                  key={String(item.id)}
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    gap: 12,
                    padding: "7px 0",
                    borderBottom: "1px solid #f1f5f9",
                  }}
                >
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#0f172a",
                      lineHeight: 1.35,
                      minWidth: 0,
                      wordBreak: "break-word",
                    }}
                  >
                    {item.name}
                  </span>
                  {item.price ? (
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#475569",
                        flexShrink: 0,
                      }}
                    >
                      {item.price}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <Link
        to={{ pathname: menuHref, search: search || "" }}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          marginTop: 16,
          minHeight: 42,
          padding: "0 16px",
          borderRadius: 10,
          textDecoration: "none",
          fontSize: 14,
          fontWeight: 800,
          background: "#1d4ed8",
          color: "#ffffff",
        }}
      >
        {viewMenuLabel}
      </Link>
    </aside>
  );
}
