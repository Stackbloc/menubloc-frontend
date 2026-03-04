/**
 * ============================================================
 * File: menubloc-frontend/src/pages/RestaurantPublicPage.jsx
 * Date: 2026-03-03
 * Purpose:
 *   Public restaurant page at /restaurants/:id.
 *   Fetches and renders the restaurant's active menu from:
 *     GET /public/restaurants/:id/menu
 *   Renders menu sections/items as returned by backend (no mock menu).
 *   Includes a Light/Dark toggle (persisted in localStorage).
 *
 * Notes:
 *   - This page will show address/phone/website/distance ONLY if backend includes
 *     those fields in the /public/restaurants/:id/menu payload (or you add a second fetch).
 * ============================================================
 */

import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

const API = (import.meta.env.VITE_API_URL || "http://localhost:3001").replace(/\/$/, "");
const THEME_KEY = "grubbid_theme";
const THEMES = { dark: "dark", light: "light" };

function formatMoneyFromCents(cents) {
  if (cents == null || Number.isNaN(Number(cents))) return "";
  const n = Number(cents);
  const dollars = (n / 100).toFixed(2);
  return `$${dollars}`;
}

function formatPhone(phone) {
  const p = String(phone || "").trim();
  return p;
}

function readSavedTheme() {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return v === THEMES.light ? THEMES.light : THEMES.dark;
  } catch {
    return THEMES.dark;
  }
}

function saveTheme(next) {
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch {
    // ignore
  }
}

