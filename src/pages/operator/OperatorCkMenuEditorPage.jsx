import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import OperatorLayout from "./OperatorLayout.jsx";
import { MenuEditor, MENU_EDITOR_COLORS } from "../../components/menuEditor/SharedMenuEditor.jsx";
import {
  createOperatorCkMenuApi,
  getCkMenu,
  getCkMenuFromUpload,
} from "../../lib/operatorApi.js";

/**
 * Operator structured CK menu editor with immutable source PDF pane.
 * Route: /operator/restaurants/:restaurantId/menus/:menuId/edit
 * Optional query: upload_session_id — links PDF + edit log.
 */
export default function OperatorCkMenuEditorPage() {
  const { restaurantId, menuId } = useParams();
  const [searchParams] = useSearchParams();
  const uploadSessionId = searchParams.get("upload_session_id") || null;

  const rid = Number(restaurantId);
  const mid = Number(menuId);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [menuDetail, setMenuDetail] = useState(null);
  const [sourcePdfUrl, setSourcePdfUrl] = useState(null);
  const [identityWarning, setIdentityWarning] = useState(null);
  const [sourceFilename, setSourceFilename] = useState(null);

  const api = useMemo(() => createOperatorCkMenuApi(uploadSessionId), [uploadSessionId]);

  const load = useCallback(async () => {
    if (!rid) {
      setError("Invalid restaurant");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      if (uploadSessionId && !mid) {
        const data = await getCkMenuFromUpload(rid, uploadSessionId);
        if (!data.public_menu_id) {
          throw new Error("Upload finished without a public menu id. Open Menu Lab or retry the upload.");
        }
        setMenuDetail({
          menu: data.menu,
          sections: data.sections || [],
          item_count: data.item_count || 0,
        });
        setSourcePdfUrl(data.pdf_storage_url || null);
        setIdentityWarning(data.identity_warning || null);
        setSourceFilename(data.source_filename || null);
      } else {
        if (!mid) throw new Error("Invalid menu");
        const data = await getCkMenu(rid, mid, uploadSessionId);
        setMenuDetail({
          menu: data.menu,
          sections: data.sections || [],
          item_count: data.item_count || 0,
        });
        setSourcePdfUrl(data.source_pdf?.pdf_storage_url || null);
        setSourceFilename(data.source_pdf?.source_filename || null);
        if (uploadSessionId) {
          try {
            const boot = await getCkMenuFromUpload(rid, uploadSessionId);
            setIdentityWarning(boot.identity_warning || null);
            if (!data.source_pdf?.pdf_storage_url && boot.pdf_storage_url) {
              setSourcePdfUrl(boot.pdf_storage_url);
            }
          } catch (_e) {
            /* warning optional */
          }
        }
      }
    } catch (err) {
      setError(err?.payload?.error || err?.message || "Could not load menu editor");
      setMenuDetail(null);
    } finally {
      setLoading(false);
    }
  }, [rid, mid, uploadSessionId]);

  useEffect(() => {
    load();
  }, [load]);

  function handleMenuUpdated(nextMenu) {
    setMenuDetail((prev) => (prev ? { ...prev, menu: { ...prev.menu, ...nextMenu } } : prev));
  }

  const editorColors = {
    ...MENU_EDITOR_COLORS,
    accent: "#1a56db",
    accentSoft: "#e8f0fe",
    panel: "#ffffff",
    line: "#d0d5dd",
  };

  return (
    <OperatorLayout title="Edit Menu">
      <div style={{ padding: "16px 18px 40px", maxWidth: 1400, margin: "0 auto" }}>
        <div style={{ marginBottom: 14, display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
          <Link to="/operator/menulab" style={{ fontSize: 13, fontWeight: 700, color: "#1a56db" }}>
            ← Menu Lab
          </Link>
          {uploadSessionId && (
            <span style={{ fontSize: 12, color: "#667085" }}>
              Source upload: <code>{uploadSessionId.slice(0, 8)}…</code> (immutable PDF)
            </span>
          )}
        </div>

        {identityWarning && (
          <div
            role="alert"
            style={{
              marginBottom: 14,
              padding: "12px 14px",
              borderRadius: 10,
              background: "#fffbeb",
              border: "1px solid #fde68a",
              color: "#92400e",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {identityWarning.message}
          </div>
        )}

        {error && (
          <div
            style={{
              marginBottom: 14,
              padding: "12px 14px",
              borderRadius: 10,
              background: "#fff1ef",
              color: "#8b2e1a",
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        {loading && (
          <div style={{ padding: 40, color: "#667085", fontSize: 14 }}>Loading structured menu…</div>
        )}

        {!loading && menuDetail?.menu && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: sourcePdfUrl ? "minmax(280px, 1fr) minmax(360px, 1.2fr)" : "1fr",
              gap: 16,
              alignItems: "start",
            }}
          >
            {sourcePdfUrl && (
              <aside
                style={{
                  position: "sticky",
                  top: 12,
                  border: "1px solid #d0d5dd",
                  borderRadius: 14,
                  overflow: "hidden",
                  background: "#111827",
                  minHeight: 480,
                }}
              >
                <div
                  style={{
                    padding: "10px 12px",
                    background: "#1f2937",
                    color: "#f9fafb",
                    fontSize: 12,
                    fontWeight: 700,
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  <span>Source PDF (read-only)</span>
                  {sourceFilename && (
                    <span style={{ fontWeight: 500, opacity: 0.85, overflow: "hidden", textOverflow: "ellipsis" }}>
                      {sourceFilename}
                    </span>
                  )}
                </div>
                <iframe
                  title="Original uploaded menu PDF"
                  src={sourcePdfUrl}
                  style={{ width: "100%", height: "min(78vh, 820px)", border: "none", background: "#111" }}
                />
                <div style={{ padding: "8px 12px", background: "#1f2937", fontSize: 11, color: "#9ca3af" }}>
                  Editing the structured menu never replaces this file.{" "}
                  <a href={sourcePdfUrl} target="_blank" rel="noreferrer" style={{ color: "#93c5fd" }}>
                    Open in new tab
                  </a>
                </div>
              </aside>
            )}

            <div>
              {!sourcePdfUrl && (
                <div
                  style={{
                    marginBottom: 12,
                    padding: "10px 12px",
                    borderRadius: 10,
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    fontSize: 12,
                    color: "#64748b",
                  }}
                >
                  No durable source PDF URL is linked for this menu. If you just uploaded, reopen from the
                  upload success screen with <code>upload_session_id</code>, or ensure Supabase storage is
                  configured.
                </div>
              )}
              <MenuEditor
                restaurantId={rid}
                menuDetail={menuDetail}
                api={api}
                colors={editorColors}
                allowDeleteMenu={false}
                onMenuUpdated={handleMenuUpdated}
                onReload={load}
              />
            </div>
          </div>
        )}
      </div>
    </OperatorLayout>
  );
}
