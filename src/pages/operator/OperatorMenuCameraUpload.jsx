/**
 * Operator camera menu upload — one page at a time, review before Common Knowledge insert.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import OperatorLayout from "./OperatorLayout.jsx";
import { useOperator } from "../../context/OperatorContext.jsx";
import {
  createMenuCameraSession,
  getMenuCameraSession,
  uploadMenuCameraPage,
  processMenuCameraPage,
  updateMenuCameraPageItems,
  confirmMenuCameraPage,
  finalizeMenuCameraSession,
  API_BASE,
} from "../../lib/operatorApi.js";
import { convertImageFileToPdf, buildCapturePreviewUrl } from "../../lib/menuCaptureImagePdf.js";

const FONT = "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial";

const STATUS_LABEL = {
  captured: "Captured",
  uploading: "Uploading",
  processing: "Processing",
  parsed: "Ready to review",
  needs_review: "Needs review",
  confirmed: "Confirmed",
  failed: "Failed",
};

function emptyItem() {
  return { name: "", description: "", price: "", section: "Entrees", modifier_group: "" };
}

function PageItemEditor({ items, onChange, disabled }) {
  const update = (index, key, value) => {
    const next = items.map((row, i) => (i === index ? { ...row, [key]: value } : row));
    onChange(next);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {items.map((item, index) => (
        <div
          key={`item-${index}`}
          style={{
            border: "1px solid #e2e8f0",
            borderRadius: 10,
            padding: 12,
            background: "#fff",
          }}
        >
          <input
            style={inputStyle}
            placeholder="Item name"
            value={item.name}
            disabled={disabled}
            onChange={(e) => update(index, "name", e.target.value)}
          />
          <input
            style={{ ...inputStyle, marginTop: 8 }}
            placeholder="Price"
            value={item.price ?? ""}
            disabled={disabled}
            onChange={(e) => update(index, "price", e.target.value)}
          />
          <input
            style={{ ...inputStyle, marginTop: 8 }}
            placeholder="Section / category"
            value={item.section || ""}
            disabled={disabled}
            onChange={(e) => update(index, "section", e.target.value)}
          />
          <input
            style={{ ...inputStyle, marginTop: 8 }}
            placeholder="Description"
            value={item.description || ""}
            disabled={disabled}
            onChange={(e) => update(index, "description", e.target.value)}
          />
          <input
            style={{ ...inputStyle, marginTop: 8 }}
            placeholder="Modifiers (optional)"
            value={item.modifier_group || ""}
            disabled={disabled}
            onChange={(e) => update(index, "modifier_group", e.target.value)}
          />
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange(items.filter((_, i) => i !== index))}
            style={{
              marginTop: 8,
              background: "transparent",
              border: "none",
              color: "#b91c1c",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Remove item
          </button>
        </div>
      ))}
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange([...items, emptyItem()])}
        style={{
          padding: "10px 14px",
          borderRadius: 8,
          border: "1.5px dashed #94a3b8",
          background: "#f8fafc",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        + Add item
      </button>
    </div>
  );
}

function inputStyle() {
  return {
    width: "100%",
    padding: "10px 12px",
    border: "1.5px solid #e2e8f0",
    borderRadius: 8,
    fontSize: 14,
    boxSizing: "border-box",
  };
}

export default function OperatorMenuCameraUpload() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { selectedRestaurant, loading: operatorLoading } = useOperator();
  const restaurantId = selectedRestaurant?.id;

  const [sessionId, setSessionId] = useState(searchParams.get("session") || "");
  const [pages, setPages] = useState([]);
  const [sessionMeta, setSessionMeta] = useState(null);
  const [summary, setSummary] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [view, setView] = useState("capture");
  const [activePage, setActivePage] = useState(null);
  const [editItems, setEditItems] = useState([]);
  const [previewUrl, setPreviewUrl] = useState("");
  const [captureFile, setCaptureFile] = useState(null);
  const fileRef = useRef(null);

  const nextPageNumber = useMemo(() => {
    if (!pages.length) return 1;
    return Math.max(...pages.map((p) => p.page_number)) + 1;
  }, [pages]);

  const refreshSession = useCallback(async () => {
    if (!sessionId || !restaurantId) return;
    const data = await getMenuCameraSession(sessionId, restaurantId);
    setPages(data.pages || []);
    setSessionMeta(data.session || null);
    setSummary(data.summary || null);
    return data;
  }, [sessionId, restaurantId]);

  useEffect(() => {
    if (!sessionId || !restaurantId) return;
    refreshSession().catch((err) => setError(err.message || "Could not load session"));
  }, [sessionId, restaurantId, refreshSession]);

  useEffect(() => {
    if (!captureFile) {
      setPreviewUrl("");
      return undefined;
    }
    const url = buildCapturePreviewUrl(captureFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [captureFile]);

  const ensureSession = async () => {
    if (sessionId) return sessionId;
    const data = await createMenuCameraSession(restaurantId);
    const id = data.upload_session_id;
    setSessionId(id);
    const next = new URLSearchParams(searchParams);
    next.set("session", id);
    navigate(`/operator/menu/camera-upload?${next.toString()}`, { replace: true });
    return id;
  };

  const handleCapturePage = async () => {
    if (!captureFile || !restaurantId) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const sid = await ensureSession();
      const pdfFile = await convertImageFileToPdf(captureFile);
      const form = new FormData();
      form.append("image_file", captureFile);
      form.append("pdf_file", pdfFile);
      await uploadMenuCameraPage(sid, restaurantId, nextPageNumber, form);
      setCaptureFile(null);
      if (fileRef.current) fileRef.current.value = "";
      const data = await refreshSession();
      const uploaded = (data?.pages || []).find((p) => p.page_number === nextPageNumber);
      if (uploaded) {
        setActivePage(uploaded);
        setEditItems(uploaded.items?.length ? uploaded.items : []);
        setView("review");
        setMessage("Page saved. Tap “Read this page” to extract menu items.");
      }
    } catch (err) {
      setError(err.message || "Could not upload page");
    } finally {
      setBusy(false);
    }
  };

  const handleProcessPage = async (page) => {
    setBusy(true);
    setError("");
    try {
      const data = await processMenuCameraPage(sessionId, restaurantId, page.page_number);
      const updated = data.page;
      setActivePage(updated);
      setEditItems(updated.items?.length ? updated.items : [emptyItem()]);
      await refreshSession();
      setView("review");
    } catch (err) {
      setError(err.message || "Could not read this page");
      await refreshSession();
    } finally {
      setBusy(false);
    }
  };

  const handleSaveEdits = async () => {
    setBusy(true);
    setError("");
    try {
      const data = await updateMenuCameraPageItems(
        sessionId,
        restaurantId,
        activePage.page_number,
        editItems.filter((row) => String(row.name || "").trim())
      );
      setActivePage(data.page);
      setEditItems(data.page.items || []);
      await refreshSession();
      setMessage("Edits saved.");
    } catch (err) {
      setError(err.message || "Could not save edits");
    } finally {
      setBusy(false);
    }
  };

  const handleConfirmPage = async () => {
    setBusy(true);
    setError("");
    try {
      await updateMenuCameraPageItems(
        sessionId,
        restaurantId,
        activePage.page_number,
        editItems.filter((row) => String(row.name || "").trim())
      );
      const data = await confirmMenuCameraPage(sessionId, restaurantId, activePage.page_number);
      setActivePage(data.page);
      await refreshSession();
      setView("list");
      setMessage(`Page ${data.page.page_number} confirmed.`);
      setActivePage(null);
    } catch (err) {
      setError(err.message || "Could not confirm page");
    } finally {
      setBusy(false);
    }
  };

  const handleFinalize = async () => {
    if (!window.confirm("Publish all confirmed pages to your menu as unverified?")) return;
    setBusy(true);
    setError("");
    try {
      const result = await finalizeMenuCameraSession(sessionId, restaurantId);
      await refreshSession();
      setView("done");
      setMessage(
        `Menu published (${result.total_written} items). Items are unverified until you complete restaurant verification.`
      );
    } catch (err) {
      setError(err.message || "Could not finalize menu");
    } finally {
      setBusy(false);
    }
  };

  const openReview = (page) => {
    setActivePage(page);
    setEditItems(page.items?.length ? page.items : [emptyItem()]);
    setView("review");
  };

  const allConfirmed =
    pages.length > 0 && pages.every((p) => p.status === "confirmed") && sessionMeta?.status === "open";

  if (operatorLoading) {
    return (
      <OperatorLayout>
        <p style={{ padding: 24 }}>Loading…</p>
      </OperatorLayout>
    );
  }

  if (!restaurantId) {
    return (
      <OperatorLayout>
        <p style={{ padding: 24 }}>Select a restaurant from the sidebar to upload a menu.</p>
      </OperatorLayout>
    );
  }

  return (
    <OperatorLayout>
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "16px 16px 80px", fontFamily: FONT }}>
        <button
          type="button"
          onClick={() => navigate("/operator/menu")}
          style={{ background: "none", border: "none", color: "#1F4E3D", fontWeight: 600, marginBottom: 8, cursor: "pointer" }}
        >
          ← Menu editor
        </button>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 6px" }}>Camera menu upload</h1>
        <p style={{ fontSize: 14, color: "#64748b", marginBottom: 16, lineHeight: 1.5 }}>
          Photograph each menu page, review items on your phone, then publish one combined menu. You can leave and
          return anytime — your session is saved.
        </p>

        {error ? (
          <div style={{ background: "#fef2f2", color: "#991b1b", padding: 12, borderRadius: 8, marginBottom: 12 }}>
            {error}
          </div>
        ) : null}
        {message ? (
          <div style={{ background: "#ecfdf5", color: "#065f46", padding: 12, borderRadius: 8, marginBottom: 12 }}>
            {message}
          </div>
        ) : null}

        {view === "done" ? (
          <div style={{ border: "1px solid #bbf7d0", borderRadius: 12, padding: 16, background: "#f0fdf4" }}>
            <p style={{ margin: 0, fontWeight: 700 }}>Menu published</p>
            <p style={{ fontSize: 14, color: "#166534", marginTop: 8 }}>
              Items are live as unverified (UV). Complete verification when Menuply prompts you.
            </p>
            <button
              type="button"
              onClick={() => navigate("/operator/menu")}
              style={{
                marginTop: 14,
                padding: "12px 18px",
                background: "#1F4E3D",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Back to menu editor
            </button>
          </div>
        ) : null}

        {view === "list" ? (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
              {pages.map((page) => (
                <button
                  key={page.page_number}
                  type="button"
                  onClick={() => openReview(page)}
                  style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "center",
                    textAlign: "left",
                    padding: 10,
                    borderRadius: 10,
                    border: "1px solid #e2e8f0",
                    background: page.status === "confirmed" ? "#f0fdf4" : "#fff",
                    cursor: "pointer",
                  }}
                >
                  <img
                    src={page.image_url?.startsWith("http") ? page.image_url : `${API_BASE}${page.image_url}`}
                    alt=""
                    style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 8 }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>Page {page.page_number}</div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>
                      {STATUS_LABEL[page.status] || page.status} · {page.item_count} items
                    </div>
                  </div>
                </button>
              ))}
            </div>
            {summary ? (
              <p style={{ fontSize: 13, color: "#475569", marginBottom: 12 }}>
                {summary.confirmed_page_count} of {summary.page_count} pages confirmed · {summary.total_items} items
              </p>
            ) : null}
            <button
              type="button"
              disabled={busy}
              onClick={() => setView("capture")}
              style={primaryBtn(false)}
            >
              + Add another page
            </button>
            {allConfirmed ? (
              <button type="button" disabled={busy} onClick={handleFinalize} style={{ ...primaryBtn(busy), marginTop: 10 }}>
                Finalize menu ({summary?.total_items || 0} items)
              </button>
            ) : (
              <p style={{ fontSize: 13, color: "#94a3b8", marginTop: 12 }}>
                Confirm every page before finalizing.
              </p>
            )}
          </>
        ) : null}

        {view === "capture" ? (
          <>
            <label style={{ display: "block", fontWeight: 700, marginBottom: 8 }}>Take menu photo</label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => setCaptureFile(e.target.files?.[0] || null)}
              style={{ width: "100%", marginBottom: 12 }}
            />
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Preview"
                style={{ width: "100%", borderRadius: 12, marginBottom: 12, maxHeight: 320, objectFit: "contain" }}
              />
            ) : null}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                type="button"
                disabled={!captureFile || busy}
                onClick={handleCapturePage}
                style={primaryBtn(busy)}
              >
                {busy ? "Saving…" : sessionId ? "Save page" : "Start session & save page"}
              </button>
              {captureFile ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setCaptureFile(null);
                    if (fileRef.current) fileRef.current.value = "";
                  }}
                  style={ghostBtn()}
                >
                  Retake
                </button>
              ) : null}
              {pages.length ? (
                <button type="button" onClick={() => setView("list")} style={ghostBtn()}>
                  View pages ({pages.length})
                </button>
              ) : null}
            </div>
          </>
        ) : null}

        {view === "review" && activePage ? (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h2 style={{ fontSize: 18, margin: 0 }}>Page {activePage.page_number}</h2>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>
                {STATUS_LABEL[activePage.status] || activePage.status}
              </span>
            </div>
            <img
              src={
                activePage.image_url?.startsWith("http")
                  ? activePage.image_url
                  : `${API_BASE}${activePage.image_url}`
              }
              alt=""
              style={{ width: "100%", borderRadius: 12, marginBottom: 12, maxHeight: 200, objectFit: "contain" }}
            />
            {["captured", "failed"].includes(activePage.status) ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => handleProcessPage(activePage)}
                style={{ ...primaryBtn(busy), marginBottom: 12 }}
              >
                {busy ? "Reading menu…" : "Read this page"}
              </button>
            ) : null}
            {["parsed", "needs_review", "confirmed"].includes(activePage.status) ? (
              <>
                <PageItemEditor items={editItems} onChange={setEditItems} disabled={busy || activePage.status === "confirmed"} />
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
                  {activePage.status !== "confirmed" ? (
                    <>
                      <button type="button" disabled={busy} onClick={handleSaveEdits} style={ghostBtn()}>
                        Save edits
                      </button>
                      <button type="button" disabled={busy} onClick={handleConfirmPage} style={primaryBtn(busy)}>
                        Confirm this page
                      </button>
                    </>
                  ) : null}
                  <button type="button" onClick={() => setView("list")} style={ghostBtn()}>
                    Back to all pages
                  </button>
                </div>
              </>
            ) : null}
          </>
        ) : null}
      </div>
    </OperatorLayout>
  );
}

function primaryBtn(disabled) {
  return {
    padding: "12px 18px",
    background: disabled ? "#94a3b8" : "#1F4E3D",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontWeight: 700,
    cursor: disabled ? "default" : "pointer",
    width: "100%",
  };
}

function ghostBtn() {
  return {
    padding: "12px 18px",
    background: "#fff",
    color: "#1F4E3D",
    border: "1.5px solid #1F4E3D",
    borderRadius: 8,
    fontWeight: 600,
    cursor: "pointer",
    width: "100%",
  };
}
