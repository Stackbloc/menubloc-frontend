/**
 * ============================================================
 * File: menubloc-frontend/src/pages/RestaurantPublicPage.jsx
 * Date: 2026-02-28
 * Purpose:
 *   Public-facing restaurant profile page.
 *
 * Requirements implemented:
 *   - Website field is a clickable external link.
 *   - Listing status label (Public / Verified / Pro) is placed close
 *     to restaurant name (directly beneath it).
 *   - Theme toggle button moved into the top header row (right side),
 *     replacing where the listing label previously sat.
 *
 * Notes:
 *   - Fetches restaurant via backend public endpoint:
 *       GET /public/restaurants/:id
 *   - Listing status is derived:
 *       - default: "Public Listing"
 *       - if restaurant.verified === true -> "Verified Listing"
 *       - if restaurant.pro === true -> "Pro Listing"
 *     (If these fields don’t exist yet, it will stay "Public Listing".)
 * ============================================================
 */

import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

const API = (import.meta.env.VITE_API_URL || "http://localhost:3001").replace(/\/$/, "");

function safeText(v) {
  return String(v ?? "").trim();
}

function normalizeUrl(url) {
  const u = safeText(url);
  if (!u) return "";
  // If user stored "example.com", make it clickable as https://example.com
  if (/^https?:\/\//i.test(u)) return u;
  return `https://${u}`;
}

function badgeStyle(on, dark) {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 800,
    border: dark ? "1px solid rgba(255,255,255,0.14)" : "1px solid #e8e8e8",
    background: on ? (dark ? "rgba(255,255,255,0.10)" : "#fff") : "transparent",
    color: dark ? "#fff" : "#111",
    userSelect: "none",
    whiteSpace: "nowrap",
  };
}

