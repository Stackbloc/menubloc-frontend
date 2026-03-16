// menubloc-frontend/src/GrubbidMenuView.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MOCK_MENU } from "./mockMenu.js";
import { MKS_CATEGORIES, mapRawCategoryToMks } from "./mks/mksCategories.js";

// -----------------------------
// Helpers
// -----------------------------
function money(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return "";
  return `$${n.toFixed(2)}`;
}

function readTheme() {
  try {
    const v = localStorage.getItem("grubbid_theme");
    return v === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

function writeTheme(v) {
  try {
    localStorage.setItem("grubbid_theme", v);
  } catch {
    // ignore
  }
}

function safeText(v) {
  return String(v ?? "").trim();
}

function lower(v) {
  return safeText(v).toLowerCase();
}

// MKS-ish ordering helpers (best effort)
function orderVal(obj) {
  const keys = ["mks_order", "item_order", "sort_order", "order", "position", "rank", "idx"];
  for (const k of keys) {
    if (obj && obj[k] !== undefined && obj[k] !== null && obj[k] !== "") {
      const n = Number(obj[k]);
      if (Number.isFinite(n)) return n;
    }
  }
  return null;
}

function sortItemsStable(a, b) {
  const ao = orderVal(a);
  const bo = orderVal(b);
  if (ao !== null && bo !== null && ao !== bo) return ao - bo;
  if (ao !== null && bo === null) return -1;
  if (ao === null && bo !== null) return 1;

  const an = lower(a?.name || a?.title);
  const bn = lower(b?.name || b?.title);
  if (an < bn) return -1;
  if (an > bn) return 1;

  const aid = Number(a?.id ?? 0);
  const bid = Number(b?.id ?? 0);
  return aid - bid;
}

function mksMeta(code) {
  const x = MKS_CATEGORIES.find((c) => c.code === code);
  return x || { code: "OTHER", label: "Other", order: 999 };
}

// If menu is flat, try to infer a category from item fields
function itemRawCategory(it) {
  const candidates = [
    it?.category,
    it?.category_name,
    it?.section,
    it?.section_name,
    it?.menu_section,
    it?.group,
    it?.group_name,
    it?.mks_category_label,
    it?.mks_category,
  ];
  for (const c of candidates) {
    const s = safeText(c);
    if (s) return s;
  }
  return "";
}

/**
 * Normalize incoming menu data into:
 * { restaurant, categories: [{ key/title, items: [...] }] }
 */
function normalizeToCategories(raw) {
  const d = raw || {};
  const restaurant = d.restaurant || d.meta?.restaurant || null;

  if (Array.isArray(d.categories)) {
    return { restaurant, categories: d.categories };
  }

  const sections = Array.isArray(d.menu)
    ? d.menu
    : Array.isArray(d.sections)
    ? d.sections
    : Array.isArray(d.menu_sections)
    ? d.menu_sections
    : null;

  if (sections) {
    const categories = sections.map((s, idx) => {
      const title = s?.title || s?.name || s?.key || `Section ${idx + 1}`;
      const items = Array.isArray(s?.items)
        ? s.items
        : Array.isArray(s?.menu_items)
        ? s.menu_items
        : Array.isArray(s?.menuItems)
        ? s.menuItems
        : [];
      return { key: title, title, items };
    });
    return { restaurant, categories };
  }

  // Flat list fallback
  const flatItems = Array.isArray(d.items)
    ? d.items
    : Array.isArray(d.menuItems)
    ? d.menuItems
    : Array.isArray(d.menu_items)
    ? d.menu_items
    : [];

  if (flatItems.length) {
    const byCat = new Map();
    for (const it of flatItems) {
      const rawCat = itemRawCategory(it) || "Other";
      if (!byCat.has(rawCat)) byCat.set(rawCat, []);
      byCat.get(rawCat).push(it);
    }
    const categories = Array.from(byCat.entries()).map(([title, items]) => ({
      key: title,
      title,
      items,
    }));
    return { restaurant, categories };
  }

  return { restaurant, categories: [] };
}

// -----------------------------
// Panels (Insights, Nutrition; Pairings conditional)
// -----------------------------
function getPanelPayload(item, key) {
  const obj = item?.signals && typeof item.signals === "object" ? item.signals : null;

  const direct =
    key === "insights"
      ? item?.insights ?? item?.signal_insights
      : key === "nutrition"
      ? item?.nutrition ?? item?.signal_nutrition
      : item?.pairings ?? item?.signal_pairings;

  const v = (obj && obj[key] !== undefined ? obj[key] : undefined) ?? direct;

  if (Array.isArray(v)) return v.map((x) => safeText(x)).filter(Boolean);
  if (typeof v === "string") return safeText(v) ? [safeText(v)] : [];
  return [];
}

// -----------------------------
// Indicators (locked approved list)
// NOTE: NO "trending".
// -----------------------------
const INDICATOR_ORDER = ["deal", "popular", "recommended", "new"];
const INDICATOR_ALLOWED = new Set(INDICATOR_ORDER);

function normalizeIndicators(arr) {
  const rawArr = Array.isArray(arr) ? arr : [];
  return rawArr
    .map((x) => lower(x))
    .filter(Boolean)
    .filter((x) => INDICATOR_ALLOWED.has(x));
}

function getIndicatorsFromItem(item) {
  const fromIndicators = Array.isArray(item?.indicators) ? item.indicators : [];
  const fromCues = Array.isArray(item?.cues) ? item.cues : [];
  const fromBadges = Array.isArray(item?.badges) ? item.badges : [];
  const fromTags = Array.isArray(item?.tags) ? item.tags : [];
  const fromSignalsArray = Array.isArray(item?.signals) ? item.signals : [];

  const merged = [...fromIndicators, ...fromCues, ...fromBadges, ...fromTags, ...fromSignalsArray];
  const out = [];
  const seen = new Set();
  for (const x of normalizeIndicators(merged)) {
    if (seen.has(x)) continue;
    seen.add(x);
    out.push(x);
  }
  return out.slice(0, 2); // keep it tight inline
}

function indicatorMeta(code) {
  switch (code) {
    case "deal":
      return { icon: "💲", label: "Deal" };
    case "popular":
      return { icon: "★", label: "Popular" };
    case "recommended":
      return { icon: "🧠", label: "Recommended" };
    case "new":
      return { icon: "🆕", label: "New" };
    default:
      return null;
  }
}

function mockIndicatorForIndex(i) {
  return INDICATOR_ORDER[i % INDICATOR_ORDER.length];
}

// -----------------------------
// Restaurant meta (address / distance / phone order)
// -----------------------------
function pickFirst(obj, keys) {
  for (const k of keys) {
    const s = safeText(obj?.[k]);
    if (s) return s;
  }
  return "";
}

function computeAddressLine(r) {
  const line1 = pickFirst(r, ["address_line1", "address", "street", "street_address"]);
  const line2 = pickFirst(r, ["address_line2", "address2", "suite", "unit"]);
  const city = pickFirst(r, ["city", "location_city"]);
  const state = pickFirst(r, ["state", "region", "location_state"]);
  const zip = pickFirst(r, ["postal_code", "zip", "zipcode"]);

  const left = [line1, line2].filter(Boolean).join(" ");
  const right = [city, state, zip].filter(Boolean).join(", ").replace(", ,", ",").trim();

  if (left && right) return `${left} • ${right}`;
  return left || right || "";
}

function computeDistanceLabel(r) {
  const candidates = [
    r?.distance_miles,
    r?.distanceMiles,
    r?.distance,
    r?.estimated_distance_miles,
    r?.meta?.distance_miles,
  ];
  for (const v of candidates) {
    const n = Number(v);
    if (Number.isFinite(n) && n >= 0) return `${n.toFixed(n < 10 ? 1 : 0)} mi`;
  }
  return "";
}

// -----------------------------
// Component
// -----------------------------
export default function GrubbidMenuView({ restaurantId = null, menuData = null }) {
  const usingMock = !menuData;
  const raw = menuData || MOCK_MENU;

  const normalized = useMemo(() => normalizeToCategories(raw), [raw]);
  const restaurant = normalized?.restaurant || null;
  const rawCats = Array.isArray(normalized?.categories) ? normalized.categories : [];

  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("ALL");
  const [theme, setTheme] = useState(readTheme());
  const [activePanel, setActivePanel] = useState("insights"); // default

  useEffect(() => writeTheme(theme), [theme]);

  const COLORS =
    theme === "light"
      ? {
          bg: "#ffffff",
          panel: "#ffffff",
          panel2: "#f6f6f7",
          border: "rgba(0,0,0,0.08)",
          border2: "rgba(0,0,0,0.14)",
          text: "rgba(0,0,0,0.92)",
          subtext: "rgba(0,0,0,0.62)",
          chipBg: "rgba(0,0,0,0.05)",
          chipActiveBg: "rgba(0,0,0,0.12)",
        }
      : {
          bg: "#0b0b0c",
          panel: "#111114",
          panel2: "#141418",
          border: "rgba(255,255,255,0.08)",
          border2: "rgba(255,255,255,0.12)",
          text: "rgba(255,255,255,0.92)",
          subtext: "rgba(255,255,255,0.65)",
          chipBg: "rgba(255,255,255,0.06)",
          chipActiveBg: "rgba(255,255,255,0.14)",
        };

  const grouped = useMemo(() => {
    const q = lower(search);
    const buckets = new Map();

    for (const cat of rawCats) {
      const rawKey = safeText(cat?.key || cat?.title || cat?.name);
      const code = mapRawCategoryToMks(rawKey);
      const meta = mksMeta(code);

      const items = Array.isArray(cat?.items) ? cat.items : [];
      const keep = items.filter((it) => {
        if (!q) return true;
        const name = lower(it?.name || it?.title);
        const desc = lower(it?.description || it?.desc);
        return name.includes(q) || desc.includes(q);
      });

      if (keep.length === 0) continue;

      if (!buckets.has(code)) {
        buckets.set(code, { code: meta.code, label: meta.label, order: meta.order, items: [] });
      }

      buckets.get(code).items.push(...keep);
    }

    let arr = Array.from(buckets.values())
      .map((b) => ({ ...b, items: [...b.items].sort(sortItemsStable) }))
      .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

    if (activeCat !== "ALL") arr = arr.filter((x) => x.code === activeCat);
    return arr;
  }, [rawCats, search, activeCat]);

  // Pairings should only exist if any item has pairings data.
  const anyPairings = useMemo(() => {
    for (const g of grouped) {
      for (const it of g.items) {
        if (getPanelPayload(it, "pairings").length > 0) return true;
      }
    }
    return false;
  }, [grouped]);

  // Panels list is conditional: Insights + Nutrition always; Pairings only if any exist.
  const PANELS = useMemo(() => {
    const base = [
      { key: "insights", label: "Insights" },
      { key: "nutrition", label: "Nutrition" },
    ];
    return anyPairings ? [...base, { key: "pairings", label: "Pairings" }] : base;
  }, [anyPairings]);

  // If Pairings disappears, ensure we don’t stay stuck on it.
  useEffect(() => {
    if (!anyPairings && activePanel === "pairings") setActivePanel("insights");
  }, [anyPairings, activePanel]);

  const tabs = useMemo(() => {
    const present = new Set(grouped.map((g) => g.code));
    return MKS_CATEGORIES.filter((c) => present.has(c.code)).sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  }, [grouped]);

  // Restaurant meta
  const restaurantName = restaurant?.name || restaurant?.restaurant_name || "Restaurant";
  const addressLine = computeAddressLine(restaurant);
  const distance = computeDistanceLabel(restaurant);
  const phone = pickFirst(restaurant, ["phone", "phone_number", "tel", "telephone"]);

  const profileRestaurantId = safeText(restaurant?.id || restaurantId);
  const profileLink = profileRestaurantId
    ? `/restaurant-profile?restaurantId=${encodeURIComponent(profileRestaurantId)}`
    : "/";

  // For mock: assign one-of-each indicator to the first N items (stable by render order).
  let mockIndicatorCursor = 0;

  return (
    <div style={{ background: COLORS.bg, minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ background: COLORS.panel, borderBottom: `1px solid ${COLORS.border}` }}>
        <div style={{ maxWidth: 980, margin: "0 auto", padding: "14px 16px 12px" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
            <div style={{ overflow: "hidden" }}>
              <Link
                to={profileLink}
                style={{
                  color: COLORS.text,
                  textDecoration: "none",
                  fontWeight: 900,
                  fontSize: 18,
                  letterSpacing: 0.2,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  display: "inline-block",
                  maxWidth: "100%",
                }}
                title="Open restaurant profile"
              >
                {restaurantName}
              </Link>

              {/* address, distance, phone — in that order */}
              <div
                style={{
                  marginTop: 6,
                  fontSize: 12.5,
                  color: COLORS.subtext,
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                {addressLine ? (
                  <span>
                    <strong style={{ color: COLORS.text, fontWeight: 900 }}>Address:</strong> {addressLine}
                  </span>
                ) : null}
                {distance ? (
                  <span>
                    <strong style={{ color: COLORS.text, fontWeight: 900 }}>Distance:</strong> {distance}
                  </span>
                ) : null}
                {phone ? (
                  <span>
                    <strong style={{ color: COLORS.text, fontWeight: 900 }}>Phone:</strong> {phone}
                  </span>
                ) : null}
                {!addressLine && !distance && !phone ? <span>Restaurant ID: {profileRestaurantId || "—"}</span> : null}
              </div>
            </div>

            <button
              onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
              style={{
                height: 38,
                padding: "0 12px",
                borderRadius: 12,
                border: `1px solid ${COLORS.border2}`,
                background: COLORS.chipBg,
                color: COLORS.text,
                cursor: "pointer",
                fontWeight: 900,
                fontSize: 13,
                whiteSpace: "nowrap",
              }}
            >
              {theme === "dark" ? "Light mode" : "Dark mode"}
            </button>
          </div>
        </div>
      </div>

      {/* Sticky controls */}
      <div
        style={{
          background: COLORS.panel,
          borderBottom: `1px solid ${COLORS.border}`,
          padding: "12px 16px",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ maxWidth: 980, margin: "0 auto", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search this menu…"
              style={{
                flex: "1 1 280px",
                height: 40,
                padding: "0 12px",
                borderRadius: 12,
                border: `1px solid ${COLORS.border2}`,
                outline: "none",
                background: COLORS.panel2,
                color: COLORS.text,
              }}
            />

            {/* Panels (Pairings only appears if any item has pairings) */}
            <div style={{ display: "flex", gap: 8, alignItems: "center", overflowX: "auto", maxWidth: "100%" }}>
              {PANELS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => setActivePanel(p.key)}
                  style={{
                    height: 40,
                    padding: "0 12px",
                    borderRadius: 999,
                    border: `1px solid ${COLORS.border2}`,
                    background: activePanel === p.key ? COLORS.chipActiveBg : COLORS.chipBg,
                    color: COLORS.text,
                    cursor: "pointer",
                    fontWeight: 900,
                    fontSize: 13,
                    whiteSpace: "nowrap",
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category tabs */}
          {tabs.length ? (
            <div style={{ display: "flex", gap: 8, alignItems: "center", overflowX: "auto", maxWidth: "100%" }}>
              <button
                onClick={() => setActiveCat("ALL")}
                style={{
                  height: 38,
                  padding: "0 12px",
                  borderRadius: 999,
                  border: `1px solid ${COLORS.border2}`,
                  background: activeCat === "ALL" ? COLORS.chipActiveBg : COLORS.chipBg,
                  color: COLORS.text,
                  cursor: "pointer",
                  fontWeight: 800,
                  fontSize: 13,
                  whiteSpace: "nowrap",
                }}
              >
                All
              </button>

              {tabs.map((c) => (
                <button
                  key={c.code}
                  onClick={() => setActiveCat(c.code)}
                  style={{
                    height: 38,
                    padding: "0 12px",
                    borderRadius: 999,
                    border: `1px solid ${COLORS.border2}`,
                    background: activeCat === c.code ? COLORS.chipActiveBg : COLORS.chipBg,
                    color: COLORS.text,
                    cursor: "pointer",
                    fontWeight: 800,
                    fontSize: 13,
                    whiteSpace: "nowrap",
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 980, margin: "0 auto", padding: "18px 12px 56px" }}>
        {grouped.length === 0 ? (
          <div
            style={{
              background: COLORS.panel,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 18,
              padding: 16,
              color: COLORS.subtext,
            }}
          >
            No items match your search.
          </div>
        ) : null}

        {grouped.map((cat, idx) => (
          <div key={cat.code} style={{ marginTop: idx === 0 ? 0 : 22 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 12 }}>
              <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: 0.3, color: COLORS.text }}>
                {cat.label}
              </div>
              <div style={{ height: 1, background: COLORS.border }} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {cat.items.map((item) => {
                const name = item?.name || item?.title || "Menu item";
                const desc = item?.description || item?.desc || "";

                const panelList = getPanelPayload(item, activePanel);

                // Pairings panel should not show for an item with no pairings
                const showPanel =
                  activePanel === "pairings" ? panelList.length > 0 : true;

                // Indicators:
                let indicators = getIndicatorsFromItem(item);
                if (usingMock && indicators.length === 0) {
                  indicators = [mockIndicatorForIndex(mockIndicatorCursor)];
                  mockIndicatorCursor += 1;
                }

                return (
                  <div
                    key={item?.id ?? `${cat.code}-${String(name)}`}
                    style={{
                      background: COLORS.panel,
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: 18,
                      padding: "12px 14px",
                    }}
                  >
                    <div style={{ display: "flex", gap: 10, alignItems: "baseline", justifyContent: "space-between" }}>
                      {/* Name + inline indicators */}
                      <div
                        style={{
                          minWidth: 0,
                          display: "flex",
                          alignItems: "baseline",
                          gap: 10,
                          flexWrap: "nowrap",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 15,
                            fontWeight: 500,
                            color: COLORS.text,
                            lineHeight: 1.2,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: 520,
                          }}
                          title={String(name)}
                        >
                          {name}
                        </div>

                        {indicators.length ? (
                          <div style={{ display: "inline-flex", gap: 6, alignItems: "center", flexWrap: "nowrap" }}>
                            {indicators.map((code) => {
                              const meta = indicatorMeta(code);
                              if (!meta) return null;
                              return (
                                <span
                                  key={code}
                                  title={meta.label}
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 6,
                                    padding: "3px 8px",
                                    borderRadius: 999,
                                    border: `1px solid ${COLORS.border}`,
                                    background: COLORS.chipBg,
                                    fontSize: 12,
                                    color: COLORS.text,
                                    fontWeight: 900,
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  <span aria-hidden="true">{meta.icon}</span>
                                  <span>{meta.label}</span>
                                </span>
                              );
                            })}
                          </div>
                        ) : null}
                      </div>

                      <div style={{ fontSize: 14, color: COLORS.text, fontWeight: 900 }}>{money(item?.price)}</div>
                    </div>

                    {desc ? (
                      <div style={{ marginTop: 6, fontSize: 13, color: COLORS.subtext, lineHeight: 1.35 }}>
                        {desc}
                      </div>
                    ) : null}

                    {/* Panels */}
                    {showPanel ? (
                      <div
                        style={{
                          marginTop: 10,
                          borderRadius: 14,
                          border: `1px solid ${COLORS.border}`,
                          background: COLORS.chipBg,
                          padding: "10px 12px",
                        }}
                      >
                        <div style={{ fontSize: 12, fontWeight: 900, color: COLORS.text, marginBottom: 6 }}>
                          {PANELS.find((p) => p.key === activePanel)?.label || "Insights"}
                        </div>

                        {panelList.length ? (
                          <ul style={{ margin: 0, paddingLeft: 18, color: COLORS.subtext, fontSize: 12.5, lineHeight: 1.35 }}>
                            {panelList.slice(0, 6).map((x, i) => (
                              <li key={`${activePanel}-${i}`}>{x}</li>
                            ))}
                          </ul>
                        ) : (
                          <div style={{ fontSize: 12.5, color: COLORS.subtext }}>No data for this item.</div>
                        )}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}