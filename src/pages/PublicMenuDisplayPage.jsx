/**
 * ============================================================
 * Path: menubloc-frontend/src/pages/PublicMenuDisplayPage.jsx
 * Date: 2026-03-23
 * Purpose:
 *   Full-screen TV / digital menu board display mode.
 *   Route: /public/restaurants/:id/display
 *
 *   Production signage features:
 *   - Designed at 1920×1080, CSS-scaled to any TV resolution
 *   - Content capped: max 8 items per section, names/desc truncated
 *   - Page rotation: sections split into pages, auto-advance every 10s
 *   - Column balancing: sections distributed to minimize height diff
 *   - Deal banner always pinned above rotating content
 *   - Auto-refreshes live data every 30s (no flash, no scroll reset)
 *   - Pro plan gate
 * ============================================================
 */

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext.jsx";
import { getLocalizedField } from "../utils/getLocalizedField.js";

// ── TV Scaling ─────────────────────────────────────────────────────────────
// Everything is designed at 1920×1080. CSS transform scales to fill any screen.

const DESIGN_W = 1920;
const DESIGN_H = 1080;

function useScaleToViewport() {
  const [scale, setScale] = useState({ x: 1, y: 1 });
  useEffect(() => {
    function compute() {
      setScale({ x: window.innerWidth / DESIGN_W, y: window.innerHeight / DESIGN_H });
    }
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);
  return scale;
}

// ── Presentation constants ─────────────────────────────────────────────────

const MAX_ITEMS_PER_SECTION  = 8;   // Never show more than 8 items from a section
const MAX_NAME_CHARS         = 36;  // Truncate long item names
const MAX_DESC_CHARS         = 72;  // Truncate long descriptions
const TARGET_ITEMS_PER_PAGE  = 16;  // Target items per page (controls page splits)
const PAGE_DURATION_MS       = 10000;
const REFRESH_MS             = 30000;

// ── Content helpers ────────────────────────────────────────────────────────

function truncate(str, max) {
  if (!str) return "";
  const s = String(str).trim();
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

function capSection(section) {
  return { ...section, items: (section.items || []).slice(0, MAX_ITEMS_PER_SECTION) };
}

function getTranslatedField(record, field, language, fallback = "") {
  return getLocalizedField(record, field, language, fallback) || fallback;
}

// ── Page splitting ─────────────────────────────────────────────────────────
// Splits sections into screen-fitting pages. Sections are never split across
// pages — the whole section moves together.

function buildPages(sections) {
  if (!sections.length) return [[]];

  const pages = [];
  let current = [];
  let count   = 0;

  for (const section of sections) {
    const n = section.items.length;
    if (count + n > TARGET_ITEMS_PER_PAGE && current.length > 0) {
      pages.push(current);
      current = [section];
      count   = n;
    } else {
      current.push(section);
      count += n;
    }
  }
  if (current.length > 0) pages.push(current);
  return pages;
}

// ── Column balancing ───────────────────────────────────────────────────────
// Greedy bin-packing: always place next section in shortest column.

function balanceColumns(sections, colCount) {
  const cols    = Array.from({ length: colCount }, () => []);
  const heights = new Array(colCount).fill(0);
  for (const section of sections) {
    const idx = heights.indexOf(Math.min(...heights));
    cols[idx].push(section);
    heights[idx] += section.items.length + 1; // +1 for section header row
  }
  return cols;
}

// ── Page rotation ──────────────────────────────────────────────────────────

function usePageRotation(pageCount) {
  const [page,   setPage]   = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => { setPage(0); setFading(false); }, [pageCount]);

  useEffect(() => {
    if (pageCount <= 1) return;
    const t = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setPage(p => (p + 1) % pageCount);
        setFading(false);
      }, 500);
    }, PAGE_DURATION_MS);
    return () => clearInterval(t);
  }, [pageCount]);

  return { page, fading };
}

// ── Clock ──────────────────────────────────────────────────────────────────

