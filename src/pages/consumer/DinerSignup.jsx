import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BrandLogo } from "../../components/BrandLogo.jsx";
import SmsAuthModal from "../../components/auth/SmsAuthModal.jsx";
import SiteFooter from "../../components/SiteFooter.jsx";
import { useConsumer } from "../../context/ConsumerContext.jsx";
import { buildLegalConsentPayload } from "../../lib/legalConsent.js";
import { buildDinerSignupAttribution } from "../../lib/dinerSignupAttribution.js";
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
    maxWidth: 640,
    margin: "0 auto",
    padding: "40px 20px 56px",
    boxSizing: "border-box",
  },
  pitchBlock: {
    padding: "28px 24px 32px",
    borderRadius: 16,
    background: "#ffffff",
    border: "1px solid #E5E7EB",
    boxShadow: "0 1px 3px rgba(15, 23, 42, 0.06)",
  },
  pitchDivider: {
    height: 1,
    border: 0,
    margin: "48px 0 0",
    background: "linear-gradient(90deg, transparent, #D1D5DB 20%, #D1D5DB 80%, transparent)",
  },
  header: { marginBottom: 0 },
  pageTitle: { fontSize: 28, fontWeight: 800, marginTop: 16, marginBottom: 10, letterSpacing: "-0.03em" },
  intro: { fontSize: 15, color: "#374151", lineHeight: 1.65, maxWidth: 560, margin: "0 0 12px" },
  introLast: {
    fontSize: 15,
    color: "#111827",
    lineHeight: 1.65,
    maxWidth: 560,
    margin: "4px 0 0",
    fontWeight: 700,
  },
  pitchSection: { marginTop: 22 },
  pitchSectionTitle: {
    fontSize: 16,
    fontWeight: 800,
    color: "#0B0F0C",
    margin: "0 0 8px",
    letterSpacing: "-0.02em",
  },
  pitchClose: {
    marginTop: 28,
    paddingTop: 20,
    borderTop: "1px solid #E5E7EB",
  },
  pitchCloseLead: {
    fontSize: 16,
    fontWeight: 800,
    color: "#0B0F0C",
    margin: "0 0 6px",
  },
  pitchCloseTag: {
    fontSize: 15,
    fontWeight: 700,
    color: "#166534",
    margin: 0,
  },
  signupBlock: {
    marginTop: 40,
    background: "#ffffff",
    border: "1px solid #E5E7EB",
    borderRadius: 16,
    padding: "32px 28px 28px",
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
  },
  signupIntro: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 1.55,
    margin: "0 0 20px",
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: "#6B7280",
    marginBottom: 18,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
  },
  formActions: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
    marginTop: 4,
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
    width: "auto",
    minWidth: 168,
    maxWidth: "100%",
    height: 44,
    borderRadius: 999,
    border: 0,
    background: "#4caf50",
    color: "#fff",
    fontWeight: 800,
    fontSize: 15,
    cursor: "pointer",
    fontFamily: "inherit",
    padding: "0 28px",
  },
  signIn: { textAlign: "center", color: "#6B7280", fontSize: 13, marginTop: 20 },
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
  const [phoneVerificationToken, setPhoneVerificationToken] = useState("");

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
        ...buildDinerSignupAttribution({ signupPage: "diner" }),
      });
      if (result?.requires_phone_verification) {
        setPhoneVerificationToken(result.phone_verification_token || "");
        setSmsOpen(true);
        return;
      }
      navigate("/account/welcome", { replace: true, state: { redirectTo } });
    } catch (error) {
      if (error?.status === 409) {
        setFormError(error.message || "An account with that email already exists.");
      } else if (error?.status >= 500 || error?.message === "Server error") {
        setFormError("We couldn't complete signup right now. Please try again in a moment.");
      } else {
        setFormError(error.message || "Sign up failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.pageWrap}>
      <main style={styles.pageMain}>
        <div style={styles.pitchBlock}>
          <header style={styles.header}>
            <BrandLogo height={48} radius={14} matchPageBackground={false} />
            <h1 style={styles.pageTitle}>Menuply is different.</h1>
            <p style={styles.intro}>
              Menuply helps you discover food, find places to eat, and make social dining plans
              with your friends.
            </p>
          </header>

          <section style={styles.pitchSection} aria-labelledby="diner-signup-menus">
            <h2 id="diner-signup-menus" style={styles.pitchSectionTitle}>
              Explore restaurant menus
            </h2>
            <p style={styles.intro}>
              Explore restaurant menus across your city—including restaurants that sell through
              Menuply and those that don&apos;t. We&apos;re constantly adding new menus—and you can
              add menus, too.
            </p>
            <p style={styles.intro}>
              Search for food any way you like: by restaurant name, menu item, nutrition goals
              like “low carb,” or dietary preferences such as a keto diet.
            </p>
            <p style={styles.intro}>
              Menuply is designed to let you explore food the way you want to.
            </p>
          </section>

          <section style={styles.pitchSection} aria-labelledby="diner-signup-live">
            <h2 id="diner-signup-live" style={styles.pitchSectionTitle}>
              See what&apos;s happening around you
            </h2>
            <p style={styles.intro}>
              Discover where people are eating, what&apos;s getting attention, and what diners are
              saying about the food. Follow the communities and places you care about through live
              local food feeds.
            </p>
          </section>

          <section style={styles.pitchSection} aria-labelledby="diner-signup-social">
            <h2 id="diner-signup-social" style={styles.pitchSectionTitle}>
              Make plans with your friends
            </h2>
            <p style={styles.intro}>
              Create Diner Crews, invite friends to eat, suggest a restaurant and time, or
              counter-propose a different place or time until you find something that works for
              everyone.
            </p>
          </section>

          <section style={styles.pitchSection} aria-labelledby="diner-signup-events">
            <h2 id="diner-signup-events" style={styles.pitchSectionTitle}>
              Go together
            </h2>
            <p style={styles.intro}>
              Discover restaurant and venue events, buy tickets, create groups, and get your
              friends together for experiences worth sharing.
            </p>
          </section>

          <section style={styles.pitchSection} aria-labelledby="diner-signup-share">
            <h2 id="diner-signup-share" style={styles.pitchSectionTitle}>
              Share what you find
            </h2>
            <p style={styles.intro}>
              Post food photos, quick reactions, and recommendations that help your friends—and
              your local food community—discover what&apos;s worth trying.
            </p>
          </section>

          <div style={styles.pitchClose}>
            <p style={styles.pitchCloseLead}>Join Menuply and make food more social.</p>
            <p style={styles.pitchCloseTag}>Discover. Plan. Eat.</p>
          </div>
        </div>

        <hr style={styles.pitchDivider} aria-hidden="true" />

        <section style={styles.signupBlock}>
          <div style={styles.sectionTitle}>Create your account</div>
          <p style={styles.signupIntro}>Enter your email and password. We&apos;ll verify your phone once before you can order.</p>
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
              variant="light"
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

            <FormError error={formError} variant="light" />

            <div style={styles.formActions}>
              <button type="submit" disabled={loading} style={styles.submitButton}>
                {loading ? "Creating account…" : "Create account"}
              </button>
            </div>
          </form>
          <p style={styles.signIn}>Already have an account? <Link to="/account/login" style={styles.legalLink}>Sign in</Link></p>
        </section>
      </main>
      <SiteFooter />
      <SmsAuthModal
        open={smsOpen}
        onClose={() => setSmsOpen(false)}
        purpose="signup"
        verificationToken={phoneVerificationToken || null}
        onSuccess={() => navigate("/account/welcome", { replace: true, state: { redirectTo } })}
      />
    </div>
  );
}
