/**
 * File:    PdfUploadPage.jsx
 * Path:    menubloc-frontend/src/pages/PdfUploadPage.jsx
 * Date:    2026-03-09
 * Purpose:
 *   Onboarding step 5 — PDF menu upload.
 *   Reached from MenuDesignSelectPage (step 4) via router state.
 *
 *   Router state expected:
 *     restaurant_id    — numeric id of the claimed/created restaurant
 *     restaurant_name  — display name
 *     email            — owner email (used to verify owner_token)
 *     owner_token      — HMAC token from signup/claim
 *     plan             — "verified" | "pro"
 *     design_style     — style id from MenuDesignSelectPage, or null if skipped
 *
 *   Submits: POST /menu-upload/pdf
 *     multipart/form-data: file, restaurant_id, email, owner_token, plan
 *
 *   On success: shows confirmation with design style info and link to restaurant profile.
 *
 *   Update 2026-03-09:
 *     Step trail updated to 5 steps (added step 4 Design).
 *     Success screen shows chosen design style (if any) and a design upsell if skipped.
 */

import React, { useRef, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { DESIGN_STYLES } from "../services/designEngine.js";

const API = (import.meta.env.VITE_API_URL || "http://localhost:3001").replace(/\/$/, "");

const MAX_FILE_BYTES = 20 * 1024 * 1024; // 20 MB

const FONT = "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial";

/* ─────────────────────────────────────────────────────────────
   Styles
───────────────────────────────────────────────────────────── */
const s = {
  page: {
    maxWidth: 620,
    margin: "0 auto",
    padding: "36px 20px 80px",
    fontFamily: FONT,
    color: "#111",
  },
  brand:    { fontWeight: 800, fontSize: 18 },
  subbrand: { fontSize: 12, color: "#666", marginBottom: 28 },

  // Step trail
  steps: {
    display: "flex",
    alignItems: "center",
    gap: 0,
    marginBottom: 36,
    fontSize: 11,
    fontWeight: 600,
    flexWrap: "wrap",
    rowGap: 8,
  },
  step: (active, done) => ({
    padding: "4px 10px",
    borderRadius: 999,
    background: done ? "#111" : active ? "#f0f0f5" : "transparent",
    color: done ? "#fff" : active ? "#111" : "#aaa",
    border: active ? "1.5px solid #111" : "1.5px solid transparent",
    whiteSpace: "nowrap",
    fontSize: 11,
  }),
  stepDivider: { flex: "0 0 12px", height: 1, background: "#e0e0e0", margin: "0 2px" },

  heading:    { fontSize: 22, fontWeight: 800, marginBottom: 4 },
  subheading: { fontSize: 14, color: "#666", marginBottom: 28, lineHeight: 1.5 },

  // Context card
  contextCard: {
    border: "1px solid #e5e5e5",
    borderRadius: 12,
    padding: "14px 16px",
    marginBottom: 24,
    background: "#fafafa",
    fontSize: 13,
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
    alignItems: "center",
  },
  contextItem:  { color: "#555" },
  contextLabel: { fontWeight: 700, color: "#111", marginRight: 4 },
  planBadge: (plan) => ({
    display: "inline-block",
    fontSize: 11,
    fontWeight: 800,
    background: plan === "pro" ? "#1a56db" : "#111",
    color: "#fff",
    borderRadius: 999,
    padding: "2px 10px",
    textTransform: "capitalize",
  }),
  designBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    fontSize: 11,
    fontWeight: 700,
    background: "#f0f0f5",
    color: "#333",
    borderRadius: 999,
    padding: "2px 10px",
  },
  designDot: (color) => ({
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: color,
    flexShrink: 0,
  }),

  // Drop zone
  dropZone: (isDragOver, hasFile, hasError) => ({
    border: `2px dashed ${hasError ? "#c00" : isDragOver ? "#111" : hasFile ? "#2a7a2a" : "#ccc"}`,
    borderRadius: 16,
    padding: "36px 24px",
    textAlign: "center",
    cursor: "pointer",
    background: isDragOver ? "#f5f5f5" : hasFile ? "#f0fbf0" : "#fafafa",
    transition: "border-color 0.15s, background 0.15s",
    marginBottom: 20,
    userSelect: "none",
  }),
  dropIcon:  { fontSize: 36, marginBottom: 10, lineHeight: 1 },
  dropTitle: { fontSize: 15, fontWeight: 700, marginBottom: 6 },
  dropSub:   { fontSize: 13, color: "#666", lineHeight: 1.5 },
  dropHint:  { fontSize: 12, color: "#999", marginTop: 8 },

  // File info
  fileInfo: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 14px",
    background: "#f0fbf0",
    border: "1px solid #b2dfb2",
    borderRadius: 10,
    marginBottom: 16,
    fontSize: 13,
  },
  fileName: { fontWeight: 700, flex: 1, wordBreak: "break-all" },
  fileSize: { color: "#555", flexShrink: 0 },
  clearBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 18,
    color: "#888",
    lineHeight: 1,
    padding: 0,
    flexShrink: 0,
  },

  submitBtn: (disabled) => ({
    width: "100%",
    height: 48,
    borderRadius: 12,
    border: 0,
    background: disabled ? "#ccc" : "#111",
    color: "#fff",
    fontWeight: 700,
    fontSize: 15,
    cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: FONT,
  }),

  error: {
    padding: "12px 16px",
    background: "#fff0f0",
    border: "1px solid #f5c6c6",
    borderRadius: 10,
    fontSize: 13,
    color: "#c00",
    marginBottom: 16,
    lineHeight: 1.5,
  },

  progress: {
    padding: "14px 16px",
    background: "#f0f7ff",
    border: "1px solid #c2d9f0",
    borderRadius: 10,
    fontSize: 13,
    color: "#2563a8",
    marginBottom: 16,
    fontWeight: 600,
  },

  /* Success screen */
  successBox: {
    border: "2px solid #2a7a2a",
    borderRadius: 16,
    padding: "32px 28px",
    textAlign: "center",
    background: "#f0fbf0",
    marginBottom: 24,
  },
  successIcon:  { fontSize: 48, marginBottom: 12, lineHeight: 1 },
  successTitle: { fontSize: 22, fontWeight: 800, marginBottom: 8, color: "#1a5c1a" },
  successSub: {
    fontSize: 14,
    color: "#444",
    marginBottom: 24,
    lineHeight: 1.6,
    maxWidth: 420,
    margin: "0 auto 24px",
  },
  profileLink: {
    display: "inline-block",
    padding: "12px 24px",
    borderRadius: 12,
    background: "#111",
    color: "#fff",
    fontWeight: 700,
    fontSize: 14,
    textDecoration: "none",
  },
  pendingNote: {
    marginTop: 16,
    fontSize: 12,
    color: "#777",
    lineHeight: 1.5,
  },
  designBanner: (hasStyle) => ({
    border: hasStyle ? "1.5px solid #e0e0e0" : "1.5px dashed #ccc",
    borderRadius: 14,
    padding: "20px 22px",
    background: hasStyle ? "#fafafa" : "#fff",
    display: "flex",
    gap: 16,
    alignItems: "center",
    flexWrap: "wrap",
  }),
  designBannerIcon: { fontSize: 28, flexShrink: 0 },
  designBannerText: { flex: 1 },
  designBannerTitle: { fontSize: 15, fontWeight: 800, marginBottom: 4 },
  designBannerDesc:  { fontSize: 13, color: "#555", lineHeight: 1.5 },
  designBannerLink: {
    display: "inline-block",
    marginTop: 10,
    fontSize: 13,
    fontWeight: 700,
    color: "#111",
    textDecoration: "underline",
    cursor: "pointer",
    background: "none",
    border: "none",
    padding: 0,
    fontFamily: FONT,
  },
};

