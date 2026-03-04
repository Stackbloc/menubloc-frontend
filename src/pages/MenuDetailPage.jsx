/**
 * ============================================================
 * Path: menubloc-frontend/src/pages/MenuDetailPage.jsx
 * File: MenuDetailPage.jsx
 * Updated: 2026-03-03
 * Purpose:
 *   Menu detail page with two modes:
 *     - Menu Cards (from /menus/:id/mks-preview sections)
 *     - Raw Text (from /menus/:id menu_text)
 *   Fixes "Failed to fetch" UX and uses the correct backend field
 *   (menu.menu_text instead of menu.raw_text).
 * ============================================================
 */

import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

const API = (import.meta.env.VITE_API_URL || "http://localhost:3001").replace(/\/$/, "");

function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
}

function formatMoneyFromCents(priceCents) {
  const n = Number(priceCents);
  if (!Number.isFinite(n)) return "-";
  return `$${(n / 100).toFixed(2)}`;
}

export default function MenuDetailPage() {
  const { id } = useParams();
  const menuId = useMemo(() => String(id ?? "").trim(), [id]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [menu, setMenu] = useState(null);

  const [view, setView] = useState("cards"); // "cards" | "raw"
  const [compact, setCompact] = useState(false);

  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [preview, setPreview] = useState(null);

  // Load base menu
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      setMenu(null);
      setPreview(null);
      setPreviewError("");
      setPreviewLoading(false);

      if (!menuId) {
        setLoading(false);
        setError("Missing menu id.");
        return;
      }

      try {
        const res = await fetch(`${API}/menus/${encodeURIComponent(menuId)}`);
        const data = await res.json().catch(() => null);

        if (!res.ok) {
          const msg = data?.error || `Failed to fetch menu (${res.status})`;
          throw new Error(msg);
        }

        if (!cancelled) {
          setMenu(data?.menu || null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e?.message || "Failed to fetch menu");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [menuId]);

  // Load cards preview on demand
  useEffect(() => {
    let cancelled = false;

    async function loadPreview() {
      if (view !== "cards" || !menuId || preview || previewLoading) return;

      setPreviewLoading(true);
      setPreviewError("");

      try {
        const res = await fetch(`${API}/menus/${encodeURIComponent(menuId)}/mks-preview`);
        const data = await res.json().catch(() => null);

        if (!res.ok) {
          const msg = data?.error || `Failed to fetch menu cards (${res.status})`;
          throw new Error(msg);
        }

        if (!cancelled) {
          setPreview(data || null);
        }
      } catch (e) {
        if (!cancelled) {
          setPreviewError(e?.message || "Failed to fetch menu cards");
        }
      } finally {
        if (!cancelled) {
          setPreviewLoading(false);
        }
      }
    }

    loadPreview();
    return () => {
      cancelled = true;
    };
  }, [view, menuId, preview, previewLoading]);

  const titleText =
    menu?.restaurant_name ||
    preview?.restaurant_name ||
    menu?.name ||
    preview?.name ||
    "Menu Detail";

  const createdAt = menu?.created_at || preview?.created_at || null;

  if (loading) {
    return <div style={{ padding: 20 }}>Loading menu detail…</div>;
  }

  if (error) {
    return (
      <div style={{ padding: 20 }}>
        <h1 style={{ marginTop: 0 }}>Menu Detail</h1>
        <p style={{ color: "#b00020" }}>{error}</p>
        <Link to="/">Back home</Link>
      </div>
    );
  }

  const sections = Array.isArray(preview?.sections) ? preview.sections : [];

  return (
    <div style={{ padding: 22, maxWidth: 980, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
        <div>
          <h1 style={{ margin: "0 0 6px 0", fontSize: 40, lineHeight: 1.05 }}>{titleText}</h1>
          <div style={{ color: "#444", fontSize: 14 }}>
            <span style={{ marginRight: 10 }}>
              <strong>Menu ID:</strong> {menuId || "-"}
            </span>
            <span>
              <strong>Created:</strong> {formatDate(createdAt)}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button
            type="button"
            onClick={() => setCompact((v) => !v)}
            style={{
              padding: "8px 12px",
              borderRadius: 10,
              border: "1px solid #ddd",
              background: compact ? "#111" : "#fff",
              color: compact ? "#fff" : "#111",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            {compact ? "Comfort" : "Compact"}
          </button>

          <Link to="/" style={{ textDecoration: "none", fontWeight: 600 }}>
            Back
          </Link>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <button
          type="button"
          onClick={() => setView("cards")}
          style={{
            padding: "8px 12px",
            borderRadius: 10,
            border: "1px solid #ddd",
            background: view === "cards" ? "#111" : "#fff",
            color: view === "cards" ? "#fff" : "#111",
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          Menu Cards
        </button>
        <button
          type="button"
          onClick={() => setView("raw")}
          style={{
            padding: "8px 12px",
            borderRadius: 10,
            border: "1px solid #ddd",
            background: view === "raw" ? "#111" : "#fff",
            color: view === "raw" ? "#fff" : "#111",
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          Raw Text
        </button>
      </div>

      {view === "raw" ? (
        <pre
          style={{
            marginTop: 14,
            padding: 14,
            border: "1px solid #eee",
            borderRadius: 12,
            background: "#fafafa",
            whiteSpace: "pre-wrap",
            lineHeight: 1.35,
            maxHeight: "65vh",
            overflow: "auto",
          }}
        >
          {menu?.menu_text || "(No menu text on this menu yet.)"}
        </pre>
      ) : (
        <div style={{ marginTop: 14 }}>
          {previewLoading && (
            <div
              style={{
                padding: 14,
                border: "1px solid #eee",
                borderRadius: 12,
                background: "#fafafa",
              }}
            >
              Loading menu cards…
            </div>
          )}

          {!previewLoading && previewError && (
            <div
              style={{
                padding: 14,
                border: "1px solid #ffd7d7",
                borderRadius: 12,
                background: "#fff5f5",
                color: "#b00020",
                fontWeight: 600,
              }}
            >
              {previewError}
              <div style={{ marginTop: 8, color: "#555", fontWeight: 400 }}>
                If this is a CORS/port issue, your backend must allow your current Vite port.
              </div>
            </div>
          )}

          {!previewLoading && !previewError && sections.length === 0 && (
            <div
              style={{
                padding: 14,
                border: "1px solid #eee",
                borderRadius: 12,
                background: "#fafafa",
              }}
            >
              No cards yet. (No sections/items returned.)
            </div>
          )}

          {!previewLoading && !previewError && sections.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: compact ? "1fr" : "repeat(2, minmax(0, 1fr))",
                gap: compact ? 10 : 14,
              }}
            >
              {sections.map((section, sectionIdx) => (
                <div
                  key={`${section?.title || "section"}-${sectionIdx}`}
                  style={{
                    border: "1px solid #eee",
                    borderRadius: 14,
                    background: "#fff",
                    padding: compact ? 12 : 16,
                    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline" }}>
                    <h3 style={{ margin: 0, fontSize: compact ? 16 : 18 }}>
                      {section?.title || "Menu"}
                    </h3>
                    <div style={{ fontSize: 12, color: "#666" }}>
                      {Array.isArray(section?.items) ? section.items.length : 0} items
                    </div>
                  </div>

                  <div style={{ marginTop: 10 }}>
                    {Array.isArray(section?.items) &&
                      section.items.map((item, itemIdx) => {
                        const price =
                          item?.price ||
                          (typeof item?.price_cents === "number" ? formatMoneyFromCents(item.price_cents) : "-");

                        return (
                          <div
                            key={`${item?.id || item?.name || "item"}-${itemIdx}`}
                            style={{
                              padding: compact ? "8px 0" : "10px 0",
                              borderTop: itemIdx === 0 ? "none" : "1px solid #f1f1f1",
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                              <div style={{ fontWeight: 650 }}>{item?.name || "-"}</div>
                              <div style={{ fontWeight: 750 }}>{price}</div>
                            </div>
                            {item?.notes ? (
                              <div style={{ marginTop: 4, fontSize: 13, color: "#555", lineHeight: 1.3 }}>
                                {item.notes}
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}