function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function formatTime(date) {
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function formatPrice(raw) {
  if (raw == null || raw === "") return null;
  const s = String(raw).trim();
  if (!s) return null;
  if (s === "$0" || s === "$0.00" || s === "0" || s === "0.00") return null;
  if (s.startsWith("$")) return s;
  const n = Number(s);
  if (Number.isFinite(n)) {
    if (n <= 0) return null;
    return `$${n.toFixed(2)}`;
  }
  return s || null;
}

function getMenuTierLabel(menuData) {
  const status = String(
    menuData?.menu_status ||
    menuData?.status ||
    ""
  ).trim().toLowerCase();

  if (status === "verified") return "Verified Menu";
  if (status === "pro") return "Pro Menu";
  return "Unverified Menu";
}

// ── Data fetching ──────────────────────────────────────────────────────────

const API = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001").replace(/\/$/, "");

const DEFAULT_SETTINGS = {
  layout_preset:     "list",
  show_descriptions: true,
  highlight_deals:   true,
  accent_color:      null,
};

async function fetchMenuData(id) {
  const res = await fetch(`${API}/public/restaurants/${id}/menu`);
  if (!res.ok) throw new Error(`Menu fetch failed (${res.status})`);
  return res.json();
}

// Returns { settings, tv_menu_board_active }
async function fetchDisplaySettings(id) {
  try {
    const res  = await fetch(`${API}/public/restaurants/${id}/display-settings`);
    if (!res.ok) return { settings: { ...DEFAULT_SETTINGS }, tv_menu_board_active: false };
    const json = await res.json();
    return {
      settings:             json.ok && json.settings ? { ...DEFAULT_SETTINGS, ...json.settings } : { ...DEFAULT_SETTINGS },
      tv_menu_board_active: json.tv_menu_board_active === true,
    };
  } catch (_) {
    return { settings: { ...DEFAULT_SETTINGS }, tv_menu_board_active: false };
  }
}

// ── ScaledScreen ───────────────────────────────────────────────────────────

function ScaledScreen({ scale, children }) {
  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", background: "#0b0e0d" }}>
      <div style={{
        width: DESIGN_W,
        height: DESIGN_H,
        transform: `scale(${scale.x}, ${scale.y})`,
        transformOrigin: "top left",
      }}>
        {children}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export default function PublicMenuDisplayPage() {
  const { id } = useParams();
  const { language } = useLanguage();
  const clock  = useClock();
  const scale  = useScaleToViewport();

  const [menuData,       setMenuData]       = useState(null);
  const [settings,       setSettings]       = useState(DEFAULT_SETTINGS);
  const [tvActive,       setTvActive]       = useState(false);
  const [loading,        setLoading]        = useState(true);
  const [loadError,      setLoadError]      = useState(null);

  const load = useCallback(async (initial) => {
    try {
      const [menu, cfg] = await Promise.all([fetchMenuData(id), fetchDisplaySettings(id)]);
      setMenuData(menu);
      setSettings(cfg.settings);
      setTvActive(cfg.tv_menu_board_active);
      if (initial) setLoading(false);
    } catch (err) {
      if (initial) { setLoadError(err.message || "Failed to load menu."); setLoading(false); }
      // Silent failure on background refresh — keep last good state
    }
  }, [id]);

  useEffect(() => { load(true); }, [load]);
  useEffect(() => {
    const t = setInterval(() => load(false), REFRESH_MS);
    return () => clearInterval(t);
  }, [load]);

  const accent = settings.accent_color || "#4ade80";

  if (loading)   return <ScaledScreen scale={scale}><LoadingScreen /></ScaledScreen>;
  if (loadError) return <ScaledScreen scale={scale}><ErrorScreen message={loadError} /></ScaledScreen>;

  const localizedRestaurantName =
    getTranslatedField(menuData, "restaurant_name", language) ||
    getTranslatedField(menuData, "name", language) ||
    menuData?.restaurant_name ||
    menuData?.name ||
    "";

  if (!tvActive) return <ScaledScreen scale={scale}><UpgradeGate name={localizedRestaurantName} /></ScaledScreen>;

  const rawSections = menuData?.sections   || [];
  const dealItems   = menuData?.deal_items || [];
  const dealIdSet   = new Set(dealItems.map(d => d.id).filter(Boolean));
  const sections    = rawSections.map(capSection);
  const pages       = buildPages(sections);

  return (
    <ScaledScreen scale={scale}>
      <MenuBoard
        menuData={menuData}
        pages={pages}
        dealItems={dealItems}
        dealIdSet={dealIdSet}
        settings={settings}
        accent={accent}
        clock={clock}
        language={language}
        restaurantName={localizedRestaurantName}
      />
    </ScaledScreen>
  );
}

// ── MenuBoard ──────────────────────────────────────────────────────────────

function MenuBoard({ menuData, pages, dealItems, dealIdSet, settings, accent, clock, language, restaurantName }) {
  const { page, fading } = usePageRotation(pages.length);
  const currentSections  = pages[page] || [];
  const menuTierLabel = getMenuTierLabel(menuData);
  const localizedCuisine =
    getTranslatedField(menuData, "cuisine", language) ||
    menuData?.cuisine ||
    "";

  return (
    <div style={{
      width: "100%",
      height: "100%",
      background: "#0b0e0d",
      display: "flex",
      flexDirection: "column",
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      overflow: "hidden",
      color: "#fff",
      userSelect: "none",
    }}>
      {/* ── Header ────────────────────────────────────────────────────── */}
      <header style={{
        padding: "22px 52px 18px",
        borderBottom: `1px solid ${accent}30`,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        flexShrink: 0,
      }}>
        <div>
          <div style={{ fontSize: 44, fontWeight: 800, letterSpacing: "-1.5px", lineHeight: 1, color: "#fff" }}>
            {restaurantName}
          </div>
          {localizedCuisine && (
            <div style={{ fontSize: 16, color: accent, marginTop: 7, fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase" }}>
              {localizedCuisine}
            </div>
          )}
        </div>
        <div style={{ fontSize: 40, fontWeight: 700, color: "rgba(255,255,255,0.75)", fontVariantNumeric: "tabular-nums", letterSpacing: "-1px" }}>
          {formatTime(clock)}
        </div>
      </header>

      {/* ── Deals banner — always visible, outside page rotation ────── */}
      {settings.highlight_deals && dealItems.length > 0 && (
        <div style={{ padding: "12px 52px 0", flexShrink: 0 }}>
          <DealsBanner dealItems={dealItems} language={language} />
        </div>
      )}

      {/* ── Rotating page content ─────────────────────────────────────── */}
      <div
        key={page}
        style={{
          flex: 1,
          padding: "16px 52px 12px",
          overflow: "hidden",
          opacity: fading ? 0 : 1,
          transition: "opacity 0.5s ease",
        }}
      >
        {settings.layout_preset === "grid" ? (
          <GridLayout sections={currentSections} dealIdSet={dealIdSet} settings={settings} accent={accent} language={language} />
        ) : (
          <ListLayout sections={currentSections} dealIdSet={dealIdSet} settings={settings} accent={accent} language={language} />
        )}
      </div>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer style={{
        padding: "8px 52px",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: accent, animation: "livePulse 2.5s ease-in-out infinite" }} />
          <span style={{ fontSize: 14, color: "rgba(255,255,255,0.35)" }}>{menuTierLabel}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {pages.length > 1 && <PageIndicator total={pages.length} current={page} accent={accent} />}
          <div style={{ fontSize: 14, fontWeight: 800, color: "rgba(255,255,255,0.2)" }}>grubbid</div>
        </div>
      </footer>

      <style>{`
        @keyframes livePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.25; transform: scale(0.8); }
        }
      `}</style>
    </div>
  );
}

// ── Page indicator ─────────────────────────────────────────────────────────

function PageIndicator({ total, current, accent }) {
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
      {Array.from({ length: total }, (_, i) => (
        <div key={i} style={{
          width: i === current ? 20 : 6,
          height: 6,
          borderRadius: 3,
          background: i === current ? accent : "rgba(255,255,255,0.2)",
          transition: "all 0.4s ease",
        }} />
      ))}
    </div>
  );
}

// ── List layout ────────────────────────────────────────────────────────────
// Auto-balances sections into 1 or 2 columns based on count.

function ListLayout({ sections, dealIdSet, settings, accent, language }) {
  if (!sections.length) {
    return <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 20, paddingTop: 40 }}>No menu items.</div>;
  }

  const cols     = sections.length <= 2 ? 1 : 2;
  const balanced = balanceColumns(sections, cols);

  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: "0 56px", height: "100%" }}>
      {balanced.map((col, ci) => (
        <div key={ci}>
          {col.map(section => (
            <ListSection key={section.id || section.title} section={section} dealIdSet={dealIdSet} settings={settings} accent={accent} language={language} />
          ))}
        </div>
      ))}
    </div>
  );
}

