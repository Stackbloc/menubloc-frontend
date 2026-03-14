/**
 * ============================================================
 * Path: menubloc-frontend/src/pages/FoodTruckSchedulePage.jsx
 * File: FoodTruckSchedulePage.jsx
 * Date: 2026-03-13
 * Purpose:
 *   Full schedule page for a food truck.
 *   React route: /foodtrucks/:slugOrId/schedule
 *
 *   Mobile-safe revision:
 *   - tighter phone spacing
 *   - no horizontal overflow
 *   - schedule entries stack cleanly on small screens
 *   - header/nav wraps better on narrow screens
 * ============================================================
 */

import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { HomeButton } from "../components/NavButton.jsx";

const API = (import.meta.env.VITE_API_URL || "http://localhost:3001").replace(/\/$/, "");
const THEME_KEY = "grubbid_theme";

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

function asStr(v) {
  return v === undefined || v === null ? "" : String(v);
}

function firstNonEmpty(...values) {
  for (const v of values) {
    const s = asStr(v).trim();
    if (s) return s;
  }
  return "";
}

function getColors(isDark) {
  return {
    pageBg: isDark ? "var(--bg, #0b0b0f)" : "var(--bg, #f5f4ef)",
    pageColor: isDark ? "#e2e8f0" : "#0f172a",
    muted: isDark ? "rgba(255,255,255,0.45)" : "#64748b",
    cardBg: isDark ? "#111218" : "#ffffff",
    cardBorder: isDark ? "rgba(255,255,255,0.08)" : "#e4e9f0",
    divider: isDark ? "rgba(255,255,255,0.07)" : "#eef2f7",
    sectionLabel: isDark ? "rgba(255,255,255,0.35)" : "#94a3b8",
    amberAccent: isDark ? "#fbbf24" : "#d97706",
    amberBg: isDark ? "rgba(245,158,11,0.08)" : "#fffbeb",
    amberBorder: isDark ? "rgba(245,158,11,0.25)" : "#fde68a",
    linkColor: isDark ? "#93c5fd" : "#1d4ed8",
  };
}

function Skel({ w = 160, h = 14, isDark }) {
  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: 6,
        background: isDark ? "rgba(255,255,255,0.08)" : "#e9eef5",
      }}
    />
  );
}

