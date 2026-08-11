// Path: menubloc-frontend/src/components/SiteFooter.jsx
// Date: 2026-07-04
// Purpose: Public site footer navigation — primary gateway for new business activity.
// Guardrail: docs/guardrails/2026-08-10_site-footer-protection-contract.md
// Never remove/blank this footer on public pages (incl. home) without explicit confirmation.

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext.jsx";

const FOOTER_LINK_PATH_PREFIXES = ["/operator", "/owner"];
const FOOTER_HIDDEN_PATHS = new Set(["/checkout"]);

function isPublicPath(pathname) {
  const path = String(pathname || "");
  return !FOOTER_LINK_PATH_PREFIXES.some((prefix) => path.startsWith(prefix));
}

const footerLinkStyle = {
  color: "#6B7280",
  fontWeight: 700,
  textDecoration: "none",
};

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
          <Link to="/diner/signup" style={footerLinkStyle}>
            Diners
          </Link>

          <Link to="/restaurant/onboarding" style={footerLinkStyle}>
            {t("discovery.footer.restaurants", "Restaurants")}
          </Link>

          <Link to="/clusters" style={footerLinkStyle}>
            {t("discovery.footer.clusters", "Clusters")}
          </Link>

          {/* /distributors stays routed for invite-only direct links — no public footer entry */}

          <Link to="/terms" style={footerLinkStyle}>
            {t("discovery.footer.terms", "Terms of Use")}
          </Link>

          <Link to="/privacy" style={footerLinkStyle}>
            {t("footer.privacy", "Privacy Policy")}
          </Link>

          <Link to="/about" style={footerLinkStyle}>
            {t("footer.about", "About Menuply")}
          </Link>

          <Link to="/contact" style={footerLinkStyle}>
            {t("discovery.footer.contact", "Contact Us")}
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
            aria-label={t("footer.language", "Language")}
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
            <option value="en">{t("language.english", "English")}</option>
            <option value="es">{t("language.spanish", "Spanish")}</option>
            <option value="zh">{t("language.chinese", "Chinese")}</option>
          </select>
        </div>
      </div>
    </footer>
  );
}
