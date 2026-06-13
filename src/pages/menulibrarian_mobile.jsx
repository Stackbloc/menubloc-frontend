// ============================================================
// Path:    menubloc-frontend/src/pages/menulibrarian_mobile.jsx
// Date:    2026-03-20
// Purpose: MenuLibrarianBot — operator-only smartphone intake
//          page. Paste Grok-formatted MKS or structured menu
//          JSON and it auto-shelves after 1.5 s of inactivity.
//
//          Auto-save behavior:
//            • Debounce: 1500 ms after last keypress / paste
//            • Pre-flight: validates required fields + MKS
//            • Status badge: Waiting → Saving… → Shelved ✓ / Error
//            • No save button for the normal flow
//
//          Memo publish (optional, post-save):
//            • Appears only after a successful auto-save
//            • Explicit "Publish Memo" button (intentional action)
// ============================================================

import React, { useState, useRef, useCallback, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext.jsx";
import { apiGet, apiPost } from "../lib/api";

// ── Constants ────────────────────────────────────────────────
const DEBOUNCE_MS = 1500;
const DEFAULT_CITY = "Los Angeles";
const DEFAULT_STATE = "CA";

const REQUIRED_FIELDS = ["restaurant_name", "city", "state", "pasted_mks_json"];

// ── Inline styles (mobile-first) ─────────────────────────────
const S = {
  page: {
    minHeight: "100vh",
    background: "var(--gb-color-page)",
    color: "var(--gb-color-ink)",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    padding: "0 0 80px 0",
  },
  header: {
    background: "var(--gb-color-surface-strong)",
    borderBottom: "1px solid var(--gb-color-border)",
    padding: "18px 20px 14px",
  },
  headerTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    color: "var(--gb-color-ink-strong)",
    margin: 0,
    letterSpacing: "-0.3px",
  },
  subtitle: {
    fontSize: 12,
    color: "var(--gb-color-ink-muted)",
    marginTop: 3,
  },
  statusBadge: (status) => ({
    fontSize: 12,
    fontWeight: 600,
    padding: "4px 10px",
    borderRadius: 20,
    whiteSpace: "nowrap",
    flexShrink: 0,
    ...statusStyle(status),
  }),
  form: {
    padding: "20px 20px 0",
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  row: {
    display: "flex",
    gap: 12,
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    flex: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: 600,
    color: "var(--gb-color-ink-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.6px",
  },
  required: {
    color: "#ff6b6b",
    marginLeft: 2,
  },
  input: (hasError) => ({
    background: "var(--gb-color-surface-strong)",
    border: `1.5px solid ${hasError ? "#ff6b6b" : "var(--gb-color-border)"}`,
    borderRadius: 10,
    color: "var(--gb-color-ink)",
    fontSize: 16,
    padding: "12px 14px",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    WebkitAppearance: "none",
    transition: "border-color 0.15s",
  }),
  textarea: (hasError) => ({
    background: "var(--gb-color-surface-strong)",
    border: `1.5px solid ${hasError ? "#ff6b6b" : "var(--gb-color-border)"}`,
    borderRadius: 10,
    color: "var(--gb-color-ink)",
    fontSize: 14,
    fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
    lineHeight: 1.5,
    padding: "14px",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    resize: "vertical",
    minHeight: 220,
    WebkitAppearance: "none",
    transition: "border-color 0.15s",
  }),
  hint: {
    fontSize: 11,
    color: "var(--gb-color-ink-muted)",
    marginTop: 2,
  },
  errorText: {
    fontSize: 12,
    color: "#ff6b6b",
    marginTop: 2,
  },
  divider: {
    height: 1,
    background: "var(--gb-color-border)",
    margin: "4px 0",
  },
  successCard: {
    margin: "20px 20px 0",
    background: "rgba(34,197,94,0.08)",
    border: "1.5px solid rgba(34,197,94,0.25)",
    borderRadius: 12,
    padding: "16px",
  },
  successTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: "#16a34a",
    marginBottom: 8,
  },
  successRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: 13,
    color: "var(--gb-color-ink)",
    marginBottom: 6,
  },
  successLabel: {
    color: "var(--gb-color-ink-muted)",
    fontSize: 12,
  },
  successValue: {
    color: "var(--gb-color-ink-strong)",
    fontWeight: 600,
  },
  profileLink: {
    display: "inline-block",
    marginTop: 10,
    fontSize: 13,
    fontWeight: 600,
    color: "#16a34a",
    textDecoration: "none",
    padding: "8px 14px",
    border: "1.5px solid rgba(34,197,94,0.3)",
    borderRadius: 8,
  },
  memoSection: {
    margin: "20px 20px 0",
    background: "var(--gb-color-surface-strong)",
    border: "1.5px solid var(--gb-color-border)",
    borderRadius: 12,
    padding: "16px",
  },
  memoTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: "var(--gb-color-ink-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.6px",
    marginBottom: 14,
  },
  publishBtn: (disabled) => ({
    width: "100%",
    padding: "14px",
    background: disabled ? "rgba(0,0,0,0.04)" : "rgba(34,197,94,0.12)",
    border: `1.5px solid ${disabled ? "var(--gb-color-border)" : "rgba(34,197,94,0.3)"}`,
    borderRadius: 10,
    color: disabled ? "var(--gb-color-ink-muted)" : "#16a34a",
    fontSize: 15,
    fontWeight: 700,
    cursor: disabled ? "not-allowed" : "pointer",
    marginTop: 14,
    transition: "all 0.15s",
  }),
  retryBtn: {
    background: "transparent",
    border: "1.5px solid #ff6b6b",
    borderRadius: 8,
    color: "#ff6b6b",
    fontSize: 13,
    fontWeight: 600,
    padding: "8px 14px",
    cursor: "pointer",
    marginTop: 8,
    width: "100%",
  },
  memoSuccessBadge: {
    background: "rgba(34,197,94,0.08)",
    border: "1.5px solid rgba(34,197,94,0.3)",
    borderRadius: 8,
    color: "#16a34a",
    fontSize: 13,
    fontWeight: 600,
    padding: "10px 14px",
    textAlign: "center",
    marginTop: 10,
  },
  errorCard: {
    margin: "12px 20px 0",
    background: "rgba(220,38,38,0.06)",
    border: "1.5px solid rgba(220,38,38,0.2)",
    borderRadius: 10,
    padding: "12px 14px",
    fontSize: 13,
    color: "#dc2626",
    lineHeight: 1.5,
  },
};

