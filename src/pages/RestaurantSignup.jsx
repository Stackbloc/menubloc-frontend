/**
 * ============================================================
 * File: menubloc-frontend/src/pages/RestaurantSignup.jsx
 * Purpose:
 *   Restaurant owner signup page.
 *   Collects account info, restaurant info, and menu
 *   ingestion method, then POSTs to /restaurants/signup.
 * ============================================================
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const INGESTION_REDIRECT = {
  ocr: "/restaurant/ocr-upload",
  pdf: "/restaurant/pdf-upload",
  spreadsheet: "/restaurant/spreadsheet-upload",
};

const FALLBACK_REDIRECT = "/restaurant/dashboard";

const styles = {
  page: {
    maxWidth: 600,
    margin: "40px auto",
    padding: "0 20px 60px",
    fontFamily:
      "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
    color: "#111",
  },

  header: { marginBottom: 28 },
  brand: { fontWeight: 800, fontSize: 18 },
  subbrand: { fontSize: 12, color: "#666" },
  pageTitle: { fontSize: 22, fontWeight: 700, marginTop: 20, marginBottom: 4 },
  pageSubtitle: { fontSize: 14, color: "#666" },

  section: {
    background: "#f7f7fb",
    border: "1px solid #efeff6",
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },

  sectionTitle: {
    fontSize: 12,
    fontWeight: 800,
    color: "#444",
    marginBottom: 14,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },

  fieldGroup: { marginBottom: 14 },

  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 5,
    color: "#333",
  },

  required: { color: "#c00", marginLeft: 2 },

  input: {
    width: "100%",
    height: 40,
    borderRadius: 10,
    border: "1px solid #e5e5e5",
    padding: "0 12px",
    fontSize: 14,
    background: "#fff",
    boxSizing: "border-box",
  },

  inputError: {
    width: "100%",
    height: 40,
    borderRadius: 10,
    border: "1px solid #c00",
    padding: "0 12px",
    fontSize: 14,
    background: "#fff",
    boxSizing: "border-box",
  },

  row2: { display: "flex", gap: 12 },
  halfField: { flex: 1, marginBottom: 14 },

  ingestionOption: (selected) => ({
    border: selected ? "2px solid #111" : "1px solid #e5e5e5",
    borderRadius: 12,
    padding: "14px 16px",
    marginBottom: 10,
    cursor: "pointer",
    background: selected ? "#fff" : "transparent",
  }),

  ingestionTitle: { fontWeight: 700, fontSize: 14, marginBottom: 2 },
  ingestionPrice: { fontWeight: 700, fontSize: 13, color: "#111" },
  ingestionDesc: { fontSize: 12, color: "#666", marginTop: 4, lineHeight: 1.5 },

  checkRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    padding: "10px 12px",
    background: "#fffbe6",
    borderRadius: 8,
    border: "1px solid #f0d060",
  },

  checkLabel: { fontSize: 13, color: "#555" },

  errorBanner: {
    background: "#fff0f0",
    border: "1px solid #f5c6c6",
    borderRadius: 10,
    padding: "12px 16px",
    marginBottom: 16,
    fontSize: 13,
    color: "#c00",
  },

  fieldError: { fontSize: 12, color: "#c00", marginTop: 4 },
};

function submitBtnStyle(disabled) {
  return {
    width: "100%",
    height: 46,
    borderRadius: 12,
    border: 0,
    background: disabled ? "#ccc" : "#111",
    color: "#fff",
    fontWeight: 700,
    fontSize: 15,
    cursor: disabled ? "not-allowed" : "pointer",
    marginTop: 4,
  };
}

function ingestionOptionStyle(selected) {
  return {
    border: selected ? "2px solid #111" : "1px solid #e5e5e5",
    borderRadius: 12,
    padding: "14px 16px",
    marginBottom: 10,
    cursor: "pointer",
    background: selected ? "#fff" : "transparent",
  };
}

export default function RestaurantSignup() {
  const nav = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    restaurant_name: "",
    website: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
  });

  const [ingestionMethod, setIngestionMethod] = useState("");
  const [ocrAcknowledged, setOcrAcknowledged] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
  }

  function selectIngestion(method) {
    setIngestionMethod(method);
    if (fieldErrors.ingestionMethod) {
      setFieldErrors((prev) => ({ ...prev, ingestionMethod: "" }));
    }
  }

  function validate() {
    const errors = {};

    if (!form.restaurant_name.trim()) {
      errors.restaurant_name = "Restaurant name is required.";
    }
    if (!form.email.trim()) {
      errors.email = "Email is required.";
    }
    if (form.password && form.confirmPassword && form.password !== form.confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }
    if (!ingestionMethod) {
      errors.ingestionMethod = "Please select a menu upload method.";
    }
    if (ingestionMethod === "ocr" && !ocrAcknowledged) {
      errors.ocrFee = "You must acknowledge the $9.99 OCR fee to continue.";
    }

    return errors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError("");

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);

    const payload = {
      restaurant_name: form.restaurant_name,
      email: form.email,
      password: form.password,
      website: form.website,
      phone: form.phone,
      address: form.address,
      city: form.city,
      state: form.state,
      zip: form.zip,
      ingestion_method: ingestionMethod,
      ocr_fee_acknowledged: ingestionMethod === "ocr" ? ocrAcknowledged : false,
    };

    try {
      const res = await fetch("/restaurants/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        setServerError("Signup failed. Please try again.");
        setSubmitting(false);
        return;
      }

      const redirect = INGESTION_REDIRECT[ingestionMethod] ?? FALLBACK_REDIRECT;
      nav(redirect);
    } catch {
      setServerError("Signup failed. Please try again.");
      setSubmitting(false);
    }
  }

  const submitDisabled =
    submitting || (ingestionMethod === "ocr" && !ocrAcknowledged);

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={styles.brand}>Grubbid</div>
        <div style={styles.subbrand}>for Restaurants</div>
        <div style={styles.pageTitle}>Upload your menu</div>
        <div style={styles.pageSubtitle}>
          Get discovered by food-conscious diners in your area.
        </div>
      </div>

      {serverError && <div style={styles.errorBanner}>{serverError}</div>}

      <form onSubmit={handleSubmit} noValidate>
        {/* Account Information */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>Account Information</div>

          <div style={styles.fieldGroup}>
            <label htmlFor="email" style={styles.label}>
              Email<span style={styles.required}>*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
              style={fieldErrors.email ? styles.inputError : styles.input}
            />
            {fieldErrors.email && (
              <div style={styles.fieldError}>{fieldErrors.email}</div>
            )}
          </div>

          <div style={styles.fieldGroup}>
            <label htmlFor="password" style={styles.label}>
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={handleChange}
              style={styles.input}
            />
          </div>

          <div style={styles.fieldGroup}>
            <label htmlFor="confirmPassword" style={styles.label}>
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={handleChange}
              style={
                fieldErrors.confirmPassword ? styles.inputError : styles.input
              }
            />
            {fieldErrors.confirmPassword && (
              <div style={styles.fieldError}>{fieldErrors.confirmPassword}</div>
            )}
          </div>
        </div>

        {/* Restaurant Information */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>Restaurant Information</div>

          <div style={styles.fieldGroup}>
            <label htmlFor="restaurant_name" style={styles.label}>
              Restaurant Name<span style={styles.required}>*</span>
            </label>
            <input
              id="restaurant_name"
              name="restaurant_name"
              type="text"
              autoComplete="organization"
              value={form.restaurant_name}
              onChange={handleChange}
              style={
                fieldErrors.restaurant_name ? styles.inputError : styles.input
              }
            />
            {fieldErrors.restaurant_name && (
              <div style={styles.fieldError}>{fieldErrors.restaurant_name}</div>
            )}
          </div>

          <div style={styles.fieldGroup}>
            <label htmlFor="website" style={styles.label}>
              Website
            </label>
            <input
              id="website"
              name="website"
              type="url"
              autoComplete="url"
              placeholder="yourrestaurant.com"
              value={form.website}
              onChange={handleChange}
              onBlur={() => {
                const raw = form.website.trim();
                if (!raw) return;
                if (!/^https?:\/\//i.test(raw)) {
                  setForm((prev) => ({ ...prev, website: "https://" + raw }));
                }
              }}
              style={styles.input}
            />
          </div>

          <div style={styles.fieldGroup}>
            <label htmlFor="phone" style={styles.label}>
              Phone
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              value={form.phone}
              onChange={handleChange}
              style={styles.input}
            />
          </div>

          <div style={styles.fieldGroup}>
            <label htmlFor="address" style={styles.label}>
              Address
            </label>
            <input
              id="address"
              name="address"
              type="text"
              autoComplete="street-address"
              value={form.address}
              onChange={handleChange}
              style={styles.input}
            />
          </div>

          <div style={styles.row2}>
            <div style={styles.halfField}>
              <label htmlFor="city" style={styles.label}>
                City
              </label>
              <input
                id="city"
                name="city"
                type="text"
                autoComplete="address-level2"
                value={form.city}
                onChange={handleChange}
                style={styles.input}
              />
            </div>

            <div style={{ flex: "0 0 80px", marginBottom: 14 }}>
              <label htmlFor="state" style={styles.label}>
                State
              </label>
              <input
                id="state"
                name="state"
                type="text"
                autoComplete="address-level1"
                maxLength={2}
                value={form.state}
                onChange={handleChange}
                style={styles.input}
              />
            </div>

            <div style={{ flex: "0 0 110px", marginBottom: 14 }}>
              <label htmlFor="zip" style={styles.label}>
                ZIP
              </label>
              <input
                id="zip"
                name="zip"
                type="text"
                autoComplete="postal-code"
                maxLength={10}
                value={form.zip}
                onChange={handleChange}
                style={styles.input}
              />
            </div>
          </div>
        </div>

        {/* Menu Ingestion Method */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>Menu Upload Method</div>

          {/* PDF */}
          <div
            style={ingestionOptionStyle(ingestionMethod === "pdf")}
            onClick={() => selectIngestion("pdf")}
            role="radio"
            aria-checked={ingestionMethod === "pdf"}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                selectIngestion("pdf");
              }
            }}
          >
            <div style={styles.ingestionTitle}>
              Upload Menu PDF{" "}
              <span style={{ fontWeight: 400, color: "#444" }}>(Free)</span>
            </div>
            <div style={styles.ingestionDesc}>
              Upload your menu as a PDF and we will parse it automatically.
            </div>
          </div>

          {/* Spreadsheet */}
          <div
            style={ingestionOptionStyle(ingestionMethod === "spreadsheet")}
            onClick={() => selectIngestion("spreadsheet")}
            role="radio"
            aria-checked={ingestionMethod === "spreadsheet"}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                selectIngestion("spreadsheet");
              }
            }}
          >
            <div style={styles.ingestionTitle}>
              Upload Menu via Spreadsheet{" "}
              <span style={{ fontWeight: 400, color: "#444" }}>(Free)</span>
            </div>
            <div style={styles.ingestionDesc}>
              Fill in the menu upload template and upload it here.{" "}
              <a
                href="/menu-upload-template.xlsx"
                download="Menu Upload Template.xlsx"
                style={{ color: "#111", fontWeight: 700 }}
                onClick={(e) => e.stopPropagation()}
              >
                Download the menu upload template
              </a>
            </div>
            {ingestionMethod === "spreadsheet" && (
              <div
                style={{
                  marginTop: 12,
                  padding: "12px 14px",
                  background: "#f4f4f8",
                  borderRadius: 10,
                  fontSize: 12,
                  color: "#444",
                  lineHeight: 1.6,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Spreadsheet instructions</div>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  <li>Download the Menu Upload Template above</li>
                  <li>Fill in your menu items using the provided columns</li>
                  <li>Do not rename the column headers</li>
                  <li>Add as many rows as needed for your menu items</li>
                  <li>Prices should be entered in dollars (example: 12.99)</li>
                  <li>Boolean fields should use TRUE or FALSE</li>
                  <li>Save the spreadsheet and upload it on this page</li>
                </ul>
              </div>
            )}
          </div>

          {/* OCR */}
          <div
            style={ingestionOptionStyle(ingestionMethod === "ocr")}
            onClick={() => selectIngestion("ocr")}
            role="radio"
            aria-checked={ingestionMethod === "ocr"}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                selectIngestion("ocr");
              }
            }}
          >
            <div style={styles.ingestionTitle}>
              Upload Photo or Scan via OCR{" "}
              <span style={styles.ingestionPrice}>($9.99)</span>
            </div>
            <div style={styles.ingestionDesc}>
              Upload photos or scans of your menu. AI extracts and structures
              the menu automatically.
            </div>

            {ingestionMethod === "ocr" && (
              <div
                style={styles.checkRow}
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  id="ocr-fee"
                  type="checkbox"
                  checked={ocrAcknowledged}
                  onChange={(e) => {
                    setOcrAcknowledged(e.target.checked);
                    if (fieldErrors.ocrFee) {
                      setFieldErrors((prev) => ({ ...prev, ocrFee: "" }));
                    }
                  }}
                />
                <label htmlFor="ocr-fee" style={styles.checkLabel}>
                  I agree to the $9.99 OCR processing fee
                </label>
              </div>
            )}
          </div>

          {fieldErrors.ingestionMethod && (
            <div style={styles.fieldError}>{fieldErrors.ingestionMethod}</div>
          )}
          {fieldErrors.ocrFee && (
            <div style={styles.fieldError}>{fieldErrors.ocrFee}</div>
          )}
        </div>

        <button
          type="submit"
          style={submitBtnStyle(submitDisabled)}
          disabled={submitDisabled}
        >
          {submitting ? "Creating account\u2026" : "Upload My Menu"}
        </button>
      </form>
    </div>
  );
}
