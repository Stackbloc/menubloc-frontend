import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BrandLockup } from "../components/BrandLogo.jsx";
import { LEGAL_VERSIONS } from "../content/legal.js";
import {
  persistRestaurantOnboardingState,
  syncRestaurantOnboardingProgress,
} from "../lib/restaurantOnboardingState.js";

const API = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001").replace(/\/$/, "");
const MAX_PDF_BYTES = 20 * 1024 * 1024;

function isPdfFile(file) {
  if (!file) return false;
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

function describeSignupFailure(error) {
  const rawMessage = String(error?.message || "").trim();
  const status = Number(error?.status) || 0;

  if (/failed to fetch|networkerror|load failed|network request failed/i.test(rawMessage)) {
    return {
      title: "We could not reach Menuply right now.",
      detail: "Check your connection or retry in a moment. Your restaurant details are still here.",
    };
  }

  if (status === 400 || status === 409 || status === 422) {
    return {
      title: rawMessage || "We need a few details corrected before we can start this profile.",
      detail: "Review the fields above, make any needed corrections, and try again.",
    };
  }

  if (status >= 500) {
    return {
      title: "Menuply could not finish starting this profile.",
      detail: "Nothing was cleared from the form. Please retry in a moment.",
    };
  }

  return {
    title: rawMessage || "We could not finish starting this profile.",
    detail: "Please retry. Your entered information is still available on this page.",
  };
}

function submitBtnStyle(disabled) {
  return {
    width: "100%",
    height: 48,
    borderRadius: 14,
    border: 0,
    background: disabled ? "#98a2b3" : "#111",
    color: "#fff",
    fontWeight: 800,
    fontSize: 15,
    cursor: disabled ? "not-allowed" : "pointer",
    marginTop: 4,
  };
}

export default function RestaurantFreeProfileSignup() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    owner_name: "",
    email: "",
    restaurant_name: "",
    phone: "",
    address_line1: "",
    city: "",
    state: "",
    postal_code: "",
    category: "",
  });
  const [menuChoice, setMenuChoice] = useState("later");
  const [menuFile, setMenuFile] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [serverErrorDetail, setServerErrorDetail] = useState("");
  const [uploadNotice, setUploadNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successState, setSuccessState] = useState(null);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: "" }));
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0] || null;
    setUploadNotice("");
    setFieldErrors((current) => ({ ...current, menuFile: "" }));

    if (!file) {
      setMenuFile(null);
      return;
    }

    if (!isPdfFile(file)) {
      setMenuFile(null);
      setFieldErrors((current) => ({ ...current, menuFile: "Please choose a PDF file." }));
      event.target.value = "";
      return;
    }

    if (file.size > MAX_PDF_BYTES) {
      setMenuFile(null);
      setFieldErrors((current) => ({ ...current, menuFile: "PDF must be 20 MB or smaller." }));
      event.target.value = "";
      return;
    }

    setMenuFile(file);
  }

  function validate() {
    const errors = {};

    if (!form.owner_name.trim()) errors.owner_name = "Owner name is required.";
    if (!form.email.trim()) errors.email = "Owner email is required.";
    if (!form.restaurant_name.trim()) errors.restaurant_name = "Restaurant name is required.";
    if (!form.phone.trim()) errors.phone = "Restaurant phone is required.";
    if (!form.address_line1.trim()) errors.address_line1 = "Street address is required.";
    if (!form.city.trim()) errors.city = "City is required.";
    if (!form.state.trim()) errors.state = "State is required.";
    if (!form.postal_code.trim()) errors.postal_code = "ZIP code is required.";
    if (menuChoice === "upload" && menuFile && !isPdfFile(menuFile)) {
      errors.menuFile = "Please choose a PDF file.";
    }

    return errors;
  }

  async function uploadMenuIfPresent({ restaurant, owner_token }) {
    if (menuChoice !== "upload" || !menuFile) return { uploaded: false };

    const formData = new FormData();
    formData.append("file", menuFile, menuFile.name);
    formData.append("restaurant_id", String(restaurant.id));
    formData.append("email", form.email.trim());
    formData.append("owner_token", owner_token);
    formData.append("plan", "verified");

    const res = await fetch(`${API}/menu-upload/pdf`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });
    const data = await res.json().catch(() => null);

    if (!res.ok || !data?.ok) {
      const error = new Error(data?.error || `Menu upload failed (${res.status})`);
      error.status = res.status;
      throw error;
    }

    return { uploaded: true, data };
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setServerError("");
    setServerErrorDetail("");
    setUploadNotice("");

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        email: form.email.trim(),
        manager_name: form.owner_name.trim(),
        restaurant_name: form.restaurant_name.trim(),
        phone: form.phone.trim(),
        address_line1: form.address_line1.trim(),
        city: form.city.trim(),
        state: form.state.trim().toUpperCase(),
        postal_code: form.postal_code.trim(),
        category: form.category.trim() || null,
        cuisine: form.category.trim() || null,
        selected_plan: "verified",
        plan: "verified",
        plan_type: "free",
        payment_required: false,
        signup_source: "free_profile_signup",
        profile_status: "pending",
        legal_acceptances: [
          {
            document_key: "merchant_terms",
            document_version: LEGAL_VERSIONS.merchantTerms,
          },
          {
            document_key: "privacy_policy",
            document_version: LEGAL_VERSIONS.privacyPolicy,
          },
        ],
      };

      const res = await fetch(`${API}/owner/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        const signupError = new Error(data?.error || `Signup failed (${res.status})`);
        signupError.status = res.status;
        throw signupError;
      }

      const { restaurant, owner_token } = data;
      const baseState = persistRestaurantOnboardingState({
        restaurant_id: restaurant.id,
        restaurant_name: form.restaurant_name.trim(),
        email: form.email.trim(),
        owner_token,
        city: form.city.trim(),
        state: form.state.trim().toUpperCase(),
        phone: form.phone.trim(),
        ingestion_method: menuChoice === "upload" && menuFile ? "pdf_upload" : "later",
        selected_plan: "verified",
        plan: "verified",
      });

      await syncRestaurantOnboardingProgress(baseState, {
        current_step_key: menuChoice === "upload" && menuFile ? "menu_review" : "basic_public_profile",
        completed_step_keys: ["create_operator_account", "public_restaurant_information"],
        intake_path: "join_landing_free_profile",
        requested_location_count: 1,
        selected_plan_code: "verified",
        manual_review_required: Boolean(menuChoice === "upload" && menuFile),
        draft_payload: {
          signup_source: "free_profile_signup",
          payment_required: false,
          plan_type: "free",
          menu_upload_mode: menuChoice === "upload" ? "pdf_now" : "upload_later",
        },
      }).catch(() => null);

      let uploaded = false;
      try {
        const uploadResult = await uploadMenuIfPresent({ restaurant, owner_token });
        uploaded = uploadResult.uploaded;
      } catch (uploadError) {
        setUploadNotice(
          uploadError?.message
            ? `Your profile was started, but the PDF upload did not finish: ${uploadError.message}`
            : "Your profile was started, but the PDF upload did not finish."
        );
      }

      setSuccessState({
        uploaded,
        restaurantName: form.restaurant_name.trim(),
      });
    } catch (error) {
      const failure = describeSignupFailure(error);
      setServerError(failure.title);
      setServerErrorDetail(failure.detail);
    } finally {
      setSubmitting(false);
    }
  }

  if (successState) {
    return (
      <div style={styles.page}>
        <div style={styles.header}>
          <BrandLockup
            subtitle="for Restaurants"
            logoProps={{ width: 180, height: 112, radius: 24, pageColor: "#f6f6f3" }}
            wrapperStyle={{ marginBottom: 6 }}
          />
          <div style={styles.successCard}>
            <div style={styles.pageTitle}>Your free restaurant profile has been started.</div>
            <div style={styles.pageSubtitle}>
              We’ll use your restaurant information and menu to prepare your Menuply profile. If you uploaded a menu,
              we’ll review it and follow up when it’s ready.
            </div>
            {!successState.uploaded ? (
              <div style={{ ...styles.helperText, marginTop: 12 }}>
                You can upload your menu later from your restaurant account.
              </div>
            ) : null}
            {uploadNotice ? <div style={styles.noticeBanner}>{uploadNotice}</div> : null}
            <button type="button" onClick={() => nav("/")} style={styles.secondaryButton}>
              Return to Menuply
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <BrandLockup
          subtitle="for Restaurants"
          logoProps={{ width: 180, height: 112, radius: 24, pageColor: "#f6f6f3" }}
          wrapperStyle={{ marginBottom: 6 }}
        />
        <div style={styles.pageTitle}>Create your free restaurant profile</div>
        <div style={styles.pageSubtitle}>
          You’re signing up for the 100% free Verified plan.
        </div>
        <div style={styles.planSummary}>
          <span>100% free Verified restaurant profile</span>
          <span>No credit card required</span>
          <span>No commitment</span>
          <span>Upload your menu now or later</span>
        </div>
      </div>

      {serverError ? (
        <div style={styles.errorBanner}>
          <div style={{ fontWeight: 700, marginBottom: serverErrorDetail ? 4 : 0 }}>{serverError}</div>
          {serverErrorDetail ? <div>{serverErrorDetail}</div> : null}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} noValidate>
        <div style={styles.section}>
          <div style={styles.sectionTitle}>Owner</div>
          <TextField
            id="owner_name"
            name="owner_name"
            label="Owner name"
            value={form.owner_name}
            onChange={handleChange}
            error={fieldErrors.owner_name}
            autoComplete="name"
          />
          <TextField
            id="email"
            name="email"
            label="Owner email"
            value={form.email}
            onChange={handleChange}
            error={fieldErrors.email}
            autoComplete="email"
            type="email"
          />
        </div>

        <div style={styles.section}>
          <div style={styles.sectionTitle}>Restaurant basics</div>
          <TextField
            id="restaurant_name"
            name="restaurant_name"
            label="Restaurant name"
            value={form.restaurant_name}
            onChange={handleChange}
            error={fieldErrors.restaurant_name}
            autoComplete="organization"
          />
          <TextField
            id="phone"
            name="phone"
            label="Restaurant phone"
            value={form.phone}
            onChange={handleChange}
            error={fieldErrors.phone}
            autoComplete="tel"
            type="tel"
          />
          <TextField
            id="address_line1"
            name="address_line1"
            label="Restaurant street address"
            value={form.address_line1}
            onChange={handleChange}
            error={fieldErrors.address_line1}
            autoComplete="street-address"
          />

          <div style={styles.row2}>
            <TextField
              id="city"
              name="city"
              label="City"
              value={form.city}
              onChange={handleChange}
              error={fieldErrors.city}
              autoComplete="address-level2"
              wrapStyle={styles.halfField}
            />
            <TextField
              id="state"
              name="state"
              label="State"
              value={form.state}
              onChange={handleChange}
              error={fieldErrors.state}
              autoComplete="address-level1"
              maxLength={2}
              wrapStyle={styles.halfField}
            />
          </div>

          <div style={styles.row2}>
            <TextField
              id="postal_code"
              name="postal_code"
              label="ZIP code"
              value={form.postal_code}
              onChange={handleChange}
              error={fieldErrors.postal_code}
              autoComplete="postal-code"
              wrapStyle={styles.halfField}
            />
            <TextField
              id="category"
              name="category"
              label="Cuisine type or restaurant category"
              value={form.category}
              onChange={handleChange}
              error={fieldErrors.category}
              autoComplete="off"
              required={false}
              wrapStyle={styles.halfField}
            />
          </div>
        </div>

        <div style={styles.section}>
          <div style={styles.sectionTitle}>Menu upload</div>
          <div style={styles.radioGroup}>
            <label style={styles.radioCard(menuChoice === "upload")}>
              <input
                type="radio"
                name="menuChoice"
                value="upload"
                checked={menuChoice === "upload"}
                onChange={() => setMenuChoice("upload")}
                style={styles.radio}
              />
              <span>
                <strong>Upload PDF menu now</strong>
                <span style={styles.radioHint}>Add a PDF if you have it ready. This is optional.</span>
              </span>
            </label>
            <label style={styles.radioCard(menuChoice === "later")}>
              <input
                type="radio"
                name="menuChoice"
                value="later"
                checked={menuChoice === "later"}
                onChange={() => setMenuChoice("later")}
                style={styles.radio}
              />
              <span>
                <strong>Upload menu later</strong>
                <span style={styles.radioHint}>Start your profile now and add the menu later.</span>
              </span>
            </label>
          </div>

          {menuChoice === "upload" ? (
            <div style={styles.fieldGroup}>
              <label htmlFor="menu_pdf" style={styles.label}>
                PDF menu
              </label>
              <input
                id="menu_pdf"
                name="menu_pdf"
                type="file"
                accept="application/pdf,.pdf"
                onChange={handleFileChange}
                style={styles.fileInput}
              />
              <div style={styles.helperText}>PDF upload is optional. You can submit this form without a file.</div>
              {fieldErrors.menuFile ? <div style={styles.fieldError}>{fieldErrors.menuFile}</div> : null}
            </div>
          ) : null}
        </div>

        <button type="submit" style={submitBtnStyle(submitting)} disabled={submitting}>
          {submitting ? "Starting profile..." : "Start free profile"}
        </button>
      </form>
    </div>
  );
}

function TextField({
  id,
  name,
  label,
  value,
  onChange,
  error,
  autoComplete,
  type = "text",
  required = true,
  maxLength,
  wrapStyle,
}) {
  return (
    <div style={wrapStyle || styles.fieldGroup}>
      <label htmlFor={id} style={styles.label}>
        {label}{required ? <span style={styles.required}>*</span> : null}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        value={value}
        onChange={onChange}
        maxLength={maxLength}
        style={error ? styles.inputError : styles.input}
      />
      {error ? <div style={styles.fieldError}>{error}</div> : null}
    </div>
  );
}

const styles = {
  page: {
    maxWidth: 640,
    margin: "40px auto",
    padding: "0 20px 60px",
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
    color: "#111",
  },
  header: { marginBottom: 28 },
  pageTitle: { fontSize: 28, fontWeight: 800, marginTop: 20, marginBottom: 6, letterSpacing: "-0.03em" },
  pageSubtitle: { fontSize: 15, color: "#555", lineHeight: 1.6, maxWidth: 560 },
  section: {
    background: "#f7f7fb",
    border: "1px solid #efeff6",
    borderRadius: 18,
    padding: 20,
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
    fontWeight: 700,
    marginBottom: 6,
    color: "#333",
  },
  required: { color: "#c00", marginLeft: 2 },
  input: {
    width: "100%",
    height: 44,
    borderRadius: 12,
    border: "1px solid #d7dce5",
    padding: "0 12px",
    fontSize: 14,
    background: "#fff",
    boxSizing: "border-box",
  },
  inputError: {
    width: "100%",
    height: 44,
    borderRadius: 12,
    border: "1px solid #c00",
    padding: "0 12px",
    fontSize: 14,
    background: "#fff",
    boxSizing: "border-box",
  },
  row2: { display: "flex", gap: 12, flexWrap: "wrap" },
  halfField: { flex: "1 1 220px", marginBottom: 14 },
  fieldError: { fontSize: 12, color: "#c00", marginTop: 5 },
  helperText: { fontSize: 12, color: "#667085", marginTop: 6 },
  errorBanner: {
    background: "#fff0f0",
    border: "1px solid #f5c6c6",
    borderRadius: 12,
    padding: "12px 16px",
    marginBottom: 16,
    fontSize: 13,
    color: "#c00",
  },
  noticeBanner: {
    background: "#fff7ed",
    border: "1px solid #fed7aa",
    borderRadius: 12,
    padding: "12px 16px",
    marginTop: 16,
    fontSize: 13,
    color: "#9a3412",
    lineHeight: 1.5,
  },
  planSummary: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
    gap: 10,
    padding: "14px 16px",
    borderRadius: 14,
    background: "#eef6f1",
    border: "1px solid #cfe0d8",
    marginTop: 18,
    fontSize: 13,
    fontWeight: 800,
    color: "#1F4E3D",
  },
  radioGroup: {
    display: "grid",
    gap: 10,
    marginBottom: 14,
  },
  radioCard: (active) => ({
    display: "flex",
    gap: 10,
    alignItems: "flex-start",
    border: `1px solid ${active ? "#1F4E3D" : "#d7dce5"}`,
    background: active ? "#eef6f1" : "#fff",
    borderRadius: 14,
    padding: "12px 14px",
    cursor: "pointer",
  }),
  radio: {
    marginTop: 2,
    accentColor: "#1F4E3D",
  },
  radioHint: {
    display: "block",
    fontSize: 12,
    lineHeight: 1.5,
    color: "#667085",
    marginTop: 3,
  },
  fileInput: {
    width: "100%",
    borderRadius: 12,
    border: "1px solid #d7dce5",
    padding: 12,
    fontSize: 14,
    background: "#fff",
    boxSizing: "border-box",
  },
  successCard: {
    background: "#f7f7fb",
    border: "1px solid #efeff6",
    borderRadius: 18,
    padding: 22,
  },
  secondaryButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    borderRadius: 12,
    border: "1px solid #d0d5dd",
    background: "#fff",
    color: "#111",
    fontWeight: 800,
    fontSize: 14,
    padding: "0 18px",
    cursor: "pointer",
    marginTop: 18,
  },
};
