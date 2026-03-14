/**
 * ============================================================
 * File: MenuDetailPage.jsx
 * Path: menubloc-frontend/src/pages/MenuDetailPage.jsx
 * Date: 2026-03-13
 * Purpose:
 *   Menu detail page showing parsed menu cards or raw menu text.
 *
 *   Mobile-safe revision:
 *   - header stacks on mobile
 *   - grid becomes single column on phones
 *   - larger tap targets
 *   - prevents horizontal overflow
 * ============================================================
 */

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { HomeButton } from "../components/NavButton.jsx";
import MenuSection from "../components/MenuSection";

const API = (import.meta.env.VITE_API_URL || "http://localhost:3001").replace(/\/$/, "");

function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
}

function useIsMobile(breakpoint = 768) {
  const [mobile, setMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth <= breakpoint;
  });

  useEffect(() => {
    function onResize() {
      setMobile(window.innerWidth <= breakpoint);
    }

    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);

  return mobile;
}

export default function MenuDetailPage() {
  const { id } = useParams();
  const isMobile = useIsMobile();

  const menuId = useMemo(() => String(id ?? "").trim(), [id]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [menu, setMenu] = useState(null);

  const [view, setView] = useState("cards");
  const [compact, setCompact] = useState(false);

  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadMenu() {
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
          throw new Error(data?.error || `Failed to fetch menu (${res.status})`);
        }

        if (!cancelled) {
          setMenu(data?.menu || null);
        }
      } catch (e) {
        if (!cancelled) setError(e?.message || "Failed to fetch menu");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadMenu();
    return () => {
      cancelled = true;
    };
  }, [menuId]);

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
          throw new Error(data?.error || `Failed to fetch menu cards (${res.status})`);
        }

        if (!cancelled) setPreview(data || null);
      } catch (e) {
        if (!cancelled) setPreviewError(e?.message || "Failed to fetch menu cards");
      } finally {
        if (!cancelled) setPreviewLoading(false);
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
  const sections = Array.isArray(preview?.sections) ? preview.sections : [];

  if (loading) {
    return <div style={{ padding: 20 }}>Loading menu detail…</div>;
  }

  if (error) {
    return (
      <div style={{ padding: 20 }}>
        <h1 style={{ marginTop: 0 }}>Menu Detail</h1>
        <p style={{ color: "#b00020" }}>{error}</p>
        <HomeButton />
      </div>
    );
  }

  return (
    <div
      style={{
        padding: isMobile ? 16 : 22,
        maxWidth: 980,
        margin: "0 auto",
        overflowX: "hidden",
      }}
    >
      <div style={{ marginBottom: 14 }}>
        <HomeButton />
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          justifyContent: "space-between",
          gap: 14,
          alignItems: isMobile ? "flex-start" : "center",
        }}
      >
        <div>
          <h1
            style={{
              margin: "0 0 6px 0",
              fontSize: isMobile ? 28 : 40,
              lineHeight: 1.1,
              wordBreak: "break-word",
            }}
          >
            {titleText}
          </h1>

          <div style={{ color: "#444", fontSize: 14 }}>
            <span style={{ marginRight: 10 }}>
              <strong>Menu ID:</strong> {menuId || "-"}
            </span>
            <span>
              <strong>Created:</strong> {formatDate(createdAt)}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setCompact((v) => !v)}
          style={{
            padding: "10px 14px",
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
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          marginTop: 16,
        }}
      >
        <button
          type="button"
          onClick={() => setView("cards")}
          style={{
            padding: "10px 14px",
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
            padding: "10px 14px",
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
            wordBreak: "break-word",
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
            <div style={{ padding: 14, border: "1px solid #eee", borderRadius: 12, background: "#fafafa" }}>
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
            </div>
          )}

          {!previewLoading && !previewError && sections.length === 0 && (
            <div style={{ padding: 14, border: "1px solid #eee", borderRadius: 12, background: "#fafafa" }}>
              No cards yet. (No sections/items returned.)
            </div>
          )}

          {!previewLoading && !previewError && sections.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile || compact ? "1fr" : "repeat(2, minmax(0, 1fr))",
                gap: compact ? 10 : 14,
              }}
            >
              {sections.map((section, sectionIdx) => (
                <MenuSection
                  key={`${section?.title || section?.name || "section"}-${sectionIdx}`}
                  section={section}
                  compact={compact}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}