/**
 * ============================================================
 * Path: menubloc-frontend/src/pages/PublicMenuPage.jsx
 * File: PublicMenuPage.jsx
 * Date: 2026-03-06
 * Purpose:
 *   Renders the public menu for a restaurant.
 *   React route: /public/restaurants/:id/menu
 *   Data source: GET /public/restaurants/:id/menu
 *
 *   Default layout is visually identical to the previous version.
 *   Each menu item row includes an inline details panel area.
 *   Nutrition and Insights render in that panel automatically with
 *   no user click required.
 *
 *   Expanded sections render only when the API provides the relevant
 *   data for that item. Deal Details cross-references deal_items
 *   from the same API response (no additional network requests).
 * ============================================================
 */

import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

function useIsMobile(breakpoint = 900) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth <= breakpoint : false
  );
  useEffect(() => {
    function onResize() { setIsMobile(window.innerWidth <= breakpoint); }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);
  return isMobile;
}
import { PageNav } from "../components/NavButton.jsx";
import { loadDietPrefs, saveDietPrefs, hasActiveDietPrefs, activePrefLabels, itemPassesDietFilter, clearDietPrefs } from "../hooks/useDietPreferences";
import { toConsumerErrorMessage } from "../lib/api.js";

const API = (import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? "http://localhost:3001" : "")).replace(/\/$/, "");

/* ---- Utilities ---- */

function asStr(v) {
  return v === undefined || v === null ? "" : String(v);
}

function fmtMoney(price) {
  const s = asStr(price).trim();
  return s;
}

function normalizeSections(data) {
  if (Array.isArray(data?.sections)) return data.sections;
  if (Array.isArray(data?.menu_sections)) return data.menu_sections;
  if (Array.isArray(data?.menu)) return data.menu;
  return [];
}

function UnverifiedBanner({ show, onClaim }) {
  if (!show) return null;

  return (
    <button
      onClick={onClaim}
      style={{
        marginTop: 12,
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "9px 18px",
        borderRadius: 10,
        background: "#11211a",
        color: "#fff",
        border: "none",
        fontSize: 12,
        fontWeight: 800,
        letterSpacing: 0.3,
        cursor: "pointer",
        boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
        transition: "background 160ms ease, box-shadow 160ms ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "#2d6a4f";
        e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,0,0,0.22)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "#11211a";
        e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.18)";
      }}
    >
      <span style={{ fontSize: 11, opacity: 0.7 }}>●</span>
      Unverified Menu — Click to Claim Profile
    </button>
  );
}

function IntakePreviewBanner({ show }) {
  if (!show) return null;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 16px",
        borderRadius: 12,
        background: "#fffbeb",
        border: "1px solid #fde68a",
        color: "#92400e",
        fontSize: 13,
        fontWeight: 700,
        marginBottom: 16,
      }}
    >
      <span style={{ fontSize: 16 }}>📋</span>
      Menu preview — recently captured and may await restaurant confirmation
    </div>
  );
}

/* ---- Filter chip ---- */

function FilterChip({ label, active, onClick, fullWidth }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        height: 40,
        width: fullWidth ? "100%" : "auto",
        padding: "0 16px",
        borderRadius: 999,
        border: active ? "1px solid #11211a" : "1px solid rgba(18,34,28,0.12)",
        background: active ? "#11211a" : "#fff",
        color: active ? "#f7f6f1" : "#667085",
        fontSize: 13,
        fontWeight: 800,
        cursor: "pointer",
        textAlign: "left",
        boxSizing: "border-box",
      }}
    >
      {label}
    </button>
  );
}

const DIET_CHIPS = [
  { key: "dairy_free",        label: "Dairy Free" },
  { key: "diabetic_friendly", label: "Diabetic Friendly" },
  { key: "gluten_free",       label: "Gluten Free" },
  { key: "keto",              label: "Keto" },
  { key: "low_sodium",        label: "Low Sodium" },
  { key: "vegan",             label: "Vegan" },
  { key: "vegetarian",        label: "Vegetarian" },
];

/* ---- Badge ---- */

function Badge({ label, bg, color, border }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        height: 18,
        padding: "0 7px",
        borderRadius: 999,
        fontSize: 10,
        fontWeight: 800,
        letterSpacing: 0.3,
        background: bg,
        color: color,
        border: border || "none",
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      {label}
    </span>
  );
}


/* ---- Main component ---- */

