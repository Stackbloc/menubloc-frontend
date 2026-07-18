/**
 * Option A — scrollable live Menu Preview for public restaurant profiles.
 * CK-backed item names and prices only. Read-only list; no ordering UI.
 */
const MAX_ITEMS = 100;
const SCROLL_MAX_HEIGHT = 420;

function selectItems(items, limit = MAX_ITEMS) {
  const rows = Array.isArray(items) ? items : [];
  const out = [];
  for (const item of rows) {
    const name = String(item?.name || "").trim();
    if (!name) continue;
    const price = String(item?.display_price || item?.price || "").trim();
    out.push({
      id: item?.id ?? item?.menu_item_id ?? `${name}-${out.length}`,
      name,
      price: price && price !== "0" && price !== "0.00" ? price : "",
      section: String(item?.section || "").trim(),
    });
    if (out.length >= limit) break;
  }
  return out;
}

export default function RestaurantProfileMenuPreview({
  items = [],
  isMobile = false,
}) {
  const previewItems = selectItems(items);
  if (!previewItems.length) return null;

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
      aria-label="Menu preview"
      style={{
        borderTop: isMobile ? "1px solid #e7e5e4" : "none",
        borderLeft: isMobile ? "none" : "1px solid #e7e5e4",
        padding: isMobile ? "20px 0 0" : "0 0 0 28px",
        minWidth: 0,
        width: "100%",
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 0.8,
          textTransform: "uppercase",
          color: "#78716c",
          marginBottom: 6,
        }}
      >
        Menu preview
      </div>
      <p style={{ margin: "0 0 12px", fontSize: 13, lineHeight: 1.45, color: "#78716c" }}>
        Live menu items and prices.
      </p>

      <div
        style={{
          maxHeight: SCROLL_MAX_HEIGHT,
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          paddingRight: 4,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {sections.map((section) => (
            <div key={section || "__none"}>
              {section ? (
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#44403c",
                    marginBottom: 6,
                    position: "sticky",
                    top: 0,
                    background: "#fafaf9",
                    paddingTop: 2,
                    paddingBottom: 2,
                    zIndex: 1,
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
                      justifyContent: "space-between",
                      gap: 12,
                      padding: "8px 0",
                      borderBottom: "1px solid #f5f5f4",
                      alignItems: "baseline",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: "#1c1917",
                        lineHeight: 1.35,
                        wordBreak: "break-word",
                        minWidth: 0,
                      }}
                    >
                      {item.name}
                    </span>
                    {item.price ? (
                      <span style={{ fontSize: 13, color: "#57534e", flexShrink: 0 }}>{item.price}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
