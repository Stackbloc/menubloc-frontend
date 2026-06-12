import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext.jsx";

const FOOTER_LINK_PATH_PREFIXES = ["/operator", "/owner"];
const FOOTER_HIDDEN_PATHS = new Set(["/checkout"]);

function isPublicPath(pathname) {
  const path = String(pathname || "");
  return !FOOTER_LINK_PATH_PREFIXES.some((prefix) => path.startsWith(prefix));
}

export default function SiteFooter() {
  const location = useLocation();
  const { language, setLanguage, t } = useLanguage();

  if (!isPublicPath(location.pathname)) return null;
  if (FOOTER_HIDDEN_PATHS.has(location.pathname)) return null;

  return (
    <footer
      style={{
        borderTop: "1px solid var(--gb-color-border)",
        background: "var(--gb-color-page)",
        marginTop: 40,
      }}
    >
      <div
        style={{
          maxWidth: 1450,
          margin: "0 auto",
          padding: "18px 20px calc(var(--bottom-nav-h, 72px) + 8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "nowrap",
          boxSizing: "border-box",
          overflowX: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "nowrap",
            gap: 18,
            alignItems: "center",
            fontSize: 13,
            paddingLeft: 0,
            whiteSpace: "nowrap",
            flex: "0 0 auto",
          }}
        >
          <Link to="/restaurant/onboarding" style={{ color: "var(--gb-color-ink-muted)", fontWeight: 700, textDecoration: "none" }}>
            {t("discovery.footer.signup")}
          </Link>
          <Link to="/operator/login" style={{ color: "var(--gb-color-ink-muted)", fontWeight: 700, textDecoration: "none" }}>
            {t("discovery.footer.signin")}
          </Link>
          <Link to="/terms" style={{ color: "var(--gb-color-ink-muted)", fontWeight: 700, textDecoration: "none" }}>
            {t("discovery.footer.terms")}
          </Link>
          <Link to="/privacy" style={{ color: "var(--gb-color-ink-muted)", fontWeight: 700, textDecoration: "none" }}>
            {t("footer.privacy", "Privacy Policy")}
          </Link>
          <Link to="/about" style={{ color: "var(--gb-color-ink-muted)", fontWeight: 700, textDecoration: "none" }}>
            {t("footer.about", "About Menuply")}
          </Link>
          <Link to="/contact" style={{ color: "var(--gb-color-ink-muted)", fontWeight: 700, textDecoration: "none" }}>
            {t("discovery.footer.contact")}
          </Link>
        </div>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "nowrap",
            marginLeft: "auto",
            flex: "0 0 auto",
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: 0.8,
              textTransform: "uppercase",
              color: "#6B7280",
            }}
            aria-hidden="true"
          >
            🌐
          </span>
          <select
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
            aria-label={t("footer.language")}
            style={{
              height: 34,
              borderRadius: 10,
              border: "1px solid var(--gb-color-border)",
              background: "var(--gb-color-surface-strong)",
              color: "var(--gb-color-ink)",
              padding: "0 10px",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            <option value="en">{t("language.english")}</option>
            <option value="es">{t("language.spanish")}</option>
            <option value="zh">{t("language.chinese")}</option>
          </select>
        </div>
      </div>
    </footer>
  );
}
