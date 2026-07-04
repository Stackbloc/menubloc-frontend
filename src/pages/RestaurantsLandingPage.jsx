import React from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext.jsx";
import { PageHero, PageShell } from "../components/grubbid/GrubbidPrimitives.jsx";
import { BrandLogo } from "../components/BrandLogo.jsx";
import BottomNav from "../components/BottomNav.jsx";

const CREATE_ACCOUNT_ROUTE = "/restaurant/onboarding";
const SIGN_IN_ROUTE = "/operator/login";

const actionLinkStyle = {
  display: "block",
  textAlign: "center",
  textDecoration: "none",
  borderRadius: 12,
  padding: "14px 20px",
  fontSize: 15,
  fontWeight: 800,
};

export default function RestaurantsLandingPage() {
  const { t } = useLanguage();

  return (
    <>
      <PageShell width="reading">
        <div style={{ marginBottom: 16 }}>
          <BrandLogo height={36} radius={8} matchPageBackground={false} />
        </div>

        <PageHero
          title={t("restaurants.landing.title", "Restaurants")}
          description={t(
            "restaurants.landing.description",
            "Create a Menuply restaurant account or sign in to manage your menu."
          )}
        />

        <div
          style={{
            display: "grid",
            gap: 12,
            maxWidth: 420,
            marginTop: 8,
          }}
        >
          <Link
            to={CREATE_ACCOUNT_ROUTE}
            style={{
              ...actionLinkStyle,
              background: "#1d4ed8",
              color: "#fff",
            }}
          >
            {t("restaurants.landing.createAccount", "Create Restaurant Account")}
          </Link>
          <Link
            to={SIGN_IN_ROUTE}
            style={{
              ...actionLinkStyle,
              background: "#fff",
              color: "#1d4ed8",
              border: "2px solid #1d4ed8",
            }}
          >
            {t("restaurants.landing.signIn", "Restaurant Sign In")}
          </Link>
        </div>
      </PageShell>
      <BottomNav />
    </>
  );
}
