/**
 * ============================================================
 * Path: menubloc-frontend/src/pages/SpreadsheetUploadPage.jsx
 * Purpose:
 *   CSV menu upload step — final step of spreadsheet onboarding flow.
 *   Reached from SubscriptionSelect via router state.
 *
 *   Router state expected:
 *     restaurant_id   — numeric id
 *     restaurant_name — display name
 *     email           — owner email
 *     owner_token     — HMAC token
 *     plan            — "verified" | "pro"
 *
 *   Flow:
 *     1. User downloads the CSV template
 *     2. User selects their filled-in CSV file
 *     3. Client parses CSV into rows/objects (no backend dep needed)
 *     4. Preview table shown for confirmation
 *     5. Submit → POST /menu-upload/spreadsheet (JSON body with parsed items)
 *     6. Success screen with link to profile
 *
 *   Template columns (case-insensitive):
 *     Name | Description | Section | Price | IsVegan | IsGlutenFree
 * ============================================================
 */

import { useRef, useState } from "react";
import { useLocation, Link } from "react-router-dom";

const API = (import.meta.env.VITE_API_URL || "http://localhost:3001").replace(/\/$/, "");

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB

/* ---- CSV template ---- */
const TEMPLATE_HEADERS = ["Name", "Description", "Section", "Price", "IsVegan", "IsGlutenFree"];
const TEMPLATE_EXAMPLE_ROWS = [
  ["Margherita Pizza", "Fresh mozzarella and basil", "Pizzas", "14.99", "TRUE", "FALSE"],
  ["Caesar Salad", "Romaine, croutons, parmesan", "Salads", "11.00", "FALSE", "FALSE"],
  ["Spaghetti Aglio e Olio", "Garlic, olive oil, chili flakes", "Pasta", "13.50", "TRUE", "FALSE"],
];

function generateTemplateCsv() {
  const rows = [TEMPLATE_HEADERS, ...TEMPLATE_EXAMPLE_ROWS];
  return rows.map((r) => r.map((cell) => `"${cell}"`).join(",")).join("\n");
}