// ── Status badge colours ─────────────────────────────────────
function statusStyle(status) {
  switch (status) {
    case "debouncing":
      return { background: "rgba(0,0,0,0.04)", color: "var(--gb-color-ink-muted)", border: "1px solid var(--gb-color-border)" };
    case "saving":
      return { background: "rgba(59,130,246,0.08)", color: "#2563eb", border: "1px solid rgba(59,130,246,0.2)" };
    case "saved":
      return { background: "rgba(34,197,94,0.08)", color: "#16a34a", border: "1px solid rgba(34,197,94,0.3)" };
    case "error":
      return { background: "rgba(220,38,38,0.08)", color: "#dc2626", border: "1px solid rgba(220,38,38,0.2)" };
    default:
      return { background: "var(--gb-color-surface-strong)", color: "var(--gb-color-ink-muted)", border: "1px solid var(--gb-color-border)" };
  }
}

function statusLabel(status, inputType) {
  switch (status) {
    case "debouncing": return "•••";
    case "saving":     return "Saving…";
    case "saved":      return inputType === "json" ? "✓ Shelved (JSON)" : "✓ Shelved (text)";
    case "error":      return "✗ Error";
    default:           return "Waiting";
  }
}

// Detect the format of pasted content so the operator knows
// before saving which storage path will be used.
function detectInputFormat(raw) {
  const t = raw.trim();
  if (!t) return null;
  if (t.startsWith("{") || t.startsWith("[")) return "json";
  if (t.length >= 30) return "text";
  return null;
}

