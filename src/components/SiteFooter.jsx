// Path: menubloc-frontend/src/components/SiteFooter.jsx
// Date: 2026-08-18
// Purpose: Public site footer sitemap — primary gateway for new business activity.
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
  display: "inline-block",
  margin: "0 0 8px",
};

const groupTitleStyle = {
  fontSize: 11,
  fontWeight: 900,
  letterSpacing: 0.8,
  textTransform: "uppercase",
  color: "#9CA3AF",
  margin: "0 0 10px",
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
          padding: "22px 20px calc(var(--bottom-nav-h, 72px) + 8px)",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 24,
          flexWrap: "wrap",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 28,
            alignItems: "flex-start",
            fontSize: 13,
            flex: "1 1 720px",
          }}
        >
          <div>
            <div style={groupTitleStyle}>Discover</div>
            <Link to="/search" style={footerLinkStyle}>Search</Link><br />
            <Link to="/restaurants" style={footerLinkStyle}>
              {t("discovery.footer.restaurants", "Restaurants")}
            </Link><br />
            <Link to="/browse-menus" style={footerLinkStyle}>Menus</Link><br />
            <Link to="/search" style={footerLinkStyle}>Dishes</Link><br />
            <Link to="/deals" style={footerLinkStyle}>Deals</Link><br />
            <Link to="/clusters" style={footerLinkStyle}>
              {t("discovery.footer.clusters", "Clusters")}
            </Link><br />
            <Link to="/clusters" style={footerLinkStyle}>Events</Link><br />
            <Link to="/waiter" style={footerLinkStyle}>Waiter</Link>
          </div>

          <div>
            <div style={groupTitleStyle}>Diners</div>
            <Link to="/diner/signup" style={footerLinkStyle}>Diners</Link><br />
            <Link to="/my-menuply" style={footerLinkStyle}>My Menuply</Link><br />
            <Link to="/activity" style={footerLinkStyle}>Activity</Link><br />
            <Link to="/account/dining-crews" style={footerLinkStyle}>Dining Crews</Link><br />
            <Link to="/account/what-we-doing" style={footerLinkStyle}>Eating Plans</Link><br />
            <Link to="/clusters" style={footerLinkStyle}>What People Are Eating</Link>
          </div>

          <div>
            <div style={groupTitleStyle}>For Businesses</div>
            <Link to="/restaurant/onboarding" style={footerLinkStyle}>
              {t("discovery.footer.restaurants", "Restaurants")}
            </Link><br />
            <Link to="/join" style={footerLinkStyle}>Venues</Link><br />
            <Link to="/restaurant/onboarding" style={footerLinkStyle}>Owner tools</Link>
          </div>

          <div>
            <div style={groupTitleStyle}>Menuply</div>
            <Link to="/about" style={footerLinkStyle}>
              {t("footer.about", "About Menuply")}
            </Link><br />
            <Link to="/contact" style={footerLinkStyle}>
              {t("discovery.footer.contact", "Contact Us")}
            </Link><br />
            <Link to="/terms" style={footerLinkStyle}>
              {t("discovery.footer.terms", "Terms of Use")}
            </Link><br />
            <Link to="/privacy" style={footerLinkStyle}>
              {t("footer.privacy", "Privacy Policy")}
            </Link>
          </div>
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
