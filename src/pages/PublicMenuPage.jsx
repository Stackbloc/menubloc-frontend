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
import { useParams } from "react-router-dom";
import { HomeButton } from "../components/NavButton.jsx";
import MenuItemInsightsPanel from "../components/MenuItemInsightsPanel.jsx";

const API = (import.meta.env.VITE_API_URL || "http://localhost:3001").replace(/\/$/, "");

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

function PendingBanner({ text }) {
  if (!text) return null;

  return (
    <div
      style={{
        marginTop: 12,
        display: "inline-flex",
        alignItems: "center",
        padding: "8px 12px",
        borderRadius: 10,
        background: "#fff3cd",
        color: "#7c2d12",
        border: "1px solid #facc15",
        fontSize: 12,
        fontWeight: 900,
        letterSpacing: 0.2,
      }}
    >
      {text}
    </div>
  );
}

/* ---- Light-mode colors passed to MenuItemInsightsPanel ---- */
const LIGHT_COLORS = {
  panel2:  "#f6f6f7",
  border:  "rgba(0,0,0,0.08)",
  text:    "rgba(0,0,0,0.92)",
  subtext: "rgba(0,0,0,0.55)",
  chipBg:  "rgba(0,0,0,0.04)",
};

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

  const [pageState, setPageState] = useState({
    status: "loading", // loading | ok | error
    data: null,
    error: null,
  });

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
          const msg = json?.detail || json?.error || `Request failed (${res.status})`;
          setPageState({ status: "error", data: null, error: msg });
          return;
        }

        setPageState({ status: "ok", data: json, error: null });
      } catch (e) {
        if (cancelled) return;
        setPageState({ status: "error", data: null, error: e?.message || String(e) });
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

  /* ---- Shared wrapper styles ---- */

  const pageBg = { minHeight: "100vh" };

  const wrap = {
    maxWidth: 980,
    margin: "0 auto",
    padding: "22px 16px 60px",
    fontFamily: "var(--font-ui)",
    color: "var(--ink, #0f1720)",
  };

  /* ---- Loading ---- */

  if (pageState.status === "loading") {
    return (
      <div style={pageBg}>
        <div style={wrap}>
          <div style={{ fontSize: 14, color: "var(--muted, #5b6675)" }}>
            Loading menu…
          </div>
        </div>
      </div>
    );
  }

  /* ---- Error ---- */

  if (pageState.status === "error") {
    return (
      <div style={pageBg}>
      <div style={wrap}>
        <div style={{ marginBottom: 10 }}>
          <HomeButton />
        </div>
        <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 8 }}>
          Couldn't load menu
        </div>
        <div style={{ color: "var(--muted, #5b6675)", fontSize: 14 }}>
          {pageState.error}
        </div>
        <div style={{ marginTop: 14, fontSize: 12, color: "var(--muted-2, #93a0b2)" }}>
          Endpoint: {apiUrl}
        </div>
      </div>
      </div>
    );
  }

  /* ---- OK ---- */

  const data = pageState.data;
  const restaurantName = asStr(data?.restaurant_name || data?.name || `Restaurant ${id}`).trim();
  const addressLine    = asStr(data?.address_line).trim();
  const sections       = normalizeSections(data);
  const menuBanner     = asStr(data?.menu_banner).trim();

  return (
    <div style={pageBg}>
    <div style={wrap}>
      <div style={{ marginBottom: 14 }}>
        <HomeButton />
      </div>

      <div style={{ fontSize: 28, fontWeight: 950, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
        {restaurantName}
      </div>

      {addressLine ? (
        <div style={{ marginTop: 6, fontSize: 14, color: "var(--muted, #5b6675)" }}>
          {addressLine}
        </div>
      ) : null}

      <PendingBanner text={menuBanner} />

      {/* Sections */}
      <div style={{ marginTop: 18 }}>
        {sections.length === 0 ? (
          <div style={{ fontSize: 14, color: "var(--muted, #5b6675)" }}>
            No menu sections yet.
          </div>
        ) : (
          sections.map((sec, sIdx) => {
            const title = asStr(sec?.title || "Menu").trim();
            const items = Array.isArray(sec?.items) ? sec.items : [];

            return (
              <div key={`${title}-${sIdx}`} style={{ marginTop: sIdx === 0 ? 0 : 24 }}>
                <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 8 }}>
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

                    return (
                      <div
                        key={itemKey}
                        style={{
                          border: "1px solid var(--border, #e4e9f0)",
                          borderRadius: 14,
                          background: "#fff",
                          padding: "12px 14px",
                        }}
                      >
                        {/* Name + price row */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                              <span style={{ fontSize: 15, fontWeight: 850, lineHeight: 1.2 }}>
                                {name}
                              </span>
                              {hasDeal ? (
                                <Badge label="Deal" bg="#dcfce7" color="#15803d" border="1px solid #bbf7d0" />
                              ) : null}
                              {it?.is_vegan ? (
                                <Badge label="Vegan" bg="#f0fdf4" color="#166534" border="1px solid #bbf7d0" />
                              ) : null}
                              {it?.is_gluten_free ? (
                                <Badge label="GF" bg="#fffbeb" color="#92400e" border="1px solid #fde68a" />
                              ) : null}
                            </div>
                            {desc ? (
                              <div style={{ marginTop: 4, fontSize: 13, color: "var(--muted, #5b6675)", lineHeight: 1.35 }}>
                                {desc}
                              </div>
                            ) : null}
                          </div>
                          {price ? (
                            <div style={{ fontSize: 14, fontWeight: 900, whiteSpace: "nowrap", flexShrink: 0 }}>
                              {price}
                            </div>
                          ) : null}
                        </div>

                        {/* Expanded panel area — always open */}
                        <div
                          style={{
                            marginTop: 12,
                            paddingTop: 12,
                            borderTop: "1px solid var(--border, #e4e9f0)",
                          }}
                        >
                          <div
                            style={{
                              border: "1px solid #dce4f2",
                              borderRadius: 12,
                              background: "#f8fbff",
                              padding: "10px 12px",
                            }}
                          >
                            <MenuItemInsightsPanel item={it} colors={LIGHT_COLORS} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
    </div>
  );
}
