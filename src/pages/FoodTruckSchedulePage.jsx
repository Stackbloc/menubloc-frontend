/**
 * Full schedule page for a food truck.
 * Route: /foodtrucks/:slugOrId/schedule
 * Light editorial colors (matches FoodTruckPage) — no dark-theme contrast bug.
 */
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import StickyPageHeader from "../components/StickyPageHeader.jsx";
import { toConsumerErrorMessage } from "../lib/api.js";
import BottomNav from "../components/BottomNav.jsx";

const API = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001").replace(/\/$/, "");

const COLORS = {
  pageBg: "#fafaf9",
  pageColor: "#1c1917",
  muted: "#78716c",
  cardBg: "#ffffff",
  cardBorder: "#e7e5e4",
  accent: "#166534",
  link: "#166534",
};

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

function Skel({ w = 160, h = 14 }) {
  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: 6,
        background: "#e7e5e4",
      }}
    />
  );
}

export default function FoodTruckSchedulePage() {
  const { slugOrId } = useParams();
  const isMobile = useIsMobile();

  const [profileState, setProfileState] = useState({
    status: "loading",
    data: null,
    error: null,
  });

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
            error: toConsumerErrorMessage(
              json?.error || `Request failed (${res.status})`,
              "We couldn’t load this restaurant right now. Please try again in a moment."
            ),
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
            error: toConsumerErrorMessage(
              e,
              "We couldn’t load this restaurant right now. Please try again in a moment."
            ),
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
    background: COLORS.pageBg,
    color: COLORS.pageColor,
    fontFamily: "var(--font-ui, ui-sans-serif, system-ui, sans-serif)",
    padding: isMobile ? "14px 16px 80px" : "20px 28px 100px",
    overflowX: "hidden",
    boxSizing: "border-box",
  };

  if (profileState.status === "loading") {
    return (
      <>
        <StickyPageHeader />
        <div style={pageStyle}>
          <div style={{ maxWidth: 640, margin: "0 auto", width: "100%", minWidth: 0 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Skel w={180} h={28} />
              <Skel w={120} h={14} />
              {[1, 2, 3, 4, 5].map((i) => (
                <Skel key={i} w="100%" h={64} />
              ))}
            </div>
          </div>
        </div>
        <BottomNav />
      </>
    );
  }

  if (profileState.status === "error") {
    return (
      <>
        <StickyPageHeader />
        <div style={pageStyle}>
          <div style={{ maxWidth: 640, margin: "0 auto", width: "100%", minWidth: 0 }}>
            <div
              style={{
                padding: "14px 16px",
                borderRadius: 12,
                background: "#fff5f5",
                border: "1px solid #fca5a5",
                color: "#b91c1c",
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
        <BottomNav />
      </>
    );
  }

  return (
    <>
      <StickyPageHeader />
      <div style={pageStyle} data-testid="food-truck-schedule-page">
        <div style={{ maxWidth: 640, margin: "0 auto", width: "100%", minWidth: 0 }}>
          <div style={{ marginBottom: 20 }}>
            <Link
              to={`/foodtrucks/${slugOrId}`}
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: COLORS.link,
                textDecoration: "none",
                lineHeight: 1.4,
                wordBreak: "break-word",
              }}
            >
              ← Back to {name}
            </Link>
          </div>

          <div style={{ marginBottom: isMobile ? 20 : 24 }}>
            <h1
              style={{
                margin: 0,
                fontSize: isMobile ? 24 : 28,
                fontWeight: 800,
                lineHeight: 1.15,
                letterSpacing: "-0.02em",
                color: COLORS.pageColor,
                wordBreak: "break-word",
              }}
            >
              {name}
            </h1>
            <div
              style={{
                marginTop: 6,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 0.7,
                textTransform: "uppercase",
                color: COLORS.muted,
              }}
            >
              Full schedule
            </div>
          </div>

          {entries.length === 0 ? (
            <div
              style={{
                padding: "28px 18px",
                borderRadius: 14,
                background: COLORS.cardBg,
                border: `1px solid ${COLORS.cardBorder}`,
                fontSize: 15,
                color: COLORS.muted,
                lineHeight: 1.55,
              }}
            >
              No upcoming appearances scheduled yet. Check back later, or return to the profile for
              the latest location.
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
                      background: COLORS.cardBg,
                      border: `1px solid ${COLORS.cardBorder}`,
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
                            color: COLORS.accent,
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
                            color: COLORS.pageColor,
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
                            color: event ? COLORS.muted : COLORS.pageColor,
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
                            color: COLORS.muted,
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
      <BottomNav />
    </>
  );
}