function normalizeWebsite(url) {
  const s = String(url || "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  return `https://${s}`;
}

export default function RestaurantPublicPage() {
  const { id } = useParams();

  // Theme
  const [theme, setTheme] = useState(() => readSavedTheme());

  // Data
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [payload, setPayload] = useState(null);

  const requestUrl = useMemo(() => `${API}/public/restaurants/${id}/menu`, [id]);

  useEffect(() => {
    saveTheme(theme);
  }, [theme]);

  useEffect(() => {
    let alive = true;

    async function run() {
      setLoading(true);
      setErr("");
      try {
        const res = await fetch(requestUrl, { credentials: "include" });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json?.ok) throw new Error(json?.error || `HTTP ${res.status}`);
        if (!alive) return;
        setPayload(json);
      } catch (e) {
        if (!alive) return;
        setErr(String(e?.message || e));
        setPayload(null);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, [requestUrl]);

  const isDark = theme === THEMES.dark;

  // Restaurant fields (only show if present)
  const restaurantName = payload?.restaurant_name || payload?.name || `Restaurant ${id}`;

  const address =
    payload?.address ||
    payload?.restaurant_address ||
    payload?.street_address ||
    "";

  const city = payload?.city || "";
  const state = payload?.state || "";
  const zip = payload?.zip || payload?.postal_code || "";

  const phone = payload?.phone || payload?.restaurant_phone || "";
  const websiteRaw = payload?.website || payload?.restaurant_website || "";
  const website = normalizeWebsite(websiteRaw);

  // distance (only if backend provides)
  const distanceMiles =
    payload?.distance_miles ??
    payload?.distanceMiles ??
    null;

  const distanceText =
    distanceMiles != null && !Number.isNaN(Number(distanceMiles))
      ? `${Number(distanceMiles).toFixed(1)} mi`
      : (payload?.distance ? String(payload.distance) : "");

  const hasAddressLine = [address, city, state, zip].some((x) => String(x || "").trim());
  const addressLine = [address, [city, state].filter(Boolean).join(", "), zip]
    .filter((x) => String(x || "").trim())
    .join(" ");

  const sections = Array.isArray(payload?.sections) ? payload.sections : [];

  const styles = {
    page: {
      minHeight: "100vh",
      background: isDark ? "#0b0b0f" : "#f6f7fb",
      color: isDark ? "#fff" : "#111",
      padding: "26px 18px 60px",
      fontFamily:
        'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial',
    },

    topBar: {
      maxWidth: 980,
      margin: "0 auto 14px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },
    back: { color: isDark ? "#fff" : "#111", textDecoration: "underline", fontWeight: 800 },

    card: {
      maxWidth: 980,
      margin: "0 auto",
      background: isDark ? "rgba(255,255,255,0.06)" : "#fff",
      border: isDark ? "1px solid rgba(255,255,255,0.10)" : "1px solid #e9e9ef",
      borderRadius: 18,
      padding: 18,
      boxShadow: isDark ? "0 12px 40px rgba(0,0,0,0.35)" : "0 10px 30px rgba(16,24,40,0.10)",
    },

    headerRow: {
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 12,
      marginBottom: 14,
    },

    titleBlock: { display: "flex", flexDirection: "column", gap: 8 },
    title: { fontSize: 22, fontWeight: 950, lineHeight: 1.1, margin: 0 },

    metaLines: { display: "flex", flexDirection: "column", gap: 4 },
    metaLine: { fontSize: 12, fontWeight: 700, color: isDark ? "rgba(255,255,255,0.75)" : "#4b5563" },

    badges: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginTop: 4 },
    badge: {
      display: "inline-flex",
      alignItems: "center",
      height: 24,
      padding: "0 10px",
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 900,
      background: isDark ? "rgba(255,255,255,0.10)" : "#f3f4f7",
      border: isDark ? "1px solid rgba(255,255,255,0.16)" : "1px solid #e6e7ee",
      color: isDark ? "#fff" : "#111",
    },

    toggleBtn: {
      height: 32,
      padding: "0 12px",
      borderRadius: 10,
      border: isDark ? "1px solid rgba(255,255,255,0.18)" : "1px solid #e6e7ee",
      background: isDark ? "rgba(255,255,255,0.08)" : "#fff",
      color: isDark ? "#fff" : "#111",
      fontWeight: 900,
      cursor: "pointer",
      whiteSpace: "nowrap",
    },

    sectionTitle: {
      marginTop: 18,
      marginBottom: 10,
      fontWeight: 950,
      fontSize: 13,
      letterSpacing: 0.2,
      opacity: 0.95,
    },

    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
      gap: 12,
    },

    itemCard: {
      background: isDark ? "rgba(0,0,0,0.22)" : "#fbfbfd",
      border: isDark ? "1px solid rgba(255,255,255,0.10)" : "1px solid #ececf2",
      borderRadius: 14,
      padding: 12,
    },
    itemTop: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline",
      gap: 10,
      marginBottom: 6,
    },
    itemName: { fontWeight: 950, fontSize: 14 },
    price: { fontWeight: 950, fontSize: 13, opacity: 0.95 },
    notes: { fontSize: 12, opacity: isDark ? 0.7 : 0.8, lineHeight: 1.3 },

    msg: {
      marginTop: 12,
      padding: 12,
      borderRadius: 12,
      background: isDark ? "rgba(255,255,255,0.06)" : "#f8fafc",
      border: isDark ? "1px solid rgba(255,255,255,0.10)" : "1px solid #e9eef5",
      fontWeight: 800,
    },

    link: {
      color: isDark ? "#fff" : "#111",
      textDecoration: "underline",
      textUnderlineOffset: "3px",
      fontWeight: 800,
    },

    media: { fontSize: 11, opacity: isDark ? 0.6 : 0.7, marginTop: 10 },
  };

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <Link to="/" style={styles.back}>
          Back
        </Link>
      </div>

      <div style={styles.card}>
        <div style={styles.headerRow}>
          <div style={styles.titleBlock}>
            <h1 style={styles.title}>{restaurantName}</h1>

            <div style={styles.metaLines}>
              {hasAddressLine ? <div style={styles.metaLine}>{addressLine}</div> : null}

              {phone ? (
                <div style={styles.metaLine}>
                  <a style={styles.link} href={`tel:${String(phone).replace(/[^\d+]/g, "")}`}>
                    {formatPhone(phone)}
                  </a>
                </div>
              ) : null}

              {website ? (
                <div style={styles.metaLine}>
                  <a style={styles.link} href={website} target="_blank" rel="noreferrer">
                    {websiteRaw || website}
                  </a>
                </div>
              ) : null}

              {distanceText ? <div style={styles.metaLine}>Distance: {distanceText}</div> : null}
            </div>

            <div style={styles.badges}>
              <span style={styles.badge}>Public Listing</span>
              {payload?.status ? <span style={styles.badge}>{payload.status}</span> : null}
              {payload?.menu_id ? <span style={styles.badge}>Menu #{payload.menu_id}</span> : null}
            </div>
          </div>

          <button
            type="button"
            style={styles.toggleBtn}
            onClick={() => setTheme((t) => (t === THEMES.dark ? THEMES.light : THEMES.dark))}
            aria-label="Toggle light/dark theme"
          >
            {isDark ? "Light" : "Dark"}
          </button>
        </div>

        {loading ? <div style={styles.msg}>Loading menu…</div> : null}
        {err ? <div style={styles.msg}>Error: {err}</div> : null}

        {!loading && !err && sections.length === 0 ? (
          <div style={styles.msg}>No menu found.</div>
        ) : null}

        {!loading &&
          !err &&
          sections.map((sec, idx) => {
            const items = Array.isArray(sec?.items) ? sec.items : [];
            const title = String(sec?.title || `Section ${idx + 1}`);

            return (
              <div key={`${title}-${idx}`} style={{ marginBottom: 14 }}>
                <div style={styles.sectionTitle}>{title}</div>

                <div style={styles.grid}>
                  {items.map((it) => {
                    const itemName = String(it?.name || "Item");
                    const itemId = it?.id ?? `${itemName}-${idx}`;
                    const price =
                      it?.price ||
                      (it?.price_cents != null ? formatMoneyFromCents(it.price_cents) : "");

                    return (
                      <div key={itemId} style={styles.itemCard}>
                        <div style={styles.itemTop}>
                          <div style={styles.itemName}>{itemName}</div>
                          <div style={styles.price}>{price}</div>
                        </div>
                        {it?.notes ? <div style={styles.notes}>{it.notes}</div> : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

        <div style={styles.media}>Data source: {requestUrl}</div>
      </div>
    </div>
  );
}