// ── Client-side pre-flight validation ────────────────────────
function preflight(form) {
  const errors = {};

  if (!form.restaurant_name.trim())
    errors.restaurant_name = "Required";
  if (!form.city.trim())
    errors.city = "Required";
  if (!form.state.trim())
    errors.state = "Required";

  const mks = form.pasted_mks_json.trim();
  if (!mks) {
    errors.pasted_mks_json = "Paste category-structured text or MKS JSON here.";
  } else if (mks.startsWith("{") || mks.startsWith("[")) {
    try {
      JSON.parse(mks);
    } catch (e) {
      errors.pasted_mks_json = `Invalid JSON — ${e.message}`;
    }
  } else if (mks.length < 30) {
    errors.pasted_mks_json = "Too short to be valid menu content.";
  }

  return errors;
}

// ── SearchableSelect ─────────────────────────────────────────
// Minimal type-to-filter dropdown. Works on iOS/Android —
// uses onMouseDown on list items so blur fires after selection.
function SearchableSelect({ options, value, onChange, placeholder, hasError }) {
  const [query, setQuery]   = useState("");
  const [open, setOpen]     = useState(false);
  const inputRef            = useRef(null);

  const selectedLabel = options.find((o) => o.value === value)?.label || "";

  const filtered = query.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  function handleFocus() {
    setQuery("");
    setOpen(true);
  }

  function handleBlur() {
    // Small delay lets onMouseDown on a list item fire first
    setTimeout(() => {
      setOpen(false);
      setQuery("");
    }, 150);
  }

  function handleSelect(opt) {
    onChange(opt.value);
    setOpen(false);
    setQuery("");
    inputRef.current?.blur();
  }

  function handleClear(e) {
    e.stopPropagation();
    onChange("");
    setQuery("");
  }

  const inputStyle = {
    background: "var(--gb-color-surface-strong)",
    border: `1.5px solid ${hasError ? "#ff6b6b" : open ? "var(--gb-color-border-strong)" : "var(--gb-color-border)"}`,
    borderRadius: open ? "10px 10px 0 0" : 10,
    color: open ? "var(--gb-color-ink)" : value ? "var(--gb-color-ink)" : "var(--gb-color-ink-muted)",
    fontSize: 16,
    padding: "12px 36px 12px 14px",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    WebkitAppearance: "none",
    transition: "border-color 0.15s",
    cursor: "pointer",
  };

  const dropdownStyle = {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    background: "var(--gb-color-surface-strong)",
    border: "1.5px solid var(--gb-color-border-strong)",
    borderTop: "none",
    borderRadius: "0 0 10px 10px",
    maxHeight: 220,
    overflowY: "auto",
    zIndex: 100,
    WebkitOverflowScrolling: "touch",
  };

  const itemStyle = (hovered) => ({
    padding: "12px 14px",
    fontSize: 15,
    color: "var(--gb-color-ink)",
    cursor: "pointer",
    borderBottom: "1px solid var(--gb-color-border)",
    background: hovered ? "rgba(18,34,28,0.06)" : "transparent",
  });

  return (
    <div style={{ position: "relative" }}>
      <input
        ref={inputRef}
        style={inputStyle}
        type="text"
        placeholder={open ? "Type to filter…" : (selectedLabel || placeholder)}
        value={open ? query : selectedLabel}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        readOnly={!open}
      />
      {/* Clear button */}
      {value && !open && (
        <span
          onMouseDown={handleClear}
          style={{
            position: "absolute", right: 12, top: "50%",
            transform: "translateY(-50%)",
            color: "var(--gb-color-ink-muted)", fontSize: 18, cursor: "pointer", lineHeight: 1,
          }}
        >×</span>
      )}
      {/* Chevron */}
      {!value && (
        <span style={{
          position: "absolute", right: 12, top: "50%",
          transform: `translateY(-50%) rotate(${open ? "180deg" : "0deg"})`,
          color: "var(--gb-color-ink-muted)", fontSize: 11, pointerEvents: "none",
          transition: "transform 0.15s",
        }}>▼</span>
      )}
      {open && (
        <div style={dropdownStyle}>
          {filtered.length === 0 ? (
            <div style={{ padding: "12px 14px", color: "var(--gb-color-ink-muted)", fontSize: 14 }}>
              No matches
            </div>
          ) : (
            filtered.map((opt) => (
              <div
                key={opt.value}
                style={itemStyle(false)}
                onMouseDown={() => handleSelect(opt)}
                onTouchEnd={() => handleSelect(opt)}
              >
                {opt.label}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// Null-byte separator prevents false matches if a value contains "|"
function makeKey(f) {
  return [f.restaurant_name, f.city, f.state, f.pasted_mks_json, f.phone, f.website, f.category, f.cuisine].join("\0");
}

function allRequiredFilled(form) {
  return (
    form.restaurant_name.trim() &&
    form.city.trim() &&
    form.state.trim() &&
    form.pasted_mks_json.trim()
  );
}

// ── Component ─────────────────────────────────────────────────
export default function OperatorIntakePage() {
  const { t } = useLanguage();
  const [form, setForm] = useState({
    restaurant_name: "",
    city: DEFAULT_CITY,
    state: DEFAULT_STATE,
    phone: "",
    website: "",
    category: "",
    cuisine: "",
    pasted_mks_json: "",
    memo_title: "",
    memo_body: "",
  });

  const [categories, setCategories] = useState([]);
  const [cuisines,   setCuisines]   = useState([]);

  // Fetch meta options once on mount
  useEffect(() => {
    apiGet("/api/meta/categories")
      .then((d) => setCategories(d.categories || []))
      .catch(() => {}); // non-fatal — dropdowns just stay empty
    apiGet("/api/meta/cuisines")
      .then((d) => setCuisines(d.cuisines || []))
      .catch(() => {});
  }, []);

  const [fieldErrors, setFieldErrors] = useState({});
  const [saveStatus, setSaveStatus] = useState("idle"); // idle | debouncing | saving | saved | error
  const [saveError, setSaveError] = useState(null);
  const [saveResult, setSaveResult] = useState(null);

  const [memoStatus, setMemoStatus] = useState("idle"); // idle | saving | saved | error
  const [memoError, setMemoError] = useState(null);

  // ── Refs ─────────────────────────────────────────────────
  const lastSavedKeyRef   = useRef(null);
  const debounceTimerRef  = useRef(null);

  // ── Save implementation ───────────────────────────────────
  // Receives a snapshot at call time — no stale closure risk.
  const doSave = useCallback(async (snapshot) => {
    const errors = preflight(snapshot);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setSaveStatus("idle");
      return;
    }

    setSaveStatus("saving");
    setSaveError(null);

    try {
      const result = await apiPost("/api/operator/intake", {
        restaurant_name: snapshot.restaurant_name.trim(),
        city:            snapshot.city.trim(),
        state:           snapshot.state.trim(),
        phone:           snapshot.phone.trim()     || undefined,
        website:         snapshot.website.trim()   || undefined,
        category:        snapshot.category.trim()  || undefined,
        cuisine:         snapshot.cuisine.trim()   || undefined,
        pasted_mks_json: snapshot.pasted_mks_json.trim(),
      });

      lastSavedKeyRef.current = makeKey(snapshot);
      setSaveResult(result);
      setSaveStatus("saved");
      setFieldErrors({});
      setMemoStatus("idle");
      setMemoError(null);
    } catch (err) {
      setSaveStatus("error");
      setSaveError(err?.error || err?.message || "Save failed — check connection.");
    }
  }, []);

  // ── Debounce scheduler ────────────────────────────────────
  // Called from handleChange with the freshly-computed nextForm.
  // nextForm is passed directly — no useEffect, no stale closure.
  const scheduleAutosave = useCallback((nextForm) => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    if (!allRequiredFilled(nextForm)) {
      setSaveStatus("idle");
      return;
    }

    if (makeKey(nextForm) === lastSavedKeyRef.current) {
      setSaveStatus("saved");
      return;
    }

    setSaveStatus("debouncing");
    debounceTimerRef.current = setTimeout(() => doSave(nextForm), DEBOUNCE_MS);
  }, [doSave]);

  // ── Field change handler (text inputs) ───────────────────
  const handleChange = (field) => (e) => {
    const nextForm = { ...form, [field]: e.target.value };
    setForm(nextForm);
    scheduleAutosave(nextForm);
    if (fieldErrors[field]) {
      setFieldErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
    }
  };

  // ── Select change handler (SearchableSelect) ──────────────
  const handleSelectChange = (field) => (value) => {
    const nextForm = { ...form, [field]: value };
    setForm(nextForm);
    scheduleAutosave(nextForm);
    if (fieldErrors[field]) {
      setFieldErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
    }
  };

  // ── Memo publish ──────────────────────────────────────────
  const handlePublishMemo = async () => {
    if (!saveResult?.intake_id) return;
    if (!form.memo_title.trim() && !form.memo_body.trim()) {
      setMemoError("Add a memo title or body before publishing.");
      return;
    }

    setMemoStatus("saving");
    setMemoError(null);

    try {
      await apiPost(`/api/operator/intake/${saveResult.intake_id}/memo`, {
        memo_title: form.memo_title.trim() || undefined,
        memo_body: form.memo_body.trim() || undefined,
      });
      setMemoStatus("saved");
    } catch (err) {
      setMemoStatus("error");
      setMemoError(err?.error || err?.message || "Memo publish failed.");
    }
  };

  // ── Retry after error ─────────────────────────────────────
  const handleRetry = () => {
    setSaveError(null);
    lastSavedKeyRef.current = null; // force re-save on next schedule
    scheduleAutosave(form);
  };

  const memoPublishDisabled =
    memoStatus === "saving" ||
    memoStatus === "saved" ||
    (!form.memo_title.trim() && !form.memo_body.trim());

  // ── Render ───────────────────────────────────────────────
  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <div style={S.headerTop}>
          <div>
            <p style={S.title}>📚 MenuLibrarianBot</p>
            <p style={S.subtitle}>Operator intake · text or JSON</p>
          </div>
          <span style={S.statusBadge(saveStatus)}>
            {statusLabel(saveStatus, saveResult?.input_type)}
          </span>
        </div>
      </div>

      {/* Form */}
      <div style={S.form}>

        {/* Restaurant Name */}
        <div style={S.fieldGroup}>
          <label style={S.label}>
            Restaurant Name<span style={S.required}>*</span>
          </label>
          <input
            style={S.input(!!fieldErrors.restaurant_name)}
            type="text"
            placeholder="e.g. Bestia"
            value={form.restaurant_name}
            onChange={handleChange("restaurant_name")}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
          {fieldErrors.restaurant_name && (
            <span style={S.errorText}>{fieldErrors.restaurant_name}</span>
          )}
        </div>

        {/* City + State */}
        <div style={S.row}>
          <div style={S.fieldGroup}>
            <label style={S.label}>
              City<span style={S.required}>*</span>
            </label>
            <input
              style={S.input(!!fieldErrors.city)}
              type="text"
              placeholder="Los Angeles"
              value={form.city}
              onChange={handleChange("city")}
              autoComplete="off"
            />
            {fieldErrors.city && (
              <span style={S.errorText}>{fieldErrors.city}</span>
            )}
          </div>
          <div style={{ ...S.fieldGroup, maxWidth: 90 }}>
            <label style={S.label}>
              State<span style={S.required}>*</span>
            </label>
            <input
              style={S.input(!!fieldErrors.state)}
              type="text"
              placeholder="CA"
              value={form.state}
              onChange={handleChange("state")}
              maxLength={2}
              autoCapitalize="characters"
              autoComplete="off"
            />
            {fieldErrors.state && (
              <span style={S.errorText}>{fieldErrors.state}</span>
            )}
          </div>
        </div>

        {/* Phone + Website */}
        <div style={S.row}>
          <div style={S.fieldGroup}>
            <label style={S.label}>Phone <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, color: "var(--gb-color-ink-muted)" }}>— for duplicate check</span></label>
            <input
              style={S.input(false)}
              type="tel"
              placeholder="(213) 555-0100"
              value={form.phone}
              onChange={handleChange("phone")}
              autoComplete="off"
            />
          </div>
          <div style={S.fieldGroup}>
            <label style={S.label}>Website</label>
            <input
              style={S.input(false)}
              type="url"
              placeholder="bestia.com"
              value={form.website}
              onChange={handleChange("website")}
              autoComplete="off"
              autoCorrect="off"
            />
          </div>
        </div>

        {/* Category + Cuisine */}
        <div style={S.row}>
          <div style={S.fieldGroup}>
            <label style={S.label}>Category</label>
            <SearchableSelect
              options={categories}
              value={form.category}
              onChange={handleSelectChange("category")}
              placeholder="e.g. Casual Dining"
              hasError={!!fieldErrors.category}
            />
            {fieldErrors.category && (
              <span style={S.errorText}>{fieldErrors.category}</span>
            )}
          </div>
          <div style={S.fieldGroup}>
            <label style={S.label}>Cuisine</label>
            <SearchableSelect
              options={cuisines}
              value={form.cuisine}
              onChange={handleSelectChange("cuisine")}
              placeholder="e.g. Mexican"
              hasError={!!fieldErrors.cuisine}
            />
            {fieldErrors.cuisine && (
              <span style={S.errorText}>{fieldErrors.cuisine}</span>
            )}
          </div>
        </div>

        {/* Menu Content Paste Area */}
        <div style={S.fieldGroup}>
          <label style={S.label}>
            Menu Content<span style={S.required}>*</span>
          </label>
          <textarea
            style={S.textarea(!!fieldErrors.pasted_mks_json)}
            placeholder={
              "Structured text (accepted):\n" +
              "  APPETIZERS\n" +
              "  Burrata — $18\n" +
              "  House Salad — $14\n\n" +
              "  ENTREES\n" +
              "  Pasta Bolognese — $24\n\n" +
              "MKS JSON (also accepted):\n" +
              '  { "sections": [{ "name": "Appetizers",\n' +
              '    "items": [{ "name": "Burrata", "price": 18 }]}]}'
            }
            value={form.pasted_mks_json}
            onChange={handleChange("pasted_mks_json")}
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
          />
          {fieldErrors.pasted_mks_json ? (
            <span style={S.errorText}>{fieldErrors.pasted_mks_json}</span>
          ) : (() => {
            const detected = detectInputFormat(form.pasted_mks_json);
            return (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={S.hint}>
                  Auto-shelves {DEBOUNCE_MS / 1000}s after you paste. No save button needed.
                </span>
                {detected && (
                  <span style={{
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "2px 8px",
                    borderRadius: 6,
                    flexShrink: 0,
                    marginLeft: 8,
                    ...(detected === "json"
                      ? { background: "rgba(59,130,246,0.08)", color: "#2563eb", border: "1px solid rgba(59,130,246,0.2)" }
                      : { background: "rgba(124,58,237,0.08)", color: "#7c3aed", border: "1px solid rgba(124,58,237,0.2)" }),
                  }}>
                    {detected === "json" ? "MKS JSON" : "Structured text"}
                  </span>
                )}
              </div>
            );
          })()}
        </div>

      </div>

      {/* Save error card */}
      {saveStatus === "error" && saveError && (
        <div style={S.errorCard}>
          <strong>Could not shelve:</strong> {saveError}
          <button style={S.retryBtn} onClick={handleRetry}>
            Retry
          </button>
        </div>
      )}

      {/* Success card */}
      {saveStatus === "saved" && saveResult && (
        <div style={S.successCard}>
          <p style={S.successTitle}>✓ Intake Shelved</p>

          <div style={S.successRow}>
            <span style={S.successLabel}>Restaurant</span>
            <span style={S.successValue}>{saveResult.restaurant_name}</span>
          </div>

          <div style={S.successRow}>
            <span style={S.successLabel}>Status</span>
            <span style={S.successValue}>
              {saveResult.match_status === "matched_existing"
                ? "Matched existing profile"
                : "Created new profile"}
            </span>
          </div>

          <div style={S.successRow}>
            <span style={S.successLabel}>Saved as</span>
            <span style={{
              ...S.successValue,
              ...(saveResult.input_type === "json"
                ? { color: "#2563eb" }
                : { color: "#7c3aed" }),
            }}>
              {saveResult.input_type === "json" ? "Structured JSON" : "Structured text"}
            </span>
          </div>

          {form.category && (
            <div style={S.successRow}>
              <span style={S.successLabel}>Category</span>
              <span style={S.successValue}>
                {categories.find((c) => c.value === form.category)?.label || form.category}
              </span>
            </div>
          )}
          {form.cuisine && (
            <div style={S.successRow}>
              <span style={S.successLabel}>Cuisine</span>
              <span style={S.successValue}>
                {cuisines.find((c) => c.value === form.cuisine)?.label || form.cuisine}
              </span>
            </div>
          )}
          <div style={S.successRow}>
            <span style={S.successLabel}>Intake ID</span>
            <span style={S.successValue}>#{saveResult.intake_id}</span>
          </div>

          <a
            href={saveResult.profile_path}
            target="_blank"
            rel="noopener noreferrer"
            style={S.profileLink}
          >
            View Profile →
          </a>
        </div>
      )}

      {/* Optional memo — only shown after successful save */}
      {saveStatus === "saved" && saveResult && memoStatus !== "saved" && (
        <div style={S.memoSection}>
          <p style={S.memoTitle}>Optional Memo</p>

          <div style={{ ...S.fieldGroup, marginBottom: 12 }}>
            <label style={S.label}>Memo Title</label>
            <input
              style={S.input(false)}
              type="text"
              placeholder="e.g. Visited March 2026"
              value={form.memo_title}
              onChange={handleChange("memo_title")}
            />
          </div>

          <div style={S.fieldGroup}>
            <label style={S.label}>Memo Body</label>
            <textarea
              style={{ ...S.textarea(false), minHeight: 100 }}
              placeholder="Field notes, context, impressions…"
              value={form.memo_body}
              onChange={handleChange("memo_body")}
            />
          </div>

          {memoError && (
            <span style={{ ...S.errorText, display: "block", marginTop: 8 }}>
              {memoError}
            </span>
          )}

          <button
            style={S.publishBtn(memoPublishDisabled)}
            disabled={memoPublishDisabled}
            onClick={handlePublishMemo}
          >
            {memoStatus === "saving" ? "Publishing…" : "Publish Memo"}
          </button>
        </div>
      )}

      {/* Memo success */}
      {memoStatus === "saved" && (
        <div style={S.memoSection}>
          <p style={S.memoSuccessBadge}>✓ Memo published</p>
        </div>
      )}
    </div>
  );
}
