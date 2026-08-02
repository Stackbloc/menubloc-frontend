/**
 * ============================================================
 * Path: menubloc-frontend/src/pages/FoodTruckPage.jsx
 * File: FoodTruckPage.jsx
 * Date: 2026-03-13
 * Purpose:
 *   Dedicated Menuply profile page for food trucks.
 *   React route: /foodtrucks/:slugOrId
 *
 *   Personality-first editorial shell (no inline menu).
 *   Icon rail links to public menu; claim CTA + display-only + Save contact kept.
 *
 *   Data sources:
 *     - Profile: GET /public/restaurants/:slugOrId
 * ============================================================
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext.jsx";
import { HomeButton } from "../components/NavButton.jsx";
import MenuItemInsightsPanel from "../components/MenuItemInsightsPanel.jsx";
import ShareIcon from "../components/share/ShareIcon.jsx";
import StickyPageHeader from "../components/StickyPageHeader.jsx";
import FoodTruckPublicEditorial from "../components/restaurant/FoodTruckPublicEditorial.jsx";
import { toConsumerErrorMessage, fetchRestaurantMenuPreview } from "../lib/api.js";
import BottomNav from "../components/BottomNav.jsx";
import { getDisplayMenuItemName } from "../utils/getDisplayMenuItemName.js";
import { buildRestaurantStatusLightProps } from "../lib/restaurantStatusLight.js";
import { buildRestaurantShareData } from "../components/share/shareUtils.js";
import { restaurantMenuPathFromRow } from "../lib/canonicalUrl.js";

const API = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001").replace(/\/$/, "");
const THEME_KEY = "grubbid_theme";
const SCHEDULE_PREVIEW = 3;

/* ─── Theme ──────────────────────────────────────────────── */

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

/* ─── Mobile hook ────────────────────────────────────────── */

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth <= breakpoint;
  });

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    function handleResize() {
      setIsMobile(window.innerWidth <= breakpoint);
    }

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [breakpoint]);

  return isMobile;
}

/* ─── Utilities ───────────────────────────────────────────── */

function asStr(v) {
  return v == null ? "" : String(v);
}

function firstNonEmpty(...vals) {
  for (const v of vals) {
    const s = asStr(v).trim();
    if (s) return s;
  }
  return "";
}

function normalizeUrl(url) {
  const s = asStr(url).trim();
  if (!s) return "";
  return /^https?:\/\//i.test(s) ? s : `https://${s}`;
}

function normalizeSections(data) {
  if (Array.isArray(data?.sections) && Array.isArray(data?.menu_items)) {
    const itemsBySectionId = new Map();

    for (const item of data.menu_items) {
      const sid = item?.section_id ?? "__none__";
      if (!itemsBySectionId.has(sid)) itemsBySectionId.set(sid, []);
      itemsBySectionId.get(sid).push(item);
    }

    for (const items of itemsBySectionId.values()) {
      items.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
    }

    const sorted = [...data.sections].sort(
      (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)
    );

    const result = sorted.map((sec) => ({
      title: sec.section_name || sec.title || "",
      description: sec.section_description || "",
      items: itemsBySectionId.get(sec.section_id) || [],
    }));

    const orphans = itemsBySectionId.get("__none__") || [];
    if (orphans.length) result.push({ title: "", description: "", items: orphans });

    return result.filter((s) => s.items.length > 0);
  }

  if (Array.isArray(data?.sections)) return data.sections;
  if (Array.isArray(data?.menu_sections)) return data.menu_sections;
  if (Array.isArray(data?.menu)) return data.menu;

  return [];
}

