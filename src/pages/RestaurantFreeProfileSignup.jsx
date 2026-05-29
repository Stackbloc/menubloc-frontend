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

export default function RestaurantFreeProfileSignup() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    email: "",
    restaurant_name: "",
    address_line1: "",
  });
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

    if (!form.restaurant_name.trim()) errors.restaurant_name = "Restaurant name is required.";
    if (!form.address_line1.trim()) errors.address_line1 = "Street address is required.";
    if (!form.email.trim()) errors.email = "Owner email is required.";
    if (menuFile && !isPdfFile(menuFile)) errors.menuFile = "Please choose a PDF file.";

    return errors;
  }

  async function uploadMenuIfPresent({ restaurant, owner_token }) {
    if (!menuFile) return { uploaded: false };

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
        restaurant_name: form.restaurant_name.trim(),
        address_line1: form.address_line1.trim(),
        manager_name: form.restaurant_name.trim(),
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
        ingestion_method: menuFile ? "pdf_upload" : "later",
        selected_plan: "verified",
        plan: "verified",
      });

      await syncRestaurantOnboardingProgress(baseState, {
        current_step_key: menuFile ? "menu_review" : "basic_public_profile",
        completed_step_keys: ["create_operator_account", "public_restaurant_information"],
        intake_path: "join_landing_free_profile",
        requested_location_count: 1,
        selected_plan_code: "verified",
        manual_review_required: Boolean(menuFile),
        draft_payload: {
          signup_source: "free_profile_signup",
          payment_required: false,
          plan_type: "free",
          menu_upload_mode: menuFile ? "pdf_now" : "upload_later",
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
        <BrandLockup
          subtitle="for Restaurants"
          logoProps={{ width: 160, height: 96, radius: 20, pageColor: "#f6f6f3" }}
          wrapperStyle={{ marginBottom: 24 }}
        />
        <div style={styles.successCard}>
          <div style={styles.pageTitle}>Your free restaurant profile has been started.</div>
          <div style={styles.pageSubtitle}>
            We’ll use your restaurant information{successState.uploaded ? " and menu" : ""} to prepare your Menuply profile.
          </div>
          {!successState.uploaded ? (
            <div style={styles.helperText}>You can upload your menu later from your restaurant account.</div>
          ) : null}
          {uploadNotice ? <div style={styles.noticeBanner}>{uploadNotice}</div> : null}
          <button type="button" onClick={() => nav("/")} style={styles.secondaryButton}>
            Return to Menuply
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <BrandLockup
        subtitle="for Restaurants"
        logoProps={{ width: 160, height: 96, radius: 20, pageColor: "#f6f6f3" }}
        wrapperStyle={{ marginBottom: 24 }}
      />

      <h1 style={styles.pageTitle}>Create Your Free Restaurant Profile</h1>
      <p style={styles.pageSubtitle}>
        You&apos;re signing up for the 100% free Verified plan. No credit card required.
      </p>

      {serverError ? (
        <div style={styles.errorBanner}>
          <div style={{ fontWeight: 700, marginBottom: serverErrorDetail ? 4 : 0 }}>{serverError}</div>
          {serverErrorDetail ? <div>{serverErrorDetail}</div> : null}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} noValidate style={styles.form}>
        <TextField
          id="restaurant_name"
          name="restaurant_name"
          label="Restaurant Name"
          value={form.restaurant_name}
          onChange={handleChange}
          error={fieldErrors.restaurant_name}
          autoComplete="organization"
        />
        <TextField
          id="address_line1"
          name="address_line1"
          label="Street Address"
          value={form.address_line1}
          onChange={handleChange}
          error={fieldErrors.address_line1}
          autoComplete="street-address"
        />
        <TextField
          id="email"
          name="email"
          label="Owner Email"
          value={form.email}
          onChange={handleChange}
          error={fieldErrors.email}
          autoComplete="email"
          type="email"
        />

        <div style={styles.fieldGroup}>
          <label htmlFor="menu_pdf" style={styles.label}>
            PDF Menu Upload <span style={styles.optional}>(optional)</span>
          </label>
          <input
            id="menu_pdf"
            name="menu_pdf"
            type="file"
            accept="application/pdf,.pdf"
            onChange={handleFileChange}
            style={styles.fileInput}
          />
          <div style={styles.helperText}>
            Have your menu ready? Upload a PDF now, or skip this step and add it later.
          </div>
          {fieldErrors.menuFile ? <div style={styles.fieldError}>{fieldErrors.menuFile}</div> : null}
        </div>

        <button type="submit" style={submitBtnStyle(submitting)} disabled={submitting}>
          {submitting ? "Starting profile..." : "Start Free Profile"}
        </button>
        <p style={styles.footerNote}>No credit card • No commitment • Upload menu now or later</p>
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
}) {
  return (
    <div style={styles.fieldGroup}>
      <label htmlFor={id} style={styles.label}>
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        value={value}
        onChange={onChange}
        style={error ? styles.inputError : styles.input}
      />
      {error ? <div style={styles.fieldError}>{error}</div> : null}
    </div>
  );
}

function submitBtnStyle(disabled) {
  return {
    width: "100%",
    height: 48,
    borderRadius: 12,
    border: 0,
    background: disabled ? "#98a2b3" : "#111",
    color: "#fff",
    fontWeight: 800,
    fontSize: 15,
    cursor: disabled ? "not-allowed" : "pointer",
    marginTop: 8,
  };
}

const styles = {
  page: {
    maxWidth: 480,
    margin: "48px auto",
    padding: "0 20px 60px",
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
    color: "#111",
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 800,
    margin: "0 0 8px",
    letterSpacing: "-0.03em",
    lineHeight: 1.2,
  },
  pageSubtitle: {
    fontSize: 15,
    color: "#555",
    lineHeight: 1.6,
    margin: "0 0 28px",
  },
  form: {
    display: "grid",
    gap: 0,
  },
  fieldGroup: { marginBottom: 18 },
  label: {
    display: "block",
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 6,
    color: "#333",
  },
  optional: {
    fontWeight: 500,
    color: "#667085",
  },
  input: {
    width: "100%",
    height: 44,
    borderRadius: 10,
    border: "1px solid #d7dce5",
    padding: "0 12px",
    fontSize: 15,
    background: "#fff",
    boxSizing: "border-box",
  },
  inputError: {
    width: "100%",
    height: 44,
    borderRadius: 10,
    border: "1px solid #c00",
    padding: "0 12px",
    fontSize: 15,
    background: "#fff",
    boxSizing: "border-box",
  },
  fieldError: { fontSize: 12, color: "#c00", marginTop: 5 },
  helperText: { fontSize: 13, color: "#667085", marginTop: 8, lineHeight: 1.5 },
  footerNote: {
    fontSize: 12,
    color: "#667085",
    textAlign: "center",
    margin: "12px 0 0",
    lineHeight: 1.5,
  },
  fileInput: {
    width: "100%",
    borderRadius: 10,
    border: "1px solid #d7dce5",
    padding: 12,
    fontSize: 14,
    background: "#fff",
    boxSizing: "border-box",
  },
  errorBanner: {
    background: "#fff0f0",
    border: "1px solid #f5c6c6",
    borderRadius: 10,
    padding: "12px 16px",
    marginBottom: 20,
    fontSize: 13,
    color: "#c00",
  },
  noticeBanner: {
    background: "#fff7ed",
    border: "1px solid #fed7aa",
    borderRadius: 10,
    padding: "12px 16px",
    marginTop: 16,
    fontSize: 13,
    color: "#9a3412",
    lineHeight: 1.5,
  },
  successCard: {
    background: "#f7f7fb",
    border: "1px solid #efeff6",
    borderRadius: 14,
    padding: 22,
  },
  secondaryButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    borderRadius: 10,
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
