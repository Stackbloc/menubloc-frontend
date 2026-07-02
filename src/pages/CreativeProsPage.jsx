import React, { useState } from "react";
import { BrandLogo } from "../components/BrandLogo.jsx";
import SiteFooter from "../components/SiteFooter.jsx";

const API = (
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? "http://localhost:3001" : "https://menubloc-backend-production.up.railway.app")
).replace(/\/$/, "");

const SERVICE_OPTIONS = [
  { key: "menu_design", label: "Menu Design" },
  { key: "food_photography", label: "Food Photography" },
  { key: "logo_design", label: "Logo Design" },
  { key: "branding", label: "Branding" },
  { key: "website_design", label: "Website Design" },
  { key: "social_media_graphics", label: "Social Media Graphics" },
  { key: "print_design", label: "Print Design" },
  { key: "copywriting", label: "Copywriting" },
  { key: "other", label: "Other" },
];

const EMPTY_FORM = {
  name: "",
  business_name: "",
  email: "",
  phone: "",
  city: "",
  state: "",
  website_url: "",
  instagram_url: "",
  short_note: "",
  referral_interest: false,
};

const styles = {
  pageWrap: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    overflowX: "hidden",
    background: "var(--gb-color-page)",
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
    color: "#0B0F0C",
  },
  pageMain: {
    flex: 1,
    width: "100%",
    maxWidth: 680,
    margin: "0 auto",
    padding: "32px 20px 56px",
  },
  header: { marginBottom: 28 },
  pageTitle: { fontSize: 28, fontWeight: 800, marginTop: 16, marginBottom: 8, letterSpacing: "-0.03em" },
  pageSubtitle: { fontSize: 15, color: "#374151", lineHeight: 1.6, maxWidth: 560 },
  section: {
    background: "#F9FAFB",
    border: "1px solid #E5E7EB",
    borderRadius: 10,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: "#6B7280",
    marginBottom: 14,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
  },
  fieldGroup: { marginBottom: 14 },
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 6,
    color: "#374151",
  },
  required: { color: "#c00", marginLeft: 2 },
  input: {
    width: "100%",
    height: 44,
    borderRadius: 10,
    border: "1px solid #E5E7EB",
    padding: "0 12px",
    fontSize: 14,
    background: "#ffffff",
    color: "#0B0F0C",
    boxSizing: "border-box",
    fontFamily: "inherit",
  },
  inputError: {
    width: "100%",
    height: 44,
    borderRadius: 10,
    border: "1px solid #FECACA",
    padding: "0 12px",
    fontSize: 14,
    background: "#ffffff",
    color: "#0B0F0C",
    boxSizing: "border-box",
    fontFamily: "inherit",
  },
  textarea: {
    width: "100%",
    minHeight: 120,
    borderRadius: 10,
    border: "1px solid #E5E7EB",
    padding: "12px",
    fontSize: 14,
    background: "#ffffff",
    color: "#0B0F0C",
    boxSizing: "border-box",
    fontFamily: "inherit",
    resize: "vertical",
  },
  row2: { display: "flex", gap: 12, flexWrap: "wrap" },
  halfField: { flex: "1 1 220px", marginBottom: 14 },
  checkboxGrid: {
    display: "grid",
    gap: 10,
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    marginBottom: 4,
  },
  checkboxRow: {
    display: "flex",
    gap: 10,
    alignItems: "flex-start",
    marginBottom: 12,
  },
  checkbox: {
    width: 18,
    height: 18,
    marginTop: 2,
    accentColor: "#4caf50",
    flex: "0 0 auto",
  },
  checkboxLabel: {
    fontSize: 14,
    lineHeight: 1.6,
    color: "#374151",
    fontWeight: 600,
  },
  errorBanner: {
    background: "#FFF0F0",
    border: "1px solid #FECACA",
    borderRadius: 10,
    padding: "12px 16px",
    marginBottom: 16,
    fontSize: 13,
    color: "#DC2626",
    fontWeight: 600,
  },
  successBanner: {
    background: "#F0FDF4",
    border: "1px solid #86EFAC",
    borderRadius: 10,
    padding: "16px 18px",
    fontSize: 14,
    color: "#166534",
    lineHeight: 1.6,
    fontWeight: 600,
  },
  fieldError: { fontSize: 12, color: "#DC2626", marginTop: 5 },
};

