import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BrandLogo } from "../../components/BrandLogo.jsx";
import SmsAuthModal from "../../components/auth/SmsAuthModal.jsx";
import SiteFooter from "../../components/SiteFooter.jsx";
import { useConsumer } from "../../context/ConsumerContext.jsx";
import { buildLegalConsentPayload } from "../../lib/legalConsent.js";
import { FormError, PasswordField } from "../../components/consumer/ConsumerAuthShared.jsx";

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
  const navigate = useNavigate();
  const { signup } = useConsumer();
  const redirectTo = useMemo(() => "/", []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [legalConsent, setLegalConsent] = useState(false);
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [smsOpen, setSmsOpen] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");

    if (!email.trim()) { setFormError("Email is required."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setFormError("Enter a valid email address."); return; }
    if (!password) { setFormError("Password is required."); return; }
    if (password.length < 8) { setFormError("Password must be at least 8 characters."); return; }
    if (!legalConsent) {
      setFormError("You must agree to the Terms of Use and Privacy Policy and consent to electronic communications.");
      return;
    }

    setLoading(true);
    try {
      const result = await signup({
        email: email.trim(),
        password,
        confirm_password: password,
        ...buildLegalConsentPayload(),
      });
      if (result?.requires_phone_verification) {
        setSmsOpen(true);
        return;
      }
      navigate("/account/welcome", { replace: true, state: { redirectTo } });
    } catch (error) {
      setFormError(error.message || "Sign up failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.pageWrap}>
      <main style={styles.pageMain}>
        <header style={styles.header}>
          <BrandLogo height={48} radius={14} matchPageBackground={false} />
          <h1 style={styles.pageTitle}>Diner Signup</h1>
          <p style={styles.intro}>Menuply is different.</p>
          <p style={styles.intro}>
            We built Menuply to help you discover <strong>all</strong> restaurant menus in your city—not just the restaurants that sell through our platform. We enhance menus with estimated nutrition information, giving you new ways to search for food based on your dietary preferences and nutrition goals.
          </p>
          <p style={styles.intro}>
            We believe ordering food shouldn&apos;t cost a small fortune. That&apos;s why Menuply keeps restaurant fees low, giving participating restaurants more room to offer better prices to diners. We encourage every participating restaurant to pass those savings on to you.
          </p>
          <p style={{ ...styles.intro, fontWeight: 800, marginBottom: 0 }}>
            Join today and discover a smarter way to search for food—and better value every time you order.
          </p>
        </header>

        <section style={styles.section}>
          <div style={styles.sectionTitle}>Create your account</div>
          <form onSubmit={handleSubmit} noValidate>
            <div style={styles.fieldGroup}>
              <label htmlFor="diner-signup-email" style={styles.label}>Email</label>
              <input
                id="diner-signup-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
                placeholder="you@example.com"
                required
              />
            </div>

            <PasswordField
              id="diner-signup-password"
              label="Password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
            />

            <label style={{ ...styles.checkboxRow, marginBottom: 14 }}>
              <input
                type="checkbox"
                checked={legalConsent}
                onChange={(event) => setLegalConsent(event.target.checked)}
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

            <FormError error={formError} />

            <button type="submit" disabled={loading} style={styles.submitButton}>
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>
          <p style={styles.signIn}>Already have an account? <Link to="/account/login" style={styles.legalLink}>Sign in</Link></p>
        </section>
      </main>
      <SiteFooter />
      <SmsAuthModal
        open={smsOpen}
        onClose={() => setSmsOpen(false)}
        purpose="signup"
        onSuccess={() => navigate("/account/welcome", { replace: true, state: { redirectTo } })}
      />
    </div>
  );
}
