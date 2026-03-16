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

import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { HomeButton } from "../components/NavButton.jsx";
import GrubbidMenuView from "../GrubbidMenuView.jsx";

const API = (import.meta.env.VITE_API_URL || "http://localhost:3001").replace(/\/$/, "");

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
  const rid = safeText(restaurantId);
  const isMobile = useIsMobile();

  const [loading, setLoading] = useState(true);
  const [menuData, setMenuData] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;

    async function run() {
      setLoading(true);
      setErr("");
      setMenuData(null);

      try {
        const res = await fetch(
          `${API}/public/restaurants/${encodeURIComponent(rid)}/menu`,
          { credentials: "include" }
        );

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
  }, [rid]);

  const shellStyle = {
    minHeight: "100vh",
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
              color: "#334155",
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
              background: "#fff7f7",
              wordBreak: "break-word",
            }}
          >
            <div
              style={{
                fontWeight: 900,
                fontSize: isMobile ? 18 : 20,
                lineHeight: 1.2,
                color: "#111827",
              }}
            >
              Menu unavailable
            </div>

            <div
              style={{
                marginTop: 8,
                color: "#666",
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