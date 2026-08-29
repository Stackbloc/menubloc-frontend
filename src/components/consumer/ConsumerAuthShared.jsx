import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { formatPresumedPublicNameFromLegal } from "../../lib/dinerPublicIdentity.js";
import { BrandLogo } from "../BrandLogo.jsx";

const SCREEN_NAME_MAX_LENGTH = 40;

const GOOGLE_SCRIPT = "https://accounts.google.com/gsi/client";
const APPLE_SCRIPT = "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js";
const scriptPromises = new Map();

function loadScript(src) {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Browser APIs are unavailable"));
  }

  if (scriptPromises.has(src)) {
    return scriptPromises.get(src);
  }

  const existing = document.querySelector(`script[src="${src}"]`);
  if (existing) {
    const promise = Promise.resolve();
    scriptPromises.set(src, promise);
    return promise;
  }

  const promise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });

  scriptPromises.set(src, promise);
  return promise;
}

export function getPasswordChecklist(password) {
  const value = String(password || "");
  return {
    minLength: value.length >= 8,
    number: /\d/.test(value),
    uppercase: /[A-Z]/.test(value),
  };
}

function AuthLogo() {
  return (
    <div style={{ marginBottom: 14 }}>
      <BrandLogo
        to="/"
        height={36}
        radius={8}
        matchPageBackground={false}
        pageColor="#0B0F0C"
        wordmarkColor="#FFFFFF"
        ariaLabel="Go to Menuply home"
      />
    </div>
  );
}

export function AuthPageFrame({ title, subtitle, children, footer, showLogo = true }) {
  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {showLogo !== false && <AuthLogo />}
        <h1 style={styles.heading}>{title}</h1>
        {subtitle ? <p style={styles.subheading}>{subtitle}</p> : null}
        {children}
        {footer ? <div style={styles.footerBlock}>{footer}</div> : null}
      </div>
    </div>
  );
}

export function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  placeholder,
  error,
  describedBy,
  hint,
  variant = "dark",
}) {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);
  const showLabel = t("auth.showPassword", "Show");
  const hideLabel = t("auth.hidePassword", "Hide");
  const theme = variant === "light" ? lightFieldStyles : styles;

  return (
    <div style={theme.fieldGroup}>
      <label htmlFor={id} style={theme.label}>{label}</label>
      <div style={theme.passwordWrapper}>
        <input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={onChange}
          style={{
            ...theme.input,
            ...theme.passwordInput,
            ...(error ? theme.inputError : null),
          }}
          placeholder={placeholder}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={describedBy}
          required
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          style={theme.passwordToggle}
          aria-label={`${visible ? hideLabel : showLabel} ${label.toLowerCase()}`}
          aria-pressed={visible}
        >
          {visible ? hideLabel : showLabel}
        </button>
      </div>
      {hint && !error ? <div style={styles.fieldHint}>{hint}</div> : null}
      {error ? <div id={`${id}-error`} style={styles.fieldError}>{error}</div> : null}
    </div>
  );
}

export function SignupScreenNameField({
  id = "signup-screen-name",
  screenName,
  onScreenNameChange,
  firstName,
  lastName,
  variant = "dark",
}) {
  const theme = variant === "light" ? lightFieldStyles : styles;
  const trimmedScreen = String(screenName || "").trim();
  const presumed = formatPresumedPublicNameFromLegal(firstName, lastName);
  const hint = trimmedScreen
    ? "Friends will see this screen name on Connect, comments, and your profile."
    : presumed
      ? `If you leave this blank, your default screen name will be ${presumed}.`
      : "Optional. If you leave this blank, your default screen name will be your first name and last initial.";

  return (
    <div style={theme.fieldGroup}>
      <label htmlFor={id} style={theme.label}>
        Screen name <span style={styles.optional}>(optional)</span>
      </label>
      <input
        id={id}
        type="text"
        autoComplete="nickname"
        value={screenName}
        onChange={onScreenNameChange}
        style={theme.input}
        placeholder="Choose a screen name"
        maxLength={SCREEN_NAME_MAX_LENGTH}
      />
      <div
        style={{
          ...styles.fieldHint,
          ...(variant === "light" ? { color: "#6B7280" } : null),
        }}
      >
        {hint}
      </div>
    </div>
  );
}

