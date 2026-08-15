import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { isAppleAuthConfigured } from "../../components/consumer/ConsumerAuthShared.jsx";

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    background: "#f7f4ed",
    fontFamily: "Inter, Arial, sans-serif",
    color: "#0f1720",
    textAlign: "center",
  },
  card: {
    maxWidth: "420px",
    background: "#fff",
    borderRadius: "16px",
    padding: "28px 24px",
    border: "1px solid #e7ece6",
    boxShadow: "0 12px 30px rgba(17, 24, 39, 0.08)",
  },
  heading: {
    fontSize: "22px",
    margin: "0 0 8px",
  },
  text: {
    margin: 0,
    lineHeight: 1.5,
    color: "#5b6571",
    fontSize: "15px",
  },
  link: {
    display: "inline-block",
    marginTop: "16px",
    color: "#0f1720",
    fontWeight: 600,
  },
};

export default function AppleAuthCallback() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const appleReady = isAppleAuthConfigured();

  useEffect(() => {
    if (!appleReady) {
      navigate("/account/login", { replace: true });
    }
  }, [appleReady, navigate]);

  if (!appleReady) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <h1 style={styles.heading}>
            {t("auth.appleUnavailableTitle", "Apple sign-in unavailable")}
          </h1>
          <p style={styles.text}>
            {t(
              "auth.appleUnavailableBody",
              "Apple sign-in is not available. Use email or phone to continue."
            )}
          </p>
          <Link to="/account/login" style={styles.link}>
            {t("auth.backToSignIn", "Back to sign in")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.heading}>Completing Apple sign-in</h1>
        <p style={styles.text}>If this window does not close automatically, return to Menuply.</p>
      </div>
    </div>
  );
}
