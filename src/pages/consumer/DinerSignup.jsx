import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BrandLogo } from "../../components/BrandLogo.jsx";
import SiteFooter from "../../components/SiteFooter.jsx";
import { useConsumer } from "../../context/ConsumerContext.jsx";
import { buildLegalConsentPayload } from "../../lib/legalConsent.js";

const BENEFITS = [
  "Discover restaurants and menu items",
  "Save your favorite menus",
  "Like dishes and restaurants you want to remember",
  "Share your favorite finds with friends",
  "Receive personalized recommendations from your personal waiter",
];

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
    boxSizing: "border-box",
  },
  header: { marginBottom: 28 },
  pageTitle: { fontSize: 28, fontWeight: 800, marginTop: 16, marginBottom: 8, letterSpacing: "-0.03em" },
  intro: { fontSize: 15, color: "#374151", lineHeight: 1.6, maxWidth: 640, margin: "0 0 14px" },
  introHeading: { fontSize: 15, color: "#374151", lineHeight: 1.6, fontWeight: 800, margin: "20px 0 8px" },
  benefits: { color: "#374151", fontSize: 15, lineHeight: 1.6, margin: "0 0 16px", paddingLeft: 22 },
  closing: { fontSize: 15, color: "#374151", lineHeight: 1.6, fontWeight: 800, margin: 0 },
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
  label: { display: "block", fontSize: 13, fontWeight: 700, marginBottom: 6, color: "#374151" },
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
  inputError: { borderColor: "#FECACA" },
  fieldError: { fontSize: 12, color: "#DC2626", marginTop: 5 },
  errorBanner: {
    background: "#FFF0F0",
    border: "1px solid #FECACA",
    borderRadius: 10,
    padding: "12px 16px",
    marginBottom: 16,
    fontSize: 13,
    color: "#DC2626",
  },
  checkboxRow: { display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" },
  checkbox: { marginTop: 3, width: 16, height: 16, accentColor: "#4caf50", flexShrink: 0 },
  checkboxLabel: { fontSize: 12, color: "#374151", lineHeight: 1.55 },
  legalLink: { color: "#1F4E3D", fontWeight: 700 },
  submitButton: {
    width: "100%",
    height: 48,
    borderRadius: 10,
    border: 0,
    background: "#4caf50",
    color: "#fff",
    fontWeight: 800,
    fontSize: 15,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  signIn: { textAlign: "center", color: "#6B7280", fontSize: 13, marginTop: 16 },
};

export default function DinerSignup() {
  const { signup } = useConsumer();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [legalConsent, setLegalConsent] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = {};
    if (!email.trim()) nextErrors.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) nextErrors.email = "Enter a valid email address.";
    if (!password) nextErrors.password = "Password is required.";
    else if (password.length < 8) nextErrors.password = "Password must be at least 8 characters.";
    if (!confirmPassword) nextErrors.confirmPassword = "Confirm your password.";
    else if (password !== confirmPassword) nextErrors.confirmPassword = "Passwords do not match.";
    if (!legalConsent) nextErrors.legalConsent = "You must agree before creating an account.";
    setErrors(nextErrors);
    setServerError("");
    if (Object.keys(nextErrors).length) return;

    setSubmitting(true);
    try {
      await signup({
        email: email.trim(),
        password,
        confirm_password: confirmPassword,
        ...buildLegalConsentPayload(),
      });
      navigate("/account/welcome", { replace: true, state: { redirectTo: "/" } });
    } catch (error) {
      setServerError(error.message || "Sign up failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={styles.pageWrap}>
      <main style={styles.pageMain}>
        <header style={styles.header}>
          <BrandLogo height={48} radius={14} matchPageBackground={false} />
          <h1 style={styles.pageTitle}>Diner Signup</h1>
          <p style={styles.intro}>
            Menuply is different. We built our platform to help you discover all restaurant menus in the city—not just the restaurants that sell through our platform. Our goal is to give you the information you need to make better dining decisions, and we&apos;re continuously adding new menus to the platform.
          </p>
          <p style={styles.intro}>
            We don&apos;t stop at collecting menus. We enhance them by adding estimated nutrition information and other useful details. This allows you to search for menu items in ways that weren&apos;t previously possible. Search for meals based on your dietary preferences, such as high-protein or lower-calorie options, or set your dietary and allergen preferences—such as vegetarian or gluten-free—and Menuply can automatically hide menu items that don&apos;t match your selections.
          </p>
          <p style={styles.intro}>
            Finally, we believe great food should come with great value—not unnecessary markups. We operate a lower-cost ordering platform so participating restaurants can pass those savings on to you whenever possible. One of our core values is simple: everything we do should help restaurants offer diners the best prices possible.
          </p>
          <p style={styles.intro}>Once you&apos;ve found the perfect meal, ordering for pickup or delivery is simple.</p>
          <h2 style={styles.introHeading}>Create your free account to:</h2>
          <ul style={styles.benefits}>
            {BENEFITS.map((benefit) => <li key={benefit}>{benefit}</li>)}
          </ul>
          <p style={styles.closing}>Join today and discover better value and a new way to search for your favorite foods.</p>
        </header>

        {serverError ? <div style={styles.errorBanner}>{serverError}</div> : null}

        <form onSubmit={handleSubmit} noValidate>
          <div style={styles.section}>
            <div style={styles.sectionTitle}>Account</div>
            <div style={styles.fieldGroup}>
              <label htmlFor="diner-email" style={styles.label}>Email*</label>
              <input id="diner-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} style={{ ...styles.input, ...(errors.email ? styles.inputError : null) }} />
              {errors.email ? <div style={styles.fieldError}>{errors.email}</div> : null}
            </div>
            <div style={styles.fieldGroup}>
              <label htmlFor="diner-password" style={styles.label}>Password*</label>
              <input id="diner-password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} style={{ ...styles.input, ...(errors.password ? styles.inputError : null) }} />
              {errors.password ? <div style={styles.fieldError}>{errors.password}</div> : null}
            </div>
            <div style={styles.fieldGroup}>
              <label htmlFor="diner-confirm-password" style={styles.label}>Confirm password*</label>
              <input id="diner-confirm-password" type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} style={{ ...styles.input, ...(errors.confirmPassword ? styles.inputError : null) }} />
              {errors.confirmPassword ? <div style={styles.fieldError}>{errors.confirmPassword}</div> : null}
            </div>
          </div>

          <div style={styles.section}>
            <div style={styles.sectionTitle}>Legal</div>
            <label style={styles.checkboxRow}>
              <input type="checkbox" checked={legalConsent} onChange={(event) => setLegalConsent(event.target.checked)} style={styles.checkbox} />
              <span style={styles.checkboxLabel}>
                I agree to the <Link to="/terms" target="_blank" rel="noreferrer" style={styles.legalLink}>Terms of Use</Link> and <Link to="/privacy" target="_blank" rel="noreferrer" style={styles.legalLink}>Privacy Policy</Link> and consent to receive electronic communications from Menuply regarding my account, orders, services, and important updates.
              </span>
            </label>
            {errors.legalConsent ? <div style={styles.fieldError}>{errors.legalConsent}</div> : null}
          </div>

          <button type="submit" disabled={submitting} style={{ ...styles.submitButton, ...(submitting ? { opacity: 0.6, cursor: "not-allowed" } : null) }}>
            {submitting ? "Creating account..." : "Create account"}
          </button>
          <p style={styles.signIn}>Already have an account? <Link to="/account/login" style={styles.legalLink}>Sign in</Link></p>
        </form>
      </main>
      <SiteFooter />
    </div>
  );
}
