/**
 * ============================================================
 * Path: menubloc-frontend/src/pages/StackblocLanding.jsx
 * File: StackblocLanding.jsx
 * Date: 2026-05-15
 * Purpose:
 *   Simple HTML-first corporate homepage for stackbloc.com.
 *   Mirrors the lightweight host-routed pattern used for
 *   easymenuupload.com without adding app-level complexity.
 * ============================================================
 */

import React, { useEffect, useState } from "react";

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

export default function StackblocLanding() {
  const isMobile = useIsMobile();

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f7fa",
        color: "#16202a",
        fontFamily: "Arial, Helvetica, sans-serif",
        lineHeight: 1.6,
        overflowX: "hidden",
      }}
    >
      <div
        style={{
          maxWidth: "980px",
          margin: "0 auto",
          padding: isMobile ? "18px 16px 40px" : "28px 20px 72px",
          boxSizing: "border-box",
        }}
      >
        <header
          style={{
            padding: isMobile ? "6px 0 28px" : "10px 0 44px",
          }}
        >
          <div
            style={{
              fontSize: isMobile ? 18 : 20,
              fontWeight: 700,
              letterSpacing: "0.02em",
            }}
          >
            Stackbloc Corp
          </div>
        </header>

        <section
          style={{
            background: "#ffffff",
            border: "1px solid #d9e0e7",
            borderRadius: 18,
            padding: isMobile ? "24px 20px" : "44px 48px",
            boxShadow: "0 12px 30px rgba(15, 23, 42, 0.05)",
          }}
        >
          <h1
            style={{
              margin: "0 0 20px",
              fontSize: isMobile ? 34 : 48,
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              fontWeight: 700,
            }}
          >
            Stackbloc Corp
          </h1>

          <p
            style={{
              margin: "0 0 18px",
              fontSize: isMobile ? 17 : 20,
              color: "#3b4754",
              maxWidth: 760,
            }}
          >
            Stackbloc Corp develops software applications and digital products focused on commerce,
            information, and online platforms.
          </p>

          <p
            style={{
              margin: 0,
              fontSize: isMobile ? 16 : 18,
              color: "#4d5a67",
              maxWidth: 760,
            }}
          >
            Menuply is our first product, designed to help restaurants share menus, connect with
            diners, and provide richer menu and engagement experiences for both restaurants and
            customers.
          </p>
        </section>
      </div>
    </main>
  );
}
