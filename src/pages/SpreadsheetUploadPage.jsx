import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { BrandLockup } from "../components/BrandLogo.jsx";
import {
  RESTAURANT_SIGNUP_RESTART_ROUTE,
  persistRestaurantOnboardingState,
  resolveRestaurantOnboardingState,
} from "../lib/restaurantOnboardingState.js";

const API = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001").replace(/\/$/, "");
const MAX_FILE_BYTES = 5 * 1024 * 1024;

const TEMPLATE_HEADERS = ["Name", "Description", "Section", "Price", "IsVegan", "IsGlutenFree"];
const TEMPLATE_EXAMPLE_ROWS = [
  ["Margherita Pizza", "Fresh mozzarella and basil", "Pizzas", "14.99", "TRUE", "FALSE"],
  ["Caesar Salad", "Romaine, croutons, parmesan", "Salads", "11.00", "FALSE", "FALSE"],
  ["Spaghetti Aglio e Olio", "Garlic, olive oil, chili flakes", "Pasta", "13.50", "TRUE", "FALSE"],
];

function generateTemplateCsv() {
  const rows = [TEMPLATE_HEADERS, ...TEMPLATE_EXAMPLE_ROWS];
  return rows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
}

function downloadTemplate() {
  const csv = generateTemplateCsv();
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "Grubbid Menu Upload Template.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

function parseCSV(text) {
  const raw = text.replace(/^\uFEFF/, "");
  const records = [];
  let current = "";
  let inQuote = false;
  let fields = [];

  for (let index = 0; index < raw.length; index += 1) {
    const ch = raw[index];
    const next = raw[index + 1];

    if (ch === "\"") {
      if (inQuote && next === "\"") {
        current += "\"";
        index += 1;
      } else {
        inQuote = !inQuote;
      }
    } else if (ch === "," && !inQuote) {
      fields.push(current);
      current = "";
    } else if ((ch === "\n" || ch === "\r") && !inQuote) {
      fields.push(current);
      current = "";
      records.push(fields);
      fields = [];
      if (ch === "\r" && next === "\n") index += 1;
    } else {
      current += ch;
    }
  }

  if (current || fields.length) {
    fields.push(current);
    if (fields.some((field) => field !== "")) records.push(fields);
  }

  return records;
}

function csvToItems(records) {
  if (records.length < 2) return { items: [], warnings: ["CSV has no data rows."] };

  const headerRaw = records[0].map((header) => header.trim().toLowerCase());
  const colIdx = {
    name: headerRaw.findIndex((header) => header === "name"),
    description: headerRaw.findIndex((header) => ["description", "desc"].includes(header)),
    section: headerRaw.findIndex((header) => ["section", "category"].includes(header)),
    price: headerRaw.findIndex((header) => header === "price"),
    is_vegan: headerRaw.findIndex((header) => ["isvegan", "is_vegan", "vegan"].includes(header)),
    is_gluten_free: headerRaw.findIndex((header) => ["isglutenfree", "is_gluten_free", "glutenfree", "gluten_free"].includes(header)),
  };

  if (colIdx.name < 0) {
    return { items: [], warnings: ['Required column "Name" not found. Check column headers.'] };
  }

  const items = [];
  const warnings = [];

  for (let rowIndex = 1; rowIndex < records.length; rowIndex += 1) {
    const row = records[rowIndex];
    const get = (idx) => (idx >= 0 ? (row[idx] ?? "").trim() : "");

    const name = get(colIdx.name);
    if (!name) continue;

    const priceRaw = get(colIdx.price);
    const priceNum = priceRaw ? parseFloat(priceRaw.replace(/[^0-9.]/g, "")) : null;

    items.push({
      name,
      description: get(colIdx.description) || null,
      section: get(colIdx.section) || null,
      price: Number.isFinite(priceNum) && priceNum >= 0 ? priceNum.toFixed(2) : null,
      is_vegan: get(colIdx.is_vegan) || null,
      is_gluten_free: get(colIdx.is_gluten_free) || null,
    });

    if (!Number.isFinite(priceNum) && priceRaw) {
      warnings.push(`Row ${rowIndex + 1}: could not parse price "${priceRaw}" — it will be saved as null.`);
    }
  }

  return { items, warnings };
}

const s = {
  page: {
    maxWidth: 700,
    margin: "40px auto",
    padding: "0 20px 80px",
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
    color: "#111",
  },
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
  heading: { fontSize: 22, fontWeight: 800, marginBottom: 4 },
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
  templateSection: {
    border: "1px solid #e5e5e5",
    borderRadius: 12,
    padding: "16px 18px",
    marginBottom: 24,
    background: "#fafafa",
  },
  templateTitle: { fontWeight: 700, fontSize: 14, marginBottom: 4 },
  templateDesc: { fontSize: 13, color: "#555", marginBottom: 12, lineHeight: 1.5 },
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
  dropIcon: { fontSize: 36, marginBottom: 10, lineHeight: 1 },
  dropTitle: { fontSize: 15, fontWeight: 700, marginBottom: 6 },
  dropSub: { fontSize: 13, color: "#666", lineHeight: 1.5 },
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
  successBox: {
    border: "2px solid #2a7a2a",
    borderRadius: 16,
    padding: "32px 28px",
    textAlign: "center",
    background: "#f0fbf0",
  },
  successIcon: { fontSize: 48, marginBottom: 12, lineHeight: 1 },
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
  restartBtn: {
    display: "inline-flex",
    marginTop: 14,
    padding: "10px 14px",
    borderRadius: 10,
    background: "#111",
    color: "#fff",
    fontWeight: 700,
    textDecoration: "none",
  },
};

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function BoolDot({ val }) {
  if (val === null || val === undefined || val === "") return <span style={{ color: "#bbb" }}>—</span>;
  const normalized = String(val).toLowerCase();
  const truthy = normalized === "true" || normalized === "1" || normalized === "yes";
  return <span style={{ color: truthy ? "#2a7a2a" : "#888" }}>{truthy ? "Yes" : "No"}</span>;
}

export default function SpreadsheetUploadPage() {
  const location = useLocation();
  const recovery = useMemo(
    () => resolveRestaurantOnboardingState({ routeState: location.state, search: location.search }),
    [location.state, location.search]
  );

  useEffect(() => {
    if (recovery.hasAnyData) {
      persistRestaurantOnboardingState(recovery.state);
    }
  }, [recovery]);

  const state = recovery.state || {};
  const {
    restaurant_id,
    restaurant_name = "Your restaurant",
    email = "",
    owner_token = "",
    plan = "",
  } = state;

  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileError, setFileError] = useState("");
  const [items, setItems] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState("");
  const [result, setResult] = useState(null);

  const missingState = recovery.missing;

  function validateAndSetFile(chosen) {
    setFileError("");
    setUploadErr("");
    setItems(null);
    setWarnings([]);

    if (!chosen) return;

    const isCsv = chosen.type === "text/csv" || chosen.name.toLowerCase().endsWith(".csv");
    if (!isCsv) {
      setFileError("Only CSV files are accepted. Download the template below, fill it in, and save as CSV.");
      return;
    }
    if (chosen.size > MAX_FILE_BYTES) {
      setFileError(`File is too large (${formatBytes(chosen.size)}). Maximum is 5 MB.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const records = parseCSV(text);
        const { items: parsed, warnings: nextWarnings } = csvToItems(records);

        if (parsed.length === 0) {
          setFileError(nextWarnings.length ? nextWarnings[0] : "No valid rows found in this file.");
          return;
        }

        setFile(chosen);
        setItems(parsed);
        setWarnings(nextWarnings);
      } catch (error) {
        setFileError(`Could not parse CSV: ${error.message}`);
      }
    };
    reader.onerror = () => setFileError("Could not read the file.");
    reader.readAsText(chosen, "utf-8");
  }

  function onDragOver(event) {
    event.preventDefault();
    setIsDragOver(true);
  }

  function onDragLeave() {
    setIsDragOver(false);
  }

  function onDrop(event) {
    event.preventDefault();
    setIsDragOver(false);
    validateAndSetFile(event.dataTransfer.files?.[0] || null);
  }

  function onDropZoneClick() {
    fileInputRef.current?.click();
  }

  function onFileChange(event) {
    validateAndSetFile(event.target.files?.[0] || null);
    event.target.value = "";
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!items || items.length === 0) {
      setFileError("No valid items to upload.");
      return;
    }

    setUploading(true);
    setUploadErr("");

    try {
      const res = await fetch(`${API}/menu-upload/spreadsheet`, {
        method: "POST",
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
    } catch (error) {
      setUploadErr(error.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  if (missingState) {
    return (
      <div style={s.page}>
        <BrandLockup
          subtitle="for Restaurants"
          logoProps={{ width: 180, height: 112, radius: 24, pageColor: "#f6f6f3" }}
        />
        <div style={{ ...s.error, marginTop: 24 }}>
          <strong>We could not recover your restaurant signup session.</strong><br />
          Restart signup to continue with the spreadsheet menu upload.
          <br />
          <Link to={RESTAURANT_SIGNUP_RESTART_ROUTE} style={s.restartBtn}>
            Restart restaurant signup
          </Link>
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <div style={s.page}>
        <BrandLockup
          subtitle="for Restaurants"
          logoProps={{ width: 180, height: 112, radius: 24, pageColor: "#f6f6f3" }}
        />

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
            {result.items_inserted} items saved · {result.items_skipped > 0 ? `${result.items_skipped} skipped · ` : ""}
            Menu status: <strong>pending review</strong>
          </div>
        </div>
      </div>
    );
  }

  const submitDisabled = uploading || !items || items.length === 0;

  return (
    <div style={s.page}>
      <BrandLockup
        subtitle="for Restaurants"
        logoProps={{ width: 180, height: 112, radius: 24, pageColor: "#f6f6f3" }}
      />

      <div style={s.steps}>
        <div style={s.step(false, true)}>1. Account</div>
        <div style={s.stepDivider} />
        <div style={s.step(false, true)}>2. Choose plan</div>
        <div style={s.stepDivider} />
        <div style={s.step(false, true)}>3. Design</div>
        <div style={s.stepDivider} />
        <div style={s.step(true, false)}>4. Upload menu</div>
      </div>

      <div style={s.heading}>Upload your menu via spreadsheet</div>
      <div style={s.subheading}>
        Download the template, fill in your menu items, save as CSV, and upload below.
      </div>

      <div style={s.contextCard}>
        <span>
          <span style={s.contextLabel}>Restaurant</span>
          {restaurant_name}
        </span>
        {plan ? <span style={s.planBadge(plan)}>{plan}</span> : null}
      </div>

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
          {TEMPLATE_HEADERS.map((header, index) => (
            <span key={header}>
              <strong>{header}</strong>{index === 0 ? " (required)" : " (optional)"}
              {index < TEMPLATE_HEADERS.length - 1 ? " · " : ""}
            </span>
          ))}
        </div>
      </div>

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
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onDropZoneClick();
            }
          }}
        >
          <div style={s.dropIcon}>📊</div>
          <div style={s.dropTitle}>Upload your CSV menu file</div>
          <div style={s.dropSub}>Drag and drop the file here or tap to browse.</div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            style={{ display: "none" }}
            onChange={onFileChange}
          />
        </div>

        {file ? (
          <div style={s.fileInfo}>
            <span style={s.fileName}>{file.name}</span>
            <span style={s.fileSize}>{formatBytes(file.size)}</span>
            <button type="button" style={s.clearBtn} onClick={() => setFile(null)} aria-label="Clear selected file">
              ×
            </button>
          </div>
        ) : null}

        {fileError ? <div style={s.error}>{fileError}</div> : null}
        {uploadErr ? <div style={s.error}>{uploadErr}</div> : null}
        {uploading ? <div style={s.progress}>Uploading your spreadsheet now...</div> : null}

        {warnings.map((warning) => (
          <div key={warning} style={s.warning}>{warning}</div>
        ))}

        {items?.length ? (
          <>
            <div style={s.previewCount}>
              Previewing {items.length} parsed row{items.length !== 1 ? "s" : ""}
            </div>
            <div style={s.previewWrap}>
              <table style={s.previewTable}>
                <thead>
                  <tr>
                    <th style={s.th}>Name</th>
                    <th style={s.th}>Description</th>
                    <th style={s.th}>Section</th>
                    <th style={s.th}>Price</th>
                    <th style={s.th}>Vegan</th>
                    <th style={s.th}>Gluten Free</th>
                  </tr>
                </thead>
                <tbody>
                  {items.slice(0, 25).map((item, index) => (
                    <tr key={`${item.name}-${index}`}>
                      <td style={s.td(index % 2 === 1)}>{item.name}</td>
                      <td style={s.td(index % 2 === 1)}>{item.description || "—"}</td>
                      <td style={s.td(index % 2 === 1)}>{item.section || "—"}</td>
                      <td style={s.td(index % 2 === 1)}>{item.price || "—"}</td>
                      <td style={s.td(index % 2 === 1)}><BoolDot val={item.is_vegan} /></td>
                      <td style={s.td(index % 2 === 1)}><BoolDot val={item.is_gluten_free} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : null}

        <button type="submit" style={s.submitBtn(submitDisabled)} disabled={submitDisabled}>
          {uploading ? "Uploading..." : "Upload spreadsheet menu"}
        </button>
      </form>
    </div>
  );
}