function humanizeLabel(s) {
  const raw = asStr(s).trim();
  const normalized = raw.toLowerCase().replace(/\s+/g, " ");
  const corrected = new Map([
    ["jamacian", "jamaican"],
  ]).get(normalized) || raw;

  return corrected
    .trim()
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function buildCuisineDisplay(cuisine, category) {
  const isTruckVariant = (s) => /^food.?truck$/i.test(asStr(s).replace(/_/g, " ").trim());
  const parts = [cuisine, category]
    .filter((s) => s && !isTruckVariant(s))
    .map(humanizeLabel)
    .filter(
      (s, i, arr) => arr.findIndex((x) => x.toLowerCase() === s.toLowerCase()) === i
    );

  return parts.join(" · ");
}

function buildMapUrl(lat, lng, label) {
  if (lat == null || lng == null) return null;
  const q = encodeURIComponent(label || `${lat},${lng}`);
  const isIOS =
    typeof navigator !== "undefined" && /iPhone|iPad|iPod/i.test(navigator.userAgent);

  if (isIOS) return `https://maps.apple.com/?ll=${lat},${lng}&q=${q}`;
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

function fmtTimeAgo(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function fmtMoney(price) {
  return asStr(price).trim();
}

function normalizeInstagram(raw) {
  return asStr(raw)
    .trim()
    .replace(/^@/, "")
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/\/$/, "");
}

/* ─── Colors ──────────────────────────────────────────────── */

function getColors(isDark) {
  return {
    pageBg: isDark ? "var(--bg, #09090d)" : "var(--bg, #f2f1ec)",
    pageColor: isDark ? "#e2e8f0" : "#0f172a",
    muted: isDark ? "rgba(255,255,255,0.45)" : "#64748b",
    mutedSub: isDark ? "rgba(255,255,255,0.28)" : "#94a3b8",
    divider: isDark ? "rgba(255,255,255,0.07)" : "#e8ecf3",
    linkColor: isDark ? "#93c5fd" : "#1d4ed8",
    sectionLbl: isDark ? "rgba(255,255,255,0.32)" : "#94a3b8",

    cardBg: isDark ? "#13141a" : "#ffffff",
    cardBorder: isDark ? "1px solid rgba(255,255,255,0.09)" : "1px solid #e0e6f0",
    cardShadow: isDark ? "0 12px 36px rgba(0,0,0,0.40)" : "0 8px 28px rgba(15,23,42,0.08)",

    amberBg: isDark ? "rgba(245,158,11,0.09)" : "#fffbeb",
    amberBorder: isDark ? "rgba(245,158,11,0.22)" : "#fde68a",
    amberAccent: isDark ? "#fbbf24" : "#d97706",
    amberStripe: isDark ? "#f59e0b" : "#d97706",
    amberText: isDark ? "#fef3c7" : "#78350f",
    amberMuted: isDark ? "rgba(253,230,138,0.65)" : "#92400e",

    schedBg: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc",
    schedBorder: isDark ? "rgba(255,255,255,0.07)" : "#e4e9f0",

    itemBg: isDark ? "#18191f" : "#ffffff",
    itemBorder: isDark ? "rgba(255,255,255,0.08)" : "#e4e9f0",
    itemPanel: isDark ? "#101116" : "#f8fbff",
    itemPanelBorder: isDark ? "rgba(255,255,255,0.07)" : "#dce4f2",
  };
}

/* ─── Skeleton ────────────────────────────────────────────── */

function Skel({ w = 160, h = 14, isDark, radius = 6 }) {
  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: radius,
        flexShrink: 0,
        background: isDark ? "rgba(255,255,255,0.08)" : "#e5eaf3",
      }}
    />
  );
}

/* ─── Badge ───────────────────────────────────────────────── */

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
        color,
        border: border || "none",
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      {label}
    </span>
  );
}

/* ─── SaveContactButton (vCard: name, phone, profile URL) ─── */

