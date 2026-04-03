import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { BrandLogo } from "../BrandLogo.jsx";

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

export function AuthPageFrame({ title, subtitle, children, footer }) {
  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <BrandLogo
          width={132}
          height={84}
          radius={20}
          pageColor="#ffffff"
          linkStyle={{ marginBottom: 18 }}
        />
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
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div style={styles.fieldGroup}>
      <label htmlFor={id} style={styles.label}>{label}</label>
      <div style={styles.passwordWrapper}>
        <input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={onChange}
          style={{
            ...styles.input,
            ...styles.passwordInput,
            ...(error ? styles.inputError : null),
          }}
          placeholder={placeholder}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={describedBy}
          required
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          style={styles.passwordToggle}
          aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`}
          aria-pressed={visible}
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
      {error ? <div id={`${id}-error`} style={styles.fieldError}>{error}</div> : null}
    </div>
  );
}

export function PasswordChecklist({ password }) {
  const checklist = useMemo(() => getPasswordChecklist(password), [password]);
  const items = [
    { key: "minLength", label: "At least 8 characters" },
    { key: "number", label: "At least 1 number" },
    { key: "uppercase", label: "At least 1 uppercase letter" },
  ];

  return (
    <div style={styles.statusCard} aria-live="polite">
      <div style={styles.statusHeading}>Password requirements</div>
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
  if (!confirmPassword) return null;

  const matches = password === confirmPassword && Boolean(password);
  return (
    <div
      style={matches ? styles.successNote : styles.warningNote}
      aria-live="polite"
    >
      {matches ? "Passwords match" : "Passwords do not match"}
    </div>
  );
}

export function FormError({ error }) {
  if (!error) return null;
  return <p style={styles.errorBanner}>{error}</p>;
}

export function Divider() {
  return (
    <div style={styles.dividerRow} aria-hidden="true">
      <span style={styles.dividerLine} />
      <span style={styles.dividerText}>or continue with</span>
      <span style={styles.dividerLine} />
    </div>
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
      .catch(() => onError?.("Google sign-in could not be loaded"));

    return () => {
      cancelled = true;
    };
  }, [clientId, contextLabel, disabled, onCredential, onError]);

  if (!clientId) {
    return (
      <GoogleButtonFallback
        label="Continue with Google"
        disabled
      />
    );
  }

  if (disabled) {
    return (
      <GoogleButtonFallback
        label="Continue with Google"
        disabled
      />
    );
  }

  return <div ref={buttonRef} style={styles.googleButtonMount} aria-label="Continue with Google" />;
}

export function AppleSignInButton({ onSuccess, onError, disabled }) {
  const clientId = String(import.meta.env.VITE_APPLE_CLIENT_ID || "").trim();
  const redirectURI = String(import.meta.env.VITE_APPLE_REDIRECT_URI || "").trim();

  async function handleClick() {
    if (disabled) return;
    if (!clientId || !redirectURI) {
      onError?.("Apple sign-in is not configured for this environment");
      return;
    }

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
      onError?.("Apple sign-in could not be completed");
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      style={{ ...styles.oauthButton, ...styles.appleButton, ...(disabled ? styles.oauthButtonDisabled : null) }}
    >
      <span style={styles.appleLogo} aria-hidden="true">Apple</span>
      <span>Continue with Apple</span>
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
  return (
    <div style={styles.oauthSection}>
      <Divider />
      {error ? <p style={styles.errorBanner}>{error}</p> : null}
      <div style={styles.oauthStack}>
        <GoogleSignInButton
          contextLabel={mode}
          disabled={disabled}
          onCredential={onGoogleCredential}
          onError={onError}
        />
        <AppleSignInButton
          disabled={disabled}
          onSuccess={onApplePayload}
          onError={onError}
        />
      </div>
    </div>
  );
}

export const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(180deg, #f7f4ed 0%, #eef3ee 100%)",
    padding: "24px 16px",
    fontFamily: "Inter, Arial, sans-serif",
  },
  card: {
    background: "#ffffff",
    borderRadius: "20px",
    padding: "32px 24px",
    width: "100%",
    maxWidth: "460px",
    boxShadow: "0 18px 45px rgba(17, 24, 39, 0.08)",
    border: "1px solid #e7ece6",
  },
  brand: {
    display: "inline-block",
    fontSize: "20px",
    fontWeight: 800,
    color: "#1F4E3D",
    textDecoration: "none",
    marginBottom: "20px",
  },
  heading: {
    fontSize: "28px",
    lineHeight: 1.15,
    fontWeight: 750,
    color: "#0f1720",
    margin: "0 0 8px",
  },
  subheading: {
    fontSize: "15px",
    color: "#5b6571",
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
    color: "#0f1720",
  },
  input: {
    width: "100%",
    minHeight: "50px",
    borderRadius: "12px",
    border: "1.5px solid #cfd8cf",
    padding: "12px 14px",
    fontSize: "16px",
    lineHeight: 1.4,
    outline: "none",
    color: "#0f1720",
    background: "#fff",
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
    color: "#1F4E3D",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
    padding: "8px",
  },
  optional: {
    fontWeight: 500,
    color: "#84909d",
  },
  fieldError: {
    fontSize: "13px",
    color: "#b42318",
    margin: 0,
  },
  errorBanner: {
    background: "#fff3f2",
    border: "1px solid #f4c7c3",
    borderRadius: "12px",
    padding: "12px 14px",
    fontSize: "14px",
    color: "#b42318",
    margin: 0,
  },
  successNote: {
    background: "#effaf3",
    border: "1px solid #b6e0c2",
    borderRadius: "12px",
    padding: "10px 12px",
    color: "#196c2e",
    fontSize: "14px",
  },
  warningNote: {
    background: "#fff8ec",
    border: "1px solid #f3d3a2",
    borderRadius: "12px",
    padding: "10px 12px",
    color: "#8a5b00",
    fontSize: "14px",
  },
  statusCard: {
    border: "1px solid #dde7de",
    borderRadius: "14px",
    padding: "12px 14px",
    background: "#f8faf8",
  },
  statusHeading: {
    fontSize: "13px",
    fontWeight: 700,
    color: "#31423a",
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
    background: "#1f8b4c",
    flexShrink: 0,
  },
  statusDotIdle: {
    width: "10px",
    height: "10px",
    borderRadius: "999px",
    background: "#c4d0c6",
    flexShrink: 0,
  },
  statusTextSuccess: {
    color: "#1f6b3f",
    fontWeight: 600,
  },
  statusTextIdle: {
    color: "#5f6e66",
  },
  submitButton: {
    minHeight: "50px",
    borderRadius: "12px",
    background: "#1F4E3D",
    color: "#ffffff",
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
  footer: {
    textAlign: "center",
    fontSize: "14px",
    color: "#5b6571",
    margin: 0,
  },
  link: {
    color: "#1F4E3D",
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
    background: "#d7ded7",
  },
  dividerText: {
    fontSize: "13px",
    color: "#708078",
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
    border: "1px solid #d1d9d1",
    background: "#fff",
    color: "#0f1720",
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
  appleLogo: {
    fontSize: "13px",
    lineHeight: 1,
    fontWeight: 700,
    letterSpacing: "0.02em",
  },
};
