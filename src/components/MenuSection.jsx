/**
 * ============================================================
 * File: MenuSection.jsx
 * Path: menubloc-frontend/src/components/MenuSection.jsx
 * Date: 2026-03-13
 * Purpose:
 *   Renders a menu section and its menu item cards.
 *
 *   Mobile-safe revision:
 *   - section header wraps safely on small screens
 *   - long section titles do not overflow
 *   - item count remains readable
 *   - safer spacing and overflow handling
 * ============================================================
 */

import React, { useEffect, useState } from "react";
import MenuCard from "./MenuCard";

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

export default function MenuSection({ section, compact = false }) {
  const isMobile = useIsMobile();

  const title = section?.title || section?.name || "Menu";
  const items = Array.isArray(section?.items) ? section.items : [];

  return (
    <section
      style={{
        border: "1px solid #dce4f2",
        borderRadius: 16,
        background: "#fbfdff",
        padding: compact ? (isMobile ? 10 : 12) : (isMobile ? 14 : 16),
        boxShadow: "0 4px 16px rgba(27, 47, 84, 0.06)",
        overflowX: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          justifyContent: "space-between",
          alignItems: isMobile ? "flex-start" : "baseline",
          gap: isMobile ? 4 : 10,
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: compact ? (isMobile ? 16 : 17) : (isMobile ? 18 : 20),
            lineHeight: 1.2,
            wordBreak: "break-word",
          }}
        >
          {title}
        </h3>

        <span
          style={{
            color: "#5a6882",
            fontSize: 12,
            fontWeight: 700,
            whiteSpace: isMobile ? "normal" : "nowrap",
            wordBreak: "break-word",
          }}
        >
          {items.length} {items.length === 1 ? "item" : "items"}
        </span>
      </div>

      {items.length === 0 ? (
        <div
          style={{
            marginTop: 10,
            border: "1px dashed #cfdae9",
            borderRadius: 12,
            padding: "10px 12px",
            color: "#6d7a93",
            fontSize: 13,
            lineHeight: 1.4,
            wordBreak: "break-word",
          }}
        >
          No menu items in this section.
        </div>
      ) : (
        <div
          style={{
            marginTop: 10,
            display: "grid",
            gap: compact ? 8 : 10,
            minWidth: 0,
          }}
        >
          {items.map((item, idx) => (
            <MenuCard
              key={`${item?.id || item?.name || "item"}-${idx}`}
              item={item}
              compact={compact}
            />
          ))}
        </div>
      )}
    </section>
  );
}