function SaveContactButton({ truckName, truckPhone, size = 36, dark = false }) {
  const anchorRef = useRef(null);

  const permanentUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${window.location.pathname}`
      : "";

  function handleSaveContact(e) {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    const name = truckName || "Food Truck";
    const phone = String(truckPhone || "").replace(/[^\d+]/g, "");

    const lines = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `FN:${name}`,
      `N:${name};;;;`,
      phone ? `TEL;TYPE=CELL:${phone}` : null,
      `URL:${permanentUrl}`,
      `NOTE:Find us on Menuply: ${permanentUrl}`,
      "END:VCARD",
    ]
      .filter(Boolean)
      .join("\r\n");

    const blob = new Blob([lines], { type: "text/vcard;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = anchorRef.current;
    if (!a) return;
    a.href = url;
    a.download = `${name.replace(/[^a-zA-Z0-9]/g, "_")}.vcf`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  return (
    <>
      <a ref={anchorRef} style={{ display: "none" }} aria-hidden="true" />
      <button
        type="button"
        data-testid="food-truck-save-contact"
        onClick={handleSaveContact}
        aria-label={`Save ${truckName || "this food truck"} to contacts`}
        title="Save to contacts"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: size,
          height: size,
          padding: 0,
          borderRadius: "50%",
          border: dark ? "1px solid rgba(255,255,255,0.16)" : "1px solid rgba(15,23,42,0.16)",
          background: dark
            ? "rgba(255,255,255,0.04)"
            : "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(241,245,249,0.96) 100%)",
          color: dark ? "#f8fafc" : "#0f172a",
          cursor: "pointer",
          fontSize: Math.max(14, Math.round(size * 0.42)),
          lineHeight: 1,
          flexShrink: 0,
        }}
      >
        <span aria-hidden="true">📇</span>
      </button>
    </>
  );
}

/* ─── ProfileHeaderCard ───────────────────────────────────── */

function ProfileHeaderCard({ profile, slug, isDark, c, isMobile }) {
  const [shared, setShared] = useState(false);
  const shareTimerRef = useRef(null);

  const name = firstNonEmpty(profile?.restaurant_name, profile?.name);
  const cuisine = firstNonEmpty(profile?.cuisine);
  const category = firstNonEmpty(profile?.category);
  const cuisineLabel = buildCuisineDisplay(cuisine, category);
  const city = firstNonEmpty(profile?.city);
  const state = firstNonEmpty(profile?.state, profile?.region);
  const cityState = [city, state].filter(Boolean).join(", ");
  const phone = firstNonEmpty(profile?.phone);

  const locName = firstNonEmpty(profile?.current_location_name, profile?.current_location);
  const street = firstNonEmpty(profile?.current_address);
  const curCity = firstNonEmpty(profile?.current_city);
  const curState = firstNonEmpty(profile?.current_state);
  const cityLine = [curCity, curState].filter(Boolean).join(", ");
  const curLat = profile?.current_lat ?? null;
  const curLng = profile?.current_lng ?? null;
  const baseLat = profile?.lat ?? null;
  const baseLng = profile?.lng ?? null;
  const mapLat = curLat ?? baseLat;
  const mapLng = curLng ?? baseLng;
  const mapLabel = locName || street || cityLine;
  const mapUrl = buildMapUrl(mapLat, mapLng, mapLabel);
  const servingUntil = firstNonEmpty(profile?.serving_until);
  const serviceWindow = firstNonEmpty(profile?.service_window);
  const updatedAt = firstNonEmpty(profile?.location_updated_at);
  const windowText = servingUntil ? `Until ${servingUntil}` : serviceWindow ? serviceWindow : "";
  const timeAgo = updatedAt ? fmtTimeAgo(updatedAt) : "";
  const hasLocation = locName || street || cityLine;
  const landmarkLines = firstNonEmpty(profile?.landmarks)
    ? String(profile.landmarks)
        .split(/\n/)
        .map((l) => l.trim())
        .filter(Boolean)
    : [];

  const rawSchedule = profile?.schedule || profile?.scheduled_locations;
  const allStops = Array.isArray(rawSchedule) ? rawSchedule.filter(Boolean) : [];
  const preview = allStops.slice(0, SCHEDULE_PREVIEW);
  const hasMoreStops = allStops.length > SCHEDULE_PREVIEW;

  const website = normalizeUrl(firstNonEmpty(profile?.website, profile?.website_url));

  async function handleShare() {
    const shareUrl = window.location.href;
    const shareTitle = name || "Food Truck";

    try {
      if (navigator.share) {
        await navigator.share({
          title: shareTitle,
          text: `Check out ${shareTitle} on Menuply`,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setShared(true);
        clearTimeout(shareTimerRef.current);
        shareTimerRef.current = setTimeout(() => setShared(false), 2000);
      }
    } catch {
      // cancelled
    }
  }

  const btnBase = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    height: 40,
    padding: "0 16px",
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    textDecoration: "none",
    whiteSpace: "nowrap",
    letterSpacing: 0.1,
    border: "none",
    flexShrink: 0,
    boxSizing: "border-box",
  };

  const btnOutline = {
    ...btnBase,
    background: "transparent",
    color: isDark ? "rgba(255,255,255,0.72)" : "#374151",
    border: isDark ? "1px solid rgba(255,255,255,0.14)" : "1px solid #d1d9e6",
    width: isMobile ? "100%" : "auto",
  };

  return (
    <div
      style={{
        borderRadius: 20,
        background: c.cardBg,
        border: c.cardBorder,
        boxShadow: c.cardShadow,
        overflow: "hidden",
      }}
    >
      <div style={{ padding: isMobile ? "16px 16px 0" : "22px 22px 0" }}>
        <div
          style={{
            display: "flex",
            alignItems: isMobile ? "flex-start" : "center",
            justifyContent: "space-between",
            gap: 10,
            flexWrap: "wrap",
            marginBottom: 10,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              flexWrap: "wrap",
              minWidth: 0,
            }}
          >
            <span
              style={{
                fontSize: 10,
                fontWeight: 900,
                letterSpacing: 1.1,
                textTransform: "uppercase",
                color: c.amberAccent,
              }}
            >
              Food Truck
            </span>
            {cuisineLabel ? (
              <>
                <span style={{ color: c.mutedSub, fontSize: 10 }}>·</span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: 0.6,
                    textTransform: "uppercase",
                    color: c.muted,
                    wordBreak: "break-word",
                  }}
                >
                  {cuisineLabel}
                </span>
              </>
            ) : null}
          </div>

          <button
            type="button"
            onClick={handleShare}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              height: 28,
              padding: "0 12px",
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              background: shared ? "rgba(34,197,94,0.12)" : "linear-gradient(180deg, #ffffff 0%, #f5faf7 100%)",
              border: isDark ? "1px solid rgba(255,255,255,0.22)" : "1px solid rgba(17, 33, 26, 0.18)",
              color: shared ? "#15803d" : isDark ? "#f8fafc" : "#111827",
              boxShadow: "0 4px 12px rgba(17, 33, 26, 0.08)",
              flexShrink: 0,
            }}
          >
            <ShareIcon size={14} />
            {shared ? "Copied!" : "Share"}
          </button>
        </div>

        <h1
          style={{
            margin: 0,
            fontSize: isMobile ? 24 : 28,
            fontWeight: 900,
            lineHeight: 1.1,
            letterSpacing: "-0.025em",
            color: isDark ? "#f8fafc" : "#0f172a",
            wordBreak: "break-word",
          }}
        >
          {name}
        </h1>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "4px 14px",
            marginTop: 8,
          }}
        >
          {cityState ? (
            <span style={{ fontSize: 13, fontWeight: 600, color: c.muted }}>
              {cityState}
            </span>
          ) : null}
          {phone ? (
            <a
              href={`tel:${String(phone).replace(/[^\d+]/g, "")}`}
              title={phone}
              aria-label={`Call ${phone}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 30,
                height: 30,
                borderRadius: 8,
                background: "rgba(255,255,255,0.1)",
                border: `1px solid ${c.amberAccent}`,
                color: c.amberAccent,
                textDecoration: "none",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
            </a>
          ) : null}
        </div>
      </div>

      <div style={{ height: 1, background: c.divider, margin: "18px 0 0" }} />

      <div
        style={{
          margin: "0 16px 0",
          borderRadius: 14,
          background: c.amberBg,
          border: `1px solid ${c.amberBorder}`,
          overflow: "hidden",
          position: "relative",
          marginTop: 16,
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            bottom: 0,
            width: 4,
            background: c.amberStripe,
            borderRadius: "14px 0 0 14px",
          }}
        />

        <div style={{ padding: isMobile ? "14px 14px 14px 18px" : "14px 16px 14px 20px" }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 900,
              letterSpacing: 1.1,
              textTransform: "uppercase",
              color: c.amberAccent,
              marginBottom: 8,
            }}
          >
            Now Serving
          </div>

          {hasLocation ? (
            <>
              {locName ? (
                <div
                  style={{
                    fontSize: isMobile ? 15 : 16,
                    fontWeight: 800,
                    color: c.amberText,
                    lineHeight: 1.25,
                    marginBottom: 3,
                    wordBreak: "break-word",
                  }}
                >
                  {locName}
                </div>
              ) : null}
              {street ? (
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: c.amberText,
                    lineHeight: 1.35,
                    marginBottom: cityLine ? 2 : 0,
                    wordBreak: "break-word",
                  }}
                >
                  {street}
                </div>
              ) : null}
              {cityLine ? (
                <div
                  style={{
                    fontSize: 13,
                    color: c.amberMuted,
                    lineHeight: 1.4,
                    wordBreak: "break-word",
                  }}
                >
                  {cityLine}
                </div>
              ) : null}
            </>
          ) : (
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                fontStyle: "italic",
                color: isDark ? "rgba(254,243,199,0.40)" : "rgba(120,53,15,0.40)",
              }}
            >
              Location not currently set
            </div>
          )}

          {mapUrl && mapLat != null ? (
            <a
              href={mapUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                marginTop: 8,
                fontSize: 12,
                fontWeight: 700,
                color: c.amberAccent,
                textDecoration: "none",
                flexWrap: "wrap",
              }}
            >
              <span aria-hidden="true">📍</span> Get Directions
            </a>
          ) : null}

          {(windowText || timeAgo) ? (
            <div
              style={{
                marginTop: 10,
                paddingTop: 10,
                borderTop: `1px solid ${c.amberBorder}`,
                display: "flex",
                flexDirection: "column",
                gap: 3,
              }}
            >
              {windowText ? (
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: c.amberMuted,
                    wordBreak: "break-word",
                  }}
                >
                  {windowText}
                </div>
              ) : null}
              {timeAgo ? (
                <div
                  style={{
                    fontSize: 11,
                    color: isDark
                      ? "rgba(253,230,138,0.38)"
                      : "rgba(120,53,15,0.40)",
                  }}
                >
                  Updated {timeAgo}
                </div>
              ) : null}
            </div>
          ) : null}

          {landmarkLines.length > 0 ? (
            <div
              style={{
                marginTop: 10,
                paddingTop: 10,
                borderTop: `1px solid ${c.amberBorder}`,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: 0.7,
                  textTransform: "uppercase",
                  color: isDark
                    ? "rgba(253,230,138,0.45)"
                    : "rgba(120,53,15,0.45)",
                  marginBottom: 5,
                }}
              >
                Nearby
              </div>
              {landmarkLines.map((line, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 7,
                    fontSize: 12,
                    color: c.amberMuted,
                    lineHeight: 1.4,
                    marginTop: 3,
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      display: "inline-block",
                      width: 4,
                      height: 4,
                      borderRadius: "50%",
                      background: c.amberStripe,
                      flexShrink: 0,
                      marginTop: "0.45em",
                      opacity: 0.5,
                    }}
                  />
                  <span style={{ wordBreak: "break-word" }}>{line}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div style={{ padding: isMobile ? "16px 16px 0" : "18px 16px 0" }}>
        {preview.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {preview.map((entry, idx) => {
              const day = firstNonEmpty(entry?.day, entry?.date);
              const location = firstNonEmpty(entry?.location, entry?.address, entry?.place);
              const time = firstNonEmpty(entry?.time, entry?.time_window, entry?.hours);

              return (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    flexDirection: isMobile ? "column" : "row",
                    alignItems: isMobile ? "stretch" : "flex-start",
                    gap: isMobile ? 4 : 12,
                    padding: "10px 12px",
                    borderRadius: 10,
                    background: c.schedBg,
                    border: `1px solid ${c.schedBorder}`,
                  }}
                >
                  {day ? (
                    <div
                      style={{
                        flexShrink: 0,
                        fontSize: 10,
                        fontWeight: 900,
                        letterSpacing: 0.5,
                        textTransform: "uppercase",
                        color: c.amberAccent,
                        minWidth: isMobile ? 0 : 54,
                        paddingTop: isMobile ? 0 : 1,
                      }}
                    >
                      {day}
                    </div>
                  ) : null}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {location ? (
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: isDark ? "#f1f5f9" : "#0f172a",
                          lineHeight: 1.3,
                          wordBreak: "break-word",
                        }}
                      >
                        {location}
                      </div>
                    ) : null}
                    {time ? (
                      <div
                        style={{
                          fontSize: 11,
                          color: c.muted,
                          marginTop: 2,
                          wordBreak: "break-word",
                        }}
                      >
                        {time}
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}

        <a
          href={`/foodtrucks/${slug}/schedule`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            marginTop: preview.length > 0 ? 10 : 0,
            paddingLeft: isMobile ? 0 : 20,
            fontSize: 12,
            fontWeight: 700,
            color: c.amberAccent,
            textDecoration: "none",
            flexWrap: "wrap",
          }}
        >
          {hasMoreStops ? "View Full Schedule →" : "Upcoming Locations / Events →"}
        </a>
      </div>

      <div
        style={{
          padding: isMobile ? "16px" : "18px 22px 20px",
          display: "flex",
          flexWrap: "wrap",
          flexDirection: isMobile ? "column" : "row",
          gap: 8,
          borderTop: preview.length > 0 ? `1px solid ${c.divider}` : "none",
          marginTop: preview.length > 0 ? 18 : 16,
        }}
      >
        {mapUrl ? (
          <a href={mapUrl} target="_blank" rel="noreferrer" style={btnOutline}>
            Directions
          </a>
        ) : null}
        {website ? (
          <a href={website} target="_blank" rel="noreferrer" style={btnOutline}>
            Website ↗
          </a>
        ) : null}
      </div>
    </div>
  );
}

/* ─── MenuInline ──────────────────────────────────────────── */

const LIGHT_PANEL = {
  panel2: "#f6f6f7",
  border: "rgba(0,0,0,0.08)",
  text: "rgba(0,0,0,0.92)",
  subtext: "rgba(0,0,0,0.55)",
  chipBg: "rgba(0,0,0,0.04)",
};

const DARK_PANEL = {
  panel2: "#18191f",
  border: "rgba(255,255,255,0.08)",
  text: "rgba(255,255,255,0.92)",
  subtext: "rgba(255,255,255,0.55)",
  chipBg: "rgba(255,255,255,0.04)",
};

function DisplayOnlyOrderNotice({ isDark, c }) {
  return (
    <div
      role="status"
      style={{
        marginTop: 16,
        padding: "12px 14px",
        borderRadius: 12,
        background: isDark ? "rgba(245,158,11,0.10)" : "#fffbeb",
        border: isDark ? "1px solid rgba(245,158,11,0.30)" : "1px solid #fcd34d",
        color: c.pageColor,
        fontSize: 13,
        lineHeight: 1.5,
      }}
    >
      <strong>Demo profile — ordering unavailable.</strong>{" "}
      Browse the menu for display purposes. Checkout and payment are disabled.
    </div>
  );
}

function MenuInline({ menuData, isDark, c, isMobile, language = "en" }) {
  const sections = normalizeSections(menuData);

  const dealMap = useMemo(() => {
    const m = new Map();
    for (const d of menuData?.deal_items || []) {
      const key = d.menu_item_id ?? d.id;
      if (key == null) continue;
      m.set(key, d);
      const numericKey = Number(key);
      if (Number.isFinite(numericKey)) m.set(numericKey, d);
    }
    return m;
  }, [menuData]);

  const insightColors = isDark ? DARK_PANEL : LIGHT_PANEL;

  if (sections.length === 0) {
    return (
      <div style={{ fontSize: 14, color: c.muted, fontStyle: "italic" }}>
        No menu items yet.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {sections.map((sec, sIdx) => {
        const title = asStr(sec?.title || "").trim();
        const items = Array.isArray(sec?.items) ? sec.items : [];

        return (
          <div key={`${title}-${sIdx}`} style={{ marginTop: sIdx === 0 ? 0 : 28 }}>
            {title ? (
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 900,
                  letterSpacing: 0.4,
                  textTransform: "uppercase",
                  color: c.amberAccent,
                  marginBottom: 10,
                  wordBreak: "break-word",
                }}
              >
                {title}
              </div>
            ) : null}

            <div style={{ display: "flex", flexDirection: "column" }}>
              {items.map((it, iIdx) => {
                const itemKey = String(it?.id ?? `${sIdx}-${iIdx}`);
                const itemName = getDisplayMenuItemName(it, language, "Item");
                const desc = asStr(it?.description || it?.notes || "").trim();
                const price = fmtMoney(it?.price);
                const hasDeal = it?.id != null ? !!dealMap.get(it.id) : false;

                return (
                  <div
                    key={itemKey}
                    style={{
                      padding: "14px 0",
                      borderTop: iIdx === 0 ? "none" : `1px solid ${c.divider}`,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: isMobile ? "column" : "row",
                        justifyContent: "space-between",
                        alignItems: isMobile ? "stretch" : "flex-start",
                        gap: isMobile ? 8 : 12,
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            flexWrap: "wrap",
                          }}
                        >
                          <span
                            style={{
                              fontSize: 15,
                              fontWeight: 800,
                              lineHeight: 1.25,
                              color: isDark ? "#f1f5f9" : "#0f172a",
                              wordBreak: "break-word",
                            }}
                          >
                            {itemName}
                          </span>
                          {hasDeal ? (
                            <Badge
                              label="Deal"
                              bg="#dcfce7"
                              color="#15803d"
                              border="1px solid #bbf7d0"
                            />
                          ) : null}
                          {it?.is_vegan ? (
                            <Badge
                              label="Vegan"
                              bg="#f0fdf4"
                              color="#166534"
                              border="1px solid #bbf7d0"
                            />
                          ) : null}
                          {it?.is_gluten_free ? (
                            <Badge
                              label="GF"
                              bg="#fffbeb"
                              color="#92400e"
                              border="1px solid #fde68a"
                            />
                          ) : null}
                        </div>
                        {desc ? (
                          <div
                            style={{
                              marginTop: 4,
                              fontSize: 13,
                              color: c.muted,
                              lineHeight: 1.35,
                              wordBreak: "break-word",
                            }}
                          >
                            {desc}
                          </div>
                        ) : null}
                      </div>

                      {price ? (
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 900,
                            whiteSpace: isMobile ? "normal" : "nowrap",
                            flexShrink: 0,
                            color: isDark ? "#f1f5f9" : "#0f172a",
                            alignSelf: isMobile ? "flex-start" : "auto",
                          }}
                        >
                          {price}
                        </div>
                      ) : null}
                    </div>

                    <MenuItemInsightsPanel item={it} colors={insightColors} />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── AboutSection ────────────────────────────────────────── */

function AboutSection({ profile, isDark, c }) {
  const bio = firstNonEmpty(profile?.bio);
  const instagram = normalizeInstagram(firstNonEmpty(profile?.instagram));

  if (!bio && !instagram) return null;

  return (
    <div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: 0.9,
          textTransform: "uppercase",
          color: c.sectionLbl,
          marginBottom: 12,
        }}
      >
        About
      </div>

      {bio ? (
        <p
          style={{
            margin: "0 0 14px",
            fontSize: 14,
            lineHeight: 1.7,
            color: isDark ? "rgba(255,255,255,0.68)" : "#374151",
            wordBreak: "break-word",
          }}
        >
          {bio}
        </p>
      ) : null}

      {instagram ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: 14,
            flexWrap: "wrap",
          }}
        >
          <span style={{ color: c.muted }}>Instagram</span>
          <a
            href={`https://instagram.com/${instagram}`}
            target="_blank"
            rel="noreferrer"
            style={{
              color: c.linkColor,
              textDecoration: "none",
              fontWeight: 600,
              wordBreak: "break-word",
            }}
          >
            @{instagram} ↗
          </a>
        </div>
      ) : null}
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────── */

export default function FoodTruckPage() {
  const { t } = useLanguage();
  const { slugOrId } = useParams();
  const isMobile = useIsMobile();

  const [theme, setTheme] = useState(readTheme);
  const isDark = theme === "dark";
  const c = useMemo(() => getColors(isDark), [isDark]);

  const [profileState, setProfileState] = useState({
    status: "loading",
    data: null,
    error: null,
  });
  const [menuPreviewItems, setMenuPreviewItems] = useState([]);

  useEffect(() => {
    saveTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (!slugOrId) return;
    let cancelled = false;

    setProfileState({ status: "loading", data: null, error: null });
    setMenuPreviewItems([]);

    (async () => {
      try {
        const res = await fetch(`${API}/public/restaurants/${encodeURIComponent(slugOrId)}`);
        const json = await res.json().catch(() => null);

        if (cancelled) return;

        if (!res.ok || !json) {
          setProfileState({
            status: "error",
            data: null,
            error: toConsumerErrorMessage(
              json?.error || `Request failed (${res.status})`,
              "We couldn’t load this restaurant right now. Please try again in a moment."
            ),
          });
          return;
        }

        const restaurant = {
          ...(json?.restaurant || json || {}),
          deal_items: Array.isArray(json?.deal_items) ? json.deal_items : [],
          billboard_preview: Array.isArray(json?.restaurant?.billboard_preview)
            ? json.restaurant.billboard_preview
            : Array.isArray(json?.billboard_preview)
              ? json.billboard_preview
              : [],
          operating_hours: Array.isArray(json?.restaurant?.operating_hours)
            ? json.restaurant.operating_hours
            : Array.isArray(json?.operating_hours)
              ? json.operating_hours
              : [],
        };

        setProfileState({
          status: "ok",
          data: restaurant,
          error: null,
        });

        const rid = restaurant?.id;
        if (rid) {
          try {
            const preview = await fetchRestaurantMenuPreview(rid, { limit: 18 });
            if (cancelled) return;
            const items = Array.isArray(preview?.preview_items)
              ? preview.preview_items
              : Array.isArray(preview?.items)
                ? preview.items
                : [];
            setMenuPreviewItems(preview?.ok && items.length ? items : []);
          } catch {
            if (!cancelled) setMenuPreviewItems([]);
          }
        }
      } catch (e) {
        if (!cancelled) {
          setProfileState({
            status: "error",
            data: null,
            error: toConsumerErrorMessage(
              e,
              "We couldn’t load this restaurant right now. Please try again in a moment."
            ),
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [slugOrId]);

  const pageWrap = (children) => (
    <>
      <div
        style={{
          minHeight: "100vh",
          background: c.pageBg,
          color: c.pageColor,
          fontFamily: "var(--font-ui, ui-sans-serif, system-ui, sans-serif)",
          padding: isMobile ? "14px 12px 80px" : "20px 16px 100px",
          overflowX: "hidden",
          boxSizing: "border-box",
        }}
      >
        <div style={{ maxWidth: 600, margin: "0 auto", width: "100%", minWidth: 0 }}>
          {children}
        </div>
      </div>
      <BottomNav />
    </>
  );

  const navBar = (
    <div
      style={{
        display: "flex",
        alignItems: isMobile ? "flex-start" : "center",
        justifyContent: "space-between",
        gap: 12,
        marginBottom: isMobile ? 16 : 20,
      }}
    >
      <HomeButton />
      <button
        type="button"
        onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
        style={{
          height: 32,
          padding: "0 12px",
          fontSize: 11,
          fontWeight: 700,
          borderRadius: 8,
          background: "transparent",
          cursor: "pointer",
          border: isDark ? "1px solid rgba(255,255,255,0.14)" : "1px solid #cbd5e1",
          color: c.muted,
          flexShrink: 0,
        }}
        aria-label="Toggle theme"
      >
        {isDark ? "Light" : "Dark"}
      </button>
    </div>
  );

  if (profileState.status === "loading") {
    return pageWrap(
      <>
        {navBar}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Skel w="100%" h={280} isDark={isDark} radius={20} />
          <Skel w={80} h={13} isDark={isDark} />
          <Skel w="100%" h={72} isDark={isDark} radius={14} />
          <Skel w="100%" h={72} isDark={isDark} radius={14} />
          <Skel w="100%" h={72} isDark={isDark} radius={14} />
        </div>
      </>
    );
  }

  if (profileState.status === "error") {
    return pageWrap(
      <>
        {navBar}
        <div
          style={{
            padding: "16px 18px",
            borderRadius: 14,
            fontSize: 14,
            fontWeight: 600,
            background: isDark ? "rgba(248,113,113,0.07)" : "#fff5f5",
            border: isDark ? "1px solid rgba(248,113,113,0.25)" : "1px solid #fca5a5",
            color: isDark ? "#fca5a5" : "#b91c1c",
            wordBreak: "break-word",
          }}
        >
          {profileState.error}
        </div>
      </>
    );
  }

  const profile = profileState.data;
  const light = getColors(false);

  const name =
    firstNonEmpty(profile?.restaurant_name, profile?.name) || `Food truck ${slugOrId}`;
  const streetAddr = firstNonEmpty(
    profile?.current_address,
    profile?.current_pickup_address,
    profile?.address_line1,
    profile?.address
  );
  const city = firstNonEmpty(profile?.current_city, profile?.city);
  const stateVal = firstNonEmpty(profile?.current_state, profile?.state);
  const zipVal = firstNonEmpty(profile?.postal_code, profile?.zip);
  const cityLine =
    [city, stateVal].filter(Boolean).join(", ") + (zipVal ? ` ${zipVal}` : "");
  const websiteRaw = firstNonEmpty(profile?.website, profile?.website_url);
  const website = normalizeUrl(websiteRaw);
  const phone = firstNonEmpty(profile?.phone);
  const cuisine = humanizeLabel(firstNonEmpty(profile?.cuisine));
  const bioText = firstNonEmpty(profile?.bio);
  const aboutText = firstNonEmpty(profile?.about_us);
  const foundedText = firstNonEmpty(
    profile?.founded,
    profile?.founded_year,
    profile?.year_founded
  );
  const featuredItem = profile?.featured_item || null;
  const dealItems = Array.isArray(profile?.deal_items) ? profile.deal_items : [];
  const todaysSpecial = dealItems[0]
    ? {
        name: firstNonEmpty(dealItems[0]?.name, dealItems[0]?.title, dealItems[0]?.item_name),
        description: firstNonEmpty(dealItems[0]?.description, dealItems[0]?.details),
        price: dealItems[0]?.price ?? dealItems[0]?.deal_price ?? null,
      }
    : null;
  const operatingHours = Array.isArray(profile?.operating_hours) ? profile.operating_hours : [];
  const billboardPreview = Array.isArray(profile?.billboard_preview)
    ? profile.billboard_preview
    : [];
  // Phase 1.5: billboard image first, then cover/hero, then Menuply gradient (never fake food).
  const firstBillboardImage =
    billboardPreview.find((p) => p?.image_url || p?.photo_url)?.image_url ||
    billboardPreview.find((p) => p?.image_url || p?.photo_url)?.photo_url ||
    null;
  const bannerPhotoUrl =
    firstBillboardImage ||
    profile?.hero_image_url ||
    profile?.cover_image_url ||
    profile?.banner_url ||
    null;

  const menuHref =
    restaurantMenuPathFromRow({
      slug: profile?.slug || slugOrId,
      city,
      state: stateVal,
      id: profile?.id,
    }) || (profile?.id ? `/public/restaurants/${profile.id}/menu` : null);

  const saveContactControl = (
    <SaveContactButton truckName={name} truckPhone={phone} size={36} dark />
  );

  return (
    <>
      <StickyPageHeader />
      <div
        style={{
          minHeight: "100vh",
          /* Background comes from PublicProfileShell Restaurant Style tokens. */
          background: "transparent",
          paddingBottom: 88,
          fontFamily: "var(--font-ui, ui-sans-serif, system-ui, sans-serif)",
        }}
      >
        <div style={{ maxWidth: 1040, margin: "12px auto 0", padding: "0 16px" }}>
          {profile?.public_ordering_mode === "display_only" ? (
            <DisplayOnlyOrderNotice isDark={false} c={light} />
          ) : null}
        </div>

        <FoodTruckPublicEditorial
          profile={profile}
          name={name}
          streetAddr={streetAddr || ""}
          cityLine={cityLine}
          website={website}
          websiteRaw={websiteRaw || website}
          phone={phone || ""}
          cuisine={cuisine || ""}
          bioText={bioText || ""}
          aboutText={aboutText || ""}
          foundedText={foundedText || ""}
          featuredItem={featuredItem}
          todaysSpecial={todaysSpecial}
          operatingHours={operatingHours}
          logoUrl={profile?.logo_url || ""}
          bannerPhotoUrl={bannerPhotoUrl}
          statusLightProps={buildRestaurantStatusLightProps(profile)}
          restaurantId={profile?.id || null}
          shareData={
            profile?.id
              ? buildRestaurantShareData({
                  restaurantName: name,
                  restaurantSlug: profile?.slug || slugOrId,
                  restaurantId: profile?.id,
                  city,
                  state: stateVal,
                  logoUrl: profile?.logo_url || "",
                })
              : null
          }
          shareAnalytics={{
            restaurantId: profile?.id,
            restaurantName: name,
            restaurantSlug: profile?.slug || slugOrId,
          }}
          saveContactControl={saveContactControl}
          menuHref={menuHref}
          menuPreviewItems={menuPreviewItems}
          billboardPreview={billboardPreview}
          showClaimInvites={profile?.public_profile_mode === "full_claimable"}
          isMobile={isMobile}
        />
      </div>
      <BottomNav />
    </>
  );
}
