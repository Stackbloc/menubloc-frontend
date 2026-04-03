/* ============================================================
   Grubbid Canonical Design System Lock
   Public-page navigation styling must inherit from the canonical
   design system. Do not restyle these controls locally without
   explicit approval from Andre.
   ============================================================ */

import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext.jsx";
import { PillButton } from "./grubbid/GrubbidPrimitives.jsx";
import { useConsumer } from "../context/ConsumerContext.jsx";
import { BrandLogo } from "./BrandLogo.jsx";

export function HomeButton() {
  const { t } = useLanguage();
  return (
    <PillButton as={Link} to="/" tone="secondary">
      {`← ${t("nav.discovery")}`}
    </PillButton>
  );
}

export function BackButton() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  return (
    <PillButton onClick={() => navigate(-1)} tone="secondary">
      {`← ${t("nav.back")}`}
    </PillButton>
  );
}

/**
 * Consumer auth links shown in the site nav.
 * When logged out: Log In + Sign Up
 * When logged in:  Account
 */
function ConsumerNavLinks() {
  const { isAuthenticated, loading } = useConsumer();

  if (loading) return null;

  if (isAuthenticated) {
    return (
      <Link to="/account" style={navLinkStyle}>
        Account
      </Link>
    );
  }

  return (
    <span style={{ display: "flex", gap: "10px", alignItems: "center" }}>
      <Link to="/account/login" style={navLinkStyle}>
        Log In
      </Link>
      <Link to="/account/signup" style={{ ...navLinkStyle, ...navSignupStyle }}>
        Sign Up
      </Link>
    </span>
  );
}

export function PageNav({ back = false }) {
  const { t } = useLanguage();

  return (
    <div className="gb-page-nav">
      <BrandLogo
        width={96}
        height={62}
        radius={16}
        pageColor="#f7f6f1"
        linkStyle={{ flexShrink: 0 }}
        ariaLabel={t("nav.brandAria")}
      />
      <div className="gb-page-nav__actions" style={{ display: "flex", gap: "12px", alignItems: "center" }}>
        <ConsumerNavLinks />
        {back ? <BackButton /> : <HomeButton />}
      </div>
    </div>
  );
}

const navLinkStyle = {
  fontSize: "14px",
  fontWeight: 600,
  color: "#1F4E3D",
  textDecoration: "none",
  padding: "6px 10px",
  borderRadius: "8px",
  transition: "background 0.15s",
};

const navSignupStyle = {
  background: "#1F4E3D",
  color: "#ffffff",
  padding: "6px 14px",
};
