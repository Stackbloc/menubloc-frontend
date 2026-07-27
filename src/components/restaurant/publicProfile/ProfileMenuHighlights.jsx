/**
 * Menu Highlights — profile introduces the restaurant; full menu stays separate.
 * Handful of representative items + View Full Menu / Order Online.
 */
import { Link } from "react-router-dom";
import { canShowOrderAction, PROFILE_GREEN, PROFILE_INK, PROFILE_MUTED } from "./profilePrimitives.jsx";

const MAX_ITEMS = 8;
const MAX_SECTIONS = 3;
const PER_SECTION = 3;

function selectHighlightItems(items) {
  const rows = Array.isArray(items) ? items : [];
  const bySection = new Map();
  for (const item of rows) {
    const name = String(item?.name || "").trim();
    if (!name) continue;
    const section = String(item?.section || "").trim() || "Menu";
    if (!bySection.has(section)) bySection.set(section, []);
    const bucket = bySection.get(section);
    if (bucket.length >= PER_SECTION) continue;
    const price = String(item?.display_price || item?.price || "").trim();
    bucket.push({
      id: item?.id ?? item?.menu_item_id ?? `${name}-${bucket.length}`,
      name,
      price: price && price !== "0" && price !== "0.00" ? price : "",
      section,
    });
  }

  const sections = [];
  let total = 0;
  for (const [section, list] of bySection) {
    if (sections.length >= MAX_SECTIONS) break;
    const take = list.slice(0, Math.min(PER_SECTION, MAX_ITEMS - total));
    if (!take.length) continue;
    sections.push({ section, items: take });
    total += take.length;
    if (total >= MAX_ITEMS) break;
  }
  return sections;
}

export default function ProfileMenuHighlights({
  items = [],
  menuHref = null,
  profile = null,
  isMobile = false,
}) {
  const sections = selectHighlightItems(items);
  if (!sections.length) return null;

  const showOrder = canShowOrderAction(profile, menuHref);

  return (
    <section
      data-testid="profile-menu-highlights"
      aria-label="Menu highlights"
      style={{
        marginBottom: 28,
        padding: isMobile ? "18px 16px" : "22px 22px",
        borderRadius: 16,
        background: "#fff",
        border: "1px solid #e7e5e4",
        boxShadow: "0 8px 28px rgba(28, 25, 23, 0.04)",
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: 0.8,
          textTransform: "uppercase",
          color: PROFILE_GREEN,
          marginBottom: 6,
        }}
      >
        Menu highlights
      </div>
      <p style={{ margin: "0 0 16px", fontSize: 14, lineHeight: 1.5, color: PROFILE_MUTED }}>
        A taste of the menu — open the full menu to explore everything.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {sections.map(({ section, items: sectionItems }) => (
          <div key={section}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#44403c",
                marginBottom: 8,
                letterSpacing: 0.2,
              }}
            >
              {section}
            </div>
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {sectionItems.map((item) => (
                <li
                  key={String(item.id)}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    padding: "9px 0",
                    borderBottom: "1px solid #f5f5f4",
                    alignItems: "baseline",
                  }}
                >
                  <span
                    style={{
                      fontSize: 15,
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
                    <span style={{ fontSize: 14, color: "#57534e", flexShrink: 0 }}>{item.price}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {menuHref ? (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            marginTop: 18,
          }}
        >
          <Link
            to={menuHref}
            data-testid="profile-view-full-menu"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 44,
              padding: "0 18px",
              borderRadius: 12,
              background: PROFILE_GREEN,
              color: "#fff",
              textDecoration: "none",
              fontSize: 14,
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
                minHeight: 44,
                padding: "0 18px",
                borderRadius: 12,
                border: "1px solid #d6d3d1",
                background: "#fff",
                color: PROFILE_INK,
                textDecoration: "none",
                fontSize: 14,
                fontWeight: 800,
              }}
            >
              Order Online
            </Link>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