export default function PublicMenuPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [pageState, setPageState] = useState({
    status: "loading", // loading | ok | error
    data: null,
    error: null,
  });

  const [dietPrefs, setDietPrefs] = useState(() => loadDietPrefs());
  const filtersActive = hasActiveDietPrefs(dietPrefs);

  function handleTogglePref(key) {
    setDietPrefs((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      saveDietPrefs(next);
      return next;
    });
  }

  function handleClearFilters() {
    clearDietPrefs();
    setDietPrefs(loadDietPrefs());
  }

  const apiUrl = useMemo(() => {
    const rid = encodeURIComponent(asStr(id).trim());
    return `${API}/public/restaurants/${rid}/menu`;
  }, [id]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        setPageState({ status: "loading", data: null, error: null });

        const res = await fetch(apiUrl);
        const json = await res.json().catch(() => null);

        if (cancelled) return;

        if (!res.ok || !json || json.ok !== true) {
          const msg = toConsumerErrorMessage(
            json?.detail || json?.error || `Request failed (${res.status})`,
            "We couldn’t load this menu right now. Please try again in a moment."
          );
          setPageState({ status: "error", data: null, error: msg });
          return;
        }

        setPageState({ status: "ok", data: json, error: null });
      } catch (e) {
        if (cancelled) return;
        setPageState({
          status: "error",
          data: null,
          error: toConsumerErrorMessage(
            e,
            "We couldn’t load this menu right now. Please try again in a moment."
          ),
        });
      }
    }

    run();
    return () => { cancelled = true; };
  }, [apiUrl]);

  /* ---- Deal lookup from API response ---- */

  // Map of item id → deal object (for O(1) cross-reference)
  const dealMap = useMemo(() => {
    const m = new Map();
    for (const d of pageState.data?.deal_items || []) {
      if (d.id != null) m.set(d.id, d);
    }
    return m;
  }, [pageState.data]);

  const pageBg = { minHeight: "100vh", background: "#f7f6f1" };

  /* ---- Loading ---- */

  if (pageState.status === "loading") {
    return (
      <div style={pageBg}>
        <div style={{ maxWidth: 1450, margin: "0 auto", padding: isMobile ? "16px 12px" : "28px 20px", color: "#101828" }}>
          <div style={{ fontSize: 14, color: "#667085", fontWeight: 600 }}>Loading menu…</div>
        </div>
      </div>
    );
  }

  /* ---- Error ---- */

  if (pageState.status === "error") {
    return (
      <div style={pageBg}>
        <div style={{ maxWidth: 1450, margin: "0 auto", padding: isMobile ? "16px 12px" : "28px 20px", color: "#101828" }}>
          <PageNav back />
          <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 8 }}>Couldn't load menu</div>
          <div style={{ color: "var(--muted, #5b6675)", fontSize: 14 }}>{pageState.error}</div>
          <div style={{ marginTop: 14, fontSize: 12, color: "var(--muted-2, #93a0b2)" }}>Endpoint: {apiUrl}</div>
        </div>
      </div>
    );
  }

  /* ---- OK ---- */

  const data = pageState.data;
  const restaurantName  = asStr(data?.restaurant_name || data?.name || `Restaurant ${id}`).trim();
  const addressLine     = asStr(data?.address_line).trim();
  const sections        = normalizeSections(data);
  const menuBanner      = asStr(data?.menu_banner).trim();
  const isUnverified    = data?.is_authoritative === false || !!menuBanner;
  const isIntakePreview = data?.menu_source === "intake";

  return (
    <div style={pageBg}>
      <div style={{
        maxWidth: 1450,
        margin: "0 auto",
        padding: isMobile ? "16px 12px 56px" : "28px 20px 56px",
        color: "#101828",
      }}>
        <PageNav back />

        {/* Restaurant header — above the two-column layout */}
        <div style={{ marginBottom: isMobile ? 18 : 22 }}>
          <div style={{ fontSize: isMobile ? 16 : 18, fontWeight: 800, color: "#11211a", marginBottom: 6 }}>
            Grubbid
          </div>
          <div style={{ paddingLeft: isMobile ? 0 : 284 }}>
            <div style={{ fontSize: isMobile ? 22 : 28, fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1.1, color: "#11211a" }}>
              {restaurantName}
            </div>
            {addressLine ? (
              <div style={{ marginTop: 6, fontSize: 14, color: "#667085", fontWeight: 600 }}>{addressLine}</div>
            ) : null}
          </div>
        </div>

        {/* Two-column layout: sidebar + menu content */}
        <div style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          alignItems: "flex-start",
          gap: isMobile ? 16 : 24,
        }}>

          {/* ── Filter sidebar ── */}
          <aside style={{
            flex: isMobile ? "1 1 auto" : "0 0 260px",
            width: isMobile ? "100%" : 260,
            position: isMobile ? "static" : "sticky",
            top: 18,
            alignSelf: "flex-start",
            minWidth: 0,
          }}>
            <div style={{
              borderRadius: 24,
              padding: isMobile ? 14 : 18,
              background: "#fff",
              border: "1px solid rgba(18,34,28,0.08)",
              boxShadow: "0 8px 28px rgba(15,23,42,0.06)",
              boxSizing: "border-box",
            }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: "#11211a", marginBottom: 14 }}>
                Dietary
              </div>
              <div style={{ display: "grid", gap: 10 }}>
                {DIET_CHIPS.map(({ key, label }) => (
                  <FilterChip
                    key={key}
                    label={label}
                    active={dietPrefs[key]}
                    onClick={() => handleTogglePref(key)}
                    fullWidth
                  />
                ))}
              </div>
              {filtersActive && (
                <button
                  onClick={handleClearFilters}
                  style={{
                    marginTop: 12,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#667085",
                    padding: 0,
                    textDecoration: "underline",
                  }}
                >Clear all</button>
              )}
            </div>
          </aside>

          {/* ── Menu content ── */}
          <main style={{ flex: "1 1 auto", minWidth: 0, width: "100%" }}>

            <IntakePreviewBanner show={isIntakePreview} />

            {sections.length === 0 ? (
              <div style={{ fontSize: 14, color: "var(--muted, #5b6675)" }}>No menu sections yet.</div>
            ) : filtersActive && sections.every((sec) => (Array.isArray(sec?.items) ? sec.items : []).filter((it) => itemPassesDietFilter(it, dietPrefs)).length === 0) ? (
              <div style={{ fontSize: 14, color: "var(--muted, #5b6675)", padding: "24px 0" }}>
                No items match your dietary preferences.{" "}
                <button onClick={handleClearFilters} style={{ background: "none", border: "none", cursor: "pointer", color: "#2d6a4f", fontWeight: 700, fontSize: 14, padding: 0, textDecoration: "underline" }}>
                  Clear preferences
                </button>
              </div>
            ) : (
              sections.map((sec, sIdx) => {
                const title = asStr(sec?.title || "Menu").trim();
                const allItems = Array.isArray(sec?.items) ? sec.items : [];
                const items = filtersActive
                  ? allItems.filter((it) => itemPassesDietFilter(it, dietPrefs))
                  : allItems;

                if (filtersActive && items.length === 0) return null;

                return (
                  <div key={`${title}-${sIdx}`} style={{ marginTop: sIdx === 0 ? 0 : 24 }}>
                    <div style={{ fontSize: 13, fontWeight: 900, letterSpacing: 0.8, textTransform: "uppercase", color: "#667085", marginBottom: 10 }}>
                      {title}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {items.map((it, iIdx) => {
                        const itemKey = String(it?.id ?? `${sIdx}-${iIdx}`);
                        const name    = asStr(it?.name || "Item").trim();
                        const desc    = asStr(it?.description || it?.notes || "").trim();
                        const price   = fmtMoney(it?.price);
                        const deal    = it?.id != null ? dealMap.get(it.id) : undefined;
                        const hasDeal = !!deal;

                        const canNavigate = it?.id != null;

                        return (
                          <div
                            key={itemKey}
                            onClick={canNavigate ? () => navigate(`/menu-items/${it.id}`) : undefined}
                            onMouseEnter={canNavigate ? (e) => { e.currentTarget.style.boxShadow = "0 6px 22px rgba(15,23,42,0.10)"; e.currentTarget.style.borderColor = "rgba(18,34,28,0.18)"; } : undefined}
                            onMouseLeave={canNavigate ? (e) => { e.currentTarget.style.boxShadow = "0 4px 14px rgba(15,23,42,0.05)"; e.currentTarget.style.borderColor = "rgba(18,34,28,0.08)"; } : undefined}
                            style={{
                              border: "1px solid rgba(18,34,28,0.08)",
                              borderRadius: 20,
                              background: "#fff",
                              padding: "14px 18px",
                              boxShadow: "0 4px 14px rgba(15,23,42,0.05)",
                              cursor: canNavigate ? "pointer" : "default",
                              transition: "box-shadow 150ms ease, border-color 150ms ease",
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                                  <span style={{ fontSize: 15, fontWeight: 900, lineHeight: 1.2, color: "#11211a" }}>
                                    {name}
                                  </span>
                                  {hasDeal ? <Badge label="Deal" bg="#dcfce7" color="#15803d" border="1px solid #bbf7d0" /> : null}
                                  {it?.is_vegan ? <Badge label="Vegan" bg="#f0fdf4" color="#166534" border="1px solid #bbf7d0" /> : null}
                                  {it?.is_gluten_free ? <Badge label="GF" bg="#fffbeb" color="#92400e" border="1px solid #fde68a" /> : null}
                                </div>
                                {desc ? (
                                  <div style={{ marginTop: 4, fontSize: 13, color: "#475467", lineHeight: 1.5 }}>{desc}</div>
                                ) : null}
                              </div>
                              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
                                {price ? (
                                  <div style={{ fontSize: 14, fontWeight: 900, whiteSpace: "nowrap" }}>{price}</div>
                                ) : null}
                                {canNavigate && (
                                  <span style={{ fontSize: 11, color: "#2d6a4f", fontWeight: 700, whiteSpace: "nowrap" }}>
                                    Nutrition &amp; insights →
                                  </span>
                                )}
                              </div>
                            </div>

                            {it?.chips?.nutrition_chip?.allergen_alert && (
                              <div style={{ marginTop: 4 }}>
                                <span style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 3,
                                  padding: "1px 6px",
                                  background: "rgba(230,130,0,0.06)",
                                  border: "1px solid rgba(230,130,0,0.15)",
                                  borderRadius: 4,
                                  fontSize: 10,
                                  color: "#7c4a00",
                                  fontWeight: 500,
                                }}>
                                  <span style={{ opacity: 0.7 }}>⚠</span>
                                  {it.chips.nutrition_chip.allergen_alert}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </main>

        </div>
      </div>
    </div>
  );
}
