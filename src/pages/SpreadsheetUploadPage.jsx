import { useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "../context/LanguageContext.jsx";
import { useLocation, Link } from "react-router-dom";
import { BrandLockup } from "../components/BrandLogo.jsx";
import OperatorLayout from "./operator/OperatorLayout.jsx";
import { useOperator } from "../context/OperatorContext.jsx";
import {
  RESTAURANT_SIGNUP_RESTART_ROUTE,
  persistRestaurantOnboardingState,
  resolveRestaurantOnboardingState,
} from "../lib/restaurantOnboardingState.js";

const API = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001").replace(/\/$/, "");
const MAX_FILE_BYTES = 5 * 1024 * 1024;

const TEMPLATE_HEADERS = [
  "item_name", "item_description", "section_category", "price", "available",
  "dietary_tags", "allergens_declared", "preparation_method", "dish_template",
  "owner_calories_if_known",
];
const TEMPLATE_EXAMPLE_ROWS = [
  ["Margherita Pizza", "Fresh mozzarella and basil", "Main Course", "14.99", "Y", "vegetarian", "", "baked", "pizza", ""],
  ["Caesar Salad", "Romaine, croutons, parmesan", "Salad", "11.00", "Y", "", "", "raw", "salad", ""],
  ["Grilled Chicken Sandwich", "Crispy chicken, pickles, mayo on brioche", "Main Course", "12.99", "Y", "high_protein", "wheat, eggs", "grilled", "sandwich", "540"],
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
  anchor.download = "Menuply MKS Menu Template.csv";
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

function parseBool(v) {
  const s = String(v ?? "").trim().toLowerCase();
  return s === "true" || s === "1" || s === "yes" || s === "y";
}

function csvToItems(records) {
  if (records.length < 2) return { items: [], warnings: ["CSV has no data rows."] };

  const headerRaw = records[0].map((h) => h.trim().toLowerCase());
  const colIdx = {
    // Core — supports both old and new MKS header names
    name:            headerRaw.findIndex((h) => ["name", "item_name"].includes(h)),
    description:     headerRaw.findIndex((h) => ["description", "desc", "item_description"].includes(h)),
    section:         headerRaw.findIndex((h) => ["section", "category", "section_category"].includes(h)),
    price:           headerRaw.findIndex((h) => h === "price"),
    is_vegan:        headerRaw.findIndex((h) => ["isvegan", "is_vegan", "vegan"].includes(h)),
    is_gluten_free:  headerRaw.findIndex((h) => ["isglutenfree", "is_gluten_free", "glutenfree", "gluten_free"].includes(h)),
    available:       headerRaw.findIndex((h) => ["available", "is_available", "isavailable"].includes(h)),
    dietary_tags:    headerRaw.findIndex((h) => ["dietary_tags", "diet tags", "diet_tags"].includes(h)),
    allergens_declared: headerRaw.findIndex((h) => ["allergens", "allergens_declared", "allergens (comma separated)", "allergens declared"].includes(h)),
    // Extended — all passed through to backend for JSONB preservation
    portion_size:           headerRaw.findIndex((h) => h === "portion_size"),
    portion_unit:           headerRaw.findIndex((h) => h === "portion_unit"),
    serving_count:          headerRaw.findIndex((h) => h === "serving_count"),
    protein_ounces:         headerRaw.findIndex((h) => h === "protein_ounces"),
    side_included:          headerRaw.findIndex((h) => h === "side_included"),
    side_item_name:         headerRaw.findIndex((h) => h === "side_item_name"),
    combo_included_items:   headerRaw.findIndex((h) => h === "combo_included_items"),
    kids_item:              headerRaw.findIndex((h) => h === "kids_item"),
    preparation_method:     headerRaw.findIndex((h) => h === "preparation_method"),
    coating_or_breading:    headerRaw.findIndex((h) => h === "coating_or_breading"),
    sauce_style:            headerRaw.findIndex((h) => h === "sauce_style"),
    spice_level:            headerRaw.findIndex((h) => h === "spice_level"),
    heat_level_score:       headerRaw.findIndex((h) => h === "heat_level_score"),
    cooking_fat:            headerRaw.findIndex((h) => h === "cooking_fat"),
    preparation_confidence: headerRaw.findIndex((h) => h === "preparation_confidence"),
    dish_template:          headerRaw.findIndex((h) => h === "dish_template"),
    bread_type:             headerRaw.findIndex((h) => h === "bread_type"),
    tortilla_type:          headerRaw.findIndex((h) => h === "tortilla_type"),
    rice_type:              headerRaw.findIndex((h) => h === "rice_type"),
    noodle_type:            headerRaw.findIndex((h) => h === "noodle_type"),
    protein_type:           headerRaw.findIndex((h) => h === "protein_type"),
    cheese_type:            headerRaw.findIndex((h) => h === "cheese_type"),
    primary_ingredients:    headerRaw.findIndex((h) => h === "primary_ingredients"),
    secondary_ingredients:  headerRaw.findIndex((h) => h === "secondary_ingredients"),
    toppings:               headerRaw.findIndex((h) => h === "toppings"),
    sauces:                 headerRaw.findIndex((h) => h === "sauces"),
    optional_modifiers:     headerRaw.findIndex((h) => h === "optional_modifiers"),
    primary_supplier:       headerRaw.findIndex((h) => h === "primary_supplier"),
    supplier_item_code:     headerRaw.findIndex((h) => h === "supplier_item_code"),
    portion_pack_size:      headerRaw.findIndex((h) => h === "portion_pack_size"),
    prepared_in_house:      headerRaw.findIndex((h) => h === "prepared_in_house"),
    frozen_or_fresh:        headerRaw.findIndex((h) => h === "frozen_or_fresh"),
    branded_product_used:   headerRaw.findIndex((h) => h === "branded_product_used"),
    owner_calories_if_known:    headerRaw.findIndex((h) => ["owner_calories_if_known", "calories", "calories (if known)"].includes(h)),
    owner_sodium_mg_if_known:   headerRaw.findIndex((h) => ["owner_sodium_mg_if_known", "sodium mg (if known)"].includes(h)),
    owner_protein_g_if_known:   headerRaw.findIndex((h) => ["owner_protein_g_if_known", "protein g (if known)"].includes(h)),
    owner_notes_for_nutrition:  headerRaw.findIndex((h) => h === "owner_notes_for_nutrition"),
    meal_period:            headerRaw.findIndex((h) => h === "meal_period"),
    flavor_tags:            headerRaw.findIndex((h) => h === "flavor_tags"),
    texture_tags:           headerRaw.findIndex((h) => h === "texture_tags"),
    drink_type:             headerRaw.findIndex((h) => h === "drink_type"),
    contains_alcohol:       headerRaw.findIndex((h) => h === "contains_alcohol"),
    caffeine_level:         headerRaw.findIndex((h) => h === "caffeine_level"),
  };

  if (colIdx.name < 0) {
    return { items: [], warnings: ['Required column "item_name" (or "Name") not found. Check column headers.'] };
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

    // Derive is_vegan / is_gluten_free from dietary_tags when explicit bool columns are absent
    const dtags = get(colIdx.dietary_tags).toLowerCase();
    const is_vegan = colIdx.is_vegan >= 0
      ? (get(colIdx.is_vegan) || null)
      : (dtags.includes("vegan") ? "true" : null);
    const is_gluten_free = colIdx.is_gluten_free >= 0
      ? (get(colIdx.is_gluten_free) || null)
      : ((dtags.includes("gluten_free") || dtags.includes("gluten-free")) ? "true" : null);

    items.push({
      // Core fields
      name,
      description:  get(colIdx.description) || null,
      section:      get(colIdx.section) || null,
      price:        Number.isFinite(priceNum) && priceNum >= 0 ? priceNum.toFixed(2) : null,
      is_vegan,
      is_gluten_free,
      // Standard optional
      available:           get(colIdx.available) || null,
      dietary_tags:        get(colIdx.dietary_tags) || null,
      allergens_declared:  get(colIdx.allergens_declared) || null,
      // Extended — all preserved in backend extended_attributes JSONB
      portion_size:           get(colIdx.portion_size) || null,
      portion_unit:           get(colIdx.portion_unit) || null,
      serving_count:          get(colIdx.serving_count) || null,
      protein_ounces:         get(colIdx.protein_ounces) || null,
      side_included:          get(colIdx.side_included) || null,
      side_item_name:         get(colIdx.side_item_name) || null,
      combo_included_items:   get(colIdx.combo_included_items) || null,
      kids_item:              get(colIdx.kids_item) || null,
      preparation_method:     get(colIdx.preparation_method) || null,
      coating_or_breading:    get(colIdx.coating_or_breading) || null,
      sauce_style:            get(colIdx.sauce_style) || null,
      spice_level:            get(colIdx.spice_level) || null,
      heat_level_score:       get(colIdx.heat_level_score) || null,
      cooking_fat:            get(colIdx.cooking_fat) || null,
      preparation_confidence: get(colIdx.preparation_confidence) || null,
      dish_template:          get(colIdx.dish_template) || null,
      bread_type:             get(colIdx.bread_type) || null,
      tortilla_type:          get(colIdx.tortilla_type) || null,
      rice_type:              get(colIdx.rice_type) || null,
      noodle_type:            get(colIdx.noodle_type) || null,
      protein_type:           get(colIdx.protein_type) || null,
      cheese_type:            get(colIdx.cheese_type) || null,
      primary_ingredients:    get(colIdx.primary_ingredients) || null,
      secondary_ingredients:  get(colIdx.secondary_ingredients) || null,
      toppings:               get(colIdx.toppings) || null,
      sauces:                 get(colIdx.sauces) || null,
      optional_modifiers:     get(colIdx.optional_modifiers) || null,
      primary_supplier:       get(colIdx.primary_supplier) || null,
      supplier_item_code:     get(colIdx.supplier_item_code) || null,
      portion_pack_size:      get(colIdx.portion_pack_size) || null,
      prepared_in_house:      get(colIdx.prepared_in_house) || null,
      frozen_or_fresh:        get(colIdx.frozen_or_fresh) || null,
      branded_product_used:   get(colIdx.branded_product_used) || null,
      owner_calories_if_known:    get(colIdx.owner_calories_if_known) || null,
      owner_sodium_mg_if_known:   get(colIdx.owner_sodium_mg_if_known) || null,
      owner_protein_g_if_known:   get(colIdx.owner_protein_g_if_known) || null,
      owner_notes_for_nutrition:  get(colIdx.owner_notes_for_nutrition) || null,
      meal_period:            get(colIdx.meal_period) || null,
      flavor_tags:            get(colIdx.flavor_tags) || null,
      texture_tags:           get(colIdx.texture_tags) || null,
      drink_type:             get(colIdx.drink_type) || null,
      contains_alcohol:       get(colIdx.contains_alcohol) || null,
      caffeine_level:         get(colIdx.caffeine_level) || null,
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
  const { t } = useLanguage();
  const location = useLocation();
  const { operator, selectedRestaurant } = useOperator();
  const isOperatorFlow = location.pathname.startsWith("/operator/");
  const recovery = useMemo(
    () => resolveRestaurantOnboardingState({ routeState: location.state, search: location.search }),
    [location.state, location.search]
  );

  useEffect(() => {
    if (!isOperatorFlow && recovery.hasAnyData) {
      persistRestaurantOnboardingState(recovery.state);
    }
  }, [isOperatorFlow, recovery]);

  const recoveryState = recovery.state || {};
  const state = isOperatorFlow
    ? {
        restaurant_id: selectedRestaurant?.id || null,
        restaurant_name: selectedRestaurant?.restaurant_name || "Your restaurant",
        email: operator?.email || "",
        owner_token: "",
        plan: "",
      }
    : recoveryState;
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

  const missingState = isOperatorFlow ? !selectedRestaurant?.id : recovery.missing;

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
        credentials: "include",
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

  if (missingState && isOperatorFlow) {
    return (
      <OperatorLayout title="Upload Menu">
        <p style={{ color: "#8a9ab0" }}>Select a restaurant from the operator sidebar before uploading a spreadsheet.</p>
      </OperatorLayout>
    );
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
    const content = (
      <div style={s.page}>
        {!isOperatorFlow && (
          <BrandLockup
            subtitle="for Restaurants"
            logoProps={{ width: 180, height: 112, radius: 24, pageColor: "#f6f6f3" }}
          />
        )}

        <div style={s.successBox}>
          <div style={s.successIcon}>✓</div>
          <div style={s.successTitle}>Menu uploaded successfully</div>
          <p style={s.successSub}>
            {result.items_inserted} menu item{result.items_inserted !== 1 ? "s" : ""} uploaded and pending review.
            Once approved, your menu will appear on your Menuply profile.
          </p>
          <Link to={isOperatorFlow ? "/operator/menu" : "/operator/login"} style={s.profileLink}>
            {isOperatorFlow ? "Back to Menu Lab" : "Sign in to My Account"}
          </Link>
          {!isOperatorFlow ? (
            <Link
              to={`/restaurant-profile/${restaurant_id}`}
              style={{ ...s.profileLink, marginTop: 10, background: "#fff", color: "#111", border: "1px solid #d0d5dd" }}
            >
              View restaurant profile
            </Link>
          ) : null}
          <div style={s.pendingNote}>
            {result.items_inserted} items saved · {result.items_skipped > 0 ? `${result.items_skipped} skipped · ` : ""}
            Menu status: <strong>pending review</strong>
          </div>
          <div style={{ ...s.pendingNote, marginTop: 12, lineHeight: 1.6 }}>
            Menuply will review this import. Items will appear in your Menu Lab once approved.
          </div>
        </div>
      </div>
    );
    return isOperatorFlow ? <OperatorLayout title="Upload Menu">{content}</OperatorLayout> : content;
  }

  const submitDisabled = uploading || !items || items.length === 0;

  const content = (
    <div style={s.page}>
      {!isOperatorFlow && (
        <BrandLockup
          subtitle="for Restaurants"
          logoProps={{ width: 180, height: 112, radius: 24, pageColor: "#f6f6f3" }}
        />
      )}

      {!isOperatorFlow && (
      <div style={s.steps}>
        <div style={s.step(false, true)}>1. Account</div>
        <div style={s.stepDivider} />
        <div style={s.step(false, true)}>2. Choose plan</div>
        <div style={s.stepDivider} />
        <div style={s.step(false, true)}>3. Design</div>
        <div style={s.stepDivider} />
        <div style={s.step(true, false)}>4. Upload menu</div>
      </div>
      )}

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

  return isOperatorFlow ? <OperatorLayout title="Upload Menu">{content}</OperatorLayout> : content;
}
