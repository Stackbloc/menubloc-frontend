/**
 * ============================================================
 * File: MenuHeader.jsx
 * Path: menubloc-frontend/src/components/MenuHeader.jsx
 * Date: 2026-03-13
 * Purpose:
 *   Menu header component for restaurant/menu pages.
 *
 *   Mobile-safe revision:
 *   - responsive hero height
 *   - responsive title sizing
 *   - safer wrapping for long restaurant names and subtext
 *   - improved mobile spacing
 * ============================================================
 */

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function nameOf(r) {
  return String(
    r?.restaurant_name ||
      r?.name ||
      r?.title ||
      r?.display_name ||
      "Restaurant"
  );
}

function subOf(r) {
  const cuisine = String(r?.cuisine || "").trim();
  const city = String(r?.city || "").trim();
  const state = String(r?.state || "").trim();
  const loc = [city, state].filter(Boolean).join(", ");
  return [cuisine, loc].filter(Boolean).join(" • ");
}

function heroOf(r) {
  return String(r?.hero_image_url || r?.heroImageUrl || "").trim();
}

function slugOf(r) {
  return String(r?.slug || r?.restaurant_slug || r?.public_slug || "").trim();
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

export default function MenuHeader({ restaurant }) {
  const isMobile = useIsMobile();

  const r = restaurant || {};
  const slug = slugOf(r);
  const hero = heroOf(r);
  const title = nameOf(r);
  const sub = subOf(r);

  return (
    <div style={{ width: "100%", background: "transparent", overflowX: "hidden" }}>
      {hero ? (
        <div
          style={{
            height: isMobile ? 132 : 180,
            backgroundImage: `url(${hero})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "brightness(0.65)",
          }}
        />
      ) : null}

      <div
        style={{
          padding: isMobile ? "14px 14px" : "16px 12px",
          maxWidth: 900,
          margin: "0 auto",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            fontSize: isMobile ? 24 : 28,
            fontWeight: 900,
            lineHeight: 1.12,
            wordBreak: "break-word",
          }}
        >
          {slug ? (
            <Link
              to={`/r/${slug}`}
              style={{
                color: "inherit",
                textDecoration: "none",
                wordBreak: "break-word",
              }}
              title="View public restaurant page"
            >
              {title}
            </Link>
          ) : (
            title
          )}
        </div>

        {sub ? (
          <div
            style={{
              marginTop: 6,
              opacity: 0.75,
              fontSize: isMobile ? 13 : 14,
              lineHeight: 1.35,
              wordBreak: "break-word",
            }}
          >
            {sub}
          </div>
        ) : null}
      </div>
    </div>
  );
}