function ListSection({ section, dealIdSet, settings, accent, language }) {
  const title = getTranslatedField(section, "title", language, section.title || "");
  return (
    <div style={{ marginBottom: 8 }}>
      <SectionHeader title={title} accent={accent} />
      {section.items.map((item, i) => (
        <ListItem key={item.id || i} item={item} isDeal={dealIdSet.has(item.id) || !!item.has_active_deal} settings={settings} accent={accent} language={language} />
      ))}
    </div>
  );
}

function ListItem({ item, isDeal, settings, accent, language }) {
  const showDeal = isDeal && settings.highlight_deals;
  const priceText = formatPrice(item.price);
  const itemName =
    getTranslatedField(item, "name", language) ||
    getTranslatedField(item, "menu_item_name", language) ||
    item?.name ||
    "";
  const itemDescription =
    getTranslatedField(item, "description", language) ||
    getTranslatedField(item, "notes", language) ||
    item?.description ||
    "";
  return (
    <div style={{
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      padding: showDeal ? "8px 14px 8px 12px" : "6px 0",
      marginBottom: showDeal ? 3 : 0,
      background: showDeal ? "rgba(245,158,11,0.07)" : "transparent",
      borderRadius: showDeal ? 8 : 0,
      borderLeft: showDeal ? "3px solid #f59e0b" : "3px solid transparent",
    }}>
      <div style={{ flex: 1, marginRight: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {showDeal && <DealBadge />}
          <span style={{ fontSize: 28, fontWeight: 600, color: "#f0f0f0", lineHeight: 1.2 }}>
            {truncate(itemName, MAX_NAME_CHARS)}
          </span>
        </div>
        {settings.show_descriptions && itemDescription && (
          <div style={{ fontSize: 16, color: "rgba(255,255,255,0.38)", marginTop: 4, lineHeight: 1.4 }}>
            {truncate(itemDescription, MAX_DESC_CHARS)}
          </div>
        )}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: priceText ? (showDeal ? "#f59e0b" : accent) : "#60a5fa", whiteSpace: "nowrap", flexShrink: 0 }}>
        {priceText || "Price unavailable"}
      </div>
    </div>
  );
}