function downloadTemplate() {
  const csv  = generateTemplateCsv();
  const blob = new Blob([csv], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = "Grubbid Menu Upload Template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

/* ---- CSV parser ---- */
// Handles quoted fields, embedded commas, CRLF, BOM.
function parseCSV(text) {
  const raw = text.replace(/^\uFEFF/, ""); // strip BOM

  const records = [];
  let cur       = "";
  let inQuote   = false;
  let fields    = [];

  for (let i = 0; i < raw.length; i++) {
    const ch   = raw[i];
    const next = raw[i + 1];

    if (ch === '"') {
      if (inQuote && next === '"') {
        cur += '"';
        i++;
      } else {
        inQuote = !inQuote;
      }
    } else if (ch === "," && !inQuote) {
      fields.push(cur);
      cur = "";
    } else if ((ch === "\n" || ch === "\r") && !inQuote) {
      fields.push(cur);
      cur = "";
      records.push(fields);
      fields = [];
      if (ch === "\r" && next === "\n") i++; // skip \n in CRLF
    } else {
      cur += ch;
    }
  }
  // last field / line
  if (cur || fields.length) {
    fields.push(cur);
    if (fields.some((f) => f !== "")) records.push(fields);
  }

  return records;
}

// Map parsed CSV records to item objects using the header row.
function csvToItems(records) {
  if (records.length < 2) return { items: [], warnings: ["CSV has no data rows."] };

  const headerRaw = records[0].map((h) => h.trim().toLowerCase());

  // Accept column aliases
  const colIdx = {
    name:          headerRaw.findIndex((h) => h === "name"),
    description:   headerRaw.findIndex((h) => ["description", "desc"].includes(h)),
    section:       headerRaw.findIndex((h) => ["section", "category"].includes(h)),
    price:         headerRaw.findIndex((h) => h === "price"),
    is_vegan:      headerRaw.findIndex((h) => ["isvegan", "is_vegan", "vegan"].includes(h)),
    is_gluten_free:headerRaw.findIndex((h) => ["isglutenfree", "is_gluten_free", "glutenfree", "gluten_free"].includes(h)),
  };

  if (colIdx.name < 0) {
    return { items: [], warnings: ['Required column "Name" not found. Check column headers.'] };
  }

  const items    = [];
  const warnings = [];

  for (let r = 1; r < records.length; r++) {
    const row  = records[r];
    const get  = (idx) => (idx >= 0 ? (row[idx] ?? "").trim() : "");

    const name = get(colIdx.name);
    if (!name) continue; // blank row — skip silently

    const priceRaw = get(colIdx.price);
    const priceNum = priceRaw ? parseFloat(priceRaw.replace(/[^0-9.]/g, "")) : null;

    items.push({
      name,
      description:    get(colIdx.description)    || null,
      section:        get(colIdx.section)         || null,
      price:          Number.isFinite(priceNum) && priceNum >= 0 ? priceNum.toFixed(2) : null,
      is_vegan:       get(colIdx.is_vegan)        || null,
      is_gluten_free: get(colIdx.is_gluten_free)  || null,
    });

    if (!Number.isFinite(priceNum) && priceRaw) {
      warnings.push(`Row ${r + 1}: could not parse price "${priceRaw}" — it will be saved as null.`);
    }
  }

  return { items, warnings };
}

/* ---- Styles ---- */
const s = {
  page: {
    maxWidth: 700,
    margin: "40px auto",
    padding: "0 20px 80px",
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
    color: "#111",
  },
  brand:    { fontWeight: 800, fontSize: 18 },
  subbrand: { fontSize: 12, color: "#666", marginBottom: 28 },

  steps: {
    display: "flex",
    alignItems: "center",
    gap: 0,
    marginBottom: 32,
    fontSize: 12,
    fontWeight: 600,
  },
  step: (active, done) => ({
    padding: "4px 12px",
    borderRadius: 999,
    background: done ? "#111" : active ? "#f0f0f5" : "transparent",
    color: done ? "#fff" : active ? "#111" : "#aaa",
    border: active ? "1.5px solid #111" : "1.5px solid transparent",
    whiteSpace: "nowrap",
  }),
  stepDivider: { flex: "0 0 16px", height: 1, background: "#e0e0e0", margin: "0 2px" },

  heading:    { fontSize: 22, fontWeight: 800, marginBottom: 4 },
  subheading: { fontSize: 14, color: "#666", marginBottom: 24, lineHeight: 1.5 },

  contextCard: {
    border: "1px solid #e5e5e5",
    borderRadius: 12,
    padding: "14px 16px",
    marginBottom: 24,
    background: "#fafafa",
    fontSize: 13,
    display: "flex",
    gap: 16,
    flexWrap: "wrap",
    alignItems: "center",
  },
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

  /* Template section */
  templateSection: {
    border: "1px solid #e5e5e5",
    borderRadius: 12,
    padding: "16px 18px",
    marginBottom: 24,
    background: "#fafafa",
  },
  templateTitle: { fontWeight: 700, fontSize: 14, marginBottom: 4 },
  templateDesc:  { fontSize: 13, color: "#555", marginBottom: 12, lineHeight: 1.5 },
  templateBtn: {
    height: 36,
    padding: "0 16px",
    borderRadius: 9,
    border: "1.5px solid #111",
    background: "#fff",
    color: "#111",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
  },
  columnList: {
    fontSize: 12,
    color: "#666",
    marginTop: 12,
    lineHeight: 1.8,
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  },

  /* Drop zone */
  dropZone: (isDragOver, hasFile, hasError) => ({
    border: `2px dashed ${hasError ? "#c00" : isDragOver ? "#111" : hasFile ? "#2a7a2a" : "#ccc"}`,
    borderRadius: 16,
    padding: "32px 24px",
    textAlign: "center",
    cursor: "pointer",
    background: isDragOver ? "#f5f5f5" : hasFile ? "#f0fbf0" : "#fafafa",
    transition: "border-color 0.15s, background 0.15s",
    marginBottom: 16,
    userSelect: "none",
  }),
  dropIcon:  { fontSize: 36, marginBottom: 10, lineHeight: 1 },
  dropTitle: { fontSize: 15, fontWeight: 700, marginBottom: 6 },
  dropSub:   { fontSize: 13, color: "#666", lineHeight: 1.5 },

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

  /* Warnings */
  warning: {
    padding: "10px 14px",
    background: "#fffbe6",
    border: "1px solid #f0d060",
    borderRadius: 10,
    fontSize: 12,
    color: "#7a5800",
    marginBottom: 12,
    lineHeight: 1.6,
  },

  /* Preview table */
  previewWrap: {
    overflowX: "auto",
    marginBottom: 20,
    border: "1px solid #e5e5e5",
    borderRadius: 12,
  },
  previewTable: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 13,
  },
  th: {
    textAlign: "left",
    padding: "8px 12px",
    background: "#f5f5f5",
    fontWeight: 700,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    color: "#555",
    borderBottom: "1px solid #e5e5e5",
    whiteSpace: "nowrap",
  },
  td: (alt) => ({
    padding: "7px 12px",
    borderBottom: "1px solid #f0f0f0",
    background: alt ? "#fafafa" : "#fff",
    verticalAlign: "top",
    maxWidth: 200,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  }),
  previewCount: { fontSize: 12, color: "#666", marginBottom: 12 },

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

  /* Success */
  successBox: {
    border: "2px solid #2a7a2a",
    borderRadius: 16,
    padding: "32px 28px",
    textAlign: "center",
    background: "#f0fbf0",
  },
  successIcon:  { fontSize: 48, marginBottom: 12, lineHeight: 1 },
  successTitle: { fontSize: 22, fontWeight: 800, marginBottom: 8, color: "#1a5c1a" },
  successSub: {
    fontSize: 14,
    color: "#444",
    marginBottom: 24,
    lineHeight: 1.6,
    maxWidth: 440,
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
  pendingNote: { marginTop: 16, fontSize: 12, color: "#777", lineHeight: 1.5 },
};

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function BoolDot({ val }) {
  if (val === null || val === undefined || val === "") return <span style={{ color: "#bbb" }}>—</span>;
  const s = String(val).toLowerCase();
  const is = s === "true" || s === "1" || s === "yes";
  return <span style={{ color: is ? "#2a7a2a" : "#888" }}>{is ? "Yes" : "No"}</span>;
}

export default function SpreadsheetUploadPage() {
  const location = useLocation();
  const state    = location.state || {};

  const {
    restaurant_id,
    restaurant_name = "Your restaurant",
    email           = "",
    owner_token     = "",
    plan            = "",
  } = state;

  const fileInputRef = useRef(null);

  const [file,       setFile]       = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileError,  setFileError]  = useState("");
  const [items,      setItems]      = useState(null);   // parsed items
  const [warnings,   setWarnings]   = useState([]);
  const [uploading,  setUploading]  = useState(false);
  const [uploadErr,  setUploadErr]  = useState("");
  const [result,     setResult]     = useState(null);

  const missingState = !restaurant_id || !email || !owner_token;

  /* ---- File handling ---- */
  function validateAndSetFile(chosen) {
    setFileError("");
    setUploadErr("");
    setItems(null);
    setWarnings([]);

    if (!chosen) return;

    const isCSV = chosen.type === "text/csv" || chosen.name.toLowerCase().endsWith(".csv");
    if (!isCSV) {
      setFileError("Only CSV files are accepted. Download the template below, fill it in, and save as CSV.");
      return;
    }
    if (chosen.size > MAX_FILE_BYTES) {
      setFileError(`File is too large (${formatBytes(chosen.size)}). Maximum is 5 MB.`);
      return;
    }

    // Parse immediately for preview
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text    = e.target.result;
        const records = parseCSV(text);
        const { items: parsed, warnings: warns } = csvToItems(records);

        if (parsed.length === 0) {
          setFileError(warns.length ? warns[0] : "No valid rows found in this file.");
          return;
        }

        setFile(chosen);
        setItems(parsed);
        setWarnings(warns);
      } catch (err) {
        setFileError(`Could not parse CSV: ${err.message}`);
      }
    };
    reader.onerror = () => setFileError("Could not read the file.");
    reader.readAsText(chosen, "utf-8");
  }

  function onDragOver(e) { e.preventDefault(); setIsDragOver(true); }
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

  /* ---- Submit ---- */
  async function handleSubmit(e) {
    e.preventDefault();
    if (!items || items.length === 0) {
      setFileError("No valid items to upload.");
      return;
    }

    setUploading(true);
    setUploadErr("");

    try {
      const res = await fetch(`${API}/menu-upload/spreadsheet`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurant_id,
          email,
          owner_token,
          plan: plan || undefined,
          items,
        }),
      });
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

  /* ---- Missing state ---- */
  if (missingState) {
    return (
      <div style={s.page}>
        <div style={s.brand}>Grubbid</div>
        <div style={s.subbrand}>for Restaurants</div>
        <div style={{ ...s.error, marginTop: 24 }}>
          <strong>Missing session data.</strong> Please complete the signup flow to reach this page.{" "}
          <a href="/signup" style={{ color: "#c00", fontWeight: 700 }}>Start over</a>
        </div>
      </div>
    );
  }

  /* ---- Success ---- */
  if (result) {
    return (
      <div style={s.page}>
        <div style={s.brand}>Grubbid</div>
        <div style={s.subbrand}>for Restaurants</div>

        <div style={s.successBox}>
          <div style={s.successIcon}>✓</div>
          <div style={s.successTitle}>Menu uploaded successfully</div>
          <p style={s.successSub}>
            {result.items_inserted} menu item{result.items_inserted !== 1 ? "s" : ""} uploaded and pending review.
            Once approved, your menu will appear on your Grubbid profile.
          </p>
          <Link to={`/restaurant-profile/${restaurant_id}`} style={s.profileLink}>
            Go to your restaurant profile
          </Link>
          <div style={s.pendingNote}>
            {result.items_inserted} items saved ·{" "}
            {result.items_skipped > 0 ? `${result.items_skipped} skipped · ` : ""}
            Menu status: <strong>pending review</strong>
          </div>
        </div>
      </div>
    );
  }

  /* ---- Upload form ---- */
  const submitDisabled = uploading || !items || items.length === 0;

  return (
    <div style={s.page}>
      <div style={s.brand}>Grubbid</div>
      <div style={s.subbrand}>for Restaurants</div>

      {/* Step trail */}
      <div style={s.steps}>
        <div style={s.step(false, true)}>1. Account</div>
        <div style={s.stepDivider} />
        <div style={s.step(false, true)}>2. Find your profile</div>
        <div style={s.stepDivider} />
        <div style={s.step(false, true)}>3. Choose plan</div>
        <div style={s.stepDivider} />
        <div style={s.step(true, false)}>4. Upload menu</div>
      </div>

      <div style={s.heading}>Upload your menu via spreadsheet</div>
      <div style={s.subheading}>
        Download the template, fill in your menu items, save as CSV, and upload below.
      </div>

      {/* Context */}
      <div style={s.contextCard}>
        <span>
          <span style={s.contextLabel}>Restaurant</span>
          {restaurant_name}
        </span>
        {plan && <span style={s.planBadge(plan)}>{plan}</span>}
      </div>

      {/* Template download */}
      <div style={s.templateSection}>
        <div style={s.templateTitle}>Step 1 — Download the menu template</div>
        <div style={s.templateDesc}>
          Fill in one menu item per row. Save the file as CSV before uploading.
          All columns except <strong>Name</strong> are optional.
        </div>
        <button style={s.templateBtn} type="button" onClick={downloadTemplate}>
          ↓ Download CSV template
        </button>
        <div style={s.columnList}>
          {TEMPLATE_HEADERS.map((h, i) => (
            <span key={h}>
              <strong>{h}</strong>{i === 0 ? " (required)" : " (optional)"}
              {i < TEMPLATE_HEADERS.length - 1 ? " · " : ""}
            </span>
          ))}
        </div>
      </div>

      {/* File upload */}
      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, color: "#444" }}>
        Step 2 — Upload your filled-in CSV
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div
          style={s.dropZone(isDragOver, !!file, !!fileError)}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={onDropZoneClick}
          role="button"
          tabIndex={0}
          aria-label="Click or drag to upload CSV"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onDropZoneClick(); }
          }}
        >
          <div style={s.dropIcon}>{file ? "📊" : "⬆"}</div>
          <div style={s.dropTitle}>
            {file ? file.name : "Click to select or drag & drop your CSV"}
          </div>
          <div style={s.dropSub}>CSV files only · Maximum 5 MB</div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          style={{ display: "none" }}
          onChange={onFileChange}
        />

        {/* Selected file */}
        {file && !fileError && (
          <div style={s.fileInfo}>
            <span style={{ fontSize: 20 }}>📊</span>
            <span style={s.fileName}>{file.name}</span>
            <span style={s.fileSize}>{formatBytes(file.size)}</span>
            <button
              type="button"
              style={s.clearBtn}
              onClick={() => { setFile(null); setItems(null); setWarnings([]); setFileError(""); }}
              aria-label="Remove selected file"
            >
              ✕
            </button>
          </div>
        )}

        {fileError && <div style={s.error}>{fileError}</div>}

        {/* Parse warnings */}
        {warnings.length > 0 && (
          <div style={s.warning}>
            <strong>Warnings</strong>
            <ul style={{ margin: "4px 0 0", paddingLeft: 16 }}>
              {warnings.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          </div>
        )}

        {/* Preview table */}
        {items && items.length > 0 && (
          <>
            <div style={s.previewCount}>
              <strong>{items.length}</strong> menu item{items.length !== 1 ? "s" : ""} parsed — review before uploading
            </div>
            <div style={s.previewWrap}>
              <table style={s.previewTable}>
                <thead>
                  <tr>
                    <th style={s.th}>#</th>
                    <th style={s.th}>Name</th>
                    <th style={s.th}>Section</th>
                    <th style={s.th}>Price</th>
                    <th style={s.th}>Description</th>
                    <th style={s.th}>Vegan</th>
                    <th style={s.th}>GF</th>
                  </tr>
                </thead>
                <tbody>
                  {items.slice(0, 50).map((it, i) => (
                    <tr key={i}>
                      <td style={s.td(i % 2 === 1)}>{i + 1}</td>
                      <td style={s.td(i % 2 === 1)}><strong>{it.name}</strong></td>
                      <td style={s.td(i % 2 === 1)}>{it.section || <span style={{ color: "#bbb" }}>—</span>}</td>
                      <td style={s.td(i % 2 === 1)}>{it.price ? `$${it.price}` : <span style={{ color: "#bbb" }}>—</span>}</td>
                      <td style={s.td(i % 2 === 1)}>{it.description || <span style={{ color: "#bbb" }}>—</span>}</td>
                      <td style={s.td(i % 2 === 1)}><BoolDot val={it.is_vegan} /></td>
                      <td style={s.td(i % 2 === 1)}><BoolDot val={it.is_gluten_free} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {items.length > 50 && (
              <div style={{ fontSize: 12, color: "#888", marginBottom: 16 }}>
                Showing 50 of {items.length} rows. All {items.length} will be uploaded.
              </div>
            )}
          </>
        )}

        {uploading && <div style={s.progress}>Uploading {items?.length} items…</div>}
        {uploadErr  && <div style={s.error}>{uploadErr}</div>}

        <button type="submit" style={s.submitBtn(submitDisabled)} disabled={submitDisabled}>
          {uploading
            ? "Uploading…"
            : items
            ? `Upload ${items.length} menu item${items.length !== 1 ? "s" : ""}`
            : "Select a CSV file to continue"}
        </button>
      </form>
    </div>
  );
}
