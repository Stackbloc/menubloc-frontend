/**
 * ============================================================
 * File: MenuItemProfile.jsx
 * Path: menubloc-frontend/src/pages/MenuItemProfile.jsx
 * Date: 2026-03-13
 * Purpose:
 *   Placeholder menu item profile page.
 *
 *   Mobile-safe revision:
 *   - header actions stack on small screens
 *   - no horizontal overflow
 *   - larger tap targets for mobile
 *   - improved wrapping for long values
 * ============================================================
 */

import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

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

export default function MenuItemProfile() {
  const { restaurantId, menuItemId } = useParams();
  const isMobile = useIsMobile();

  const rid = useMemo(() => String(restaurantId || "").trim(), [restaurantId]);
  const mid = useMemo(() => String(menuItemId || "").trim(), [menuItemId]);

  const styles = {
    page: {
      padding: isMobile ? 14 : 20,
      maxWidth: 900,
      width: "100%",
      boxSizing: "border-box",
      margin: "0 auto",
      overflowX: "hidden",
    },

    header: {
      display: "flex",
      flexDirection: isMobile ? "column" : "row",
      justifyContent: "space-between",
      alignItems: isMobile ? "flex-start" : "center",
      gap: isMobile ? 14 : 16,
      marginBottom: 6,
    },

    title: {
      margin: 0,
      fontSize: isMobile ? 24 : 28,
      lineHeight: 1.2,
      wordBreak: "break-word",
    },

    titleSub: {
      color: "#666",
      fontSize: isMobile ? 13 : 14,
      fontWeight: 500,
      marginLeft: 6,
    },

    actions: {
      display: "flex",
      flexDirection: isMobile ? "column" : "row",
      gap: 12,
      width: isMobile ? "100%" : "auto",
    },

    actionLink: {
      fontWeight: 900,
      textDecoration: "underline",
      color: "#111",
      textUnderlineOffset: "3px",
      wordBreak: "break-word",
      padding: isMobile ? "10px 0" : 0,
      display: "inline-block",
    },

    panel: {
      marginTop: 16,
      padding: isMobile ? 14 : 16,
      borderRadius: 12,
      border: "1px solid #eee",
      background: "#fafafa",
      lineHeight: 1.5,
      wordBreak: "break-word",
      fontSize: isMobile ? 14 : 15,
    },
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h2 style={styles.title}>
          Item #{mid}
          <span style={styles.titleSub}>
            (Restaurant #{rid})
          </span>
        </h2>

        <div style={styles.actions}>
          <Link to={`/r/${rid}`} style={styles.actionLink}>
            Restaurant
          </Link>

          <Link to="/discover" style={styles.actionLink}>
            Back to search
          </Link>
        </div>
      </div>

      <div style={styles.panel}>
        This is a placeholder page.  
        Next step is to add backend endpoint:{" "}
        <b>GET /menu-items/:id</b>.
      </div>
    </div>
  );
}