// ── Grid layout ────────────────────────────────────────────────────────────
// Balances sections across columns by item count.

function GridLayout({ sections, dealIdSet, settings, accent, language }) {
  if (!sections.length) {
    return <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 20, paddingTop: 40 }}>No menu items.</div>;
  }

  const cols     = sections.length <= 1 ? 1 : sections.length <= 4 ? 2 : 3;
  const balanced = balanceColumns(sections, cols);

  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: "0 44px", height: "100%" }}>
      {balanced.map((col, ci) => (
        <div key={ci}>
          {col.map(section => (
            <GridSection key={section.id || section.title} section={section} dealIdSet={dealIdSet} settings={settings} accent={accent} language={language} />
          ))}
        </div>
      ))}
    </div>
  );
}

function GridSection({ section, dealIdSet, settings, accent, language }) {
  const title = getTranslatedField(section, "title", language, section.title || "");
  return (
    <div style={{ marginBottom: 8 }}>
      <SectionHeader title={title} accent={accent} />
      {section.items.map((item, i) => (
        <GridItem key={item.id || i} item={item} isDeal={dealIdSet.has(item.id) || !!item.has_active_deal} settings={settings} accent={accent} language={language} />
      ))}
    </div>
  );
}

function GridItem({ item, isDeal, settings, accent, language }) {
  const showDeal = isDeal && settings.highlight_deals;
  const priceText = formatPrice(item.price);
  const itemName =
    getTranslatedField(item, "name", language) ||
    getTranslatedField(item, "menu_item_name", language) ||
    item?.name ||
    "";
  return (
    <div style={{
      display: "flex",
      alignItems: "baseline",
      justifyContent: "space-between",
      padding: "6px 0",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
      background: showDeal ? "rgba(245,158,11,0.05)" : "transparent",
    }}>
      <div style={{ flex: 1, display: "flex", alignItems: "baseline", gap: 6, overflow: "hidden" }}>
        {showDeal && <DealBadge small />}
        <span style={{ fontSize: 24, fontWeight: 600, color: "#efefef", lineHeight: 1.3 }}>
          {truncate(itemName, MAX_NAME_CHARS)}
        </span>
      </div>
      <span style={{ fontSize: 24, fontWeight: 700, color: priceText ? (showDeal ? "#f59e0b" : accent) : "#60a5fa", marginLeft: 16, whiteSpace: "nowrap", flexShrink: 0 }}>
        {priceText || "Price unavailable"}
      </span>
    </div>
  );
}