/* ─────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────── */

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ─────────────────────────────────────────────────────────────
   Component
───────────────────────────────────────────────────────────── */

export default function PdfUploadPage() {
  const location = useLocation();
  const nav      = useNavigate();
  const state    = location.state || {};

  const {
    restaurant_id,
    restaurant_name = "Your restaurant",
    email           = "",
    owner_token     = "",
    plan            = "",
    design_style    = null,
  } = state;

  const fileInputRef = useRef(null);

  const [file,       setFile]       = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileError,  setFileError]  = useState("");
  const [uploading,  setUploading]  = useState(false);
  const [uploadErr,  setUploadErr]  = useState("");
  const [result,     setResult]     = useState(null);

  const missingState = !restaurant_id || !email || !owner_token;

  // Resolve chosen design style label
  const chosenStyle = design_style
    ? DESIGN_STYLES.find((d) => d.id === design_style) || null
    : null;

  /* ── File validation ── */
  function validateAndSetFile(chosen) {
    setFileError("");
    setUploadErr("");
    if (!chosen) return;

    if (chosen.type !== "application/pdf" && !chosen.name.toLowerCase().endsWith(".pdf")) {
      setFileError("Only PDF files are accepted.");
      return;
    }
    if (chosen.size > MAX_FILE_BYTES) {
      setFileError(`File is too large (${formatBytes(chosen.size)}). Maximum is 20 MB.`);
      return;
    }
    setFile(chosen);
  }

  /* ── Drag-and-drop ── */
  function onDragOver(e)  { e.preventDefault(); setIsDragOver(true); }
  function onDragLeave()  { setIsDragOver(false); }
  function onDrop(e) {
    e.preventDefault();
    setIsDragOver(false);
    validateAndSetFile(e.dataTransfer.files?.[0] || null);
  }
  function onDropZoneClick() { fileInputRef.current?.click(); }
  function onFileChange(e) {
    validateAndSetFile(e.target.files?.[0] || null);
    e.target.value = "";
  }

  /* ── Submit ── */
  async function handleSubmit(e) {
    e.preventDefault();
    setUploadErr("");

    if (!file) {
      setFileError("Please select a PDF file to upload.");
      return;
    }

    setUploading(true);

    try {
      const fd = new FormData();
      fd.append("file",          file);
      fd.append("restaurant_id", String(restaurant_id));
      fd.append("email",         email);
      fd.append("owner_token",   owner_token);
      if (plan) fd.append("plan", plan);

      const res  = await fetch(`${API}/menu-upload/pdf`, { method: "POST", body: fd });
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || `Upload failed (${res.status})`);
      }

      setResult(data);
    } catch (err) {
      setUploadErr(err.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  /* ── Render: missing state ── */
  if (missingState) {
    return (
      <div style={s.page}>
        <div style={s.brand}>Grubbid</div>
        <div style={s.subbrand}>for Restaurants</div>
        <div style={{ ...s.error, marginTop: 24 }}>
          <strong>Missing session data.</strong> Please complete the signup flow to reach this
          page.{" "}
          <a href="/signup" style={{ color: "#c00", fontWeight: 700 }}>Start over</a>
        </div>
      </div>
    );
  }

  /* ── Render: success ── */
  if (result) {
    return (
      <div style={s.page}>
        <div style={s.brand}>Grubbid</div>
        <div style={s.subbrand}>for Restaurants</div>

        <div style={s.successBox}>
          <div style={s.successIcon}>✓</div>
          <div style={s.successTitle}>Menu uploaded successfully</div>
          <p style={s.successSub}>
            Your menu PDF has been received and is being processed. Once approved, your
            menu will appear on your Grubbid profile.
          </p>
          <Link to={`/restaurant-profile/${restaurant_id}`} style={s.profileLink}>
            Go to your restaurant profile
          </Link>
          <div style={s.pendingNote}>
            {result.pages > 0 && `${result.pages}-page PDF · `}
            {result.text_length > 0 && `${result.text_length.toLocaleString()} characters extracted · `}
            Menu status: <strong>pending review</strong>
          </div>
        </div>

        {/* Design style status / upsell */}
        {chosenStyle ? (
          <div style={s.designBanner(true)}>
            <div style={s.designBannerIcon}>🎨</div>
            <div style={s.designBannerText}>
              <div style={s.designBannerTitle}>
                Design style selected: {chosenStyle.name}
              </div>
              <div style={s.designBannerDesc}>
                {chosenStyle.tagline}. Your menu will be styled and ready once it is
                approved and published.
              </div>
            </div>
          </div>
        ) : (
          <div style={s.designBanner(false)}>
            <div style={s.designBannerIcon}>✦</div>
            <div style={s.designBannerText}>
              <div style={s.designBannerTitle}>
                Make your menu look beautiful
              </div>
              <div style={s.designBannerDesc}>
                You skipped the design step. Choose a style anytime to give your menu a
                polished, professional look — no design skills needed.
              </div>
              <button
                style={s.designBannerLink}
                onClick={() =>
                  nav("/restaurant/design-select", {
                    state: { restaurant_id, restaurant_name, email, owner_token, plan, ingestion_method: "pdf" },
                  })
                }
              >
                Choose a design style →
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ── Render: upload form ── */
  const submitDisabled = uploading || !!fileError || !file;

  return (
    <div style={s.page}>
      <div style={s.brand}>Grubbid</div>
      <div style={s.subbrand}>for Restaurants</div>

      {/* Step trail — 5 steps */}
      <div style={s.steps}>
        <div style={s.step(false, true)}>1. Account</div>
        <div style={s.stepDivider} />
        <div style={s.step(false, true)}>2. Find your profile</div>
        <div style={s.stepDivider} />
        <div style={s.step(false, true)}>3. Choose plan</div>
        <div style={s.stepDivider} />
        <div style={s.step(false, true)}>4. Design</div>
        <div style={s.stepDivider} />
        <div style={s.step(true,  false)}>5. Upload menu</div>
      </div>

      <div style={s.heading}>Upload your menu PDF</div>
      <div style={s.subheading}>
        Upload a PDF of your menu and we will extract and structure it automatically.
        Text-based PDFs work best. Scanned image PDFs may have limited results.
      </div>

      {/* Context: restaurant + plan + design style */}
      <div style={s.contextCard}>
        <span style={s.contextItem}>
          <span style={s.contextLabel}>Restaurant</span>
          {restaurant_name}
        </span>
        {plan && <span style={s.planBadge(plan)}>{plan}</span>}
        {chosenStyle && (
          <span style={s.designBadge}>
            <span style={s.designDot(chosenStyle.preview.accent)} />
            {chosenStyle.name}
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} noValidate>
        {/* Drop zone */}
        <div
          style={s.dropZone(isDragOver, !!file, !!fileError)}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={onDropZoneClick}
          role="button"
          tabIndex={0}
          aria-label="Click or drag to upload PDF"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onDropZoneClick();
            }
          }}
        >
          <div style={s.dropIcon}>{file ? "📄" : "⬆"}</div>
          <div style={s.dropTitle}>
            {file ? file.name : "Click to select or drag & drop your PDF"}
          </div>
          <div style={s.dropSub}>
            {file
              ? `${formatBytes(file.size)} · PDF`
              : "PDF files only · Maximum 20 MB"}
          </div>
          {!file && (
            <div style={s.dropHint}>Your file will not leave this page until you click Upload.</div>
          )}
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,.pdf"
          style={{ display: "none" }}
          onChange={onFileChange}
        />

        {/* Selected file info + clear */}
        {file && !fileError && (
          <div style={s.fileInfo}>
            <span style={{ fontSize: 20 }}>📄</span>
            <span style={s.fileName}>{file.name}</span>
            <span style={s.fileSize}>{formatBytes(file.size)}</span>
            <button
              type="button"
              style={s.clearBtn}
              onClick={() => { setFile(null); setFileError(""); }}
              aria-label="Remove selected file"
            >
              ✕
            </button>
          </div>
        )}

        {fileError  && <div style={s.error}>{fileError}</div>}
        {uploading  && <div style={s.progress}>Uploading and extracting text… this may take a moment.</div>}
        {uploadErr  && <div style={s.error}>{uploadErr}</div>}

        <button
          type="submit"
          style={s.submitBtn(submitDisabled)}
          disabled={submitDisabled}
        >
          {uploading ? "Uploading…" : "Upload menu PDF"}
        </button>
      </form>
    </div>
  );
}
