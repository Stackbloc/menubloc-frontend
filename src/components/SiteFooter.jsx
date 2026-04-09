import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext.jsx";

const FOOTER_LINK_PATH_PREFIXES = ["/operator", "/owner"];
const FOOTER_HIDDEN_PATHS = new Set(["/", "/checkout"]);

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
        borderTop: "1px solid rgba(18,34,28,0.08)",
        background: "#fbfaf6",
        marginTop: 40,
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "18px 24px 22px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 18,
            alignItems: "center",
            fontSize: 13,
            flex: "1 1 560px",
          }}
        >
          <div style={{ fontSize: 13, color: "#667085", fontWeight: 600 }}>
            {t("footer.powered")}
          </div>
          <Link to="/restaurant/signup" style={{ color: "#344054", fontWeight: 700, textDecoration: "none" }}>
            {t("discovery.footer.signup")}
          </Link>
          <Link to="/deals" style={{ color: "#344054", fontWeight: 700, textDecoration: "none" }}>
            {t("discovery.footer.deals")}
          </Link>
          <Link to="/top-picks" style={{ color: "#344054", fontWeight: 700, textDecoration: "none" }}>
            {t("discovery.footer.topPicksNearYou")}
          </Link>
          <Link to="/terms" style={{ color: "#344054", fontWeight: 700, textDecoration: "none" }}>
            {t("discovery.footer.terms")}
          </Link>
          <Link to="/privacy" style={{ color: "#344054", fontWeight: 700, textDecoration: "none" }}>
            Privacy Policy
          </Link>
          <Link to="/about" style={{ color: "#344054", fontWeight: 700, textDecoration: "none" }}>
            About Grubbid
          </Link>
          <Link to="/contact" style={{ color: "#344054", fontWeight: 700, textDecoration: "none" }}>
            {t("discovery.footer.contact")}
          </Link>
        </div>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
            marginLeft: "auto",
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: 0.8,
              textTransform: "uppercase",
              color: "#667085",
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
              border: "1px solid rgba(18,34,28,0.12)",
              background: "#fff",
              color: "#11211a",
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