// ── Shared components ──────────────────────────────────────────────────────

function SectionHeader({ title, accent }) {
  return (
    <div style={{
      fontSize: 16,
      fontWeight: 800,
      color: accent,
      letterSpacing: "3px",
      textTransform: "uppercase",
      paddingBottom: 10,
      marginBottom: 6,
      marginTop: 28,
      borderBottom: "1px solid rgba(255,255,255,0.08)",
    }}>
      {title}
    </div>
  );
}

function DealBadge({ small }) {
  return (
    <span style={{
      fontSize: small ? 9 : 10,
      fontWeight: 800,
      background: "#f59e0b",
      color: "#000",
      padding: small ? "1px 5px" : "2px 7px",
      borderRadius: 4,
      letterSpacing: "0.8px",
      textTransform: "uppercase",
      flexShrink: 0,
    }}>
      Deal
    </span>
  );
}

function DealsBanner({ dealItems, language }) {
  return (
    <div style={{
      background: "rgba(245,158,11,0.09)",
      border: "1px solid rgba(245,158,11,0.28)",
      borderRadius: 10,
      padding: "10px 20px",
      display: "flex",
      alignItems: "center",
      gap: 20,
      flexWrap: "wrap",
    }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: "#f59e0b", letterSpacing: "2px", textTransform: "uppercase", flexShrink: 0 }}>
        Today's Deals
      </div>
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "center" }}>
        {dealItems.slice(0, 6).map((item, i) => (
          <div key={item.id || i} style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontSize: 22, fontWeight: 600, color: "#f0f0f0" }}>
              {truncate(
                getTranslatedField(item, "name", language) ||
                  getTranslatedField(item, "menu_item_name", language) ||
                  item?.name ||
                  "",
                28
              )}
            </span>
            <span style={{ fontSize: 22, fontWeight: 700, color: formatPrice(item.price) ? "#f59e0b" : "#60a5fa" }}>
              {formatPrice(item.price) || "Price unavailable"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Gate / utility screens ─────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div style={fullCenter()}>
      <div style={{ fontSize: 20, color: "rgba(255,255,255,0.3)" }}>Loading menu…</div>
    </div>
  );
}

function ErrorScreen({ message }) {
  return (
    <div style={fullCenter()}>
      <div style={{ fontSize: 20, color: "rgba(255,255,255,0.35)", textAlign: "center" }}>{message}</div>
    </div>
  );
}

function UpgradeGate({ name }) {
  return (
    <div style={fullCenter()}>
      {name && (
        <div style={{ fontSize: 38, fontWeight: 800, color: "#fff", letterSpacing: "-1px", marginBottom: 20, textAlign: "center" }}>
          {name}
        </div>
      )}
      <div style={{ fontSize: 20, fontWeight: 700, color: "#4ade80", marginBottom: 16 }}>TV Menu Board</div>
      <div style={{ fontSize: 16, color: "rgba(255,255,255,0.38)", textAlign: "center", lineHeight: 1.7 }}>
        This feature is available on the Pro plan.<br />Upgrade at grubbid.com
      </div>
    </div>
  );
}

function fullCenter() {
  return {
    width: DESIGN_W,
    height: DESIGN_H,
    background: "#0b0e0d",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Inter', system-ui, sans-serif",
  };
}
