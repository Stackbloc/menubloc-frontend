/**
 * ============================================================
 * File: MenuPage.jsx
 * Path: menubloc-frontend/src/pages/MenuPage.jsx
 * Date: 2026-03-13
 * Purpose:
 *   Public menu page wrapper.
 *
 *   Mobile-safe revision:
 *   - cleaner loading/error states on phones
 *   - no horizontal overflow
 *   - keeps GrubbidMenuView as the live menu renderer
 * ============================================================
 */

import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { HomeButton } from "../components/NavButton.jsx";
import GrubbidMenuView from "../GrubbidMenuView.jsx";

const API = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001").replace(/\/$/, "");

function safeText(v) {
  return String(v ?? "").trim();
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

export default function MenuPage() {
  const { restaurantId } = useParams();
  const { search } = useLocation();
  const rid = safeText(restaurantId);
  const isMobile = useIsMobile();
  const urlParams = useMemo(() => new URLSearchParams(search), [search]);
  const urlCity = urlParams.get("city") || "";
  const urlState = urlParams.get("state") || "";
  const urlLat = urlParams.get("lat") ? parseFloat(urlParams.get("lat")) : null;
  const urlLng = urlParams.get("lng") ? parseFloat(urlParams.get("lng")) : null;

  const [loading, setLoading] = useState(true);
  const [menuData, setMenuData] = useState(null);
  const [err, setErr] = useState("");
  const [userLat, setUserLat] = useState(urlLat);
  const [userLng, setUserLng] = useState(urlLng);

  useEffect(() => {
    if (urlLat != null && urlLng != null) return;
    if (!navigator.geolocation) return;

    let cancelled = false;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (cancelled) return;
        const lat = Number(pos.coords?.latitude);
        const lng = Number(pos.coords?.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
        setUserLat(lat);
        setUserLng(lng);
      },
      () => {},
      { timeout: 8000, maximumAge: 300000 }
    );

    return () => {
      cancelled = true;
    };
  }, [urlLat, urlLng]);

  const apiUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (urlCity) params.set("city", urlCity);
    if (urlState) params.set("state", urlState);
    if (userLat != null && userLng != null) {
      params.set("lat", String(userLat));
      params.set("lng", String(userLng));
    }
    const qs = params.toString();
    return `${API}/public/restaurants/${encodeURIComponent(rid)}/menu${qs ? `?${qs}` : ""}`;
  }, [rid, urlCity, urlState, userLat, userLng]);

  useEffect(() => {
    let alive = true;

    async function run() {
      setLoading(true);
      setErr("");
      setMenuData(null);

      try {
        const res = await fetch(apiUrl, { credentials: "include" });

        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(`HTTP ${res.status} ${txt}`.trim());
        }

        const json = await res.json();
        if (!alive) return;
        setMenuData(json);
      } catch (e) {
        if (!alive) return;
        setErr(e?.message || "Failed to load menu.");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    if (rid) {
      run();
    } else {
      setLoading(false);
      setErr("Missing restaurant id.");
    }

    return () => {
      alive = false;
    };
  }, [apiUrl, rid]);

  const shellStyle = {
    minHeight: "100vh",
    background: "#0B0F0C",
    color: "#FFFFFF",
    padding: isMobile ? 14 : 20,
    boxSizing: "border-box",
    overflowX: "hidden",
  };

  const innerStyle = {
    maxWidth: 980,
    margin: "0 auto",
    width: "100%",
    minWidth: 0,
  };

  if (loading) {
    return (
      <div style={shellStyle}>
        <div style={innerStyle}>
          <div
            style={{
              fontSize: isMobile ? 15 : 16,
              fontWeight: 700,
              color: "#9CA3AF",
              lineHeight: 1.4,
            }}
          >
            Loading menu…
          </div>
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div style={shellStyle}>
        <div style={innerStyle}>
          <div
            style={{
              padding: isMobile ? 14 : 18,
              border: "1px solid #f1d0d0",
              borderRadius: 14,
              background: "rgba(239,68,68,0.08)",
              wordBreak: "break-word",
            }}
          >
            <div
              style={{
                fontWeight: 900,
                fontSize: isMobile ? 18 : 20,
                lineHeight: 1.2,
                color: "#FFFFFF",
              }}
            >
              Menu unavailable
            </div>

            <div
              style={{
                marginTop: 8,
                color: "#9CA3AF",
                lineHeight: 1.45,
                fontSize: isMobile ? 14 : 15,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {err}
            </div>

            <div style={{ marginTop: 16 }}>
              <HomeButton />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={shellStyle}>
      <div style={innerStyle}>
        <GrubbidMenuView restaurantId={rid || null} menuData={menuData} />
      </div>
    </div>
  );
}
