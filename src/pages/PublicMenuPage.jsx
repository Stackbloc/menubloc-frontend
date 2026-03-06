/**
 * ============================================================
 * File: PublicMenuPage.jsx
 * Path: menubloc-frontend/src/pages/PublicMenuPage.jsx
 * Date: 2026-03-05
 * Purpose:
 *   Renders the public menu for a restaurant using backend endpoint:
 *     GET http://localhost:3001/public/restaurants/:id/menu
 *
 *   Minimal, reliable "working website today" implementation:
 *   - Shows restaurant name + address line
 *   - Renders sections and items
 *   - Handles loading/error states cleanly
 * ============================================================
 */

import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";

function asStr(v) {
  return v === undefined || v === null ? "" : String(v);
}

function fmtMoney(price) {
  const s = asStr(price).trim();
  if (!s) return "";
  // backend already returns "$12.00" style for public menu items
  return s;
}

export default function PublicMenuPage() {
  const { id } = useParams();

  const [state, setState] = useState({
    status: "loading", // loading | ok | error
    data: null,
    error: null,
  });

  const apiUrl = useMemo(() => {
    const rid = encodeURIComponent(asStr(id).trim());
    return `http://localhost:3001/public/restaurants/${rid}/menu`;
  }, [id]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        setState({ status: "loading", data: null, error: null });

        const res = await fetch(apiUrl);
        const json = await res.json().catch(() => null);

        if (cancelled) return;

        if (!res.ok || !json || json.ok !== true) {
          const msg =
            json?.detail ||
            json?.error ||
            `Request failed (${res.status})`;
          setState({ status: "error", data: null, error: msg });
          return;
        }

        setState({ status: "ok", data: json, error: null });
      } catch (e) {
        if (cancelled) return;
        setState({ status: "error", data: null, error: e?.message || String(e) });
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [apiUrl]);

  const wrap = {
    maxWidth: 980,
    margin: "0 auto",
    padding: "22px 16px 60px",
    fontFamily: "var(--font-ui)",
    color: "var(--ink, #0f1720)",
  };

  if (state.status === "loading") {
    return (
      <div style={wrap}>
        <div style={{ fontSize: 14, color: "var(--muted, #5b6675)" }}>
          Loading menu…
        </div>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div style={wrap}>
        <div style={{ marginBottom: 10 }}>
          <Link to="/" style={{ color: "var(--link, #124ba3)", textDecoration: "none", fontWeight: 700 }}>
            ← Back to search
          </Link>
        </div>

        <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 8 }}>
          Couldn’t load menu
        </div>
        <div style={{ color: "var(--muted, #5b6675)", fontSize: 14 }}>
          {state.error}
        </div>

        <div style={{ marginTop: 14, fontSize: 12, color: "var(--muted-2, #93a0b2)" }}>
          Endpoint: {apiUrl}
        </div>
      </div>
    );
  }

  const data = state.data;

  const restaurantName = asStr(data?.restaurant_name || data?.name || `Restaurant ${id}`).trim();
  const addressLine = asStr(data?.address_line).trim();

  const sections = Array.isArray(data?.sections) ? data.sections : [];

  return (
    <div style={wrap}>
      <div style={{ marginBottom: 14 }}>
        <Link to="/" style={{ color: "var(--link, #124ba3)", textDecoration: "none", fontWeight: 700 }}>
          ← Back to search
        </Link>
      </div>

      <div style={{ fontSize: 28, fontWeight: 950, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
        {restaurantName}
      </div>

      {addressLine ? (
        <div style={{ marginTop: 6, fontSize: 14, color: "var(--muted, #5b6675)" }}>
          {addressLine}
        </div>
      ) : null}

      <div style={{ marginTop: 18 }}>
        {sections.length === 0 ? (
          <div style={{ fontSize: 14, color: "var(--muted, #5b6675)" }}>
            No menu sections yet.
          </div>
        ) : (
          sections.map((sec, sIdx) => {
            const title = asStr(sec?.title || "Menu").trim();
            const items = Array.isArray(sec?.items) ? sec.items : [];
            return (
              <div key={`${title}-${sIdx}`} style={{ marginTop: sIdx === 0 ? 0 : 18 }}>
                <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 8 }}>
                  {title}
                </div>

                <div
                  style={{
                    border: "1px solid var(--border, #e4e9f0)",
                    borderRadius: 14,
                    background: "#fff",
                    overflow: "hidden",
                  }}
                >
                  {items.map((it, iIdx) => {
                    const name = asStr(it?.name || "Item").trim();
                    const desc = asStr(it?.description || it?.notes || "").trim();
                    const price = fmtMoney(it?.price);

                    return (
                      <div
                        key={`${it?.id || name}-${iIdx}`}
                        style={{
                          padding: "12px 14px",
                          borderTop: iIdx === 0 ? "none" : "1px solid var(--border, #e4e9f0)",
                          display: "flex",
                          gap: 12,
                          alignItems: "flex-start",
                          justifyContent: "space-between",
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 15, fontWeight: 850, lineHeight: 1.2 }}>
                            {name}
                          </div>
                          {desc ? (
                            <div style={{ marginTop: 4, fontSize: 13, color: "var(--muted, #5b6675)", lineHeight: 1.35 }}>
                              {desc}
                            </div>
                          ) : null}
                        </div>

                        {price ? (
                          <div style={{ fontSize: 14, fontWeight: 900, whiteSpace: "nowrap" }}>
                            {price}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}