/**
 * ============================================================
 * Path: menubloc-frontend/src/pages/QrCodesPage.jsx
 * File: QrCodesPage.jsx
 * Date: 2026-03-06
 * Purpose:
 *   Admin/owner QR code management for a restaurant.
 *   Route: /restaurants/:id/qr-codes
 *
 *   Features:
 *   - List all QR codes for the restaurant
 *   - Create new QR code (menu_id, destination_path, code_type, label)
 *   - Toggle activate/deactivate per code
 *   - View and open QR image in new tab
 *   - Copy public QR URL to clipboard
 * ============================================================
 */

import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { BackButton } from "../components/NavButton.jsx";
import { apiGet, apiPost, apiPatch } from "../lib/api.js";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:3001").replace(/\/$/, "");

const CODE_TYPES = ["primary", "page", "campaign", "flyer", "window", "table", "print", "social"];

const S = {
  page: {
    minHeight: "100vh",
    background: "var(--bg, #f6f7fb)",
    color: "var(--ink, #0f1720)",
    padding: "24px 18px 60px",
    fontFamily: "var(--font-ui, ui-sans-serif, system-ui, sans-serif)",
  },
  wrap: { maxWidth: 880, margin: "0 auto" },
  topBar: { display: "flex", alignItems: "center", gap: 12, marginBottom: 20 },
  back: { color: "var(--link, #124ba3)", fontWeight: 700, textDecoration: "underline", fontSize: 13 },
  h1: { fontSize: 20, fontWeight: 900, margin: 0 },

  section: {
    background: "#fff",
    border: "1px solid var(--border, #e4e9f0)",
    borderRadius: 14,
    padding: 20,
    marginBottom: 20,
    boxShadow: "var(--shadow-1, 0 6px 18px rgba(16,24,40,0.06))",
  },
  sectionTitle: { fontSize: 13, fontWeight: 800, marginBottom: 14, letterSpacing: 0.2, color: "var(--muted, #5b6675)" },

  form: { display: "flex", flexDirection: "column", gap: 12 },
  row: { display: "flex", gap: 10, flexWrap: "wrap" },
  field: { display: "flex", flexDirection: "column", gap: 4, flex: "1 1 200px" },
  label: { fontSize: 11, fontWeight: 700, color: "var(--muted, #5b6675)", textTransform: "uppercase", letterSpacing: 0.3 },
  input: {
    height: 34,
    padding: "0 10px",
    borderRadius: 8,
    border: "1px solid var(--border, #e4e9f0)",
    fontSize: 13,
    fontFamily: "inherit",
    color: "var(--ink, #0f1720)",
    background: "#fff",
    outline: "none",
  },
  select: {
    height: 34,
    padding: "0 10px",
    borderRadius: 8,
    border: "1px solid var(--border, #e4e9f0)",
    fontSize: 13,
    fontFamily: "inherit",
    color: "var(--ink, #0f1720)",
    background: "#fff",
    outline: "none",
  },

  btn: {
    height: 34,
    padding: "0 16px",
    borderRadius: 8,
    border: "none",
    background: "var(--link, #124ba3)",
    color: "#fff",
    fontWeight: 800,
    fontSize: 13,
    cursor: "pointer",
    whiteSpace: "nowrap",
    alignSelf: "flex-end",
  },
  btnSm: {
    height: 28,
    padding: "0 12px",
    borderRadius: 7,
    border: "1px solid var(--border, #e4e9f0)",
    background: "#fff",
    color: "var(--ink, #0f1720)",
    fontWeight: 700,
    fontSize: 11,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  btnDanger: {
    height: 28,
    padding: "0 12px",
    borderRadius: 7,
    border: "1px solid #fbbfbf",
    background: "#fff5f5",
    color: "#b91c1c",
    fontWeight: 700,
    fontSize: 11,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  btnActivate: {
    height: 28,
    padding: "0 12px",
    borderRadius: 7,
    border: "1px solid #bbf0ce",
    background: "#f0fff6",
    color: "#166534",
    fontWeight: 700,
    fontSize: 11,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  msg: { fontSize: 13, padding: "10px 12px", borderRadius: 8, background: "#f8fafc", border: "1px solid #e4e9f0", marginBottom: 12 },
  err: { fontSize: 13, padding: "10px 12px", borderRadius: 8, background: "#fff5f5", border: "1px solid #fbbfbf", color: "#b91c1c", marginBottom: 12 },

  table: { width: "100%", borderCollapse: "collapse" },
  th: { fontSize: 11, fontWeight: 700, color: "var(--muted, #5b6675)", textAlign: "left", padding: "6px 8px", borderBottom: "1px solid var(--border, #e4e9f0)", textTransform: "uppercase", letterSpacing: 0.3 },
  td: { fontSize: 12, padding: "10px 8px", borderBottom: "1px solid #f2f4f8", verticalAlign: "top" },
  tdActions: { fontSize: 12, padding: "10px 8px", borderBottom: "1px solid #f2f4f8", verticalAlign: "top", whiteSpace: "nowrap" },

  badge: (active) => ({
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: 999,
    fontSize: 10,
    fontWeight: 800,
    background: active ? "#ecfff4" : "#f3f4f7",
    color: active ? "#166534" : "#6b7280",
    border: active ? "1px solid #bbf0ce" : "1px solid #e6e7ee",
  }),

  mono: { fontFamily: "monospace", fontSize: 11, color: "var(--muted, #5b6675)", wordBreak: "break-all" },
  copyBtn: {
    marginLeft: 6,
    fontSize: 10,
    fontWeight: 700,
    cursor: "pointer",
    color: "var(--link, #124ba3)",
    background: "none",
    border: "none",
    padding: 0,
    textDecoration: "underline",
  },
};

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  return (
    <button type="button" style={S.copyBtn} onClick={handleCopy}>
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function QrImageModal({ imageUrl, token, onClose }) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff", borderRadius: 16, padding: 24, maxWidth: 440, width: "90%",
          boxShadow: "0 24px 60px rgba(0,0,0,0.25)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ fontWeight: 800, fontSize: 14 }}>QR Code Image</span>
          <button type="button" style={{ ...S.btnSm, border: "none", background: "none", fontSize: 18, padding: "0 4px" }} onClick={onClose}>×</button>
        </div>
        <img src={imageUrl} alt="QR Code" style={{ width: "100%", borderRadius: 8, border: "1px solid #e4e9f0" }} />
        <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
          <a href={imageUrl} target="_blank" rel="noreferrer" style={{ ...S.btnSm, textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
            Open PNG
          </a>
          <a href={`${imageUrl}?format=svg`} target="_blank" rel="noreferrer" style={{ ...S.btnSm, textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
            Open SVG
          </a>
          <a href={`${API_BASE}/qr/${token}`} target="_blank" rel="noreferrer" style={{ ...S.btnSm, textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
            Test Redirect
          </a>
        </div>
        <div style={{ marginTop: 10 }}>
          <span style={S.mono}>{`${API_BASE}/qr/${token}`}</span>
          <CopyButton text={`${API_BASE}/qr/${token}`} />
        </div>
      </div>
    </div>
  );
}

export default function QrCodesPage() {
  const { id: restaurantId } = useParams();

  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [createErr, setCreateErr] = useState("");
  const [creating, setCreating] = useState(false);
  const [viewImage, setViewImage] = useState(null); // { imageUrl, token }

  const [form, setForm] = useState({
    menu_id: "",
    destination_path: "",
    code_type: "primary",
    label: "",
    menu_page_id: "",
  });

  const fetchCodes = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      const data = await apiGet(`/restaurants/${restaurantId}/qr-codes`);
      setCodes(data.qr_codes || []);
    } catch (e) {
      setErr(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    fetchCodes();
  }, [fetchCodes]);

  function handleFormChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleCreate(e) {
    e.preventDefault();
    setCreateErr("");
    setCreating(true);
    try {
      const body = {
        menu_id: Number(form.menu_id),
        destination_path: form.destination_path.trim(),
        code_type: form.code_type,
        label: form.label.trim() || undefined,
        menu_page_id: form.menu_page_id ? Number(form.menu_page_id) : undefined,
      };
      await apiPost(`/restaurants/${restaurantId}/qr-codes`, body);
      setForm({ menu_id: "", destination_path: "", code_type: "primary", label: "", menu_page_id: "" });
      await fetchCodes();
    } catch (e) {
      setCreateErr(String(e?.message || e));
    } finally {
      setCreating(false);
    }
  }

  async function handleToggleActive(code) {
    try {
      await apiPatch(`/restaurants/${restaurantId}/qr-codes/${code.id}`, {
        is_active: !code.is_active,
      });
      await fetchCodes();
    } catch (e) {
      setErr(String(e?.message || e));
    }
  }

  return (
    <div style={S.page}>
      {viewImage && (
        <QrImageModal
          imageUrl={viewImage.imageUrl}
          token={viewImage.token}
          onClose={() => setViewImage(null)}
        />
      )}

      <div style={S.wrap}>
        <div style={S.topBar}>
          <BackButton />
          <h1 style={S.h1}>QR Codes — Restaurant #{restaurantId}</h1>
        </div>

        {/* Create Form */}
        <div style={S.section}>
          <div style={S.sectionTitle}>Create QR Code</div>
          {createErr && <div style={S.err}>{createErr}</div>}
          <form style={S.form} onSubmit={handleCreate}>
            <div style={S.row}>
              <div style={S.field}>
                <label style={S.label} htmlFor="menu_id">Menu ID *</label>
                <input
                  id="menu_id"
                  name="menu_id"
                  style={S.input}
                  type="number"
                  min="1"
                  placeholder="e.g. 42"
                  value={form.menu_id}
                  onChange={handleFormChange}
                  required
                />
              </div>
              <div style={{ ...S.field, flex: "2 1 320px" }}>
                <label style={S.label} htmlFor="destination_path">
                  Destination Path * <span style={{ fontWeight: 400, textTransform: "none" }}>(e.g. /restaurants/42)</span>
                </label>
                <input
                  id="destination_path"
                  name="destination_path"
                  style={S.input}
                  type="text"
                  placeholder="/restaurants/42"
                  value={form.destination_path}
                  onChange={handleFormChange}
                  required
                />
              </div>
            </div>
            <div style={S.row}>
              <div style={S.field}>
                <label style={S.label} htmlFor="code_type">Type</label>
                <select id="code_type" name="code_type" style={S.select} value={form.code_type} onChange={handleFormChange}>
                  {CODE_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div style={S.field}>
                <label style={S.label} htmlFor="label">Label</label>
                <input
                  id="label"
                  name="label"
                  style={S.input}
                  type="text"
                  placeholder="e.g. Front door table QR"
                  value={form.label}
                  onChange={handleFormChange}
                />
              </div>
              <div style={S.field}>
                <label style={S.label} htmlFor="menu_page_id">Menu Page ID</label>
                <input
                  id="menu_page_id"
                  name="menu_page_id"
                  style={S.input}
                  type="number"
                  min="1"
                  placeholder="optional"
                  value={form.menu_page_id}
                  onChange={handleFormChange}
                />
              </div>
            </div>
            <div>
              <button type="submit" style={S.btn} disabled={creating}>
                {creating ? "Creating…" : "Create QR Code"}
              </button>
            </div>
          </form>
        </div>

        {/* List */}
        <div style={S.section}>
          <div style={S.sectionTitle}>All QR Codes</div>

          {loading && <div style={S.msg}>Loading…</div>}
          {err && <div style={S.err}>{err}</div>}

          {!loading && codes.length === 0 && !err && (
            <div style={S.msg}>No QR codes yet. Create one above.</div>
          )}

          {codes.length > 0 && (
            <div style={{ overflowX: "auto" }}>
              <table style={S.table}>
                <thead>
                  <tr>
                    <th style={S.th}>ID</th>
                    <th style={S.th}>Label / Type</th>
                    <th style={S.th}>Destination</th>
                    <th style={S.th}>Status</th>
                    <th style={S.th}>QR URL</th>
                    <th style={S.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {codes.map((code) => (
                    <tr key={code.id}>
                      <td style={S.td}>{code.id}</td>
                      <td style={S.td}>
                        <div style={{ fontWeight: 700, fontSize: 12 }}>{code.label || <span style={{ color: "#9ca3af" }}>—</span>}</div>
                        <div style={{ fontSize: 10, color: "var(--muted, #5b6675)", marginTop: 2 }}>{code.code_type}</div>
                      </td>
                      <td style={S.td}>
                        <span style={S.mono}>{code.destination_path}</span>
                      </td>
                      <td style={S.td}>
                        <span style={S.badge(code.is_active)}>{code.is_active ? "Active" : "Inactive"}</span>
                      </td>
                      <td style={S.td}>
                        <span style={S.mono}>{code.qr_url}</span>
                        <CopyButton text={code.qr_url} />
                      </td>
                      <td style={S.tdActions}>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          <button
                            type="button"
                            style={S.btnSm}
                            onClick={() => setViewImage({ imageUrl: code.image_url, token: code.token })}
                          >
                            QR Image
                          </button>
                          {code.is_active ? (
                            <button type="button" style={S.btnDanger} onClick={() => handleToggleActive(code)}>
                              Deactivate
                            </button>
                          ) : (
                            <button type="button" style={S.btnActivate} onClick={() => handleToggleActive(code)}>
                              Activate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
