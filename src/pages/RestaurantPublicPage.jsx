/**
 * ============================================================
 * Path: menubloc-frontend/src/pages/RestaurantPublicPage.jsx
 * File: RestaurantPublicPage.jsx
 * Date: 2026-03-06
 * Purpose:
 *   Grubbid public restaurant profile page. Route: /restaurants/:id
 *
 *   This is the primary internal destination for:
 *     - Search result restaurant name clicks
 *     - QR code scan landings (/qr/:token → /restaurants/:id)
 *
 *   Tier-aware presentation:
 *     Public   — clean, informational, no accent
 *     Verified — green trust accents, polished header
 *     Pro      — blue hero accent bar, premium hierarchy, module placeholders
 *
 *   Data source: GET /public/restaurants/:id/menu
 *   (single call — returns restaurant profile + sections)
 *
 *   Website links appear on this profile page only (not in search cards).
 *   Restaurant name in search cards links here via /restaurants/:id.
 * ============================================================
 */

import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

const API = (import.meta.env.VITE_API_URL || "http://localhost:3001").replace(/\/$/, "");
const THEME_KEY = "grubbid_theme";

/* ---- Helpers ---- */

function readTheme() {
  try {
    return localStorage.getItem(THEME_KEY) === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

function saveTheme(t) {
  try {
    localStorage.setItem(THEME_KEY, t);
  } catch {
    // ignore
  }
}

function normalizeUrl(url) {
  const s = String(url || "").trim();
  if (!s) return "";
  return /^https?:\/\//i.test(s) ? s : `https://${s}`;
}

function normalizeTier(raw, status) {
  for (const v of [raw, status]) {
    const s = String(v || "").toLowerCase();
    if (s.includes("pro")) return "pro";
    if (s.includes("verified")) return "verified";
  }
  return "";
}

function fmtPrice(it) {
  if (it?.price) return String(it.price);
  if (it?.price_cents != null) return `$${(Number(it.price_cents) / 100).toFixed(2)}`;
  return "";
}

/* ---- Tier theme ---- */

/**
 * Returns all visual properties that differ by tier + dark/light.
 * Public, Verified, Pro each have distinct structural and color treatments.
 */
function getTierTheme(tier, isDark) {
  if (tier === "pro") {
    return {
      // Top accent bar across the card header — signature Pro treatment
      accentBarColor: isDark ? "#2563eb" : "#1a4f95",
      cardBorder: isDark
        ? "2px solid rgba(59,130,246,0.4)"
        : "2px solid #b9d6fb",
      cardShadow: isDark
        ? "0 16px 50px rgba(0,0,0,0.45)"
        : "0 12px 40px rgba(26,79,149,0.14)",
      heroBg: isDark ? "#06101f" : "#eef5ff",
      heroBorderBottom: isDark
        ? "1px solid rgba(59,130,246,0.15)"
        : "1px solid #d1e4fb",
      badgeBg: isDark ? "rgba(96,169,255,0.18)" : "#dbeafe",
      badgeColor: isDark ? "#93c5fd" : "#1e40af",
      badgeBorder: isDark ? "rgba(96,169,255,0.4)" : "#bfdbfe",
      badgeLabel: "Pro Listing",
      nameSize: 30,
      nameFontWeight: 900,
      nameColor: isDark ? "#f0f6ff" : "#0f172a",
      sectionMarker: "blue-bar",   // left border accent on section headers
      sectionAccentColor: isDark ? "#3b82f6" : "#1a4f95",
      metaColor: isDark ? "rgba(147,197,253,0.7)" : "#3b5ea6",
      showProModules: true,
    };
  }

  if (tier === "verified") {
    return {
      accentBarColor: null,
      cardBorder: isDark
        ? "2px solid rgba(74,222,128,0.28)"
        : "2px solid #86efac",
      cardShadow: isDark
        ? "0 12px 40px rgba(0,0,0,0.38)"
        : "0 10px 32px rgba(22,101,52,0.10)",
      heroBg: isDark ? "#040f09" : "#f0fff7",
      heroBorderBottom: isDark
        ? "1px solid rgba(74,222,128,0.12)"
        : "1px solid #bbf7d0",
      badgeBg: isDark ? "rgba(74,222,128,0.16)" : "#dcfce7",
      badgeColor: isDark ? "#86efac" : "#15803d",
      badgeBorder: isDark ? "rgba(74,222,128,0.35)" : "#bbf7d0",
      badgeLabel: "Verified Listing",
      nameSize: 26,
      nameFontWeight: 900,
      nameColor: isDark ? "#ecfdf5" : "#052e16",
      sectionMarker: "green-dot",
      sectionAccentColor: isDark ? "#4ade80" : "#16a34a",
      metaColor: isDark ? "rgba(134,239,172,0.7)" : "#166534",
      showProModules: false,
    };
  }

  // Public (default)
  return {
    accentBarColor: null,
    cardBorder: isDark
      ? "1px solid rgba(255,255,255,0.1)"
      : "1px solid #e4e9f0",
    cardShadow: isDark
      ? "0 8px 24px rgba(0,0,0,0.3)"
      : "0 6px 18px rgba(16,24,40,0.06)",
    heroBg: isDark ? "rgba(255,255,255,0.04)" : "#ffffff",
    heroBorderBottom: isDark
      ? "1px solid rgba(255,255,255,0.08)"
      : "1px solid #e9eef5",
    badgeBg: isDark ? "rgba(255,255,255,0.08)" : "#f1f5f9",
    badgeColor: isDark ? "#94a3b8" : "#64748b",
    badgeBorder: isDark ? "rgba(255,255,255,0.12)" : "#e2e8f0",
    badgeLabel: "Public Listing",
    nameSize: 24,
    nameFontWeight: 800,
    nameColor: isDark ? "#f1f5f9" : "#0f172a",
    sectionMarker: "none",
    sectionAccentColor: null,
    metaColor: isDark ? "rgba(255,255,255,0.5)" : "#64748b",
    showProModules: false,
  };
}

/* ---- Pro module placeholder ---- */

function ProModulePlaceholder({ isDark }) {
  return (
    <div
      style={{
        marginTop: 24,
        padding: "16px 18px",
        borderRadius: 12,
        border: isDark
          ? "1px dashed rgba(59,130,246,0.3)"
          : "1px dashed #bfdbfe",
        background: isDark ? "rgba(59,130,246,0.05)" : "#f0f7ff",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <div>
        <div
          style={{
            fontSize: 13,
            fontWeight: 800,
            color: isDark ? "#93c5fd" : "#1e40af",
            marginBottom: 4,
          }}
        >
          Deals &amp; Promotions
        </div>
        <div
          style={{
            fontSize: 12,
            color: isDark ? "rgba(255,255,255,0.35)" : "#94a3b8",
            lineHeight: 1.4,
          }}
        >
          Active promotions and deals for this restaurant will appear here.
        </div>
      </div>
      <span
        style={{
          flexShrink: 0,
          fontSize: 10,
          fontWeight: 800,
          padding: "3px 9px",
          borderRadius: 999,
          background: isDark ? "rgba(96,169,255,0.14)" : "#dbeafe",
          color: isDark ? "#93c5fd" : "#1e40af",
          border: isDark
            ? "1px solid rgba(96,169,255,0.3)"
            : "1px solid #bfdbfe",
          letterSpacing: 0.3,
        }}
      >
        Pro
      </span>
    </div>
  );
}

/* ---- Section header ---- */

function SectionHeader({ title, marker, accentColor, isDark, isFirst }) {
  const base = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: isDark ? "rgba(255,255,255,0.4)" : "#94a3b8",
    marginTop: isFirst ? 0 : 28,
    marginBottom: 12,
  };

  if (marker === "blue-bar") {
    return (
      <div
        style={{
          ...base,
          paddingLeft: 10,
          borderLeft: `3px solid ${accentColor}`,
          color: isDark ? accentColor : accentColor,
        }}
      >
        {title}
      </div>
    );
  }

  if (marker === "green-dot") {
    return (
      <div style={base}>
        <span
          style={{
            display: "inline-block",
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: accentColor,
            flexShrink: 0,
          }}
        />
        {title}
      </div>
    );
  }

  // plain
  return <div style={base}>{title}</div>;
}

/* ---- Item card ---- */

function ItemCard({ item, isDark }) {
  const price = fmtPrice(item);
  const name = String(item?.name || "Menu item");
  const desc = item?.description || item?.notes || "";

  return (
    <div
      style={{
        padding: "10px 12px",
        borderRadius: 10,
        background: isDark ? "rgba(255,255,255,0.04)" : "#fafafa",
        border: isDark
          ? "1px solid rgba(255,255,255,0.07)"
          : "1px solid #ececf0",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 8,
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: isDark ? "#e2e8f0" : "#0f172a",
            lineHeight: 1.3,
          }}
        >
          {name}
        </div>
        {price ? (
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              color: isDark ? "rgba(255,255,255,0.5)" : "#64748b",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {price}
          </div>
        ) : null}
      </div>
      {desc ? (
        <div
          style={{
            fontSize: 11,
            color: isDark ? "rgba(255,255,255,0.35)" : "#94a3b8",
            marginTop: 4,
            lineHeight: 1.4,
          }}
        >
          {desc}
        </div>
      ) : null}
    </div>
  );
}

/* ---- Main component ---- */

export default function RestaurantPublicPage() {
  const { id } = useParams();

  const [theme, setTheme] = useState(readTheme);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [data, setData] = useState(null);

  const isDark = theme === "dark";
  const dataUrl = useMemo(() => `${API}/public/restaurants/${id}/menu`, [id]);

  useEffect(() => {
    saveTheme(theme);
  }, [theme]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setErr("");
    setData(null);

    fetch(dataUrl)
      .then((r) => r.json())
      .then((json) => {
        if (!alive) return;
        if (!json?.ok) throw new Error(json?.error || "Not found");
        setData(json);
      })
      .catch((e) => {
        if (alive) setErr(String(e?.message || e));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [dataUrl]);

  /* ---- Derived values ---- */

  const tier = normalizeTier(data?.profile_tier, data?.listing_status);
  const t = getTierTheme(tier, isDark);

  const name = data?.restaurant_name || data?.name || `Restaurant ${id}`;
  const cuisine = data?.cuisine || data?.category || "";
  const city = data?.city || "";
  const state = data?.state || "";
  const locationLine = [city, state].filter(Boolean).join(", ");
  const phone = data?.phone || "";
  const websiteRaw = data?.website || "";
  const website = normalizeUrl(websiteRaw);
  const sections = Array.isArray(data?.sections) ? data.sections : [];

  /* ---- Styles ---- */

  const pageBg = isDark ? "#0b0b0f" : "#f1f5f9";
  const pageColor = isDark ? "#e2e8f0" : "#0f172a";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: pageBg,
        color: pageColor,
        fontFamily: "var(--font-ui, ui-sans-serif, system-ui, sans-serif)",
        padding: "20px 16px 60px",
      }}
    >
      {/* ---- Top nav ---- */}
      <div
        style={{
          maxWidth: 900,
          margin: "0 auto 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link
          to="/"
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: isDark ? "rgba(255,255,255,0.5)" : "#64748b",
            textDecoration: "none",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = isDark ? "#fff" : "#0f172a";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = isDark
              ? "rgba(255,255,255,0.5)"
              : "#64748b";
          }}
        >
          ← Grubbid
        </Link>
        <button
          type="button"
          onClick={() =>
            setTheme((th) => (th === "dark" ? "light" : "dark"))
          }
          style={{
            height: 28,
            padding: "0 12px",
            fontSize: 11,
            fontWeight: 700,
            borderRadius: 8,
            border: isDark
              ? "1px solid rgba(255,255,255,0.15)"
              : "1px solid #cbd5e1",
            background: "transparent",
            color: isDark ? "rgba(255,255,255,0.45)" : "#64748b",
            cursor: "pointer",
            letterSpacing: 0.2,
          }}
          aria-label="Toggle theme"
        >
          {isDark ? "Light" : "Dark"}
        </button>
      </div>

      {/* ---- Profile card ---- */}
      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
          borderRadius: 18,
          overflow: "hidden",
          border: t.cardBorder,
          boxShadow: t.cardShadow,
          background: isDark ? "#111218" : "#ffffff",
        }}
      >
        {/* ---- Hero / header ---- */}
        <div
          style={{
            padding: "22px 24px 20px",
            background: t.heroBg,
            borderBottom: t.heroBorderBottom,
            position: "relative",
          }}
        >
          {/* Pro accent bar — 4px strip across the top */}
          {t.accentBarColor ? (
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 4,
                background: t.accentBarColor,
              }}
            />
          ) : null}

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 16,
              paddingTop: t.accentBarColor ? 8 : 0,
            }}
          >
            {/* Left: identity block */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Tier badge */}
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  height: 22,
                  padding: "0 10px",
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: 0.3,
                  background: t.badgeBg,
                  color: t.badgeColor,
                  border: `1px solid ${t.badgeBorder}`,
                  marginBottom: 10,
                }}
              >
                {t.badgeLabel}
              </div>

              {/* Restaurant name — scaled by tier */}
              {loading ? (
                <div
                  style={{
                    height: t.nameSize + 4,
                    width: 200,
                    borderRadius: 6,
                    background: isDark
                      ? "rgba(255,255,255,0.08)"
                      : "#e9eef5",
                    marginBottom: 10,
                  }}
                />
              ) : (
                <h1
                  style={{
                    fontSize: t.nameSize,
                    fontWeight: t.nameFontWeight,
                    lineHeight: 1.1,
                    color: t.nameColor,
                    margin: "0 0 10px",
                    letterSpacing: "-0.02em",
                    wordBreak: "break-word",
                  }}
                >
                  {name}
                </h1>
              )}

              {/* Cuisine / location meta */}
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {cuisine ? (
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: t.metaColor,
                    }}
                  >
                    {cuisine}
                  </div>
                ) : null}
                {locationLine ? (
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: isDark ? "rgba(255,255,255,0.45)" : "#94a3b8",
                    }}
                  >
                    {locationLine}
                  </div>
                ) : null}
              </div>

              {/* Contact row — phone + website */}
              {(phone || website) ? (
                <div
                  style={{
                    display: "flex",
                    gap: 18,
                    flexWrap: "wrap",
                    marginTop: 14,
                    paddingTop: 14,
                    borderTop: isDark
                      ? "1px solid rgba(255,255,255,0.08)"
                      : "1px solid rgba(0,0,0,0.07)",
                  }}
                >
                  {phone ? (
                    <a
                      href={`tel:${String(phone).replace(/[^\d+]/g, "")}`}
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: isDark ? "#93c5fd" : "#1d4ed8",
                        textDecoration: "none",
                      }}
                    >
                      {phone}
                    </a>
                  ) : null}
                  {website ? (
                    <a
                      href={website}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: isDark ? "#93c5fd" : "#1d4ed8",
                        textDecoration: "none",
                      }}
                    >
                      {websiteRaw || website} ↗
                    </a>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* ---- Menu body ---- */}
        <div style={{ padding: "20px 24px 26px" }}>
          {/* Loading state */}
          {loading ? (
            <div
              style={{
                padding: "12px 14px",
                borderRadius: 10,
                background: isDark ? "rgba(255,255,255,0.05)" : "#f8fafc",
                border: isDark
                  ? "1px solid rgba(255,255,255,0.08)"
                  : "1px solid #e4e9f0",
                fontSize: 13,
                fontWeight: 600,
                color: isDark ? "rgba(255,255,255,0.4)" : "#94a3b8",
              }}
            >
              Loading profile…
            </div>
          ) : null}

          {/* Error state */}
          {err && !loading ? (
            <div
              style={{
                padding: "12px 14px",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                background: isDark ? "rgba(248,113,113,0.07)" : "#fff5f5",
                border: isDark
                  ? "1px solid rgba(248,113,113,0.25)"
                  : "1px solid #fca5a5",
                color: isDark ? "#fca5a5" : "#b91c1c",
              }}
            >
              {err}
            </div>
          ) : null}

          {/* Empty menu */}
          {!loading && !err && sections.length === 0 ? (
            <div
              style={{
                padding: "12px 14px",
                borderRadius: 10,
                background: isDark ? "rgba(255,255,255,0.05)" : "#f8fafc",
                border: isDark
                  ? "1px solid rgba(255,255,255,0.08)"
                  : "1px solid #e4e9f0",
                fontSize: 13,
                fontWeight: 600,
                color: isDark ? "rgba(255,255,255,0.35)" : "#94a3b8",
              }}
            >
              No menu on file yet.
            </div>
          ) : null}

          {/* Menu sections */}
          {!loading && !err
            ? sections.map((sec, idx) => {
                const items = Array.isArray(sec?.items) ? sec.items : [];
                const title = String(sec?.title || `Section ${idx + 1}`);

                return (
                  <div key={`${title}-${idx}`}>
                    <SectionHeader
                      title={title}
                      marker={t.sectionMarker}
                      accentColor={t.sectionAccentColor}
                      isDark={isDark}
                      isFirst={idx === 0}
                    />
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fill, minmax(210px, 1fr))",
                        gap: 10,
                      }}
                    >
                      {items.map((it) => {
                        const key = it?.id ?? `${it?.name}-${idx}`;
                        return (
                          <ItemCard key={key} item={it} isDark={isDark} />
                        );
                      })}
                    </div>
                  </div>
                );
              })
            : null}

          {/* Pro module placeholder — visible only for Pro tier */}
          {!loading && !err && t.showProModules ? (
            <ProModulePlaceholder isDark={isDark} />
          ) : null}
        </div>
      </div>
    </div>
  );
}