function submitBtnStyle(disabled) {
  return {
    width: "100%",
    height: 48,
    borderRadius: 10,
    border: 0,
    background: disabled ? "#F3F4F6" : "#4caf50",
    color: disabled ? "#9CA3AF" : "#fff",
    fontWeight: 800,
    fontSize: 15,
    cursor: disabled ? "not-allowed" : "pointer",
    marginTop: 4,
    fontFamily: "inherit",
  };
}

export default function CreativeProsPage() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [services, setServices] = useState([]);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
    setErrors((current) => ({ ...current, [name]: "" }));
    setServerError("");
  }

  function toggleService(serviceKey) {
    setServices((current) => (
      current.includes(serviceKey)
        ? current.filter((item) => item !== serviceKey)
        : [...current, serviceKey]
    ));
    setErrors((current) => ({ ...current, services: "" }));
    setServerError("");
  }

  function validate() {
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = "Name is required.";
    if (!form.email.trim()) nextErrors.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = "Enter a valid email address.";
    }
    if (!form.city.trim()) nextErrors.city = "City is required.";
    if (!form.state.trim()) nextErrors.state = "State is required.";
    if (!services.length) nextErrors.services = "Select at least one service.";
    return nextErrors;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setServerError("");
    const nextErrors = validate();
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API}/api/creative-pros`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          business_name: form.business_name.trim() || null,
          email: form.email.trim(),
          phone: form.phone.trim() || null,
          city: form.city.trim(),
          state: form.state.trim(),
          website_url: form.website_url.trim() || null,
          instagram_url: form.instagram_url.trim() || null,
          services,
          referral_interest: form.referral_interest,
          short_note: form.short_note.trim() || null,
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) {
        throw new Error(data?.error || "Something went wrong. Please try again.");
      }
      setSuccess(true);
    } catch (error) {
      setServerError(error.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={styles.pageWrap}>
      <main style={styles.pageMain}>
        <div style={styles.header}>
          <BrandLogo height={48} radius={14} matchPageBackground={false} />
          <div style={styles.pageTitle}>Creative Pros</div>
          <div style={styles.pageSubtitle}>
            Join Menuply’s Creative Pros Network.
          </div>
          <p style={{ ...styles.pageSubtitle, marginTop: 12, marginBottom: 0 }}>
            We’re building a network of designers, photographers, and other creative professionals who serve restaurants.
            As Menuply grows, participating Creative Pros may be featured or referred to restaurants looking for menu design,
            food photography, branding, and related services.
          </p>
        </div>

        {success ? (
          <div style={styles.successBanner}>
            Thanks — you’re on the Creative Pros list. We’ll reach out as opportunities develop.
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            {serverError ? <div style={styles.errorBanner}>{serverError}</div> : null}

            <div style={styles.section}>
              <div style={styles.sectionTitle}>Contact</div>

              <div style={styles.fieldGroup}>
                <label htmlFor="creative-pro-name" style={styles.label}>
                  Name<span style={styles.required}>*</span>
                </label>
                <input
                  id="creative-pro-name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  style={errors.name ? styles.inputError : styles.input}
                />
                {errors.name ? <div style={styles.fieldError}>{errors.name}</div> : null}
              </div>

              <div style={styles.fieldGroup}>
                <label htmlFor="creative-pro-business" style={styles.label}>Business Name</label>
                <input
                  id="creative-pro-business"
                  name="business_name"
                  type="text"
                  value={form.business_name}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>

              <div style={styles.row2}>
                <div style={styles.halfField}>
                  <label htmlFor="creative-pro-email" style={styles.label}>
                    Email<span style={styles.required}>*</span>
                  </label>
                  <input
                    id="creative-pro-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={handleChange}
                    style={errors.email ? styles.inputError : styles.input}
                  />
                  {errors.email ? <div style={styles.fieldError}>{errors.email}</div> : null}
                </div>

                <div style={styles.halfField}>
                  <label htmlFor="creative-pro-phone" style={styles.label}>Phone</label>
                  <input
                    id="creative-pro-phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    value={form.phone}
                    onChange={handleChange}
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.row2}>
                <div style={styles.halfField}>
                  <label htmlFor="creative-pro-city" style={styles.label}>
                    City<span style={styles.required}>*</span>
                  </label>
                  <input
                    id="creative-pro-city"
                    name="city"
                    type="text"
                    autoComplete="address-level2"
                    value={form.city}
                    onChange={handleChange}
                    style={errors.city ? styles.inputError : styles.input}
                  />
                  {errors.city ? <div style={styles.fieldError}>{errors.city}</div> : null}
                </div>

                <div style={styles.halfField}>
                  <label htmlFor="creative-pro-state" style={styles.label}>
                    State<span style={styles.required}>*</span>
                  </label>
                  <input
                    id="creative-pro-state"
                    name="state"
                    type="text"
                    autoComplete="address-level1"
                    value={form.state}
                    onChange={handleChange}
                    style={errors.state ? styles.inputError : styles.input}
                  />
                  {errors.state ? <div style={styles.fieldError}>{errors.state}</div> : null}
                </div>
              </div>
            </div>

            <div style={styles.section}>
              <div style={styles.sectionTitle}>Portfolio</div>

              <div style={styles.fieldGroup}>
                <label htmlFor="creative-pro-website" style={styles.label}>Website / Portfolio URL</label>
                <input
                  id="creative-pro-website"
                  name="website_url"
                  type="url"
                  value={form.website_url}
                  onChange={handleChange}
                  placeholder="https://"
                  style={styles.input}
                />
              </div>

              <div style={styles.fieldGroup}>
                <label htmlFor="creative-pro-instagram" style={styles.label}>Instagram URL</label>
                <input
                  id="creative-pro-instagram"
                  name="instagram_url"
                  type="url"
                  value={form.instagram_url}
                  onChange={handleChange}
                  placeholder="https://instagram.com/"
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.section}>
              <div style={styles.sectionTitle}>Services Offered</div>
              <div style={styles.checkboxGrid}>
                {SERVICE_OPTIONS.map((option) => (
                  <label key={option.key} style={styles.checkboxRow}>
                    <input
                      type="checkbox"
                      checked={services.includes(option.key)}
                      onChange={() => toggleService(option.key)}
                      style={styles.checkbox}
                    />
                    <span style={styles.checkboxLabel}>{option.label}</span>
                  </label>
                ))}
              </div>
              {errors.services ? <div style={styles.fieldError}>{errors.services}</div> : null}
            </div>

            <div style={styles.section}>
              <div style={styles.sectionTitle}>Additional Info</div>

              <div style={styles.fieldGroup}>
                <label htmlFor="creative-pro-note" style={styles.label}>Short Note</label>
                <textarea
                  id="creative-pro-note"
                  name="short_note"
                  value={form.short_note}
                  onChange={handleChange}
                  style={styles.textarea}
                />
              </div>

              <label style={styles.checkboxRow}>
                <input
                  type="checkbox"
                  name="referral_interest"
                  checked={form.referral_interest}
                  onChange={handleChange}
                  style={styles.checkbox}
                />
                <span style={styles.checkboxLabel}>
                  I’m interested in receiving potential referrals from Menuply.
                </span>
              </label>
            </div>

            <button type="submit" style={submitBtnStyle(submitting)} disabled={submitting}>
              {submitting ? "Submitting..." : "Join the Creative Pros Network"}
            </button>
          </form>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
