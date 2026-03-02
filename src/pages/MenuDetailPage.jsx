import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

const API = (import.meta.env.VITE_API_URL || "http://localhost:3001").replace(/\/$/, "");

function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
}

export default function MenuDetailPage() {
  const { id } = useParams();
  const menuId = useMemo(() => String(id ?? "").trim(), [id]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [menu, setMenu] = useState(null);

  const [view, setView] = useState("raw");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      setMenu(null);
      setView("raw");
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

  useEffect(() => {
    let cancelled = false;

    async function loadPreview() {
      if (view !== "preview" || !menuId || preview || previewLoading) return;

      setPreviewLoading(true);
      setPreviewError("");

      try {
        const res = await fetch(`${API}/menus/${encodeURIComponent(menuId)}/mks-preview`);
        const data = await res.json().catch(() => null);

        if (!res.ok) {
          const msg = data?.error || `Failed to fetch MKS preview (${res.status})`;
          throw new Error(msg);
        }

        if (!cancelled) {
          setPreview(data || null);
        }
      } catch (e) {
        if (!cancelled) {
          setPreviewError(e?.message || "Failed to fetch MKS preview");
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

  if (loading) {
    return <div style={{ padding: 20 }}>Loading menu detail...</div>;
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

  return (
    <div style={{ padding: 20 }}>
      <h1 style={{ marginTop: 0 }}>{menu?.restaurant_name || "Unknown Restaurant"}</h1>
      <p>
        <strong>Menu ID:</strong> {menu?.id ?? "-"}
      </p>
      <p>
        <strong>Created:</strong> {formatDate(menu?.created_at)}
      </p>

      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <button
          type="button"
          onClick={() => setView("raw")}
          style={{
            padding: "8px 12px",
            borderRadius: 6,
            border: "1px solid #ccc",
            background: view === "raw" ? "#efefef" : "#fff",
            cursor: "pointer",
          }}
        >
          Raw Text
        </button>
        <button
          type="button"
          onClick={() => setView("preview")}
          style={{
            padding: "8px 12px",
            borderRadius: 6,
            border: "1px solid #ccc",
            background: view === "preview" ? "#efefef" : "#fff",
            cursor: "pointer",
          }}
        >
          MKS Preview
        </button>
      </div>

      {view === "raw" ? (
        <pre
          style={{
            marginTop: 16,
            padding: 12,
            border: "1px solid #ddd",
            borderRadius: 6,
            maxHeight: "60vh",
            overflow: "auto",
            background: "#fafafa",
            whiteSpace: "pre-wrap",
          }}
        >
          {menu?.raw_text || "(No raw text)"}
        </pre>
      ) : (
        <div
          style={{
            marginTop: 16,
            padding: 12,
            border: "1px solid #ddd",
            borderRadius: 6,
            background: "#fafafa",
          }}
        >
          {previewLoading && <div>Loading MKS preview...</div>}
          {!previewLoading && previewError && <div style={{ color: "#b00020" }}>{previewError}</div>}
          {!previewLoading && !previewError && (!preview?.sections || preview.sections.length === 0) && (
            <div>No parsed sections found.</div>
          )}
          {!previewLoading &&
            !previewError &&
            Array.isArray(preview?.sections) &&
            preview.sections.map((section, sectionIdx) => (
              <section key={`${section?.title || "section"}-${sectionIdx}`} style={{ marginBottom: 18 }}>
                <h3 style={{ margin: "0 0 10px 0" }}>{section?.title || "Menu"}</h3>
                {Array.isArray(section?.items) &&
                  section.items.map((item, itemIdx) => (
                    <div key={`${item?.name || "item"}-${itemIdx}`} style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                        <span>{item?.name || "-"}</span>
                        <strong>{item?.price || "-"}</strong>
                      </div>
                      {item?.notes ? (
                        <div style={{ fontSize: 13, color: "#555", marginTop: 2 }}>{item.notes}</div>
                      ) : null}
                    </div>
                  ))}
              </section>
            ))}
        </div>
      )}
    </div>
  );
}