export default function RestaurantPublicPage() {
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [data, setData] = useState(null);

  // theme (local only, simple and reliable)
  const [dark, setDark] = useState(() => {
    try {
      return localStorage.getItem("grubbid_theme") === "dark";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("grubbid_theme", dark ? "dark" : "light");
    } catch {}
  }, [dark]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setErr("");
      try {
        const res = await fetch(`${API}/public/restaurants/${encodeURIComponent(String(id))}`, {
          credentials: "include",
        });
        const json = await res.json().catch(() => null);

        if (!res.ok || !json?.ok) {
          throw new Error(json?.error || `HTTP ${res.status}`);
        }

        if (!cancelled) setData(json);
      } catch (e) {
        if (!cancelled) setErr(e?.message || "Failed to load restaurant.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (id) run();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const restaurant = data?.restaurant || null;
  const items = Array.isArray(data?.menu_items) ? data.menu_items : [];

  const websiteHref = useMemo(() => normalizeUrl(restaurant?.website), [restaurant?.website]);

  const listingLabel = useMemo(() => {
    // Future-proof: if backend adds these booleans, we’ll show them automatically.
    if (restaurant?.pro === true) return "Pro Listing";
    if (restaurant?.verified === true) return "Verified Listing";
    return "Public Listing";
  }, [restaurant]);

  const styles = useMemo(() => {
    const bg = dark ? "#0b0b0f" : "#ffffff";
    const fg = dark ? "#ffffff" : "#111111";
    const muted = dark ? "rgba(255,255,255,0.70)" : "#666";
    const cardBg = dark ? "rgba(255,255,255,0.05)" : "#fff";
    const border = dark ? "1px solid rgba(255,255,255,0.10)" : "1px solid #eee";

    return {
      page: {
        minHeight: "100vh",
        background: bg,
        color: fg,
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial',
      },
      wrap: { maxWidth: 980, margin: "0 auto", padding: "28px 18px 60px" },

      topNav: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        marginBottom: 14,
      },
      backLink: {
        color: fg,
        textDecoration: "underline",
        textUnderlineOffset: 3,
        fontWeight: 800,
        fontSize: 12,
      },
      brand: { fontWeight: 900, fontSize: 12, color: muted },

      card: {
        background: cardBg,
        border,
        borderRadius: 18,
        padding: 16,
        boxShadow: dark ? "none" : "0 6px 18px rgba(0,0,0,0.06)",
      },

      headerRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 12,
      },

      name: { fontSize: 22, fontWeight: 950, letterSpacing: -0.2, margin: 0 },
      listing: {
        marginTop: 6,
        fontSize: 12,
        fontWeight: 900,
        color: muted,
      },

      toggleBtn: {
        height: 34,
        padding: "0 10px",
        borderRadius: 10,
        border: dark ? "1px solid rgba(255,255,255,0.18)" : "1px solid #e5e5e5",
        background: dark ? "rgba(255,255,255,0.06)" : "#fff",
        color: fg,
        fontWeight: 900,
        cursor: "pointer",
        whiteSpace: "nowrap",
      },

      metaRow: {
        display: "flex",
        flexWrap: "wrap",
        gap: 10,
        marginTop: 12,
        color: muted,
        fontSize: 12,
        fontWeight: 700,
      },

      websiteLink: {
        color: fg,
        textDecoration: "underline",
        textUnderlineOffset: 3,
        fontWeight: 900,
      },

      sectionTitle: { marginTop: 18, marginBottom: 10, fontSize: 12, fontWeight: 950, color: muted },

      itemsGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        gap: 12,
      },

      itemCard: {
        border,
        borderRadius: 16,
        padding: 14,
        background: dark ? "rgba(255,255,255,0.03)" : "#fff",
      },

      itemNameRow: { display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 },
      itemName: { fontWeight: 950, fontSize: 14, margin: 0 },
      itemPrice: { fontWeight: 950, fontSize: 13, color: fg },

      itemDesc: { marginTop: 6, marginBottom: 10, color: muted, fontSize: 12, lineHeight: 1.3 },

      badgeRow: { display: "flex", flexWrap: "wrap", gap: 8 },

      empty: {
        marginTop: 12,
        padding: 12,
        borderRadius: 14,
        border,
        color: muted,
        fontSize: 12,
        fontWeight: 700,
      },
    };
  }, [dark]);

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.wrap}>
          <div style={styles.card}>Loading…</div>
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div style={styles.page}>
        <div style={styles.wrap}>
          <div style={styles.topNav}>
            <Link to="/" style={styles.backLink}>
              Back
            </Link>
            <div style={styles.brand}>Grubbid</div>
          </div>
          <div style={styles.card}>
            <div style={{ fontWeight: 950, marginBottom: 6 }}>Restaurant not found</div>
            <div style={{ opacity: 0.8, fontSize: 12 }}>{err}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.wrap}>
        <div style={styles.topNav}>
          <Link to="/" style={styles.backLink}>
            Back
          </Link>
          <div style={styles.brand}>Grubbid</div>
        </div>

        <div style={styles.card}>
          {/* Header row: name + toggle (toggle moved to where listing label used to live) */}
          <div style={styles.headerRow}>
            <div>
              <h1 style={styles.name}>{restaurant?.name || "Restaurant"}</h1>

              {/* Listing label moved to be close to the name */}
              <div style={styles.listing}>{listingLabel}</div>
            </div>

            <button type="button" style={styles.toggleBtn} onClick={() => setDark((v) => !v)}>
              {dark ? "Light" : "Dark"}
            </button>
          </div>

          {/* Meta info: city/cuisine/phone/website */}
          <div style={styles.metaRow}>
            {restaurant?.city ? <div>{restaurant.city}</div> : null}
            {restaurant?.cuisine ? <div>· {restaurant.cuisine}</div> : null}
            {restaurant?.phone ? <div>· {restaurant.phone}</div> : null}

            {websiteHref ? (
              <div>
                ·{" "}
                <a
                  href={websiteHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.websiteLink}
                >
                  {safeText(restaurant?.website)}
                </a>
              </div>
            ) : null}
          </div>

          {/* Menu items */}
          <div style={styles.sectionTitle}>Menu</div>

          {items.length ? (
            <div style={styles.itemsGrid}>
              {items.map((it) => {
                const b = it?.badges || {};
                return (
                  <div key={String(it?.id)} style={styles.itemCard}>
                    <div style={styles.itemNameRow}>
                      <p style={styles.itemName}>{it?.name}</p>
                      <div style={styles.itemPrice}>{it?.price || ""}</div>
                    </div>

                    {it?.description ? <div style={styles.itemDesc}>{it.description}</div> : null}

                    <div style={styles.badgeRow}>
                      <div style={badgeStyle(!!b.vegan, dark)}>Vegan</div>
                      <div style={badgeStyle(!!b.gluten_free, dark)}>Gluten-free</div>
                      <div style={badgeStyle(!!b.has_deal, dark)}>Deal</div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={styles.empty}>No menu items available yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}