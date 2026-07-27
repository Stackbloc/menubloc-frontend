/**
 * Compact menu preview rail — teaser grouped by representative menu sections.
 * Prefers Appetizers / Entrees / Desserts / Drinks when present.
 * ≤4 sections, ≤3 items/section, ≤9 items total. Always View Full Menu when href exists.
 */
import { Link } from "react-router-dom";
import { canShowOrderAction, PROFILE_GREEN, PROFILE_INK, PROFILE_MUTED } from "./profilePrimitives.jsx";

const MAX_ITEMS = 9;
const MAX_SECTIONS = 4;
const PER_SECTION = 3;

function sectionPriority(section) {
  const s = String(section || "").toLowerCase();
  if (/signature|special|chef|popular|featured/.test(s)) return 100;
  if (/appetizer|starter|share|small plate/.test(s)) return 90;
  if (/entr[eé]e|main|burger|sandwich|bowl|plate|specialty/.test(s)) return 80;
  if (/dessert|sweet/.test(s)) return 70;
  if (/drink|beverage|cocktail|beer|wine|coffee|tea/.test(s)) return 60;
  if (/side|extra/.test(s)) return 20;
  return 40;
}

function selectHighlightSections(items) {
  const bySection = new Map();
  for (const item of Array.isArray(items) ? items : []) {
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

  const ranked = [...bySection.entries()].sort(
    (a, b) => sectionPriority(b[0]) - sectionPriority(a[0]) || a[0].localeCompare(b[0])
  );

  const sections = [];
  let total = 0;
  for (const [section, list] of ranked) {
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
  compact = true,
}) {
  const sections = selectHighlightSections(items);
  if (!sections.length) return null;

  const showOrder = canShowOrderAction(profile, menuHref);

  return (
    <aside
      data-testid="profile-menu-highlights"
      aria-label="Menu preview"
      style={{
        marginBottom: isMobile ? 16 : 0,
        padding: compact ? (isMobile ? "14px 14px" : "18px 18px") : "22px 22px",
        borderRadius: 16,
        background: "#fff",
        border: "1px solid #e7e5e4",
        boxShadow: "0 8px 28px rgba(28, 25, 23, 0.04)",
        minWidth: 0,
        maxWidth: isMobile ? "100%" : compact ? 320 : undefined,
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
          marginBottom: 12,
        }}
      >
        Menu preview
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {sections.map(({ section, items: sectionItems }) => (
          <div key={section}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: PROFILE_MUTED,
                marginBottom: 6,
                letterSpacing: 0.3,
                textTransform: "uppercase",
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
                    gap: 10,
                    padding: "6px 0",
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
          </div>
        ))}
      </div>

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
