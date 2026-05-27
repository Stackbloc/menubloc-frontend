import React, { useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { BrandLogo } from "../BrandLogo.jsx";
import AppMenuSheet from "../grubbid/AppMenuSheet.jsx";
import { useConsumer } from "../../context/ConsumerContext.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";

const SESSION_LOCATION_KEY = "grubbid.discovery.location";
const SESSION_GEO_KEY = "grubbid.discovery.geo";

function parseSessionLocation(raw) {
  const parts = String(raw || "").split(",");
  return {
    city: parts[0]?.trim() || "",
    state: parts[1]?.trim().toUpperCase() || "",
  };
}

const shellStyle = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16,
  padding: "16px 0 20px",
  borderBottom: "1px solid #1F2937",
  marginBottom: 16,
  background: "#0B0F0C",
};

const leftStyle = {
  display: "flex",
  alignItems: "center",
  gap: 18,
  flexWrap: "wrap",
  minWidth: 0,
  flex: "1 1 420px",
};

const navStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexWrap: "wrap",
};

const navLinkBaseStyle = {
  display: "inline-flex",
  alignItems: "center",
  minHeight: 40,
  padding: "0 14px",
  borderRadius: 999,
  textDecoration: "none",
  fontSize: 14,
  fontWeight: 700,
  color: "#9CA3AF",
};

const authLinkStyle = {
  display: "inline-flex",
  alignItems: "center",
  minHeight: 40,
  padding: "0 14px",
  borderRadius: 999,
  textDecoration: "none",
  fontSize: 14,
  fontWeight: 700,
  color: "#22C55E",
  border: "1px solid rgba(34, 197, 94, 0.25)",
  background: "rgba(34, 197, 94, 0.08)",
};

const searchFormStyle = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  flex: "1 1 320px",
  minWidth: 260,
};

const searchInputStyle = {
  flex: 1,
  minWidth: 0,
  height: 44,
  borderRadius: 999,
  border: "1px solid #1F2937",
  padding: "0 16px",
  fontSize: 15,
  fontWeight: 500,
  color: "#F9FAFB",
  background: "#121A14",
};

const searchButtonStyle = {
  height: 44,
  padding: "0 18px",
  border: "none",
  borderRadius: 999,
  background: "linear-gradient(180deg, #22C55E 0%, #16A34A 100%)",
  color: "#0B0F0C",
  fontSize: 14,
  fontWeight: 800,
  cursor: "pointer",
};

function buildNavLinkStyle(isActive) {
  return {
    ...navLinkBaseStyle,
    color: isActive ? "#22C55E" : "#9CA3AF",
    background: isActive ? "rgba(34, 197, 94, 0.1)" : "transparent",
  };
}

export default function GlobalHeader() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, loading, profile, consumer } = useConsumer();
  const isAccountPage = location.pathname.startsWith("/account");
  const params = new URLSearchParams(location.search || "");
  const [query, setQuery] = useState(params.get("q") || "");
  const [appMenuOpen, setAppMenuOpen] = useState(false);
  const showDealsNav = location.pathname !== "/deals";

  const profileLabel =
    profile?.display_name ||
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
    consumer?.email ||
    t("global.profile", "Profile");

  function handleSubmit(event) {
    event.preventDefault();
    const nextParams = new URLSearchParams(location.search || "");
    const trimmed = query.trim();

    if (trimmed) nextParams.set("q", trimmed);
    else nextParams.delete("q");

    // URL has no location context → read from session storage
    if (!nextParams.has("city") && !nextParams.has("lat") && typeof window !== "undefined") {
      try {
        const label = String(window.sessionStorage.getItem(SESSION_LOCATION_KEY) || "").trim();
        if (label) {
          const loc = parseSessionLocation(label);
          if (loc.city) nextParams.set("city", loc.city);
          if (loc.state) nextParams.set("state", loc.state);
        }
        const rawGeo = window.sessionStorage.getItem(SESSION_GEO_KEY);
        if (rawGeo) {
          const geo = JSON.parse(rawGeo);
          if (Number.isFinite(geo?.lat) && Number.isFinite(geo?.lng)) {
            nextParams.set("lat", String(geo.lat));
            nextParams.set("lng", String(geo.lng));
            if (!nextParams.has("radius_miles")) nextParams.set("radius_miles", "8");
          }
        }
      } catch {}
    }

    navigate({
      pathname: "/search",
      search: nextParams.toString() ? `?${nextParams.toString()}` : "",
    });
  }

  return (
    <>
      <AppMenuSheet open={appMenuOpen} onClose={() => setAppMenuOpen(false)} />
      <header style={shellStyle}>
        <div style={leftStyle}>
          <button
            type="button"
            onClick={() => setAppMenuOpen(true)}
            aria-label={t("global.openMenu", "Open menu")}
            style={{
              border: "none",
              background: "transparent",
              fontSize: 22,
              color: "#9CA3AF",
              cursor: "pointer",
              padding: 4,
              lineHeight: 1,
              flexShrink: 0,
            }}
          >
            ☰
          </button>

          <Link to="/" aria-label={t("global.goHome", "Go to home")} style={{ display: "inline-flex", textDecoration: "none" }}>
            <BrandLogo width={136} height={58} radius={16} pageColor="#0B0F0C" />
          </Link>

          {showDealsNav ? (
            <nav aria-label={t("global.primaryNav", "Primary")} style={navStyle}>
              <NavLink to="/deals" style={({ isActive }) => buildNavLinkStyle(isActive)}>
                {t("global.deals", "Deals")}
              </NavLink>
            </nav>
          ) : null}
        </div>

        <form onSubmit={handleSubmit} role="search" style={searchFormStyle}>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t(
              "global.searchPlaceholder",
              "Search dishes, ingredients, cuisines, or restaurants..."
            )}
            aria-label={t(
              "global.searchAria",
              "Search dishes, ingredients, cuisines, or restaurants"
            )}
            style={searchInputStyle}
          />
          <button type="submit" style={searchButtonStyle}>
            {t("common.search", "Search")}
          </button>
        </form>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {!loading ? (
            isAuthenticated ? (
              <Link to="/account" style={authLinkStyle}>
                {isAccountPage ? profileLabel : t("global.account", "Account")}
              </Link>
            ) : (
              <Link to="/account/login" style={authLinkStyle}>
                {t("global.signIn", "Sign in")}
              </Link>
            )
          ) : null}
        </div>
      </header>
    </>
  );
}
