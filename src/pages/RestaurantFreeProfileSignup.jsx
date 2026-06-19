import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { BrandLockup } from "../components/BrandLogo.jsx";
import { resolveJoinMarketForSignup } from "../lib/joinMarketConfig.js";
import { buildLegalConsentPayload } from "../lib/legalConsent.js";
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
  const [searchParams] = useSearchParams();
  const market = useMemo(() => resolveJoinMarketForSignup(searchParams), [searchParams]);
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
  const [legalConsent, setLegalConsent] = useState(false);

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
    if (!legalConsent) {
      errors.legalConsent = "You must agree to the Terms of Use and Privacy Policy and consent to electronic communications.";
    }

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
        city: market.city || null,
        state: market.state_code || null,
        selected_plan: "verified",
        plan: "verified",
        plan_type: "free",
        payment_required: false,
        signup_source: market.signup_source,
        profile_status: "pending",
        ...buildLegalConsentPayload(),
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

      const { restaurant, owner_token, password_setup_email_sent } = data;
      const baseState = persistRestaurantOnboardingState({
        restaurant_id: restaurant.id,
        restaurant_name: form.restaurant_name.trim(),
        email: form.email.trim(),
        owner_token,
        city: market.city || "",
        state: market.state_code || "",
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
          signup_source: market.signup_source,
          market: market.market,
          payment_required: false,
          plan_type: "free",
          profile_status: "pending",
          menu_upload_mode: menuFile ? "pdf_now" : "upload_later",
        },
      });

      let uploaded = false;
      try {
        const uploadResult = await uploadMenuIfPresent({ restaurant, owner_token });
        uploaded = uploadResult.uploaded;
      } catch (uploadError) {
        setUploadNotice(
          uploadError?.message
            ? `Your profile was created, but the PDF upload did not finish: ${uploadError.message}`
            : "Your profile was created, but the PDF upload did not finish."
        );
      }

      setSuccessState({
        uploaded,
        restaurantName: form.restaurant_name.trim(),
        passwordSetupEmailSent: Boolean(password_setup_email_sent),
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
        <div style={styles.brandHeader}>
          <BrandLockup
            logoProps={{ height: 48, radius: 14, matchPageBackground: false }}
            wrapperStyle={styles.brandLockup}
          />
        </div>
        <div style={styles.successCard}>
          <div style={styles.pageTitle}>Your free restaurant profile has been created.</div>
          <div style={styles.pageSubtitle}>
            We&apos;ll use your restaurant information and menu to prepare your Menuply profile. If you uploaded
            a menu, we&apos;ll review it before publication and follow up when it&apos;s ready.
          </div>
          {!successState.uploaded ? (
            <div style={styles.helperText}>You can upload your menu later from your restaurant account.</div>
          ) : null}
          {successState.passwordSetupEmailSent ? (
            <div style={styles.helperText}>
              Check your email for a link to set your operator password and access your account.
            </div>
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
      <div style={styles.brandHeader}>
        <BrandLockup
          subtitle="For Restaurants"
          subtitleStyle={styles.brandSubtitle}
          logoProps={{ height: 48, radius: 14, matchPageBackground: false }}
          wrapperStyle={styles.brandLockup}
        />
      </div>

      <h1 style={styles.pageTitle}>Join the Menuply Network</h1>
      <p style={styles.pageSubtitle}>
        Create your free restaurant profile.
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
            Upload a menu now or add it later.
          </div>
          {fieldErrors.menuFile ? <div style={styles.fieldError}>{fieldErrors.menuFile}</div> : null}
        </div>

        <label style={styles.checkboxRow}>
          <input
            type="checkbox"
            checked={legalConsent}
            onChange={(event) => {
              setLegalConsent(event.target.checked);
              setFieldErrors((current) => ({ ...current, legalConsent: "" }));
            }}
            style={styles.checkbox}
          />
          <span style={styles.checkboxLabel}>
            I agree to the{" "}
            <Link to="/terms" target="_blank" rel="noreferrer" style={styles.legalLink}>
              Terms of Use
            </Link>
            {" "}and{" "}
            <Link to="/privacy" target="_blank" rel="noreferrer" style={styles.legalLink}>
              Privacy Policy
            </Link>
            {" "}and consent to receive electronic communications from Menuply regarding my account, orders, services, and important updates.
          </span>
        </label>
        {fieldErrors.legalConsent ? <div style={styles.fieldError}>{fieldErrors.legalConsent}</div> : null}

        <button type="submit" style={submitBtnStyle(submitting)} disabled={submitting}>
          {submitting ? "Starting profile..." : "Join the Network →"}
        </button>
        <p style={styles.footerNote}>No credit card · No commitment</p>
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
    background: disabled ? "#374151" : "#22C55E",
    color: disabled ? "#9CA3AF" : "#0B0F0C",
    fontWeight: 800,
    fontSize: 15,
    cursor: disabled ? "not-allowed" : "pointer",
    marginTop: 8,
  };
}

const styles = {
  page: {
    boxSizing: "border-box",
    minHeight: "100dvh",
    maxWidth: 480,
    margin: "0 auto",
    padding: "48px 20px 60px",
    fontFamily: "var(--gb-font-ui, Inter, system-ui, sans-serif)",
    color: "var(--gb-color-ink)",
    background: "var(--gb-color-page)",
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 800,
    margin: "0 0 8px",
    letterSpacing: "-0.03em",
    lineHeight: 1.2,
    color: "#FFFFFF",
  },
  brandHeader: {
    display: "flex",
    justifyContent: "center",
    marginBottom: 24,
  },
  brandLockup: {
    alignItems: "center",
  },
  brandSubtitle: {
    display: "inline-block",
    background: "rgba(34, 197, 94, 0.12)",
    color: "#22C55E",
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    padding: "5px 13px",
    borderRadius: 100,
    border: "1px solid rgba(34, 197, 94, 0.25)",
    marginTop: 8,
    textAlign: "center",
  },
  pageSubtitle: {
    fontSize: 15,
    color: "rgba(255, 255, 255, 0.88)",
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
    color: "#D1D5DB",
  },
  optional: {
    fontWeight: 500,
    color: "#9CA3AF",
  },
  input: {
    width: "100%",
    height: 44,
    borderRadius: 10,
    border: "1px solid #374151",
    padding: "0 12px",
    fontSize: 15,
    background: "#121A14",
    color: "#F9FAFB",
    boxSizing: "border-box",
  },
  inputError: {
    width: "100%",
    height: 44,
    borderRadius: 10,
    border: "1px solid #f87171",
    padding: "0 12px",
    fontSize: 15,
    background: "#121A14",
    color: "#F9FAFB",
    boxSizing: "border-box",
  },
  fieldError: { fontSize: 12, color: "#fca5a5", marginTop: 5 },
  helperText: { fontSize: 13, color: "rgba(255, 255, 255, 0.72)", marginTop: 8, lineHeight: 1.5 },
  checkboxRow: {
    display: "grid",
    gridTemplateColumns: "18px 1fr",
    gap: 10,
    alignItems: "start",
    margin: "0 0 18px",
  },
  checkbox: {
    width: 16,
    height: 16,
    marginTop: 2,
    accentColor: "#22C55E",
  },
  checkboxLabel: {
    fontSize: 13,
    lineHeight: 1.5,
    color: "rgba(255, 255, 255, 0.82)",
  },
  legalLink: {
    color: "#86EFAC",
    fontWeight: 700,
  },
  footerNote: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.72)",
    textAlign: "center",
    margin: "12px 0 0",
    lineHeight: 1.5,
  },
  fileInput: {
    width: "100%",
    borderRadius: 10,
    border: "1px solid #374151",
    padding: 12,
    fontSize: 14,
    background: "#121A14",
    color: "#D1D5DB",
    boxSizing: "border-box",
  },
  errorBanner: {
    background: "rgba(248, 113, 113, 0.1)",
    border: "1px solid rgba(248, 113, 113, 0.35)",
    borderRadius: 10,
    padding: "12px 16px",
    marginBottom: 20,
    fontSize: 13,
    color: "#fca5a5",
  },
  noticeBanner: {
    background: "rgba(234, 179, 8, 0.1)",
    border: "1px solid rgba(234, 179, 8, 0.35)",
    borderRadius: 10,
    padding: "12px 16px",
    marginTop: 16,
    fontSize: 13,
    color: "#FCD34D",
    lineHeight: 1.5,
  },
  successCard: {
    background: "#121A14",
    border: "1px solid #374151",
    borderRadius: 14,
    padding: 22,
  },
  secondaryButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    borderRadius: 10,
    border: "1px solid #374151",
    background: "rgba(255, 255, 255, 0.06)",
    color: "#F9FAFB",
    fontWeight: 800,
    fontSize: 14,
    padding: "0 18px",
    cursor: "pointer",
    marginTop: 18,
  },
};