export function PasswordChecklist({ password }) {
  const { t } = useLanguage();
  const checklist = useMemo(() => getPasswordChecklist(password), [password]);
  const items = [
    { key: "minLength", label: t("auth.checklist.minLength", "At least 8 characters") },
    { key: "number", label: t("auth.checklist.number", "At least 1 number") },
    { key: "uppercase", label: t("auth.checklist.uppercase", "At least 1 uppercase letter") },
  ];

  return (
    <div style={styles.statusCard} aria-live="polite">
      <div style={styles.statusHeading}>{t("auth.passwordRequirements", "Password requirements")}</div>
      <ul style={styles.statusList}>
        {items.map((item) => (
          <li key={item.key} style={styles.statusListItem}>
            <span style={checklist[item.key] ? styles.statusDotSuccess : styles.statusDotIdle} aria-hidden="true" />
            <span style={checklist[item.key] ? styles.statusTextSuccess : styles.statusTextIdle}>{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PasswordMatchStatus({ password, confirmPassword }) {
  const { t } = useLanguage();
  if (!confirmPassword) return null;

  const matches = password === confirmPassword && Boolean(password);
  return (
    <div
      style={matches ? styles.successNote : styles.warningNote}
      aria-live="polite"
    >
      {matches
        ? t("auth.passwordsMatch", "Passwords match")
        : t("auth.passwordsDoNotMatch", "Passwords do not match")}
    </div>
  );
}

export function FormError({ error, variant = "dark" }) {
  if (!error) return null;
  const bannerStyle = variant === "light" ? lightFieldStyles.errorBanner : styles.errorBanner;
  return <p style={bannerStyle} role="alert">{error}</p>;
}

export function Divider() {
  const { t } = useLanguage();
  return (
    <div style={styles.dividerRow} aria-hidden="true">
      <span style={styles.dividerLine} />
      <span style={styles.dividerText}>{t("auth.orContinueWith", "or continue with")}</span>
      <span style={styles.dividerLine} />
    </div>
  );
}

/** True when FE has Google Sign-In client id (buttons must not render otherwise). */
export function isGoogleAuthConfigured() {
  return Boolean(String(import.meta.env.VITE_GOOGLE_CLIENT_ID || "").trim());
}

/** True when FE has Apple client id + redirect URI. */
export function isAppleAuthConfigured() {
  return Boolean(
    String(import.meta.env.VITE_APPLE_CLIENT_ID || "").trim() &&
      String(import.meta.env.VITE_APPLE_REDIRECT_URI || "").trim()
  );
}

function GoogleButtonFallback({ onClick, disabled, label }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} style={{ ...styles.oauthButton, ...(disabled ? styles.oauthButtonDisabled : null) }}>
      <span style={styles.oauthIconCircle}>G</span>
      <span>{label}</span>
    </button>
  );
}

export function GoogleSignInButton({ onCredential, onError, disabled, contextLabel }) {
  const { t } = useLanguage();
  const buttonRef = useRef(null);
  const clientId = String(import.meta.env.VITE_GOOGLE_CLIENT_ID || "").trim();

  useEffect(() => {
    let cancelled = false;

    if (!clientId || !buttonRef.current || disabled) {
      return undefined;
    }

    loadScript(GOOGLE_SCRIPT)
      .then(() => {
        if (cancelled || !window.google?.accounts?.id || !buttonRef.current) return;

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (!response?.credential) {
              onError?.("Google sign-in did not return a credential");
              return;
            }
            onCredential(response.credential);
          },
        });

        buttonRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(buttonRef.current, {
          type: "standard",
          theme: "outline",
          shape: "pill",
          size: "large",
          width: buttonRef.current.offsetWidth || 360,
          text: contextLabel === "signup" ? "signup_with" : "signin_with",
          logo_alignment: "left",
        });
      })
      .catch(() => onError?.(t("auth.googleLoadFailed", "Google sign-in could not be loaded")));

    return () => {
      cancelled = true;
    };
  }, [clientId, contextLabel, disabled, onCredential, onError]);

  // Never render a dead Google control — hide until configured.
  if (!clientId) return null;

  if (disabled) {
    return (
      <GoogleButtonFallback
        label={t("auth.google", "Google")}
        disabled
      />
    );
  }

  return (
    <div
      ref={buttonRef}
      style={styles.googleButtonMount}
      aria-label={t("auth.continueGoogle", "Continue with Google")}
    />
  );
}

export function AppleSignInButton({ onSuccess, onError, disabled }) {
  const { t } = useLanguage();
  const clientId = String(import.meta.env.VITE_APPLE_CLIENT_ID || "").trim();
  const redirectURI = String(import.meta.env.VITE_APPLE_REDIRECT_URI || "").trim();

  // Never render a dead Apple control — hide until configured.
  if (!clientId || !redirectURI) return null;

  async function handleClick() {
    if (disabled) return;

    try {
      await loadScript(APPLE_SCRIPT);
      if (!window.AppleID?.auth) {
        throw new Error("Apple auth SDK unavailable");
      }

      window.AppleID.auth.init({
        clientId,
        scope: "name email",
        redirectURI,
        usePopup: true,
        state: window.crypto?.randomUUID?.() || String(Date.now()),
      });

      const response = await window.AppleID.auth.signIn();
      if (!response?.authorization?.code && !response?.authorization?.id_token) {
        throw new Error("Apple sign-in did not return authorization data");
      }

      onSuccess({
        code: response.authorization?.code,
        id_token: response.authorization?.id_token,
        user: response.user || null,
      });
    } catch (error) {
      if (String(error?.error || "").toLowerCase() === "popup_closed_by_user") {
        return;
      }
      onError?.(t("auth.appleFailed", "Apple sign-in could not be completed"));
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      style={{ ...styles.oauthButton, ...styles.appleButton, ...(disabled ? styles.oauthButtonDisabled : null) }}
    >
      <span style={styles.oauthIconCircle} aria-hidden="true">A</span>
      <span>{t("auth.apple", "Apple")}</span>
    </button>
  );
}

export function SocialAuthSection({
  mode,
  disabled,
  error,
  onError,
  onGoogleCredential,
  onApplePayload,
}) {
  const googleConfigured = isGoogleAuthConfigured();
  const appleConfigured = isAppleAuthConfigured();
  const showGoogle = googleConfigured && typeof onGoogleCredential === "function";
  const showApple = appleConfigured && typeof onApplePayload === "function";

  // Do not show dead OAuth placeholders when providers are not configured.
  if (!showGoogle && !showApple) return null;

  return (
    <div style={styles.oauthSection} data-testid="consumer-social-auth">
      <Divider />
      {error ? <p style={styles.errorBanner}>{error}</p> : null}
      <div style={styles.oauthStack}>
        {showGoogle ? (
          <GoogleSignInButton
            contextLabel={mode}
            disabled={disabled}
            onCredential={onGoogleCredential}
            onError={onError}
          />
        ) : null}
        {showApple ? (
          <AppleSignInButton
            disabled={disabled}
            onSuccess={onApplePayload}
            onError={onError}
          />
        ) : null}
      </div>
    </div>
  );
}

export const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    background: "#0B0F0C",
    padding: "48px 16px 32px",
    fontFamily: "var(--gb-font-ui), Inter, Arial, sans-serif",
  },
  card: {
    background: "#121A14",
    borderRadius: "20px",
    padding: "24px 24px",
    width: "100%",
    maxWidth: "460px",
    boxShadow: "0 18px 45px rgba(0,0,0,0.5)",
    border: "1px solid #1F2937",
  },
  brand: {
    display: "inline-block",
    fontSize: "20px",
    fontWeight: 800,
    color: "#22C55E",
    textDecoration: "none",
    marginBottom: "20px",
  },
  heading: {
    fontSize: "28px",
    lineHeight: 1.15,
    fontWeight: 750,
    color: "#FFFFFF",
    margin: "0 0 8px",
  },
  subheading: {
    fontSize: "15px",
    color: "#9CA3AF",
    margin: "0 0 24px",
    lineHeight: 1.5,
  },
  footerBlock: {
    marginTop: "20px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  label: {
    fontSize: "14px",
    fontWeight: 650,
    color: "#D1D5DB",
  },
  input: {
    width: "100%",
    minHeight: "50px",
    borderRadius: "12px",
    border: "1.5px solid #1F2937",
    padding: "12px 14px",
    fontSize: "16px",
    lineHeight: 1.4,
    outline: "none",
    color: "#F9FAFB",
    background: "#0B0F0C",
    fontFamily: "inherit",
    boxSizing: "border-box",
  },
  inputError: {
    borderColor: "#d14343",
    boxShadow: "0 0 0 3px rgba(209, 67, 67, 0.12)",
  },
  passwordWrapper: {
    position: "relative",
  },
  passwordInput: {
    paddingRight: "86px",
  },
  passwordToggle: {
    position: "absolute",
    top: "50%",
    right: "10px",
    transform: "translateY(-50%)",
    border: "none",
    background: "transparent",
    color: "#22C55E",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
    padding: "8px",
  },
  optional: {
    fontWeight: 500,
    color: "#6B7280",
  },
  fieldHint: {
    fontSize: "12px",
    color: "#6B7280",
    lineHeight: 1.4,
  },
  fieldError: {
    fontSize: "13px",
    color: "#b42318",
    margin: 0,
  },
  errorBanner: {
    background: "#1c0a0a",
    border: "1px solid #450a0a",
    borderRadius: "12px",
    padding: "12px 14px",
    fontSize: "14px",
    color: "#fca5a5",
    margin: 0,
  },
  successNote: {
    background: "rgba(34,197,94,0.08)",
    border: "1px solid rgba(34,197,94,0.25)",
    borderRadius: "12px",
    padding: "10px 12px",
    color: "#22C55E",
    fontSize: "14px",
  },
  warningNote: {
    background: "#1c1a0a",
    border: "1px solid #44400a",
    borderRadius: "12px",
    padding: "10px 12px",
    color: "#FCD34D",
    fontSize: "14px",
  },
  statusCard: {
    border: "1px solid #1F2937",
    borderRadius: "14px",
    padding: "12px 14px",
    background: "#0B0F0C",
  },
  statusHeading: {
    fontSize: "13px",
    fontWeight: 700,
    color: "#9CA3AF",
    marginBottom: "8px",
  },
  statusList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  statusListItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "14px",
  },
  statusDotSuccess: {
    width: "10px",
    height: "10px",
    borderRadius: "999px",
    background: "#22C55E",
    flexShrink: 0,
  },
  statusDotIdle: {
    width: "10px",
    height: "10px",
    borderRadius: "999px",
    background: "#374151",
    flexShrink: 0,
  },
  statusTextSuccess: {
    color: "#22C55E",
    fontWeight: 600,
  },
  statusTextIdle: {
    color: "#6B7280",
  },
  submitButton: {
    minHeight: "50px",
    borderRadius: "12px",
    background: "linear-gradient(180deg, #22C55E 0%, #16A34A 100%)",
    color: "#0B0F0C",
    fontSize: "16px",
    fontWeight: 750,
    border: "none",
    cursor: "pointer",
    fontFamily: "inherit",
    padding: "12px 20px",
  },
  submitButtonDisabled: {
    opacity: 0.7,
    cursor: "wait",
  },
  checkboxRow: {
    display: "grid",
    gridTemplateColumns: "18px 1fr",
    gap: "10px",
    alignItems: "start",
  },
  checkbox: {
    width: "16px",
    height: "16px",
    marginTop: "2px",
    accentColor: "#22C55E",
  },
  checkboxLabel: {
    fontSize: "13px",
    lineHeight: 1.5,
    color: "#4B5563",
  },
  footer: {
    textAlign: "center",
    fontSize: "14px",
    color: "#6B7280",
    margin: 0,
  },
  link: {
    color: "#22C55E",
    fontWeight: 700,
    textDecoration: "none",
  },
  dividerRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    margin: "4px 0 0",
  },
  dividerLine: {
    flex: 1,
    height: "1px",
    background: "#1F2937",
  },
  dividerText: {
    fontSize: "13px",
    color: "#6B7280",
    whiteSpace: "nowrap",
  },
  oauthSection: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  oauthStack: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  googleButtonMount: {
    minHeight: "42px",
    width: "100%",
  },
  oauthButton: {
    minHeight: "48px",
    borderRadius: "999px",
    border: "1px solid #1F2937",
    background: "#121A14",
    color: "#F9FAFB",
    fontSize: "15px",
    fontWeight: 650,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    padding: "0 16px",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  oauthButtonDisabled: {
    opacity: 0.6,
    cursor: "not-allowed",
  },
  oauthIconCircle: {
    width: "24px",
    height: "24px",
    borderRadius: "999px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f6f6f6",
    fontWeight: 800,
  },
  appleButton: {
    background: "#111827",
    color: "#fff",
    borderColor: "#111827",
  },
};

const lightFieldStyles = {
  fieldGroup: {
    marginBottom: 14,
  },
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 6,
    color: "#374151",
  },
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
    outline: "none",
  },
  inputError: {
    borderColor: "#d14343",
    boxShadow: "0 0 0 3px rgba(209, 67, 67, 0.12)",
  },
  passwordWrapper: {
    position: "relative",
  },
  passwordInput: {
    paddingRight: "72px",
  },
  passwordToggle: {
    position: "absolute",
    top: "50%",
    right: 8,
    transform: "translateY(-50%)",
    border: "none",
    background: "transparent",
    color: "#1F4E3D",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    padding: "6px 8px",
  },
  errorBanner: {
    background: "#FEF2F2",
    border: "1px solid #FECACA",
    borderRadius: 10,
    padding: "10px 14px",
    fontSize: 13,
    color: "#B42318",
    margin: "0 0 12px",
    textAlign: "center",
    maxWidth: 420,
    marginLeft: "auto",
    marginRight: "auto",
  },
};