export default function FoodTruckSchedulePage() {
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

  useEffect(() => {
    saveTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (!slugOrId) return;
    let cancelled = false;

    async function run() {
      setProfileState({ status: "loading", data: null, error: null });
      try {
        const res = await fetch(`${API}/public/restaurants/${encodeURIComponent(slugOrId)}`);
        const json = await res.json().catch(() => null);
        if (cancelled) return;

        if (!res.ok || !json) {
          setProfileState({
            status: "error",
            data: null,
            error: json?.error || `Request failed (${res.status})`,
          });
          return;
        }

        setProfileState({
          status: "ok",
          data: json?.restaurant || json,
          error: null,
        });
      } catch (e) {
        if (!cancelled) {
          setProfileState({
            status: "error",
            data: null,
            error: e?.message || String(e),
          });
        }
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [slugOrId]);

  const profile = profileState.data;
  const name = firstNonEmpty(profile?.restaurant_name, profile?.name) || `Food Truck ${slugOrId}`;

  const raw = profile?.schedule || profile?.scheduled_locations;
  const entries = Array.isArray(raw) ? raw.filter(Boolean) : [];

  const pageStyle = {
    minHeight: "100vh",
    background: c.pageBg,
    color: c.pageColor,
    fontFamily: "var(--font-ui, ui-sans-serif, system-ui, sans-serif)",
    padding: isMobile ? "14px 12px 40px" : "20px 16px 72px",
    overflowX: "hidden",
    boxSizing: "border-box",
  };

  if (profileState.status === "loading") {
    return (
      <div style={pageStyle}>
        <div style={{ maxWidth: 600, margin: "0 auto", width: "100%", minWidth: 0 }}>
          <div style={{ marginBottom: 20 }}>
            <HomeButton />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Skel w={180} h={28} isDark={isDark} />
            <Skel w={120} h={14} isDark={isDark} />
            {[1, 2, 3, 4, 5].map((i) => (
              <Skel key={i} w="100%" h={64} isDark={isDark} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (profileState.status === "error") {
    return (
      <div style={pageStyle}>
        <div style={{ maxWidth: 600, margin: "0 auto", width: "100%", minWidth: 0 }}>
          <div style={{ marginBottom: 16 }}>
            <HomeButton />
          </div>
          <div
            style={{
              padding: "14px 16px",
              borderRadius: 12,
              background: isDark ? "rgba(248,113,113,0.07)" : "#fff5f5",
              border: isDark ? "1px solid rgba(248,113,113,0.25)" : "1px solid #fca5a5",
              color: isDark ? "#fca5a5" : "#b91c1c",
              fontSize: 14,
              fontWeight: 600,
              lineHeight: 1.45,
              wordBreak: "break-word",
            }}
          >
            {profileState.error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={{ maxWidth: 600, margin: "0 auto", width: "100%", minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: isMobile ? "flex-start" : "center",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 20,
          }}
        >
          <HomeButton />
          <button
            type="button"
            onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
            style={{
              height: 28,
              padding: "0 12px",
              fontSize: 11,
              fontWeight: 700,
              borderRadius: 8,
              border: isDark ? "1px solid rgba(255,255,255,0.15)" : "1px solid #cbd5e1",
              background: "transparent",
              color: c.muted,
              cursor: "pointer",
              flexShrink: 0,
            }}
            aria-label="Toggle theme"
          >
            {isDark ? "Light" : "Dark"}
          </button>
        </div>

        <div style={{ marginBottom: 20 }}>
          <Link
            to={`/foodtrucks/${slugOrId}`}
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: c.amberAccent,
              textDecoration: "none",
              lineHeight: 1.4,
              wordBreak: "break-word",
            }}
          >
            ← Back to {name}
          </Link>
        </div>

        <div style={{ marginBottom: isMobile ? 20 : 24 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 0.8,
              textTransform: "uppercase",
              color: c.amberAccent,
              marginBottom: 6,
            }}
          >
            Food Truck
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: isMobile ? 24 : 26,
              fontWeight: 900,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              color: isDark ? "#f8fafc" : "#0f172a",
              wordBreak: "break-word",
            }}
          >
            {name}
          </h1>
          <div
            style={{
              marginTop: 4,
              fontSize: isMobile ? 13 : 14,
              fontWeight: 600,
              color: c.muted,
            }}
          >
            Full Schedule
          </div>
        </div>

        {entries.length === 0 ? (
          <div
            style={{
              fontSize: 14,
              color: c.muted,
              fontStyle: "italic",
              padding: "24px 0",
            }}
          >
            No upcoming appearances scheduled yet.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {entries.map((entry, idx) => {
              const day = firstNonEmpty(entry?.day, entry?.date);
              const event = firstNonEmpty(entry?.event, entry?.name);
              const location = firstNonEmpty(entry?.location, entry?.address, entry?.place);
              const time = firstNonEmpty(entry?.time, entry?.time_window, entry?.hours);

              return (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    flexDirection: isMobile ? "column" : "row",
                    alignItems: isMobile ? "stretch" : "flex-start",
                    gap: isMobile ? 6 : 14,
                    padding: isMobile ? "12px 13px" : "14px 16px",
                    borderRadius: 14,
                    background: c.cardBg,
                    border: `1px solid ${c.cardBorder}`,
                    boxSizing: "border-box",
                  }}
                >
                  {day ? (
                    <div style={{ flexShrink: 0, minWidth: isMobile ? 0 : 80 }}>
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          letterSpacing: 0.4,
                          textTransform: "uppercase",
                          color: c.amberAccent,
                          lineHeight: 1.3,
                        }}
                      >
                        {day}
                      </div>
                    </div>
                  ) : null}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    {event ? (
                      <div
                        style={{
                          fontSize: isMobile ? 14 : 15,
                          fontWeight: 800,
                          color: isDark ? "#f1f5f9" : "#0f172a",
                          lineHeight: 1.25,
                          marginBottom: 2,
                          wordBreak: "break-word",
                        }}
                      >
                        {event}
                      </div>
                    ) : null}
                    {location ? (
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: event ? 500 : 700,
                          color: event ? c.muted : isDark ? "#f1f5f9" : "#0f172a",
                          lineHeight: 1.35,
                          wordBreak: "break-word",
                        }}
                      >
                        {location}
                      </div>
                    ) : null}
                    {time ? (
                      <div
                        style={{
                          fontSize: 12,
                          color: c.muted,
                          marginTop: 3,
                          lineHeight: 1.4,
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
        )}
      </div>
    </div>
  );
}